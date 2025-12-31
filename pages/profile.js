import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Profile = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState('');

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const msg = query.get('message');
    if (msg) {
      setMessage(decodeURIComponent(msg));
    }
    const fetchUser = async () => {
      try {
        const response = await fetch('http://localhost:5000/auth/user', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Not authenticated');
        }

        const userData = await response.json();
        console.log('User data:', userData); // Debug log
        setUser(userData);
      } catch (error) {
        console.error('Fetch user error:', error);
        navigate('/login');
      }
    };

    fetchUser();
  }, [navigate, location]);

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };
  const handleAddProfile = () => {
    navigate('/service-type-selection');
  };

  // Generate initial-based avatar if no photo
  const getInitialAvatar = (name) => {
    const initial = name ? name.charAt(0).toUpperCase() : 'U';
    return (
      <div style={styles.initialAvatar}>
        {initial}
      </div>
    );
  };

  if (!user) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Profiles</h2>
        {message && <p style={styles.message}>{message}</p>}
        <div style={styles.profilesContainer}>
        {user.profiles && user.profiles.length > 0 ? (
            user.profiles.map((profile, index) => (
              <div key={index} style={styles.profileItem}>
                {user.photos?.[0]?.value ? (
                  <div style={styles.avatarWrapper}>
            <img
                src={user.photos[0].value}
                alt="Profile"
                style={styles.avatar}
            />
             <span style={styles.profileType}>{profile.display_type}</span>
             </div>
          ) : (
            <div style={styles.avatarWrapper}>
                    {getInitialAvatar(profile.name)}
                    <span style={styles.profileType}>{profile.display_type}</span>
                  </div>
          )}
          <h4 style={styles.profileName}>{profile.name}</h4>
              </div>
            ))
          ) : (
            <p>No profiles found.</p>
          )}
          <div style={styles.profileItem} onClick={handleAddProfile}>
            <div style={styles.addProfile}>
              <span style={styles.plusSign}>+</span>
            </div>
            <h4 style={styles.profileName}>Add Profile</h4>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={styles.logoutButton}
        >
          Logout
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
  card: {
    padding: '2.5rem',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    backgroundColor: 'white',
    textAlign: 'center',
    width: '100%',
    maxWidth: '600px',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 500,
    color: '#333',
    marginBottom: '1.5rem',
  },
  message: {
    color: '#dc3545',
    fontSize: '1rem',
    marginBottom: '1rem',
  },
  profilesContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  profileItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '120px',
  },
  avatarWrapper: {
    position: 'relative',
    width: '120px',
    height: '120px',
  },
  avatar: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #e0e0e0',
  },
  initialAvatar: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    backgroundColor: '#4285F4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '3rem',
    fontWeight: 500,
    color: 'white',
    border: '2px solid #e0e0e0',
  },
  profileType: {
    position: 'absolute',
    bottom: '10px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color: 'white',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '0.8rem',
    fontWeight: 500,
  },
  profileName: {
    fontSize: '1rem',
    fontWeight: 500,
    color: '#333',
    marginTop: '0.5rem',
    textAlign: 'center',
  },
  addProfile: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    backgroundColor: '#e0e0e0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    border: '2px dashed #666',
  },
  plusSign: {
    fontSize: '3rem',
    color: '#666',
  },
  logoutButton: {
    padding: '12px 24px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 500,
    transition: 'background-color 0.2s',
  },
  loading: {
    fontSize: '1.2rem',
    color: '#666',
  },
};

export default Profile;