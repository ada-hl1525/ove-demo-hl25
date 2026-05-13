import { Card } from "@/components/ui/card";
import { User, Info, Ship } from "lucide-react"; 

const getDensityColor = (density: number) => {
  const min = 25;
  const max = 60;
  let ratio = (density - min) / (max - min);
  if (ratio < 0) ratio = 0;
  if (ratio > 1) ratio = 1;
  
  // 0 (Red) -> 120 (Green)
  const hue = ratio * 120; 
  return `hsl(${hue}, 85%, 60%)`;
};

type InsightProps = {
  avgDensity: number;
  avgCrewRatio: number; 
  title: string;
};

export const ShipInsightCard = ({ avgDensity, avgCrewRatio, title }: InsightProps) => {
  const shipColor = getDensityColor(avgDensity);
  const passengerIcons = Array.from({ length: Math.min(Math.round(avgCrewRatio), 5) }); 

  return (
    <Card className="bg-slate-900 border border-slate-800 shadow-xl mb-4 px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-12 relative overflow-hidden">

      <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500" />
      <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />

      <div className="flex items-center gap-4 min-w-[200px] z-10">
        <div className="p-3 bg-slate-800 rounded-lg text-blue-400 border border-slate-700 shadow-inner">
          <Info size={20} />
        </div>
        <div>
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Market Segment</h3>
          <div className="font-mono font-bold text-slate-200 text-lg flex items-center gap-2">
            {title}
          </div>
        </div>
      </div>

      <div className="hidden md:block w-px h-10 bg-slate-800" />

      <div className="flex items-center gap-5 flex-1 justify-center z-10">
        <div className="relative w-12 h-12 flex items-center justify-center bg-slate-800 rounded-full border border-slate-700 shadow-[0_0_15px_rgba(0,0,0,0.3)]">
           <Ship style={{ color: shipColor }} size={24} />
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono leading-none tracking-tight">
                {avgDensity}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase">GT / Guest</span>
          </div>
          <div className="text-xs text-slate-400 font-medium mt-1 flex items-center gap-2">
            Space Ratio: <span style={{ color: shipColor }} className="font-bold">{avgDensity > 40 ? "Premium" : "Standard"}</span>
          </div>
        </div>
      </div>

      <div className="hidden md:block w-px h-10 bg-slate-800" />

      <div className="flex flex-col items-center md:items-end min-w-[200px] z-10">
        <div className="flex items-end gap-1 mb-2">
          <User size={18} className="text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]" />
          <span className="text-[10px] text-slate-600 font-mono mx-1 pb-0.5">vs</span>
          {passengerIcons.map((_, i) => (
             <User key={i} size={18} className="text-slate-600" />
          ))}
        </div>
        <div className="text-xs text-slate-400 font-mono">
            <span className="text-amber-400 font-bold">1 Crew</span> : <span className="text-slate-200 font-bold">{avgCrewRatio.toFixed(1)} Guests</span>
        </div>
      </div>
    </Card>
  );
};