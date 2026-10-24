
const UPSTREAM = "https://apps.sarvam.ai/api/app-runtime/";

module.exports = async (req, res) => {
  const apiKey = process.env.SARVAM_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "SARVAM_API_KEY is missing in Vercel Environment Variables"
    });
  }

  // Remove the /api/sarvam/ prefix from the request URL
  const path = (req.url || "").replace(/^\/api\/sarvam\/?/, "");
  const url = UPSTREAM + path;

  try {
    const headers = {
      "X-API-Key": apiKey
    };

    if (req.headers["content-type"]) {
      headers["Content-Type"] = req.headers["content-type"];
    }

    let body;

    if (!["GET", "HEAD"].includes(req.method) && req.body !== undefined) {
      body =
        typeof req.body === "string" || Buffer.isBuffer(req.body)
          ? req.body
          : JSON.stringify(req.body);
    }

    const response = await fetch(url, {
      method: req.method,
      headers,
      body
    });

    const responseBody = await response.text();

    res.status(response.status);
    res.setHeader(
      "Content-Type",
      response.headers.get("content-type") || "application/json"
    );

    return res.send(responseBody);
  } catch (error) {
    console.error("Sarvam proxy error:", error.message);

    return res.status(502).json({
      error: "Failed to connect to Sarvam API"
    });
  }
};
