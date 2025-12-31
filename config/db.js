const { Pool } = require('pg');
require('dotenv').config();

console.log('DATABASE_URL:', process.env.DATABASE_URL); // Debug log

const pool = new Pool({
  connectionString: String(process.env.DATABASE_URL),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Test connection
pool.connect()
  .then(() => console.log('Database connected successfully'))
  .catch(err => console.error('Database connection error:', err.stack));

const setupDatabase = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Successfully connected to the database');
    client.release();

    // Drop all tables to reset the database
    await pool.query(`
      DROP TABLE IF EXISTS handled_requests, cancelled_appointments, appointments, 
      pending_requests, pending_appointments, verified_accounts, to_be_verified_profiles, 
      accounts, sub_categories_tags, sub_category_to_service_provider, service_provider, 
      tags, sub_categories, verifiers, support_staff, customer, categories CASCADE;
    `);

    // Customer table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customer (
        customer_id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        phone_no VARCHAR(20), -- Optional
        address TEXT -- Optional
      );
    `);

    // Categories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        category_id SERIAL PRIMARY KEY,
        category_name VARCHAR(100) UNIQUE NOT NULL
      );
    `);

    // Insert main categories
    await pool.query(`
      INSERT INTO categories (category_name) 
      VALUES 
        ('Electrician'), ('Plumber'), ('Carpenter'), ('Women Spa'),
        ('Men Salon'), ('Home Decor'), ('Cleaning')
      ON CONFLICT (category_name) DO NOTHING;
    `);

    // Sub Categories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sub_categories (
        sub_category_id SERIAL PRIMARY KEY,
        category_id INT NOT NULL,
        sub_category_name VARCHAR(100) NOT NULL,
        FOREIGN KEY (category_id) REFERENCES categories(category_id)
      );
    `);

    // Tags table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tags (
        tag_id SERIAL PRIMARY KEY,
        tag_name VARCHAR(100) UNIQUE NOT NULL
      );
    `);

    // Service Provider table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS service_provider (
        spsid SERIAL PRIMARY KEY,
        spid VARCHAR(100) UNIQUE NOT NULL,
        category_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone_no VARCHAR(20),
        address TEXT,
        description TEXT,
        bank_name VARCHAR(255),
        ifsc VARCHAR(50),
        acc_no VARCHAR(50),
        tags TEXT[],
        status VARCHAR(50) CHECK (status IN ('Verified', 'Not Verified', 'Rejected')),
        FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE
      );
    `);

    // Sub Category to Service Provider table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sub_category_to_service_provider (
        sub_category_id INT NOT NULL,
        spsid INT NOT NULL,
        PRIMARY KEY (sub_category_id, spsid),
        FOREIGN KEY (sub_category_id) REFERENCES sub_categories(sub_category_id),
        FOREIGN KEY (spsid) REFERENCES service_provider(spsid)
      );
    `);

    // Sub Categories Tags table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sub_categories_tags (
        sub_category_id INT NOT NULL,
        tag_id INT NOT NULL,
        PRIMARY KEY (sub_category_id, tag_id),
        FOREIGN KEY (sub_category_id) REFERENCES sub_categories(sub_category_id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(tag_id) ON DELETE CASCADE
      );
    `);

    // Verifiers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS verifiers (
        vid SERIAL PRIMARY KEY,
        verifier_name VARCHAR(255) NOT NULL
      );
    `);

    // Support Staff table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS support_staff (
        ssid SERIAL PRIMARY KEY,
        support_staff_name VARCHAR(255) NOT NULL
      );
    `);

    // Accounts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        account_id SERIAL PRIMARY KEY,
        gmail VARCHAR(255) NOT NULL,
        profile_type VARCHAR(50) CHECK (profile_type IN (
          'Customer', 'Electrician', 'Plumber', 'Verifier', 'Support Staff', 'Service Provider'
        )) NOT NULL,
        profile_id INT NOT NULL,
        CONSTRAINT unique_profile UNIQUE (gmail, profile_type)
      );
    `);

    // Trigger function for accounts
    await pool.query(`
      CREATE OR REPLACE FUNCTION check_profile_exists()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.profile_type = 'Customer' THEN
          IF NEW.profile_id != 0 AND NOT EXISTS (SELECT 1 FROM customer WHERE customer_id = NEW.profile_id) THEN
            RAISE EXCEPTION 'Invalid profile_id: No customer with id %', NEW.profile_id;
          END IF;
        ELSIF NEW.profile_type IN ('Service Provider', 'Electrician', 'Plumber') THEN
          IF NOT EXISTS (SELECT 1 FROM service_provider WHERE spsid = NEW.profile_id) THEN
            RAISE EXCEPTION 'Invalid profile_id: No service provider with id %', NEW.profile_id;
          END IF;
        ELSIF NEW.profile_type = 'Verifier' THEN
          IF NOT EXISTS (SELECT 1 FROM verifiers WHERE vid = NEW.profile_id) THEN
            RAISE EXCEPTION 'Invalid profile_id: No verifier with id %', NEW.profile_id;
          END IF;
        ELSIF NEW.profile_type = 'Support Staff' THEN
          IF NOT EXISTS (SELECT 1 FROM support_staff WHERE ssid = NEW.profile_id) THEN
            RAISE EXCEPTION 'Invalid profile_id: No support staff with id %', NEW.profile_id;
          END IF;
        ELSE
          RAISE EXCEPTION 'Unknown profile_type: %', NEW.profile_type;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Trigger on accounts
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger 
          WHERE tgname = 'validate_profile_before_insert' 
          AND tgrelid = 'accounts'::regclass
        ) THEN
          CREATE TRIGGER validate_profile_before_insert
          BEFORE INSERT OR UPDATE ON accounts
          FOR EACH ROW
          EXECUTE FUNCTION check_profile_exists();
        END IF;
      END $$;
    `);

    // To Be Verified Profiles table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS to_be_verified_profiles (
        spsid INT PRIMARY KEY,
        status VARCHAR(50) CHECK (status IN ('Pending', 'Verified', 'Rejected')),
        FOREIGN KEY (spsid) REFERENCES service_provider(spsid)
      );
    `);

    // Verified Accounts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS verified_accounts (
        vid INT NOT NULL,
        spsid INT NOT NULL,
        sub_category_id INT NOT NULL,
        status VARCHAR(50) CHECK (status IN ('Accepted', 'Rejected')),
        PRIMARY KEY (vid, spsid, sub_category_id),
        FOREIGN KEY (vid) REFERENCES verifiers(vid),
        FOREIGN KEY (spsid) REFERENCES service_provider(spsid),
        FOREIGN KEY (sub_category_id) REFERENCES sub_categories(sub_category_id)
      );
    `);

    // Pending Appointments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pending_appointments (
        appt_id SERIAL PRIMARY KEY,
        customer_id INT NOT NULL,
        spsid INT NOT NULL,
        date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        service_type VARCHAR(50) CHECK (service_type IN ('In house', 'Walk in')) NOT NULL,
        appointment_type VARCHAR(50) NOT NULL,
        description TEXT,
        FOREIGN KEY (customer_id) REFERENCES customer(customer_id),
        FOREIGN KEY (spsid) REFERENCES service_provider(spsid)
      );
    `);

    // Pending Requests table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pending_requests (
        appt_id INT PRIMARY KEY,
        FOREIGN KEY (appt_id) REFERENCES pending_appointments(appt_id)
      );
    `);

    // Appointments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        appt_id INT PRIMARY KEY,
        customer_id INT NOT NULL,
        spsid INT NOT NULL,
        date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        service_type VARCHAR(50) CHECK (service_type IN ('In house', 'Walk in')) NOT NULL,
        appointment_type VARCHAR(50) NOT NULL,
        feedback TEXT,
        rating INT CHECK (rating BETWEEN 1 AND 5),
        payment DECIMAL(10, 2),
        FOREIGN KEY (appt_id) REFERENCES pending_appointments(appt_id) ON DELETE CASCADE,
        FOREIGN KEY (customer_id) REFERENCES customer(customer_id),
        FOREIGN KEY (spsid) REFERENCES service_provider(spsid)
      );
    `);

    // Cancelled Appointments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cancelled_appointments (
        appt_id INT PRIMARY KEY,
        customer_id INT NOT NULL,
        spsid INT NOT NULL,
        date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        service_type VARCHAR(50) CHECK (service_type IN ('In house', 'Walk in')) NOT NULL,
        appointment_type VARCHAR(50) NOT NULL,
        description TEXT,
        cancelled_by VARCHAR(50) CHECK (cancelled_by IN ('Customer', 'Service Provider')) NOT NULL,
        cancelled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customer(customer_id),
        FOREIGN KEY (spsid) REFERENCES service_provider(spsid)
      );
    `);

    // Handled Requests table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS handled_requests (
        ssid INT NOT NULL,
        appt_id INT NOT NULL,
        PRIMARY KEY (ssid, appt_id),
        FOREIGN KEY (ssid) REFERENCES support_staff(ssid),
        FOREIGN KEY (appt_id) REFERENCES appointments(appt_id)
      );
    `);

    console.log('✅ All tables created or verified');
  } catch (err) {
    console.error('❌ Database setup failed:', err.stack);
    throw err;
  }
};

module.exports = { pool, setupDatabase };