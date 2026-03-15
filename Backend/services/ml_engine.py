import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import accuracy_score, mean_squared_error


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

            return {
                "problem_type": "classification",
                "accuracy": score
            }

        else:
            model = RandomForestRegressor()
            model.fit(X_train, y_train)

            preds = model.predict(X_test)

            mse = mean_squared_error(y_test, preds)

            return {
                "problem_type": "regression",
                "mse": mse
            }