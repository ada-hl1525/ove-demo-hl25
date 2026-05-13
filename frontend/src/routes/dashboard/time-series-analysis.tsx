import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { TrendingUp } from "lucide-react";
import { Ship } from "./index";

const METRIC_CONFIG = {
  tonnage: { label: "Tonnage (k)", color: "#3b82f6", unit: "k", desc: "Ship Size Trend" },
  passengers: { label: "Capacity (Pax)", color: "#10b981", unit: "", desc: "Passenger Volume Trend" },
  crew: { label: "Crew Size", color: "#f59e0b", unit: "", desc: "Labor Intensity Trend" },
  efficiency: { label: "Automation (Ton/Crew)", color: "#8b5cf6", unit: "t/p", desc: "Operational Efficiency Trend" },
  service_ratio: { label: "Service (Pax/Crew)", color: "#ec4899", unit: "p/c", desc: "Service Level Trend" },
  density: { label: "Comfort (Space Ratio)", color: "#06b6d4", unit: "", desc: "Passenger Density Trend" }
};

export const TimeSeriesAnalysis = ({ ships, onShipSelect }: { ships: Ship[], onShipSelect: (ship: Ship) => void }) => {
  const [metric, setMetric] = useState<keyof typeof METRIC_CONFIG>("efficiency");
  const config = METRIC_CONFIG[metric];

  const data = useMemo(() => {
    return ships.map(ship => ({
      ...ship,
      year: 2025 - ship.Age, // Calculate year
      tonnage: ship.Tonnage,
      passengers: ship.passengers * 100,
      crew: ship.crew * 100,
      efficiency: ship.crew > 0 ? ship.Tonnage / ship.crew : 0,
      service_ratio: ship.crew > 0 ? ship.passengers / ship.crew : 0,
      density: ship.passenger_density
    })).filter(d => d.year > 1990); 
  }, [ships]);

  // 2. Calculate linear regression (y = mx + b) to draw the trend line
  const regressionData = useMemo(() => {
    if (data.length < 2) return [];

    let n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    
    data.forEach(d => {
      const x = d.year;
      const y = Number(d[metric]);
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const minYear = Math.min(...data.map(d => d.year));
    const maxYear = Math.max(...data.map(d => d.year));

    return [
      { year: minYear, [metric]: slope * minYear + intercept },
      { year: maxYear, [metric]: slope * maxYear + intercept }
    ];
  }, [data, metric]);

  return (
    <Card className="bg-slate-900 border border-slate-800 p-0 shadow-2xl overflow-hidden flex flex-col h-[500px]">
       {/* Header */}
      <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 gap-4">
        <div>
           <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
              <TrendingUp size={16} className="text-emerald-500"/> Historical Trend Analysis
           </h3>
           <p className="text-xs text-slate-500 mt-1">Correlation between {config.desc} and Build Year</p>
        </div>
        
        <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Y-Axis Metric:</span>
            
            <Select value={metric} onValueChange={(v) => setMetric(v as any)}>
                <SelectTrigger className="w-[200px] h-8 text-xs bg-slate-950 border-slate-700 text-slate-200 font-mono focus:ring-emerald-500/20 focus:border-emerald-500">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                    {Object.entries(METRIC_CONFIG).map(([key, cfg]) => (
                        <SelectItem 
                          key={key} 
                          value={key} 
                          className="text-xs font-mono focus:bg-slate-800 focus:text-emerald-400 cursor-pointer"
                        >
                            {cfg.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0 p-4 bg-slate-950/30 relative">
        <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
                <XAxis 
                    type="number" 
                    dataKey="year" 
                    name="Year Built" 
                    domain={['auto', 'auto']} 
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    label={{ value: 'Year Built', position: 'insideBottomRight', offset: -10, fill: '#64748b', fontSize: 10 }}
                />
                <YAxis 
                    type="number" 
                    dataKey={metric} 
                    name={config.label} 
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    label={{ value: config.label, angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
                />
                <Tooltip 
                    cursor={{ strokeDasharray: '3 3', stroke: '#475569' }}
                    content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                            if (payload[0].payload.Ship_name) {
                                const d = payload[0].payload;
                                return (
                                    <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl z-50">
                                        <div className="font-bold text-white text-xs mb-1">{d.Ship_name}</div>
                                        <div className="text-[10px] text-emerald-400 font-mono mb-1">{d.Cruise_line}</div>
                                        <div className="grid grid-cols-2 gap-x-4 text-[10px] text-slate-400 mt-2 border-t border-slate-800 pt-2">
                                            <span>Year:</span> <span className="text-slate-200">{d.year}</span>
                                            <span>Value:</span> <span className="text-emerald-400 font-bold">{Number(d[metric]).toLocaleString()} {config.unit}</span>
                                        </div>
                                        <div className="mt-2 text-[9px] text-blue-500 text-center">Click for Details</div>
                                    </div>
                                );
                            }
                            return null;
                        }
                        return null;
                    }}
                />
                <Scatter 
                    name="Ships" 
                    data={data} 
                    fill={config.color} 
                    onClick={(node) => onShipSelect(node.payload)}
                    cursor="pointer"
                    shape="circle"
                    opacity={0.6}
                />
                <Scatter 
                    name="Trend"
                    data={regressionData}
                    line={{ stroke: '#ef4444', strokeWidth: 2, strokeDasharray: '5 5' }}
                    shape={() => <g />} 
                    legendType="none"
                    isAnimationActive={false}
                />
            </ScatterChart>
        </ResponsiveContainer>
        
        <div className="absolute top-4 right-16 bg-slate-900/80 backdrop-blur border border-slate-700 px-3 py-1.5 rounded text-[10px] text-slate-400 pointer-events-none">
            <span className="text-red-500 font-bold">---</span> Trend Line (Linear Regression)
        </div>
      </div>
    </Card>
  );
};