import { Ship } from "../routes/dashboard/index";

// Default mapping image
export const DEFAULT_SHIP_IMAGE = "/images/ships/default-ship.png";

// Helper function: clean string
const cleanString = (str: string): string => {
  if (!str) return "";
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') 
    .replace(/^-+|-+$/g, '');
};

// Get ship image URL
export const getShipImage = (ship: Ship): string => {
  if (!ship?.Ship_name || !ship?.Cruise_line) return DEFAULT_SHIP_IMAGE;

  const shipSlug = cleanString(ship.Ship_name);
  const lineSlug = cleanString(ship.Cruise_line);

  return `/images/ships/${shipSlug}-${lineSlug}.png`;
};