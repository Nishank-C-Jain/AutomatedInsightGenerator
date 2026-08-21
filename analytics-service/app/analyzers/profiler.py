import pandas as pd
import numpy as np


def load_dataset(file_path: str):
    if file_path.lower().endswith(".csv"):
        return pd.read_csv(file_path)

    if file_path.lower().endswith((".xlsx", ".xls")):
        return pd.read_excel(file_path)

    raise ValueError("Unsupported file format")


def profile_dataset(file_path: str):

    df = load_dataset(file_path)

    rows, columns = df.shape

    profile = {
        "row_count": rows,
        "column_count": columns,
        "columns": []
    }

    for column in df.columns:

        series = df[column]

        missing_count = int(series.isna().sum())

        missing_percentage = (
            missing_count / rows * 100
            if rows > 0
            else 0
        )

        unique_count = int(series.nunique(dropna=True))

        column_info = {
            "name": str(column),
            "dtype": str(series.dtype),
            "missing_count": missing_count,
            "missing_percentage": round(
                missing_percentage, 2
            ),
            "unique_count": unique_count
        }

        if pd.api.types.is_numeric_dtype(series):

            column_info["statistics"] = {
                "min": safe_number(series.min()),
                "max": safe_number(series.max()),
                "mean": safe_number(series.mean()),
                "median": safe_number(series.median()),
                "std": safe_number(series.std())
            }

        profile["columns"].append(column_info)

    return profile


def safe_number(value):

    if pd.isna(value):
        return None

    if isinstance(value, np.generic):
        return value.item()

    return value