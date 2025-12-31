import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState('');

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const msg = query.get('message');
    if (msg) {
      setMessage(decodeURIComponent(msg));
    }
  }, [location]);

  const handleGoogleAuth = (authType) => {
    window.location.href = `http://localhost:5000/auth/google?authType=${authType}`;
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Welcome</h2>
      <div style={styles.card}>
        <h3 style={styles.subtitle}>Login or Sign Up</h3>
        {message && <p style={styles.message}>{message}</p>}
        <button 
          onClick={() => handleGoogleAuth('login')}
          style={styles.googleButton}
        >
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" 
            alt="Google logo" 
            style={styles.googleLogo}
          />
          Login with Existing Account
        </button>
        <button 
          onClick={() => handleGoogleAuth('signup')}
          style={styles.googleButton}
        >
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" 
            alt="Google logo" 
            style={styles.googleLogo}
          />
          Sign Up with New Account
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    fontFamily: "'Roboto', sans-serif",
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 500,
    color: '#333',
    marginBottom: '1rem',
  },
  card: {
    padding: '2.5rem',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    backgroundColor: 'white',
    textAlign: 'center',
    width: '100%',
    maxWidth: '400px',
  },
  subtitle: {
    fontSize: '1.5rem',
    fontWeight: 400,
    color: '#555',
    marginBottom: '1.5rem',
  },
  message: {
    color: '#dc3545',
    fontSize: '1rem',
    marginBottom: '1rem',
  },
    googleButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '12px 20px',
    backgroundColor: '#4285F4',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 500,
    margin: '0.5rem 0',
    width: '100%',
    transition: 'background-color 0.2s',
  },
  googleLogo: {
    width: '24px',
    height: '24px',
  },
};

export default Login;