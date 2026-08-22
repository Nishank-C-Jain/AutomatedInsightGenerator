from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from app.analyzers.profiler import profile_dataset


app = FastAPI(
    title="Automated Insights Analytics Engine"
)

from app.routes.analysis import router as analysis_router
app.include_router(analysis_router, prefix="/api", tags=["analysis"])


class ProfileRequest(BaseModel):
    file_path: str


@app.get("/health")
def health():
    return {
        "success": True,
        "message": "Analytics engine is running"
    }


@app.post("/profile")
def create_profile(request: ProfileRequest):

    try:

        result = profile_dataset(
            request.file_path
        )

        return {
            "success": True,
            "profile": result
        }

    except Exception as error:

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )
