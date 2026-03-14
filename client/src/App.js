import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar          from './components/Shared/Navbar';
import Home            from './pages/Home';
import Login           from './pages/Login';
import Register        from './pages/Register';
import Dashboard       from './pages/Dashboard';
import TournamentList  from './pages/TournamentList';
import TournamentDetail from './pages/TournamentDetail';
import CreateTournament from './pages/CreateTournament';
import EditTournament  from './pages/EditTournament';
import HostRegistrations from './pages/HostRegistrations';
import MyRegistrations from './pages/MyRegistrations';
import AITools         from './pages/AITools';
import Profile         from './pages/Profile';

/* Route guards */
function Protected({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;
  if (!user)   return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/"            element={<Home />} />
        <Route path="/login"       element={<Login />} />
        <Route path="/register"    element={<Register />} />
        <Route path="/tournaments" element={<TournamentList />} />
        <Route path="/tournaments/:id" element={<TournamentDetail />} />

        <Route path="/dashboard"   element={<Protected><Dashboard /></Protected>} />
        <Route path="/profile"     element={<Protected><Profile /></Protected>} />
        <Route path="/ai-tools"    element={<Protected><AITools /></Protected>} />

        <Route path="/create-tournament"
          element={<Protected role="host"><CreateTournament /></Protected>} />
        <Route path="/tournaments/:id/edit"
          element={<Protected role="host"><EditTournament /></Protected>} />
        <Route path="/tournaments/:id/registrations"
          element={<Protected role="host"><HostRegistrations /></Protected>} />

        <Route path="/my-registrations"
          element={<Protected role="player"><MyRegistrations /></Protected>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <ToastContainer
          position="bottom-right"
          theme="dark"
          toastStyle={{
            background: '#1A1A26',
            border: '1px solid rgba(245,184,0,0.2)',
            color: '#F0EEE8',
          }}
          progressStyle={{ background: '#F5B800' }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
