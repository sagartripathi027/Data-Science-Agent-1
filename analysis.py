# analysis.py - Analyze a Pandas DataFrame and return a formatted report

import pandas as pd
import numpy as np


# ─────────────────────────────────────────────
# SECTION 1: DATASET OVERVIEW
# ─────────────────────────────────────────────

def get_shape_info(df):
    """Return number of rows and columns as a string."""
    rows, cols = df.shape
    return f"Rows: {rows}\nColumns: {cols}"


def get_dtype_info(df):
    """Return column names and their data types."""
    lines = ["Column Name          | Data Type"]
    lines.append("-" * 35)
    for col, dtype in df.dtypes.items():
        lines.append(f"{str(col):<21}| {dtype}")
    return "\n".join(lines)


def get_missing_info(df):
    """Return count and percentage of missing values per column."""
    total = len(df)
    lines = ["Column Name          | Missing | Percent"]
    lines.append("-" * 45)
    for col in df.columns:
        missing = df[col].isna().sum()
        percent = (missing / total * 100) if total > 0 else 0
        lines.append(f"{str(col):<21}| {missing:<8}| {percent:.2f}%")
    return "\n".join(lines)


# ─────────────────────────────────────────────
# SECTION 2: DATA CLEANING
# ─────────────────────────────────────────────

def remove_duplicates(df):
    """
    Detect and remove duplicate rows.
    Returns the cleaned DataFrame and a summary string.
    """
    original_count = len(df)
    df = df.drop_duplicates()
    removed = original_count - len(df)

    if removed == 0:
        return df, "  No duplicate rows found."
    return df, f"  Removed {removed} duplicate row(s). Remaining rows: {len(df)}"


def handle_missing_values(df):
    """
    Fill missing values:
    - Numeric columns    → fill with column mean
    - Non-numeric columns → fill with 'Unknown'
    Returns the cleaned DataFrame and a summary of changes.
    """
    changes = []
    df = df.copy()

    for col in df.columns:
        missing_count = df[col].isna().sum()
        if missing_count == 0:
            continue

        if pd.api.types.is_numeric_dtype(df[col]):
            fill_value = df[col].mean()
            df[col] = df[col].fillna(fill_value)
            changes.append(
                f"  '{col}': filled {missing_count} value(s) with mean ({fill_value:.2f})"
            )
        else:
            df[col] = df[col].fillna("Unknown")
            changes.append(f"  '{col}': filled {missing_count} value(s) with 'Unknown'")

    if not changes:
        return df, "  No missing values found — nothing to fill."
    return df, "\n".join(changes)


# ─────────────────────────────────────────────
# SECTION 3: DATA PREPROCESSING
# ─────────────────────────────────────────────
def preprocess_data(df):
    """
    Light preprocessing steps:
    - Strip whitespace from string columns
    - Normalize column names
    - Convert obvious date columns safely
    - Remove extra spaces inside text
    """

    changes = []
    df = df.copy()

    # ── Normalize column names ─────────────────────
    original_cols = list(df.columns)

    df.columns = (
        df.columns.str.strip()
        .str.lower()
        .str.replace(r"[\s\-]+", "_", regex=True)
        .str.replace(r"[^\w]", "", regex=True)
    )

    renamed = [
        f"  '{old}' → '{new}'"
        for old, new in zip(original_cols, df.columns)
        if old != new
    ]

    if renamed:
        changes.append("  Column names normalized:")
        changes.extend(renamed)
    else:
        changes.append("  Column names already clean.")

    # ── Clean string columns ───────────────────────
    str_cols = df.select_dtypes(include="object").columns

    for col in str_cols:

        # Convert to string safely
        df[col] = df[col].astype(str)

        # Remove leading/trailing spaces
        df[col] = df[col].str.strip()

        # Remove multiple spaces
        df[col] = df[col].str.replace(r"\s+", " ", regex=True)

    if len(str_cols):
        changes.append(
            f"  Cleaned whitespace in {len(str_cols)} text column(s)."
        )

    # ── Safe datetime parsing ──────────────────────
    parsed_dates = []

    for col in str_cols:

        col_lower = col.lower()

        # Convert only likely date/year columns
        if any(keyword in col_lower for keyword in ["date", "year", "time"]):

            try:
                converted = pd.to_datetime(
                    df[col],
                    errors="coerce"
                )

                # Only accept conversion if enough valid dates exist
                valid_ratio = converted.notna().mean()

                if valid_ratio > 0.7:
                    df[col] = converted
                    parsed_dates.append(col)

            except Exception:
                pass

    if parsed_dates:
        changes.append(
            f"  Parsed datetime columns: {', '.join(parsed_dates)}"
        )
    else:
        changes.append("  No datetime columns detected.")

    return df, "\n".join(changes)

