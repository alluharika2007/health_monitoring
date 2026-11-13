
import { useState } from "react";
import { analyzeEEG } from "./services/mlApi";

const FS = 160;

function createEEGSignal() {
    const signal = [];

    for (let i = 0; i < 1600; i++) {
        const t = i / FS;

        const delta = 0.5 * Math.sin(2 * Math.PI * 2 * t);
        const theta = 0.3 * Math.sin(2 * Math.PI * 6 * t);
        const alpha = 0.8 * Math.sin(2 * Math.PI * 10 * t);
        const beta = 0.2 * Math.sin(2 * Math.PI * 20 * t);

        signal.push(delta + theta + alpha + beta);
    }

    return signal;
}

export default function EEGMonitoring() {
    const [signal, setSignal] = useState(createEEGSignal);
    const [manualValues, setManualValues] = useState("");
    const [source, setSource] = useState("SIMULATED");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const plottedSignal = signal.filter((_, index) => index % 4 === 0);

    const points = plottedSignal
        .map((value, index) => {
            const x = index * (900 / Math.max(1, plottedSignal.length - 1));
            const y = 100 - value * 35;
            return `${x},${y}`;
        })
        .join(" ");

    function handleManualInput() {
        const values = manualValues
            .trim()
            .split(/[,\s;]+/)
            .filter(value => value !== "")
            .map(Number);

        if (values.length < 2 || !values.every(Number.isFinite)) {
            setError("Please enter at least 2 valid numeric EEG values.");
            return;
        }

        setSignal(values);
        setSource("MANUAL");
        setResult(null);
        setError("");
    }

    function handleFileUpload(event) {
        const file = event.target.files[0];

        if (!file) return;

        const reader = new FileReader();

        reader.onload = () => {
            try {
                const values = reader.result
                    .trim()
                    .split(/[,\s;]+/)
                    .filter(value => value !== "")
                    .map(Number)
                    .filter(Number.isFinite);

                if (values.length < 2) {
                    setError("File must contain at least 2 numeric EEG values.");
                    return;
                }

                setSignal(values);
                setSource("FILE");
                setResult(null);
                setError("");
            } catch {
                setError("Unable to read the EEG file.");
            }
        };

        reader.onerror = () => {
            setError("Error reading the selected file.");
        };

        reader.readAsText(file);
    }

    function handleSimulation() {
        setSignal(createEEGSignal());
        setSource("SIMULATED");
        setResult(null);
        setError("");
        setManualValues("");
    }

    async function handleAnalyze() {
        setLoading(true);
        setError("");
        setResult(null);

        try {
            const response = await analyzeEEG({
                patient_id: "P001",
                signal: signal,
                fs: FS,
                source: source
            });

            setResult(response);
        } catch (err) {
            setError(err.message || "Unable to connect to EEG API.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ padding: "20px" }}>
            <h2>EEG Monitoring</h2>
            <p>Electroencephalogram Brain Signal Monitoring</p>

            <div style={{
                background: "white",
                padding: "20px",
                borderRadius: "10px"
            }}>
                <h3>Patient ID: P001</h3>
                <p>Sampling Frequency: {FS} Hz</p>
                <p>Signal Status: {source}</p>
                <p>Number of Samples: {signal.length}</p>

                <h3>Manual EEG Signal Input</h3>

                <textarea
                    value={manualValues}
                    onChange={(e) => setManualValues(e.target.value)}
                    placeholder="Enter EEG values separated by commas"
                    rows="4"
                    style={{
                        width: "100%",
                        padding: "10px",
                        boxSizing: "border-box"
                    }}
                />

                <button
                    type="button"
                    onClick={handleManualInput}
                    style={{
                        marginTop: "10px",
                        padding: "10px 18px",
                        background: "#7042a6",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer"
                    }}
                >
                    Load Manual EEG Signal
                </button>

                <hr />

                <h3>Upload EEG CSV / TXT File</h3>

                <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                />

                <hr />

                <button
                    type="button"
                    onClick={handleSimulation}
                    style={{
                        padding: "10px 18px",
                        background: "#287c68",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer"
                    }}
                >
                    Generate Simulated EEG
                </button>

                <h3>EEG Waveform</h3>

                <svg
                    viewBox="0 0 900 200"
                    width="100%"
                    style={{
                        background: "#f8f9ff",
                        border: "1px solid #ddd"
                    }}
                >
                    <polyline
                        points={points}
                        fill="none"
                        stroke="#7042a6"
                        strokeWidth="2"
                    />
                </svg>

                <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    style={{
                        marginTop: "20px",
                        padding: "12px 22px",
                        background: "#7042a6",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer"
                    }}
                >
                    {loading ? "Analyzing..." : "Analyze EEG with ML"}
                </button>

                {error && (
                    <p style={{ color: "red" }}>Error: {error}</p>
                )}

                {result && (
                    <div style={{
                        marginTop: "20px",
                        padding: "15px",
                        background: "#f0eafa",
                        borderRadius: "8px"
                    }}>
                        <h3>EEG ML Analysis Result</h3>
                        <p><b>Patient:</b> {result.patient_id}</p>
                        <p><b>Module:</b> {result.module}</p>
                        <p><b>Prediction:</b> {result.prediction}</p>
                        <p><b>Source:</b> {result.source}</p>
                        <p>{result.message}</p>
                        <p>Experimental result only — not a medical diagnosis.</p>
                    </div>
                )}
            </div>
        </div>
    );
}