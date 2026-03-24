import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { signInWithGoogle, firebaseSignOut } from '../firebase';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

axios.defaults.baseURL = '/api';

export function AuthProvider({ children }) {
  var [user, setUser] = useState(null);
  var [loading, setLoading] = useState(true);

  // Restore session from localStorage on first load
  useEffect(function () {
    var stored = localStorage.getItem('th_user');
    if (stored) {
      try {
        var parsed = JSON.parse(stored);
        setUser(parsed);
        axios.defaults.headers.common['Authorization'] = 'Bearer ' + parsed.token;
      } catch {
        localStorage.removeItem('th_user');
      }
    }
    setLoading(false);
  }, []);

  function _persist(data) {
    localStorage.setItem('th_user', JSON.stringify(data));
    axios.defaults.headers.common['Authorization'] = 'Bearer ' + data.token;
    setUser(data);
  }

  // ── Email/password login ──────────────────────────────────
  async function login(email, password) {
    var { data } = await axios.post('/auth/login', { email, password });
    _persist(data);
    return data;
  }

  // ── Email/password register ───────────────────────────────
  async function register(formData) {
    var { data } = await axios.post('/auth/register', formData);
    _persist(data);
    return data;
  }

  // ── Google Sign-In ────────────────────────────────────────
  // role = null means existing user (login flow)
  // role = 'host' or 'player' means new user (register flow)
  async function googleAuth(role) {
    // Step 1: Open Google popup, get Firebase ID token
    var { idToken } = await signInWithGoogle();

    // Step 2: Send token to our backend to verify and create/find user
    try {
      var { data } = await axios.post('/auth/google', { idToken, role });
      _persist(data);
      return data;
    } catch (err) {
      // Backend says ROLE_REQUIRED — new user needs to pick a role
      if (err.response && err.response.data && err.response.data.message === 'ROLE_REQUIRED') {
        // Store token temporarily so we can retry with a role
        _pendingGoogleToken = idToken;
        return 'ROLE_REQUIRED';
      }
      throw err;
    }
  }

  // Called after user picks a role for new Google account
  async function googleAuthWithRole(role) {
    var tokenToUse = _pendingGoogleToken;
    _pendingGoogleToken = null;
    var { data } = await axios.post('/auth/google', { idToken: tokenToUse, role });
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

// Module-level temp storage for pending Google token
var _pendingGoogleToken = null;