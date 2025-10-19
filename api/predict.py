# api/predict.py
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import logging
import pandas as pd
import numpy as np
import os

# ------------------------------
# FastAPI + CORS
# ------------------------------
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------
# Load model and data at cold start
# ------------------------------
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")
CSV_PATH = os.path.join(os.path.dirname(__file__), "weighted.csv")

try:
    model = joblib.load(MODEL_PATH)
except Exception as e:
    model = None
    logging.error(f"Model failed to load: {e}")

try:
    weighted_df = pd.read_csv(CSV_PATH)
except Exception as e:
    weighted_df = pd.DataFrame()
    logging.error(f"CSV failed to load: {e}")

# ------------------------------
# Pydantic schema
# ------------------------------
class PredictionRequest(BaseModel):
    zone_index: int
    area: str
    rooms_en: str
    amenities_counter: dict
    actual_price: dict | None = None
    predict_price: dict | None = None


# ------------------------------
# Predict Endpoint
# ------------------------------
@app.post("/predict")
async def predict(req: PredictionRequest):
    try:
        forecasts = []
        zone_index = req.zone_index
        actual_price = req.actual_price or {}
        predict_price = req.predict_price or {}

        years = [int(y) for y in actual_price.keys() if str(y).isdigit()]
        prices = [float(actual_price[str(y)]) for y in years]
        pred_years = [int(y) for y in predict_price.keys() if str(y).isdigit()]
        pred_prices = [float(predict_price[str(y)]) for y in pred_years]

        if pred_years and pred_prices:
            last_year, last_price = max(pred_years), pred_prices[-1]
        elif years and prices:
            last_year, last_price = max(years), prices[-1]
        else:
            last_year, last_price = 2024, 1_000_000

        forecasts.append({"year": str(last_year), "price": last_price})

        # Amenity weights
        amenity_weights = {
            "hospital": 0.07, "metro": 0.09, "school": 0.08, "university": 0.06,
            "park": 0.075, "office": 0.065, "poi": 0.05,
            "landfill": -0.06, "prison": -0.05, "highway": -0.04,
            "bar": -0.03, "cemetery": -0.02
        }

        amenities_sum = sum(req.amenities_counter.values()) if req.amenities_counter else 0
        area, rooms, zone = req.area.strip(), req.rooms_en.strip(), req.zone_index

        df = weighted_df.drop(columns=["Unnamed: 0"]) if "Unnamed: 0" in weighted_df.columns else weighted_df
        match = df[(df["area_name_en"] == area) & (df["zone_index"] == zone) & (df["rooms_en"] == rooms)]

        original_weighted_score = float(match.iloc[0]["weighted_score"]) if not match.empty else 0.0

        amenity_adjustment = sum(
            0.1 * v * amenity_weights[k.lower()]
            for k, v in req.amenities_counter.items()
            if k.lower() in amenity_weights
        )

        weighted_score = np.clip(original_weighted_score + amenity_adjustment, 0.0, 1.0)

        # Forecast next 5 years
        for i in range(1, 6):
            year = last_year + i
            pct_change = 0.05
            features = np.array([[year / 2030, weighted_score, zone_index, pct_change]])
            if model is not None:
                log_pred = model.predict(features).tolist()[0]
                pred = float(np.expm1(log_pred))
            else:
                pred = last_price * (1 + pct_change * 0.5 + weighted_score)
            last_price = pred
            forecasts.append({"year": str(year), "price": pred})

        return {"forecast": forecasts}
    except Exception as e:
        logging.exception("Error in /predict")
        return {"error": str(e)}
