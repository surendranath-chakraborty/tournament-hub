import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

// ── Your Firebase project config ─────────────────────────────
// Replace these values with your actual Firebase project settings
// Go to: Firebase Console → Project Settings → General → Your Apps → Web App
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Initialize Firebase (only once)
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Force account selection every time so user can switch accounts
provider.setCustomParameters({ prompt: 'select_account' });

// ── Sign in with Google popup ─────────────────────────────────
export async function signInWithGoogle() {
    const result = await signInWithPopup(auth, provider);
    // Get the Firebase ID token to send to our backend
    const idToken = await result.user.getIdToken();
    return {
        idToken,
        user: result.user,
    };
}

// ── Sign out from Firebase ────────────────────────────────────
export async function firebaseSignOut() {
    await signOut(auth);
}

export { auth };