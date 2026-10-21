const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const app = express();
const PORT = process.env.PORT || 5000;

const {
  MONGODB_URI,
  MONGODB_CONNECTION_STRING,
  JWT_SECRET,
  DB_ADMIN_EMAIL,
  ADMIN_EMAIL,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
  FRONTEND_URL,
  CORS_ORIGINS,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  EMAIL_USER,
  EMAIL_APP_PASSWORD
} = process.env;

const parseOriginList = (value) => String(value || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

const allowedOrigins = new Set([
  ...parseOriginList(CORS_ORIGINS),
  ...parseOriginList(FRONTEND_URL),
  'http://localhost:5173',
  'http://127.0.0.1:5173'
]);

if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.add('http://192.168.100.67:5173');
}

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin.replace(/\/$/, ''))) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '2mb' }));

if (!JWT_SECRET) {
  console.warn('JWT_SECRET is not set. Please configure it in your environment.');
}
if (!DB_ADMIN_EMAIL && !ADMIN_EMAIL) {
  console.warn('DB_ADMIN_EMAIL or ADMIN_EMAIL is not set. Using default reserved admin email.');
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
  phone: String,
  date: String,
  time: String,
  guests: Number,
  occasion: String,
  eventAddress: String,
  referralSource: String,
  eventDetails: String,
  status: { type: String, enum: ['pending', 'approved'], default: 'pending' },
  approvedAt: Date,
  approvalEmailSentAt: Date,
  approvedBy: String,
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
  passwordHash: { type: String, default: '' },
  authProvider: { type: String, default: 'local' },
  googleId: { type: String, default: '' },
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
  title: { type: String, default: '' },
  category: { type: String, default: '' },
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

const reviewSchema = new mongoose.Schema({
  author: { type: String, required: true, trim: true, maxlength: 120 },
  role: { type: String, default: '', trim: true, maxlength: 120 },
  text: { type: String, required: true, trim: true, maxlength: 2000 },
  rating: { type: Number, min: 1, max: 5, default: 5 },
  published: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

reviewSchema.pre('save', function updateReviewTimestamp(next) {
  this.updatedAt = new Date();
  next();
});

const Review = mongoose.model('Review', reviewSchema);

const buildSocialMealTitle = (socialUrl) => {
  const lower = String(socialUrl || '').toLowerCase();
  if (lower.includes('tiktok.com')) return 'TikTok Video';
  if (lower.includes('instagram.com')) return 'Instagram Video';
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'YouTube Video';
  return 'Social Video';
};

const normalizeMealCategory = (value) => {
  const normalized = String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (!normalized) return '';
  if (normalized === 'lunk') return 'lunch';
  return normalized;
};

const normalizeMealPayload = (input = {}) => {
  const normalized = {
    title: String(input.title || '').trim(),
    category: normalizeMealCategory(input.category),
    description: String(input.description || '').trim(),
    imageUrl: String(input.imageUrl || '').trim(),
    socialUrl: String(input.socialUrl || '').trim(),
    price: Number.isFinite(Number(input.price)) ? Number(input.price) : 0
  };

  if (!normalized.title && normalized.socialUrl) {
    normalized.title = buildSocialMealTitle(normalized.socialUrl);
  }

  return normalized;
};

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

const fetchSocialPreview = async (url) => {
  const provider = getSocialProvider(url);
  if (!provider) return null;

  if (provider === 'youtube') {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    try {
      const data = await fetchJson(oembedUrl);
      return {
        title: data.title || '',
        thumbnail_url: data.thumbnail_url || '',
        provider_name: data.provider_name || 'YouTube'
      };
    } catch {
      const videoId = getYouTubeId(url);
      return {
        title: '',
        thumbnail_url: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '',
        provider_name: 'YouTube'
      };
    }
  }

  if (provider === 'tiktok') {
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    const data = await fetchJson(oembedUrl);
    return {
      title: data.title || '',
      thumbnail_url: data.thumbnail_url || '',
      provider_name: data.provider_name || 'TikTok'
    };
  }

  if (provider === 'instagram') {
    const token = process.env.INSTAGRAM_OEMBED_TOKEN || process.env.FACEBOOK_APP_TOKEN;
    const oembedUrl = token
      ? `https://graph.facebook.com/v20.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=${encodeURIComponent(token)}`
      : `https://api.instagram.com/oembed?url=${encodeURIComponent(url)}`;
    const data = await fetchJson(oembedUrl);
    return {
      title: data.title || '',
      thumbnail_url: data.thumbnail_url || '',
      provider_name: data.provider_name || 'Instagram'
    };
  }

  return null;
};

const enrichMealWithSocialThumbnail = async (mealPayload) => {
  if (!mealPayload || mealPayload.imageUrl || !mealPayload.socialUrl) {
    return mealPayload;
  }

  const provider = getSocialProvider(mealPayload.socialUrl);
  if (!provider) {
    return mealPayload;
  }

  try {
    const preview = await fetchSocialPreview(mealPayload.socialUrl);
    if (preview?.thumbnail_url && !mealPayload.imageUrl) {
      mealPayload.imageUrl = preview.thumbnail_url;
    }
  } catch (err) {
    console.warn('Social thumbnail fetch failed:', err?.message || err);
  }

  return mealPayload;
};

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

const formatBookingDateTime = (booking) => {
  const date = booking?.date ? String(booking.date) : 'your selected date';
  const time = booking?.time ? String(booking.time) : 'your selected time';
  return `${date} at ${time}`;
};

const sendBookingApprovalEmail = async (booking) => {
  if (!booking?.email) {
    throw new Error('Booking email is missing');
  }

  const subject = 'Your Sorted Kitchen booking is approved';
  const text = [
    `Hello ${booking.name || 'there'},`,
    '',
    `Great news: your booking request for ${booking.guests || 'your'} guests on ${formatBookingDateTime(booking)} has been approved.`,
    booking.occasion ? `Occasion: ${booking.occasion}` : '',
    booking.eventAddress ? `Event address: ${booking.eventAddress}` : '',
    '',
    'We look forward to serving you.',
    '',
    'Best regards,',
    'Sorted Kitchen'
  ].filter(Boolean).join('\n');

  return transporter.sendMail({
    from: EMAIL_USER || 'your-email@gmail.com',
    to: booking.email,
    subject,
    text
  });
};

const upload = multer({ storage: multer.memoryStorage() });
const RESERVED_ADMIN_EMAIL = String(DB_ADMIN_EMAIL || ADMIN_EMAIL || 'mulembaevans37@gmail.com').trim().toLowerCase();
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;
const googleRedirectUri = GOOGLE_REDIRECT_URI || `http://localhost:${PORT}/api/auth/google/callback`;
const googleOAuthClient = GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET
  ? new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, googleRedirectUri)
  : null;
const frontendUrl = String(FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

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

const ensureDatabaseReady = (res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database unavailable. Check MongoDB connection.' });
  }
  return null;
};

const buildAuthResponse = (user) => {
  const token = jwt.sign(
    { userId: user._id.toString(), email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  return {
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  };
};

app.post('/api/auth/signup', async (req, res) => {
  try {
    if (!JWT_SECRET) {
      return res.status(500).json({ error: 'JWT secret not configured' });
    }
    const dbUnavailable = ensureDatabaseReady(res);
    if (dbUnavailable) {
      return dbUnavailable;
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
      authProvider: 'local',
      role
    });

    return res.status(201).json(buildAuthResponse(user));
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
    const dbUnavailable = ensureDatabaseReady(res);
    if (dbUnavailable) {
      return dbUnavailable;
    }
    const { email, password } = req.body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (user) {
      if (!user.passwordHash) {
        return res.status(401).json({ error: 'Use Google sign-in for this account' });
      }

      const isValidUserPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidUserPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (user.email === RESERVED_ADMIN_EMAIL && user.role !== 'admin') {
        user.role = 'admin';
        user.updatedAt = new Date();
        await user.save();
      }

      return res.json(buildAuthResponse(user));
    }

    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (err) {
    console.error('Login failed:', err);
    return res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/google', async (req, res) => {
  try {
    if (!JWT_SECRET) {
      return res.status(500).json({ error: 'JWT secret not configured' });
    }
    if (!googleClient || !GOOGLE_CLIENT_ID) {
      return res.status(500).json({ error: 'Google sign-in is not configured' });
    }
    const dbUnavailable = ensureDatabaseReady(res);
    if (dbUnavailable) {
      return dbUnavailable;
    }

    const { credential } = req.body || {};
    if (!credential) {
      return res.status(400).json({ error: 'Missing Google credential' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const normalizedEmail = String(payload?.email || '').trim().toLowerCase();
    const googleId = String(payload?.sub || '').trim();
    const normalizedName = String(payload?.name || '').trim();

    if (!normalizedEmail || !googleId) {
      return res.status(401).json({ error: 'Invalid Google credential' });
    }
    if (payload.email_verified === false) {
      return res.status(401).json({ error: 'Google email is not verified' });
    }

    let user = await User.findOne({ email: normalizedEmail });
    const role = normalizedEmail === RESERVED_ADMIN_EMAIL ? 'admin' : 'user';

    if (!user) {
      user = await User.create({
        name: normalizedName,
        email: normalizedEmail,
        passwordHash: '',
        authProvider: 'google',
        googleId,
        role
      });
    } else {
      user.name = user.name || normalizedName;
      user.authProvider = user.authProvider === 'local' && user.passwordHash ? 'local' : 'google';
      user.googleId = user.googleId || googleId;
      if (user.email === RESERVED_ADMIN_EMAIL && user.role !== 'admin') {
        user.role = 'admin';
      }
      user.updatedAt = new Date();
      await user.save();
    }

    return res.json(buildAuthResponse(user));
  } catch (err) {
    console.error('Google auth failed:', err);
    return res.status(401).json({ error: 'Google sign-in failed' });
  }
});

const findOrCreateGoogleUser = async ({ email, googleId, name }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedGoogleId = String(googleId || '').trim();
  const normalizedName = String(name || '').trim();

  if (!normalizedEmail || !normalizedGoogleId) {
    throw new Error('Invalid Google profile');
  }

  let user = await User.findOne({ email: normalizedEmail });
  const role = normalizedEmail === RESERVED_ADMIN_EMAIL ? 'admin' : 'user';

  if (!user) {
    user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      passwordHash: '',
      authProvider: 'google',
      googleId: normalizedGoogleId,
      role
    });
    return user;
  }

  user.name = user.name || normalizedName;
  user.authProvider = user.authProvider === 'local' && user.passwordHash ? 'local' : 'google';
  user.googleId = user.googleId || normalizedGoogleId;
  if (user.email === RESERVED_ADMIN_EMAIL && user.role !== 'admin') {
    user.role = 'admin';
  }
  user.updatedAt = new Date();
  await user.save();
  return user;
};

app.get('/api/auth/google/start', (req, res) => {
  if (!googleOAuthClient || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.status(500).send('Google OAuth redirect is not configured');
  }

  const url = googleOAuthClient.generateAuthUrl({
    access_type: 'online',
    prompt: 'select_account',
    scope: ['openid', 'email', 'profile']
  });

  return res.redirect(url);
});

app.get('/api/auth/google/callback', async (req, res) => {
  try {
    if (!JWT_SECRET) {
      return res.redirect(`${frontendUrl}/auth/google/callback?error=${encodeURIComponent('JWT secret not configured')}`);
    }
    if (!googleOAuthClient || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return res.redirect(`${frontendUrl}/auth/google/callback?error=${encodeURIComponent('Google OAuth is not configured')}`);
    }
    const dbUnavailable = ensureDatabaseReady(res);
    if (dbUnavailable) {
      return dbUnavailable;
    }

    const { code } = req.query || {};
    if (!code) {
      return res.redirect(`${frontendUrl}/auth/google/callback?error=${encodeURIComponent('Missing Google authorization code')}`);
    }

    const { tokens } = await googleOAuthClient.getToken(String(code));
    if (!tokens.id_token) {
      return res.redirect(`${frontendUrl}/auth/google/callback?error=${encodeURIComponent('Google did not return an ID token')}`);
    }

    const ticket = await googleOAuthClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    if (payload?.email_verified === false) {
      return res.redirect(`${frontendUrl}/auth/google/callback?error=${encodeURIComponent('Google email is not verified')}`);
    }

    const user = await findOrCreateGoogleUser({
      email: payload?.email,
      googleId: payload?.sub,
      name: payload?.name
    });
    const { token } = buildAuthResponse(user);

    return res.redirect(`${frontendUrl}/auth/google/callback?token=${encodeURIComponent(token)}`);
  } catch (err) {
    console.error('Google OAuth callback failed:', err);
    return res.redirect(`${frontendUrl}/auth/google/callback?error=${encodeURIComponent('Google sign-in failed')}`);
  }
});

app.post('/api/book', requireAuth, async (req, res) => {
  try {
    const newBooking = new Booking({
      ...req.body,
      status: 'pending',
      approvedAt: undefined,
      approvalEmailSentAt: undefined,
      approvedBy: ''
    });
    await newBooking.save();
    console.log('Received booking:', req.body);

    // Log Activity
    await new Activity({ action: 'New Booking', details: `${req.body.name} requested a booking for ${req.body.guests} guests` }).save();

    res.status(200).json({ message: 'Booking request received successfully!', booking: newBooking });
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

app.post('/api/bookings/:id/approve', requireAuth, requireAdmin, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status === 'approved' && booking.approvalEmailSentAt) {
      return res.json({
        message: 'Booking was already approved and the client has already been notified.',
        booking
      });
    }

    booking.status = 'approved';
    booking.approvedAt = booking.approvedAt || new Date();
    booking.approvedBy = req.user?.email || '';

    await sendBookingApprovalEmail(booking);
    booking.approvalEmailSentAt = new Date();
    await booking.save();

    await new Activity({
      action: 'Booking Approved',
      details: `${booking.name || 'Client'} was notified at ${booking.email}`
    }).save();

    return res.json({ message: 'Booking approved and notification email sent.', booking });
  } catch (err) {
    console.error('Approve booking error:', err);
    return res.status(500).json({ error: 'Failed to approve booking' });
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

app.get('/api/reviews', async (req, res) => {
  try {
    const reviews = await Review.find({ published: true }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error('Fetch reviews error:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

app.get('/api/admin/reviews', requireAuth, requireAdmin, async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error('Fetch admin reviews error:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

app.post('/api/reviews', requireAuth, requireAdmin, async (req, res) => {
  try {
    const author = String(req.body?.author || '').trim();
    const text = String(req.body?.text || '').trim();
    const rating = Number(req.body?.rating ?? 5);
    if (!author || !text || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Author, review text, and a 1-5 rating are required' });
    }
    const review = await Review.create({
      author,
      role: String(req.body?.role || '').trim(),
      text,
      rating,
      published: req.body?.published !== false
    });
    await new Activity({ action: 'Review Created', details: `Review from ${author} was added` }).save();
    res.status(201).json(review);
  } catch (err) {
    console.error('Create review error:', err);
    res.status(400).json({ error: 'Failed to create review' });
  }
});

app.put('/api/reviews/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const author = String(req.body?.author || '').trim();
    const text = String(req.body?.text || '').trim();
    const rating = Number(req.body?.rating);
    if (!author || !text || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Author, review text, and a 1-5 rating are required' });
    }
    const review = await Review.findByIdAndUpdate(req.params.id, {
      author,
      role: String(req.body?.role || '').trim(),
      text,
      rating,
      published: req.body?.published === true,
      updatedAt: new Date()
    }, { new: true, runValidators: true });
    if (!review) return res.status(404).json({ error: 'Review not found' });
    await new Activity({ action: 'Review Updated', details: `Review from ${author} was updated` }).save();
    res.json(review);
  } catch (err) {
    console.error('Update review error:', err);
    res.status(400).json({ error: 'Failed to update review' });
  }
});

app.delete('/api/reviews/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found' });
    await new Activity({ action: 'Review Deleted', details: `Review from ${review.author} was deleted` }).save();
    res.json({ message: 'Review deleted' });
  } catch (err) {
    console.error('Delete review error:', err);
    res.status(400).json({ error: 'Failed to delete review' });
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
    const mealPayload = normalizeMealPayload(req.body);
    if (!mealPayload.title && !mealPayload.socialUrl) {
      return res.status(400).json({ error: 'Title is required when social URL is empty' });
    }
    await enrichMealWithSocialThumbnail(mealPayload);
    const meal = new Meal(mealPayload);
    await meal.save();
    res.status(201).json(meal);
  } catch (err) {
    console.error('Create meal error:', err);
    res.status(400).json({ error: 'Failed to create meal' });
  }
});

app.put('/api/meals/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const existingMeal = await Meal.findById(req.params.id);
    if (!existingMeal) {
      return res.status(404).json({ error: 'Meal not found' });
    }
    const mealPayload = normalizeMealPayload({
      ...existingMeal.toObject(),
      ...req.body
    });
    if (!mealPayload.title && !mealPayload.socialUrl) {
      return res.status(400).json({ error: 'Title is required when social URL is empty' });
    }
    await enrichMealWithSocialThumbnail(mealPayload);
    const updated = await Meal.findByIdAndUpdate(
      req.params.id,
      { ...mealPayload, updatedAt: new Date() },
      { new: true, runValidators: true }
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

app.get('/api/social-preview', async (req, res) => {
  try {
    const { url } = req.query || {};
    if (!url) {
      return res.status(400).json({ error: 'Missing url parameter' });
    }
    const preview = await fetchSocialPreview(String(url).trim());
    if (!preview) {
      return res.status(400).json({ error: 'Unsupported social provider' });
    }
    return res.json(preview);
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
  if (err?.message?.startsWith('CORS blocked origin:')) {
    return res.status(403).json({ error: 'Origin not allowed by CORS policy' });
  }

  return next(err);
});

app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
