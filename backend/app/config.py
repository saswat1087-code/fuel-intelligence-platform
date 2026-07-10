import os
from dotenv import load_dotenv
from typing import Optional

load_dotenv()

class Config:
    # API Settings
    API_VERSION = "v1"
    API_TITLE = "Fuel Intelligence Platform"
    API_DESCRIPTION = "AI-Powered Fuel Quality and Engine Health Prediction System"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./fuel_intelligence.db")
    
    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    # Model Settings
    MODEL_DIR: str = os.getenv("MODEL_DIR", "./models")
    MIN_TRAINING_SAMPLES: int = int(os.getenv("MIN_TRAINING_SAMPLES", "10"))
    
    # CORS
    ALLOWED_ORIGINS: list = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    # Features for ML models
    FEATURE_COLUMNS = [
        'ethanol_percent', 'water_ppm', 'fuel_temp_celsius',
        'fuel_quality_score', 'fuel_trim_deviation', 'knock_severity',
        'injector_duty_cycle', 'fuel_pressure_deviation',
        'efficiency_ratio', 'lambda_deviation', 'stoich_afr_estimate',
        'avg_speed_kmh', 'engine_rpm', 'road_type_encoded'
    ]

config = Config()
