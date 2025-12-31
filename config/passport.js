const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();

module.exports = (passport, pool) => {
  passport.serializeUser((user, done) => {
    done(null, {
      id: user.account_id,
      email: user.gmail,
      profileType: user.profile_type,
      profileId: user.profile_id,
      photo: user.photo // Ensure photo is serialized
    });
  });

  passport.deserializeUser(async (serializedUser, done) => {
    try {
      const result = await pool.query(
        'SELECT * FROM accounts WHERE account_id = $1',
        [serializedUser.id]
      );
      const user = result.rows[0] || null;
      if (user) {
        user.photo = serializedUser.photo; // Restore photo from serialized data
      }
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.BACKEND_URL}/auth/google/callback`,
        passReqToCallback: true,
        proxy: true
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const name = profile.displayName;
          const photo = profile.photos?.[0]?.value;
          const authType = req.session.authType || 'login';

          if (!email) {
            return done(new Error("No email provided by Google"), null);
          }

          // Debug log to verify photo
          console.log('Google profile photo:', photo);

          // Check for existing account
          const { rows } = await pool.query(
            `SELECT * FROM accounts WHERE gmail = $1`,
            [email]
          );

          console.log("Number of rows:",rows);

          if (rows.length > 0) {
            // Account exists
            const user = rows[0];
            if (authType === 'login') {
              // Login: Account exists, proceed
              return done(null, { 
                ...user, 
                isNew: false,
                name,
                photo,
                message: null
              });
            } else {
              // Signup: Account already exists, proceed to profiles with message
              return done(null, { 
                ...user, 
                isNew: false,
                name,
                photo,
                message: 'Account already exists'
              });
            }
          } else {
            // Account does not exist
            if (authType === 'login') {
              // Login: Account does not exist, redirect with message
              return done(null, false, { message: 'Account does not exist. Please sign up instead.' });
            } else {
              // Signup: Create new account
              const newCustomer = await pool.query(
                `INSERT INTO customer (username) VALUES ($1) RETURNING customer_id`,
                [name || email.split('@')[0]]
              );
              const customerId = newCustomer.rows[0].customer_id;

              const newAccount = await pool.query(
                `INSERT INTO accounts (gmail, profile_type, profile_id) 
                 VALUES ($1, 'Customer', $2) RETURNING *`,
                [email, customerId]
              );

              return done(null, { 
                ...newAccount.rows[0],
                isNew: true,
                name,
                photo,
                needsProfileSetup: true,
                message: null
              });
            }
          }

        } catch (err) {
          console.error('Google OAuth error:', err);
          return done(err, null);
        }
      }
    )
  );
};