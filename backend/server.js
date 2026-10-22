const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const crypto = require('crypto');
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
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
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
  selectedPackage: {
    packageId: String,
    name: String,
    description: String,
    currency: String,
    pricePerGuest: Number,
    guestCount: Number,
    totalPrice: Number,
    meals: [{
      mealId: String,
      title: String,
      category: String,
      description: String,
      imageUrl: String
    }]
  },
  quote: {
    currency: { type: String, uppercase: true, trim: true, default: 'KES' },
    items: [{
      description: { type: String, trim: true, maxlength: 120 },
      quantity: { type: Number, min: 1 },
      unitPrice: { type: Number, min: 0 },
      lineTotal: { type: Number, min: 0 }
    }],
    total: { type: Number, min: 0 },
    status: { type: String, enum: ['draft', 'sent', 'accepted', 'declined'], default: 'draft' },
    updatedAt: Date,
    updatedBy: String,
    sentAt: Date,
    sentBy: String,
    respondedAt: Date,
    responseTokenHash: { type: String, select: false }
  },
  status: { type: String, enum: ['pending', 'approved'], default: 'pending' },
  approvedAt: Date,
  approvalEmailSentAt: Date,
  approvedBy: String,
  createdAt: { type: Date, default: Date.now }
});
bookingSchema.index({ 'quote.responseTokenHash': 1 }, { sparse: true });

const Booking = mongoose.model('Booking', bookingSchema);

const unavailableDateSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  type: { type: String, enum: ['blocked', 'booked'], default: 'blocked' },
  reason: { type: String, trim: true, maxlength: 120, default: '' },
  blockedBy: { type: String, default: '' },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  createdAt: { type: Date, default: Date.now }
});

const UnavailableDate = mongoose.model('UnavailableDate', unavailableDateSchema);

// Activity Schema
const activitySchema = new mongoose.Schema({
  actor: String,
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
  passwordResetTokenHash: { type: String, select: false },
  passwordResetExpiresAt: { type: Date, select: false },
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

const menuPackageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 1000, default: '' },
  currency: { type: String, required: true, uppercase: true, trim: true, match: /^[A-Z]{3}$/ },
  pricePerGuest: { type: Number, required: true, min: 0, max: 1000000000 },
  mealIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Meal' }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

menuPackageSchema.pre('save', function updatePackageTimestamp(next) {
  this.updatedAt = new Date();
  next();
});

const MenuPackage = mongoose.model('MenuPackage', menuPackageSchema);

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
    booking.selectedPackage?.packageId
      ? `Menu package: ${booking.selectedPackage.name} (${booking.selectedPackage.currency} ${Number(booking.selectedPackage.totalPrice || 0).toFixed(2)} total)`
      : '',
    ...(booking.selectedPackage?.meals || []).map((meal) => `Included dish: ${meal.title}`),
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
const hashQuoteResponseToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const isValidQuoteResponseToken = (token) => /^[a-f0-9]{64}$/.test(String(token || ''));

const toPublicQuoteResponse = (booking) => ({
  name: booking.name || '',
  date: booking.date || '',
  occasion: booking.occasion || '',
  status: booking.quote.status,
  respondedAt: booking.quote.respondedAt || null,
  quote: {
    currency: booking.quote.currency || 'KES',
    items: booking.quote.items.map(({ description, quantity, unitPrice, lineTotal }) => ({ description, quantity, unitPrice, lineTotal })),
    total: booking.quote.total
  }
});

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

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    if (!EMAIL_USER || !EMAIL_APP_PASSWORD) {
      return res.status(503).json({ error: 'Password reset email is not configured on the server' });
    }
    const dbUnavailable = ensureDatabaseReady(res);
    if (dbUnavailable) return dbUnavailable;

    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Enter a valid email address' });
    }

    const genericResponse = { message: 'If an account with that email exists, a password reset link will be sent.' };
    const user = await User.findOne({ email });
    if (!user) return res.json(genericResponse);

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await User.updateOne(
      { _id: user._id },
      { $set: { passwordResetTokenHash: resetTokenHash, passwordResetExpiresAt: expiresAt } }
    );

    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
    try {
      await transporter.sendMail({
        from: EMAIL_USER,
        to: user.email,
        subject: 'Reset your Sorted Kitchen password',
        text: [
          `Hello ${user.name || 'there'},`,
          '',
          'We received a request to reset your Sorted Kitchen password.',
          `Choose a new password using this link: ${resetUrl}`,
          '',
          'This link expires in 1 hour and can only be used once.',
          'If you did not request a password reset, you can ignore this email.',
          '',
          'Sorted Kitchen'
        ].join('\n'),
        html: `<p>Hello ${escapeHtml(user.name || 'there')},</p><p>We received a request to reset your Sorted Kitchen password.</p><p><a href="${escapeHtml(resetUrl)}">Choose a new password</a></p><p>This link expires in 1 hour and can only be used once. If you did not request a password reset, you can ignore this email.</p><p>Sorted Kitchen</p>`
      });
    } catch (mailError) {
      await User.updateOne(
        { _id: user._id, passwordResetTokenHash: resetTokenHash },
        { $unset: { passwordResetTokenHash: 1, passwordResetExpiresAt: 1 } }
      );
      throw mailError;
    }

    return res.json(genericResponse);
  } catch (err) {
    console.error('Request password reset error:', err);
    return res.status(502).json({ error: 'Could not send the password reset email. Please try again later.' });
  }
});

