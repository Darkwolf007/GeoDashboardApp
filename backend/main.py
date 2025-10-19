
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import logging
import pandas as pd
import numpy as np

app = FastAPI()

# Allow CORS for local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model at startup
MODEL_PATH = "model.pkl"  # Place your .pkl file here
try:
    model = joblib.load(MODEL_PATH)
except Exception:
    model = None

class PredictionRequest(BaseModel):
    zone_index: int
    area: str
    rooms_en: str
    amenities_counter: dict
    actual_price: dict = None
    predict_price: dict = None


# Setup logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s [%(levelname)s] %(message)s')

WEIGHTED_CSV_PATH = "weighted.csv"
weighted_df = pd.read_csv(WEIGHTED_CSV_PATH)

@app.post("/predict")
async def predict(req: PredictionRequest):
    import math
    forecasts = []
    zone_index = req.zone_index
    actual_price = req.actual_price if req.actual_price else {}
    predict_price = req.predict_price if req.predict_price else {}
    # Extract years and prices from actual_price
    years = [int(y) for y in actual_price.keys() if str(y).isdigit()]
    prices = [float(actual_price[str(y)]) for y in years]
    # Extract years and prices from predict_price
    pred_years = [int(y) for y in predict_price.keys() if str(y).isdigit()]
    pred_prices = [float(predict_price[str(y)]) for y in pred_years]
    if pred_years and pred_prices:
        min_year = min(pred_years)
        max_year = max(pred_years)
        last_year = max(pred_years)
        last_price = pred_prices[-1]
        forecasts.append({"year": str(last_year), "price": last_price})
    elif years and prices:
        min_year = min(years)
        max_year = max(years)
        last_year = max(years)
        last_price = prices[-1]
        forecasts.append({"year": str(last_year), "price": last_price})
    else:
        min_year = 2012
        max_year = 2024
        last_year = max_year
        last_price = 1000000
    # Calculate amenities_sum (raw, not normalized)
    amenities_sum = sum(req.amenities_counter.values()) if req.amenities_counter else 0
    # Lookup original weighted_score from CSV
    area = req.area.strip() if req.area else ''
    rooms = req.rooms_en.strip() if req.rooms_en else ''
    zone = req.zone_index
    # Skip the index column if present
    if 'Unnamed: 0' in weighted_df.columns:
        weighted_df_use = weighted_df.drop(columns=['Unnamed: 0'])
    else:
        weighted_df_use = weighted_df
    match = weighted_df_use[(weighted_df_use['area_name_en'] == area) & (weighted_df_use['zone_index'] == zone) & (weighted_df_use['rooms_en'] == rooms)]
    if not match.empty:
        original_weighted_score = float(match.iloc[0]['weighted_score'])
    else:
        original_weighted_score = None
    # If no add/subtract, use original weighted_score
    # If amenities_sum matches original, use original weighted_score
    # If amenities_sum changed, normalize new sum against original
    logging.debug(f"area={area}, zone={zone}, rooms={rooms}, amenities_sum={amenities_sum}, original_weighted_score={original_weighted_score}")
    # Amenity weights mapping
    amenity_weights = {
        'hospital': 0.07,
        'metro': 0.09,
        'school': 0.08,
        'university': 0.06,
        'park': 0.075,
        'office': 0.065,
        'poi': 0.05,
        'landfill': -0.06,
        'prison': -0.05,
        'highway': -0.04,
        'bar': -0.03,
        'cemetery': -0.02
    }
    # Calculate amenity adjustment from dashboard
    amenity_adjustment = 0.0
    for k, v in req.amenities_counter.items():
        key = k.lower().replace(' ', '').replace('_', '')
        # Map dashboard key to amenity_weights key
        for aw in amenity_weights.keys():
            if key == aw.replace(' ', '').replace('_', ''):
                amenity_adjustment += 0.1 * v * amenity_weights[aw]
    if original_weighted_score is not None and amenities_sum == 0:
        weighted_score = original_weighted_score
    elif original_weighted_score is not None and amenities_sum != 0:
        weighted_score = max(0.0, min(1.0, original_weighted_score + amenity_adjustment))
    else:
        weighted_score = amenity_adjustment
    logging.debug(f"weighted_score used for model: {weighted_score}")
    # Forecast next 5 years
    for i in range(1, 6):
        year = last_year + i
        year_norm = (year - min_year) / (max_year - min_year) if max_year > min_year else 0.0
        # Use initial year price change for first forecast year
        if i == 1 and len(prices) > 1 and prices[-2] != 0:
            pct_change = (prices[-1] - prices[-2]) / prices[-2]
        elif len(pred_prices) > 1 and pred_prices[-2] != 0:
            pct_change = (last_price - pred_prices[-2]) / pred_prices[-2]
        elif len(prices) > 1 and prices[-2] != 0:
            pct_change = (last_price - prices[-2]) / prices[-2]
        else:
            pct_change = 0.05
        # Clamp pct_change to [-0.2, 0.2]
        pct_change = max(0.05, min(0.2, pct_change))
        features = np.array([
            [year_norm, weighted_score, zone_index, pct_change]
        ])
        logging.debug(f"Forecast year={year}, features={features.tolist()}, pct_change={pct_change}")
        if model:
            log_pred = model.predict(features).tolist()[0]
            pred = float(np.expm1(log_pred))
        else:
            pred = (last_price) * (1 + pct_change*.5+weighted_score)
        last_price = pred
        pred_prices.append(pred)
        forecasts.append({"year": str(year), "price": pred})
    return {"forecast": forecasts}
