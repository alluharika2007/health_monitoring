
import os
import joblib
import numpy as np
from features import (
    extract_ecg_features,
    extract_eeg_features,
    extract_movement_features
)
from contextlib import redirect_stdout
from io import StringIO
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.svm import SVC
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler


# Create models folder
os.makedirs("models", exist_ok=True)

np.random.seed(42)


# =====================================
# 1. ECG CLASSIFICATION - RANDOM FOREST
# =====================================


def train_ecg_model():

    X = []
    y = []

    fs = 250
    duration = 3
    t = np.arange(fs * duration) / fs

    for _ in range(300):

        # REGULAR ECG DEMO SIGNAL
        regular_signal = np.random.normal(0, 0.003, len(t))

        start = np.random.uniform(0.35, 0.55)
        interval = np.random.uniform(0.9, 1.1)

        regular_beats = np.arange(start, duration - 0.1, interval)

        for beat in regular_beats:
            amplitude = np.random.uniform(0.9, 1.1)
            width = np.random.uniform(0.02, 0.03)

            regular_signal += amplitude * np.exp(
                -((t - beat) / width) ** 2
            )

        # IRREGULAR ECG DEMO SIGNAL
        irregular_signal = np.random.normal(0, 0.003, len(t))

        irregular_beats = [np.random.uniform(0.25, 0.45)]

        while True:
            next_beat = irregular_beats[-1] + np.random.uniform(0.35, 0.75)

            if next_beat >= duration - 0.1:
                break

            irregular_beats.append(next_beat)

        for beat in irregular_beats:
            amplitude = np.random.uniform(0.9, 1.1)
            width = np.random.uniform(0.02, 0.03)

            irregular_signal += amplitude * np.exp(
                -((t - beat) / width) ** 2
            )

        # USE THE SAME FEATURES AS THE ECG API
        regular_features = extract_ecg_features(
            regular_signal, fs=fs
        )

        irregular_features = extract_ecg_features(
            irregular_signal, fs=fs
        )

        X.append(regular_features)
        y.append("regular_demo_pattern")

        X.append(irregular_features)
        y.append("irregular_demo_pattern")

    model = RandomForestClassifier(
        n_estimators=200,
        random_state=42
    )

    model.fit(X, y)

    joblib.dump(model, "models/ecg_model.joblib")

    print("ECG demo model trained successfully.")

# =====================================
# 2. EEG CLASSIFICATION - SVM
# =====================================


def train_eeg_model():

    X = []
    y = []

    # Generate 10-second EEG signals at 160 Hz
    fs = 160
    t = np.arange(1600) / fs

    for _ in range(300):

        # Random phases make each signal slightly different
        phases = np.random.uniform(0, 2 * np.pi, 4)

        # REST: stronger alpha activity
        rest_signal = (
            np.random.uniform(0.3, 0.6) * np.sin(2 * np.pi * 2 * t + phases[0]) +
            np.random.uniform(0.2, 0.4) * np.sin(2 * np.pi * 6 * t + phases[1]) +
            np.random.uniform(0.7, 1.0) * np.sin(2 * np.pi * 10 * t + phases[2]) +
            np.random.uniform(0.1, 0.25) * np.sin(2 * np.pi * 20 * t + phases[3])
        )

        # MOTOR TASK: stronger beta activity
        motor_signal = (
            np.random.uniform(0.3, 0.6) * np.sin(2 * np.pi * 2 * t + phases[0]) +
            np.random.uniform(0.2, 0.4) * np.sin(2 * np.pi * 6 * t + phases[1]) +
            np.random.uniform(0.2, 0.4) * np.sin(2 * np.pi * 10 * t + phases[2]) +
            np.random.uniform(0.7, 1.0) * np.sin(2 * np.pi * 20 * t + phases[3])
        )

        # Add small background noise
        rest_signal += np.random.normal(0, 0.02, len(t))
        motor_signal += np.random.normal(0, 0.02, len(t))

        # Use the SAME feature extraction as the actual EEG API
        with redirect_stdout(StringIO()):
            rest_features = extract_eeg_features(rest_signal, fs=fs)
            motor_features = extract_eeg_features(motor_signal, fs=fs)

        X.append(rest_features)
        y.append("rest_demo_pattern")

        X.append(motor_features)
        y.append("motor_task_demo_pattern")

    model = make_pipeline(
        StandardScaler(),
        SVC(kernel="rbf")
    )

    model.fit(X, y)

    joblib.dump(model, "models/eeg_model.joblib")

    print("EEG demo model trained successfully.")

# =====================================
# 3. MOVEMENT CLASSIFICATION - RANDOM FOREST
# =====================================
def train_movement_model():

    X = []
    y = []

    fs = 10
    t = np.arange(100) / fs

    for _ in range(300):

        # 1. STEADY MOVEMENT
        ax = 0.2 * np.sin(t)
        ay = 0.3 * np.cos(t)
        az = 9.8 + 0.1 * np.sin(t)

        gx = 2 * np.sin(t)
        gy = 2 * np.cos(t)
        gz = 1.5 * np.sin(2 * t)

        steady = np.column_stack([ax, ay, az, gx, gy, gz])
        steady += np.random.normal(0, 0.03, steady.shape)

        # 2. TREMOR-LIKE MOVEMENT
        tremor = steady.copy()

        tremor[:, 0] += 0.5 * np.sin(2 * np.pi * 8 * t)
        tremor[:, 1] += 0.5 * np.sin(2 * np.pi * 10 * t)
        tremor[:, 3] += 3 * np.sin(2 * np.pi * 8 * t)
        tremor[:, 4] += 3 * np.sin(2 * np.pi * 10 * t)

        tremor += np.random.normal(0, 0.05, tremor.shape)

        # 3. HIGH-MOTION PATTERN
        high_motion = np.column_stack([
            2 * np.sin(2 * t),
            2 * np.cos(2 * t),
            9.8 + 1.5 * np.sin(2 * t),
            15 * np.sin(2 * t),
            15 * np.cos(2 * t),
            10 * np.sin(3 * t)
        ])

        high_motion += np.random.normal(
            0, 0.2, high_motion.shape
        )

        # Extract features using the SAME function as the API
        X.append(extract_movement_features(steady))
        y.append("steady_demo_pattern")

        X.append(extract_movement_features(tremor))
        y.append("tremor_like_demo_pattern")

        X.append(extract_movement_features(high_motion))
        y.append("high_motion_demo_pattern")

    model = RandomForestClassifier(
        n_estimators=100,
        random_state=42
    )

    model.fit(X, y)

    joblib.dump(model, "models/movement_model.joblib")

    print("Movement demo model trained successfully.")

def train_vitals_model():

    # Demo feature order:
    # heart_rate, SpO2, systolic_BP,
    # diastolic_BP, temperature

    normal_data = np.column_stack([
        np.random.normal(75, 8, 1000),
        np.random.normal(97, 1, 1000),
        np.random.normal(120, 10, 1000),
        np.random.normal(80, 7, 1000),
        np.random.normal(36.8, 0.3, 1000)
    ])

    model = IsolationForest(
        contamination=0.05,
        random_state=42
    )

    model.fit(normal_data)

    joblib.dump(model, "models/vitals_model.joblib")

    print("Vitals demo model trained successfully.")


# =====================================
# TRAIN ALL FOUR MODELS
# =====================================

if __name__ == "__main__":

    print("\nStarting Health Monitoring ML training...\n")

    train_ecg_model()

    train_eeg_model()

    train_movement_model()

    train_vitals_model()

    print("\nAll four demo models trained successfully!")

    print("Models saved inside the models folder.")
