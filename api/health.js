// app.js calls /api/health for the "Backend reachable" and "API key set" checks.
module.exports = (req, res) => {
  res.status(200).json({ ok: true, keyConfigured: Boolean(process.env.SARVAM_API_KEY) });
};