app.get('/api/auth/reset-password/:token', async (req, res) => {
  try {
    const token = String(req.params.token || '');
    if (!/^[a-f0-9]{64}$/.test(token)) {
      return res.status(400).json({ error: 'This password reset link is invalid or expired' });
    }
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: new Date() }
    }).select('_id');
    if (!user) {
      return res.status(400).json({ error: 'This password reset link is invalid or expired' });
    }
    return res.json({ valid: true });
  } catch (err) {
    console.error('Validate password reset token error:', err);
    return res.status(500).json({ error: 'Could not validate this password reset link' });
  }
});

app.post('/api/auth/reset-password/:token', async (req, res) => {
  try {
    const token = String(req.params.token || '');
    const password = req.body?.password;
    if (!/^[a-f0-9]{64}$/.test(token)) {
      return res.status(400).json({ error: 'This password reset link is invalid or expired' });
    }
    if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
      return res.status(400).json({ error: 'Password must be between 8 and 128 characters' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await User.updateOne(
      { passwordResetTokenHash: tokenHash, passwordResetExpiresAt: { $gt: new Date() } },
      {
        $set: { passwordHash, authProvider: 'local', updatedAt: new Date() },
        $unset: { passwordResetTokenHash: 1, passwordResetExpiresAt: 1 }
      }
    );
    if (!result.modifiedCount) {
      return res.status(400).json({ error: 'This password reset link is invalid, expired, or already used' });
    }
    return res.json({ message: 'Password reset successfully. You can now sign in with your new password.' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: 'Could not reset your password. Please try again.' });
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

// Fields a customer is allowed to set when requesting a booking.
const BOOKING_REQUEST_FIELDS = ['name', 'email', 'phone', 'date', 'time', 'guests', 'occasion', 'eventAddress', 'referralSource', 'eventDetails'];

const pickBookingRequest = (body = {}) => Object.fromEntries(
  BOOKING_REQUEST_FIELDS
    .filter((field) => Object.hasOwn(body, field))
    .map((field) => [field, body[field]])
);

// What a customer may see of their own booking. Internal fields (approvedBy, draft quotes, emails sent) stay hidden.
const toCustomerBooking = (booking) => {
  const quote = booking.quote;
  const quoteVisible = quote?.status === 'sent' && Array.isArray(quote.items) && quote.items.length > 0;
  return {
    id: booking._id,
    date: booking.date,
    time: booking.time,
    guests: booking.guests,
    occasion: booking.occasion,
    eventAddress: booking.eventAddress,
    eventDetails: booking.eventDetails,
    status: booking.status,
    createdAt: booking.createdAt,
    approvedAt: booking.approvedAt || null,
    selectedPackage: booking.selectedPackage?.packageId
      ? {
        packageId: booking.selectedPackage.packageId,
        name: booking.selectedPackage.name,
        description: booking.selectedPackage.description,
        currency: booking.selectedPackage.currency,
        pricePerGuest: booking.selectedPackage.pricePerGuest,
        guestCount: booking.selectedPackage.guestCount,
        totalPrice: booking.selectedPackage.totalPrice,
        meals: booking.selectedPackage.meals
      }
      : null,
    quote: quoteVisible
      ? {
        currency: quote.currency || 'KES',
        items: quote.items.map(({ description, quantity, unitPrice, lineTotal }) => ({ description, quantity, unitPrice, lineTotal })),
        total: quote.total,
        sentAt: quote.sentAt || null
      }
      : null
  };
};

const isCalendarDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() === month - 1
    && parsed.getUTCDate() === day;
};

const reserveApprovedBookingDate = async (booking) => {
  const existingReservation = await UnavailableDate.findOne({ date: booking.date });
  if (existingReservation) {
    if (existingReservation.type === 'booked' && String(existingReservation.bookingId) === String(booking._id)) {
      return { reservation: existingReservation, created: false };
    }
    return {
      error: existingReservation.type === 'blocked'
        ? 'This date is marked unavailable. Remove the date block before approving this booking.'
        : 'Another booking already reserves this date.'
    };
  }

  if (await Booking.exists({ date: booking.date, status: 'approved', _id: { $ne: booking._id } })) {
    return { error: 'Another booking already reserves this date.' };
  }

  try {
    const reservation = await UnavailableDate.create({
      date: booking.date,
      type: 'booked',
      bookingId: booking._id
    });
    return { reservation, created: true };
  } catch (err) {
    if (err?.code !== 11000) throw err;
    const conflictingReservation = await UnavailableDate.findOne({ date: booking.date });
    if (conflictingReservation?.type === 'booked'
      && String(conflictingReservation.bookingId) === String(booking._id)) {
      return { reservation: conflictingReservation, created: false };
    }
    return {
      error: conflictingReservation?.type === 'blocked'
        ? 'This date is marked unavailable. Remove the date block before approving this booking.'
        : 'Another booking already reserves this date.'
    };
  }
};

const releaseApprovedBookingDate = async (bookingId, date) => (
  UnavailableDate.deleteOne({ date, type: 'booked', bookingId })
);

app.get('/api/availability', async (req, res) => {
  try {
    const [unavailableDates, bookedReservations, approvedBookings] = await Promise.all([
      UnavailableDate.find({ type: 'blocked' }, { date: 1, _id: 0 }).lean(),
      UnavailableDate.find({ type: 'booked' }, { date: 1, _id: 0 }).lean(),
      Booking.find({ status: 'approved' }, { date: 1, _id: 0 }).lean()
    ]);
    return res.json({
      unavailableDates: unavailableDates.map(({ date }) => date),
      bookedDates: [...new Set([
        ...bookedReservations.map(({ date }) => date),
        ...approvedBookings.map(({ date }) => date).filter(isCalendarDate)
      ])]
    });
  } catch (err) {
    console.error('Fetch availability error:', err);
    return res.status(500).json({ error: 'Could not fetch booking availability' });
  }
});

app.post('/api/book', requireAuth, async (req, res) => {
  try {
    const date = req.body?.date;
    if (!isCalendarDate(date)) {
      return res.status(400).json({ error: 'Choose a valid booking date' });
    }
    const dateReservation = await UnavailableDate.findOne({ date });
    if (dateReservation) {
      return res.status(409).json({
        error: dateReservation.type === 'blocked'
          ? 'This date is unavailable. Please choose another date.'
          : 'This date is already booked. Please choose another date.'
      });
    }
    if (await Booking.exists({ date, status: 'approved' })) {
      return res.status(409).json({ error: 'This date is already booked. Please choose another date.' });
    }

    let selectedPackage;
    if (req.body?.packageId) {
      if (!mongoose.isValidObjectId(req.body.packageId)) {
        return res.status(400).json({ error: 'Choose a valid menu package' });
      }
      const menuPackage = await MenuPackage.findOne({ _id: req.body.packageId, isActive: true }).populate({
        path: 'mealIds',
        select: 'title category description imageUrl'
      });
      if (!menuPackage) {
        return res.status(400).json({ error: 'The selected menu package is no longer available. Please choose another package.' });
      }
      const guestCount = Number(req.body?.guests);
      if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 10000) {
        return res.status(400).json({ error: 'Enter a valid guest count to calculate package pricing' });
      }
      selectedPackage = {
        packageId: menuPackage._id.toString(),
        name: menuPackage.name,
        description: menuPackage.description,
        currency: menuPackage.currency,
        pricePerGuest: menuPackage.pricePerGuest,
        guestCount,
        totalPrice: Math.round(menuPackage.pricePerGuest * guestCount * 100) / 100,
        meals: menuPackage.mealIds.map((meal) => ({
          mealId: meal._id.toString(),
          title: meal.title || '',
          category: meal.category || '',
          description: meal.description || '',
          imageUrl: meal.imageUrl || ''
        }))
      };
    }

    const newBooking = new Booking({
      ...pickBookingRequest(req.body),
      selectedPackage,
      userId: req.user?.userId,
      status: 'pending',
      approvedAt: undefined,
      approvalEmailSentAt: undefined,
      approvedBy: ''
    });
    await newBooking.save();

    // Log Activity
    await new Activity({ actor: req.user?.email || '', action: 'New Booking', details: `${req.body.name} requested a booking for ${req.body.guests} guests` }).save();

    res.status(200).json({ message: 'Booking request received successfully!', booking: newBooking });
  } catch (err) {
    if (err?.code === 11000 && err?.keyPattern?.date) {
      return res.status(409).json({ error: 'This date is already booked. Please choose another date.' });
    }
    console.error('Booking create error:', err);
    res.status(500).json({ error: 'Failed to save booking' });
  }
});

app.get('/api/my-bookings', requireAuth, async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const bookings = await Booking.find({ userId: req.user.userId }).sort({ createdAt: -1 }).lean();
    res.json(bookings.map(toCustomerBooking));
  } catch (err) {
    console.error('Fetch my bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch your bookings' });
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

app.get('/api/admin/unavailable-dates', requireAuth, requireAdmin, async (req, res) => {
  try {
    const dates = await UnavailableDate.find({ type: 'blocked' }).sort({ date: 1 }).lean();
    return res.json(dates);
  } catch (err) {
    console.error('Fetch unavailable dates error:', err);
    return res.status(500).json({ error: 'Could not fetch unavailable dates' });
  }
});

app.post('/api/admin/unavailable-dates', requireAuth, requireAdmin, async (req, res) => {
  try {
    const date = req.body?.date;
    const reason = String(req.body?.reason || '').trim();
    if (!isCalendarDate(date)) {
      return res.status(400).json({ error: 'Choose a valid unavailable date' });
    }
    if (reason.length > 120) {
      return res.status(400).json({ error: 'The reason must be 120 characters or fewer' });
    }
    if (await Booking.exists({ date, status: 'approved' })) {
      return res.status(409).json({ error: 'An approved booking already reserves this date' });
    }
    if (await UnavailableDate.exists({ date })) {
      return res.status(409).json({ error: 'This date already has an availability entry' });
    }

    const unavailableDate = await UnavailableDate.create({
      date,
      type: 'blocked',
      reason,
      blockedBy: req.user?.email || ''
    });
    await new Activity({
      actor: req.user?.email || '',
      action: 'Date Blocked',
      details: `${date} marked unavailable${reason ? `: ${reason}` : ''}`
    }).save();
    return res.status(201).json({ unavailableDate });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ error: 'This date is already marked unavailable' });
    }
    console.error('Block date error:', err);
    return res.status(500).json({ error: 'Could not mark this date unavailable' });
  }
});

