from fastapi import FastAPI, UploadFile, File
import pandas as pd

from services.data_profiler import DataProfiler
from services.eda_engine import EDAEngine
from services.ml_engine import MLEngine


# Create FastAPI app FIRST
app = FastAPI()

# Initialize services
profiler = DataProfiler()
eda = EDAEngine()
ml = MLEngine() 



@app.get("/")
def home():
    return {"message": "AI Data Science Agent running"}


@app.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):

    filename = file.filename.lower()
    

    if filename.endswith(".csv"):
        df = pd.read_csv(file.file)

    elif filename.endswith(".xlsx") or filename.endswith(".xls"):
        df = pd.read_excel(file.file)

    else:
        return {"error": "Unsupported file type"}

    # Replace NaN values so JSON can handle them
    df = df.where(pd.notnull(df), None)

    profile = profiler.profile_dataset(df)
    correlation = eda.correlation_analysis(df)
    distribution = eda.feature_distribution(df)
    outliers = eda.detect_outliers(df)

    return {
        "profile": profile,
        "correlation": correlation,
        "distribution": distribution,
        "outliers": outliers
    }
    
@app.post("/train")
async def train_model(target_column: str, file: UploadFile = File(...)):

    filename = file.filename.lower()

    if filename.endswith(".csv"):
        df = pd.read_csv(file.file)

    elif filename.endswith(".xlsx"):
        df = pd.read_excel(file.file)

    else:
        return {"error": "Unsupported file type"}

    result = ml.train_model(df, target_column)

    return result