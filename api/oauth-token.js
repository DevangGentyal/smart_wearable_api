const axios = require("axios");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  try {
    const { code } = req.body;

    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.REDIRECT_URI,
        grant_type: "authorization_code",
      }
    );

    res.status(200).json(tokenResponse.data);
  } catch (error) {
    console.error("OAuth Token Error:", error.response?.data || error.message);
    res.status(500).json({
      error: "Token exchange failed",
      details: error.response?.data || error.message,
    });
  }
}
