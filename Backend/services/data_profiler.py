import pandas as pd

class DataProfiler:

    def profile_dataset(self, df: pd.DataFrame):

        rows = df.shape[0]
        columns = df.shape[1]

        missing_values = df.isnull().sum().to_dict()

        numeric_columns = df.select_dtypes(include=["number"]).columns.tolist()

        categorical_columns = df.select_dtypes(include=["object"]).columns.tolist()

        return {
            "rows": rows,
            "columns": columns,
            "missing_values": missing_values,
            "numeric_columns": numeric_columns,
            "categorical_columns": categorical_columns
        }