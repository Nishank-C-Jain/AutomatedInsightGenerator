"""
Preview route — GET /api/preview
Returns the first N rows of a dataset file plus per-column metadata.
"""
import os
import io

import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse

router = APIRouter()

# Maximum rows to return regardless of what the caller asks for
_MAX_ROWS = 100


def _dtype_label(series: pd.Series) -> str:
    """Map a pandas dtype to a human-readable type label."""
    dtype = series.dtype
    if pd.api.types.is_bool_dtype(dtype):
        return "boolean"
    if pd.api.types.is_integer_dtype(dtype):
        return "integer"
    if pd.api.types.is_float_dtype(dtype):
        return "float"
    if pd.api.types.is_datetime64_any_dtype(dtype):
        return "datetime"
    # Try to sniff datetime from object columns
    if dtype == object:
        sample = series.dropna().head(20)
        if not sample.empty:
            try:
                converted = pd.to_datetime(sample, format="mixed", errors="coerce")
                if converted.notna().mean() >= 0.8:
                    return "datetime"
            except Exception:
                pass
        return "text"
    return str(dtype)


@router.get("/preview")
def preview_dataset(
    file_path: str = Query(..., description="Absolute path to the dataset file"),
    limit: int = Query(50, ge=1, le=_MAX_ROWS, description="Number of rows to return (max 100)"),
):
    """
    Read a CSV/Excel file from the filesystem and return:
    - `rows`    — first `limit` rows as a list of dicts
    - `columns` — per-column metadata (name, type, missing_count, missing_pct)
    - `total_rows`   — total row count of the file
    - `total_cols`   — total column count
    """
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail=f"File not found: {file_path}")

    ext = os.path.splitext(file_path)[-1].lower()
    if ext not in {".csv", ".xlsx", ".xls"}:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{ext}'. Only .csv, .xlsx, and .xls are accepted.",
        )

    try:
        if ext == ".csv":
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {e}")

    total_rows, total_cols = df.shape

    # Build column metadata
    columns_meta = []
    for col in df.columns:
        series = df[col]
        missing_count = int(series.isna().sum())
        missing_pct = round((missing_count / total_rows * 100) if total_rows > 0 else 0, 1)
        columns_meta.append({
            "name": col,
            "type": _dtype_label(series),
            "missing_count": missing_count,
            "missing_pct": missing_pct,
        })

    # Slice preview rows and serialize safely
    preview_df = df.head(limit).copy()

    # Replace NaN/inf with None so JSON serialization works
    preview_df = preview_df.where(pd.notnull(preview_df), None)

    # Convert numpy types to native Python types
    rows = []
    for record in preview_df.to_dict(orient="records"):
        clean = {}
        for k, v in record.items():
            if isinstance(v, (np.integer,)):
                clean[k] = int(v)
            elif isinstance(v, (np.floating,)):
                clean[k] = None if np.isnan(v) else float(v)
            elif isinstance(v, (np.bool_,)):
                clean[k] = bool(v)
            elif isinstance(v, pd.Timestamp):
                clean[k] = v.isoformat()
            else:
                clean[k] = v
        rows.append(clean)

    return JSONResponse(content={
        "success": True,
        "total_rows": total_rows,
        "total_cols": total_cols,
        "preview_row_count": len(rows),
        "columns": columns_meta,
        "rows": rows,
    })
