import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import Friends from './pages/Friends';
import Feed from './pages/Feed';
import Login from './pages/Login';
import AdminPage from './pages/Admin';
import { motion, AnimatePresence } from 'motion/react';
import { SessionProvider } from './context/SessionContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Simple placeholder components for other routes
const Safety = () => <Placeholder title="Safety Guide" description="Learn about blood alcohol concentration, pacing, and safe consumption guidelines." />;
const Support = () => <Placeholder title="Support Center" description="Need help? Browse our FAQ or contact our health moderation team." />;

const Placeholder = ({ title, description }: { title: string, description: string }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="h-[60vh] flex flex-col items-center justify-center text-center max-w-lg mx-auto"
  >
    <div className="w-16 h-16 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center mb-6">
      <div className="w-4 h-4 bg-brand-primary rounded-full animate-pulse" />
    </div>
    <h1 className="text-2xl font-black font-display text-on-surface mb-4">{title}</h1>
    <p className="text-on-surface-variant text-sm leading-relaxed">{description}</p>
    <button className="mt-8 px-6 py-2 border border-brand-primary text-brand-primary rounded-lg font-bold font-display text-sm hover:bg-brand-primary/5 transition-all">
      Upgrade Plan
    </button>
  </motion.div>
);

const AuthenticatedApp = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-surface flex items-center justify-center text-white">Loading...</div>;
  }

  if (!currentUser) {
    return <Login />;
  }

  return (
    <Router>
      <Layout>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Analytics />} />
            <Route path="/session" element={<Dashboard />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/friends" element={<Friends />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/safety" element={<Safety />} />
            <Route path="/support" element={<Support />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </Layout>
    </Router>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <SessionProvider>
        <AuthenticatedApp />
      </SessionProvider>
    </AuthProvider>
  );
}
