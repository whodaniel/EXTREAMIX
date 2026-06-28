import { Router } from "express";

const router = Router();

// Middleware to protect routes
router.use((req, res, next) => {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const providedPassword = req.headers['x-admin-password'];
  
  if (!adminPassword) {
    return res.status(500).json({ error: "ADMIN_PASSWORD not configured on server" });
  }
  
  if (providedPassword !== adminPassword) {
    return res.status(403).json({ error: "Unauthorized access" });
  }
  
  next();
});

// Retrieve all DNS records for a domain
router.get("/:domain/records", async (req, res) => {
  const { domain } = req.params;
  const apikey = process.env.PORKBUN_API_KEY;
  const secretapikey = process.env.PORKBUN_SECRET_KEY;

  if (!apikey || !secretapikey) {
    return res.status(500).json({ error: "Porkbun API keys are not configured on the server." });
  }

  try {
    const response = await fetch(`https://porkbun.com/api/json/v3/dns/retrieve/${domain}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apikey,
        secretapikey
      })
    });

    const data = await response.json();
    if (data.status === "SUCCESS") {
      res.json(data);
    } else {
      res.status(400).json({ error: data.message || "Failed to retrieve DNS records" });
    }
  } catch (error: any) {
    console.error("Porkbun API Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create a DNS record
router.post("/:domain/records", async (req, res) => {
  const { domain } = req.params;
  const { name, type, content, ttl } = req.body;
  const apikey = process.env.PORKBUN_API_KEY;
  const secretapikey = process.env.PORKBUN_SECRET_KEY;

  if (!apikey || !secretapikey) {
    return res.status(500).json({ error: "Porkbun API keys are not configured." });
  }

  try {
    const response = await fetch(`https://porkbun.com/api/json/v3/dns/create/${domain}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apikey,
        secretapikey,
        name,
        type,
        content,
        ttl
      })
    });

    const data = await response.json();
    if (data.status === "SUCCESS") {
      res.json(data);
    } else {
      res.status(400).json({ error: data.message || "Failed to create DNS record" });
    }
  } catch (error: any) {
    console.error("Porkbun API Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a DNS record
router.delete("/:domain/records/:id", async (req, res) => {
  const { domain, id } = req.params;
  const apikey = process.env.PORKBUN_API_KEY;
  const secretapikey = process.env.PORKBUN_SECRET_KEY;

  if (!apikey || !secretapikey) {
    return res.status(500).json({ error: "Porkbun API keys are not configured." });
  }

  try {
    const response = await fetch(`https://porkbun.com/api/json/v3/dns/delete/${domain}/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apikey,
        secretapikey,
      })
    });

    const data = await response.json();
    if (data.status === "SUCCESS") {
      res.json(data);
    } else {
      res.status(400).json({ error: data.message || "Failed to delete DNS record" });
    }
  } catch (error: any) {
    console.error("Porkbun API Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
