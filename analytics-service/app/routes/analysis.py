from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.analysis_services import analyze_dataset
from app.analyzers.profiler import load_dataset

router = APIRouter()

class AnalysisRequest(BaseModel):
    file_path: str

@router.post("/analyze")
def run_full_analysis(request: AnalysisRequest):
    """
    Runs the complete set of analyzers via the orchestrator on the given file.
    """
    try:
        # Load the dataset using the existing helper
        df = load_dataset(request.file_path)
        
        # Pass the DataFrame to the orchestrator
        results = analyze_dataset(df)
        
        return {
            "success": True,
            "analysis_results": results
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))
