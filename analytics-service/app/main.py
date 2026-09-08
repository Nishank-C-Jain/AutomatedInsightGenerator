import io
import os
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from pydantic import BaseModel

import pandas as pd

# Load analytics-service's own .env first (GEMINI_API_KEY, GEMINI_MODEL, etc.)
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../.env"))
# Then load backend .env as fallback for DB credentials
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../../backend/.env"))

from app.analyzers.profiler import profile_dataset
from app.services.analysis_services import analyze_dataset


app = FastAPI(
    title="Automated Insights Analytics Engine",
    description="Upload a CSV to get a full automated analysis across 9 analyzers.",
    version="1.0.0",
)

# ── existing router (multipart + path + DB persistence) ──────────────────── #
from app.routes.analysis import router as analysis_router
app.include_router(analysis_router, prefix="/api", tags=["analysis"])

# ── dataset-specific AI chat ──────────────────────────────────────────────── #
from app.routes.chat import router as chat_router
app.include_router(chat_router, prefix="/api", tags=["chat"])

# ── dataset preview (rows + column metadata) ──────────────────────────────── #
from app.routes.preview import router as preview_router
app.include_router(preview_router, prefix="/api", tags=["preview"])



# ── simple CSV-upload endpoint (no DB, beginner-friendly) ────────────────── #

@app.post("/analysis/", tags=["analysis"])
async def analyze_csv(file: UploadFile = File(...)):
    """
    Upload a CSV file and receive the complete combined analysis.

    **Steps performed internally:**
    1. Validate the file is a CSV.
    2. Parse into a Pandas DataFrame.
    3. Run all 9 analyzers via `analyze_dataset()`.
    4. Return the unified result.

    **Response keys inside `result`:**
    `data_quality`, `statistics`, `correlations`, `kpis`,
    `trends`, `forecasting`, `anomalies`, `insights`, `recommendations`
    """
    # 1. Validate file was provided
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file provided.")

    # 2. Validate CSV extension
    filename = file.filename
    if not filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are supported. Please upload a .csv file.",
        )

    # 3. Parse CSV into DataFrame
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to parse CSV file: {e}",
        )

    # 4. Validate not empty
    if df.empty:
        raise HTTPException(status_code=400, detail="The uploaded CSV file is empty.")

    # 5. Run all analyzers
    try:
        result = analyze_dataset(df)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Analysis failed. Please check the file and try again.",
        )

    # 6. Return combined result
    return {
        "success": True,
        "filename": filename,
        "result": result,
    }


# ── health check ─────────────────────────────────────────────────────────── #

@app.get("/health", tags=["health"])
def health():
    return {
        "success": True,
        "message": "Analytics engine is running",
    }


# ── legacy profile endpoint (file-path based) ─────────────────────────────── #

class ProfileRequest(BaseModel):
    file_path: str


@app.post("/profile", tags=["profile"])
def create_profile(request: ProfileRequest):
    try:
        result = profile_dataset(request.file_path)
        return {"success": True, "profile": result}
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error))

