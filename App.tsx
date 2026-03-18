import React, { useState, useEffect } from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { backend } from './services/backend';
import { 
  Plus, 
  Search, 
  Filter, 
  Grid, 
  List, 
  Camera, 
  Sparkles, 
  Heart, 
  Trash2, 
  FolderPlus,
  ChevronRight,
  Menu,
  X,
  User,
  Settings,
  LogOut,
  Calendar,
  Share2,
  TrendingUp,
  Tag,
  Palette,
  Check,
  ShoppingBag,
  ArrowRight,
  MessageSquare,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  generateOutfitSuggestion, 
  chatWithStylist,
  analyzeClosetItem
} from './services/geminiService';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface Item {
  id: string;
  name: string;
  category: string;
  color: string;
  imageUrl: string;
  tags: string[];
  userId: string;
  lastWorn?: string;
  usageCount: number;
}

interface Outfit {
  id: string;
  name: string;
  itemIds: string[];
  userId: string;
  isFavorite: boolean;
  folderId?: string;
}

interface Folder {
  id: string;
  name: string;
  userId: string;
  color: string;
}

interface PlannerDay {
  day: string;
  outfitId: string | null;
  note: string;
}

// --- Components ---

const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-layer-bg p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-red-100 p-8 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-600 mx-auto mb-6">
          <X size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h2>
        <p className="text-slate-500 mb-8 leading-relaxed">
          We encountered an unexpected error. Don't worry, your style is still safe.
          <br />
          <span className="text-xs font-mono bg-slate-50 p-1 rounded mt-2 block overflow-auto max-h-24">{error.message}</span>
        </p>
        <Button onClick={resetErrorBoundary} className="w-full">
          Try again
        </Button>
      </div>
    </div>
  );
};

