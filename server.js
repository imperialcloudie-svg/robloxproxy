const express = require("express");
const fetch = require("node-fetch");
const app = express();

// Allow raw text / JSON / form
app.use(express.text({ type: "*/*" }));

// Access key (set in Render environment variables)
const ACCESS_KEY = process.env.ACCESS_KEY || "changeme";

// Proxy route
app.all("/*", async (req, res) => {
  // Check access key
  if (req.headers["proxy-access-key"] !== ACCESS_KEY) {
    return res.status(403).send("Forbidden: Invalid Proxy Key");
  }

  // Target host (passed in header from Roblox)
  const target = req.headers["proxy-target"];
  if (!target) return res.status(400).send("No target specified");

  try {
    // Build URL
    const url = `https://${target}${req.url}`;

    // Forward request
    const response = await fetch(url, {
      method: req.method,
      headers: { ...req.headers, host: target },
      body: ["GET", "HEAD"].includes(req.method) ? undefined : req.body
    });

    // Get response as text
    const text = await response.text();
    res.status(response.status).send(text);
  } catch (err) {
    console.error(err);
    res.status(500).send("Proxy error");
  }
});

// Listen on Render’s provided port
app.listen(process.env.PORT || 3000, () => {
  console.log("Proxy running on port " + (process.env.PORT || 3000));
});
