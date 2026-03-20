import os
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import pandas as pd

from services.data_profiler import DataProfiler
from services.eda_engine import EDAEngine
from services.ml_engine import MLEngine
from routes.analyze import router as analyze_router
from routes.predict import router as predict_router

app = FastAPI()

# front-end folder (sibling to Backend)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "Frontend"))
if not os.path.isdir(FRONTEND_DIR):
    # fallback to backend/static
    FRONTEND_DIR = os.path.join(BASE_DIR, "static")

app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

@app.get("/", response_class=FileResponse)
def home():
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

# existing service initialization and routes
profiler = DataProfiler()
eda = EDAEngine()
ml = MLEngine()
app.include_router(analyze_router)
app.include_router(predict_router)

# your existing upload/train endpoints follow
# ...existing code...