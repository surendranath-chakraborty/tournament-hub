const admin = require('firebase-admin');

// Only initialize once
if (!admin.apps.length) {
    // Firebase credentials come from environment variable as JSON string
    // In .env: FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":...}
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log('Firebase Admin initialized');
    } catch (err) {
        console.error('Firebase Admin init failed:', err.message);
        console.error('Make sure FIREBASE_SERVICE_ACCOUNT is set in .env');
    }
}

module.exports = admin;