import io
import json
import os

import pandas as pd
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional

from app.analyzers.profiler import load_dataset
from app.services.analysis_services import analyze_dataset

# DB persistence is optional — service still works without psycopg2
try:
    from app.utils.db import get_connection, put_connection
    _DB_AVAILABLE = True
except Exception:
    _DB_AVAILABLE = False

router = APIRouter()


# ------------------------------------------------------------------ #
# Request schemas                                                      #
# ------------------------------------------------------------------ #

class AnalysisPathRequest(BaseModel):
    """Body schema for JSON-based (server-side file path) requests."""
    file_path: str
    dataset_id: Optional[str] = None   # UUID of the datasets row to update


# ------------------------------------------------------------------ #
# POST /api/analysis  — multipart file upload                         #
# ------------------------------------------------------------------ #

@router.post("/analysis")
async def run_analysis_upload(
    file: UploadFile = File(...),
    dataset_id: Optional[str] = Form(default=None),
):
    """
    Upload a CSV / Excel file, run all 9 analyzers, persist the result
    to `datasets.analysis_results` (JSONB), and return the full result.

    **Form fields**
    - `file`        — the dataset file (.csv / .xlsx / .xls)
    - `dataset_id`  — *(optional)* UUID of an existing `datasets` row;
                      when provided the analysis result is saved there.
    """
    filename = file.filename or ""
    ext = os.path.splitext(filename)[-1].lower()

    if ext not in {".csv", ".xlsx", ".xls"}:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{ext}'. Only .csv, .xlsx, and .xls are accepted.",
        )

    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents)) if ext == ".csv" else pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {e}")

    return _run_and_respond(df, dataset_id=dataset_id)


# ------------------------------------------------------------------ #
# POST /api/analysis/path — server-side file reference (JSON body)    #
# ------------------------------------------------------------------ #

@router.post("/analysis/path")
def run_analysis_path(request: AnalysisPathRequest):
    """
    Run all analyzers on a file already on the server's filesystem.

    **JSON body**
    - `file_path`   — absolute path to a .csv / .xlsx / .xls file
    - `dataset_id`  — *(optional)* UUID of an existing `datasets` row
    """
    if not os.path.isfile(request.file_path):
        raise HTTPException(
            status_code=404,
            detail=f"File not found: {request.file_path}",
        )

    try:
        df = load_dataset(request.file_path)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load file: {e}")

    return _run_and_respond(df, dataset_id=request.dataset_id)


# ------------------------------------------------------------------ #
# Shared orchestration helper                                          #
# ------------------------------------------------------------------ #

def _run_and_respond(df: pd.DataFrame, dataset_id: Optional[str]) -> JSONResponse:
    """
    1. Validate the DataFrame.
    2. Run all analyzers via analyze_dataset().
    3. If dataset_id is provided, persist the result to datasets.analysis_results.
    4. Return the standard JSON envelope.
    """
    if df.empty:
        raise HTTPException(status_code=422, detail="The uploaded file is empty.")

    # --- Run analyzers ---
    try:
        results = analyze_dataset(df)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {e}")

    # --- Persist to DB (non-fatal) ---
    db_warning: Optional[str] = None
    saved_to_db: bool = False

    if dataset_id:
        try:
            _save_to_db(dataset_id, results, row_count=len(df), col_count=len(df.columns))
            saved_to_db = True
        except Exception as e:
            # Don't fail the whole request; surface a warning instead
            db_warning = f"Analysis completed but DB save failed: {e}"

    # --- Build response ---
    body = {
        "success": True,
        "row_count": len(df),
        "column_count": len(df.columns),
        "saved_to_db": saved_to_db,
        "analysis": results,
    }

    if db_warning:
        body["warning"] = db_warning

    if dataset_id:
        body["dataset_id"] = dataset_id

    return JSONResponse(status_code=200, content=body)


# ------------------------------------------------------------------ #
# DB persistence                                                       #
# ------------------------------------------------------------------ #

def _save_to_db(dataset_id: str, results: dict, row_count: int, col_count: int) -> None:
    """
    UPDATE datasets SET
        analysis_results = <jsonb>,
        row_count        = <int>,
        column_count     = <int>,
        status           = 'analyzed',
        updated_at       = NOW()
    WHERE id = <uuid>;
    """
    if not _DB_AVAILABLE:
        raise RuntimeError("psycopg2 is not installed; cannot persist to DB.")

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE datasets
                SET
                    analysis_results = %s::jsonb,
                    row_count        = %s,
                    column_count     = %s,
                    status           = 'analyzed',
                    updated_at       = NOW()
                WHERE id = %s::uuid
                """,
                (json.dumps(results), row_count, col_count, dataset_id),
            )
            if cur.rowcount == 0:
                raise ValueError(f"No dataset found with id '{dataset_id}'")
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        put_connection(conn)


