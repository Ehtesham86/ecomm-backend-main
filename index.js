require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');

const app = express();

// Logging
app.use(morgan('dev'));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// JSON parser
app.use(express.json());

// === CORS Configuration ===
const allowedOrigins = [
  'https://ecomm-admin-main.vercel.app',
  'https://wesupplyfood-shop.vercel.app',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// Explicitly handle OPTIONS preflight requests for all routes
app.options('*', cors());

// === MongoDB Connection ===
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// === Routes ===
app.use('/api/auth', authRoutes);
app.use('/api', adminRoutes);

// === Server Start ===
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
