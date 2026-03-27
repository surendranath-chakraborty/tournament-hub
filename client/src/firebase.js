import { initializeApp } from 'firebase/app';
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    signOut,
} from 'firebase/auth';

const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

// Detect mobile or production — use redirect, use popup only in local dev
var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
var isProd = process.env.NODE_ENV === 'production';

export async function signInWithGoogle() {
    if (isMobile || isProd) {
        // Redirect flow — works on all servers including Render
        await signInWithRedirect(auth, provider);
        // This line is never reached — page redirects away
        return null;
    } else {
        // Popup flow — only in local development
        var result = await signInWithPopup(auth, provider);
        var idToken = await result.user.getIdToken(true); // true = force refresh
        return { idToken, user: result.user };
    }
}

// Call this on app load to handle the redirect result
export async function handleRedirectResult() {
    try {
        var result = await getRedirectResult(auth);
        if (!result) return null; // no redirect happened
        var idToken = await result.user.getIdToken(true);
        return { idToken, user: result.user };
    } catch (err) {
        console.error('Redirect result error:', err);
        return null;
    }
}

export async function firebaseSignOut() {
    await signOut(auth);
}

export { auth };