from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from .config import config

Base = declarative_base()

class FuelRecord(Base):
    __tablename__ = "fuel_records"
    
    id = Column(Integer, primary_key=True, index=True)
    vehicle_make = Column(String)
    vehicle_model = Column(String)
    vehicle_year = Column(Integer)
    engine = Column(String)
    odometer_km = Column(Float)
    ethanol_percent = Column(Float)
    water_ppm = Column(Float)
    fuel_temp_celsius = Column(Float)
    short_term_fuel_trim = Column(Float)
    long_term_fuel_trim = Column(Float)
    knock_retard = Column(Float)
    misfire_count = Column(Integer)
    injector_pulse = Column(Float)
    fuel_pressure = Column(Float)
    engine_rpm = Column(Integer)
    vehicle_speed = Column(Float)
    lambda_value = Column(Float)
    road_type = Column(String)
    station_id = Column(String)
    gps_lat = Column(Float)
    gps_lon = Column(Float)
    fuel_amount = Column(Float)
    ground_truth = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

# Database setup
engine = create_engine(config.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