const Button = ({ children, onClick, variant = 'primary', className = '', icon: Icon }: any) => {
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
    secondary: 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100'
  };

  return (
    <button 
      onClick={onClick}
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium transition-all active:scale-95 ${variants[variant as keyof typeof variants]} ${className}`}
    >
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

const Card = ({ children, className = '' }: any) => (
  <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
    {children}
  </div>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('closet');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [planner, setPlanner] = useState<PlannerDay[]>([]);
  const [community, setCommunity] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authForm, setAuthForm] = useState({ email: '', password: '', username: '' });
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: string, text: string}[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const currentUser = backend.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      fetchData(currentUser.id);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchData = async (userId: string) => {
    try {
      const [itemsRes, outfitsRes, foldersRes, plannerRes, communityRes] = await Promise.all([
        backend.getItems(),
        backend.getOutfits(),
        backend.getFolders(),
        backend.getPlanner(),
        backend.getCommunityPosts()
      ]);

      setItems(itemsRes);
      setOutfits(outfitsRes);
      setFolders(foldersRes);
      setPlanner(plannerRes);
      setCommunity(communityRes);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const loggedInUser = await backend.login(authForm.email, authForm.password);
      setUser(loggedInUser);
      await fetchData(loggedInUser.id);
    } catch (error: any) {
      alert(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newUser = await backend.signup({
        email: authForm.email,
        password: authForm.password,
        username: authForm.username,
        styles: [],
        plan: 'Starter'
      });
      setUser(newUser);
      await fetchData(newUser.id);
    } catch (error: any) {
      alert(error.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await backend.logout();
    setUser(null);
    setItems([]);
    setOutfits([]);
    setFolders([]);
    setPlanner([]);
  };

  const handleAddItem = async (imageUrl: string) => {
    if (!user) return;
    setIsAnalyzing(true);
    try {
      const base64 = imageUrl.split(',')[1];
      const analysis = await analyzeClosetItem(base64);
      const itemData = analysis[0] || { name: 'New Item', category: 'top' };
      
      const newItem = await backend.addItem({
        name: itemData.name,
        category: itemData.category.toLowerCase() as any,
        color: 'Neutral',
        imageUrl: imageUrl,
        tags: [itemData.category],
        usageCount: 0,
        type: itemData.category
      });
      setItems(prev => [...prev, newItem]);
      setIsAddItemOpen(false);
    } catch (error) {
      console.error("Failed to add item:", error);
      alert("Failed to analyze item. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateOutfit = async () => {
    if (!user || items.length < 3) {
      alert("Add at least 3 items to your wardrobe first!");
      return;
    }
    setIsGenerating(true);
    try {
      const suggestion = await generateOutfitSuggestion(
        "Sunny, 22°C",
        "Minimalist",
        "Casual Outing",
        items
      );
      if (suggestion.error) {
        alert(suggestion.error);
      } else {
        const newOutfit = await backend.saveOutfit({
          description: suggestion.description,
          reasoning: suggestion.reasoning,
          date: new Date().toISOString(),
          itemIds: suggestion.itemIds,
          isFavorite: false
        });
        setOutfits(prev => [newOutfit, ...prev]);
        setActiveTab('outfits');
      }
    } catch (error) {
      console.error("Failed to generate outfit:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !user) return;
    const userMsg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    
    try {
      const response = await chatWithStylist(
        userMsg, 
        chatHistory.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
        user.plan === 'Elite'
      );
      setChatHistory(prev => [...prev, { role: 'model', text: response }]);
    } catch (error) {
      console.error("Chat error:", error);
    }
  };

  const handleToggleFavorite = async (outfitId: string) => {
    try {
      const updated = await backend.toggleFavoriteOutfit(outfitId);
      setOutfits(prev => prev.map(o => o.id === outfitId ? updated : o));
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  const handleDeleteOutfit = async (id: string) => {
    try {
      await backend.deleteOutfit(id);
      setOutfits(prev => prev.filter(o => o.id !== id));
    } catch (error) {
      console.error("Failed to delete outfit:", error);
    }
  };

  const navItems = [
    { id: 'closet', label: 'My Closet', icon: ShoppingBag },
    { id: 'outfits', label: 'Outfits', icon: Palette },
    { id: 'planner', label: 'Planner', icon: Calendar },
    { id: 'community', label: 'Community', icon: TrendingUp },
    { id: 'stats', label: 'Insights', icon: Sparkles },
  ];

  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-layer-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-medium">Layering your style...</p>
      </div>
    </div>
  );

  if (!user) return (
    <div className="h-screen w-screen flex items-center justify-center bg-layer-bg p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 p-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-indigo-200">
            <Menu size={32} />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Layer</h1>
          <p className="text-slate-500 font-medium mt-1">Digital Wardrobe Management</p>
        </div>

        <form onSubmit={authMode === 'login' ? handleLogin : handleSignup} className="space-y-4">
          {authMode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Username</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                placeholder="style_icon"
                value={authForm.username}
                onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Email Address</label>
            <input 
              type="email" 
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              placeholder="alex@example.com"
              value={authForm.email}
              onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Password</label>
            <input 
              type="password" 
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              placeholder="••••••••"
              value={authForm.password}
              onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
            />
          </div>
          <Button className="w-full py-4 text-lg mt-4 shadow-lg shadow-indigo-100">
            {authMode === 'login' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
            className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            {authMode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Log in"}
          </button>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="flex h-screen bg-layer-bg text-slate-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="bg-white border-r border-slate-200 flex flex-col z-20"
      >
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                <Menu size={20} />
              </div>
              <span className="font-bold text-xl tracking-tight">Layer</span>
            </div>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                activeTab === item.id 
                  ? 'bg-indigo-50 text-indigo-600 font-semibold' 
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <item.icon size={22} />
              {isSidebarOpen && <span>{item.label}</span>}
              {activeTab === item.id && isSidebarOpen && (
                <motion.div layoutId="activeNav" className="ml-auto w-1.5 h-1.5 bg-indigo-600 rounded-full" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          {isSidebarOpen ? (
            <div className="bg-slate-900 rounded-2xl p-4 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:scale-110 transition-transform">
                <Sparkles size={40} />
              </div>
              <p className="text-xs font-bold text-indigo-400 mb-1">PRO PLAN</p>
              <p className="text-sm font-medium mb-3">Unlimited AI Suggestions</p>
              <button className="w-full bg-white text-slate-900 py-2 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-colors">
                Manage Plan
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                <TrendingUp size={20} />
              </div>
            </div>
          )}
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search your closet, outfits, or community..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="secondary" icon={Filter}>Filters</Button>
          </div>

          <div className="flex items-center gap-4 ml-8">
            <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-200">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs uppercase">
                {(user?.username || '??').substring(0, 2)}
              </div>
              <span className="text-sm font-medium text-slate-700 hidden sm:block">{user?.username}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2.5 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors relative"
            >
              <LogOut size={22} />
            </button>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'closet' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight">My Closet</h2>
                    <p className="text-slate-500 mt-1">{(items || []).length} items in your digital wardrobe</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex bg-white border border-slate-200 rounded-xl p-1">
                      <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-400'}`}
                      >
                        <Grid size={18} />
                      </button>
                      <button 
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-400'}`}
                      >
                        <List size={18} />
                      </button>
                    </div>
                    <Button icon={Plus} onClick={handleAddItem}>Add Item</Button>
                    <Button variant="secondary" icon={Camera}>Scan</Button>
                  </div>
                </div>

                {/* Categories */}
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {['All', 'Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Accessories', 'Dresses'].map((cat) => (
                    <button 
                      key={cat}
                      className="px-5 py-2 rounded-full bg-white border border-slate-200 text-sm font-medium text-slate-600 hover:border-indigo-600 hover:text-indigo-600 transition-all whitespace-nowrap"
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {(items || []).map((item) => (
                    <motion.div 
                      key={item.id}
                      layout
                      className="group"
                    >
                      <Card className="relative aspect-[3/4] group-hover:shadow-xl transition-all">
                        <img 
                          src={item.imageUrl} 
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="absolute top-3 right-3 flex flex-col gap-2 translate-x-12 group-hover:translate-x-0 transition-transform">
                          <button className="p-2 bg-white rounded-lg shadow-lg text-slate-600 hover:text-indigo-600">
                            <Heart size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-2 bg-white rounded-lg shadow-lg text-slate-600 hover:text-red-600"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        <div className="absolute bottom-4 left-4 right-4 text-white translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                          <p className="font-bold">{item.name}</p>
                          <p className="text-xs text-white/80">{item.category} • {item.color}</p>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                  
                  {/* Empty State / Add New */}
                  <button 
                    onClick={handleAddItem}
                    className="aspect-[3/4] rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-indigo-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                  >
                    <div className="p-4 bg-slate-100 rounded-full group-hover:bg-indigo-100">
                      <Plus size={32} />
                    </div>
                    <span className="font-bold">Add New Item</span>
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'community' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight">Community Feed</h2>
                    <p className="text-slate-500 mt-1">Get inspired by styles from around the world</p>
                  </div>
                  <Button icon={Share2}>Share Outfit</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {(community || []).map((post) => (
                    <Card key={post.id} className="group cursor-pointer">
                      <div className="relative aspect-square overflow-hidden">
                        <img 
                          src={post.imageUrl} 
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur rounded-full text-xs font-bold flex items-center gap-1.5">
                          <TrendingUp size={12} className="text-indigo-600" />
                          Trending
                        </div>
                      </div>
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold uppercase">
                              {(post.author || '??').substring(0, 2)}
                            </div>
                            <span className="text-sm font-bold">{post.author || 'Anonymous'}</span>
                          </div>
                          <button className="flex items-center gap-1.5 text-slate-400 hover:text-red-500 transition-colors">
                            <Heart size={18} />
                            <span className="text-sm font-medium">{post.likes}</span>
                          </button>
                        </div>
                        <h3 className="font-bold text-lg mb-1">{post.title}</h3>
                        <p className="text-slate-500 text-sm">2 hours ago</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'outfits' && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-6">
                  <Palette size={40} />
                </div>
                <h3 className="text-2xl font-bold mb-2">Outfit Builder</h3>
                <p className="text-slate-500 max-w-md mb-8">
                  Mix and match items from your closet to create the perfect look. Save them to folders or share with the community.
                </p>
                <Button icon={Plus} className="px-8">Create New Outfit</Button>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Right Panel - AI Stylist */}
      <aside className="w-80 bg-white border-l border-slate-200 flex flex-col hidden xl:flex">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="text-indigo-600" size={20} />
            <span className="font-bold">AI Stylist</span>
          </div>
          <div className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded uppercase">Beta</div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200">
            <h4 className="font-bold text-lg mb-2">Today's Suggestion</h4>
            <p className="text-indigo-100 text-sm leading-relaxed mb-4">
              It's 68°F and sunny. A light denim layer with your white sneakers would be perfect for this weather.
            </p>
            <div className="flex -space-x-3 mb-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-indigo-600 overflow-hidden bg-white">
                  <img src={`https://images.unsplash.com/photo-1523381235312-3a1647fa9747?auto=format&fit=crop&q=80&w=100`} alt="" />
                </div>
              ))}
            </div>
            <Button variant="secondary" className="w-full text-indigo-600 border-none">View Outfit</Button>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-sm text-slate-400 uppercase tracking-wider">Style Insights</h4>
            <div className="space-y-3">
              {[
                { label: 'Most Worn', value: 'Black Tee', color: 'bg-emerald-500' },
                { label: 'Least Worn', value: 'Red Blazer', color: 'bg-amber-500' },
                { label: 'Color Palette', value: 'Monochrome', color: 'bg-indigo-500' },
              ].map((stat, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{stat.label}</p>
                    <p className="text-sm font-bold">{stat.value}</p>
                  </div>
                  <div className={`w-2 h-8 rounded-full ${stat.color}`} />
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-indigo-600" />
              <span className="text-sm font-bold text-indigo-900">Wardrobe Value</span>
            </div>
            <p className="text-2xl font-bold text-indigo-600">$1,240</p>
            <p className="text-xs text-indigo-400 mt-1">Based on 42 items</p>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100">
          <button className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <ShoppingBag size={20} className="text-slate-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold">Sell Unused</p>
                <p className="text-[10px] text-slate-400 uppercase">8 items suggested</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-300" />
          </button>
        </div>
      </aside>
    </div>
  );
};

const AppWithErrorBoundary = () => (
  <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
    <App />
  </ErrorBoundary>
);

export default AppWithErrorBoundary;