app.delete('/api/admin/unavailable-dates/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const unavailableDate = await UnavailableDate.findOneAndDelete({ _id: req.params.id, type: 'blocked' });
    if (!unavailableDate) return res.status(404).json({ error: 'Unavailable date not found' });
    await new Activity({
      actor: req.user?.email || '',
      action: 'Date Unblocked',
      details: `${unavailableDate.date} is available for booking again`
    }).save();
    return res.json({ message: 'Date is available for booking again', unavailableDate });
  } catch (err) {
    console.error('Unblock date error:', err);
    return res.status(500).json({ error: 'Could not unblock this date' });
  }
});

app.delete('/api/bookings/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (booking?.status === 'approved') {
      await releaseApprovedBookingDate(booking._id, booking.date);
    }
    await new Activity({ actor: req.user?.email || '', action: 'Booking Deleted', details: `Booking ID ${req.params.id} was removed` }).save();
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

    const dateReservationResult = await reserveApprovedBookingDate(booking);
    if (dateReservationResult.error) {
      return res.status(409).json({ error: dateReservationResult.error });
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
    try {
      await booking.save();
    } catch (saveError) {
      if (dateReservationResult.created) await releaseApprovedBookingDate(booking._id, booking.date);
      throw saveError;
    }

    try {
      await sendBookingApprovalEmail(booking);
    } catch (emailError) {
      console.error('Booking approval email error:', emailError);
      return res.status(502).json({
        error: 'Booking reserved, but the notification email could not be sent. Retry the notification from the admin dashboard.',
        booking
      });
    }
    booking.approvalEmailSentAt = new Date();
    await booking.save();

    await new Activity({
      actor: req.user?.email || '',
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
    const editableFields = ['name', 'email', 'phone', 'date', 'time', 'guests', 'occasion', 'eventAddress', 'referralSource', 'eventDetails'];
    const updates = Object.fromEntries(editableFields
      .filter((field) => Object.hasOwn(req.body || {}, field))
      .map((field) => [field, req.body[field]]));
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (Object.hasOwn(updates, 'date') && !isCalendarDate(updates.date)) {
      return res.status(400).json({ error: 'Choose a valid booking date' });
    }
    const previousDate = booking.date;
    const nextDate = updates.date || booking.date;
    const reservationAtNextDate = await UnavailableDate.findOne({ date: nextDate });
    if (reservationAtNextDate?.type === 'blocked') {
      return res.status(409).json({ error: 'This date is marked unavailable. Remove the date block before moving this booking.' });
    }
    if (reservationAtNextDate?.type === 'booked'
      && String(reservationAtNextDate.bookingId) !== String(booking._id)) {
      return res.status(409).json({ error: 'Another booking already reserves this date.' });
    }
    if (await Booking.exists({ date: nextDate, status: 'approved', _id: { $ne: booking._id } })) {
      return res.status(409).json({ error: 'Another booking already reserves this date.' });
    }

    Object.assign(booking, updates);
    let newDateReservation;
    if (booking.status === 'approved' && !reservationAtNextDate) {
      const reservationResult = await reserveApprovedBookingDate(booking);
      if (reservationResult.error) {
        return res.status(409).json({ error: reservationResult.error });
      }
      newDateReservation = reservationResult;
    }

    let updatedBooking;
    try {
      updatedBooking = await booking.save();
    } catch (saveError) {
      if (newDateReservation?.created) await releaseApprovedBookingDate(booking._id, nextDate);
      throw saveError;
    }
    if (booking.status === 'approved' && previousDate !== nextDate) {
      await releaseApprovedBookingDate(booking._id, previousDate);
    }
    await new Activity({ actor: req.user?.email || '', action: 'Booking Updated', details: `Booking for ${updatedBooking.name} was updated` }).save();
    res.json(updatedBooking);
  } catch (err) {
    console.error('Update booking error:', err);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

app.put('/api/bookings/:id/quote', requireAuth, requireAdmin, async (req, res) => {
  try {
    const currency = String(req.body?.currency || '').trim().toUpperCase();
    const items = req.body?.items;
    if (!/^[A-Z]{3}$/.test(currency) || !Array.isArray(items) || items.length < 1 || items.length > 40) {
      return res.status(400).json({ error: 'Choose a 3-letter currency and provide 1 to 40 quote items' });
    }

    const normalizedItems = [];
    for (const item of items) {
      const description = String(item?.description || '').trim();
      const quantity = Number(item?.quantity);
      const unitPrice = Number(item?.unitPrice);
      if (!description || description.length > 120 || !Number.isInteger(quantity) || quantity < 1 || quantity > 10000
        || !Number.isFinite(unitPrice) || unitPrice < 0 || unitPrice > 1000000000) {
        return res.status(400).json({ error: 'Each item needs a description, whole-number quantity, and non-negative unit price' });
      }
      const lineTotal = Math.round(quantity * unitPrice * 100) / 100;
      normalizedItems.push({ description, quantity, unitPrice, lineTotal });
    }

    const total = Math.round(normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0) * 100) / 100;
    const booking = await Booking.findByIdAndUpdate(req.params.id, {
      $set: {
        'quote.currency': currency,
        'quote.items': normalizedItems,
        'quote.total': total,
        'quote.status': 'draft',
        'quote.updatedAt': new Date(),
        'quote.updatedBy': req.user?.email || ''
      },
      $unset: {
        'quote.sentAt': 1,
        'quote.sentBy': 1,
        'quote.respondedAt': 1,
        'quote.responseTokenHash': 1
      }
    }, { new: true, runValidators: true });

    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    await new Activity({
      actor: req.user?.email || '',
      action: 'Quote Updated',
      details: `Estimate for ${booking.name || 'client'} saved at ${currency} ${total.toFixed(2)}`
    }).save();
    return res.json({ booking });
  } catch (err) {
    console.error('Save booking quote error:', err);
    return res.status(500).json({ error: 'Failed to save booking estimate' });
  }
});

app.post('/api/bookings/:id/quote/send', requireAuth, requireAdmin, async (req, res) => {
  try {
    if (!EMAIL_USER || !EMAIL_APP_PASSWORD) {
      return res.status(503).json({ error: 'Email delivery is not configured on the server' });
    }
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (!booking.email) return res.status(400).json({ error: 'This booking has no client email address' });
    if (!booking.quote?.items?.length) return res.status(400).json({ error: 'Save an estimate before sending it' });
    if (['accepted', 'declined'].includes(booking.quote.status)) {
      return res.status(409).json({ error: 'This estimate has already been answered. Edit it before sending a new estimate.' });
    }

    const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
    const currency = booking.quote.currency || 'KES';
    const responseToken = crypto.randomBytes(32).toString('hex');
    const responseUrl = `${frontendUrl}/quote-response?token=${responseToken}`;
    const itemRows = booking.quote.items.map((item) => (
      `<tr><td>${escapeHtml(item.description)}</td><td>${item.quantity}</td><td>${currency} ${Number(item.unitPrice).toFixed(2)}</td><td>${currency} ${Number(item.lineTotal).toFixed(2)}</td></tr>`
    )).join('');
    const subject = `Catering estimate for ${booking.date || 'your event'} - Sorted Kitchen`;
    const text = [
      `Hello ${booking.name || 'there'},`,
      '',
      `Here is the catering estimate for your ${booking.occasion || 'event'} on ${booking.date || 'your requested date'}.`,
      ...booking.quote.items.map((item) => `${item.description}: ${item.quantity} x ${currency} ${Number(item.unitPrice).toFixed(2)} = ${currency} ${Number(item.lineTotal).toFixed(2)}`),
      '',
      `Estimated total: ${currency} ${Number(booking.quote.total).toFixed(2)}`,
      '',
      'This is an estimate for review, not an invoice or payment request.',
      '',
      `Review and accept or decline this estimate: ${responseUrl}`,
      '',
      'Best regards,',
      'Sorted Kitchen'
    ].join('\n');
    const html = `<p>Hello ${escapeHtml(booking.name || 'there')},</p><p>Here is the catering estimate for your ${escapeHtml(booking.occasion || 'event')} on ${escapeHtml(booking.date || 'your requested date')}.</p><table style="border-collapse:collapse;width:100%"><thead><tr><th align="left">Item</th><th align="right">Qty</th><th align="right">Unit price</th><th align="right">Line total</th></tr></thead><tbody>${itemRows}</tbody></table><p style="text-align:right;font-size:18px"><strong>Estimated total: ${currency} ${Number(booking.quote.total).toFixed(2)}</strong></p><p>This is an estimate for review, not an invoice or payment request.</p><p><a href="${escapeHtml(responseUrl)}">Review and respond to this estimate</a></p><p>Best regards,<br>Sorted Kitchen</p>`;

    await transporter.sendMail({
      from: EMAIL_USER,
      to: booking.email,
      subject,
      text,
      html
    });

    booking.quote.status = 'sent';
    booking.quote.sentAt = new Date();
    booking.quote.sentBy = req.user?.email || '';
    booking.quote.responseTokenHash = hashQuoteResponseToken(responseToken);
    await booking.save();
    await new Activity({
      actor: req.user?.email || '',
      action: 'Quote Sent',
      details: `Estimate emailed to ${booking.email} for ${currency} ${Number(booking.quote.total).toFixed(2)}`
    }).save();
    return res.json({ message: `Estimate sent to ${booking.email}.`, booking });
  } catch (err) {
    console.error('Send quote email error:', err);
    return res.status(502).json({ error: 'Could not send estimate email. Check the mail server configuration and try again.' });
  }
});

app.get('/api/quote-response/:token', async (req, res) => {
  try {
    if (!isValidQuoteResponseToken(req.params.token)) {
      return res.status(404).json({ error: 'Estimate response link is invalid or no longer available' });
    }
    const booking = await Booking.findOne({
      'quote.responseTokenHash': hashQuoteResponseToken(req.params.token),
      'quote.status': { $in: ['sent', 'accepted', 'declined'] }
    });
    if (!booking) return res.status(404).json({ error: 'Estimate response link is invalid or no longer available' });
    return res.json(toPublicQuoteResponse(booking));
  } catch (err) {
    console.error('Fetch public quote error:', err);
    return res.status(500).json({ error: 'Could not load this estimate' });
  }
});

app.post('/api/quote-response/:token', async (req, res) => {
  try {
    if (!isValidQuoteResponseToken(req.params.token)) {
      return res.status(404).json({ error: 'Estimate response link is invalid or no longer available' });
    }
    const decision = req.body?.decision;
    if (!['accepted', 'declined'].includes(decision)) {
      return res.status(400).json({ error: 'Choose whether to accept or decline this estimate' });
    }

    const tokenHash = hashQuoteResponseToken(req.params.token);
    const booking = await Booking.findOneAndUpdate(
      { 'quote.responseTokenHash': tokenHash, 'quote.status': 'sent' },
      { $set: { 'quote.status': decision, 'quote.respondedAt': new Date() } },
      { new: true, runValidators: true }
    );

    if (!booking) {
      const existingBooking = await Booking.findOne({ 'quote.responseTokenHash': tokenHash });
      if (!existingBooking) {
        return res.status(404).json({ error: 'Estimate response link is invalid or no longer available' });
      }
      if (existingBooking.quote.status === decision) {
        return res.json({
          message: `This estimate was already ${decision}.`,
          response: toPublicQuoteResponse(existingBooking)
        });
      }
      return res.status(409).json({
        error: 'This estimate has already received a response',
        response: toPublicQuoteResponse(existingBooking)
      });
    }

    await new Activity({
      actor: booking.email || '',
      action: decision === 'accepted' ? 'Quote Accepted' : 'Quote Declined',
      details: `${booking.name || 'Client'} ${decision} the estimate for ${booking.quote.currency} ${Number(booking.quote.total).toFixed(2)}`
    }).save();

    return res.json({
      message: `Estimate ${decision}.`,
      response: toPublicQuoteResponse(booking)
    });
  } catch (err) {
    console.error('Save public quote response error:', err);
    return res.status(500).json({ error: 'Could not record your estimate response' });
  }
});

app.get('/api/activity', requireAuth, requireAdmin, async (req, res) => {
  try {
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 10;
    const activities = await Activity.find().sort({ timestamp: -1 }).limit(limit);
    res.json(activities);
  } catch (err) {
    console.error('Fetch activity error:', err);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

app.get('/api/admin/analytics', requireAuth, requireAdmin, async (req, res) => {
  try {
    const requestedMonths = Number.parseInt(req.query.months, 10);
    const monthCount = [6, 12, 24].includes(requestedMonths) ? requestedMonths : 12;
    const now = new Date();
    const firstMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthCount + 1, 1));
    const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    const formatMonth = (date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    const months = [];
    const monthIndex = new Map();

    for (let offset = 0; offset < monthCount; offset += 1) {
      const date = new Date(Date.UTC(firstMonth.getUTCFullYear(), firstMonth.getUTCMonth() + offset, 1));
      const key = formatMonth(date);
      monthIndex.set(key, months.length);
      months.push({ month: key, bookingCount: 0, approvedCount: 0, revenueByCurrency: {} });
    }

    const bookings = await Booking.find({
      date: {
        $gte: `${formatMonth(firstMonth)}-01`,
        $lt: `${formatMonth(nextMonth)}-01`
      }
    }, {
      date: 1,
      status: 1,
      selectedPackage: 1
    }).lean();

    const currencies = new Set();
    for (const booking of bookings) {
      if (!isCalendarDate(booking.date)) continue;
      const periodIndex = monthIndex.get(booking.date.slice(0, 7));
      if (periodIndex === undefined) continue;
      const period = months[periodIndex];
      period.bookingCount += 1;
      if (booking.status !== 'approved') continue;
      period.approvedCount += 1;

      const selectedPackage = booking.selectedPackage;
      const amount = Number(selectedPackage?.totalPrice);
      if (!selectedPackage?.packageId || !Number.isFinite(amount) || amount < 0) continue;
      const currency = /^[A-Z]{3}$/.test(String(selectedPackage.currency || ''))
        ? selectedPackage.currency
        : 'KES';
      currencies.add(currency);
      period.revenueByCurrency[currency] = Math.round(
        ((period.revenueByCurrency[currency] || 0) + amount) * 100
      ) / 100;
    }

    return res.json({
      months: months.map((period) => ({
        ...period,
        revenueByCurrency: Object.fromEntries(
          [...currencies].sort().map((currency) => [currency, period.revenueByCurrency[currency] || 0])
        )
      })),
      currencies: [...currencies].sort(),
      monthCount,
      monthBasis: 'event_date',
      revenueBasis: 'approved_packages'
    });
  } catch (err) {
    console.error('Fetch admin analytics error:', err);
    return res.status(500).json({ error: 'Could not load booking analytics' });
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
    await new Activity({ actor: req.user?.email || '', action: 'Review Created', details: `Review from ${author} was added` }).save();
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
    await new Activity({ actor: req.user?.email || '', action: 'Review Updated', details: `Review from ${author} was updated` }).save();
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
    await new Activity({ actor: req.user?.email || '', action: 'Review Deleted', details: `Review from ${review.author} was deleted` }).save();
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

const normalizeMenuPackage = async (body = {}) => {
  const name = String(body.name || '').trim();
  const description = String(body.description || '').trim();
  const currency = String(body.currency || '').trim().toUpperCase();
  const pricePerGuest = Number(body.pricePerGuest);
  const mealIds = Array.isArray(body.mealIds) ? [...new Set(body.mealIds.map(String))] : [];

  if (!name || name.length > 100) {
    return { error: 'Package name is required and must be 100 characters or fewer' };
  }
  if (description.length > 1000) {
    return { error: 'Package description must be 1000 characters or fewer' };
  }
  if (!/^[A-Z]{3}$/.test(currency)) {
    return { error: 'Choose a valid 3-letter currency' };
  }
  if (!Number.isFinite(pricePerGuest) || pricePerGuest < 0 || pricePerGuest > 1000000000) {
    return { error: 'Enter a valid non-negative price per guest' };
  }
  if (mealIds.length < 1 || mealIds.length > 30 || mealIds.some((id) => !mongoose.isValidObjectId(id))) {
    return { error: 'Choose between 1 and 30 valid meals for this package' };
  }

  const mealCount = await Meal.countDocuments({ _id: { $in: mealIds } });
  if (mealCount !== mealIds.length) {
    return { error: 'One or more selected meals no longer exist' };
  }
  return {
    packageData: {
      name,
      description,
      currency,
      pricePerGuest,
      mealIds,
      ...(typeof body.isActive === 'boolean' ? { isActive: body.isActive } : {})
    }
  };
};

app.get('/api/menu-packages', async (req, res) => {
  try {
    const packages = await MenuPackage.find({ isActive: true })
      .populate({ path: 'mealIds', select: 'title category description imageUrl' })
      .sort({ createdAt: -1 })
      .lean();
    return res.json(packages);
  } catch (err) {
    console.error('Fetch menu packages error:', err);
    return res.status(500).json({ error: 'Failed to fetch menu packages' });
  }
});

app.get('/api/admin/menu-packages', requireAuth, requireAdmin, async (req, res) => {
  try {
    const packages = await MenuPackage.find()
      .populate({ path: 'mealIds', select: 'title category description imageUrl' })
      .sort({ updatedAt: -1 })
      .lean();
    return res.json(packages);
  } catch (err) {
    console.error('Fetch admin menu packages error:', err);
    return res.status(500).json({ error: 'Failed to fetch menu packages' });
  }
});

app.post('/api/admin/menu-packages', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { packageData, error } = await normalizeMenuPackage(req.body);
    if (error) return res.status(400).json({ error });
    const menuPackage = await MenuPackage.create(packageData);
    const savedPackage = await MenuPackage.findById(menuPackage._id)
      .populate({ path: 'mealIds', select: 'title category description imageUrl' })
      .lean();
    await new Activity({
      actor: req.user?.email || '',
      action: 'Menu Package Created',
      details: `${savedPackage.name} created at ${savedPackage.currency} ${Number(savedPackage.pricePerGuest).toFixed(2)} per guest`
    }).save();
    return res.status(201).json(savedPackage);
  } catch (err) {
    console.error('Create menu package error:', err);
    return res.status(500).json({ error: 'Failed to create menu package' });
  }
});

app.put('/api/admin/menu-packages/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid menu package ID' });
    }
    const existingPackage = await MenuPackage.findById(req.params.id);
    if (!existingPackage) return res.status(404).json({ error: 'Menu package not found' });

    const { packageData, error } = await normalizeMenuPackage(req.body);
    if (error) return res.status(400).json({ error });
    Object.assign(existingPackage, packageData);
    await existingPackage.save();
    const savedPackage = await MenuPackage.findById(existingPackage._id)
      .populate({ path: 'mealIds', select: 'title category description imageUrl' })
      .lean();
    await new Activity({
      actor: req.user?.email || '',
      action: 'Menu Package Updated',
      details: `${savedPackage.name} updated`
    }).save();
    return res.json(savedPackage);
  } catch (err) {
    console.error('Update menu package error:', err);
    return res.status(500).json({ error: 'Failed to update menu package' });
  }
});

app.delete('/api/admin/menu-packages/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid menu package ID' });
    }
    const menuPackage = await MenuPackage.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false, updatedAt: new Date() } },
      { new: true }
    );
    if (!menuPackage) return res.status(404).json({ error: 'Menu package not found' });
    await new Activity({
      actor: req.user?.email || '',
      action: 'Menu Package Archived',
      details: `${menuPackage.name} is no longer available for new bookings`
    }).save();
    return res.json({ message: 'Menu package archived' });
  } catch (err) {
    console.error('Archive menu package error:', err);
    return res.status(500).json({ error: 'Failed to archive menu package' });
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
    const usedByPackage = await MenuPackage.exists({ mealIds: req.params.id });
    if (usedByPackage) {
      return res.status(409).json({ error: 'This meal is included in a menu package. Remove it from the package before deleting the meal.' });
    }
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