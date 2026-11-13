
from pathlib import Path
from typing import Literal

import joblib
import numpy as np

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from auth import router as auth_router

from features import (
    extract_ecg_features,
    extract_eeg_features,
    extract_movement_features
)


# ==========================================
# 1. CREATE FASTAPI APPLICATION
# ==========================================

app = FastAPI(
    title="Health Monitoring ML API",
    description="Demo API for four health-monitoring ML modules",
    version="1.0"
    
)
app.include_router(auth_router)

# Allow React frontend to communicate with Python backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# ==========================================
# 2. LOAD TRAINED ML MODELS
# ==========================================

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "models"

try:
    ecg_model = joblib.load(MODEL_DIR / "ecg_model.joblib")
    eeg_model = joblib.load(MODEL_DIR / "eeg_model.joblib")
    movement_model = joblib.load(MODEL_DIR / "movement_model.joblib")
    vitals_model = joblib.load(MODEL_DIR / "vitals_model.joblib")

    print("All four ML models loaded successfully.")

except FileNotFoundError as error:
    raise RuntimeError(
        "Model files are missing. Run python train_models.py first."
    ) from error


# ==========================================
# 3. REQUEST DATA STRUCTURES
# ==========================================

DataSource = Literal["SIMULATED", "DATASET", "HARDWARE", "MANUAL", "FILE"]


class ECGRequest(BaseModel):
    patient_id: str = Field(min_length=1)
    signal: list[float] = Field(min_length=2)
    fs: float = Field(default=250, gt=0)
    source: DataSource = "SIMULATED"


class EEGRequest(BaseModel):
    patient_id: str = Field(min_length=1)
    signal: list[float] = Field(min_length=2)
    fs: float = Field(default=160, gt=0)
    source: DataSource = "SIMULATED"


class MovementRequest(BaseModel):
    patient_id: str = Field(min_length=1)
    samples: list[list[float]] = Field(min_length=2)
    source: DataSource = "SIMULATED"


class VitalsRequest(BaseModel):
    patient_id: str = Field(min_length=1)

    heart_rate: float
    spo2: float
    systolic_bp: float
    diastolic_bp: float
    temperature: float

    source: DataSource = "SIMULATED"


# ==========================================
# 4. COMMON VALIDATION FUNCTION
# ==========================================

def check_finite(values):

    array = np.asarray(values, dtype=float)

    if not np.all(np.isfinite(array)):
        raise HTTPException(
            status_code=422,
            detail="Input contains invalid numerical values."
        )

    return array


# ==========================================
# 5. HOME AND HEALTH CHECK ENDPOINTS
# ==========================================

@app.get("/")
def home():

    return {
        "message": "Health Monitoring ML API is running",
        "modules": ["ECG", "EEG", "Movement", "Vitals"]
    }


@app.get("/health")
def health_check():

    return {
        "status": "running",
        "models_loaded": True
    }


# ==========================================
# 6. ECG PREDICTION
# ==========================================

@app.post("/predict/ecg")
def predict_ecg(request: ECGRequest):

    signal = check_finite(request.signal)

    features = extract_ecg_features(
        signal,
        fs=request.fs
    )
    print("ECG FEATURES:", features, flush=True)
    prediction = ecg_model.predict([features])[0]

    return {
        "patient_id": request.patient_id,
        "module": "ECG",
        "prediction": str(prediction),
        "source": request.source,
        "message": "Synthetic demo pattern classification only.",
        "clinical_diagnosis": False
    }


# ==========================================
# 7. EEG PREDICTION
# ==========================================


@app.post("/predict/eeg")
def predict_eeg(request: EEGRequest):

    signal = check_finite(request.signal)

    features = extract_eeg_features(
        signal,
        fs=request.fs
    )

    print("EEG FEATURES:", features, flush=True)

    prediction = eeg_model.predict([features])[0]

    print("EEG MODEL CLASSES:", eeg_model.classes_, flush=True)

    if hasattr(eeg_model, "predict_proba"):
        print(
            "EEG MODEL PROBABILITIES:",
            eeg_model.predict_proba([features])[0],
            flush=True
        )

    return {
        "patient_id": request.patient_id,
        "module": "EEG",
        "prediction": str(prediction),
        "source": request.source,
        "message": "Synthetic demo task-pattern classification only.",
        "clinical_diagnosis": False
    }


# ==========================================
# 8. MOVEMENT PREDICTION
# ==========================================


@app.post("/predict/movement")
def predict_movement(request: MovementRequest):

    samples = check_finite(request.samples)

    if samples.ndim != 2 or samples.shape[1] != 6:
        raise HTTPException(
            status_code=422,
            detail="Each movement sample must have 6 values: ax, ay, az, gx, gy, gz."
        )

    features = extract_movement_features(samples)

    print("MOVEMENT FEATURES:", features.tolist(), flush=True)
    print("MOVEMENT MODEL CLASSES:", movement_model.classes_, flush=True)

    prediction = movement_model.predict([features])[0]

    print("MOVEMENT PREDICTION:", prediction, flush=True)

    return {
        "patient_id": request.patient_id,
        "module": "MPU6050 Movement",
        "prediction": str(prediction),
        "source": request.source,
        "message": "Synthetic movement-pattern classification only; not a Parkinson's diagnosis.",
        "clinical_diagnosis": False
    }

# ==========================================
# 9. VITAL SIGNS ANOMALY DETECTION
# ==========================================

@app.post("/predict/vitals")
def predict_vitals(request: VitalsRequest):

    values = check_finite([
        request.heart_rate,
        request.spo2,
        request.systolic_bp,
        request.diastolic_bp,
        request.temperature
    ])

    prediction = vitals_model.predict([values])[0]

    if prediction == -1:
        result = "unusual_demo_pattern"
    else:
        result = "within_demo_pattern"

    return {
        "patient_id": request.patient_id,
        "module": "Vital Signs",
        "prediction": result,
        "source": request.source,
        "message": "Experimental anomaly detection using synthetic training data; not a medical assessment.",
        "clinical_diagnosis": False
    }


# ==========================================
# 10. STARTUP MESSAGE
# ==========================================

print("Health Monitoring API is ready.")
