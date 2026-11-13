
import numpy as np
from scipy.signal import find_peaks, welch


# --------------------------------
# 1. ECG FEATURE EXTRACTION
# --------------------------------

def extract_ecg_features(signal, fs=250):

    signal = np.asarray(signal, dtype=float)

    if signal.ndim != 1 or len(signal) < 2:
        raise ValueError("ECG signal must be a 1D array with at least 2 samples.")

    mean_value = np.mean(signal)
    std_value = np.std(signal)
    min_value = np.min(signal)
    max_value = np.max(signal)
    rms_value = np.sqrt(np.mean(signal ** 2))

    peaks, _ = find_peaks(
        signal,
        distance=max(1, int(0.25 * fs)),
        prominence=max(0.1 * std_value, 1e-8)
    )

    peak_rate = len(peaks) / (len(signal) / fs)

    # Calculate variation between consecutive detected peaks
    if len(peaks) >= 3:
        rr_intervals = np.diff(peaks) / fs
        rr_variability = np.std(rr_intervals)
    else:
        rr_variability = 0.0

    frequencies, power = welch(signal, fs=fs)
    dominant_frequency = frequencies[np.argmax(power)]

    return np.array([
        mean_value,
        std_value,
        min_value,
        max_value,
        rms_value,
        peak_rate,
        dominant_frequency,
        max_value - min_value,
        rr_variability
    ])


# --------------------------------
# 2. EEG FEATURE EXTRACTION
# --------------------------------

def extract_eeg_features(signal, fs=160):

    signal = np.asarray(signal, dtype=float)

    if signal.ndim != 1 or len(signal) < 2:
        raise ValueError("EEG signal must be a 1D array with at least 2 samples.")

    frequencies, power = welch(signal, fs=fs , nperseg=min(256,len(signal)))
    print("EEG FREQUENCIES:", frequencies, flush=True)
    def band_power(low, high):

        mask = (frequencies >= low) & (frequencies < high)

        if np.sum(mask) < 2:
            return 0.0

        return np.trapezoid(power[mask], frequencies[mask])

    delta = band_power(0.5, 4)
    theta = band_power(4, 8)
    alpha = band_power(8, 13)
    beta = band_power(13, 30)

    features = np.array([
        np.mean(signal),
        np.std(signal),
        delta,
        theta,
        alpha,
        beta
    ])

    print("EEG FEATURE VALUES:", features, flush=True)

    return features


# --------------------------------
# 3. MPU6050 MOVEMENT FEATURES
# --------------------------------

def extract_movement_features(samples):

    samples = np.asarray(samples, dtype=float)

    if samples.ndim != 2 or samples.shape[1] != 6:
        raise ValueError(
            "Movement data must contain 6 columns: "
            "ax, ay, az, gx, gy, gz."
        )

    if samples.shape[0] < 2:
        raise ValueError("At least 2 movement samples are required.")

    if not np.all(np.isfinite(samples)):
        raise ValueError("Movement data contains invalid values.")

    features = []

    # Features for all six sensor axes
    for axis in range(6):

        values = samples[:, axis]

        features.extend([
            np.mean(values),
            np.std(values),
            np.sqrt(np.mean(values ** 2)),
            np.max(np.abs(values))
        ])

    # Acceleration magnitude
    acceleration = samples[:, :3]
    acceleration_magnitude = np.linalg.norm(acceleration, axis=1)

    # Gyroscope magnitude
    gyroscope = samples[:, 3:]
    gyroscope_magnitude = np.linalg.norm(gyroscope, axis=1)

    features.extend([
        np.mean(acceleration_magnitude),
        np.std(acceleration_magnitude),
        np.sqrt(np.mean(acceleration_magnitude ** 2)),
        np.mean(gyroscope_magnitude),
        np.std(gyroscope_magnitude),
        np.sqrt(np.mean(gyroscope_magnitude ** 2))
    ])

    return np.array(features)


print("Health Monitoring feature extraction module loaded.")
