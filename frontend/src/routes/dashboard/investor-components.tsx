import { Card } from "@/components/ui/card";
import { Trophy, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { QUADRANT_DEFINITIONS } from "./reviews-data";

// KPI Card
export const KpiCard = ({ label, value, sub, icon: Icon, color = "text-emerald-400" }: any) => (

  <Card className="bg-slate-900 border border-slate-800 px-4 py-3 flex-row items-center gap-4 shadow-md hover:border-slate-700 transition-colors">
    <div className={`p-2.5 rounded-md bg-slate-950 border border-slate-800/50 ${color} bg-opacity-50 shrink-0`}>
      <Icon size={18} />
    </div>
    
    <div className="min-w-0 flex-1">
      <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-0.5 truncate">{label}</p>
      <div className="flex items-baseline gap-2">
        <div className={`text-xl font-mono font-bold ${color} leading-none`}>{value}</div>
        <p className="text-[9px] text-slate-500 truncate hidden xl:block opacity-70">{sub}</p>
      </div>
    </div>
  </Card>
);

// Legend Item
export const LegendItem = ({ 
  label, 
  color, 
  type, 
  align = 'center' 
}: { 
  label: string, 
  color: string, 
  type: keyof typeof QUADRANT_DEFINITIONS,
  align?: 'left' | 'center' | 'right' 
}) => {
  let positionClass = "left-1/2 -translate-x-1/2";
  let arrowClass = "left-1/2 -translate-x-1/2";

  if (align === 'left') {
    positionClass = "left-0 translate-x-0";
    arrowClass = "left-3";
  } else if (align === 'right') {
    positionClass = "right-0 translate-x-0";
    arrowClass = "right-3";
  }

  return (
    <div className="group relative flex items-center gap-1 cursor-help z-20">
      <div className={`w-2 h-2 rounded-full ${color}`}></div>
      <span className="text-slate-400 hover:text-white transition-colors">{label}</span>
      
      <div className={`absolute top-6 ${positionClass} w-64 p-3 rounded-lg shadow-2xl 
                      bg-slate-950 border border-slate-700 
                      opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none 
                      z-[100]`}>
        <div className={`absolute -top-1 ${arrowClass} w-2 h-2 bg-slate-700 rotate-45 border-t border-l border-slate-600`}></div>
        <h4 className="text-white font-bold text-xs mb-1.5 flex items-center gap-2">
          {QUADRANT_DEFINITIONS[type].title}
        </h4>
        <p className="text-slate-300 text-[10px] leading-relaxed">
          {QUADRANT_DEFINITIONS[type].desc}
        </p>
        <div className="mt-2 text-[9px] font-mono text-emerald-400 bg-slate-900/50 p-1.5 rounded border border-slate-800/50">
          Condition: <span className="text-emerald-300">{QUADRANT_DEFINITIONS[type].criteria}</span>
        </div>
      </div>
    </div>
  );
};

// Sortable Header
export const SortableHeader = ({ label, sortKey, currentSort, onSort, align = 'left', colSpan, textColor = "text-slate-500", className = "" }: any) => {
  const isActive = currentSort?.key === sortKey;
  return (
      <div onClick={() => onSort(sortKey)} className={`${colSpan} ${className} flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors ${textColor} whitespace-nowrap ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
          <span>{label}</span>
          <span className={`opacity-50 shrink-0 ${isActive ? 'opacity-100 text-emerald-500' : ''}`}>
              {isActive ? (currentSort.direction === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />) : <ArrowUpDown size={10} />}
          </span>
      </div>
  );
};

// Metric Bar
export const MetricBar = ({ label, value, max, unit, color = "bg-emerald-500", isBest }: any) => {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  return (
      <div className="w-full">
          <div className="flex justify-between items-end mb-2 h-8">
              <div className={`flex items-center gap-1.5 ${isBest ? 'text-amber-400 font-bold' : 'text-slate-500 font-bold text-[10px]'} pb-0.5`}>
                  <span className="uppercase tracking-wide">{label}</span>
                  {isBest && <Trophy size={14} className="text-amber-400 animate-pulse" />}
              </div>
              <div className={`text-right font-mono ${isBest ? 'text-amber-400 text-lg font-black' : 'text-slate-300 text-xs'}`}>
                  {value.toLocaleString()}
                  <span className={`ml-0.5 ${isBest ? 'text-amber-500/80 text-xs' : 'text-slate-600 text-[10px]'}`}>{unit}</span>
              </div>
          </div>
          <div className="h-1.5 w-full bg-slate-950 overflow-hidden rounded-sm border border-slate-800/50">
              <div className={`h-full ${isBest ? 'bg-amber-400' : color}`} style={{ width: `${percent}%` }} />
          </div>
      </div>
  );
};

// Custom Treemap Content
export const CustomTreemapContent = (props: any) => {
  const { x, y, width, height, index, name, onMouseEnter, onMouseLeave, onClick } = props;
  if (!width || !height) return null;

  const displayName = name ? name.replace(/_/g, ' ') : '';
  const isSmallBlock = width < 60 || height < 30; 
  const words = displayName.split(' ');
  const shouldHideText = isSmallBlock || name.toLowerCase().includes('regent');

  return (
    <g>
      <rect
        x={x} y={y} width={width} height={height}
        style={{ fill: index % 2 === 0 ? '#059669' : '#047857', stroke: '#022c22', strokeWidth: 1, opacity: 0.95, cursor: 'pointer' }}
        onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onClick={onClick}
      />
      {!shouldHideText && (
        <text
          x={x + width / 2} y={y + height / 2 + 4} 
          textAnchor="middle" fill="#ffffff" stroke="none" fontSize={10} fontWeight="bold" style={{ pointerEvents: 'none', textShadow: 'none' }}
        >
          {words.length > 1 && width < 100 ? words[0] + '...' : displayName}
        </text>
      )}
    </g>
  );
};