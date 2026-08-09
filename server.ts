import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import webhookRoutes from "./src/routes/webhooks.ts";
import dnsRoutes from "./src/routes/dns.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // RevenueCat webhook needs raw body for signature verification
  app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

  // Standard JSON body parser for other routes
  app.use(express.json());

  // Re-parse webhook body as JSON (since raw middleware consumed it)
  app.use('/api/webhooks/revenuecat', (req, res, next) => {
    if (Buffer.isBuffer(req.body)) {
      try {
        req.body = JSON.parse(req.body.toString('utf8'));
      } catch {
        // Not JSON, leave as-is
      }
    } else if (typeof req.body === 'string') {
      try {
        req.body = JSON.parse(req.body);
      } catch {
        // Not JSON, leave as-is
      }
    }
    next();
  });

  // API routes
  app.use('/api/dns', dnsRoutes);

  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok",
      monetization: "revenuecat",
      timestamp: new Date().toISOString()
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`RevenueCat webhook: POST /api/webhooks/revenuecat`);
  });
}

startServer();
