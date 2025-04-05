const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../build')));
}

// Database replacement (for demo purposes)
// In production, use a real database like MongoDB, PostgreSQL, etc.
const verifications = {};

// OAuth token exchange endpoint
app.post('/api/oauth/token', async (req, res) => {
    try {
      const { code } = req.body;
      
      // Add debug logs
      console.log('Received code:', code);
      console.log('Using client ID:', process.env.GOOGLE_CLIENT_ID);
      console.log('Using redirect URI:', process.env.REDIRECT_URI);
      
      const tokenRequestData = {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.REDIRECT_URI,
        grant_type: 'authorization_code'
      };
      
      console.log('Token request data:', tokenRequestData);
      
      const tokenResponse = await axios.post(
        'https://oauth2.googleapis.com/token',
        tokenRequestData
      );
      
      res.json(tokenResponse.data);
    } catch (error) {
      // Enhanced error logging
      console.error('Error exchanging code for token:');
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
      
      res.status(500).json({ 
        error: 'Failed to exchange authorization code',
        details: error.response?.data || error.message
      });
    }
  });

// Email verification endpoint
app.post('/api/verify-email', (req, res) => {
  try {
    const { token, email } = req.body;
    
    if (!token || !email) {
      return res.status(400).json({ error: 'Token and email are required' });
    }
    
    // Store verification in our "database"
    verifications[token] = { 
      email, 
      verifiedAt: new Date().toISOString() 
    };
    
    console.log(`Verified token ${token} for email ${email}`);
    
    // Here you would update your real database
    // e.g., User.findOneAndUpdate({ verificationToken: token }, { email, emailVerified: true })
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

// Status endpoint to check if a token has been verified
app.get('/api/verification-status/:token', (req, res) => {
  const { token } = req.params;
  
  if (verifications[token]) {
    res.json(verifications[token]);
  } else {
    res.status(404).json({ error: 'Verification not found' });
  }
});

// In production, serve the React app for any other routes
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});