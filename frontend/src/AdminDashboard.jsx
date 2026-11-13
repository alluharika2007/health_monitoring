
import { useEffect, useState } from "react";

function AdminDashboard({ currentUser, authToken, onLogout }) {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    const loadDoctors = async () => {
        try {
            const response = await fetch(
                "http://127.0.0.1:8000/auth/admin/doctors",
                {
                    headers: {
                        Authorization: `Bearer ${authToken}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error("Unable to load doctors");
            }

            const data = await response.json();
            setDoctors(data.doctors);
        } catch (error) {
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    const updateDoctor = async (doctorId, action) => {
        try {
            const response = await fetch(
                `http://127.0.0.1:8000/auth/admin/doctors/${doctorId}/${action}`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${authToken}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Action failed");
            }

            setMessage(data.message);
            loadDoctors();
        } catch (error) {
            setMessage(error.message);
        }
    };

    useEffect(() => {
        loadDoctors();
    }, []);

    const pending = doctors.filter(
        doctor => doctor.doctor_status === "pending"
    ).length;

    const approved = doctors.filter(
        doctor => doctor.doctor_status === "approved"
    ).length;

    return (
        <div style={{ padding: "30px", fontFamily: "Arial" }}>
            <header style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
            }}>
                <div>
                    <h1>HealthCare+ Admin Dashboard</h1>
                    <p>Welcome, {currentUser.full_name}</p>
                </div>

                <button onClick={onLogout}>Logout</button>
            </header>

            <hr />

            <h2>Dashboard Overview</h2>

            <div style={{
                display: "flex",
                gap: "20px",
                margin: "25px 0",
                flexWrap: "wrap"
            }}>
                <div>
                    <h3>Total Doctors</h3>
                    <h2>{doctors.length}</h2>
                </div>

                <div>
                    <h3>Pending Approvals</h3>
                    <h2>{pending}</h2>
                </div>

                <div>
                    <h3>Approved Doctors</h3>
                    <h2>{approved}</h2>
                </div>
            </div>

            <hr />

            <h2>Doctor Management</h2>

            {message && <p>{message}</p>}

            {loading ? (
                <p>Loading doctors...</p>
            ) : doctors.length === 0 ? (
                <p>No doctors registered yet.</p>
            ) : (
                <div style={{ overflowX: "auto" }}>
                    <table style={{
                        width: "100%",
                        borderCollapse: "collapse"
                    }}>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {doctors.map(doctor => (
                                <tr key={doctor.id}>
                                    <td>{doctor.full_name}</td>
                                    <td>{doctor.email}</td>
                                    <td>{doctor.doctor_status}</td>
                                    <td>
                                        {doctor.doctor_status !== "approved" && (
                                            <button
                                                onClick={() =>
                                                    updateDoctor(
                                                        doctor.id,
                                                        "approve"
                                                    )
                                                }
                                            >
                                                Approve
                                            </button>
                                        )}

                                        {doctor.doctor_status !== "rejected" && (
                                            <button
                                                onClick={() =>
                                                    updateDoctor(
                                                        doctor.id,
                                                        "reject"
                                                    )
                                                }
                                                style={{ marginLeft: "8px" }}
                                            >
                                                Reject
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default AdminDashboard;