# ─────────────────────────────────────────────
# SECTION 4: EDA — CATEGORICAL ANALYSIS
# ─────────────────────────────────────────────

def get_categorical_analysis(df, top_n=5):
    """
    For each non-numeric column, show:
    - Number of unique values
    - Top N most frequent values with counts and percentages
    """
    cat_cols = df.select_dtypes(exclude=[np.number]).columns

    if len(cat_cols) == 0:
        return "  No categorical columns found."

    total = len(df)
    lines = []

    for col in cat_cols:
        unique = df[col].nunique()
        lines.append(f"\n  [{col}]  —  {unique} unique value(s)")
        top = df[col].value_counts().head(top_n)
        for val, count in top.items():
            pct = count / total * 100
            lines.append(f"    {str(val):<30} {count:>5}  ({pct:.1f}%)")

    return "\n".join(lines)


# ─────────────────────────────────────────────
# SECTION 5: STATISTICAL ANALYSIS
# ─────────────────────────────────────────────

def get_summary_statistics(df):
    """Return summary statistics for numeric columns only."""
    numeric_df = df.select_dtypes(include=[np.number])

    if numeric_df.empty:
        return "  No numeric columns found for statistics."

    stats = numeric_df.describe().T
    stats["range"] = stats["max"] - stats["min"]

    lines = []
    for col, row in stats.iterrows():
        lines.append(f"\n  [{col}]")
        lines.append(f"    Count : {row['count']:.0f}")
        lines.append(f"    Mean  : {row['mean']:.4f}")
        lines.append(f"    Std   : {row['std']:.4f}")
        lines.append(f"    Min   : {row['min']:.4f}")
        lines.append(f"    25%   : {row['25%']:.4f}")
        lines.append(f"    Median: {row['50%']:.4f}")
        lines.append(f"    75%   : {row['75%']:.4f}")
        lines.append(f"    Max   : {row['max']:.4f}")
        lines.append(f"    Range : {row['range']:.4f}")

    return "\n".join(lines)


def detect_outliers(df):
    """
    Detect outliers in numeric columns using the IQR method.
    A value is an outlier if it falls below Q1 - 1.5*IQR
    or above Q3 + 1.5*IQR.
    """
    numeric_df = df.select_dtypes(include=[np.number])

    if numeric_df.empty:
        return "  No numeric columns found for outlier detection."

    lines = []
    for col in numeric_df.columns:
        q1 = numeric_df[col].quantile(0.25)
        q3 = numeric_df[col].quantile(0.75)
        iqr = q3 - q1
        lower = q1 - 1.5 * iqr
        upper = q3 + 1.5 * iqr
        outlier_mask = (numeric_df[col] < lower) | (numeric_df[col] > upper)
        count = outlier_mask.sum()

        lines.append(f"\n  [{col}]")
        lines.append(f"    IQR range : [{lower:.4f}, {upper:.4f}]")
        if count == 0:
            lines.append("    Outliers  : None detected")
        else:
            pct = count / len(df) * 100
            lines.append(f"    Outliers  : {count} value(s)  ({pct:.1f}% of rows)")

    return "\n".join(lines)


# ─────────────────────────────────────────────
# SECTION 6: CORRELATION ANALYSIS
# ─────────────────────────────────────────────

def get_correlation_matrix(df):
    """Return a correlation matrix for numeric columns."""
    numeric_df = df.select_dtypes(include=[np.number])

    if numeric_df.shape[1] < 2:
        return "  Need at least 2 numeric columns for correlation."

    corr = numeric_df.corr().round(2)
    return corr.to_string()


# ─────────────────────────────────────────────
# SECTION 7: FINAL INSIGHTS
# ─────────────────────────────────────────────

