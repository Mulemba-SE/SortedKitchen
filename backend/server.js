const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

const {
  MONGODB_URI,
  MONGODB_CONNECTION_STRING,
  JWT_SECRET,
  DB_ADMIN_EMAIL,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  EMAIL_USER,
  EMAIL_APP_PASSWORD
} = process.env;

if (!JWT_SECRET) {
  console.warn('JWT_SECRET is not set. Please configure it in your environment.');
}

if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
  });
}

// Connect to MongoDB
mongoose.connect(MONGODB_URI || MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017/chef_booking')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

mongoose.connection.on('error', (err) => {
  console.error('MongoDB runtime error:', err);
});

// Define Schema
const bookingSchema = new mongoose.Schema({
  name: String,
  email: String,
  date: String,
  time: String,
  guests: Number,
  occasion: String,
  createdAt: { type: Date, default: Date.now }
});

const Booking = mongoose.model('Booking', bookingSchema);

// Activity Schema
const activitySchema = new mongoose.Schema({
  action: String,
  details: String,
  timestamp: { type: Date, default: Date.now }
});
const Activity = mongoose.model('Activity', activitySchema);

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: 'admin' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

userSchema.pre('save', function normalizeAndTimestamp(next) {
  if (this.email) {
    this.email = String(this.email).trim().toLowerCase();
  }
  this.updatedAt = new Date();
  next();
});

const User = mongoose.model('User', userSchema);

// Meals Schema
const mealSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, default: 0 },
  imageUrl: { type: String, default: '' },
  socialUrl: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

mealSchema.pre('save', function updateTimestamp(next) {
  this.updatedAt = new Date();
  next();
});

const Meal = mongoose.model('Meal', mealSchema);

// Bio Schema (single document)
const bioSchema = new mongoose.Schema({
  content: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now }
});

const Bio = mongoose.model('Bio', bioSchema);

// Configure Email Transporter
// NOTE: For Gmail, you need to use an "App Password" if 2FA is enabled.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER || 'your-email@gmail.com',
    pass: EMAIL_APP_PASSWORD || 'your-app-password'
  }
});

const upload = multer({ storage: multer.memoryStorage() });
const RESERVED_ADMIN_EMAIL = String(DB_ADMIN_EMAIL || 'mulembaevans37@gmail.com').trim().toLowerCase();

const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  return next();
};

app.post('/api/auth/signup', async (req, res) => {
  try {
    if (!JWT_SECRET) {
      return res.status(500).json({ error: 'JWT secret not configured' });
    }

    const { name = '', email, password } = req.body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedName = String(name || '').trim();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ error: 'Account already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    // Reserve admin role for the configured admin email only.
    const role = normalizedEmail === RESERVED_ADMIN_EMAIL ? 'admin' : 'user';

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      passwordHash,
      role
    });

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ error: 'Account already exists' });
    }
    console.error('Signup failed:', err);
    return res.status(500).json({ error: 'Signup failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    if (!JWT_SECRET) {
      return res.status(500).json({ error: 'JWT secret not configured' });
    }
    const { email, password } = req.body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (user) {
      const isValidUserPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidUserPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (user.email === RESERVED_ADMIN_EMAIL && user.role !== 'admin') {
        user.role = 'admin';
        user.updatedAt = new Date();
        await user.save();
      }

      const token = jwt.sign(
        { userId: user._id.toString(), email: user.email, role: user.role || 'admin' },
        JWT_SECRET,
        { expiresIn: '8h' }
      );
      return res.json({
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role || 'admin' }
      });
    }

    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (err) {
    console.error('Login failed:', err);
    return res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/book', requireAuth, async (req, res) => {
  try {
    const newBooking = new Booking(req.body);
    await newBooking.save();
    console.log('Received booking:', req.body);

    // Log Activity
    await new Activity({ action: 'New Booking', details: `${req.body.name} booked for ${req.body.guests} guests` }).save();

    // Send Confirmation Email
    const mailOptions = {
      from: EMAIL_USER || 'your-email@gmail.com',
      to: req.body.email,
      subject: 'Booking Confirmation - Chef Booking',
      text: `Hello ${req.body.name},\n\nYour booking for ${req.body.guests} guests on ${req.body.date} at ${req.body.time} has been confirmed.\n\nWe look forward to hosting you!\n\nBest regards,\nThe Chef`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) console.log('Error sending email:', error);
      else console.log('Email sent:', info.response);
    });

    res.status(200).json({ message: 'Booking received successfully!' });
  } catch (err) {
    console.error('Booking create error:', err);
    res.status(500).json({ error: 'Failed to save booking' });
  }
});

