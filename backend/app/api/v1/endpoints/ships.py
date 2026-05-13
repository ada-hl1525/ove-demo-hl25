import pandas as pd
from fastapi import APIRouter, Query

router = APIRouter()

DATA_PATH = "data/cruise_ship_info.csv"

df_ships = pd.DataFrame()

def load_data():
    """Read CSV data and clean it"""
    global df_ships
    try:
        df = pd.read_csv(DATA_PATH)
        df.columns = df.columns.str.strip()
        print(f"✅ Successfully loaded {len(df)} ships from {DATA_PATH}")
        df_ships = df
    except Exception as e:
        print(f"❌ Error loading CSV: {e}")
        df_ships = pd.DataFrame()

# Automatically load data when the module is imported
load_data()

@router.get("/ships")
async def get_ships(cruise_line: str = Query(None, description="Filter by Cruise Line")):
    """
    Get a list of cruise ships. Support filtering: GET /api/v1/ships?cruise_line=Carnival
    """
    if df_ships.empty:
        return []

    filtered_df = df_ships.copy()
    
    if cruise_line:
        filtered_df = filtered_df[filtered_df['Cruise_line'] == cruise_line]
        
    # orient="records" Output format: [{"Ship_name": "Journey", ...}, ...]
    return filtered_df.to_dict(orient="records")

@router.get("/cruise_lines")
async def get_cruise_lines():
    """
    Get all cruise company names (duplication removed) for use in the front-end drop-down box
    """
    if df_ships.empty:
        return {"cruise_lines": []}
        
    lines = df_ships['Cruise_line'].unique().tolist()
    return {"cruise_lines": sorted(lines)}