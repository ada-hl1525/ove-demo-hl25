import { Card } from "@/components/ui/card";

type ModeSelectorProps = {
  onSelect: (mode: 'traveler' | 'investor') => void;
};

export const ModeSelector = ({ onSelect }: ModeSelectorProps) => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      
      <div className="z-10 text-center space-y-10 max-w-5xl w-full">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">
            Select Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Perspective</span>
          </h1>
          <p className="text-slate-400 text-lg">
            Explore the global cruise fleet data through two distinct lenses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
          
          {/* 1. Traveler Card */}
          <button 
            onClick={() => onSelect('traveler')}
            className="group relative bg-slate-900/50 border border-white/10 hover:border-cyan-400/50 rounded-3xl p-8 transition-all duration-300 hover:bg-slate-800/80 hover:-translate-y-1 text-center flex flex-col items-center"
          >
            <div className="w-48 h-48 mb-8 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-900/20 group-hover:shadow-cyan-500/30 group-hover:scale-105 transition-all duration-500 bg-slate-800 border border-white/5">
              <img 
                src="/images/mode-traveler.png" 
                alt="Traveler Mode" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Emoji is displayed when the image fails to load.
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-6xl">🏖️</div>';
                }}
              />
            </div>
            
            <div className="space-y-3 max-w-sm">
              <h3 className="text-3xl font-bold text-white group-hover:text-cyan-300 transition-colors">The Traveler</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                "Find my perfect vacation." <br/>
                Focus on comfort, service quality, and experience. Visualized with vibrant cards and human-centric metrics.
              </p>
            </div>
          </button>

          {/* 2. Investor card */}
          <button 
            onClick={() => onSelect('investor')}
            className="group relative bg-slate-900/50 border border-white/10 hover:border-emerald-500/50 rounded-3xl p-8 transition-all duration-300 hover:bg-slate-800/80 hover:-translate-y-1 text-center flex flex-col items-center"
          >
            <div className="w-48 h-48 mb-8 rounded-2xl overflow-hidden shadow-2xl shadow-emerald-900/20 group-hover:shadow-emerald-500/30 group-hover:scale-105 transition-all duration-500 bg-slate-800 border border-white/5">
              <img 
                src="/images/mode-investor.png" 
                alt="Investor Mode" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-6xl">💼</div>';
                }}
              />
            </div>

            <div className="space-y-3 max-w-sm">
              <h3 className="text-3xl font-bold text-white group-hover:text-emerald-400 transition-colors">The Investor</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                "Analyze market efficiency." <br/>
                Focus on tonnage, capacity, and fleet age. Visualized with high-density charts and comparative tools.
              </p>
            </div>
          </button>

        </div>
      </div>
    </div>
  );
};