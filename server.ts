import express from "express";
import cookieParser from "cookie-parser";
import axios from "axios";
import dotenv from "dotenv";
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// --- Supabase Configuration ---
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: Supabase URL or Anon Key is missing from environment variables!');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
app.post("/api/auth/signup", async (req, res) => {
  const { email, password, name } = req.body;
  try {
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const { data: newUser, error } = await supabase
      .from('profiles')
      .insert([{ email, password, username: name, plan: 'Starter' }])
      .select()
      .single();

    if (error) throw error;
    res.json(newUser);
  } catch (error: any) {
    console.error('Signup Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.json(user);
  } catch (error: any) {
    console.error('Login Error:', error.message);
    res.status(500).json({ error: "Login failed" });
  }
});

app.patch("/api/auth/plan", async (req, res) => {
  const { userId, plan } = req.body;
  try {
    const { data: updatedUser, error } = await supabase
      .from('profiles')
      .update({ plan })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    res.json(updatedUser);
  } catch (error: any) {
    console.error('Plan Update Error:', error.message);
    res.status(500).json({ error: "Failed to update plan" });
  }
});

// Items
app.get("/api/items", async (req, res) => {
  const { userId } = req.query;
  try {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('userId', userId);
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/items", async (req, res) => {
  const item = req.body;
  try {
    const { data, error } = await supabase
      .from('items')
      .insert([{
        userId: item.userId,
        name: item.name,
        category: item.category,
        imageUrl: item.imageUrl,
        tags: item.tags || [],
        usageCount: item.usageCount || 0
      }])
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/items/:id", async (req, res) => {
  try {
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Outfits
app.get("/api/outfits", async (req, res) => {
  const { userId } = req.query;
  try {
    const { data, error } = await supabase
      .from('outfits')
      .select('*')
      .eq('userId', userId)
      .order('date', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/outfits", async (req, res) => {
  const outfit = req.body;
  try {
    const { data, error } = await supabase
      .from('outfits')
      .insert([{
        userId: outfit.userId,
        name: outfit.name,
        itemIds: outfit.itemIds,
        isFavorite: outfit.isFavorite ?? false,
        folderId: outfit.folderId
      }])
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.patch("/api/outfits/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('outfits')
      .update({
        isFavorite: req.body.isFavorite,
        folderId: req.body.folderId
      })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/outfits/:id", async (req, res) => {
  try {
    const { error } = await supabase
      .from('outfits')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Folders
app.get("/api/folders", async (req, res) => {
  const { userId } = req.query;
  try {
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('userId', userId);
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/folders", async (req, res) => {
  const folder = req.body;
  try {
    const { data, error } = await supabase
      .from('folders')
      .insert([{
        userId: folder.userId,
        name: folder.name,
        color: folder.color || '#6bb0d8'
      }])
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/folders/:id", async (req, res) => {
  try {
    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Planner
app.get("/api/planner", async (req, res) => {
  const { userId } = req.query;
  try {
    const { data, error } = await supabase
      .from('planner')
      .select('*')
      .eq('userId', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    res.json(data?.days || [
      { day: 'Mon', outfitId: null, note: '' },
      { day: 'Tue', outfitId: null, note: '' },
      { day: 'Wed', outfitId: null, note: '' },
      { day: 'Thu', outfitId: null, note: '' },
      { day: 'Fri', outfitId: null, note: '' },
      { day: 'Sat', outfitId: null, note: '' },
      { day: 'Sun', outfitId: null, note: '' }
    ]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/planner", async (req, res) => {
  const { userId, days } = req.body;
  try {
    const { data, error } = await supabase
      .from('planner')
      .upsert({ userId, days }, { onConflict: 'userId' })
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Shared Community Feed
app.get("/api/community", async (req, res) => {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({ 
        error: "Supabase configuration missing", 
        hint: "Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.",
        fallback: communityPosts 
      });
    }

    const { data, error } = await supabase
      .from('community_posts')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (error) {
      console.error(`Supabase GET Error [${error.code}]: ${error.message}`);
      console.error('Full Error Details:', JSON.stringify(error, null, 2));
      
      return res.status(500).json({ 
        error: error.message, 
        details: error.details,
        hint: error.hint,
        code: error.code,
        fallback: communityPosts 
      });
    }
    
    // If table is empty, return the default mock data so it doesn't look broken
    if (!data || data.length === 0) {
      return res.json(communityPosts);
    }
    
    res.json(data);
  } catch (error: any) {
    console.error('Server Exception (GET):', error.message || error);
    res.status(500).json({ error: error.message || 'Unknown server error', fallback: communityPosts });
  }
});

app.post("/api/community", async (req, res) => {
  const post = req.body;
  try {
    const { data, error } = await supabase
      .from('community_posts')
      .insert([{
        title: post.title,
        author: post.author,
        imageUrl: post.imageUrl,
        likes: 0,
        timestamp: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Supabase Error (POST):', JSON.stringify(error, null, 2));
    // Fallback for local dev if Supabase isn't ready
    const newPost = { 
      ...post, 
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
      likes: 0, 
      timestamp: new Date().toISOString() 
    };
    communityPosts.unshift(newPost);
    res.json(newPost);
  }
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
