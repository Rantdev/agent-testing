// Vercel serverless function: forwards /api/sarvam/* to Sarvam and adds the API key.
const UPSTREAM = "https://apps.sarvam.ai/api/app-runtime/";

module.exports = async (req, res) => {
  const allowed = process.env.ALLOWED_ORIGIN; // optional, e.g. https://my-agents.vercel.app
  if (allowed && req.headers.origin && req.headers.origin !== allowed) {
    return res.status(403).json({ error: "Origin not allowed" });
  }

  if (!process.env.SARVAM_API_KEY) {
    return res.status(500).json({ error: "SARVAM_API_KEY is not set on the server" });
  }

  const rest = req.url.replace(/^\/api\/sarvam\//, "");

  let body;
  if (!["GET", "HEAD"].includes(req.method) && req.body !== undefined) {
    body =
      typeof req.body === "string" || Buffer.isBuffer(req.body)
        ? req.body
        : JSON.stringify(req.body);
  }

  try {
    const upstream = await fetch(UPSTREAM + rest, {
      method: req.method,
      headers: {
        "X-API-Key": process.env.SARVAM_API_KEY,
        "Content-Type": req.headers["content-type"] || "application/json",
      },
      body,
    });

    res.status(upstream.status);
    res.setHeader(
      "Content-Type",
      upstream.headers.get("content-type") || "application/json"
    );
    res.send(Buffer.from(await upstream.arrayBuffer()));
  } catch (e) {
    res.status(502).json({ error: "Could not reach Sarvam" });
  }
};
