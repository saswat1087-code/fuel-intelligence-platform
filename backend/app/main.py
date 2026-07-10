from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import json
from datetime import datetime
from typing import List, Dict, Any
import logging
from .models import FuelDataInput, APIResponse, PredictionResult
from .feature_engineer import FeatureEngineer
from .predictors import FuelIntelligencePredictor
from .config import config

# Configure logging
logging.basicConfig(level=config.LOG_LEVEL)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title=config.API_TITLE,
    description=config.API_DESCRIPTION,
    version=config.API_VERSION
)

# ✅ UPDATED CORS middleware - Allow all origins for testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://fuel-intelligence-platform-production.up.railway.app",
        "https://fuel-intelligence-platform.up.railway.app",
        "https://triumphant-strength-production.up.railway.app",
        "http://localhost:3000",
        "http://localhost:8000",
        "*"  # Allow all origins (for testing - can be restricted later)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
predictor = FuelIntelligencePredictor(config.MODEL_DIR)
feature_engineer = FeatureEngineer(config.MODEL_DIR)

# In-memory storage (replace with database in production)
DATA_STORE: List[Dict[str, Any]] = []

@app.on_event("startup")
async def startup_event():
    """Load models on startup if they exist"""
    try:
        predictor.load_models()
        logger.info("Models loaded successfully on startup")
    except Exception as e:
        logger.warning(f"No pre-trained models found: {e}")

@app.post("/api/v1/ingest", response_model=APIResponse)
async def ingest_data(data: FuelDataInput):
    """Ingest fuel and OBD data with manual injection"""
    try:
        # Convert to dict and flatten
        record = data.model_dump()
        
        # Flatten nested structures for storage
        flat_record = {}
        for key, value in record.items():
            if isinstance(value, dict):
                for sub_key, sub_value in value.items():
                    flat_record[sub_key] = sub_value
            else:
                flat_record[key] = value
        
        # Store for training
        DATA_STORE.append(flat_record)
        logger.info(f"Data ingested. Total records: {len(DATA_STORE)}")
        
        # Get prediction
        try:
            result = predictor.predict(flat_record)
            return APIResponse(
                status="success",
                prediction=result,
                message="Analysis complete"
            )
        except ValueError as e:
            # Models not trained, return raw data
            logger.warning(f"Prediction failed: {e}")
            return APIResponse(
                status="partial",
                message="Models not trained. Data stored for training.",
                data={"records_stored": len(DATA_STORE)}
            )
            
    except Exception as e:
        logger.error(f"Error processing data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/train", response_model=APIResponse)
async def train_models(background_tasks: BackgroundTasks):
    """Train models on stored data"""
    if len(DATA_STORE) < config.MIN_TRAINING_SAMPLES:
        raise HTTPException(
            status_code=400,
            detail=f"Need at least {config.MIN_TRAINING_SAMPLES} records with ground truth for training. Currently have {len(DATA_STORE)}"
        )
    
    # Verify ground truth exists
    df = pd.DataFrame(DATA_STORE)
    required_truth = ['ground_truth_mileage_loss', 'ground_truth_deposit_mg_per_100km', 'ground_truth_pump_wear_score']
    missing = [col for col in required_truth if col not in df.columns]
    
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing ground truth columns: {missing}"
        )
    
    # Train in background
    def train_task():
        try:
            # Prepare data
            training_df = predictor.create_training_data(DATA_STORE)
            
            # Train all models
            metrics = predictor.train_all_models(training_df)
            logger.info(f"Models trained successfully: {metrics}")
        except Exception as e:
            logger.error(f"Training failed: {e}")
            raise
    
    background_tasks.add_task(train_task)
    
    return APIResponse(
        status="success",
        message="Training started in background",
        data={"total_records": len(DATA_STORE)}
    )

@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "records_stored": len(DATA_STORE),
        "models_trained": predictor.is_trained,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/v1/export")
async def export_training_data():
    """Export stored data for analysis"""
    return {
        "total_records": len(DATA_STORE),
        "records": DATA_STORE
    }

@app.delete("/api/v1/data")
async def clear_data():
    """Clear stored data (for testing)"""
    DATA_STORE.clear()
    return {"status": "success", "message": "Data cleared"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
