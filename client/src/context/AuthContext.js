import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { signInWithGoogle, handleRedirectResult, firebaseSignOut } from '../firebase';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

axios.defaults.baseURL = process.env.REACT_APP_API_URL || '/api';

// Temp storage for pending Google token (role selection flow)
var _pendingGoogleToken = null;
// Temp storage for role (set before redirect)
var _pendingRole = null;

export function AuthProvider({ children }) {
  var [user, setUser] = useState(null);
  var [loading, setLoading] = useState(true);
  var [googleLoading, setGoogleLoading] = useState(false);

  useEffect(function () {
    // 1. Restore existing session
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

    // 2. Check if we just came back from a Google redirect
    setGoogleLoading(true);
    handleRedirectResult().then(function (result) {
      if (!result) {
        setLoading(false);
        setGoogleLoading(false);
        return;
      }

      // We got a token from redirect — now send to backend
      var role = _pendingRole || localStorage.getItem('th_pending_role') || null;

      axios.post('/auth/google', { idToken: result.idToken, role: role })
        .then(function (res) {
          _persist(res.data);
          localStorage.removeItem('th_pending_role');
          _pendingRole = null;
          // Redirect to dashboard
          window.location.href = '/dashboard';
        })
        .catch(function (err) {
          var msg = err.response && err.response.data && err.response.data.message;
          if (msg === 'ROLE_REQUIRED') {
            // Store token, redirect to role-pick page
            _pendingGoogleToken = result.idToken;
            localStorage.setItem('th_pending_token', result.idToken);
            window.location.href = '/pick-role';
          }
        })
        .finally(function () {
          setLoading(false);
          setGoogleLoading(false);
        });
    }).catch(function () {
      setLoading(false);
      setGoogleLoading(false);
    });
  }, []);

  function _persist(data) {
    localStorage.setItem('th_user', JSON.stringify(data));
    axios.defaults.headers.common['Authorization'] = 'Bearer ' + data.token;
    setUser(data);
  }

  async function login(email, password) {
    var { data } = await axios.post('/auth/login', { email, password });
    _persist(data);
    return data;
  }

  async function register(formData) {
    var { data } = await axios.post('/auth/register', formData);
    _persist(data);
    return data;
  }

  // Called when user clicks "Sign in with Google"
  // role = null for login, 'host'/'player' for register
  async function googleAuth(role) {
    if (role) {
      // Save role so we can use it after redirect comes back
      _pendingRole = role;
      localStorage.setItem('th_pending_role', role);
    }
    // This triggers redirect — page will reload after Google auth
    await signInWithGoogle();
    // Code below only runs in local dev popup mode
    return null;
  }

  // Called after user picks role on /pick-role page
  async function googleAuthWithRole(role) {
    var token = _pendingGoogleToken || localStorage.getItem('th_pending_token');
    if (!token) throw new Error('No pending Google token. Please try signing in again.');

    var { data } = await axios.post('/auth/google', { idToken: token, role });
    _persist(data);
    localStorage.removeItem('th_pending_token');
    _pendingGoogleToken = null;
    return data;
  }

  async function logout() {
    try { await firebaseSignOut(); } catch { }
    localStorage.removeItem('th_user');
    localStorage.removeItem('th_pending_role');
    localStorage.removeItem('th_pending_token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  }

  function updateUser(updated) {
    var merged = Object.assign({}, user, updated);
    localStorage.setItem('th_user', JSON.stringify(merged));
    setUser(merged);
  }

  return React.createElement(AuthContext.Provider, {
    value: {
      user, loading, googleLoading,
      login, register, logout, updateUser,
      googleAuth, googleAuthWithRole,
    },
  }, children);
}