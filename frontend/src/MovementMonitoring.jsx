
import { useState } from "react";
import { analyzeMovement } from "./services/mlApi";

const HEADERS = ["ax", "ay", "az", "gx", "gy", "gz"];

function createMovementSamples() {
    const samples = [];

    for (let i = 0; i < 100; i++) {
        const t = i / 10;

        const ax = 0.2 * Math.sin(t);
        const ay = 0.3 * Math.cos(t);
        const az = 9.8 + 0.1 * Math.sin(t);
        const gx = 2 * Math.sin(t);
        const gy = 2 * Math.cos(t);
        const gz = 1.5 * Math.sin(2 * t);

        samples.push([ax, ay, az, gx, gy, gz]);
    }

    return samples;
}

export default function MovementMonitoring() {
    const [simulatedSamples] = useState(createMovementSamples);
    const [samples, setSamples] = useState(createMovementSamples);
    const [source, setSource] = useState("SIMULATED");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [fileName, setFileName] = useState("");

    function handleFileUpload(event) {
        const file = event.target.files[0];

        if (!file) return;

        setError("");
        setResult(null);

        if (!file.name.toLowerCase().endsWith(".csv")) {
            setError("Please select a CSV file.");
            event.target.value = "";
            return;
        }

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const lines = e.target.result.trim().split(/\r?\n/);

                if (lines.length < 3) {
                    throw new Error("CSV must contain a header and at least 2 data rows.");
                }

                const headers = lines[0]
                    .split(",")
                    .map(value => value.trim().toLowerCase());

                if (
                    headers.length !== 6 ||
                    !HEADERS.every((header, index) => headers[index] === header)
                ) {
                    throw new Error(
                        "CSV columns must be in this order: ax, ay, az, gx, gy, gz."
                    );
                }

                const parsedSamples = lines.slice(1).map((line, index) => {
                    const values = line.split(",").map(value => value.trim());

                    if (values.length !== 6 || values.some(value => value === "")) {
                        throw new Error(`Invalid data at CSV row ${index + 2}.`);
                    }

                    const numbers = values.map(Number);

                    if (numbers.some(value => !Number.isFinite(value))) {
                        throw new Error(`Non-numeric value at CSV row ${index + 2}.`);
                    }

                    return numbers;
                });
                if (parsedSamples.length !== 100) {
                throw new Error("Movement CSV must contain exactly 100 data samples.");
                }
                setSamples(parsedSamples);
                setSource("FILE");
                setFileName(file.name);
            } catch (err) {
                setError(err.message);
                event.target.value = "";
            }
        };

        reader.onerror = () => {
            setError("Unable to read the selected CSV file.");
        };

        reader.readAsText(file);
    }

    function useSimulatedData() {
        setSamples(simulatedSamples);
        setSource("SIMULATED");
        setFileName("");
        setResult(null);
        setError("");
    }

    async function handleAnalyze() {
        setLoading(true);
        setError("");
        setResult(null);

        try {
            const response = await analyzeMovement({
                patient_id: "P001",
                samples: samples,
                source: source
            });

            setResult(response);
        } catch (err) {
            setError(err.message || "Unable to connect to Movement API.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ padding: "20px" }}>
            <h2>Movement Analysis</h2>
            <p>Accelerometer and Gyroscope Monitoring</p>

            <div style={{
                background: "white",
                padding: "20px",
                borderRadius: "10px"
            }}>
                <h3>Patient ID: P001</h3>

                <p>Sensor: MPU6050 ({source === "SIMULATED" ? "Simulated" : "CSV File"})</p>
                <p>Data Source: {source}</p>
                <p>Number of samples: {samples.length}</p>

                <h3>Select Input Method</h3>

                <button
                    onClick={useSimulatedData}
                    disabled={loading}
                    style={{
                        padding: "10px 16px",
                        marginRight: "10px",
                        background: "#1769aa",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer"
                    }}
                >
                    Use Simulated Data
                </button>

                <div style={{ marginTop: "20px" }}>
                    <label><b>Upload Movement CSV File:</b></label>
                    <br /><br />
                    <input
                        type="file"
                        accept=".csv,text/csv"
                        onChange={handleFileUpload}
                        disabled={loading}
                    />
                    {fileName && <p>Selected file: {fileName}</p>}
                </div>

                <p style={{ fontSize: "13px", color: "#555" }}>
                    Required CSV columns: ax, ay, az, gx, gy, gz
                </p>

                <h3>Sample Sensor Readings (First 5 Rows)</h3>

                <div style={{ overflowX: "auto" }}>
                    <table style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        textAlign: "center"
                    }}>
                        <thead>
                            <tr>
                                {HEADERS.map(name => (
                                    <th key={name} style={{
                                        padding: "8px",
                                        border: "1px solid #ddd"
                                    }}>
                                        {name}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {samples.slice(0, 5).map((sample, index) => (
                                <tr key={index}>
                                    {sample.map((value, j) => (
                                        <td key={j} style={{
                                            padding: "8px",
                                            border: "1px solid #ddd"
                                        }}>
                                            {value.toFixed(2)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

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
                    {loading ? "Analyzing..." : "Analyze Movement with ML"}
                </button>

                {error && (
                    <p style={{ color: "red" }}>Error: {error}</p>
                )}

                {result && (
                    <div style={{
                        marginTop: "20px",
                        padding: "15px",
                        background: "#eef7ee",
                        borderRadius: "8px"
                    }}>
                        <h3>Movement ML Analysis Result</h3>
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
