import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/login';
import Profile from './pages/profile';
import ServiceTypeSelection from './pages/ServiceTypeSelection';
import ServiceProviderForm from './pages/ServiceProviderForm';


// Placeholder components for future routes
const CompleteProfile = () => <div>Complete Profile Page (To Be Implemented)</div>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/service-type-selection" element={<ServiceTypeSelection />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />
        <Route path="/service-provider-form" element={<ServiceProviderForm />} />
        <Route path="/" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