app.get('/api/bookings', requireAuth, requireAdmin, async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    console.error('Fetch bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

app.delete('/api/bookings/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    await new Activity({ action: 'Booking Deleted', details: `Booking ID ${req.params.id} was removed` }).save();
    res.status(200).json({ message: 'Booking deleted successfully' });
  } catch (err) {
    console.error('Delete booking error:', err);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

app.put('/api/bookings/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const updatedBooking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await new Activity({ action: 'Booking Updated', details: `Booking for ${req.body.name} was updated` }).save();
    res.json(updatedBooking);
  } catch (err) {
    console.error('Update booking error:', err);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

app.get('/api/activity', requireAuth, requireAdmin, async (req, res) => {
  try {
    const activities = await Activity.find().sort({ timestamp: -1 }).limit(10);
    res.json(activities);
  } catch (err) {
    console.error('Fetch activity error:', err);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// Meals
app.get('/api/meals', async (req, res) => {
  try {
    const meals = await Meal.find().sort({ createdAt: -1 });
    res.json(meals);
  } catch (err) {
    console.error('Fetch meals error:', err);
    res.status(500).json({ error: 'Failed to fetch meals' });
  }
});

app.post('/api/meals', requireAuth, requireAdmin, async (req, res) => {
  try {
    const meal = new Meal(req.body);
    await meal.save();
    res.status(201).json(meal);
  } catch (err) {
    console.error('Create meal error:', err);
    res.status(400).json({ error: 'Failed to create meal' });
  }
});

app.put('/api/meals/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const updated = await Meal.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    console.error('Update meal error:', err);
    res.status(400).json({ error: 'Failed to update meal' });
  }
});

app.delete('/api/meals/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await Meal.findByIdAndDelete(req.params.id);
    res.json({ message: 'Meal deleted' });
  } catch (err) {
    console.error('Delete meal error:', err);
    res.status(400).json({ error: 'Failed to delete meal' });
  }
});

const getSocialProvider = (url) => {
  const lower = String(url || '').toLowerCase();
  if (lower.includes('tiktok.com')) return 'tiktok';
  if (lower.includes('instagram.com')) return 'instagram';
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
  return '';
};

const getYouTubeId = (url) => {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.replace('/', '').trim();
    }
    if (parsed.searchParams.has('v')) {
      return parsed.searchParams.get('v');
    }
    const parts = parsed.pathname.split('/');
    const embedIndex = parts.findIndex((part) => part === 'embed');
    if (embedIndex !== -1 && parts[embedIndex + 1]) {
      return parts[embedIndex + 1];
    }
    return '';
  } catch {
    return '';
  }
};

const fetchJson = async (url) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
};

app.get('/api/social-preview', async (req, res) => {
  try {
    const { url } = req.query || {};
    if (!url) {
      return res.status(400).json({ error: 'Missing url parameter' });
    }

    const provider = getSocialProvider(url);
    if (!provider) {
      return res.status(400).json({ error: 'Unsupported social provider' });
    }

    if (provider === 'youtube') {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      try {
        const data = await fetchJson(oembedUrl);
        return res.json({
          title: data.title || '',
          thumbnail_url: data.thumbnail_url || '',
          provider_name: data.provider_name || 'YouTube'
        });
      } catch (err) {
        const videoId = getYouTubeId(url);
        return res.json({
          title: '',
          thumbnail_url: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '',
          provider_name: 'YouTube'
        });
      }
    }

    if (provider === 'tiktok') {
      const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
      const data = await fetchJson(oembedUrl);
      return res.json({
        title: data.title || '',
        thumbnail_url: data.thumbnail_url || '',
        provider_name: data.provider_name || 'TikTok'
      });
    }

    if (provider === 'instagram') {
      const token = process.env.INSTAGRAM_OEMBED_TOKEN || process.env.FACEBOOK_APP_TOKEN;
      const oembedUrl = token
        ? `https://graph.facebook.com/v20.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=${encodeURIComponent(token)}`
        : `https://api.instagram.com/oembed?url=${encodeURIComponent(url)}`;
      const data = await fetchJson(oembedUrl);
      return res.json({
        title: data.title || '',
        thumbnail_url: data.thumbnail_url || '',
        provider_name: data.provider_name || 'Instagram'
      });
    }

    return res.status(400).json({ error: 'Unsupported social provider' });
  } catch (err) {
    console.error('Social preview error:', err);
    return res.status(500).json({ error: 'Failed to fetch social preview' });
  }
});

// Bio
app.get('/api/bio', async (req, res) => {
  try {
    const bio = await Bio.findOne();
    res.json(bio || { content: '' });
  } catch (err) {
    console.error('Fetch bio error:', err);
    res.status(500).json({ error: 'Failed to fetch bio' });
  }
});

app.put('/api/bio', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { content } = req.body || {};
    const bio = await Bio.findOne();
    if (bio) {
      bio.content = content || '';
      bio.updatedAt = new Date();
      await bio.save();
      return res.json(bio);
    }
    const created = await Bio.create({ content: content || '' });
    return res.status(201).json(created);
  } catch (err) {
    console.error('Update bio error:', err);
    return res.status(400).json({ error: 'Failed to update bio' });
  }
});

// Cloudinary Upload
app.post('/api/upload', requireAuth, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      return res.status(500).json({ error: 'Cloudinary is not configured' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'chef-booking', resource_type: 'image' },
        (error, result) => {
          if (error) return reject(error);
          return resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    return res.json({ url: uploadResult.secure_url, publicId: uploadResult.public_id });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Image upload failed' });
  }
});

app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
