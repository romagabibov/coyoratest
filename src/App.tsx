import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';
import { AuthProvider } from './context/AuthContext';
import './i18n';
import Layout from './components/Layout';
import Home from './pages/Home';
import EventsList from './pages/EventsList';
import Designers from './pages/Designers';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Legal from './pages/Legal';
import EventDetails from './pages/EventDetails';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Education from './pages/Education';
import Agencies from './pages/Agencies';
import Careers from './pages/Careers';
import Feed from './pages/Feed';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="events" element={<EventsList />} />
            <Route path="designers" element={<Designers />} />
            <Route path="education" element={<Education />} />
            <Route path="agencies" element={<Agencies />} />
            <Route path="vacancies" element={<Careers />} />
            <Route path="internships" element={<Careers />} />
            <Route path="volunteers" element={<Careers />} />
            <Route path="feed" element={<Feed />} />
            <Route path="login" element={<Login />} />
            <Route path="onboarding" element={<Onboarding />} />
            <Route path="privacy" element={<Legal />} />
            <Route path="terms" element={<Legal />} />
            <Route path="cookies" element={<Legal />} />
            <Route path="event/:id" element={<EventDetails />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="admin" element={<AdminDashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
