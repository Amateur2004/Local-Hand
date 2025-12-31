const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());

// Set up PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Required if PostgreSQL uses SSL
});

(async () => {
  try {
    // First check if table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      )
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log("no table");
    } else {
      console.log("✅ 'users' table already exists");
    }
  } catch (err) {
    console.error("❌ Table verification failed:", err.stack);
  }
})();
//  Create the users table if it doesn't exist

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// Passport serialization
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.BACKEND_URL}/auth/google/callback`
}, async (accessToken, refreshToken, profile, done) => {
  const email = profile.emails[0].value;
  const googleId = profile.id;
  const name = profile.displayName;

  try {
    const userCheck = await pool.query("SELECT * FROM users WHERE google_id = $1", [googleId]);
    if (userCheck.rows.length === 0) {
      await pool.query(
        "INSERT INTO users (google_id, email, name) VALUES ($1, $2, $3)",
        [googleId, email, name]
      );
    }
    return done(null, { googleId, email, name });
  } catch (err) {
    return done(err, null);
  }
}));

// Google Auth Routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', {
    successRedirect: `${process.env.FRONTEND_URL}/profile`,
    failureRedirect: '/login/failed'
  }));

// Return authenticated user info
app.get('/auth/user', (req, res) => {
  res.json(req.user || null);
});

// Complete signup route (update user details)
app.post('/auth/complete-signup', async (req, res) => {
  const { googleId, user_type, phone, location } = req.body;
  try {
    await pool.query(
      `UPDATE users SET user_type=$1, phone=$2, location=$3 WHERE google_id=$4`,
      [user_type, phone, location, googleId]
    );
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send("Signup completion failed.");
  }
});

app.listen(5000, () => console.log("🚀 Server running on port 5000"));
