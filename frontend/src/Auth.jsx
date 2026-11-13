

import { useState } from "react";
import { loginUser, registerUser } from "./services/mlApi";

function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "patient",
  });

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
    setMessage("");

    try {
      if (isLogin) {
        const data = await loginUser({
          email: form.email,
          password: form.password,
        });

        onLogin(data);
      } else {
        const data = await registerUser({
          full_name: form.full_name,
          email: form.email,
          password: form.password,
          role: form.role,
        });

        setMessage(data.message);
        setIsLogin(true);

        setForm({
          full_name: "",
          email: "",
          password: "",
          role: "patient",
        });
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        <h1>
          Health<span>Care+</span>
        </h1>

        <h2>
          {isLogin ? "Welcome Back" : "Create Your Account"}
        </h2>

        <p>AI/ML Patient Health Monitoring System</p>

        <div className="auth-switch">
          <button
            type="button"
            className={isLogin ? "selected" : ""}
            onClick={() => {
              setIsLogin(true);
              setError("");
              setMessage("");
            }}
          >
            Login
          </button>

          <button
            type="button"
            className={!isLogin ? "selected" : ""}
            onClick={() => {
              setIsLogin(false);
              setError("");
              setMessage("");
            }}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit}>

          {!isLogin && (
            <>
              <label>Full Name</label>

              <input
                type="text"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                minLength={2}
                maxLength={100}
                required
                placeholder="Enter your full name"
              />

              <label>Account Type</label>

              <select
                name="role"
                value={form.role}
                onChange={handleChange}
              >
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
              </select>
            </>
          )}

          <label>Email Address</label>

          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            placeholder="Enter your email"
          />

          <label>Password</label>

          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            minLength={isLogin ? 1 : 12}
            maxLength={128}
            required
            placeholder={
              isLogin
                ? "Enter your password"
                : "Minimum 12 characters"
            }
          />

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          {message && (
            <div className="auth-message">
              {message}
            </div>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : isLogin
              ? "Login"
              : "Create Account"}
          </button>

        </form>

        <small className="auth-footer">
          Academic software demonstration
        </small>

      </div>
    </div>
  );
}

export default Auth;
