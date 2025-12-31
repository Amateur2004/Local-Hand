import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const ServiceProviderForm = () => {
  const [subCategories, setSubCategories] = useState([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [filteredTags, setFilteredTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagSearch, setTagSearch] = useState('');
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
  const location = useLocation();
  const { profileType } = location.state || {};

  useEffect(() => {
    if (profileType) {
      // Fetch subcategories based on the selected profile type
      fetch(`http://localhost:5000/api/profiles/subcategories/${profileType}`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          console.log('Subcategories response:', data); // Log the API response
          setSubCategories(data);
        })
        .catch(err => {
          console.error('Failed to fetch subcategories:', err);
          setError('Failed to load subcategories.');
          setSubCategories([]); // Ensure subCategories remains an array on error
        });

      // Fetch all tags
      fetch('http://localhost:5000/api/profiles/tags', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          console.log('Tags response:', data); // Log the API response
          setTags(data);
        })
        .catch(err => {
          console.error('Failed to fetch tags:', err);
          setError('Failed to load tags.');
          setTags([]); // Ensure tags remains an array on error
        });
    }
  }, [profileType]);

  useEffect(() => {
    // Filter tags based on search input
    if (tagSearch) {
      const filtered = tags.filter(tag =>
        tag.tag_name.toLowerCase().startsWith(tagSearch.toLowerCase())
      );
      setFilteredTags(filtered);
    } else {
      setFilteredTags([]);
    }
  }, [tagSearch, tags]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'description' && value.split(/\s+/).length > 250) {
      setError('Description cannot exceed 250 words.');
      return;
    }
    setFormData({ ...formData, [name]: value });
    if (name === 'description') setError(''); // Clear error if within limit
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

  const handleMinCostChange = (subCategoryId, value) => {
    setSelectedSubCategories(prev =>
      prev.map(sc =>
        sc.sub_category_id === subCategoryId
          ? { ...sc, min_cost: value }
          : sc
      )
    );
  };

  const handleTagSelect = (tagId) => {
    if (selectedTags.length >= 5 && !selectedTags.includes(tagId)) {
      setError('You can select up to 5 tags only.');
      return;
    }
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
    setTagSearch('');
    setFilteredTags([]);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedSubCategories.length === 0) {
      setError('Please select at least one sub-category.');
      return;
    }
    if (selectedSubCategories.some(sc => !sc.min_cost || sc.min_cost <= 0)) {
      setError('Please provide a valid minimum cost for each selected sub-category.');
      return;
    }

    const profileData = {
      category: profileType,
      ...formData,
      sub_categories: selectedSubCategories,
      tags: selectedTags,
    };

    try {
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
      navigate('/profile');
    } catch (err) {
      console.error('Error creating profile:', err);
      setError(err.message);
    }
  };

  if (!profileType) {
    return <div className="text-center text-red-500">Profile type not selected. Please go back and select a profile type.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create {profileType} Profile
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phone_no" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <div className="mt-1">
                <input
                  id="phone_no"
                  name="phone_no"
                  type="text"
                  value={formData.phone_no}
                  onChange={handleInputChange}
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <div className="mt-1">
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description (max 250 words)
              </label>
              <div className="mt-1">
                <textarea
                  id="description"
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {formData.description.split(/\s+/).filter(word => word).length}/250 words
              </p>
            </div>

            {/* Subcategories */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Services Offered
              </label>
              <div className="mt-1 space-y-2">
                {Array.isArray(subCategories) && subCategories.length > 0 ? (
                  subCategories.map(subCat => (
                    <div key={subCat.sub_category_id} className="flex items-center space-x-3">
                      <input
                        id={`subcat-${subCat.sub_category_id}`}
                        type="checkbox"
                        checked={selectedSubCategories.some(sc => sc.sub_category_id === subCat.sub_category_id)}
                        onChange={() => handleSubCategoryChange(subCat.sub_category_id)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`subcat-${subCat.sub_category_id}`} className="text-sm text-gray-700">
                        {subCat.sub_category_name}
                      </label>
                      {selectedSubCategories.some(sc => sc.sub_category_id === subCat.sub_category_id) && (
                        <input
                          type="number"
                          placeholder="Min. cost"
                          value={selectedSubCategories.find(sc => sc.sub_category_id === subCat.sub_category_id)?.min_cost || ''}
                          onChange={(e) => handleMinCostChange(subCat.sub_category_id, e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          min="0"
                        />
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No subcategories available for this category.</p>
                )}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="tag-search" className="block text-sm font-medium text-gray-700">
                Tags (Select up to 5)
              </label>
              <div className="mt-1">
                <input
                  id="tag-search"
                  type="text"
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  placeholder="Type to search tags (e.g., 'a')"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              {filteredTags.length > 0 && (
                <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md">
                  {filteredTags.map(tag => (
                    <div
                      key={tag.tag_id}
                      className={`px-3 py-2 cursor-pointer hover:bg-gray-100 flex items-center space-x-2 ${
                        selectedTags.includes(tag.tag_id) ? 'bg-indigo-100' : ''
                      }`}
                      onClick={() => handleTagSelect(tag.tag_id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag.tag_id)}
                        onChange={() => handleTagSelect(tag.tag_id)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">{tag.tag_name}</span>
                    </div>
                  ))}
                </div>
              )}
              {selectedTags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedTags.map(tagId => {
                    const tag = tags.find(t => t.tag_id === tagId);
                    return (
                      <span
                        key={tagId}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                      >
                        {tag?.tag_name}
                        <button
                          type="button"
                          onClick={() => handleTagSelect(tagId)}
                          className="ml-1 inline-flex items-center p-0.5 rounded-full text-indigo-800 hover:bg-indigo-200"
                        >
                          ✕
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bank Details */}
            <div>
              <h3 className="text-lg font-medium text-gray-900">Bank Details</h3>
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="bank_name" className="block text-sm font-medium text-gray-700">
                    Bank Name
                  </label>
                  <div className="mt-1">
                    <input
                      id="bank_name"
                      name="bank_name"
                      type="text"
                      value={formData.bank_name}
                      onChange={handleInputChange}
                      required
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="ifsc" className="block text-sm font-medium text-gray-700">
                    IFSC Code
                  </label>
                  <div className="mt-1">
                    <input
                      id="ifsc"
                      name="ifsc"
                      type="text"
                      value={formData.ifsc}
                      onChange={handleInputChange}
                      required
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="acc_no" className="block text-sm font-medium text-gray-700">
                    Account Number
                  </label>
                  <div className="mt-1">
                    <input
                      id="acc_no"
                      name="acc_no"
                      type="text"
                      value={formData.acc_no}
                      onChange={handleInputChange}
                      required
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Save and Send for Verification
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ServiceProviderForm;