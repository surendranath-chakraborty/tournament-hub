import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

// Base URL – the CRA proxy handles /api → localhost:5000 in dev
axios.defaults.baseURL = '/api';

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on first load
  useEffect(() => {
    const stored = localStorage.getItem('th_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        axios.defaults.headers.common['Authorization'] = `Bearer ${parsed.token}`;
      } catch {
        localStorage.removeItem('th_user');
      }
    }
    setLoading(false);
  }, []);

  const _persist = (data) => {
    localStorage.setItem('th_user', JSON.stringify(data));
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUser(data);
  };

  const login = async (email, password) => {
    const { data } = await axios.post('/auth/login', { email, password });
    _persist(data);
    return data;
  };

  const register = async (formData) => {
    const { data } = await axios.post('/auth/register', formData);
    _persist(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('th_user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const updateUser = (updated) => {
    const merged = { ...user, ...updated };
    localStorage.setItem('th_user', JSON.stringify(merged));
    setUser(merged);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
