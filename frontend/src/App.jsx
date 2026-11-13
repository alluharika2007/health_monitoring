import DoctorDashboard from "./DoctorDashboard";
import AdminDashboard from "./AdminDashboard";
import Auth from "./Auth";
import EmergencySupport from "./EmergencySupport";
import MovementMonitoring from "./MovementMonitoring";
import EEGMonitoring from "./EEGMonitoring";
import ECGMonitoring from "./ECGMonitoring";
import { useState, useEffect } from "react";
import { analyzeVitals, getCurrentUser } from "./services/mlApi";
import "./App.css";

function App() {
    const [page, setPage] = useState("overview");
    const [currentUser, setCurrentUser] = useState(null);
    const [authToken, setAuthToken] = useState(null);
 useEffect(() => {
    async function restoreSession() {
        const savedToken = sessionStorage.getItem("healthcare_token");

        if (!savedToken) {
            return;
        }

        try {
            const user = await getCurrentUser(savedToken);

            setAuthToken(savedToken);
            setCurrentUser(user);
        } catch (error) {
            sessionStorage.removeItem("healthcare_token");
            setAuthToken(null);
            setCurrentUser(null);
        }
    }

    restoreSession();
}, []);

function handleLogin(data) {
    sessionStorage.setItem("healthcare_token", data.access_token);
    setAuthToken(data.access_token);
    setCurrentUser(data.user);
}

function handleLogout() {
    sessionStorage.removeItem("healthcare_token");
    setAuthToken(null);
    setCurrentUser(null);
    setPage("overview");
}

    const [form, setForm] = useState({
        patient_id: "P001",
        heart_rate: 75,
        spo2: 97,
        systolic_bp: 120,
        diastolic_bp: 80,
        temperature: 36.8,
        source: "SIMULATED",
    });

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const navigation = [
        { id: "overview", label: "▦ Dashboard" },
        { id: "patient", label: "♙ Patient Profile" },
        { id: "ecg", label: "♥ ECG Monitoring" },
        { id: "eeg", label: "◉ EEG Monitoring" },
        { id: "movement", label: "↗ Movement Analysis" },
        { id: "vitals", label: "✚ Vital Signs" },
        { id: "emergency", label: "⚠ Emergency" },
    ];

    const titles = {
        overview: "Patient Dashboard",
        patient: "Patient Profile",
        ecg: "ECG Monitoring",
        eeg: "EEG Monitoring",
        movement: "Movement Analysis",
        vitals: "Vital Signs Analysis",
        emergency: "Emergency Support",
    };

    function handleChange(event) {
        setForm({
            ...form,
            [event.target.name]: event.target.value,
        });
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setLoading(true);
        setError("");
        setResult(null);

        try {
            const data = await analyzeVitals({
                ...form,
                heart_rate: Number(form.heart_rate),
                spo2: Number(form.spo2),
                systolic_bp: Number(form.systolic_bp),
                diastolic_bp: Number(form.diastolic_bp),
                temperature: Number(form.temperature),
            });

            setResult(data);
        } catch (err) {
            setError(err.message || "Unable to connect to the API.");
        } finally {
            setLoading(false);
        }
    }

    function openPage(id) {
        setPage(id);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function ModulePlaceholder({ title, description }) {
        return (
            <section className="coming-panel">
                <h2>{title}</h2>
                <p>{description}</p>
                <span className="demo-tag">DEVELOPMENT MODULE</span>
            </section>
        );
    }
    // Show login screen if user is not logged in
   
// Show login screen if user is not logged in
if (!currentUser || !authToken) {
    return <Auth onLogin={handleLogin} />;
}
if (currentUser.role === "admin") {
    return (
        <AdminDashboard
            currentUser={currentUser}
            authToken={authToken}
            onLogout={handleLogout}
        />
    );
}
if (currentUser.role === "doctor") {
    if (currentUser.doctor_status !== "approved") {
        return (
            <div style={{ padding: "30px" }}>
                <h1>Doctor Account Pending</h1>
                <p>Your account is waiting for administrator approval.</p>
                <button onClick={handleLogout}>Logout</button>
            </div>
        );
    }

    return (
        <DoctorDashboard
            currentUser={currentUser}
            authToken={authToken}
            onLogout={handleLogout}
        />
    );
}

// Existing Patient Dashboard
return (
    <div className="app-layout">

            
            <aside className="sidebar">
                <h2 className="brand">
                    Health<span>Care+</span>
                </h2>

                <p className="sidebar-label">MAIN MENU</p>

                {navigation.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        className={`nav-item ${
                            page === item.id ? "active" : ""
                        }`}
                        onClick={() => openPage(item.id)}
                    >
                        {item.label}
                    </button>
                ))}

                <div className="sidebar-bottom">
                    <p>AI/ML Patient Monitoring</p>
                    <small>Software demonstration</small>
                </div>
            </aside>

            <main className="main-content">
                <header className="topbar">
                    <button
                        type="button"
                        className="logout-button"
                       onClick={handleLogout}
                    >
                       Logout
                     </button>
                    <div>
                        <h1>{titles[page]}</h1>
                        <p>Welcome to your health monitoring system</p>
                    </div>

                    <div className="patient-badge">
                        <span className="avatar">P</span>
                        <div>
                            <strong>{currentUser.full_name}</strong>
                            <small>{currentUser.role.toUpperCase()} ACCOUNT</small>
                        </div>
                    </div>
                </header>

                {page === "overview" && (
                    <>
                        <section>
                            <div className="section-heading">
                                <h2>Health Overview</h2>
                                <span className="demo-tag">
                                    SIMULATED DATA
                                </span>
                            </div>

                            <div className="module-grid">
                                {[
                                    {
                                        name: "ECG Monitoring",
                                        value: "Awaiting signal",
                                        icon: "♥",
                                        color: "red",
                                        id: "ecg",
                                    },
                                    {
                                        name: "EEG Monitoring",
                                        value: "Awaiting signal",
                                        icon: "◉",
                                        color: "purple",
                                        id: "eeg",
                                    },
                                    {
                                        name: "Movement Analysis",
                                        value: "Awaiting signal",
                                        icon: "↗",
                                        color: "blue",
                                        id: "movement",
                                    },
                                    {
                                        name: "Vital Signs",
                                        value: "Demo readings",
                                        icon: "✚",
                                        color: "green",
                                        id: "vitals",
                                    },
                                ].map((item) => (
                                    <button
                                        type="button"
                                        className="module-card"
                                        key={item.id}
                                        onClick={() => openPage(item.id)}
                                    >
                                        <div
                                            className={`module-icon ${item.color}`}
                                        >
                                            {item.icon}
                                        </div>
                                        <p>{item.name}</p>
                                        <h3>{item.value}</h3>
                                        <small>Open module →</small>
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="patient-panel">
                            <h2>Patient Information</h2>
                            <div className="patient-details">
                                <div>
                                    <small>Patient ID</small>
                                    <strong>P001</strong>
                                </div>
                                <div>
                                    <small>Monitoring Mode</small>
                                    <strong>Simulation</strong>
                                </div>
                                <div>
                                    <small>System Status</small>
                                    <strong className="online">
                                        ● Dashboard running
                                    </strong>
                                </div>
                            </div>
                        </section>
                    </>
                )}

                {page === "patient" && (
                    <section className="patient-panel">
                        <h2>Patient Information</h2>
                        <div className="patient-details">
                            <div>
                                <small>Patient ID</small>
                                <strong>P001</strong>
                            </div>
                            <div>
                                <small>Monitoring Mode</small>
                                <strong>Simulation</strong>
                            </div>
                            <div>
                                <small>Account Type</small>
                                <strong>Demo account</strong>
                            </div>
                        </div>
                        <p className="description">
                            This is sample patient information. Patient
                            registration and database storage can be added
                            in a later step.
                        </p>
                    </section>
                )}

                {page === "vitals" && (
                    <section className="vitals-panel">
                        <div className="section-heading">
                            <h2>Vital Signs Analysis</h2>
                            <span className="demo-tag">ML MODEL</span>
                        </div>

                        <p className="description">
                            Enter sample readings to test your Python
                            Machine Learning API.
                        </p>

                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <label>
                                    Patient ID
                                    <input
                                        name="patient_id"
                                        value={form.patient_id}
                                        onChange={handleChange}
                                        required
                                    />
                                </label>

                                <label>
                                    Heart Rate (BPM)
                                    <input
                                        type="number"
                                        name="heart_rate"
                                        value={form.heart_rate}
                                        onChange={handleChange}
                                        required
                                    />
                                </label>

                                <label>
                                    SpO2 (%)
                                    <input
                                        type="number"
                                        name="spo2"
                                        value={form.spo2}
                                        onChange={handleChange}
                                        required
                                    />
                                </label>

                                <label>
                                    Systolic BP (mmHg)
                                    <input
                                        type="number"
                                        name="systolic_bp"
                                        value={form.systolic_bp}
                                        onChange={handleChange}
                                        required
                                    />
                                </label>

                                <label>
                                    Diastolic BP (mmHg)
                                    <input
                                        type="number"
                                        name="diastolic_bp"
                                        value={form.diastolic_bp}
                                        onChange={handleChange}
                                        required
                                    />
                                </label>

                                <label>
                                    Temperature (°C)
                                    <input
                                        type="number"
                                        step="0.1"
                                        name="temperature"
                                        value={form.temperature}
                                        onChange={handleChange}
                                        required
                                    />
                                </label>
                            </div>

                            <button
                                className="analyze-button"
                                disabled={loading}
                            >
                                {loading
                                    ? "Analyzing..."
                                    : "Analyze Vital Signs"}
                            </button>
                        </form>

                        {error && (
                            <div className="error-box">
                                Error: {error}
                            </div>
                        )}

                        {result && (
                            <div className="result-box">
                                <h3>ML Analysis Result</h3>
                                <p>
                                    <strong>Patient:</strong>{" "}
                                    {result.patient_id}
                                </p>
                                <p>
                                    <strong>Module:</strong> {result.module}
                                </p>
                                <p>
                                    <strong>Prediction:</strong>{" "}
                                    {result.prediction}
                                </p>
                                <p>
                                    <strong>Source:</strong> {result.source}
                                </p>
                                <p>{result.message}</p>
                                <p>
                                    <strong>Clinical diagnosis:</strong> No
                                </p>
                            </div>
                        )}
                    </section>
                )}

                {page === "ecg" && <ECGMonitoring /> }
                    
    

                {page === "eeg" && <EEGMonitoring/> }

                {page === "movement" && <MovementMonitoring/>
                    
                }

                {page === "emergency" && <EmergencySupport/>}


                <footer>
                    Health Monitoring System | Academic Software Demonstration
                    <br />
                    Not a medical diagnostic system.
                </footer>
            </main>
        </div>
    );
}

export default App;