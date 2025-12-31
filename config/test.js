import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Profile() {
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedSubCategories, setSelectedSubCategories] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    phone_no: '',
    address: '',
    description: '',
    bank_name: '',
    ifsc: '',
    acc_no: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch user data
    fetch('http://localhost:5000/auth/user', { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('Not authenticated');
        return res.json();
      })
      .then(data => setUser(data))
      .catch(err => {
        console.error('Failed to fetch user:', err);
        setError('Failed to load user data. Please log in again.');
        navigate('/login');
      });

    // Fetch categories
    fetch('http://localhost:5000/api/profiles/categories', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error('Failed to fetch categories:', err));

    // Fetch all tags
    fetch('http://localhost:5000/api/profiles/tags', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setTags(data))
      .catch(err => console.error('Failed to fetch tags:', err));
  }, [navigate]);

  useEffect(() => {
    if (selectedRole) {
      // Fetch subcategories using category name
      fetch(`http://localhost:5000/api/profiles/subcategories/${selectedRole}`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => setSubCategories(data))
        .catch(err => console.error('Failed to fetch subcategories:', err));
    }
  }, [selectedRole]);

  const handleRoleChange = (e) => {
    setSelectedRole(e.target.value);
    setSelectedSubCategories([]);
    setSelectedTags([]);
    setFormData({ name: '', phone_no: '', address: '', description: '', bank_name: '', ifsc: '', acc_no: '' });
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubCategoryChange = (subCategoryId) => {
    setSelectedSubCategories(prev => {
      const existing = prev.find(sc => sc.sub_category_id === subCategoryId);
      if (existing) {
        return prev.filter(sc => sc.sub_category_id !== subCategoryId);
      } else {
        return [...prev, { sub_category_id: subCategoryId, min_cost: '0' }];
      }
    });
  };

  const handleTagChange = (tagId) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleMinCostChange = (subCategoryId, value) => {
    setSelectedSubCategories(prev =>
      prev.map(sc =>
        sc.sub_category_id === subCategoryId
          ? { ...sc, min_cost: value }
          : sc
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const profileData = {
        category: selectedRole,
        ...formData,
        sub_categories: selectedSubCategories,
        tags: selectedTags,
      };

      const response = await fetch('http://localhost:5000/api/profiles/create-service-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create profile');
      }

      const data = await response.json();
      alert(data.message);
      // Optionally redirect or refresh data
      navigate('/profile');
    } catch (err) {
      console.error('Error creating profile:', err);
      setError(err.message);
    }
  };

  if (!user) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Welcome, {user.email}</h1>
        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  );
}

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
    width: '100%',
    maxWidth: '600px',
  },
  loading: {
    fontSize: '1.2rem',
    color: '#666',
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: 500,
    color: '#333',
    marginBottom: '0.5rem',
    textAlign: 'center',
  },
  subTitle: {
    fontSize: '1.5rem',
    fontWeight: 500,
    color: '#333',
    marginBottom: '1.5rem',
    textAlign: 'center',
  },
  error: {
    color: '#dc3545',
    fontSize: '1rem',
    marginBottom: '1rem',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#666',
  },
  select: {
    padding: '0.5rem',
    border: '1px solid #ccc',
    borderRadius: '0.375rem',
    fontSize: '1rem',
  },
  input: {
    padding: '0.5rem',
    border: '1px solid #ccc',
    borderRadius: '0.375rem',
    fontSize: '1rem',
    marginTop: '0.25rem',
  },
  textarea: {
    padding: '0.5rem',
    border: '1px solid #ccc',
    borderRadius: '0.375rem',
    fontSize: '1rem',
    marginTop: '0.25rem',
    resize: 'vertical',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginTop: '0.25rem',
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  checkbox: {
    height: '1rem',
    width: '1rem',
  },
  checkboxLabel: {
    fontSize: '0.875rem',
    color: '#666',
  },
  minCostInput: {
    padding: '0.25rem',
    border: '1px solid #ccc',
    borderRadius: '0.375rem',
    width: '100px',
  },
  submitButton: {
    padding: '0.5rem',
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  disabledButton: {
    padding: '0.5rem',
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '0.375rem',
    opacity: 0.5,
    cursor: 'not-allowed',
    fontSize: '1rem',
  },
};

export default Profile;