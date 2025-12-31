const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
require('dotenv').config();
const { pool, setupDatabase } = require('./config/db');
const setupPassport = require('./config/passport');
const authRoutes = require('./routes/auth');
const profilesRoutes = require('./routes/profiles');

const app = express();

// Initialize database
setupDatabase().catch(err => {
  console.error('Failed to set up database:', err);
  process.exit(1);
});
// Make pool available to routes
app.locals.pool = pool;
// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());


// Setup passport with pool
setupPassport(passport, pool);

// Routes
app.use('/auth', authRoutes);
app.use('/api/profiles', profilesRoutes);

// Server setup
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});