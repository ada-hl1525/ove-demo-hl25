import { createRoute } from "@tanstack/react-router";
import type { RootRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ModeSelector } from "./mode-selector";
import { InvestorView } from "./investor-view";
import { TravelerView } from "./traveler-view";

// Export the Ship type so that other files can be used
export type Ship = {
  Ship_name: string;
  Cruise_line: string;
  Age: number;
  Tonnage: number;
  passengers: number;
  length: number;
  cabins: number;
  passenger_density: number;
  crew: number;
};

export const DashboardPage = () => {
  const [ships, setShips] = useState<Ship[]>([]);
  const [viewMode, setViewMode] = useState<'selection' | 'traveler' | 'investor'>('selection');


  useEffect(() => {
    fetch("http://localhost:8000/api/v1/ships")
      .then(res => res.json())
      .then(setShips)
      .catch(console.error);
  }, []);


  if (viewMode === 'selection') {
    return <ModeSelector onSelect={setViewMode} />;
  }

  return (
    <div className="relative">
      {/* Floating back button */}
      <button 
        onClick={() => setViewMode('selection')}
        className={`fixed top-4 left-4 z-50 px-4 py-2 rounded-full text-xs font-bold backdrop-blur-md transition-all shadow-lg flex items-center gap-2 ${
            viewMode === 'investor' 
            ? 'bg-slate-800/80 text-white border border-slate-700 hover:bg-slate-700' 
            : 'bg-white/80 text-slate-800 border border-slate-200 hover:bg-white'
        }`}
      >
        <span>←</span> Switch Mode
      </button>

      {viewMode === 'investor' ? (
        <InvestorView ships={ships} />
      ) : (
        <TravelerView ships={ships} />
      )}
    </div>
  );
};

const DashboardRoute = <A, B, C, D, E, F extends Record<string, never>, G, H>(
  parentRoute: RootRoute<A, B, C, D, E, F, G, H>
) =>
  createRoute({
    path: "/dashboard",
    component: DashboardPage,
    getParentRoute: () => parentRoute,
  });

export default DashboardRoute;