
import { useState } from "react";

export default function EmergencySupport() {
    const [patientId, setPatientId] = useState("P001");
    const [patientName, setPatientName] = useState("");
    const [contact, setContact] = useState("");
    const [location, setLocation] = useState("");
    const [emergencyType, setEmergencyType] = useState("Medical Emergency");
    const [status, setStatus] = useState("");
    const [alertTime, setAlertTime] = useState("");

    function handleEmergency() {
        if (!patientId.trim() || !patientName.trim() ||
            !contact.trim() || !location.trim()) {
            setStatus("Please fill in all patient and emergency details.");
            return;
        }

        if (!/^[0-9]{10}$/.test(contact)) {
            setStatus("Please enter a valid 10-digit contact number.");
            return;
        }

        setAlertTime(new Date().toLocaleString());
        setStatus("DEMO ALERT ACTIVATED");
    }

    function resetAlert() {
        setStatus("");
        setAlertTime("");
    }

    return (
        <div style={{ padding: "24px" }}>
            <h2>Emergency Support System</h2>
            <p>Patient Emergency Information and Alert Management</p>

            <div style={{
                background: "white",
                padding: "24px",
                borderRadius: "12px",
                maxWidth: "750px"
            }}>
                <h3>Patient Information</h3>

                <label>Patient ID</label>
                <input
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    style={inputStyle}
                />

                <label>Patient Name</label>
                <input
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Enter patient name"
                    style={inputStyle}
                />

                <label>Emergency Contact Number</label>
                <input
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="Enter 10-digit mobile number"
                    maxLength={10}
                    style={inputStyle}
                />

                <label>Patient Location</label>
                <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter hospital, area or address"
                    style={inputStyle}
                />

                <label>Emergency Type</label>
                <select
                    value={emergencyType}
                    onChange={(e) => setEmergencyType(e.target.value)}
                    style={inputStyle}
                >
                    <option>Medical Emergency</option>
                    <option>Cardiac Emergency</option>
                    <option>Breathing Difficulty</option>
                    <option>Fall or Injury</option>
                    <option>Other Emergency</option>
                </select>

                <button
                    onClick={handleEmergency}
                    style={{
                        background: "#dc2626",
                        color: "white",
                        padding: "13px 22px",
                        border: "none",
                        borderRadius: "7px",
                        cursor: "pointer",
                        marginTop: "15px",
                        fontWeight: "bold"
                    }}
                >
                    Activate Emergency Alert
                </button>

                <button
                    onClick={resetAlert}
                    style={{
                        marginLeft: "10px",
                        padding: "13px 22px",
                        border: "1px solid #999",
                        borderRadius: "7px",
                        cursor: "pointer"
                    }}
                >
                    Reset
                </button>

                {status && (
                    <div style={{
                        marginTop: "22px",
                        padding: "18px",
                        borderRadius: "8px",
                        background: status === "DEMO ALERT ACTIVATED"
                            ? "#fff0f0" : "#fff7ed",
                        border: "1px solid #f0aaaa"
                    }}>
                        <h3>{status}</h3>

                        {status === "DEMO ALERT ACTIVATED" && (
                            <>
                                <p><b>Patient:</b> {patientName}</p>
                                <p><b>Patient ID:</b> {patientId}</p>
                                <p><b>Contact:</b> {contact}</p>
                                <p><b>Location:</b> {location}</p>
                                <p><b>Emergency:</b> {emergencyType}</p>
                                <p><b>Activated at:</b> {alertTime}</p>
                                <p>
                                    Demo alert generated successfully.
                                    No real message or emergency call was sent.
                                </p>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

const inputStyle = {
    display: "block",
    width: "100%",
    padding: "11px",
    marginTop: "7px",
    marginBottom: "17px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    boxSizing: "border-box"
};
