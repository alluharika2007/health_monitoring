
import { useState } from "react";
import { analyzeECG } from "./services/mlApi";

const FS = 250;

function createECGSignal() {
    const samples = [];

    for (let i = 0; i < 750; i++) {
        const phase = (i % 208) / 208;

        const p = 0.12 * Math.exp(-Math.pow((phase - 0.18) / 0.035, 2));
        const q = -0.15 * Math.exp(-Math.pow((phase - 0.38) / 0.012, 2));
        const r = 1.0 * Math.exp(-Math.pow((phase - 0.41) / 0.009, 2));
        const s = -0.25 * Math.exp(-Math.pow((phase - 0.44) / 0.015, 2));
        const t = 0.3 * Math.exp(-Math.pow((phase - 0.68) / 0.07, 2));

        samples.push(p + q + r + s + t);
    }

    return samples;
}

export default function ECGMonitoring() {
    const [signal, setSignal] = useState(createECGSignal);
    const [manualValues, setManualValues] = useState("");
    const [source, setSource] = useState("SIMULATED");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const points = signal.map((value, index) => {
        const x = (index / (signal.length - 1)) * 900;
        const y = 100 - value * 65;
        return `${x},${y}`;
    }).join(" ");

    function handleManualInput() {
        const values = manualValues
            .split(/[,\s;]+/)
            .map(Number)
            .filter(value => Number.isFinite(value));

        if (values.length < 2) {
            setError("Please enter at least two valid ECG readings.");
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

        if (!file.name.toLowerCase().endsWith(".csv") &&
            !file.name.toLowerCase().endsWith(".txt")) {
            setError("Please upload a CSV or TXT file.");
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            const values = reader.result
                .split(/[,\s;]+/)
                .map(Number)
                .filter(value => Number.isFinite(value));

            if (values.length < 2) {
                setError("The file does not contain enough valid ECG readings.");
                return;
            }

            setSignal(values);
            setSource("FILE");
            setResult(null);
            setError("");
        };

        reader.onerror = () => {
            setError("Unable to read the selected file.");
        };

        reader.readAsText(file);
    }

    function handleSimulatedSignal() {
        setSignal(createECGSignal());
        setSource("SIMULATED");
        setResult(null);
        setError("");
        setManualValues("");
    }

    async function handleAnalyze() {
        if (signal.length < 2) {
            setError("Please provide ECG readings first.");
            return;
        }

        setLoading(true);
        setError("");
        setResult(null);

        try {
            const response = await analyzeECG({
                patient_id: "P001",
                signal: signal,
                fs: FS,
                source: source
            });

            setResult(response);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ padding: "20px" }}>
            <h2>ECG Monitoring</h2>
            <p>Electrocardiogram signal visualization and ML analysis</p>

            <div style={{
                padding: "20px",
                background: "#fff",
                borderRadius: "10px",
                marginTop: "20px"
            }}>
                <h3>Patient P001</h3>
                <p>Sampling Frequency: {FS} Hz</p>
                <p>Signal Source: {source}</p>
                <p>Total Readings: {signal.length}</p>

                <hr />

                <h3>1. Enter ECG Values Manually</h3>

                <p>
                    Enter signal readings separated by commas.
                </p>

                <textarea
                    value={manualValues}
                    onChange={(e) => setManualValues(e.target.value)}
                    placeholder="Example: 0.1, 0.2, 0.5, 1.0, 0.3, -0.2, 0.1"
                    rows="4"
                    style={{
                        width: "100%",
                        padding: "10px",
                        boxSizing: "border-box"
                    }}
                />

                <button
                    onClick={handleManualInput}
                    style={{
                        marginTop: "10px",
                        padding: "10px 18px",
                        background: "#1769aa",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer"
                    }}
                >
                    Use Manual Values
                </button>

                <hr />

                <h3>2. Upload ECG Signal File</h3>

                <p>
                    Upload a CSV or TXT file containing one ECG reading per row,
                    or readings separated by commas.
                </p>

                <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                />

                <hr />

                <h3>3. Use Simulated ECG Signal</h3>

                <button
                    onClick={handleSimulatedSignal}
                    style={{
                        padding: "10px 18px",
                        background: "#16845b",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer"
                    }}
                >
                    Generate Simulated ECG
                </button>

                <hr />

                <h3>ECG Waveform</h3>

                <svg
                    viewBox="0 0 900 200"
                    width="100%"
                    style={{
                        background: "#fffafa",
                        border: "1px solid #ddd"
                    }}
                >
                    {Array.from({ length: 10 }, (_, i) => (
                        <line
                            key={i}
                            x1={i * 100}
                            y1="0"
                            x2={i * 100}
                            y2="200"
                            stroke="#f0dada"
                        />
                    ))}

                    <polyline
                        points={points}
                        fill="none"
                        stroke="#c62828"
                        strokeWidth="2"
                    />
                </svg>

                <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    style={{
                        marginTop: "20px",
                        padding: "12px 22px",
                        background: "#1769aa",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer"
                    }}
                >
                    {loading ? "Analyzing..." : "Analyze ECG with ML"}
                </button>

                {error && (
                    <div style={{ color: "red", marginTop: "15px" }}>
                        Error: {error}
                    </div>
                )}

                {result && (
                    <div style={{
                        marginTop: "20px",
                        padding: "15px",
                        background: "#eef7ee",
                        borderRadius: "8px"
                    }}>
                        <h3>ECG ML Analysis Result</h3>
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