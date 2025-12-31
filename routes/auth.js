const express = require('express');
const passport = require('passport');
const router = express.Router();

// Initiate Google OAuth
router.get(
  '/google',
  (req, res, next) => {
    const authType = req.query.authType || 'login';
    req.session.authType = authType;
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      state: authType
    })(req, res, next);
  }
);

// Google OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL}/login`,
    failureFlash: false
  }),
  (req, res) => {
    if (req.user && req.user.message) {
      res.redirect(`${process.env.FRONTEND_URL}/profile?message=${encodeURIComponent(req.user.message)}`);
    } else {
      res.redirect(`${process.env.FRONTEND_URL}/profile`);
    }
  }
);

// Get authenticated user and their profiles
router.get('/user', async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      // Fetch all profiles for the user's email
      const profilesResult = await req.app.locals.pool.query(
        `SELECT a.account_id, a.gmail, a.profile_type, a.profile_id,
                CASE 
                  WHEN a.profile_type = 'Customer' THEN c.username
                  WHEN a.profile_type = 'Service Provider' THEN sp.name
                END as name,
                CASE 
                  WHEN a.profile_type = 'Customer' THEN 'Customer'
                  WHEN a.profile_type = 'Service Provider' THEN cat.category_name
                END as display_type
         FROM accounts a
         LEFT JOIN customer c ON a.profile_type = 'Customer' AND a.profile_id = c.customer_id
         LEFT JOIN service_provider sp ON a.profile_type = 'Service Provider' AND a.profile_id = sp.spsid
         LEFT JOIN categories cat ON sp.category_id = cat.category_id
         WHERE a.gmail = $1`,
        [req.user.gmail]
      );

      res.json({
        account_id: req.user.account_id,
        gmail: req.user.gmail,
        displayName: req.user.name,
        photos: req.user.photo ? [{ value: req.user.photo }] : undefined,
        profiles: profilesResult.rows
      });
    } catch (err) {
      console.error('Error fetching profiles:', err);
      res.status(500).json({ error: 'Failed to fetch profiles' });
    } 
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});
// Add new profile
router.post('/add-profile', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { profileType, name, categoryId } = req.body;

  try {
    if (profileType === 'Customer') {
      const newCustomer = await req.app.locals.pool.query(
        `INSERT INTO customer (username) VALUES ($1) RETURNING customer_id`,
        [name]
      );
      const customerId = newCustomer.rows[0].customer_id;

      await req.app.locals.pool.query(
        `INSERT INTO accounts (gmail, profile_type, profile_id) 
         VALUES ($1, 'Customer', $2)`,
        [req.user.gmail, customerId]
      );
    } else if (profileType === 'Service Provider') {
      const newServiceProvider = await req.app.locals.pool.query(
        `INSERT INTO service_provider (spid, category_id, name, status) 
         VALUES ($1, $2, $3, 'Not Verified') RETURNING spsid`,
        [`sp_${Date.now()}`, categoryId, name]
      );
      const spsid = newServiceProvider.rows[0].spsid;

      await req.app.locals.pool.query(
        `INSERT INTO accounts (gmail, profile_type, profile_id) 
         VALUES ($1, 'Service Provider', $2)`,
        [req.user.gmail, spsid]
      );
    } else {
      return res.status(400).json({ error: 'Invalid profile type' });
    }

    res.json({ message: 'Profile created successfully' });
  } catch (err) {
    console.error('Error creating profile:', err);
    res.status(500).json({ error: 'Failed to create profile' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    req.session.destroy(() => {
      res.json({ message: 'Logged out' });
    });
  });
});

// Get categories for Service Provider profiles
router.get('/categories', async (req, res) => {
  try {
    const result = await req.app.locals.pool.query(
      `SELECT category_id, category_name FROM categories`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

module.exports = router;