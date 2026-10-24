// Catch-all proxy: handles /api/sarvam/<anything> on Vercel.
// The widget calls: GET /api/sarvam/orgs/{org}/workspaces/{ws}/apps/{app}/url?...
const UPSTREAM = "https://apps.sarvam.ai/api/app-runtime/";

module.exports = async (req, res) => {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "SARVAM_API_KEY is missing in Vercel Environment Variables" });
  }

  // Path segments come from the [...path] filename (array or string).
  const segs = Array.isArray(req.query.path) ? req.query.path : [req.query.path || ""];
  const path = segs.map(encodeURIComponent).join("/");

  // Forward the original query string, minus Vercel's injected "path" param.
  const incoming = new URL(req.url, "http://localhost");
  incoming.searchParams.delete("path");
  const qs = incoming.searchParams.toString();
  const url = UPSTREAM + path + (qs ? "?" + qs : "");

  try {
    const headers = { "X-API-Key": apiKey };
    if (req.headers["content-type"]) headers["Content-Type"] = req.headers["content-type"];

    let body;
    if (!["GET", "HEAD"].includes(req.method) && req.body !== undefined) {
      body = typeof req.body === "string" || Buffer.isBuffer(req.body) ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(url, { method: req.method, headers, body });
    const text = await response.text();

    res.status(response.status);
    res.setHeader("Content-Type", response.headers.get("content-type") || "application/json");
    return res.send(text);
  } catch (error) {
    console.error("Sarvam proxy error:", error.message);
    return res.status(502).json({ error: "Failed to connect to Sarvam API" });
  }
};
