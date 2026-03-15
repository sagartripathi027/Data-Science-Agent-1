class DataScienceAgent:

    def decide_task(self, query: str):

        query = query.lower()

        if "correlation" in query:
            return "eda_correlation"

        elif "missing values" in query:
            return "check_missing"

        elif "train model" in query:
            return "train_model"

        elif "predict" in query:
            return "predict"

        else:
            return "general_analysis"