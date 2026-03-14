from fastapi import FastAPI, UploadFile, File
import pandas as pd

app = FastAPI()

@app.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):

    filename = file.filename

    if filename.endswith(".csv"):
        df = pd.read_csv(file.file)

    elif filename.endswith(".xlsx"):
        df = pd.read_excel(file.file)

    else:
        return {"error": "Unsupported file type"}

    return {
        "rows": df.shape[0],
        "columns": df.shape[1],
        "column_names": list(df.columns)
    }