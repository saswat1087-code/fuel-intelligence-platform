import xgboost as xgb
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_absolute_error, r2_score, mean_squared_error
import pandas as pd
import numpy as np
import joblib
import os
from typing import List, Dict, Any, Optional
import logging
from .feature_engineer import FeatureEngineer
from .models import PredictionResult

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FuelIntelligencePredictor:
    def __init__(self, model_dir: str = "./models"):
        self.model_dir = model_dir
        os.makedirs(model_dir, exist_ok=True)
        
        # Initialize models
        self.mileage_model = None
        self.injector_deposit_model = None
        self.fuel_pump_wear_model = None
        self.feature_engineer = FeatureEngineer(model_dir)
        self.feature_cols = None
        self.is_trained = False
        
    def create_training_data(self, records: List[Dict]) -> pd.DataFrame:
        """Convert raw records to training dataframe with labels"""
        df = pd.DataFrame(records)
        
        # Feature engineering
        df = self.feature_engineer.create_features(df)
        self.feature_cols = self.feature_engineer.get_feature_columns()
        
        return df

    def train_mileage_model(self, df: pd.DataFrame) -> Dict[str, float]:
        """
        Predicts: mileage_loss_percent = (expected - actual) / expected * 100
        """
        X = df[self.feature_cols]
        y = df['ground_truth_mileage_loss']
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        self.mileage_model = xgb.XGBRegressor(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            early_stopping_rounds=20
        )
        
        self.mileage_model.fit(
            X_train, y_train,
            eval_set=[(X_test, y_test)],
            verbose=False
        )
        
        # Evaluate
        y_pred = self.mileage_model.predict(X_test)
        metrics = {
            'mae': mean_absolute_error(y_test, y_pred),
            'rmse': np.sqrt(mean_squared_error(y_test, y_pred)),
            'r2': r2_score(y_test, y_pred)
        }
        
        logger.info(f"Mileage Model - MAE: {metrics['mae']:.2f}%, R2: {metrics['r2']:.3f}")
        
        # Save model
        joblib.dump(self.mileage_model, f"{self.model_dir}/mileage_model.pkl")
        return metrics

    def train_injector_deposit_model(self, df: pd.DataFrame) -> Dict[str, float]:
        """
        Predicts: deposit_accumulation_rate (mg/100km)
        """
        X = df[self.feature_cols]
        y = df['ground_truth_deposit_mg_per_100km']
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        self.injector_deposit_model = xgb.XGBRegressor(
            n_estimators=150,
            max_depth=5,
            learning_rate=0.08,
            subsample=0.8,
            random_state=42
        )
        
        self.injector_deposit_model.fit(X_train, y_train, verbose=False)
        
        y_pred = self.injector_deposit_model.predict(X_test)
        metrics = {
            'mae': mean_absolute_error(y_test, y_pred),
            'rmse': np.sqrt(mean_squared_error(y_test, y_pred)),
            'r2': r2_score(y_test, y_pred)
        }
        
        logger.info(f"Injector Deposit Model - MAE: {metrics['mae']:.2f} mg/100km, R2: {metrics['r2']:.3f}")
        
        joblib.dump(self.injector_deposit_model, f"{self.model_dir}/injector_deposit_model.pkl")
        return metrics

    def train_pump_wear_model(self, df: pd.DataFrame) -> Dict[str, float]:
        """
        Predicts: pump_wear_score (0-10)
        """
        X = df[self.feature_cols]
        y = df['ground_truth_pump_wear_score']
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        self.fuel_pump_wear_model = RandomForestRegressor(
            n_estimators=100,
            max_depth=8,
            random_state=42
        )
        
        self.fuel_pump_wear_model.fit(X_train, y_train)
        
        y_pred = self.fuel_pump_wear_model.predict(X_test)
        metrics = {
            'mae': mean_absolute_error(y_test, y_pred),
            'rmse': np.sqrt(mean_squared_error(y_test, y_pred)),
            'r2': r2_score(y_test, y_pred)
        }
        
        logger.info(f"Pump Wear Model - MAE: {metrics['mae']:.2f}, R2: {metrics['r2']:.3f}")
        
        joblib.dump(self.fuel_pump_wear_model, f"{self.model_dir}/fuel_pump_wear_model.pkl")
        return metrics

    def train_all_models(self, df: pd.DataFrame) -> Dict[str, Dict[str, float]]:
        """Train all models and return metrics"""
        self.is_trained = True
        return {
            'mileage': self.train_mileage_model(df),
            'injector_deposit': self.train_injector_deposit_model(df),
            'pump_wear': self.train_pump_wear_model(df)
        }

    def load_models(self):
        """Load pre-trained models from disk"""
        try:
            self.mileage_model = joblib.load(f"{self.model_dir}/mileage_model.pkl")
            self.injector_deposit_model = joblib.load(f"{self.model_dir}/injector_deposit_model.pkl")
            self.fuel_pump_wear_model = joblib.load(f"{self.model_dir}/fuel_pump_wear_model.pkl")
            self.feature_engineer.load_scaler()
            self.is_trained = True
            logger.info("Models loaded successfully")
            return True
        except FileNotFoundError:
            logger.warning("Models not found. Train models first.")
            return False

    def predict(self, input_data: Dict[str, Any]) -> PredictionResult:
        """Make predictions from a single input record"""
        # Convert to DataFrame
        df = pd.DataFrame([input_data])
        
        # Feature engineering
        df = self.feature_engineer.create_features(df)
        self.feature_cols = self.feature_engineer.get_feature_columns()
        
        # Ensure all feature columns exist
        for col in self.feature_cols:
            if col not in df.columns:
                df[col] = 0
        
        X = df[self.feature_cols]
        
        # Load models if not in memory
        if not self.is_trained:
            if not self.load_models():
                raise ValueError("Models not trained. Please train models first.")
        
        # Get predictions
        mileage_loss = self.mileage_model.predict(X)[0]
        deposit_rate = self.injector_deposit_model.predict(X)[0]
        pump_wear = self.fuel_pump_wear_model.predict(X)[0]
        
        # Calculate Engine Health Score
        engine_health = self._calculate_health_score(
            mileage_loss, deposit_rate, pump_wear, df.iloc[0]
        )
        
        # Determine categories
        deposit_risk = self._categorize_deposit_risk(deposit_rate)
        pump_risk = self._categorize_pump_risk(pump_wear)
        water_cat = self._categorize_water(df.iloc[0]['water_ppm'])
        
        # Maintenance recommendations
        maintenance = self._generate_maintenance_recommendations(
            deposit_rate, pump_wear, df.iloc[0]
        )
        
        return PredictionResult(
            fuel_quality_score=float(df.iloc[0]['fuel_quality_score']),
            estimated_ethanol=float(df.iloc[0]['ethanol_percent']),
            water_contamination=water_cat,
            expected_mileage_reduction=float(max(0, mileage_loss)),
            injector_deposit_risk=deposit_risk,
            fuel_pump_wear_status=pump_risk,
            engine_health_score=engine_health,
            recommended_injector_cleaner_km=maintenance['injector_cleaner_km'],
            recommended_fuel_filter_km=maintenance['fuel_filter_km'],
            predicted_component_life_km=maintenance['component_life_km']
        )

    def _calculate_health_score(self, mileage_loss, deposit_rate, pump_wear, row) -> float:
        score = 100.0
        score -= max(0, mileage_loss) * 1.2
        score -= deposit_rate * 0.5
        score -= pump_wear * 0.3
        score -= abs(row['fuel_pressure_deviation']) * 10
        score -= row['knock_severity'] * 2
        return max(0, min(100, score))

    def _categorize_water(self, ppm: float) -> str:
        if ppm < 50: return "Low"
        elif ppm < 150: return "Medium"
        else: return "High"

    def _categorize_deposit_risk(self, rate: float) -> str:
        if rate < 0.5: return "Low"
        elif rate < 1.5: return "Medium"
        else: return "High"

    def _categorize_pump_risk(self, wear_score: float) -> str:
        if wear_score < 0.3: return "Normal"
        elif wear_score < 0.6: return "Elevated"
        else: return "Critical"

    def _generate_maintenance_recommendations(self, deposit_rate, pump_wear, row) -> Dict:
        base_interval = 15000  # Default service interval
        
        # Adjust based on deposit rate
        if deposit_rate > 1.5:
            injector_cleaner = max(1000, base_interval * 0.1)
        elif deposit_rate > 0.8:
            injector_cleaner = max(3000, base_interval * 0.3)
        else:
            injector_cleaner = base_interval * 0.6
        
        # Fuel filter based on water and pump wear
        if row['water_ppm'] > 100 or pump_wear > 0.6:
            fuel_filter = max(5000, base_interval * 0.4)
        else:
            fuel_filter = base_interval
        
        # Component life estimate
        component_life = base_interval / (1 + pump_wear)
        
        return {
            'injector_cleaner_km': int(injector_cleaner),
            'fuel_filter_km': int(fuel_filter),
            'component_life_km': int(component_life)
        }
