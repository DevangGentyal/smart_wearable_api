import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

function OAuthCallback() {
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    async function handleOAuthCallback() {
      try {
        const queryParams = new URLSearchParams(location.search);
        const code = queryParams.get("code");
        const state = queryParams.get("state"); // The token we passed as state

        // Validate presence of code and state
        if (!code || !state) {
          setError("Invalid or missing authentication parameters.");
          setProcessing(false);
          return;
        }

        // Exchange code for tokens (this happens on your backend for security)
        const backendUrl =
          process.env.REACT_APP_API_URL || "http://smart-wearable-api.vercel.app:5000";
        const tokenResponse = await axios.post(
          `${backendUrl}/api/oauth/token`,
          { code }
        );

        // Get user info with the access token
        const userInfoResponse = await axios.get(
          "https://www.googleapis.com/oauth2/v2/userinfo",
          {
            headers: {
              Authorization: `Bearer ${tokenResponse.data.access_token}`,
            },
          }
        );

        // Send verification to your backend
        await axios.post(`${backendUrl}/api/verify-email`, {
          token: state,
          email: userInfoResponse.data.email,
        });

        // Redirect back to verification page with success parameters
        navigate(
          `/?token=${state}&email=${userInfoResponse.data.email}&verified=true`
        );
      } catch (err) {
        console.error("OAuth callback error:", err);
        setError(err.message || "Authentication failed");
        setProcessing(false);
      }
    }

    handleOAuthCallback();
  }, [location, navigate]);

  if (error) {
    return (
      <div className="verification-container">
        <div className="verification-card">
          <h1>Verification Failed</h1>
          <p>{error}</p>
          <button
            onClick={() =>
              navigate(
                `/?token=${new URLSearchParams(location.search).get("state")}`
              )
            }
            className="verify-button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="verification-container">
      <div className="verification-card">
        <h1>Processing Verification</h1>
        <div className="loader"></div>
        <p>Please wait while we verify your email...</p>
      </div>
    </div>
  );
}

export default OAuthCallback;
