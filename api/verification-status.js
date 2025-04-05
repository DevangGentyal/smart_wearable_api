const verifications = {}; // Again, resets every call

export default function handler(req, res) {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: "Token required" });
  }

  if (verifications[token]) {
    return res.status(200).json(verifications[token]);
  }

  return res.status(404).json({ error: "Not verified" });
}
