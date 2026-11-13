
const API_URL = "http://127.0.0.1:8000";

async function postPrediction(endpoint, data) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let message = "API request failed";

    try {
      const error = await response.json();
      message =
        typeof error.detail === "string"
          ? error.detail
          : JSON.stringify(error.detail || error);
    } catch {
      message = `Server returned HTTP ${response.status}`;
    }

    throw new Error(message);
  }

  return await response.json();
}

export async function analyzeVitals(patientData) {
  return postPrediction("/predict/vitals", patientData);
}

export async function analyzeECG(ecgData) {
  return postPrediction("/predict/ecg", ecgData);
}
export async function analyzeEEG(eegData) {
    return postPrediction("/predict/eeg", eegData);
}
export async function analyzeMovement(movementData) {
    return postPrediction("/predict/movement", movementData);
}

// ---------------- AUTHENTICATION APIs ----------------

// Common function to handle authentication requests
async function authRequest(endpoint, data) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.detail || "Authentication failed");
  }

  return result;
}

// Patient / Doctor Registration
export async function registerUser(userData) {
  return authRequest("/auth/register", userData);
}

// Patient / Doctor Login
export async function loginUser(loginData) {
  return authRequest("/auth/login", loginData);
}

// Get currently logged-in user's details
export async function getCurrentUser(token) {
  const response = await fetch(`${API_URL}/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.detail || "Unable to get user details");
  }

  return result;
}
