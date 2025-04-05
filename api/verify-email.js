const verifications = {};

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  const { token, email } = req.body;

  if (!token || !email) {
    return res.status(400).json({ error: "Token and email are required" });
  }

  verifications[token] = {
    email,
    verifiedAt: new Date().toISOString(),
  };

  console.log(`Verified token ${token} for email ${email}`);
  res.status(200).json({ success: true });
}
