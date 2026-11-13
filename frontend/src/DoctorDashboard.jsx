
import { useEffect, useState } from "react";

function DoctorDashboard({ currentUser, authToken, onLogout }) {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadPatients() {
            try {
                const response = await fetch(
                    "http://127.0.0.1:8000/auth/doctor/patients",
                    {
                        headers: {
                            Authorization: `Bearer ${authToken}`
                        }
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.detail || "Failed to load patients");
                }

                setPatients(data.patients);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        loadPatients();
    }, [authToken]);

    return (
        <div style={{ padding: "30px", fontFamily: "Arial" }}>
            <header style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
            }}>
                <div>
                    <h1>HealthCare+ Doctor Dashboard</h1>
                    <p>Welcome, Dr. {currentUser.full_name}</p>
                </div>

                <button onClick={onLogout}>Logout</button>
            </header>

            <hr />

            <h2>Patient Management</h2>
            <h3>Total Patients: {patients.length}</h3>

            {loading && <p>Loading patients...</p>}
            {error && <p>{error}</p>}

            {!loading && !error && (
                <table style={{
                    width: "100%",
                    borderCollapse: "collapse"
                }}>
                    <thead>
                        <tr>
                            <th>Patient ID</th>
                            <th>Patient Name</th>
                            <th>Email</th>
                        </tr>
                    </thead>

                    <tbody>
                        {patients.map(patient => (
                            <tr key={patient.id}>
                                <td>{patient.id}</td>
                                <td>{patient.full_name}</td>
                                <td>{patient.email}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {!loading && patients.length === 0 && !error && (
                <p>No registered patients found.</p>
            )}
        </div>
    );
}

export default DoctorDashboard;
