import React, { useState, useEffect, useRef } from 'react';
import Navigation from '../components/Navigation';
import { 
  generateOutfitSuggestion, 
  analyzeClosetItem, 
  chatWithStylist, 
  generatePackingList,
  generateResaleListing,
  generateCelebrityLook,
  analyzeWardrobeGaps,
  generateSmartPurge,
  generateColorPalette,
  generateThreeWaysToWear
} from '../services/geminiService';
import { backend } from '../services/backend';
import { ClothingItem, Outfit } from '../types';
import { useNavigate } from 'react-router-dom';

interface PlannedDay {
  day: string;
  imageUrl: string;
  items: string[];
  note: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  // Navigation State
  const [activeTab, setActiveTab] = useState('wardrobe');
  const [weather] = useState({ temp: 18, condition: 'Sunny', city: 'San Francisco' });
  
  // -- REAL DATA STATE --
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [savedOutfits, setSavedOutfits] = useState<Outfit[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // -- FEATURE: FILTERING --
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // -- FEATURE: OUTFIT GENERATOR STATE --
  const [outfitOccasion, setOutfitOccasion] = useState('Casual');
  const [outfitMode, setOutfitMode] = useState<'Standard' | 'Celebrity'>('Standard');
  const [styleTwinInput, setStyleTwinInput] = useState('');
  const [generatedLook, setGeneratedLook] = useState<{description: string, reasoning: string} | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // -- FEATURE: UPLOAD --
  const [newItemImage, setNewItemImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // -- FEATURE: CHATBOT STATE --
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<{role: string, text: string}[]>([
    { role: 'model', text: "Hi! I'm LayerBot. Ask me anything about style." }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // -- FEATURE: TRAVEL PACKER STATE --
  const [travelDest, setTravelDest] = useState("");
  const [travelDays, setTravelDays] = useState(3);
  const [travelActivity, setTravelActivity] = useState("Sightseeing");
  const [packingList, setPackingList] = useState<{categories: {name: string, items: string[]}[]} | null>(null);
  const [isPackingLoading, setIsPackingLoading] = useState(false);

  // -- MODAL STATES --
  const [viewingOutfit, setViewingOutfit] = useState<any>(null);
  const [viewingPlannerDay, setViewingPlannerDay] = useState<PlannedDay | null>(null);
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);

  // -- EXISTING AI FEATURES STATE --
  const [resaleData, setResaleData] = useState<{title: string, price: number, description: string, platform: string} | null>(null);
  const [isResaleLoading, setIsResaleLoading] = useState(false);

  const [gaps, setGaps] = useState<{missingItems: string[], reasoning: string} | null>(null);
  const [isGapLoading, setIsGapLoading] = useState(false);

  const [purgeData, setPurgeData] = useState<{ purgeSuggestions: { itemName: string, action: string, reason: string }[] } | null>(null);
  const [isPurgeLoading, setIsPurgeLoading] = useState(false);

  const [paletteData, setPaletteData] = useState<{ paletteName: string, colors: string[], description: string } | null>(null);
  const [isPaletteLoading, setIsPaletteLoading] = useState(false);

  const [threeWays, setThreeWays] = useState<{ outfits: { style: string, items: string[], tip: string }[] } | null>(null);
  const [isThreeWaysLoading, setIsThreeWaysLoading] = useState(false);

  // -- AUTH & DATA FETCHING EFFECT --
  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const user = backend.getCurrentUser();
      if (!user) {
        navigate('/login');
        return;
      }

      setIsLoadingData(true);
      try {
        const [fetchedItems, fetchedOutfits] = await Promise.all([
          backend.getItems(),
          backend.getOutfits()
        ]);
        setItems(fetchedItems);
        setSavedOutfits(fetchedOutfits);
      } catch (error) {
        console.error("Failed to load data", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    checkAuthAndLoad();
  }, [navigate]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isChatOpen]);

  // Derived State
  const filteredItems = filterCategory === 'all' 
    ? items 
    : items.filter(item => item.category === filterCategory);

  const categories = ['all', 'top', 'bottom', 'shoes', 'outerwear', 'accessory'];

  // Mock data for Planner (Static for now, but could be persisted similarly)
  const plannerData: Record<string, PlannedDay> = {
    'Mon': { day: 'Mon', imageUrl: 'https://picsum.photos/150/150?random=50', items: ['White Linen Shirt', 'Navy Chinos'], note: 'Early meeting' },
    'Wed': { day: 'Wed', imageUrl: 'https://picsum.photos/150/150?random=52', items: ['Black Hoodie', 'Denim Jacket'], note: 'Casual work day' }
  };

  // Handlers
  const handleGenerateLook = async () => {
    setIsGenerating(true);
    setGeneratedLook(null);
    try {
      let result;
      if (outfitMode === 'Celebrity') {
        result = await generateCelebrityLook(styleTwinInput, items);
      } else {
        result = await generateOutfitSuggestion(
          `${weather.condition}, ${weather.temp}°C`,
          "Smart Casual",
          outfitOccasion,
          items
        );
      }
      setGeneratedLook(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveOutfit = async () => {
    if (!generatedLook) return;
    try {
      const newOutfit = await backend.saveOutfit({
        description: generatedLook.description,
        reasoning: generatedLook.reasoning,
        date: new Date().toISOString()
      });
      setSavedOutfits([newOutfit, ...savedOutfits]);
      alert("Look saved to your collection!");
    } catch (e) {
      alert("Failed to save outfit");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic file size check for LocalStorage limit (5MB total usually)
    if (file.size > 1000000) { // 1MB warning
       alert("Large file detected. Since we are using browser storage, try smaller images for better performance.");
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      setNewItemImage(base64String);
      setIsAnalyzing(true);
      
      const analysis = await analyzeClosetItem(base64Data);
      setAnalysisResult(analysis);
      setIsAnalyzing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveNewItem = async () => {
    if (!newItemImage || !analysisResult) return;
    
    try {
      const savedItem = await backend.addItem({
        name: analysisResult.name,
        category: analysisResult.category.toLowerCase(),
        imageUrl: newItemImage,
        type: analysisResult.category.toLowerCase(),
        wearCount: 0,
        resaleValue: analysisResult.resaleEstimate
      });
      
      setItems([...items, savedItem]);
      alert("Item saved to closet!");
      resetUpload();
    } catch (e) {
      console.error(e);
      alert("Failed to save item. Storage might be full.");
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      await backend.deleteItem(id);
      setItems(items.filter(i => i.id !== id));
      setSelectedItem(null);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput("");
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatLoading(true);

    const apiHistory = chatHistory.map(h => ({
      role: h.role,
      parts: [{ text: h.text }]
    }));

    const response = await chatWithStylist(userMsg, apiHistory);
    setChatHistory(prev => [...prev, { role: 'model', text: response }]);
    setIsChatLoading(false);
  };

  const handleGeneratePacking = async () => {
    setIsPackingLoading(true);
    const result = await generatePackingList(travelDest, travelDays, travelActivity);
    setPackingList(result);
    setIsPackingLoading(false);
  };

  // Feature Handlers
  const handleGenerateResale = async () => {
    if(!selectedItem) return;
    setIsResaleLoading(true);
    const result = await generateResaleListing(selectedItem.name);
    setResaleData(result);
    setIsResaleLoading(false);
  }

  const handleGapAnalysis = async () => {
    setIsGapLoading(true);
    const result = await analyzeWardrobeGaps(items);
    setGaps(result);
    setIsGapLoading(false);
  }

  const handlePurge = async () => {
    setIsPurgeLoading(true);
    const result = await generateSmartPurge(items);
    setPurgeData(result);
    setIsPurgeLoading(false);
  }

  const handlePalette = async () => {
    setIsPaletteLoading(true);
    const result = await generateColorPalette(items);
    setPaletteData(result);
    setIsPaletteLoading(false);
  }

  const handleThreeWays = async () => {
    if(!selectedItem) return;
    setIsThreeWaysLoading(true);
    const result = await generateThreeWaysToWear(selectedItem, items);
    setThreeWays(result);
    setIsThreeWaysLoading(false);
  }

  const resetUpload = () => {
    setNewItemImage(null);
    setAnalysisResult(null);
  };

  const resetItemModal = () => {
    setSelectedItem(null);
    setResaleData(null);
    setThreeWays(null);
  }

  if (isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-layer-bg">
        <div className="flex flex-col items-center gap-4">
          <i className="fa-solid fa-circle-notch fa-spin text-4xl text-layer-primary"></i>
          <p className="text-gray-600 font-bold">Loading your digital closet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-layer-bg min-h-screen font-sans flex flex-col relative">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col pb-24">
        
        {/* Geometric Banner */}
        <div className="w-full text-white py-12 text-center shadow-lg relative"
             style={{ 
               backgroundColor: '#6bb0d8',
               backgroundImage: `
                 repeating-linear-gradient(135deg, transparent, transparent 35px, rgba(255,255,255,0.1) 35px, rgba(255,255,255,0.1) 70px),
                 linear-gradient(to right, #005f9e, #6bb0d8)
               `
             }}>
          <h1 className="text-3xl md:text-4xl font-bold mb-2 relative z-10 drop-shadow-md">Style Smarter. Dress Better.</h1>
          <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full mt-4 relative z-10">
              <i className="fa-solid fa-sun text-yellow-300"></i>
              <span className="font-medium">{weather.city}: {weather.condition}, {weather.temp}°C</span>
          </div>
        </div>

        {/* Tab Content */}
        <div className="container mx-auto px-4 py-8">
          
          {/* --- WARDROBE TAB --- */}
          {activeTab === 'wardrobe' && (
            <div className="animate-fade-in">
              <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                 <h2 className="text-3xl text-layer-dark font-bold">My Digital Closet ({items.length})</h2>
                 
                 {/* Filter Buttons */}
                 <div className="flex flex-wrap gap-2 justify-center">
                    {categories.map(cat => (
                      <button 
                        key={cat}
                        onClick={() => setFilterCategory(cat)}
                        className={`px-4 py-2 rounded-full text-sm font-bold capitalize transition ${filterCategory === cat ? 'bg-layer-btn text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                      >
                        {cat}
                      </button>
                    ))}
                 </div>
              </div>

              {/* AI Tools Bar */}
              <div className="flex flex-wrap gap-3 mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100 items-center justify-start overflow-x-auto no-scrollbar pb-2">
                <span className="text-xs font-bold text-gray-400 uppercase mr-2 flex-shrink-0">Closet AI</span>
                
                <button 
                  onClick={handleGapAnalysis}
                  disabled={isGapLoading}
                  className="flex items-center gap-2 bg-orange-50 text-orange-700 px-4 py-2 rounded-lg font-bold hover:bg-orange-100 transition shadow-sm whitespace-nowrap"
                >
                  {isGapLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-magnifying-glass-chart"></i>} Gap Analysis
                </button>

                <button 
                  onClick={handlePurge}
                  disabled={isPurgeLoading}
                  className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-lg font-bold hover:bg-red-100 transition shadow-sm whitespace-nowrap"
                >
                  {isPurgeLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-trash-can-arrow-up"></i>} Smart Purge
                </button>

                 <button 
                  onClick={handlePalette}
                  disabled={isPaletteLoading}
                  className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-bold hover:bg-indigo-100 transition shadow-sm whitespace-nowrap"
                >
                  {isPaletteLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-palette"></i>} Color Palette
                </button>
              </div>

              {/* Feature Results Area */}
              {gaps && (
                <div className="mb-6 bg-orange-50 border border-orange-200 p-6 rounded-xl animate-fade-in relative">
                   <button onClick={() => setGaps(null)} className="absolute top-2 right-2 text-orange-700"><i className="fa-solid fa-times"></i></button>
                   <h4 className="font-bold text-orange-800 mb-3 text-lg"><i className="fa-solid fa-puzzle-piece mr-2"></i>Missing Essentials</h4>
                   <p className="text-sm text-orange-700 mb-3 italic">"{gaps.reasoning}"</p>
                   <div className="flex flex-wrap gap-2">
                     {gaps.missingItems.map((item, i) => (
                       <span key={i} className="bg-white px-3 py-2 rounded-lg text-sm text-orange-600 border border-orange-100 flex items-center gap-2 shadow-sm font-bold"><i className="fa-solid fa-plus text-xs"></i> {item}</span>
                     ))}
                   </div>
                </div>
              )}

              {purgeData && (
                 <div className="mb-6 bg-gray-100 border border-gray-200 p-6 rounded-xl animate-fade-in relative">
                  <button onClick={() => setPurgeData(null)} className="absolute top-2 right-2 text-gray-500"><i className="fa-solid fa-times"></i></button>
                  <h4 className="font-bold text-gray-800 mb-3 text-lg"><i className="fa-solid fa-recycle mr-2"></i>Smart Purge Suggestions</h4>
                  <div className="space-y-3">
                    {purgeData.purgeSuggestions.map((item, i) => (
                      <div key={i} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm border-l-4 border-red-400">
                         <div>
                            <span className="font-bold text-gray-800">{item.itemName}</span>
                            <p className="text-xs text-gray-500">{item.reason}</p>
                         </div>
                         <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold">{item.action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {paletteData && (
                <div className="mb-6 bg-indigo-50 border border-indigo-200 p-6 rounded-xl animate-fade-in relative">
                  <button onClick={() => setPaletteData(null)} className="absolute top-2 right-2 text-indigo-700"><i className="fa-solid fa-times"></i></button>
                  <h4 className="font-bold text-indigo-800 mb-2 text-lg"><i className="fa-solid fa-palette mr-2"></i>{paletteData.paletteName}</h4>
                  <p className="text-sm text-indigo-600 mb-4">{paletteData.description}</p>
                  <div className="flex h-16 rounded-xl overflow-hidden shadow-md">
                     {paletteData.colors.map((color, i) => (
                       <div key={i} style={{ backgroundColor: color }} className="flex-1 flex items-end justify-center pb-2 hover:flex-[2] transition-all duration-300 group">
                         <span className="bg-black/50 text-white text-[10px] px-1 rounded opacity-0 group-hover:opacity-100 transition">{color}</span>
                       </div>
                     ))}
                  </div>
                </div>
              )}

              {/* Upload Panel */}
              {newItemImage && (
                <div className="mb-8 bg-white p-6 rounded-xl shadow-lg border-2 border-layer-primary animate-fade-in">
                   <div className="flex justify-between items-start mb-4">
                     <h3 className="text-xl font-bold text-layer-dark">New Item Analysis</h3>
                     <button onClick={resetUpload} className="text-gray-400 hover:text-red-500"><i className="fa-solid fa-times"></i></button>
                   </div>
                   
                   <div className="flex flex-col md:flex-row gap-6 items-start">
                      <img src={newItemImage} alt="Uploaded" className="w-48 h-48 object-cover rounded-lg shadow-md" />
                      <div className="flex-1 w-full">
                        {isAnalyzing ? (
                          <div className="flex items-center gap-3 text-layer-primary py-8">
                            <i className="fa-solid fa-circle-notch fa-spin text-2xl"></i>
                            <span className="text-lg">AI is analyzing image...</span>
                          </div>
                        ) : analysisResult ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                               <label className="text-xs font-bold text-gray-500 uppercase">Item Name</label>
                               <p className="text-lg font-bold">{analysisResult.name}</p>
                             </div>
                             <div>
                               <label className="text-xs font-bold text-gray-500 uppercase">Category</label>
                               <p className="text-lg">{analysisResult.category}</p>
                             </div>
                             <div>
                               <label className="text-xs font-bold text-gray-500 uppercase">Est. Resale Value</label>
                               <p className="text-lg text-green-600 font-bold">${analysisResult.resaleEstimate}</p>
                             </div>
                             <div>
                               <label className="text-xs font-bold text-gray-500 uppercase">Sustainability</label>
                               <div className="flex items-center gap-2">
                                  <div className="h-2 w-24 bg-gray-200 rounded-full">
                                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${analysisResult.sustainabilityScore * 10}%` }}></div>
                                  </div>
                                  <span className="font-bold">{analysisResult.sustainabilityScore}/10</span>
                               </div>
                             </div>
                             <div className="md:col-span-2 flex gap-3 mt-4">
                               <button onClick={handleSaveNewItem} className="bg-layer-btn text-white px-6 py-2 rounded hover:bg-layer-dark shadow-md">
                                 <i className="fa-solid fa-save mr-2"></i> Save to Closet
                               </button>
                             </div>
                          </div>
                        ) : null}
                      </div>
                   </div>
                </div>
              )}

              {/* The Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                <label className="aspect-square border-4 border-dashed border-layer-primary/50 hover:border-layer-primary bg-white/50 hover:bg-white rounded-xl flex flex-col items-center justify-center cursor-pointer transition group">
                  <div className="w-16 h-16 bg-layer-primary/10 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition">
                     <i className="fa-solid fa-plus text-2xl text-layer-primary"></i>
                  </div>
                  <span className="font-bold text-layer-primary">Add Item</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                </label>

                {filteredItems.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => setSelectedItem(item)}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition group relative animate-fade-in cursor-pointer"
                  >
                     <div className="aspect-[3/4] overflow-hidden bg-gray-100 relative">
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                          {item.wearCount} wears
                        </div>
                     </div>
                     <div className="p-3">
                        <h4 className="font-bold text-gray-800 truncate">{item.name}</h4>
                        <p className="text-sm text-gray-500 capitalize">{item.category}</p>
                     </div>
                  </div>
                ))}
                
                {filteredItems.length === 0 && (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-white/50 rounded-3xl border-4 border-dashed border-layer-primary/20">
                    <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                      <i className="fa-solid fa-cloud-arrow-up text-4xl text-layer-btn"></i>
                    </div>
                    <h3 className="text-2xl font-bold text-layer-dark mb-2">Your closet is empty!</h3>
                    <p className="text-gray-600 mb-8 max-w-md">Upload photos of your clothes to let our AI Stylist start working its magic.</p>
                    <label className="bg-layer-btn text-white px-8 py-3 rounded-full text-lg font-bold shadow-lg hover:bg-layer-dark hover:scale-105 transition cursor-pointer flex items-center gap-2">
                      <i className="fa-solid fa-camera"></i>
                      Add First Item
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* --- OUTFITS TAB --- */}
          {activeTab === 'outfits' && (
            <div className="animate-fade-in">
              {/* Generator Hero */}
              <div className="bg-white rounded-xl shadow-xl p-8 mb-12 border-l-8 border-layer-btn">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-layer-primary mb-2">Generate Your Look</h2>
                    
                    {/* Mode Toggle */}
                    <div className="flex gap-4 mb-4 border-b border-gray-200 pb-2">
                      <button 
                        onClick={() => setOutfitMode('Standard')}
                        className={`font-bold pb-1 ${outfitMode === 'Standard' ? 'text-layer-btn border-b-2 border-layer-btn' : 'text-gray-400'}`}
                      >
                        Standard
                      </button>
                      <button 
                        onClick={() => setOutfitMode('Celebrity')}
                        className={`font-bold pb-1 ${outfitMode === 'Celebrity' ? 'text-layer-btn border-b-2 border-layer-btn' : 'text-gray-400'}`}
                      >
                        <i className="fa-solid fa-user-astronaut mr-1"></i> Style Twin
                      </button>
                    </div>

                    {outfitMode === 'Standard' ? (
                       <>
                        <p className="text-gray-600 text-lg mb-6">Based on weather ({weather.temp}°C) and your style.</p>
                        <div className="mb-6">
                          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Select Occasion</label>
                          <div className="flex flex-wrap gap-2">
                            {['Casual', 'Work', 'Date Night', 'Gym', 'Party'].map(occ => (
                              <button 
                                key={occ}
                                onClick={() => setOutfitOccasion(occ)}
                                className={`px-4 py-2 rounded-full border transition ${outfitOccasion === occ ? 'bg-layer-dark text-white border-layer-dark' : 'bg-white text-gray-600 border-gray-300 hover:border-layer-btn'}`}
                              >
                                {occ}
                              </button>
                            ))}
                          </div>
                        </div>
                       </>
                    ) : (
                       <div className="mb-6">
                         <label className="block text-sm font-bold text-gray-700 mb-2">Whose style do you want to steal?</label>
                         <input 
                           type="text" 
                           value={styleTwinInput}
                           onChange={(e) => setStyleTwinInput(e.target.value)}
                           className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-layer-btn outline-none"
                           placeholder="e.g. Ryan Gosling, Barbie, James Bond..." 
                         />
                         <p className="text-xs text-gray-500 mt-2">AI will build an outfit from YOUR closet inspired by this person.</p>
                       </div>
                    )}

                    {generatedLook && (
                      <div className="mb-6 space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 animate-fade-in">
                          <h3 className="text-xl font-bold text-layer-dark">{generatedLook.description}</h3>
                          <p className="italic text-gray-600 mt-1">"{generatedLook.reasoning}"</p>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3">
                      <button 
                        onClick={handleGenerateLook}
                        disabled={isGenerating || (outfitMode === 'Celebrity' && !styleTwinInput) || items.length === 0}
                        className="bg-layer-btn text-white px-8 py-3 rounded-full text-lg font-bold shadow hover:bg-layer-dark transition flex items-center gap-2 disabled:opacity-50"
                      >
                        {isGenerating ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
                        {generatedLook ? 'Regenerate' : 'Style Me Now'}
                      </button>
                      
                      {generatedLook && (
                        <button 
                          id="save-btn"
                          onClick={handleSaveOutfit}
                          className="bg-white text-layer-btn border-2 border-layer-btn px-6 py-3 rounded-full text-lg font-bold shadow hover:bg-blue-50 transition flex items-center gap-2"
                        >
                          <i className="fa-solid fa-heart"></i> Save Look
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                     <div className="w-24 h-32 bg-gray-200 rounded-lg animate-pulse"></div>
                     <div className="w-24 h-32 bg-gray-200 rounded-lg animate-pulse delay-75"></div>
                     <div className="w-24 h-32 bg-gray-200 rounded-lg animate-pulse delay-150"></div>
                  </div>
                </div>
              </div>

              {/* Saved Outfits Grid */}
              <h3 className="text-2xl font-bold text-layer-dark mb-6">Saved Collections</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 {savedOutfits.map((outfit) => (
                    <div 
                      key={outfit.id} 
                      onClick={() => setViewingOutfit(outfit)}
                      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition cursor-pointer flex flex-col h-full animate-fade-in group"
                    >
                      <div className="h-40 overflow-hidden grid grid-cols-2 gap-0.5 bg-gray-100 relative">
                         <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition z-10"></div>
                         <img src={`https://picsum.photos/200/300?random=${outfit.id}`} className="w-full h-full object-cover" />
                         <img src={`https://picsum.photos/200/300?random=${outfit.id+1}`} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-4 flex flex-col flex-grow">
                         <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-lg text-layer-dark group-hover:underline">{outfit.description}</h4>
                            <i className="fa-solid fa-heart text-layer-problem"></i>
                         </div>
                         <p className="text-sm text-gray-500 mb-2">{new Date(outfit.date).toLocaleDateString()}</p>
                         <p className="text-gray-600 text-sm italic line-clamp-2">{outfit.reasoning}</p>
                      </div>
                    </div>
                 ))}
              </div>
            </div>
          )}

          {/* --- TRAVEL TAB --- */}
          {activeTab === 'travel' && (
            <div className="animate-fade-in max-w-4xl mx-auto">
               <h2 className="text-3xl text-layer-dark font-bold mb-8">AI Travel Packer</h2>
               
               <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                   <div>
                     <label className="block text-sm font-bold text-gray-600 mb-1">Destination</label>
                     <input 
                       type="text" 
                       value={travelDest} 
                       onChange={(e) => setTravelDest(e.target.value)}
                       className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-layer-btn outline-none" 
                       placeholder="e.g. Paris"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-gray-600 mb-1">Duration (Days)</label>
                     <input 
                       type="number" 
                       value={travelDays} 
                       onChange={(e) => setTravelDays(Number(e.target.value))}
                       className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-layer-btn outline-none" 
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-gray-600 mb-1">Primary Activity</label>
                     <select 
                       value={travelActivity} 
                       onChange={(e) => setTravelActivity(e.target.value)}
                       className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-layer-btn outline-none bg-white"
                     >
                       <option>Sightseeing</option>
                       <option>Business</option>
                       <option>Beach</option>
                       <option>Hiking</option>
                     </select>
                   </div>
                 </div>
                 <button 
                   onClick={handleGeneratePacking}
                   disabled={isPackingLoading || !travelDest}
                   className="w-full bg-layer-btn text-white py-3 rounded-lg font-bold hover:bg-layer-dark transition disabled:opacity-50"
                 >
                   {isPackingLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Generate Packing List'}
                 </button>
               </div>

               {packingList && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                   {packingList.categories.map((cat, idx) => (
                     <div key={idx} className="bg-white p-6 rounded-xl shadow border-t-4 border-layer-primary">
                       <h3 className="text-xl font-bold text-layer-dark mb-4">{cat.name}</h3>
                       <ul className="space-y-2">
                         {cat.items.map((item, i) => (
                           <li key={i} className="flex items-center gap-2">
                             <input type="checkbox" className="w-4 h-4 text-layer-btn rounded focus:ring-layer-btn" />
                             <span className="text-gray-700">{item}</span>
                           </li>
                         ))}
                       </ul>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          )}

          {/* --- PLANNER TAB --- */}
          {activeTab === 'planner' && (
            <div className="animate-fade-in">
              <h2 className="text-3xl text-layer-dark font-bold mb-8">Weekly Outfit Planner</h2>
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                 {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                   const plannedItem = plannerData[day];
                   return (
                     <div 
                       key={day} 
                       onClick={() => plannedItem && setViewingPlannerDay(plannedItem)}
                       className={`min-h-[300px] border-2 rounded-xl p-4 flex flex-col items-center bg-white transition cursor-pointer ${plannedItem ? 'border-layer-btn shadow-lg ring-4 ring-blue-50 hover:scale-[1.02]' : 'border-gray-200 hover:border-gray-300'}`}
                     >
                       <span className="text-xl font-bold mb-4">{day}</span>
                       {plannedItem ? (
                         <div className="flex flex-col items-center gap-2 w-full flex-1">
                           <img src={plannedItem.imageUrl} className="w-full aspect-[3/4] object-cover rounded shadow" />
                           <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">Planned</span>
                           <p className="text-xs text-gray-500 text-center line-clamp-2 mt-1">{plannedItem.note}</p>
                         </div>
                       ) : (
                         <button className="flex-1 w-full border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-300 hover:text-layer-btn hover:border-layer-btn hover:bg-blue-50 transition">
                           <i className="fa-solid fa-plus text-3xl"></i>
                         </button>
                       )}
                     </div>
                   );
                 })}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* -- ITEM DETAIL MODAL -- */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-y-auto max-h-[90vh] animate-fade-in-up">
            <div className="bg-white p-6 relative">
               <button onClick={resetItemModal} className="absolute top-4 right-4 text-gray-400 hover:text-red-500"><i className="fa-solid fa-times text-2xl"></i></button>
               
               <div className="flex gap-6 mb-6">
                 <img src={selectedItem.imageUrl} className="w-32 h-40 object-cover rounded-lg shadow" />
                 <div>
                   <h3 className="text-2xl font-bold text-layer-dark mb-1">{selectedItem.name}</h3>
                   <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold uppercase">{selectedItem.category}</span>
                   <p className="text-gray-500 mt-2 text-sm">Worn {selectedItem.wearCount} times</p>
                 </div>
               </div>

               {/* Stylist Station (New) */}
               <div className="border-t border-gray-100 pt-6 mt-6">
                 <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                   <i className="fa-solid fa-wand-magic-sparkles text-purple-500"></i> Stylist Station
                 </h4>
                 
                 <div className="grid grid-cols-2 gap-3 mb-4">
                   <button 
                     onClick={handleGenerateResale}
                     disabled={isResaleLoading}
                     className="bg-gray-100 text-gray-700 py-2 rounded-lg font-bold hover:bg-gray-200 text-xs flex flex-col items-center justify-center gap-1"
                   >
                     {isResaleLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : <><i className="fa-solid fa-tag"></i> Resale Value</>}
                   </button>
                   <button 
                     onClick={handleThreeWays}
                     disabled={isThreeWaysLoading}
                     className="bg-purple-50 text-purple-700 py-2 rounded-lg font-bold hover:bg-purple-100 text-xs flex flex-col items-center justify-center gap-1"
                   >
                     {isThreeWaysLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : <><i className="fa-solid fa-layer-group"></i> 3 Ways to Wear</>}
                   </button>
                 </div>

                 {/* Results Area */}
                 <div className="space-y-3">
                   {/* 1. Resale Result */}
                   {resaleData && (
                     <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-3 border border-gray-200 animate-fade-in">
                        <h5 className="font-bold text-gray-800 border-b pb-2">Listing Draft</h5>
                        <div className="flex justify-between">
                          <div>
                            <span className="text-xs font-bold text-gray-400 uppercase">Est. Price</span>
                            <p className="font-bold text-green-600 text-lg">${resaleData.price}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-gray-400 uppercase">Platform</span>
                            <p className="font-medium text-layer-btn">{resaleData.platform}</p>
                          </div>
                        </div>
                        <p className="text-gray-600 italic text-xs">{resaleData.description}</p>
                     </div>
                   )}

                   {/* 2. 3 Ways to Wear Result */}
                   {threeWays && (
                     <div className="space-y-3 animate-fade-in">
                       {threeWays.outfits.map((outfit, i) => (
                         <div key={i} className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                           <div className="flex justify-between mb-1">
                             <span className="font-bold text-purple-800">{outfit.style}</span>
                           </div>
                           <p className="text-sm text-purple-900 mb-2">{outfit.items.join(' + ')}</p>
                           <p className="text-xs text-purple-600 italic"><i className="fa-solid fa-lightbulb mr-1"></i>{outfit.tip}</p>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>

               </div>

               <div className="border-t border-gray-100 pt-6 mt-6">
                 <button 
                   onClick={() => handleDeleteItem(selectedItem.id)}
                   className="w-full text-red-500 font-bold text-sm hover:text-red-700 transition"
                 >
                   <i className="fa-solid fa-trash mr-2"></i> Delete Item
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* -- OUTFIT DETAIL MODAL -- */}
      {viewingOutfit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up">
            <div className="bg-layer-primary p-4 flex justify-between items-center text-white">
               <h3 className="font-bold text-xl">{viewingOutfit.description}</h3>
               <button onClick={() => setViewingOutfit(null)} className="hover:text-gray-200"><i className="fa-solid fa-times text-2xl"></i></button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                 <img src={`https://picsum.photos/300/400?random=${viewingOutfit.id}`} className="w-full h-64 object-cover rounded-lg shadow-md" />
                 <img src={`https://picsum.photos/300/400?random=${viewingOutfit.id+1}`} className="w-full h-64 object-cover rounded-lg shadow-md" />
              </div>
              <div className="space-y-4">
                 <div className="flex items-center gap-2 text-gray-500 text-sm">
                   <i className="fa-regular fa-calendar"></i>
                   <span>Created on {new Date(viewingOutfit.date).toLocaleDateString()}</span>
                 </div>
                 <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                   <p className="font-bold text-layer-dark mb-1">Stylist Notes:</p>
                   <p className="italic text-gray-700">"{viewingOutfit.reasoning}"</p>
                 </div>
                 <div className="flex gap-3 mt-4">
                    <button onClick={() => setViewingOutfit(null)} className="flex-1 bg-gray-100 text-gray-800 py-3 rounded-lg font-bold hover:bg-gray-200">Close</button>
                    <button className="flex-1 bg-layer-btn text-white py-3 rounded-lg font-bold hover:bg-layer-dark"><i className="fa-solid fa-share-nodes mr-2"></i>Share</button>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -- PLANNER DETAIL MODAL -- */}
      {viewingPlannerDay && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
             <div className="bg-layer-btn p-4 flex justify-between items-center text-white">
               <h3 className="font-bold text-xl">Plan for {viewingPlannerDay.day}</h3>
               <button onClick={() => setViewingPlannerDay(null)} className="hover:text-gray-200"><i className="fa-solid fa-times text-2xl"></i></button>
            </div>
            <div className="p-6 flex flex-col items-center">
               <img src={viewingPlannerDay.imageUrl} className="w-full max-w-[250px] aspect-[3/4] object-cover rounded-xl shadow-lg mb-6" />
               <div className="w-full text-left space-y-4">
                  <div>
                    <h4 className="font-bold text-gray-500 text-xs uppercase mb-1">Items</h4>
                    <ul className="list-disc list-inside text-gray-800 font-medium">
                      {viewingPlannerDay.items.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-500 text-xs uppercase mb-1">Note</h4>
                    <p className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-gray-700">{viewingPlannerDay.note}</p>
                  </div>
               </div>
               <button onClick={() => setViewingPlannerDay(null)} className="w-full mt-6 bg-gray-800 text-white py-3 rounded-lg font-bold hover:bg-black transition">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* -- ENHANCED CHATBOT WIDGET -- */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
         {/* Notification Badge */}
         {!isChatOpen && (
            <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full absolute -top-2 -right-2 z-10 animate-bounce shadow-md">
              1 New
            </div>
         )}

         {isChatOpen && (
           <div className="bg-white w-80 md:w-96 h-[500px] rounded-2xl shadow-2xl mb-4 flex flex-col overflow-hidden border border-gray-200 animate-fade-in-up origin-bottom-right">
              <div className="bg-layer-dark p-4 flex justify-between items-center text-white">
                <div className="flex items-center gap-2">
                   <div className="w-3 h-3 bg-green-400 rounded-full border border-white"></div>
                   <span className="font-bold">LayerBot Stylist</span>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="hover:text-gray-300"><i className="fa-solid fa-times"></i></button>
              </div>
              <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-4">
                 {chatHistory.map((msg, i) => (
                   <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                     <div className={`max-w-[80%] p-3 rounded-xl text-sm shadow-sm ${msg.role === 'user' ? 'bg-layer-primary text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-700 rounded-tl-none'}`}>
                       {msg.text}
                     </div>
                   </div>
                 ))}
                 {isChatLoading && (
                   <div className="flex justify-start">
                     <div className="bg-white border border-gray-200 p-3 rounded-xl rounded-tl-none shadow-sm">
                       <i className="fa-solid fa-ellipsis fa-bounce text-gray-400"></i>
                     </div>
                   </div>
                 )}
                 <div ref={chatEndRef} />
              </div>
              <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
                 <input 
                   type="text" 
                   value={chatInput}
                   onChange={(e) => setChatInput(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                   placeholder="Ask for fashion advice..."
                   className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-layer-primary transition"
                 />
                 <button onClick={handleSendMessage} className="w-10 h-10 bg-layer-primary text-white rounded-full hover:bg-layer-dark transition flex items-center justify-center shadow">
                   <i className="fa-solid fa-paper-plane"></i>
                 </button>
              </div>
           </div>
         )}
         
         <button 
           onClick={() => setIsChatOpen(!isChatOpen)}
           className={`group flex items-center gap-3 bg-layer-dark text-white rounded-full shadow-2xl transition-all duration-300 ${isChatOpen ? 'w-14 h-14 justify-center p-0' : 'px-6 py-4 hover:scale-105 ring-4 ring-white/20'}`}
         >
           {isChatOpen ? (
             <i className="fa-solid fa-chevron-down text-xl"></i>
           ) : (
             <>
               <span className="font-bold text-lg hidden md:block">Ask Stylist</span>
               <i className="fa-solid fa-comment-dots text-2xl animate-pulse"></i>
             </>
           )}
         </button>
      </div>

    </div>
  );
};

export default Dashboard;