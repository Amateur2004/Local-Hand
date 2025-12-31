import React, { useEffect, useState } from 'react';
import axios from 'axios';

const BACKEND = process.env.REACT_APP_BACKEND_URL;

function App() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    user_type: '',
    phone: '',
    location: ''
  });

  useEffect(() => {
    axios.get(`${BACKEND}/auth/user`, { withCredentials: true })
      .then(res => setUser(res.data))
      .catch(() => setUser(null));
  }, []);

  const handleGoogleLogin = () => {
    window.open(`${BACKEND}/auth/google`, "_self");
  };

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async () => {
    try {
      await axios.post(`${BACKEND}/auth/complete-signup`, {
        ...formData,
        googleId: user.googleId
      }, { withCredentials: true });
      alert("Signup complete!");
    } catch (err) {
      alert("Failed to complete signup.");
    }
  };

  return (
    <div style={{ padding: 30 }}>
      <h1>Simple Google Auth App</h1>

      {!user ? (
        <button onClick={handleGoogleLogin}>Sign in with Google</button>
      ) : (
        <div>
          <h3>Welcome, {user.name}</h3>
          <p>Email: {user.email}</p>

          <h4>Complete Signup</h4>
          <input
            placeholder="User type (Customer/Service provider)"
            name="user_type"
            value={formData.user_type}
            onChange={handleChange}
          /><br /><br />
          <input
            placeholder="Phone number"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
          /><br /><br />
          <input
            placeholder="Location"
            name="location"
            value={formData.location}
            onChange={handleChange}
          /><br /><br />
          <button onClick={handleSignup}>Submit</button>
        </div>
      )}
    </div>
  );
}

export default App;
