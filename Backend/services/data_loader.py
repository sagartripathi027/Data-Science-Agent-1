import pandas as pd
import os

DATASET_PATH = "datasets"

def load_dataset():
    files = os.listdir(DATASET_PATH)
    
    if not files:
        return None
    
    file_path = os.path.join(DATASET_PATH, files[0])
    df = pd.read_csv(file_path)
    
    return df