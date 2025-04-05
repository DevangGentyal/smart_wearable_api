import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
// Import Firebase
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { doc, updateDoc, getDoc } from "firebase/firestore";

// Your Firebase configuration - you'll need to fill this in
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function VerificationPage() {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationStep, setVerificationStep] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [errorType, setErrorType] = useState(""); // Added to track specific error types
  const [patientId, setPatientId] = useState("");
  const [invitedEmail, setInvitedEmail] = useState(""); // Added to show the email that was actually invited
  const location = useLocation();
  const navigate = useNavigate();

  // Extract parameters from URL and verify if needed
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const tokenParam = queryParams.get("token");
    const emailParam = queryParams.get("email");
    const verifiedParam = queryParams.get("verified");

    if (tokenParam) {
      setToken(tokenParam);
    }

    // If we have email and verified=true from the URL, proceed with Firebase verification
    if (emailParam && verifiedParam === "true") {
      setEmail(emailParam);
      verifyWithFirebase(tokenParam, emailParam);
    }
  }, [location]);


// VerifyFirebase
const verifyWithFirebase = async (tokenParam, emailParam) => {
    try {
      console.log("Step 1: Fetching guardian_invite with token:", tokenParam);
      setVerificationStep("1. Checking invitation link validity");
  
      const docRef = doc(db, "guardian_invites", tokenParam);
      const docSnap = await getDoc(docRef);
  
      if (!docSnap.exists()) {
        console.error("Invalid or expired token");
        setErrorType("invalid_token");
        throw new Error("This invitation link is invalid or has expired.");
      }
  
      setVerificationStep("2. Validating invitation details");
      const inviteData = docSnap.data();
      console.log("Invite data retrieved:", inviteData);
  
      const guardianEmail = inviteData.guardian_email;
      setInvitedEmail(guardianEmail);
  
      setVerificationStep("3. Checking email authorization");
      if (guardianEmail.toLowerCase() !== emailParam.toLowerCase()) {
        console.error("Email mismatch:", guardianEmail, "vs", emailParam);
        setErrorType("email_mismatch");
        throw new Error("The email you verified with doesn't match the invited email address.");
      }
  
      setVerificationStep("4. Retrieving patient information");
      const patientId = inviteData.patient_id;
  
      if (!patientId) {
        console.error("Missing patient_id in invite");
        setErrorType("missing_patient");
        throw new Error("Patient information is missing from this invitation.");
      }
  
      setPatientId(patientId);
      console.log("Patient ID retrieved:", patientId);
  
      setVerificationStep("5. Validating guardian registration");
      const guardiansRef = collection(db, "guardians");
      const q = query(guardiansRef, where("email", "==", guardianEmail));
      const querySnapshot = await getDocs(q);
  
      if (querySnapshot.empty) {
        console.error("Guardian not registered with email:", guardianEmail);
        setErrorType("guardian_not_registered");
        throw new Error("Create an Account first on Smart Wearable, then come back to this link for acceptance.");
      }
  
      const guardianDoc = querySnapshot.docs[0];
      const guardianDocId = guardianDoc.id;
      const guardianDocRef = doc(db, "guardians", guardianDocId);
  
      console.log("Guardian found, updating patient_id...");
      await updateDoc(guardianDocRef, {
        patient_id: patientId
      });
  
      console.log("Guardian updated successfully with patient_id");
  
      setVerificationStep("6. Verification successful");
      setIsVerified(true);
  
    } catch (error) {
      console.error("Verification error:", error);
      setVerificationError(error.message || "An unknown error occurred.");
    }
  };

  // Handle OAuth verification
  const handleVerify = () => {
    setLoading(true);

    // Build the Google OAuth URL
    const googleOAuthUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    const redirectUri = `${window.location.origin}/oauth-callback`;

    // The parameters needed for Google OAuth
    const params = new URLSearchParams({
      client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "email profile",
      state: token, // Pass token as state to retrieve it after OAuth flow
      access_type: "offline",
      prompt: "consent",
    });

    // Redirect to Google for authentication
    window.location.href = `${googleOAuthUrl}?${params.toString()}`;
  };

  // Function to render appropriate error guidance based on error type
  const renderErrorGuidance = () => {
    switch(errorType) {
      case "invalid_token":
        return (
          <>
            <p>Please ask the patient or administrator to send you a new invitation.</p>
          </>
        );
      case "email_mismatch":
        return (
          <>
            <p>You signed in with: <strong>{email}</strong></p>
            <p>But this invitation was sent to: <strong>{invitedEmail}</strong></p>
            <p>Please sign in with the email address that received the invitation, or ask for a new invitation to be sent to your current email.</p>
          </>
        );
      case "missing_patient":
        return (
            <>
              <p>There was an issue with the patient information in this invitation.</p>
            </>
          );
      case "guardian_not_registered":
        return (
          <>
            
          </>
        );
      default:
        return (
          <p>An unexpected error occurred during verification. Please try again later or contact support.</p>
        );
    }
  };

  return (
    <div className="verification-container">
      <div className="verification-card">
        {isVerified ? (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h2>Email Verified Successfully!</h2>
            <p>
              Your email has been successfully verified as a guardian.
            </p>
            <div className="verification-details">
              <center>
                <strong>You can close this page and return to the app.</strong>
              </center>
            </div>
          </div>
        ) : verificationError ? (
          <div className="error-message">
            <div className="error-icon">✗</div>
            <h2>Verification Failed</h2>
            <p>{verificationError}</p>
            {renderErrorGuidance()}
            <button className="verify-button" onClick={() => window.location.href = '/?token='+token}>
              Try Again
            </button>
          </div>
        ) : verificationStep ? (
          <div className="processing-message">
            <div className="loader"></div>
            <h2>Verifying Email</h2>
            <p>Please wait while we complete your verification...</p>
            <p className="verification-step">Current step: {verificationStep}</p>
          </div>
        ) : (
          <div>
            <h1><strong>Smart Wearable</strong></h1>
            <h1>Verify Your Email</h1>
            <p>
              Thank you for accepting the guardian invitation. Please verify your
              email to continue.
            </p>
            <button
              className="verify-button"
              onClick={handleVerify}
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify Email with Google"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default VerificationPage;