def generate_insights(df):
    """
    Auto-generate plain-English insights by scanning:
    - High correlations between numeric columns (|r| > 0.7)
    - Columns with heavy missing data (> 30%)
    - Columns with very low cardinality (possible flags/categories)
    - Constant columns (only 1 unique value — likely useless)
    """
    insights = []
    total_rows = max(len(df), 1)

    # 1. Constant columns
    for col in df.columns:
        if df[col].nunique() <= 1:
            insights.append(f"  ⚠  '{col}' has only 1 unique value — consider dropping it.")

    # 2. Heavy missing data
    for col in df.columns:
        missing_pct = df[col].isna().mean() * 100
        if missing_pct > 30:
            insights.append(
                f"  ⚠  '{col}' is {missing_pct:.1f}% missing — imputation may introduce bias."
            )

    # 3. Low-cardinality object columns (might be better as categories)
    for col in df.select_dtypes(include="object").columns:
        unique = df[col].nunique()
        if 1 < unique <= 10:
            insights.append(
                f"  💡 '{col}' has {unique} unique values — consider encoding as a category."
            )

    # 4. High correlations
    numeric_df = df.select_dtypes(include=[np.number])
    if numeric_df.shape[1] >= 2:
        corr = numeric_df.corr(numeric_only=True).abs()
        upper = corr.where(np.triu(np.ones(corr.shape), k=1).astype(bool))
        high_corr = [
            (col, row, corr.loc[row, col])
            for col in upper.columns
            for row in upper.index
            if pd.notna(upper.loc[row, col]) and upper.loc[row, col] > 0.7
        ]
        for c1, c2, r in high_corr:
            insights.append(
                f"  📈 '{c1}' and '{c2}' are highly correlated (r = {r:.2f}) — "
                f"watch for multicollinearity if modelling."
            )

    if not insights:
        insights.append("  ✅ No major data quality issues detected.")

    return "\n".join(insights)


# ─────────────────────────────────────────────
# MAIN PIPELINE
# ─────────────────────────────────────────────

def analyze_data(df):
    """
    Run a full professional DS pipeline on a Pandas DataFrame
    and return a formatted string report.

    Pipeline:
      1. Dataset Overview  (shape, dtypes, missing values)
      2. Data Cleaning     (duplicates, missing value handling)
      3. Data Preprocessing (column names, whitespace, date parsing)
      4. EDA               (categorical analysis)
      5. Statistical Analysis (summary stats + outlier detection)
      6. Correlation Analysis
      7. Final Insights
    """
    separator = "\n" + "=" * 50 + "\n"
    report = []

    report.append("=" * 50)
    report.append("        CSV DATA ANALYSIS REPORT")
    report.append("=" * 50)

    # ── 1. DATASET OVERVIEW ──────────────────────────
    report.append("\n📋 DATASET OVERVIEW")
    report.append(get_shape_info(df))
    report.append("\n" + get_dtype_info(df))
    report.append(separator + "❓ MISSING VALUES (before cleaning)")
    report.append(get_missing_info(df))

    # ── 2. DATA CLEANING ─────────────────────────────
    report.append(separator + "🧹 DATA CLEANING")

    df, dup_summary = remove_duplicates(df)
    report.append("  Duplicates:")
    report.append(dup_summary)

    report.append("\n  Missing Values:")
    df, fill_summary = handle_missing_values(df)
    report.append(fill_summary)

    # ── 3. DATA PREPROCESSING ────────────────────────
    report.append(separator + "⚙️  DATA PREPROCESSING")
    df, preprocess_summary = preprocess_data(df)
    report.append(preprocess_summary)

    # ── 4. EDA — CATEGORICAL ANALYSIS ────────────────
    report.append(separator + "🗂️  CATEGORICAL ANALYSIS")
    report.append(get_categorical_analysis(df))

    # ── 5. STATISTICAL ANALYSIS ──────────────────────
    report.append(separator + "📊 SUMMARY STATISTICS")
    report.append(get_summary_statistics(df))

    report.append(separator + "🔍 OUTLIER DETECTION  (IQR method)")
    report.append(detect_outliers(df))

    # ── 6. CORRELATION ANALYSIS ──────────────────────
    report.append(separator + "🔗 CORRELATION MATRIX")
    report.append(get_correlation_matrix(df))

    # ── 7. FINAL INSIGHTS ────────────────────────────
    report.append(separator + "💡 FINAL INSIGHTS")
    report.append(generate_insights(df))

    report.append("\n" + "=" * 50)

    return "\n".join(report)