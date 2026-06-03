const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');

dotenv.config();

connectDB();

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000'];

const VERCEL_PATTERN = /^https:\/\/desenvolvimento-plataforma-web-n695[a-z0-9-]*\.vercel\.app$/;

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || VERCEL_PATTERN.test(origin)) {
      callback(null, true);
    } else {
      console.warn('CORS bloqueado para origem:', origin);
      callback(new Error(`CORS bloqueado para origem: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(helmet({ crossOriginResourcePolicy: false, contentSecurityPolicy: false }));
app.use(cookieParser());
app.use(express.json());

app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/books', require('./src/routes/bookRoutes'));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});