import { Card } from "@/components/ui/card";
import { useState, useMemo, useEffect } from "react";
import {
    PieChart as PieChartIcon, Activity, X, Check, Search,
    DollarSign, Users, Box, Anchor, ChevronLeft, Target, Play,
    Download, BarChart3, RotateCcw, Filter,
    ChevronDown, ChevronUp, PanelTopClose, PanelTopOpen, LayoutDashboard
} from "lucide-react";
import {
    ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, Treemap, Cell, ReferenceLine, ReferenceArea, Label,
    BarChart, Bar
} from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ReactMarkdown from 'react-markdown';
import { ShipInsightCard } from "./ship-insight";

import { Ship } from "./index";
import { generateInvestmentMemo } from "./reviews-data";
import { KpiCard, LegendItem, SortableHeader, MetricBar, CustomTreemapContent } from "./investor-components";
import { TimeSeriesAnalysis } from "./time-series-analysis";

export const InvestorView = ({ ships }: { ships: Ship[] }) => {
    const [compareList, setCompareList] = useState<Ship[]>([]);
    const [filterText, setFilterText] = useState("");
    const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
    const [chartMode, setChartMode] = useState<'capacity' | 'age'>('capacity');
    const [sortConfig, setSortConfig] = useState<any>(null);
    const [selectedShip, setSelectedShip] = useState<Ship | null>(null);

    // Status: Banner visibility control
    const [isBannerVisible, setIsBannerVisible] = useState(true);
    const [isKpiExpanded, setIsKpiExpanded] = useState(true);

    const [activeFilter, setActiveFilter] = useState<{ label: string, ships: Ship[], type: 'line' | 'age' } | null>({
        label: "All Fleets",
        ships: ships,
        type: 'line'
    });

    // Effect: KPIs are collapsed by default on mobile phones and expanded by default on desktops.
    useEffect(() => {
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
            setIsKpiExpanded(false);
        }
    }, []);

    // 1. Base data (filtered by search box)
    const baseShips = useMemo(() => {
        const uniqueMap = new Map();
        ships.forEach(s => { const k = `${s.Ship_name.trim()}|${s.Cruise_line.trim()}`; if (!uniqueMap.has(k)) uniqueMap.set(k, s); });
        let result = Array.from(uniqueMap.values()) as Ship[];
        if (filterText) { const l = filterText.toLowerCase(); result = result.filter(s => s.Ship_name.toLowerCase().includes(l) || s.Cruise_line.toLowerCase().includes(l)); }
        return result;
    }, [ships, filterText]);

    // 2. View data (filtered by chart clicks)
    const viewShips = useMemo(() => {
        if (activeFilter) {
            return activeFilter.ships;
        }
        return baseShips;
    }, [baseShips, activeFilter]);

    // 3. Sorting (based on viewShips)
    const sortedShips = useMemo(() => {
        if (!sortConfig) return viewShips;
        return [...viewShips].sort((a, b) => {
            let aVal: any = a[sortConfig.key as keyof Ship], bVal: any = b[sortConfig.key as keyof Ship];
            if (sortConfig.key === 'paxPerCab') { aVal = a.passengers / a.cabins; bVal = b.passengers / b.cabins; }
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [viewShips, sortConfig]);

    // 4. KPI Calculation
    const kpiStats = useMemo(() => {
        if (viewShips.length === 0) return { totalCap: 0, avgPaxPerCabin: 0, avgCrewEff: 0, avgAge: 0, avgDensity: 0 };

        const totalPax = viewShips.reduce((a, s) => a + s.passengers, 0) * 100;
        const totalCrew = viewShips.reduce((a, s) => a + s.crew, 0); 

        const sumPax = viewShips.reduce((a, s) => a + s.passengers, 0);
        const sumCrew = viewShips.reduce((a, s) => a + s.crew, 0);
        const sumDensity = viewShips.reduce((a, s) => a + s.passenger_density, 0);

        const tc = sumPax * 100;
        const tcab = viewShips.reduce((a, s) => a + s.cabins, 0) * 100;
        const tage = viewShips.reduce((a, s) => a + s.Age, 0);

        return {
            totalCap: tc,
            avgPaxPerCabin: tcab > 0 ? tc / tcab : 0,
            avgCrewEff: sumCrew > 0 ? (sumPax * 100) / (sumCrew * 100) : 0,
            weightedCrewRatio: sumCrew > 0 ? sumPax / sumCrew : 0,
            avgAge: tage / viewShips.length,
            // Calculate average density
            avgDensity: sumDensity / viewShips.length
        };
    }, [viewShips]);

    // 5. Chart data source
    const treemapData = useMemo(() => {
        const g: Record<string, Ship[]> = {};
        baseShips.forEach(s => { if (!g[s.Cruise_line]) g[s.Cruise_line] = []; g[s.Cruise_line].push(s); });
        return Object.entries(g).map(([name, list]) => ({ name, size: list.reduce((a, b) => a + b.passengers, 0), ships: list })).sort((a, b) => b.size - a.size);
    }, [baseShips]);

    const ageDistributionData = useMemo(() => {
        const buckets: Record<string, Ship[]> = { '0-5y': [], '6-10y': [], '11-15y': [], '16-20y': [], '20y+': [] };
        baseShips.forEach(s => {
            if (s.Age <= 5) buckets['0-5y'].push(s); else if (s.Age <= 10) buckets['6-10y'].push(s); else if (s.Age <= 15) buckets['11-15y'].push(s); else if (s.Age <= 20) buckets['16-20y'].push(s); else buckets['20y+'].push(s);
        });
        return Object.entries(buckets).map(([range, list]) => ({ range, count: list.length, ships: list }));
    }, [baseShips]);

    // 6. Scatter chart data
    const scatterData = useMemo(() => {
        return viewShips.map(s => { 
            const evaluation = generateInvestmentMemo(s);
            const ratio = s.crew > 0 ? parseFloat((s.passengers / s.crew).toFixed(2)) : 0;
            return { ...s, x_luxury: s.passenger_density, y_efficiency: ratio, category: evaluation.category };
        });
    }, [viewShips]);

    // 7. Best Stats
    const bestStats = useMemo(() => {
        if (compareList.length < 2) return null;
        return {
            maxTonnage: Math.max(...compareList.map(s => s.Tonnage)), maxCapacity: Math.max(...compareList.map(s => s.passengers)),
            minAge: Math.min(...compareList.map(s => s.Age)), maxEfficiency: Math.max(...compareList.map(s => s.passengers / s.crew))
        };
    }, [compareList]);

    // Actions
    const handleSort = (key: keyof Ship | 'paxPerCab') => setSortConfig((c: any) => c?.key === key ? { key, direction: c.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' });

    const handleExport = () => {
        const targetData = compareList.length > 0 ? compareList : sortedShips;
        const headers = ["Ship Name", "Line", "Age", "Tonnage", "Passengers", "Cabins", "Density", "Pax/Crew Ratio", "Category (AI Rating)"];
        const csvContent = [headers.join(","), ...targetData.map(s => {
            const analysis = generateInvestmentMemo(s);
            const ratio = s.crew > 0 ? (s.passengers / s.crew).toFixed(2) : "0";
            return [`"${s.Ship_name}"`, `"${s.Cruise_line}"`, s.Age, Math.round(s.Tonnage), s.passengers * 100, s.cabins * 100, s.passenger_density.toFixed(2), ratio, `"${analysis.category}"`].join(",");
        })].join("\n");
        const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csvContent], { type: "text/csv;charset=utf-8;" }));
        link.download = compareList.length > 0 ? `fleet_selection_analysis_${compareList.length}_ships.csv` : "fleet_market_scan_export.csv";
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    };

    const toggleCompare = (ship: Ship) => {
        if (compareList.find(s => s.Ship_name === ship.Ship_name)) {
            setCompareList(p => p.filter(x => x.Ship_name !== ship.Ship_name)); if (compareList.length <= 1) setIsAnalysisOpen(false);
        } else {
            if (compareList.length < 3) setCompareList(p => [...p, ship]); else alert("Max 3 ships.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 font-mono text-slate-300 pb-80 selection:bg-emerald-500/30">

            <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-[1800px] mx-auto px-6 h-14 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => window.location.href = '/'} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider border border-slate-700 px-3 py-1.5 rounded-sm hover:border-slate-500"><ChevronLeft size={14} /> Switch Mode </button>
                        <div className="h-6 w-px bg-slate-800 hidden md:block"></div>
                        <div className="flex items-center gap-3"><div className="w-3 h-3 bg-emerald-500 rounded-sm animate-pulse shadow-[0_0_10px_#10b981]" /><h1 className="text-sm font-bold tracking-[0.2em] text-emerald-400 uppercase hidden md:block">Global Fleet Analytics <span className="text-slate-600"> // TERMINAL V2.0</span></h1></div>
                    </div>
                    <div className="text-xs text-slate-500 flex gap-6">
                        {!isBannerVisible && (
                            <button onClick={() => setIsBannerVisible(true)} className="flex items-center gap-2 text-emerald-400 font-bold hover:text-emerald-300 transition-colors animate-pulse">
                                <PanelTopOpen size={16} /> SHOW METRICS
                            </button>
                        )}
                        <span className="hidden md:inline">DATA_SOURCE: LIVE_FEED</span>
                        <span>UNITS: {baseShips.length}</span>
                    </div>
                </div>
            </header>

            <main className="max-w-[1800px] mx-auto space-y-6 pb-96">

                {/* Collapsible Floating Container (Banner + KPIs) */}
                {isBannerVisible && (
                    <div className="sticky top-14 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/50 shadow-2xl transition-all duration-300">
                        <div className="px-6 py-2 border-b border-slate-800/30 flex items-center justify-between bg-slate-900/50">
                            <div className="flex items-center gap-3 overflow-hidden">
                                {activeFilter ? (
                                    <div className="flex items-center gap-2 text-emerald-400 animate-in slide-in-from-left-2">
                                        <Filter size={12} />
                                        <span className="text-[10px] font-bold uppercase tracking-wider truncate">
                                            Filter: {activeFilter.label} <span className="text-slate-500">({activeFilter.ships.length})</span>
                                        </span>
                                        <button onClick={() => setActiveFilter(null)} className="ml-1 p-0.5 hover:bg-slate-800 rounded text-slate-500 hover:text-white"><X size={10} /></button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <LayoutDashboard size={12} />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">All Fleets Overview</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setIsKpiExpanded(!isKpiExpanded)}
                                    className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                                    title={isKpiExpanded ? "Collapse KPIs" : "Expand KPIs"}
                                >
                                    {isKpiExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </button>
                                <div className="w-px h-3 bg-slate-700 mx-1"></div>
                                <button
                                    onClick={() => setIsBannerVisible(false)}
                                    className="p-1.5 hover:bg-slate-800 hover:text-red-400 rounded text-slate-500 transition-colors"
                                    title="Hide Panel"
                                >
                                    <PanelTopClose size={14} />
                                </button>
                            </div>
                        </div>

                        {isKpiExpanded && (
                            <div className="px-6 py-4 animate-in slide-in-from-top-2 duration-300">
                                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                                    {/* Note: On mobile, display two KPIs per row for a more compact layout */}
                                    <KpiCard label={activeFilter ? "Segment Cap." : "Total Cap."} value={kpiStats.totalCap.toLocaleString()} sub="Revenue Base" icon={DollarSign} />
                                    <KpiCard label="Yield" value={`${kpiStats.avgPaxPerCabin.toFixed(2)}x`} sub="Pax/Cabin" icon={Box} color="text-blue-400" />
                                    <KpiCard label="Leverage" value={`${kpiStats.avgCrewEff.toFixed(2)}`} sub="Pax/Crew" icon={Users} color="text-amber-400" />
                                    <KpiCard label="Risk" value={`${kpiStats.avgAge.toFixed(1)} yr`} sub="Avg Age" icon={Anchor} color={kpiStats.avgAge > 15 ? "text-red-400" : "text-emerald-400"} />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="px-6 space-y-6 pt-6"> 

                    {/* Market Positioning Overview Card (ShipInsightCard) */}
                    {viewShips.length > 0 && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <ShipInsightCard
                                title={activeFilter ? activeFilter.label : "Total Fleet Market Profile"}
                                avgDensity={parseFloat((viewShips.reduce((a, s) => a + s.passenger_density, 0) / viewShips.length).toFixed(1))}
                                avgCrewRatio={
                                    viewShips.reduce((a, s) => a + s.passengers, 0) /
                                    Math.max(1, viewShips.reduce((a, s) => a + s.crew, 0))
                                }
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[450px]">
                        <Card className="lg:col-span-1 bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[450px] lg:h-auto">
                            <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    {chartMode === 'capacity' ? <PieChartIcon size={14} className="text-emerald-500" /> : <BarChart3 size={14} className="text-amber-500" />}
                                    {chartMode === 'capacity' ? 'Market Share' : 'Fleet Age Profile'}
                                </div>
                                <div className="flex bg-slate-950 border border-slate-800 rounded-sm p-0.5">
                                    <button onClick={() => setChartMode('capacity')} className={`p-1 rounded-sm transition-all ${chartMode === 'capacity' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-white'}`} title="Capacity Map"><PieChartIcon size={12} /></button>
                                    <button onClick={() => setChartMode('age')} className={`p-1 rounded-sm transition-all ${chartMode === 'age' ? 'bg-amber-600 text-white' : 'text-slate-500 hover:text-white'}`} title="Age Distribution"><BarChart3 size={12} /></button>
                                </div>
                            </div>
                            <div className="flex-1 min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    {chartMode === 'capacity' ? (
                                        <Treemap
                                            data={treemapData}
                                            dataKey="size"
                                            aspectRatio={4 / 3}
                                            stroke="#022c22"
                                            content={<CustomTreemapContent />}
                                            onClick={(data: any) => {
                                                if (data && data.ships) setActiveFilter({ label: data.name, ships: data.ships, type: 'line' });
                                            }}
                                        >
                                            <RechartsTooltip content={({ active, payload }) => { if (active && payload && payload.length) { return (<div className="bg-slate-950 border border-emerald-500/30 p-2 text-xs text-emerald-400 font-mono shadow-xl z-50"><span className="block font-bold text-white mb-1">{payload[0].payload.name}</span>Capacity: {payload[0].value?.toLocaleString()}<br /><span className="text-slate-500 text-[10px]">Click to filter dashboard</span></div>); } return null; }} />
                                        </Treemap>
                                    ) : (
                                        <BarChart data={ageDistributionData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} vertical={false} />
                                            <XAxis dataKey="range" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                                            <RechartsTooltip cursor={{ fill: '#1e293b', opacity: 0.4 }} content={({ active, payload }) => { if (active && payload && payload.length) { return (<div className="bg-slate-950 border border-amber-500/30 p-2 text-xs text-amber-400 font-mono shadow-xl z-50"><span className="block font-bold text-white mb-1">Age: {payload[0].payload.range}</span>Ships: {payload[0].value}</div>); } return null; }} />
                                            <Bar
                                                dataKey="count"
                                                fill="#d97706"
                                                radius={[4, 4, 0, 0]}
                                                onClick={(data: any) => {
                                                    if (data && data.ships) setActiveFilter({ label: `${data.range} Age Group`, ships: data.ships, type: 'age' });
                                                }}
                                                style={{ cursor: 'pointer' }}
                                            />
                                        </BarChart>
                                    )}
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        <Card className="lg:col-span-2 bg-slate-900 border border-slate-800 shadow-2xl flex flex-col h-[450px] lg:h-auto">
                            <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider"><Target size={14} className="text-emerald-500" />Strategic Positioning Matrix</div>
                                <div className="flex gap-4 text-[10px] font-bold font-mono">
                                    <LegendItem label="Cash Cows" color="bg-blue-500" type="Cash Cow" align="left" />
                                    <LegendItem label="Mass Mkt" color="bg-emerald-500" type="Mass Market" />
                                    <LegendItem label="Luxury" color="bg-purple-500" type="Luxury" />
                                    <LegendItem label="Risk" color="bg-slate-600" type="Risk Asset" align="right" />
                                </div>
                            </div>
                            <div className="flex-1 min-h-0 p-4 relative bg-slate-950/50">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
                                        <XAxis type="number" dataKey="x_luxury" name="Space" domain={[20, 70]} stroke="#475569" fontSize={10} label={{ value: 'Space Ratio (Comfort) →', position: 'insideBottomRight', offset: -5, fill: '#475569', fontSize: 10 }} />
                                        <YAxis type="number" dataKey="y_efficiency" name="Efficiency" domain={[1, 4.5]} stroke="#475569" fontSize={10} label={{ value: '↑ Efficiency (Pax/Crew)', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 10 }} />
                                        <ReferenceLine x={40} stroke="#64748b" strokeDasharray="5 5" strokeWidth={1} />
                                        <ReferenceLine y={2.5} stroke="#64748b" strokeDasharray="5 5" strokeWidth={1} />
                                        <ReferenceArea x1={40} x2={70} y1={2.5} y2={4.5} fill="transparent" stroke="none"><Label value="CASH COWS" position="center" fill="#3b82f6" fontSize={24} fontWeight="900" opacity={0.3} /></ReferenceArea>
                                        <ReferenceArea x1={20} x2={40} y1={2.5} y2={4.5} fill="transparent" stroke="none"><Label value="MASS MARKET" position="center" fill="#10b981" fontSize={24} fontWeight="900" opacity={0.3} /></ReferenceArea>
                                        <ReferenceArea x1={20} x2={40} y1={1} y2={2.5} fill="transparent" stroke="none"><Label value="RISK ASSETS" position="center" fill="#64748b" fontSize={24} fontWeight="900" opacity={0.3} /></ReferenceArea>
                                        <ReferenceArea x1={40} x2={70} y1={1} y2={2.5} fill="transparent" stroke="none"><Label value="LUXURY NICHE" position="center" fill="#a855f7" fontSize={24} fontWeight="900" opacity={0.3} /></ReferenceArea>
                                        <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => { if (active && payload && payload.length) { const data = payload[0].payload; return (<div className="bg-slate-950 border border-emerald-500/30 p-3 text-xs font-mono shadow-xl z-50"><div className="text-white font-bold text-sm mb-1">{data.Ship_name}</div><div className="text-emerald-400 mb-2">{data.Cruise_line}</div><div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-400"><span>Space:</span> <span className="text-slate-200 text-right">{data.x_luxury}</span><span>Ratio:</span> <span className="text-slate-200 text-right">{data.y_efficiency}</span><span>Zone:</span> <span className="text-white text-right font-bold">{data.category}</span></div><div className="mt-2 text-[10px] text-blue-400 text-center border-t border-slate-800 pt-1">Click for Analysis</div></div>); } return null; }} />
                                        <Scatter name="Ships" data={scatterData} shape="circle" onClick={(data) => { if (data) setSelectedShip(data as any); }} style={{ cursor: 'pointer' }}>
                                            {scatterData.map((entry, index) => {
                                                let color = "#64748b"; if (entry.category === "Cash Cow") color = "#3b82f6"; else if (entry.category === "Mass Market") color = "#10b981"; else if (entry.category === "Luxury") color = "#a855f7";
                                                return <Cell key={`cell-${index}`} fill={color} fillOpacity={0.7} stroke={color} />;
                                            })}
                                        </Scatter>
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </div>

                    <TimeSeriesAnalysis ships={viewShips} onShipSelect={setSelectedShip} />

                    <Card className="bg-slate-900 border border-slate-800 overflow-hidden flex flex-col max-h-[600px]">
                        <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-900 shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider"><Activity size={14} className="text-blue-500" />Full Asset Database</div>
                                {sortConfig && <button onClick={() => setSortConfig(null)} className="text-[10px] flex items-center gap-1 text-slate-500 hover:text-white transition-colors bg-slate-800 px-2 py-0.5 rounded"><RotateCcw size={10} /> Reset Sort</button>}
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handleExport}
                                    className={`flex items-center gap-2 px-3 py-1.5 border rounded-sm text-[10px] font-bold uppercase transition-all duration-300
                    ${compareList.length > 0
                                            ? 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)] animate-in fade-in zoom-in-95'
                                            : 'bg-emerald-600/20 text-emerald-400 border-emerald-500/50 hover:bg-emerald-600 hover:text-white'
                                        }`}
                                >
                                    <Download size={12} />
                                    {compareList.length > 0 ? `Export Selected (${compareList.length})` : "Export Filtered View"}
                                </button>
                                <div className="relative"><Search className="absolute left-2 top-1.5 text-slate-500 w-3 h-3" /><input type="text" placeholder="SEARCH ASSETS..." value={filterText} onChange={e => setFilterText(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-sm py-1 pl-7 pr-2 text-xs text-emerald-400 focus:outline-none focus:border-emerald-500 placeholder-slate-600 uppercase w-32 md:w-48" /></div>
                            </div>
                        </div>

                        <div className="overflow-auto flex-1 w-full relative">
                            <div className="min-w-max w-full">
                                <div className="sticky top-0 z-10 grid grid-cols-12 bg-slate-950 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-500 select-none shadow-sm">
                                    <SortableHeader label="Name" sortKey="Ship_name" currentSort={sortConfig} onSort={handleSort} colSpan="col-span-4 md:col-span-3" className="border-r border-slate-800 pl-4 py-3" />
                                    <SortableHeader label="Line" sortKey="Cruise_line" currentSort={sortConfig} onSort={handleSort} colSpan="col-span-2" className="border-r border-slate-800 pl-2 py-3" />
                                    <SortableHeader label="Tonnage" sortKey="Tonnage" currentSort={sortConfig} onSort={handleSort} align="right" colSpan="hidden md:block col-span-1" className="border-r border-slate-800 pr-2 py-3" />
                                    <SortableHeader label="Capacity" sortKey="passengers" currentSort={sortConfig} onSort={handleSort} align="right" colSpan="col-span-1" className="border-r border-slate-800 pr-2 py-3" />
                                    <SortableHeader label="Cabins" sortKey="cabins" currentSort={sortConfig} onSort={handleSort} align="right" colSpan="col-span-1" textColor="text-blue-400" className="border-r border-slate-800 pr-2 py-3" />
                                    <SortableHeader label="Pax/Cab" sortKey="paxPerCab" currentSort={sortConfig} onSort={handleSort} align="right" colSpan="col-span-1" textColor="text-blue-400" className="border-r border-slate-800 pr-2 py-3" />
                                    <SortableHeader label="Dens." sortKey="passenger_density" currentSort={sortConfig} onSort={handleSort} align="right" colSpan="col-span-1" className="border-r border-slate-800 pr-2 py-3" />
                                    <SortableHeader label="Age" sortKey="Age" currentSort={sortConfig} onSort={handleSort} align="right" colSpan="hidden md:block col-span-1" className="border-r border-slate-800 pr-2 py-3" />
                                    <div className="col-span-2 md:col-span-1 text-center text-emerald-500 cursor-default flex items-center justify-center py-3 bg-slate-950/50">Select</div>
                                </div>
                                <div>
                                    {sortedShips.map((ship, idx) => {
                                        const isSelected = compareList.find(s => s.Ship_name === ship.Ship_name);
                                        const paxPerCab = ship.cabins > 0 ? (ship.passengers / ship.cabins).toFixed(2) : "-";
                                        return (
                                            <div key={`${ship.Ship_name}-${idx}`} className={`grid grid-cols-12 text-xs border-b border-slate-800/50 hover:bg-emerald-900/10 transition-colors items-center group ${isSelected ? 'bg-emerald-900/20' : ''}`}>
                                                <div className={`col-span-4 md:col-span-3 font-bold truncate pl-4 py-2 border-r border-slate-800/50 cursor-pointer hover:underline ${isSelected ? 'text-emerald-400' : 'text-slate-300'}`} onClick={() => setSelectedShip(ship)}>{ship.Ship_name}</div>
                                                <div className="col-span-2 text-slate-500 truncate pl-2 py-2 border-r border-slate-800/50">{ship.Cruise_line}</div>
                                                <div className="hidden md:block col-span-1 text-right font-mono text-slate-400 pr-2 py-2 border-r border-slate-800/50">{Math.round(ship.Tonnage).toLocaleString()}</div>
                                                <div className="col-span-1 text-right font-mono text-slate-400 pr-2 py-2 border-r border-slate-800/50">{(ship.passengers * 100).toLocaleString()}</div>
                                                <div className="col-span-1 text-right font-mono text-blue-400/80 pr-2 py-2 border-r border-slate-800/50">{(ship.cabins * 100).toLocaleString()}</div>
                                                <div className="col-span-1 text-right font-mono text-blue-400 font-bold pr-2 py-2 border-r border-slate-800/50">{paxPerCab}</div>
                                                <div className="col-span-1 text-right font-mono text-slate-500 pr-2 py-2 border-r border-slate-800/50">{ship.passenger_density.toFixed(1)}</div>
                                                <div className="hidden md:block col-span-1 text-right font-mono text-slate-500 pr-2 py-2 border-r border-slate-800/50">{ship.Age}</div>
                                                <div className="col-span-2 md:col-span-1 text-center flex justify-center py-2">
                                                    <button onClick={() => toggleCompare(ship)} className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-all ${isSelected ? 'bg-emerald-500 border-emerald-500 text-slate-900' : 'border-slate-600 hover:border-emerald-400'}`}>
                                                        {isSelected && <Check size={10} strokeWidth={4} />}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </main>

            {/* --- Overlay Components --- */}
            {/* Tray (Fixed Height) */}
            <div
                className={`fixed bottom-0 left-0 w-full bg-slate-950 border-t-2 border-emerald-500 shadow-[0_-10px_50px_rgba(16,185,129,0.1)] transition-transform duration-500 ease-in-out z-50 
        ${compareList.length > 0 ? 'translate-y-0' : 'translate-y-full'}`}
                style={{ height: '30vh' }}
            >
                <div className="h-full flex flex-col">
                    <div className="flex justify-between items-center px-6 py-2 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shrink-0">
                        <div className="flex items-center gap-3"><div className="bg-emerald-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-sm flex items-center gap-1"><Target size={10} /> TRAY</div><span className="text-slate-300 text-xs font-bold uppercase tracking-widest">{compareList.length} Selected</span></div>
                        <div className="flex items-center gap-3"><button disabled={compareList.length < 2} onClick={() => setIsAnalysisOpen(true)} className={`bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-sm font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-900/50 transition-all ${compareList.length < 2 ? 'opacity-50 cursor-not-allowed' : ''}`}>RUN ANALYSIS <Play size={10} fill="currentColor" /></button><div className="h-4 w-px bg-slate-700 mx-1"></div><button onClick={() => setCompareList([])} className="text-[10px] text-slate-500 hover:text-red-400 uppercase tracking-wider flex items-center gap-1 transition-colors"><X size={12} /> Clear</button></div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 bg-slate-950/95">
                        <div className="max-w-[1800px] mx-auto">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
                                {compareList.map(ship => (
                                    <div key={ship.Ship_name} className="bg-slate-900 border border-slate-700 p-3 relative group shadow-xl flex flex-col justify-center">
                                        <button onClick={() => toggleCompare(ship)} className="absolute top-2 right-2 text-slate-600 hover:text-red-500"><X size={14} /></button>
                                        <h3 className="text-sm font-bold text-white truncate">{ship.Ship_name}</h3>
                                        <div className="text-[10px] text-emerald-500 font-mono uppercase font-bold mb-2">{ship.Cruise_line}</div>
                                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 font-mono"><span>Cap: <span className="text-slate-200">{(ship.passengers * 100).toLocaleString()}</span></span><span>Ton: <span className="text-slate-200">{Math.round(ship.Tonnage)}k</span></span></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Analysis Modal */}
            {isAnalysisOpen && (
                <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-200" onClick={() => setIsAnalysisOpen(false)}>
                    <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                            <div><h2 className="text-2xl font-bold text-white flex items-center gap-3"><Activity className="text-emerald-500" /> Tactical Comparison</h2><p className="text-slate-400 text-xs uppercase tracking-widest mt-1">Side-by-side asset evaluation</p></div>
                            <button onClick={() => setIsAnalysisOpen(false)} className="text-slate-400 hover:text-white"><X size={24} /></button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-x divide-slate-800">
                            {compareList.map(ship => {
                                const ratio = ship.passengers / ship.crew;
                                const isMaxTonnage = bestStats && ship.Tonnage === bestStats.maxTonnage;
                                const isMaxCap = bestStats && ship.passengers === bestStats.maxCapacity;
                                const isMaxEff = bestStats && ratio === bestStats.maxEfficiency;
                                const isNewest = bestStats && ship.Age === bestStats.minAge;
                                return (
                                    <div key={ship.Ship_name} className="p-8 bg-slate-900">
                                        <div className="mb-8 text-center"><h3 className="text-2xl font-black text-white mb-2">{ship.Ship_name}</h3><div className="inline-block bg-slate-800 px-3 py-1 rounded text-xs font-mono text-emerald-400 uppercase border border-slate-700">{ship.Cruise_line}</div></div>
                                        <div className="space-y-6">
                                            <MetricBar label="Tonnage" value={ship.Tonnage} max={230} unit="k" isBest={isMaxTonnage} />
                                            <MetricBar label="Total Capacity" value={ship.passengers * 100} max={6500} unit="" isBest={isMaxCap} />
                                            <MetricBar label="Op. Efficiency" value={ratio} max={4} unit=" ratio" color="bg-blue-500" isBest={isMaxEff} />
                                            <MetricBar label="Asset Age" value={ship.Age} max={30} unit=" yr" color="bg-amber-500" isBest={isNewest} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Modal (Single Ship) */}
            <Dialog open={!!selectedShip} onOpenChange={(open: boolean) => !open && setSelectedShip(null)}>
                <DialogContent className="bg-slate-900 border border-slate-700 text-slate-200 max-w-2xl">
                    <DialogHeader><DialogTitle className="text-2xl font-black text-white flex items-center gap-3"><Anchor className="text-emerald-500" /> {selectedShip?.Ship_name}<span className="text-sm font-normal text-slate-500 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{selectedShip?.Cruise_line}</span></DialogTitle></DialogHeader>
                    {selectedShip && (
                        <div className="space-y-6 mt-4">
                            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                                <div className="flex items-center gap-2 mb-3"><Activity size={16} className="text-blue-400" /><span className="text-xs font-bold uppercase tracking-widest text-blue-400">AI Analyst Assessment</span></div>
                                {(() => {
                                    const memo = generateInvestmentMemo(selectedShip);
                                    return (
                                        <div className="space-y-3">
                                            <div className="text-sm text-slate-300 leading-relaxed font-mono border-l-2 border-slate-700 pl-4">
                                                <ReactMarkdown
                                                    components={{
                                                        strong: ({ node, ...props }) => (
                                                            <strong className="text-white font-black" {...props} />
                                                        ),
                                                    }}
                                                >
                                                    {memo.summary}
                                                </ReactMarkdown>
                                            </div>

                                            <div className="grid grid-cols-1 gap-2">
                                                {memo.bulletPoints.map((point, i) => (
                                                    <div
                                                        key={i}
                                                        className="text-xs text-slate-400 bg-slate-900/50 p-2 rounded flex items-center gap-2"
                                                    >
                                                        {point}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="p-3 bg-slate-800/50 rounded border border-slate-800"><div className="text-[10px] text-slate-500 uppercase">Age</div><div className="text-xl font-bold text-white">{selectedShip.Age}<span className="text-xs text-slate-500 ml-1">yr</span></div></div>
                                <div className="p-3 bg-slate-800/50 rounded border border-slate-800"><div className="text-[10px] text-slate-500 uppercase">Pax/Crew</div><div className="text-xl font-bold text-emerald-400">{(selectedShip.passengers / selectedShip.crew).toFixed(2)}</div></div>
                                <div className="p-3 bg-slate-800/50 rounded border border-slate-800"><div className="text-[10px] text-slate-500 uppercase">Space Ratio</div><div className="text-xl font-bold text-blue-400">{selectedShip.passenger_density.toFixed(1)}</div></div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

        </div>
    );
};