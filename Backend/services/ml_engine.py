import pandas as pd
import os
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import accuracy_score, mean_squared_error

MODEL_PATH = "storage/model.pkl"


class MLEngine:

    def train_model(self, df: pd.DataFrame, target_column: str):

        X = df.drop(columns=[target_column])
        y = df[target_column]

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        # detect problem type
        if y.dtype == "object":

            model = RandomForestClassifier()
            model.fit(X_train, y_train)

            preds = model.predict(X_test)

            score = accuracy_score(y_test, preds)

            problem_type = "classification"

            metrics = {"accuracy": score}

        else:

            model = RandomForestRegressor()
            model.fit(X_train, y_train)

            preds = model.predict(X_test)

            mse = mean_squared_error(y_test, preds)

            problem_type = "regression"

            metrics = {"mse": mse}

        # save model
        os.makedirs("storage", exist_ok=True)
        joblib.dump(model, MODEL_PATH)

        return {
            "problem_type": problem_type,
            **metrics
        }


def load_model():

    if not os.path.exists(MODEL_PATH):
        raise Exception("Model not trained yet")

    return joblib.load(MODEL_PATH)


def predict(model, df):

    preds = model.predict(df)

    return preds.tolist()