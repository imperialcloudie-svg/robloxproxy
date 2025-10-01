import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.text({ type: "*/*" }));

const ACCESS_KEY = process.env.ACCESS_KEY || "changeme";

// Proxy route
app.all("/*", async (req, res) => {
  // Debug: log what Roblox actually sent
  console.log("Incoming headers:", req.headers);

  // 1) Check access key
  if (req.headers["proxy-access-key"] !== ACCESS_KEY) {
    console.error("❌ Forbidden: Invalid Proxy Key");
    return res.status(403).json({
      error: "Forbidden",
      reason: "Invalid proxy-access-key header",
      got: req.headers["proxy-access-key"],
      expected: ACCESS_KEY
    });
  }

  // 2) Check proxy-target
  const target = req.headers["proxy-target"];
  if (!target) {
    console.error("❌ Forbidden: Missing proxy-target header");
    return res.status(403).json({
      error: "Forbidden",
      reason: "Missing proxy-target header"
    });
  }

  try {
    const url = `https://${target}${req.url}`;
    console.log("➡ Forwarding request to:", url);

    const response = await fetch(url, {
      method: req.method,
      headers: { ...req.headers, host: target },
      body: ["GET", "HEAD"].includes(req.method) ? undefined : req.body
    });

    const text = await response.text();
    res.status(response.status).send(text);
  } catch (err) {
    console.error("❌ Proxy error:", err);
    res.status(500).json({
      error: "Proxy error",
      details: err.message
    });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("✅ Proxy running on port " + (process.env.PORT || 3000));
});
