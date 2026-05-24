import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { signInWithGoogle, firebaseSignOut } from '../firebase';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

axios.defaults.baseURL = process.env.REACT_APP_API_URL || '/api';

export function AuthProvider({ children }) {
  var [user, setUser] = useState(null);
  var [loading, setLoading] = useState(true);

  useEffect(function () {
    try {
      var stored = localStorage.getItem('th_user');
      if (stored) {
        var parsed = JSON.parse(stored);
        setUser(parsed);
        axios.defaults.headers.common['Authorization'] = 'Bearer ' + parsed.token;
      }
    } catch {
      localStorage.removeItem('th_user');
    }
    setLoading(false);
  }, []);

  function _persist(data) {
    localStorage.setItem('th_user', JSON.stringify(data));
    axios.defaults.headers.common['Authorization'] = 'Bearer ' + data.token;
    setUser(data);
  }

  // ── Email login ───────────────────────────────────────────
  async function login(email, password) {
    var { data } = await axios.post('/auth/login', { email, password });
    _persist(data);
    return data;
  }

  // ── Email register ────────────────────────────────────────
  async function register(formData) {
    var { data } = await axios.post('/auth/register', formData);
    _persist(data);
    return data;
  }

  // ── Google Sign In ────────────────────────────────────────
  async function googleAuth(role) {
    // Open Google popup
    var { idToken } = await signInWithGoogle();

    try {
      // Send token to backend
      var { data } = await axios.post('/auth/google', {
        idToken: idToken,
        role: role || null,
      });
      _persist(data);
      return data;
    } catch (err) {
      var msg = err.response && err.response.data && err.response.data.message;
      if (msg === 'ROLE_REQUIRED') {
        // New user needs to pick role - return token for role selection
        return { needsRole: true, idToken: idToken };
      }
      throw err;
    }
  }

  // ── Google Sign In with role (after role selection) ───────
  async function googleAuthWithRole(idToken, role) {
    var { data } = await axios.post('/auth/google', {
      idToken: idToken,
      role: role,
    });
    _persist(data);
    return data;
  }

  // ── Logout ────────────────────────────────────────────────
  async function logout() {
    try { await firebaseSignOut(); } catch { }
    localStorage.removeItem('th_user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  }

  function updateUser(updated) {
    var merged = Object.assign({}, user, updated);
    localStorage.setItem('th_user', JSON.stringify(merged));
    setUser(merged);
  }

  return React.createElement(AuthContext.Provider, {
    value: { user, loading, login, register, logout, updateUser, googleAuth, googleAuthWithRole },
  }, children);
}