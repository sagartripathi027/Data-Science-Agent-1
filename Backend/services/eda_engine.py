import pandas as pd

class EDAEngine:

    def basic_summary(self, df: pd.DataFrame):

        return {
            "rows": df.shape[0],
            "columns": df.shape[1],
            "missing_values": df.isnull().sum().to_dict(),
            "data_types": df.dtypes.astype(str).to_dict()
        }
        
    def correlation_analysis(self, df: pd.DataFrame):

        numeric_df = df.select_dtypes(include="number")

        correlation_matrix = numeric_df.corr()

        return correlation_matrix.to_dict()
    
    
    def feature_distribution(self, df: pd.DataFrame):

        numeric_columns = df.select_dtypes(include="number").columns.tolist()

        distribution = {}

        for col in numeric_columns:
            distribution[col] = {
            "mean": df[col].mean(),
            "median": df[col].median(),
            "std": df[col].std()
            }

        return distribution
    
    def detect_outliers(self, df: pd.DataFrame):

        numeric_df = df.select_dtypes(include="number")

        outliers = {}

        for col in numeric_df.columns:

            Q1 = numeric_df[col].quantile(0.25)
            Q3 = numeric_df[col].quantile(0.75)

            IQR = Q3 - Q1

            lower = Q1 - 1.5 * IQR
            upper = Q3 + 1.5 * IQR

            outliers[col] = numeric_df[
                (numeric_df[col] < lower) | (numeric_df[col] > upper)
            ].shape[0]

        return outliers