import { useState, useMemo, useRef, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import {
  Search, X, Heart, Users, Sparkles, Coffee, Anchor, ArrowRight,
  ChevronLeft, ChevronRight, Calendar, Star, Ship as ShipIcon
} from "lucide-react";
import { Ship } from "./index";
import { getShipImage, DEFAULT_SHIP_IMAGE } from "@/lib/ship-assets";
import { generateTravelerReview } from "./reviews-data";

// Magazine style cards
const TravelerShipCard = ({ ship, onClick }: { ship: Ship, onClick: () => void }) => {
  const getVibeTags = (s: Ship) => {
    const tags = [];
    if (s.passenger_density > 45) tags.push({ label: "Social Hub", icon: Users, color: "bg-purple-500", textColor: "text-purple-50" });
    else if (s.passenger_density < 30) tags.push({ label: "Zen Oasis", icon: Coffee, color: "bg-emerald-500", textColor: "text-emerald-50" });
    else tags.push({ label: "Balanced", icon: Sparkles, color: "bg-blue-500", textColor: "text-blue-50" });

    if (s.Age <= 5) tags.push({ label: "Future Tech", color: "bg-indigo-600", textColor: "text-indigo-50" });
    else if (s.Age > 20) tags.push({ label: "Classic Charm", color: "bg-amber-600", textColor: "text-amber-50" });
    return tags;
  };

  const vibes = getVibeTags(ship);
  const ratio = ship.crew > 0 ? ship.passengers / ship.crew : 0;
  const imagePath = getShipImage(ship);

  return (
    <div onClick={onClick} className="group relative bg-white rounded-[32px] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-slate-100 h-[460px] flex flex-col cursor-pointer">
      <div className="relative h-[55%] overflow-hidden bg-slate-100">
        <img
          src={imagePath}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          alt={ship.Ship_name}
          onError={(e) => {
            const img = e.currentTarget;
            if (img.src.includes("default-ship.png")) return;
            img.src = DEFAULT_SHIP_IMAGE;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-80" />
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          {vibes.map((v, i) => (
            <span key={i} className={`${v.color} ${v.textColor} text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-md shadow-lg flex items-center gap-1.5 border border-white/10`}>
              {v.icon && <v.icon size={10} />} {v.label}
            </span>
          ))}
        </div>
        <button className="absolute top-4 right-4 p-2.5 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-red-500 transition-colors border border-white/20">
          <Heart size={18} />
        </button>
        <div className="absolute bottom-5 left-5 right-5 text-white">
          <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mb-1 text-emerald-300">{ship.Cruise_line}</p>
          <h3 className="text-2xl font-black leading-none drop-shadow-md font-serif tracking-tight">{ship.Ship_name}</h3>
        </div>
      </div>
      <div className="p-6 flex-1 flex flex-col justify-between bg-white relative">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200" />)}
            </div>
            <span className="text-xs text-slate-400 font-medium">+{(ship.passengers / 10).toFixed(0)} interested</span>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">
            Step aboard a world of {ship.passenger_density > 40 ? "vibrant energy" : "serene luxury"}.
            With <span className="text-slate-900 font-bold">{ratio < 2.5 ? "impeccable" : "friendly"} service</span> (1:{ratio.toFixed(1)} ratio).
          </p>
        </div>
        <div className="flex items-end justify-between pt-4 border-t border-slate-50 mt-2">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Crowd Level</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <div key={n} className={`w-1.5 h-6 rounded-full transition-colors ${n <= (ship.passenger_density / 12) ? 'bg-slate-800' : 'bg-slate-100'}`} />
              ))}
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="group/btn flex items-center gap-2 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl hover:bg-emerald-600 transition-all shadow-lg hover:shadow-emerald-500/30 hover:scale-105 active:scale-95"
          >
            View Details <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Main view component
export const TravelerView = ({ ships }: { ships: Ship[] }) => {
  const [activeVibe, setActiveVibe] = useState<string>("All Vibes");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedShip, setSelectedShip] = useState<Ship | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 16;
  const [minCapacity, setMinCapacity] = useState([0]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const searchSuggestions = useMemo(() => {
    if (!searchQuery || searchQuery.trim() === "") return [];
    const q = searchQuery.toLowerCase().trim();
    const rawMatches = ships.filter(s => s.Ship_name.toLowerCase().includes(q)).map(s => s.Ship_name.trim());
    return Array.from(new Set(rawMatches)).slice(0, 5);
  }, [searchQuery, ships]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredShips = useMemo(() => {
    let result = ships;
    if (activeVibe !== "All Vibes") {
      if (activeVibe === "Zen Oasis") result = result.filter(s => s.passenger_density < 30);
      else if (activeVibe === "Social Hub") result = result.filter(s => s.passenger_density >= 45);
      else if (activeVibe === "Balanced") result = result.filter(s => s.passenger_density >= 30 && s.passenger_density < 45);
      else if (activeVibe === "Future Tech") result = result.filter(s => s.Age <= 5);
      else if (activeVibe === "Classic Charm") result = result.filter(s => s.Age > 20);
    }
    if (minCapacity[0] > 0) result = result.filter(s => (s.passengers * 100) >= minCapacity[0]);
    if (searchQuery) result = result.filter(s => s.Ship_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const unique = new Map();
    result.forEach(s => unique.set(s.Ship_name, s));
    return Array.from(unique.values());
  }, [ships, activeVibe, searchQuery, minCapacity]);

  const totalPages = Math.ceil(filteredShips.length / ITEMS_PER_PAGE);
  const currentShips = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredShips.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredShips, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [activeVibe, searchQuery, minCapacity]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 pb-32">

      {/* Hero Section */}
      <div className="relative h-[50vh] min-h-[450px] w-full overflow-hidden rounded-b-[40px] md:rounded-b-[60px] shadow-2xl mb-10 group">
        <img
          src="/images/hero-bg.png"
          className="w-full h-full object-cover transition-transform duration-[20s] ease-in-out group-hover:scale-105"
          alt="Dream Voyage Background"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
        <div className="absolute bottom-12 left-6 md:left-12 max-w-3xl animate-in slide-in-from-bottom-10 duration-1000 fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-emerald-300 text-xs font-bold uppercase tracking-widest mb-6 shadow-lg">
            <Sparkles size={12} className="animate-pulse" /> Curated for you
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter mb-6 drop-shadow-2xl leading-[0.9]">
            Drift Away.
          </h1>
          <p className="text-lg md:text-xl text-slate-200 font-medium max-w-xl leading-relaxed opacity-90">
            Discover personalized voyages based on your style, not just prices.
            We found <span className="text-emerald-400 font-bold border-b-2 border-emerald-400/50">{filteredShips.length}</span> experiences waiting for you.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="sticky top-4 z-40 px-6 md:px-12 mb-12">
        <div className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-xl shadow-slate-200/50 rounded-3xl p-3 flex flex-col xl:flex-row items-center justify-between gap-4 transition-all hover:bg-white">
          <div className="flex gap-2 overflow-x-auto w-full xl:w-auto pb-2 xl:pb-0 no-scrollbar items-center">
            {['All Vibes', 'Zen Oasis', 'Social Hub', 'Future Tech', 'Classic Charm'].map((vibe) => (
              <button
                key={vibe}
                onClick={() => setActiveVibe(vibe)}
                className={`whitespace-nowrap px-5 py-2.5 rounded-2xl font-bold text-sm transition-all border
                    ${activeVibe === vibe
                    ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-105 ring-4 ring-slate-100'
                    : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-100 hover:text-slate-900'}
                  `}
              >
                {vibe}
              </button>
            ))}
          </div>
          <div className="flex flex-col md:flex-row w-full xl:w-auto items-center gap-4">
            <div className="w-full md:w-48 px-2 flex flex-col gap-1">
              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Min Capacity</span>
                <span className="text-emerald-600">{minCapacity[0] > 0 ? `${minCapacity[0]}+` : 'Any'}</span>
              </div>
              <Slider defaultValue={[0]} max={6000} step={500} value={minCapacity} onValueChange={setMinCapacity} className="py-1" />
            </div>
            <div className="relative w-full md:w-72 group" ref={searchContainerRef}>
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                <Search className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
              </div>
              <Input
                type="text"
                placeholder="Find your ship..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                className="pl-11 pr-10 py-6 !bg-white !text-slate-900 !placeholder:text-slate-400 !border-slate-200 focus:!border-emerald-500 focus:!ring-4 focus:!ring-emerald-500/20 rounded-2xl transition-all shadow-sm font-semibold text-base relative z-0"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(""); setShowSuggestions(false); }} className="absolute inset-y-0 right-3 flex items-center text-slate-300 hover:text-slate-500 transition-colors z-10"><X className="h-5 w-5" /></button>
              )}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute top-full mt-3 w-full bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">Suggestions</div>
                  {searchSuggestions.map((s) => (
                    <div key={s} onClick={() => { setSearchQuery(s); setShowSuggestions(false); }} className="px-4 py-3 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer text-sm font-semibold text-slate-600 border-b border-slate-50 last:border-0 flex items-center gap-3 transition-colors"><span className="text-xl">🚢</span> {s}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="max-w-[1600px] mx-auto px-6 md:px-12" id="ship-grid">
        {filteredShips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in zoom-in-95">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-300"><Anchor size={48} /></div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No voyages found</h3>
            <p className="text-slate-500">Try adjusting your filters.</p>
            <button onClick={() => { setActiveVibe("All Vibes"); setSearchQuery(""); setMinCapacity([0]); }} className="mt-6 text-emerald-600 font-bold hover:underline">Clear Filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {currentShips.map((ship, idx) => (
              <div key={`${ship.Ship_name}-${idx}`} className="animate-in fade-in slide-in-from-bottom-8 duration-700" style={{ animationDelay: `${idx * 50}ms` }}>
                <TravelerShipCard ship={ship} onClick={() => setSelectedShip(ship)} />
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {filteredShips.length > 0 && (
          <div className="mt-16 flex items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-4">
            <button
              disabled={currentPage === 1}
              onClick={() => { setCurrentPage(p => p - 1); document.getElementById('ship-grid')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="p-4 rounded-full bg-white border border-slate-200 text-slate-600 shadow-sm hover:bg-slate-50 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="text-sm font-bold text-slate-500 bg-white px-6 py-3 rounded-full border border-slate-200 shadow-sm">
              Page <span className="text-slate-900 text-lg mx-1">{currentPage}</span> of {totalPages}
            </div>
            <button
              disabled={currentPage === totalPages}
              onClick={() => { setCurrentPage(p => p + 1); document.getElementById('ship-grid')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="p-4 rounded-full bg-white border border-slate-200 text-slate-600 shadow-sm hover:bg-slate-50 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
        <div className="mt-10 mb-20 text-center">
          <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">End of Collection</p>
        </div>
      </div>

      {/* Ship Detail Dialog */}
      <Dialog open={!!selectedShip} onOpenChange={(open) => !open && setSelectedShip(null)}>
        <DialogContent
          showCloseButton={false}
          className="bg-white border-none shadow-2xl !max-w-[95vw] !h-[90vh] p-0 overflow-hidden rounded-[32px] !text-slate-800 flex flex-col md:flex-row gap-0"
        >
          <DialogTitle className="sr-only">Ship Details</DialogTitle>
          {selectedShip && (
            <>
              <div className="w-full md:w-[40%] h-64 md:h-full relative bg-slate-100 shrink-0">
                <img
                  src={getShipImage(selectedShip)}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const t = e.currentTarget;
                    if (!t.src.includes("default-ship.png")) t.src = DEFAULT_SHIP_IMAGE;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/10" />

                <div className="absolute bottom-8 left-8 md:bottom-12 md:left-12 text-white z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-widest border border-white/30">
                      {selectedShip.Cruise_line}
                    </span>
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black font-serif leading-none tracking-tight shadow-black drop-shadow-lg">
                    {selectedShip.Ship_name}
                  </h2>
                </div>
              </div>

              <div className="flex-1 bg-white p-8 md:p-12 md:overflow-y-auto flex flex-col h-full relative">
                <button onClick={() => setSelectedShip(null)} className="absolute top-6 right-6 p-3 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors z-20">
                  <X size={24} />
                </button>

                {(() => {
                  const { headline, description, tags, bestFor } = generateTravelerReview(selectedShip);

                  return (
                    <div className="space-y-8 flex-1 flex flex-col">
                      <div className="mt-4 md:mt-8">
                        <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 leading-tight">
                          {headline}
                        </h3>
                        <div className="flex items-center gap-2 text-base font-medium text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl w-fit">
                          <Star size={16} fill="currentColor" /> Best for: {bestFor}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {tags.map(tag => (
                          <span key={tag} className="px-4 py-1.5 bg-slate-100 text-slate-700 text-sm font-bold rounded-full border border-slate-200">
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="prose prose-slate prose-lg max-w-none leading-loose text-slate-600">
                        <p>{description}</p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-8 border-t border-b border-slate-100 mt-auto">
                        <div>
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-2">
                            <Calendar size={14} /> Built
                          </div>
                          <div className="text-2xl font-black text-slate-900">{new Date().getFullYear() - selectedShip.Age} <span className="text-sm font-medium text-slate-400">yrs ago</span></div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-2">
                            <Users size={14} /> Guests
                          </div>
                          <div className="text-2xl font-black text-slate-900">{(selectedShip.passengers * 100).toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-2">
                            <ShipIcon size={14} /> Size
                          </div>
                          <div className="text-2xl font-black text-slate-900">{Math.round(selectedShip.Tonnage)}k <span className="text-sm font-medium text-slate-400">GT</span></div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-2">
                            <Heart size={14} /> Crew
                          </div>
                          <div className="text-2xl font-black text-emerald-600">1:{(selectedShip.passengers / selectedShip.crew).toFixed(1)}</div>
                        </div>
                      </div>

                      <div className="pt-6 flex gap-6">
                        <button className="flex-1 bg-slate-900 text-white font-bold py-5 rounded-2xl hover:bg-emerald-600 transition-colors shadow-xl shadow-slate-200 flex items-center justify-center gap-3 text-lg">
                          Book This Voyage <ArrowRight size={20} />
                        </button>
                        <button className="px-8 py-5 border-2 border-slate-100 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-colors text-lg">
                          Save
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};