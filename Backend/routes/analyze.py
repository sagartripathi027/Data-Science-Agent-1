from fastapi import APIRouter
from services.data_loader import load_dataset
from services.eda_engine import run_eda

router = APIRouter()

@router.get("/analyze")
def analyze_dataset():
    data = load_dataset()
    results = run_eda(data)
    return {
        "summary": results
    }