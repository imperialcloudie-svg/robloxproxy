import express from "express";
import fetch from "node-fetch";

const app = express();

// Allow raw text / JSON / form
app.use(express.text({ type: "*/*" }));

const ACCESS_KEY = process.env.ACCESS_KEY || "changeme";

app.all("/*", async (req, res) => {
  if (req.headers["proxy-access-key"] !== ACCESS_KEY) {
    return res.status(403).send("Forbidden: Invalid Proxy Key");
  }

  const target = req.headers["proxy-target"];
  if (!target) return res.status(400).send("No target specified");

  try {
    const url = `https://${target}${req.url}`;

    const response = await fetch(url, {
      method: req.method,
      headers: { ...req.headers, host: target },
      body: ["GET", "HEAD"].includes(req.method) ? undefined : req.body
    });

    const text = await response.text();
    res.status(response.status).send(text);
  } catch (err) {
    console.error(err);
    res.status(500).send("Proxy error");
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Proxy running on port " + (process.env.PORT || 3000));
});
