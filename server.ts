import express from "express";
import cookieParser from "cookie-parser";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware
app.use(express.json());
app.use(cookieParser());

// --- OAuth Configuration ---
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

const getRedirectUri = (req: express.Request) => {
  const host = req.get('host');
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  return `${protocol}://${host}/auth/callback`;
};

// --- API Routes ---

// --- In-Memory Storage (Stateless on Vercel, but shared during session) ---
let users: any[] = [];
let items: any[] = [];
let outfits: any[] = [];
let folders: any[] = [];
let communityPosts: any[] = [
  { id: '1', title: 'Cyberpunk Minimalist', author: 'NeoStyle', likes: 142, imageUrl: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&q=80&w=800', timestamp: new Date().toISOString() },
  { id: '2', title: 'Streetwear Fusion', author: 'LayerKing', likes: 89, imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800', timestamp: new Date().toISOString() },
  { id: '3', title: 'Cozy Oversized Vibe', author: 'SoftVibes', likes: 231, imageUrl: 'https://images.unsplash.com/photo-1508427953056-b00b8d78ebf5?auto=format&fit=crop&q=80&w=800', timestamp: new Date().toISOString() },
  { id: '4', title: 'Formal Brutalism', author: 'ArchitectMode', likes: 56, imageUrl: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=800', timestamp: new Date().toISOString() },
  { id: '5', title: 'Vintage Denim Layering', author: 'RetroSoul', likes: 312, imageUrl: 'https://images.unsplash.com/photo-1523381235312-3a1647fa9747?auto=format&fit=crop&q=80&w=800', timestamp: new Date().toISOString() },
  { id: '6', title: 'Monochrome Techwear', author: 'GhostInShell', likes: 178, imageUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=800', timestamp: new Date().toISOString() },
  { id: '7', title: 'Pastel Academia', author: 'LibraryLover', likes: 445, imageUrl: 'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&q=80&w=800', timestamp: new Date().toISOString() },
  { id: '8', title: 'Desert Nomad Style', author: 'DuneTraveler', likes: 92, imageUrl: 'https://images.unsplash.com/photo-1475189778702-5ec9941484ae?auto=format&fit=crop&q=80&w=800', timestamp: new Date().toISOString() },
];

// --- API Routes ---

// Auth
app.post("/api/auth/signup", (req, res) => {
  const user = req.body;
  if (users.find(u => u.email === user.email)) {
    return res.status(400).json({ error: "User already exists" });
  }
  const newUser = { ...user, id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, plan: 'Starter' };
  users.push(newUser);
  res.json(newUser);
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  res.json(user);
});

app.patch("/api/auth/plan", (req, res) => {
  const { userId, plan } = req.body;
  const index = users.findIndex(u => u.id === userId);
  if (index === -1) return res.status(404).json({ error: "User not found" });
  users[index].plan = plan;
  res.json(users[index]);
});

// Items
app.get("/api/items", (req, res) => {
  const { userId } = req.query;
  res.json(items.filter(i => i.userId === userId));
});

app.post("/api/items", (req, res) => {
  const item = req.body;
  const newItem = { ...item, id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
  items.push(newItem);
  res.json(newItem);
});

app.delete("/api/items/:id", (req, res) => {
  items = items.filter(i => i.id !== req.params.id);
  res.json({ success: true });
});

// Outfits
app.get("/api/outfits", (req, res) => {
  const { userId } = req.query;
  res.json(outfits.filter(o => o.userId === userId));
});

app.post("/api/outfits", (req, res) => {
  const outfit = req.body;
  const newOutfit = { ...outfit, id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, isFavorite: outfit.isFavorite ?? false };
  outfits.push(newOutfit);
  res.json(newOutfit);
});

app.patch("/api/outfits/:id", (req, res) => {
  const index = outfits.findIndex(o => o.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Outfit not found" });
  outfits[index] = { ...outfits[index], ...req.body };
  res.json(outfits[index]);
});

app.delete("/api/outfits/:id", (req, res) => {
  outfits = outfits.filter(o => o.id !== req.params.id);
  res.json({ success: true });
});

// Folders
app.get("/api/folders", (req, res) => {
  const { userId } = req.query;
  res.json(folders.filter(f => f.userId === userId));
});

app.post("/api/folders", (req, res) => {
  const folder = req.body;
  const newFolder = { ...folder, id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, color: folder.color || '#6bb0d8' };
  folders.push(newFolder);
  res.json(newFolder);
});

app.delete("/api/folders/:id", (req, res) => {
  folders = folders.filter(f => f.id !== req.params.id);
  // Clear folderId from outfits
  outfits = outfits.map(o => o.folderId === req.params.id ? { ...o, folderId: undefined } : o);
  res.json({ success: true });
});

let plannedWeeks: any[] = [];

// Planner
app.get("/api/planner", (req, res) => {
  const { userId } = req.query;
  res.json(plannedWeeks.find(pw => pw.userId === userId)?.days || [
    { day: 'Mon', outfitId: null, note: '' },
    { day: 'Tue', outfitId: null, note: '' },
    { day: 'Wed', outfitId: null, note: '' },
    { day: 'Thu', outfitId: null, note: '' },
    { day: 'Fri', outfitId: null, note: '' },
    { day: 'Sat', outfitId: null, note: '' },
    { day: 'Sun', outfitId: null, note: '' }
  ]);
});

app.post("/api/planner", (req, res) => {
  const { userId, days } = req.body;
  const index = plannedWeeks.findIndex(pw => pw.userId === userId);
  if (index === -1) {
    plannedWeeks.push({ userId, days });
  } else {
    plannedWeeks[index].days = days;
  }
  res.json({ success: true });
});

// Shared Community Feed
app.get("/api/community", (req, res) => {
  res.json(communityPosts);
});

app.post("/api/community", (req, res) => {
  const post = req.body;
  const newPost = { 
    ...post, 
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
    likes: 0, 
    timestamp: new Date().toISOString() 
  };
  communityPosts.unshift(newPost);
  res.json(newPost);
});

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
  let userData = {
    email: "oauth_user@example.com",
    name: "OAuth User",
    provider: "unknown"
  };

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

// --- Vite / Static Handling ---
async function configureApp() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    // Catch-all route for SPA - only if not on Vercel (Vercel handles this via vercel.json)
    if (!process.env.VERCEL) {
      app.get("*", (req, res) => {
        res.sendFile("dist/index.html", { root: "." });
      });
    }
  }
}

// Initialize Vite/Static serving
configureApp();

// Start server if not in serverless environment
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

export default app;
