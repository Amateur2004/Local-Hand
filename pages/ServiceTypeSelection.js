// client/src/components/ServiceTypeSelection.js
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const ServiceTypeSelection = () => {
  const [selectedType, setSelectedType] = useState('');
  const navigate = useNavigate();

  const serviceTypes = [
    'Customer',
    'Electrician',
    'Plumbing',
    'Cleaning',
    'Salon',
    'Carpentry',
    'Appliance Repair',
    'Pest Control',
    'Painting',
    'Home Renovation',
    'Moving & Transport',
    'Verifier',
    'Support Staff'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Direct to appropriate form
    if (['Customer', 'Verifier', 'Support Staff'].includes(selectedType)) {
      navigate('/complete-profile', { 
        state: { profileType: selectedType } 
      });
    } else {
      navigate('/service-provider-form', {
        state: { profileType: selectedType }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Select Your Profile Type
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                I want to register as:
              </label>
              <div className="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {serviceTypes.map((type) => (
                  <div key={type} className="flex items-center">
                    <input
                      id={type}
                      name="serviceType"
                      type="radio"
                      checked={selectedType === type}
                      onChange={() => setSelectedType(type)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <label htmlFor={type} className="ml-3 block text-sm font-medium text-gray-700">
                      {type}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={!selectedType}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  !selectedType ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Continue
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ServiceTypeSelection;