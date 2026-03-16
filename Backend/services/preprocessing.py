import pandas as pd
from sklearn.preprocessing import LabelEncoder


class PreprocessingEngine:

    def clean_data(self, df: pd.DataFrame):

        # remove duplicate rows
        df = df.drop_duplicates()

        # fill numeric missing values
        numeric_cols = df.select_dtypes(include="number").columns
        df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].mean())

        # fill categorical missing values
        categorical_cols = df.select_dtypes(include="object").columns
        df[categorical_cols] = df[categorical_cols].fillna("Unknown")

        return df


    def encode_categorical(self, df: pd.DataFrame):

        categorical_cols = df.select_dtypes(include="object").columns

        encoders = {}

        for col in categorical_cols:
            le = LabelEncoder()
            df[col] = le.fit_transform(df[col])
            encoders[col] = le

        return df, encoders


    def preprocess(self, df: pd.DataFrame):

        df = self.clean_data(df)
        df, encoders = self.encode_categorical(df)

        return df, encoders