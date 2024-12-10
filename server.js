const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { OAuth2Client } = require('google-auth-library');
const admin = require('firebase-admin');

// Initialize environment variables
dotenv.config();

// Initialize Firestore
admin.initializeApp({
    credential: admin.credential.applicationDefault(),
});
const db = admin.firestore();

// Google OAuth client
const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
);

const app = express();
app.use(bodyParser.json());

// Route to handle Google OAuth
app.post('/auth/google', async (req, res) => {
    const { token } = req.body;

    try {
        // Verify the Google token
        const ticket = await oauth2Client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const userId = payload['sub'];
        const email = payload['email'];
        const name = payload['name'];

        // Store user data in Firestore
        const userRef = db.collection('users').doc(userId);
        await userRef.set({ email, name }, { merge: true });

        res.status(200).send({ message: 'User authenticated successfully', userId });
    } catch (error) {
        console.error(error);
        res.status(400).send({ error: 'Authentication failed' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

