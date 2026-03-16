from fastapi import APIRouter
import pandas as pd
from services.ml_engine import load_model, predict

router = APIRouter()

@router.post("/predict")
def predict_data(data: dict):
    model = load_model()
    df = pd.DataFrame([data])
    result = predict(model, df)
    return {"prediction": result}