
import React, { useState, useEffect, useRef } from 'react';
import Navigation from '../components/Navigation';
import { 
  generateOutfitSuggestion, 
  analyzeClosetItem, 
  chatWithStylist,
  generateCelebrityLook,
  analyzeWardrobeGaps,
  generateOutfitAroundItem,
  autoScheduleWeek,
  matchStyleDNA
} from '../services/geminiService';
import { backend } from '../services/backend';
import { ClothingItem, Outfit, PlannedDay, CommunityPost } from '../types';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = backend.getCurrentUser();
  const isPro = user?.plan === 'Pro' || user?.plan === 'Elite';
  const isElite = user?.plan === 'Elite';

  const [activeTab, setActiveTab] = useState('wardrobe');
  const [librarySubTab, setLibrarySubTab] = useState<'all' | 'favorites' | 'folders'>('all');
  const [exploreSubTab, setExploreSubTab] = useState<'feed' | 'vibe'>('feed');
  const [weather, setWeather] = useState({ temp: 18, condition: 'Sunny', city: 'Detecting...' });
  
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [savedOutfits, setSavedOutfits] = useState<Outfit[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // AI & Generator States
  const [outfitMode, setOutfitMode] = useState<'Standard' | 'Twin' | 'Manual' | 'Orbit'>('Standard');
  const [outfitOccasion, setOutfitOccasion] = useState('Casual');
  const [customOutfitRequest, setCustomOutfitRequest] = useState('');
  const [styleTwinInput, setStyleTwinInput] = useState('');
  const [heroItem, setHeroItem] = useState<ClothingItem | null>(null);
  const [manualSelectedItems, setManualSelectedItems] = useState<string[]>([]);
  const [generatedLook, setGeneratedLook] = useState<{description: string, reasoning: string, itemIds: string[]} | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Gap Analysis State
  const [gaps, setGaps] = useState<{missingItems: string[], reasoning: string} | null>(null);
  const [isGapLoading, setIsGapLoading] = useState(false);

  // Style DNA State
  const [isDNASyncing, setIsDNASyncing] = useState(false);
  const [matchedDNAIds, setMatchedDNAIds] = useState<string[]>([]);

  // Functional Planner State
  const [plannedWeek, setPlannedWeek] = useState<PlannedDay[]>(() => {
    const saved = localStorage.getItem('layer_planner_v3');
    return saved ? JSON.parse(saved) : [
      { day: 'Mon', outfitId: null, note: '' },
      { day: 'Tue', outfitId: null, note: '' },
      { day: 'Wed', outfitId: null, note: '' },
      { day: 'Thu', outfitId: null, note: '' },
      { day: 'Fri', outfitId: null, note: '' },
      { day: 'Sat', outfitId: null, note: '' },
      { day: 'Sun', outfitId: null, note: '' }
    ];
  });
  const [isPlanning, setIsPlanning] = useState<string | null>(null);
  const [isAutoScheduling, setIsAutoScheduling] = useState(false);

  // Item Upload State
  const [newItemImage, setNewItemImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Chatbot State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<{role: string, text: string}[]>([
    { role: 'model', text: "Ready to elevate your aesthetic? I'm your Style Pro assistant." }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return navigate('/login');
      setIsLoadingData(true);
      try {
        const [i, o, cp, f] = await Promise.all([
          backend.getItems(), 
          backend.getOutfits(),
          backend.getCommunityPosts(),
          backend.getFolders()
        ]);
        setItems(i);
        setSavedOutfits(o);
        setCommunityPosts(cp);
        setFolders(f);
        
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
              const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&current=temperature_2m,weather_code`);
              if (!res.ok) throw new Error("Weather fetch failed");
              const data = await res.json();
              setWeather({
                temp: Math.round(data.current.temperature_2m),
                condition: data.current.weather_code === 0 ? 'Sunny' : 'Cloudy',
                city: 'Current Location'
              });
            } catch (e) {
              console.warn("Weather fetch failed:", e);
            }
          }, (err) => {
            console.warn("Geolocation permission denied or failed:", err);
          });
        }
      } catch (e) { 
        console.error("Data load error:", e);
        setErrorMessage("Failed to load your wardrobe data.");
      } finally { 
        setIsLoadingData(false); 
      }
    };
    loadData();
  }, [navigate]);

  useEffect(() => {
    localStorage.setItem('layer_planner_v3', JSON.stringify(plannedWeek));
  }, [plannedWeek]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory, isChatOpen]);

  const categories = ['all', 'top', 'bottom', 'shoes', 'outerwear', 'accessory'];

  const filterItems = (itemsList: ClothingItem[]) => {
    return itemsList.filter(item => {
      const cat = (item.category || '').toLowerCase();
      const filter = filterCategory.toLowerCase();
      if (filter === 'all') return true;
      if (cat === filter) return true;
      
      // Normalize categories for robust matching
      if (filter === 'top') return ['top', 'tops', 'shirt', 'shirts', 'hoodie', 'hoodies', 'tee', 't-shirt', 'blouse'].includes(cat);
      if (filter === 'bottom') return ['bottom', 'bottoms', 'pants', 'jeans', 'skirt', 'shorts', 'trousers'].includes(cat);
      if (filter === 'shoes') return ['shoes', 'shoe', 'footwear', 'sneakers', 'boots', 'heels'].includes(cat);
      if (filter === 'outerwear') return ['outerwear', 'jacket', 'coat', 'blazer', 'cardigan'].includes(cat);
      if (filter === 'accessory') return ['accessory', 'accessories', 'bag', 'hat', 'belt', 'jewelry', 'glasses'].includes(cat);
      
      return false;
    });
  };

  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = () => { resolve(base64Str); };
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      let dataUrl = event.target?.result as string;
      dataUrl = await compressImage(dataUrl);
      setNewItemImage(dataUrl);
      setIsAnalyzing(true);
      setErrorMessage(null);
      try {
        const res = await analyzeClosetItem(dataUrl.split(',')[1]);
        setAnalysisResult(res);
      } catch (e) {
        setErrorMessage("Failed to analyze image.");
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveNewItem = async () => {
    if (!newItemImage || !analysisResult) return;
    try {
      const saved = await backend.addItem({
        name: analysisResult.name,
        category: (analysisResult.category || 'shirt').toLowerCase() as any,
        imageUrl: newItemImage,
        type: analysisResult.category,
        wearCount: 0
      });
      setItems([...items, saved]);
      setNewItemImage(null);
      setAnalysisResult(null);
    } catch (e) {
      setErrorMessage("Style Vault is full.");
    }
  };

  const handleToggleFavoriteOutfit = async (outfitId: string) => {
    try {
      const updated = await backend.toggleFavoriteOutfit(outfitId);
      setSavedOutfits(savedOutfits.map(o => o.id === outfitId ? updated : o));
    } catch (e) {
      setErrorMessage("Failed to update favorite status.");
    }
  };

  const handleFavoriteFromFeed = async (post: CommunityPost) => {
    try {
      const res = await backend.saveOutfit({
        description: post.title,
        reasoning: `Inspired by @${post.author} on the Global Feed.`,
        date: new Date().toISOString(),
        itemIds: [],
        imageUrl: post.imageUrl,
        isFavorite: true
      });
      setSavedOutfits([res, ...savedOutfits]);
      alert("Look added to your Favorites!");
    } catch (e) {
      setErrorMessage("Failed to save look.");
    }
  };

  const handleGenerateLook = async () => {
    setIsGenerating(true);
    setErrorMessage(null);
    setGeneratedLook(null);
    
    const statuses = [
      "Accessing Style Vault...",
      "Identifying Wardrobe Synergy...",
      "Synthesizing Ensemble..."
    ];
    
    let statusIdx = 0;
    setGenerationStatus(statuses[0]);
    const statusInterval = setInterval(() => {
      statusIdx = (statusIdx + 1) % statuses.length;
      setGenerationStatus(statuses[statusIdx]);
    }, 1200);

    try {
      let res: any;
      if (outfitMode === 'Twin') {
        res = await generateCelebrityLook(styleTwinInput, items);
      } else if (outfitMode === 'Orbit') {
        if (!heroItem) throw new Error("Please select a Hero Piece");
        res = await generateOutfitAroundItem(heroItem, items);
      } else if (outfitMode === 'Manual') {
        if (manualSelectedItems.length < 2) throw new Error("Select at least 2 items.");
        res = { 
          description: "Custom Ensemble", 
          reasoning: `Hand-selected collection of your personal favorites.`,
          itemIds: manualSelectedItems
        };
      } else {
        const promptContext = customOutfitRequest.trim() 
          ? `Specific User Request: ${customOutfitRequest}` 
          : `Occasion: ${outfitOccasion}`;
          
        res = await generateOutfitSuggestion(`${weather.condition}, ${weather.temp}°C`, "High Street", promptContext, items);
      }
      
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setGeneratedLook(res);
      }
    } catch (e: any) { 
      setErrorMessage(e.message || "Styling failed.");
    } finally { 
      clearInterval(statusInterval);
      setIsGenerating(false); 
      setGenerationStatus('');
    }
  };

  const isLookSaved = generatedLook && savedOutfits.some(o => o.description === generatedLook.description && o.itemIds?.join(',') === generatedLook.itemIds?.join(','));

  const handleSaveOutfit = async () => {
    if (!generatedLook) return;
    if (isLookSaved) {
      setErrorMessage("This look is already in your collection.");
      return;
    }
    const res = await backend.saveOutfit({
      description: generatedLook.description,
      reasoning: generatedLook.reasoning,
      date: new Date().toISOString(),
      itemIds: generatedLook.itemIds
    });
    setSavedOutfits([res, ...savedOutfits]);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const folder = await backend.createFolder(newFolderName);
      setFolders([...folders, folder]);
      setNewFolderName('');
      setIsCreatingFolder(false);
    } catch (e) {
      setErrorMessage("Failed to create folder.");
    }
  };

  const handleMoveToFolder = async (outfitId: string, folderId: string | null) => {
    try {
      const updated = await backend.updateOutfitFolder(outfitId, folderId);
      setSavedOutfits(savedOutfits.map(o => o.id === outfitId ? updated : o));
    } catch (e) {
      setErrorMessage("Failed to move outfit.");
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      await backend.deleteFolder(folderId);
      setFolders(folders.filter(f => f.id !== folderId));
      setSavedOutfits(savedOutfits.map(o => o.folderId === folderId ? { ...o, folderId: undefined } : o));
      if (selectedFolderId === folderId) setSelectedFolderId(null);
    } catch (e) {
      setErrorMessage("Failed to delete folder.");
    }
  };

  const handleGapAnalysis = async () => {
    if (!isPro) return navigate('/upgrade');
    setIsGapLoading(true);
    setErrorMessage(null);
    try {
      const res = await analyzeWardrobeGaps(items);
      setGaps(res);
    } catch (e) { 
      setErrorMessage("Gap analysis failed.");
    } finally { 
      setIsGapLoading(false); 
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    const msg = chatInput;
    setChatInput("");
    setChatHistory(prev => [...prev, { role: 'user', text: msg }]);
    setIsChatLoading(true);
    try {
      const response = await chatWithStylist(msg, chatHistory.map(h => ({ role: h.role, parts: [{ text: h.text }] })), isElite);
      setChatHistory(prev => [...prev, { role: 'model', text: response }]);
    } catch (e) {
      setChatHistory(prev => [...prev, { role: 'model', text: "Sorry, the style grid is down." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleAutoSchedule = async () => {
    if (!isPro) return navigate('/upgrade');
    setIsAutoScheduling(true);
    setErrorMessage(null);
    try {
      const res = await autoScheduleWeek(items, `${weather.condition}, ${weather.temp}°C`);
      if (res.error) {
        setErrorMessage(res.error);
        return;
      }
      if (res.schedule) {
        const newPlanner = [...plannedWeek];
        const newlySavedOutfits: Outfit[] = [];
        for (let i = 0; i < res.schedule.length; i++) {
          const item = res.schedule[i];
          const dayIdx = newPlanner.findIndex(p => p.day.substring(0,3).toLowerCase() === item.day.substring(0,3).toLowerCase());
          if (dayIdx !== -1) {
             const saved = await backend.saveOutfit({ 
               description: item.description, 
               reasoning: item.note, 
               date: new Date().toISOString(),
               itemIds: item.itemIds
             });
             newlySavedOutfits.push(saved);
             newPlanner[dayIdx] = { ...newPlanner[dayIdx], outfitId: saved.id, note: item.note };
          }
        }
        setSavedOutfits(prev => [...newlySavedOutfits, ...prev]);
        setPlannedWeek(newPlanner);
        alert("Magic Schedule Initialized.");
      }
    } catch (e) {
      setErrorMessage("Auto-scheduling failed.");
    } finally {
      setIsAutoScheduling(false);
    }
  };

  const handleDNASync = async () => {
    if (!isPro) return navigate('/upgrade');
    setIsDNASyncing(true);
    try {
      const matchedIds = await matchStyleDNA(items, communityPosts);
      setMatchedDNAIds(matchedIds);
    } catch (e) {
      setErrorMessage("Sync failed.");
    } finally {
      setIsDNASyncing(false);
    }
  };

  const handlePlannerAssign = (day: string, outfitId: string) => {
    setPlannedWeek(plannedWeek.map(p => p.day === day ? { ...p, outfitId } : p));
    setIsPlanning(null);
  };

  const FeatureLock = ({ tier, label }: { tier: 'Pro' | 'Elite', label: string }) => {
    const isProTier = tier === 'Pro';
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${isProTier ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-purple-50 text-purple-600 border border-purple-200'}`}>
        <i className={`fa-solid ${isProTier ? 'fa-bolt' : 'fa-crown'}`}></i>
        <span>{tier}</span>
      </div>
    );
  };

  if (isLoadingData) return <div className="h-screen flex items-center justify-center bg-layer-bg dark:bg-slate-900 text-layer-dark dark:text-layer-primary font-black text-2xl animate-pulse tracking-widest uppercase">BOOTING STYLE CORE...</div>;

  return (
    <div className="bg-layer-bg dark:bg-slate-900 min-h-screen font-sans flex flex-col relative overflow-x-hidden transition-colors duration-300">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex-grow pb-32">
        <div className="w-full text-white py-8 md:py-16 text-center shadow-2xl relative overflow-hidden"
             style={{ 
               backgroundColor: '#005f9e',
               backgroundImage: `linear-gradient(to bottom right, #005f9e, #6bb0d8)`,
               backgroundSize: '100% 100%'
             }}>
          <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tighter drop-shadow-2xl animate-fade-in-up uppercase px-4">
            {activeTab === 'wardrobe' ? 'Wardrobe Vault' : 
             activeTab === 'outfits' ? 'Stylist Lab' : 
             activeTab === 'library' ? 'Style Library' :
             activeTab === 'explore' ? 'Explore Global Feed' : 'Scheduler'}
          </h1>
          <div className="inline-flex items-center gap-2 md:gap-4 bg-white/10 border-2 border-white/20 backdrop-blur-2xl px-4 md:px-8 py-2 md:py-3 rounded-full shadow-inner animate-fade-in">
              <i className="fa-solid fa-cloud-bolt text-yellow-300"></i>
              <span className="font-black text-xs md:text-sm uppercase tracking-widest">{weather.temp}°C, {weather.condition}</span>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          {errorMessage && (
            <div className="bg-red-500 text-white p-6 rounded-2xl mb-8 flex justify-between items-start shadow-lg animate-fade-in border-4 border-white/20">
              <div className="flex gap-4">
                <i className="fa-solid fa-triangle-exclamation text-3xl mt-1"></i>
                <div>
                  <p className="font-black text-xl uppercase tracking-tight">Intelligence Alert</p>
                  <p className="font-bold opacity-90">{errorMessage}</p>
                </div>
              </div>
              <button onClick={() => setErrorMessage(null)} className="hover:scale-110 transition p-2"><i className="fa-solid fa-times text-xl"></i></button>
            </div>
          )}
          
          {activeTab === 'wardrobe' && (
            <div className="animate-fade-in">
              <div className="flex flex-col md:flex-row justify-between items-center mb-8 md:mb-12 gap-4 md:gap-8">
                <div className="flex flex-wrap gap-2 md:gap-3 justify-center">
                  {categories.map(cat => (
                    <button key={cat} onClick={() => setFilterCategory(cat)} className={`px-4 py-2 md:px-8 md:py-3 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition transform hover:scale-105 shadow-xl ${filterCategory === cat ? 'bg-layer-btn text-white ring-2 md:ring-4 ring-white/30' : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>{cat}</button>
                  ))}
                </div>
                <div className="relative w-full md:w-auto">
                  <button onClick={handleGapAnalysis} disabled={isGapLoading} className={`w-full md:w-auto px-6 py-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 ${isPro ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-gray-100 dark:bg-slate-800 text-gray-400'}`}>
                    {isGapLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-magnifying-glass"></i>} Gap Analysis
                  </button>
                  {!isPro && <div className="absolute -top-2 -right-2 z-10 scale-75 md:scale-100"><FeatureLock tier="Pro" label="PRO" /></div>}
                </div>
              </div>

              {gaps && (
                <div className="mb-12 bg-orange-50 dark:bg-orange-950/20 p-10 rounded-[3rem] border-4 border-orange-200 dark:border-orange-500/30 animate-fade-in-up relative shadow-xl">
                  <button onClick={() => setGaps(null)} className="absolute top-8 right-8 text-orange-400 hover:text-orange-600 transition"><i className="fa-solid fa-times text-2xl"></i></button>
                  <h3 className="text-3xl font-black text-orange-800 dark:text-orange-300 uppercase mb-4 tracking-tighter">Wardrobe Gaps</h3>
                  <p className="text-orange-700 dark:text-orange-200 italic font-bold mb-8 text-lg">{gaps.reasoning}</p>
                  <div className="flex flex-wrap gap-4">
                    {gaps.missingItems.map((item, i) => (
                      <span key={i} className="bg-white dark:bg-slate-800 px-6 py-3 rounded-2xl font-black text-orange-600 dark:text-orange-400 shadow-md uppercase text-xs tracking-widest">{item}</span>
                    ))}
                  </div>
                </div>
              )}

              {newItemImage && (
                <div className="mb-12 bg-white dark:bg-slate-800 p-10 rounded-[3rem] shadow-2xl border-4 border-layer-primary animate-fade-in-up flex flex-col md:flex-row gap-10 items-center">
                   <img src={newItemImage} className="w-48 h-64 object-cover rounded-3xl shadow-xl" />
                   <div className="flex-1">
                      {isAnalyzing ? (
                        <div className="flex items-center gap-4 text-layer-primary">
                          <i className="fa-solid fa-spinner fa-spin text-4xl"></i>
                          <span className="text-xl font-black uppercase tracking-widest">Analysis...</span>
                        </div>
                      ) : analysisResult ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Item Identity</p><p className="text-2xl font-black text-gray-900 dark:text-white uppercase">{analysisResult.name}</p></div>
                           <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Category Mapping</p><p className="text-xl font-bold text-layer-btn uppercase">{analysisResult.category}</p></div>
                           <div className="md:col-span-2 flex gap-4 mt-4">
                             <button onClick={handleSaveNewItem} className="bg-layer-btn text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl">Save</button>
                             <button onClick={() => setNewItemImage(null)} className="bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 px-8 py-4 rounded-2xl font-black uppercase tracking-widest">Discard</button>
                           </div>
                        </div>
                      ) : null}
                   </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10">
                <label className="aspect-[3/4] border-4 border-dashed border-gray-200 dark:border-slate-700 rounded-[3rem] flex flex-col items-center justify-center cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-all group bg-white/20 dark:bg-slate-800/20 shadow-inner">
                   <div className="w-20 h-20 bg-gray-50 dark:bg-slate-700 rounded-3xl flex items-center justify-center mb-6 group-hover:bg-layer-primary group-hover:text-white transition-all shadow-xl">
                     <i className="fa-solid fa-camera-retro text-4xl"></i>
                   </div>
                   <span className="text-gray-400 dark:text-slate-500 font-black uppercase tracking-widest text-xs">New Entry</span>
                   <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                </label>
                {filterItems(items).map((item, index) => (
                  <div key={`${item.id}-${index}`} className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-xl overflow-hidden hover:shadow-2xl transition-all cursor-pointer group relative" onClick={() => setSelectedItem(item)}>
                     <div className="aspect-[3/4] overflow-hidden relative">
                       <img src={item.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition duration-[1.2s]" />
                     </div>
                     <div className="p-7 border-t border-gray-50 dark:border-slate-700 flex justify-between items-center">
                        <h4 className="font-black text-gray-900 dark:text-white text-sm truncate uppercase tracking-tighter">{item.name}</h4>
                        <i className="fa-solid fa-chevron-right text-gray-200 dark:text-slate-600"></i>
                     </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'outfits' && (
            <div className="animate-fade-in-up max-w-6xl mx-auto">
               <div className="bg-white dark:bg-slate-800 p-6 md:p-16 rounded-3xl md:rounded-[4rem] shadow-2xl mb-8 md:mb-16 border-t-[8px] md:border-t-[16px] border-layer-btn relative overflow-hidden ring-1 ring-gray-100 dark:ring-slate-700">
                  <h2 className="text-3xl md:text-6xl font-black text-layer-dark dark:text-layer-primary mb-6 md:mb-12 tracking-tighter uppercase">Stylist Lab</h2>
                  
                  <div className="flex gap-2 md:gap-4 bg-gray-100 dark:bg-slate-900 p-2 md:p-3 rounded-2xl md:rounded-[2rem] mb-8 md:mb-12 max-w-full overflow-x-auto no-scrollbar items-center">
                    {['Standard', 'Twin', 'Orbit', 'Manual'].map((mode) => {
                      const modeLocked = (mode === 'Twin' && !isElite) || (mode === 'Orbit' && !isPro);
                      const displayLabel = mode === 'Twin' ? 'Icon Match' : mode === 'Manual' ? 'Manual' : mode;
                      return (
                        <button key={mode} onClick={() => setOutfitMode(mode as any)} className={`shrink-0 px-4 py-3 md:px-8 md:py-5 rounded-xl md:rounded-[1.5rem] font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.3em] transition-all flex items-center gap-2 md:gap-3 ${outfitMode === mode ? 'bg-white dark:bg-slate-800 text-layer-btn shadow-xl scale-105' : 'text-gray-400 hover:text-gray-600'}`}>
                          {displayLabel}
                          {modeLocked && <div className="scale-75 md:scale-100"><FeatureLock tier={mode === 'Twin' ? 'Elite' : 'Pro'} label={mode === 'Twin' ? 'ELITE' : 'PRO'} /></div>}
                        </button>
                      );
                    })}
                  </div>

                  {items.length === 0 ? (
                    <div className="bg-layer-bg/30 dark:bg-slate-900/30 backdrop-blur-xl p-16 rounded-[3rem] border-4 border-dashed border-layer-primary text-center">
                       <i className="fa-solid fa-box-open text-6xl mb-8 text-layer-primary"></i>
                       <h3 className="text-3xl font-black text-layer-dark dark:text-white mb-4 uppercase">Vault Empty</h3>
                       <p className="text-gray-500 dark:text-gray-400 mb-8 font-bold">Upload at least 3 items to the Style Vault to enable AI synthesis.</p>
                       <button onClick={() => setActiveTab('wardrobe')} className="bg-layer-btn text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest shadow-2xl">Go to Vault</button>
                    </div>
                  ) : ((outfitMode === 'Twin' && !isElite) || (outfitMode === 'Orbit' && !isPro)) ? (
                    <div className="animate-fade-in bg-layer-bg/30 dark:bg-slate-900/30 backdrop-blur-xl p-16 rounded-[3rem] border-4 border-dashed border-layer-primary text-center">
                       <i className={`fa-solid ${outfitMode === 'Twin' ? 'fa-crown text-purple-500' : 'fa-bolt text-blue-500'} text-6xl mb-8`}></i>
                       <h3 className="text-3xl font-black text-layer-dark dark:text-white mb-4 uppercase">Upgrade Required</h3>
                       <button onClick={() => navigate('/upgrade')} className="bg-layer-btn text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest shadow-2xl">Upgrade Now</button>
                    </div>
                  ) : (
                    <>
                      {outfitMode === 'Standard' && (
                        <div className="animate-fade-in">
                          <div className="mb-10 bg-gray-50 dark:bg-slate-900 p-8 rounded-[3rem] shadow-inner">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Stylist Request</label>
                            <textarea value={customOutfitRequest} onChange={(e) => setCustomOutfitRequest(e.target.value)} placeholder="e.g. 'I want an all-black look'" className="w-full bg-transparent border-none focus:ring-0 font-black text-2xl text-gray-900 dark:text-white resize-none h-32" />
                          </div>
                          {!customOutfitRequest && (
                            <div className="mb-14">
                              <p className="text-gray-400 font-black text-xs uppercase tracking-widest mb-8">Vibe Selection</p>
                              <div className="flex flex-wrap gap-5">
                                {['Casual', 'Business', 'Night Out', 'Streetwear'].map(occ => (
                                  <button key={occ} onClick={() => setOutfitOccasion(occ)} className={`px-12 py-6 rounded-3xl font-black border-4 transition-all shadow-xl ${outfitOccasion === occ ? 'bg-layer-btn text-white border-layer-btn -translate-y-3' : 'bg-white dark:bg-slate-700 text-gray-400 dark:text-gray-300 border-gray-50 dark:border-slate-600'}`}>{occ}</button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {outfitMode === 'Twin' && (
                        <div className="animate-fade-in mb-14">
                          <p className="text-gray-400 font-black text-xs uppercase tracking-widest mb-8">Style Reference</p>
                          <input type="text" value={styleTwinInput} onChange={e => setStyleTwinInput(e.target.value)} placeholder="e.g. Timothée Chalamet" className="w-full p-8 bg-gray-50 dark:bg-slate-900 border-4 border-gray-100 dark:border-slate-700 rounded-[2.5rem] font-black text-3xl outline-none focus:bg-white dark:focus:bg-slate-950 dark:text-white transition-all shadow-inner" />
                        </div>
                      )}

                      {outfitMode === 'Orbit' && (
                        <div className="animate-fade-in mb-14">
                           <div className="flex justify-between items-center mb-8">
                             <p className="text-gray-400 font-black text-xs uppercase tracking-widest">Hero Piece</p>
                             {!heroItem && (
                               <div className="flex gap-2">
                                 {categories.map(cat => (
                                   <button key={cat} onClick={() => setFilterCategory(cat)} className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition ${filterCategory === cat ? 'bg-layer-btn text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-400'}`}>{cat}</button>
                                 ))}
                               </div>
                             )}
                           </div>
                           {heroItem ? (
                             <div className="flex items-center gap-10 bg-gray-50 dark:bg-slate-900 p-8 rounded-[3rem] border-4 border-layer-btn">
                               <img src={heroItem.imageUrl} className="w-32 h-44 object-cover rounded-2xl" />
                               <div>
                                 <h4 className="text-2xl font-black text-gray-900 dark:text-white uppercase">{heroItem.name}</h4>
                                 <button onClick={() => setHeroItem(null)} className="mt-4 text-red-500 font-black text-xs uppercase hover:underline transition">Change</button>
                               </div>
                             </div>
                           ) : (
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-h-[400px] overflow-y-auto no-scrollbar p-6 bg-gray-50 dark:bg-slate-900 rounded-[3rem] border-4 border-dashed border-gray-200 dark:border-slate-700">
                                {filterItems(items).map((i, index) => (
                                  <div key={`${i.id}-${index}`} onClick={() => setHeroItem(i)} className="aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer hover:scale-105 transition shadow-lg">
                                     <img src={i.imageUrl} className="w-full h-full object-cover" />
                                  </div>
                                ))}
                             </div>
                           )}
                        </div>
                      )}

                      {outfitMode === 'Manual' && (
                        <div className="animate-fade-in">
                          <div className="flex justify-between items-center mb-8">
                            <p className="text-gray-400 font-black text-xs uppercase tracking-widest">Assemble Ensemble</p>
                            <div className="flex gap-2">
                              {categories.map(cat => (
                                <button key={cat} onClick={() => setFilterCategory(cat)} className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition ${filterCategory === cat ? 'bg-layer-btn text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-400'}`}>{cat}</button>
                              ))}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-8 max-h-[450px] overflow-y-auto no-scrollbar p-6 bg-gray-50 dark:bg-slate-900 rounded-[3rem] border-4 border-dashed border-gray-200 dark:border-slate-700">
                            {filterItems(items).map((item, index) => {
                              const isSelected = manualSelectedItems.includes(item.id);
                              return (
                                <div key={`${item.id}-${index}`} onClick={() => {
                                    if (isSelected) setManualSelectedItems(manualSelectedItems.filter(id => id !== item.id));
                                    else setManualSelectedItems([...manualSelectedItems, item.id]);
                                  }} className={`aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer transition transform hover:scale-105 relative border-4 ${isSelected ? 'border-layer-btn' : 'border-transparent'}`}>
                                  <img src={item.imageUrl} className="w-full h-full object-cover" />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="mt-8">
                        {isGenerating && (
                          <div className="mb-10 p-16 bg-gray-50 dark:bg-slate-900 rounded-[3rem] border-4 border-dashed border-layer-primary animate-pulse text-center">
                             <h3 className="text-2xl font-black text-layer-dark dark:text-white uppercase tracking-widest">{generationStatus}</h3>
                             <div className="w-16 h-16 border-4 border-t-layer-btn border-gray-200 rounded-full animate-spin mx-auto mt-4"></div>
                          </div>
                        )}

                        {generatedLook && (
                          <div className="mb-10 p-12 bg-white dark:bg-slate-900/50 rounded-[4rem] border-4 border-layer-btn animate-fade-in shadow-inner relative">
                             {/* The Grid of Actual Items Side-by-Side */}
                             <div className="mb-12 flex flex-wrap justify-center gap-6 overflow-x-auto no-scrollbar pb-4">
                                {generatedLook.itemIds?.map((id, index) => {
                                  const item = items.find(i => i.id === id);
                                  if (!item) return null;
                                  return (
                                    <div key={`${id}-${index}`} className="flex-shrink-0 w-48 aspect-[3/4] bg-gray-100 dark:bg-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl animate-fade-in border-4 border-white dark:border-slate-700" style={{ animationDelay: `${index * 150}ms` }}>
                                       <img src={item.imageUrl} className="w-full h-full object-cover" />
                                       <div className="absolute bottom-4 left-4 right-4 bg-white/90 dark:bg-black/80 backdrop-blur-md p-2 rounded-xl text-center">
                                          <p className="text-[10px] font-black uppercase text-gray-900 dark:text-white truncate">{item.name}</p>
                                       </div>
                                    </div>
                                  );
                                })}
                             </div>
                             <div className="flex justify-between items-start mb-6">
                               <h3 className="text-4xl font-black text-layer-dark dark:text-white uppercase tracking-tighter">{generatedLook.description}</h3>
                               <button 
                                 onClick={handleSaveOutfit} 
                                 className={`${isLookSaved ? 'bg-red-500' : 'bg-layer-btn'} text-white p-4 rounded-2xl shadow-xl hover:scale-110 active:scale-90 transition`}
                               >
                                 <i className="fa-solid fa-heart text-2xl"></i>
                               </button>
                             </div>
                             <p className="text-xl text-gray-700 dark:text-gray-300 font-bold italic">"{generatedLook.reasoning}"</p>
                          </div>
                        )}

                        <button 
                          onClick={handleGenerateLook} 
                          disabled={isGenerating || (outfitMode === 'Orbit' && !heroItem) || (outfitMode === 'Manual' && manualSelectedItems.length < 2) || items.length === 0} 
                          className="w-full bg-layer-btn text-white py-10 rounded-[2.5rem] font-black text-4xl shadow-2xl hover:bg-layer-dark transition-all flex items-center justify-center gap-8 uppercase tracking-tighter"
                        >
                          {isGenerating ? <i className="fa-solid fa-sync fa-spin"></i> : <i className="fa-solid fa-sparkles"></i>}
                          {isGenerating ? 'Synthesizing...' : outfitMode === 'Manual' ? 'Complete Ensemble' : 'Ignite Stylist Agent'}
                        </button>
                      </div>
                    </>
                  )}
               </div>
            </div>
          )}

          {activeTab === 'library' && (
            <div className="animate-fade-in">
              <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-8">
                <div>
                  <h2 className="text-4xl md:text-6xl text-layer-dark dark:text-layer-primary font-black tracking-tighter uppercase">Style Library</h2>
                  <p className="text-gray-400 font-bold mt-2 uppercase tracking-widest text-xs">Your curated collection of neural ensembles</p>
                </div>
                <div className="flex gap-2 bg-gray-100 dark:bg-slate-800 p-2 rounded-[2rem] shadow-inner">
                  <button onClick={() => { setLibrarySubTab('all'); setSelectedFolderId(null); }} className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${librarySubTab === 'all' && !selectedFolderId ? 'bg-white dark:bg-slate-700 text-layer-btn shadow-xl' : 'text-gray-400'}`}>All</button>
                  <button onClick={() => { setLibrarySubTab('favorites'); setSelectedFolderId(null); }} className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${librarySubTab === 'favorites' ? 'bg-white dark:bg-slate-700 text-red-500 shadow-xl' : 'text-gray-400'}`}>Favorites</button>
                  <button onClick={() => setLibrarySubTab('folders')} className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${librarySubTab === 'folders' || selectedFolderId ? 'bg-white dark:bg-slate-700 text-layer-primary shadow-xl' : 'text-gray-400'}`}>Folders</button>
                </div>
              </div>

              {librarySubTab === 'folders' && !selectedFolderId && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 animate-fade-in">
                  <button 
                    onClick={() => setIsCreatingFolder(true)}
                    className="aspect-square border-4 border-dashed border-gray-200 dark:border-slate-700 rounded-[2.5rem] flex flex-col items-center justify-center hover:bg-white dark:hover:bg-slate-800 transition-all group"
                  >
                    <i className="fa-solid fa-folder-plus text-3xl text-gray-300 group-hover:text-layer-primary mb-4"></i>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">New Folder</span>
                  </button>
                  {folders.map(folder => (
                    <div key={folder.id} className="relative group">
                      <button 
                        onClick={() => setSelectedFolderId(folder.id)}
                        className="w-full aspect-square bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-xl flex flex-col items-center justify-center hover:scale-105 transition-all border-b-8"
                        style={{ borderBottomColor: folder.color }}
                      >
                        <i className="fa-solid fa-folder text-4xl mb-4" style={{ color: folder.color }}></i>
                        <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tighter truncate px-4 w-full">{folder.name}</span>
                        <span className="text-[9px] font-black text-gray-400 uppercase mt-1">
                          {savedOutfits.filter(o => o.folderId === folder.id).length} Items
                        </span>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg flex items-center justify-center"
                      >
                        <i className="fa-solid fa-times text-xs"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {isCreatingFolder && (
                <div className="fixed inset-0 bg-layer-dark/60 backdrop-blur-md z-[1000] flex items-center justify-center p-4" onClick={() => setIsCreatingFolder(false)}>
                  <div className="bg-white dark:bg-slate-800 p-12 rounded-[3rem] shadow-2xl max-w-md w-full border-8 border-gray-50 dark:border-slate-700" onClick={e => e.stopPropagation()}>
                    <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-8 uppercase tracking-tighter">New Folder</h3>
                    <input 
                      autoFocus
                      type="text" 
                      value={newFolderName} 
                      onChange={e => setNewFolderName(e.target.value)}
                      placeholder="Folder Name"
                      className="w-full p-6 bg-gray-50 dark:bg-slate-900 border-4 border-gray-100 dark:border-slate-700 rounded-2xl font-black text-xl outline-none mb-8 dark:text-white"
                    />
                    <div className="flex gap-4">
                      <button onClick={handleCreateFolder} className="flex-1 bg-layer-btn text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-xl">Create</button>
                      <button onClick={() => setIsCreatingFolder(false)} className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-500 py-4 rounded-xl font-black uppercase tracking-widest">Cancel</button>
                    </div>
                  </div>
                </div>
              )}

              {(librarySubTab !== 'folders' || selectedFolderId) && (
                <div className="animate-fade-in">
                  {selectedFolderId && (
                    <div className="mb-12 flex items-center gap-6">
                      <button onClick={() => setSelectedFolderId(null)} className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl shadow-lg flex items-center justify-center text-gray-400 hover:text-layer-btn transition"><i className="fa-solid fa-arrow-left"></i></button>
                      <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                        {folders.find(f => f.id === selectedFolderId)?.name}
                      </h3>
                    </div>
                  )}

                  {savedOutfits.filter(o => {
                    if (librarySubTab === 'favorites') return o.isFavorite;
                    if (selectedFolderId) return o.folderId === selectedFolderId;
                    return true;
                  }).length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 p-20 rounded-[4rem] text-center shadow-2xl border-4 border-dashed border-gray-100 dark:border-slate-700">
                      <i className="fa-solid fa-heart-crack text-6xl text-gray-200 mb-8"></i>
                      <h3 className="text-2xl font-black text-gray-400 uppercase">No Outfits Found</h3>
                      <button onClick={() => setActiveTab('outfits')} className="mt-8 bg-layer-btn text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl">Start Designing</button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                      {savedOutfits.filter(o => {
                        if (librarySubTab === 'favorites') return o.isFavorite;
                        if (selectedFolderId) return o.folderId === selectedFolderId;
                        return true;
                      }).map((outfit, index) => (
                        <div key={`${outfit.id}-${index}`} className="bg-white dark:bg-slate-800 rounded-[3.5rem] shadow-2xl overflow-hidden border-4 border-white dark:border-slate-700 group relative">
                          <div className="absolute top-8 right-8 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <div className="relative group/folder">
                              <button className="w-10 h-10 bg-white text-gray-400 rounded-xl flex items-center justify-center hover:text-layer-primary transition shadow-lg"><i className="fa-solid fa-folder-open"></i></button>
                              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl py-4 hidden group-hover/folder:block border border-gray-100 dark:border-slate-700">
                                <p className="px-6 py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 dark:border-slate-700 mb-2">Move to Folder</p>
                                <button onClick={() => handleMoveToFolder(outfit.id, null)} className="w-full text-left px-6 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700">None</button>
                                {folders.map(f => (
                                  <button key={f.id} onClick={() => handleMoveToFolder(outfit.id, f.id)} className="w-full text-left px-6 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: f.color }}></div>
                                    {f.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <button 
                              onClick={() => handleToggleFavoriteOutfit(outfit.id)}
                              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-lg ${outfit.isFavorite ? 'bg-red-500 text-white' : 'bg-white text-gray-400'}`}
                            >
                              <i className="fa-solid fa-heart"></i>
                            </button>
                            <button onClick={() => { backend.deleteOutfit(outfit.id); setSavedOutfits(savedOutfits.filter(o => o.id !== outfit.id)); }} className="w-10 h-10 bg-white text-red-400 rounded-xl flex items-center justify-center hover:text-red-600 transition shadow-lg"><i className="fa-solid fa-trash-can"></i></button>
                          </div>
                          <div className="p-8 flex gap-4 overflow-x-auto no-scrollbar bg-gray-50 dark:bg-slate-900/50">
                            {outfit.imageUrl ? (
                              <img src={outfit.imageUrl} className="w-full h-64 object-cover rounded-2xl shadow-lg border-2 border-white dark:border-slate-700" />
                            ) : (
                              outfit.itemIds?.map((id, idx) => {
                                const item = items.find(i => i.id === id);
                                if (!item) return null;
                                return (
                                  <img key={`${id}-${idx}`} src={item.imageUrl} className="w-24 h-32 object-cover rounded-2xl shadow-lg border-2 border-white dark:border-slate-700 flex-shrink-0" />
                                );
                              })
                            )}
                          </div>
                          <div className="p-10">
                            <div className="flex justify-between items-start mb-4">
                              <h4 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{outfit.description}</h4>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 font-bold italic text-sm">"{outfit.reasoning}"</p>
                            <div className="mt-8 pt-6 border-t border-gray-50 dark:border-slate-700 flex justify-between items-center">
                              <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{new Date(outfit.date).toLocaleDateString()}</span>
                              <button onClick={() => setIsPlanning('Mon')} className="text-layer-btn font-black text-[10px] uppercase tracking-widest hover:underline">Plan This</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'explore' && (
            <div className="animate-fade-in">
              <div className="flex flex-col md:flex-row justify-between items-center mb-8 md:mb-16 gap-4 md:gap-8">
                 <div className="text-center md:text-left">
                   <h2 className="text-4xl md:text-6xl text-layer-dark dark:text-layer-primary font-black tracking-tighter uppercase">Explore</h2>
                   <p className="text-gray-400 font-bold mt-1 md:mt-2 uppercase tracking-[0.2em] md:tracking-[0.4em] text-[10px] md:text-xs">Collective Style Intelligence</p>
                 </div>
                 <div className="flex gap-2 md:gap-4 bg-gray-100 dark:bg-slate-800 p-2 rounded-2xl md:rounded-[2rem] shadow-inner">
                    <button onClick={() => setExploreSubTab('feed')} className={`px-4 py-2 md:px-8 md:py-4 rounded-xl md:rounded-[1.5rem] font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all ${exploreSubTab === 'feed' ? 'bg-white dark:bg-slate-700 text-layer-btn shadow-xl scale-105' : 'text-gray-400 hover:text-gray-600'}`}>Global Feed</button>
                    <button onClick={() => setExploreSubTab('vibe')} className={`px-4 py-2 md:px-8 md:py-4 rounded-xl md:rounded-[1.5rem] font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${exploreSubTab === 'vibe' ? 'bg-white dark:bg-slate-700 text-purple-500 shadow-xl scale-105' : 'text-gray-400 hover:text-gray-600'}`}>Vibe Board <div className="scale-75 md:scale-100"><FeatureLock tier="Elite" label="ELITE" /></div></button>
                 </div>
                 <div className="relative w-full md:w-auto">
                    <button onClick={handleDNASync} disabled={isDNASyncing} className={`w-full md:w-auto px-8 py-4 md:px-12 md:py-6 rounded-xl md:rounded-3xl font-black text-xs md:text-sm uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 ${isPro ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-200 text-gray-400 opacity-60'}`}>
                      {isDNASyncing ? <i className="fa-solid fa-dna fa-spin"></i> : <i className="fa-solid fa-dna"></i>} Sync DNA
                    </button>
                    {!isPro && <div className="absolute -top-2 -right-2 z-10 scale-75 md:scale-100"><FeatureLock tier="Pro" label="PRO" /></div>}
                 </div>
              </div>
              {exploreSubTab === 'feed' ? (
                <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-10 space-y-10 animate-fade-in">
                  {communityPosts.map((post, index) => {
                    const isDNAMatch = matchedDNAIds.includes(post.id);
                    return (
                      <div key={`${post.id}-${index}`} className={`break-inside-avoid bg-white dark:bg-slate-800 rounded-[3rem] shadow-xl overflow-hidden group border-4 transition-all relative ${isDNAMatch ? 'border-indigo-500 ring-4 ring-indigo-500/20' : 'border-gray-50 dark:border-slate-700 hover:shadow-2xl'}`}>
                          {isDNAMatch && <div className="absolute top-6 left-6 z-20 bg-indigo-600 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl animate-pulse">DNA Match</div>}
                          <img src={post.imageUrl} className="w-full object-cover group-hover:scale-105 transition duration-[1.5s]" alt={post.title} />
                          <div className="p-8">
                            <h4 className="text-2xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tighter">{post.title}</h4>
                            <div className="flex justify-between items-center mt-6">
                                <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest">@{post.author}</p>
                                <button 
                                  onClick={() => handleFavoriteFromFeed(post)}
                                  className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700 px-4 py-2 rounded-full hover:bg-red-50 dark:hover:bg-red-950/20 transition group"
                                >
                                  <i className="fa-solid fa-heart text-gray-300 group-hover:text-red-500 text-xs transition"></i>
                                  <span className="font-black text-xs text-gray-900 dark:text-white">{post.likes}</span>
                                </button>
                            </div>
                          </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="animate-fade-in bg-slate-900/50 backdrop-blur-xl p-24 rounded-[4rem] border-4 border-dashed border-purple-500/30 text-center relative overflow-hidden">
                  <h3 className="text-5xl font-black text-white mb-6 uppercase tracking-tighter">Vibe Board Discovery</h3>
                  <p className="text-slate-400 text-xl font-bold leading-relaxed mb-12">Swipe through curated aesthetics. Coming Soon for Elite members.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'planner' && (
            <div className="animate-fade-in">
              <div className="flex flex-col md:flex-row justify-between items-center mb-10 md:mb-20 gap-6">
                <h2 className="text-4xl md:text-7xl text-layer-dark dark:text-layer-primary font-black tracking-tighter uppercase">Scheduler</h2>
                <div className="relative w-full md:w-auto">
                  <button onClick={handleAutoSchedule} disabled={isAutoScheduling} className={`w-full md:w-auto px-8 py-4 md:px-12 md:py-6 rounded-xl md:rounded-3xl font-black text-lg md:text-xl uppercase tracking-widest shadow-2xl transition-all flex items-center justify-center gap-3 ${isPro ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:scale-105' : 'bg-gray-100 dark:bg-slate-800 text-gray-400'}`}>
                    {isAutoScheduling ? <i className="fa-solid fa-wand-sparkles fa-spin"></i> : <i className="fa-solid fa-wand-sparkles"></i>} Auto-Schedule
                  </button>
                  {!isPro && <div className="absolute -top-2 -right-2 z-10 scale-75 md:scale-100"><FeatureLock tier="Pro" label="PRO" /></div>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-7 gap-6 md:gap-10">
                 {plannedWeek.map(p => {
                   const assignedOutfit = savedOutfits.find(o => o.id === p.outfitId);
                   return (
                     <div key={p.day} className={`min-h-[300px] md:min-h-[500px] bg-white dark:bg-slate-800 rounded-3xl md:rounded-[4rem] p-6 md:p-10 flex flex-col items-center shadow-2xl transition-all transform hover:-translate-y-2 md:hover:-translate-y-4 cursor-pointer relative overflow-hidden ${assignedOutfit ? 'ring-[4px] md:ring-[6px] ring-layer-btn' : 'border-2 md:border-4 border-gray-100 dark:border-slate-700'}`} onClick={() => setIsPlanning(p.day)}>
                       <span className="text-2xl md:text-4xl font-black mb-6 md:mb-12 text-gray-200 dark:text-slate-700 uppercase tracking-tighter">{p.day}</span>
                       {assignedOutfit ? (
                         <div className="w-full h-full flex flex-col items-center flex-1 justify-center animate-fade-in">
                            <div className="w-full aspect-[3/4] bg-gray-100 dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white dark:border-slate-700 mb-8 transform group-hover:scale-105 transition">
                              {/* Display first item from the outfit if itemIds exist */}
                              {assignedOutfit.itemIds && assignedOutfit.itemIds.length > 0 ? (
                                <img src={items.find(i => i.id === assignedOutfit.itemIds?.[0])?.imageUrl} className="w-full h-full object-cover" />
                              ) : (
                                <img src={`https://picsum.photos/400/600?random=${assignedOutfit.id}`} className="w-full h-full object-cover" />
                              )}
                            </div>
                            <p className="text-center font-black text-base text-gray-900 dark:text-white leading-tight mb-4">{assignedOutfit.description}</p>
                            <button onClick={(e) => { e.stopPropagation(); setPlannedWeek(plannedWeek.map(x => x.day === p.day ? { ...x, outfitId: null } : x)); }} className="text-red-400 font-black text-[10px] uppercase hover:text-red-600 tracking-widest">Clear</button>
                         </div>
                       ) : (
                         <div className="flex-1 w-full border-4 border-dashed border-gray-100 dark:border-slate-700 rounded-[3rem] flex flex-col items-center justify-center text-gray-300 dark:text-slate-600 hover:text-layer-btn transition-all">
                            <i className="fa-solid fa-calendar-plus text-6xl"></i>
                         </div>
                       )}
                     </div>
                   );
                 })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chatbot UI */}
      <div className="fixed bottom-10 right-10 z-[200] flex flex-col items-end">
         {isChatOpen && isPro && (
           <div className={`bg-white dark:bg-slate-800 w-[500px] h-[750px] rounded-[4rem] shadow-2xl mb-10 flex flex-col overflow-hidden border border-gray-100 dark:border-slate-700 animate-fade-in-up origin-bottom-right`}>
              <div className={`p-10 flex justify-between items-center text-white relative bg-layer-dark dark:bg-slate-950`}>
                <div className="flex items-center gap-8">
                  <div className={`w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center shadow-2xl ${isElite ? 'text-purple-500' : 'text-layer-dark dark:text-layer-primary'}`}>
                    <i className={`fa-solid ${isElite ? 'fa-user-tie' : 'fa-robot'} text-4xl`}></i>
                  </div>
                  <div><p className="font-black text-3xl tracking-tighter uppercase">{isElite ? 'Master Stylist' : 'Assistant'}</p></div>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="bg-white/10 w-12 h-12 rounded-full hover:bg-white/20 transition-all flex items-center justify-center shadow-lg"><i className="fa-solid fa-times text-xl"></i></button>
              </div>
              <div className={`flex-1 p-10 overflow-y-auto space-y-10 no-scrollbar bg-gray-50/70 dark:bg-slate-900/70`}>
                {chatHistory.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-8 rounded-[2.5rem] shadow-2xl text-lg font-bold animate-fade-in ${m.role === 'user' ? (isElite ? 'bg-purple-600' : 'bg-layer-btn') + ' text-white rounded-br-none' : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-white rounded-bl-none border border-gray-100'}`}>
                          {m.text}
                      </div>
                    </div>
                ))}
                {isChatLoading && <div className="p-6 rounded-3xl w-fit shadow-2xl bg-white dark:bg-slate-800"><i className="fa-solid fa-ellipsis fa-bounce text-xl text-layer-btn"></i></div>}
                <div ref={chatEndRef} />
              </div>
              <div className={`p-10 border-t flex gap-5 border-gray-50 dark:border-slate-700 bg-white dark:bg-slate-800`}>
                <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} className={`flex-1 rounded-[2rem] px-10 py-6 text-lg font-black outline-none transition-all shadow-inner border bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white border-gray-100 dark:border-slate-700`} placeholder="Ask advice..." />
                <button onClick={handleSendMessage} className={`text-white w-20 h-20 rounded-[2rem] flex items-center justify-center transition-all bg-layer-dark hover:scale-110 shadow-2xl`}><i className="fa-solid fa-paper-plane text-2xl"></i></button>
              </div>
           </div>
         )}
         <button onClick={() => { if (!isPro) { navigate('/upgrade'); return; } setIsChatOpen(!isChatOpen); }} className={`bg-layer-dark dark:bg-layer-btn text-white p-10 rounded-[3rem] shadow-2xl hover:scale-110 active:scale-90 transition-all group ring-[16px] ring-white/40 dark:ring-slate-800`}>
           <i className={`fa-solid ${isChatOpen && isPro ? 'fa-times' : (isElite ? 'fa-user-tie' : 'fa-wand-magic-sparkles')} text-5xl`}></i>
           {!isPro && <div className="absolute -top-4 -right-4 z-20"><FeatureLock tier="Pro" label="PRO" /></div>}
         </button>
      </div>

      {isPlanning && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-8 bg-black/95 backdrop-blur-3xl animate-fade-in">
           <div className="bg-white dark:bg-slate-800 rounded-[5rem] p-16 max-w-5xl w-full max-h-[85vh] overflow-y-auto no-scrollbar shadow-2xl border-8 border-gray-50 dark:border-slate-700">
              <div className="flex justify-between items-center mb-14">
                <h3 className="text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Look for: {isPlanning}</h3>
                <button onClick={() => setIsPlanning(null)} className="text-gray-400 hover:text-black dark:hover:text-white transition-colors transform hover:rotate-90 duration-300"><i className="fa-solid fa-times text-4xl"></i></button>
              </div>
              {savedOutfits.length === 0 ? (
                <div className="text-center py-32 flex flex-col items-center">
                  <p className="text-gray-300 dark:text-slate-600 font-black text-2xl mb-12 uppercase">No Saved Looks</p>
                  <button onClick={() => { setActiveTab('outfits'); setIsPlanning(null); }} className="bg-layer-btn text-white px-16 py-6 rounded-3xl font-black text-xl shadow-2xl hover:scale-105 transition">Design Lab</button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
                  {savedOutfits.map((o, index) => (
                    <div key={`${o.id}-${index}`} onClick={() => handlePlannerAssign(isPlanning, o.id)} className="bg-gray-50 dark:bg-slate-900 p-8 rounded-[3.5rem] border-8 border-transparent hover:border-layer-btn transition-all cursor-pointer group flex flex-col items-center">
                       {o.itemIds && o.itemIds.length > 0 ? (
                         <img src={items.find(i => i.id === o.itemIds?.[0])?.imageUrl} className="w-full aspect-[3/4] object-cover rounded-[2.5rem] shadow-2xl mb-8 group-hover:scale-110 transition duration-500" />
                       ) : (
                         <img src={`https://picsum.photos/400/600?random=${o.id}`} className="w-full aspect-[3/4] object-cover rounded-[2.5rem] shadow-2xl mb-8 group-hover:scale-110 transition duration-500" />
                       )}
                       <p className="font-black text-lg text-gray-900 dark:text-white text-center uppercase tracking-tighter leading-none">{o.description}</p>
                    </div>
                  ))}
                </div>
              )}
           </div>
        </div>
      )}

      {selectedItem && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-8 bg-black/80 backdrop-blur-3xl animate-fade-in" onClick={() => setSelectedItem(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-[5rem] p-20 max-w-3xl w-full shadow-2xl relative border-8 border-gray-50 dark:border-slate-700" onClick={e => e.stopPropagation()}>
             <img src={selectedItem.imageUrl} className="w-full h-[38rem] object-cover rounded-[3.5rem] mb-14 shadow-2xl" />
             <h3 className="text-5xl font-black text-gray-900 dark:text-white mb-6 tracking-tighter uppercase">{selectedItem.name}</h3>
             <div className="flex gap-4 mb-16">
               <span className="bg-layer-primary/20 text-layer-dark dark:text-layer-primary font-black px-8 py-3 rounded-full text-xs uppercase tracking-widest">{selectedItem.category}</span>
             </div>
             <div className="flex gap-8">
                <button onClick={() => { backend.deleteItem(selectedItem.id); setItems(items.filter(i => i.id !== selectedItem.id)); setSelectedItem(null); }} className="flex-1 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 py-6 rounded-3xl font-black hover:bg-red-100 transition-all text-2xl border-4 border-red-100 shadow-xl">Delete</button>
                <button onClick={() => setSelectedItem(null)} className="flex-1 bg-gray-900 dark:bg-layer-btn text-white py-6 rounded-3xl font-black hover:bg-black transition-all shadow-2xl text-2xl">Close Vault</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
