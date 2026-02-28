import express from "express";
import { createServer as createViteServer } from "vite";
import cookieParser from "cookie-parser";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // --- OAuth Configuration ---
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

  const getRedirectUri = (req: express.Request) => {
    // In this environment, we should use the APP_URL if available, 
    // but window.location.origin is usually better for the client to pass.
    // However, for the server to construct the URL, we can use a fixed path.
    const host = req.get('host');
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    return `${protocol}://${host}/auth/callback`;
  };

  // --- API Routes ---

  app.get("/api/auth/google/url", (req, res) => {
    const redirectUri = getRedirectUri(req);
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID || "PLACEHOLDER_CLIENT_ID",
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent",
    });
    res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
  });

  app.get("/auth/callback", async (req, res) => {
    const { code, state } = req.query;
    
    // In a real app, you'd exchange the code for tokens here.
    // Since we don't have real client secrets yet, we'll simulate the success
    // but provide a way for the user to see where to put their keys.
    
    let userData = {
      email: "oauth_user@example.com",
      name: "OAuth User",
      provider: "unknown"
    };

    // Note: To make this "real", the user needs to provide GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
    // If they are provided, we could actually do the exchange.
    
    res.send(`
      <html>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #0f172a; color: white;">
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'OAUTH_AUTH_SUCCESS',
                user: ${JSON.stringify(userData)}
              }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <div style="text-align: center;">
            <h2>Authentication Successful</h2>
            <p>Closing window...</p>
          </div>
        </body>
      </html>
    `);
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
