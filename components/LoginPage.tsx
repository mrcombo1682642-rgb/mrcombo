"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footbar";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    window.location.href = "/";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050a0f",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Navbar />

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "100px 16px 60px",
        }}
      >
        <div
          style={{
            background: "#0a1520",
            border: "1px solid #0d2030",
            borderRadius: 12,
            padding: "32px 28px",
            width: "100%",
            maxWidth: 380,
          }}
        >
          <h1
            style={{
              color: "#e0f0ff",
              fontSize: 22,
              margin: "0 0 6px",
              textAlign: "center",
            }}
          >
            Login
          </h1>

          <p
            style={{
              color: "#6a8a9a",
              fontSize: 13,
              textAlign: "center",
              marginBottom: 24,
            }}
          >
            Sign in to your MRCombo account
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              style={inputStyle}
            />

            {error && (
              <div
                style={{
                  background: "#ef444415",
                  border: "1px solid #ef444430",
                  borderRadius: 6,
                  padding: "8px 12px",
                  color: "#ef4444",
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
                background: "#6c63ff",
                border: "none",
                borderRadius: 6,
                padding: "11px 0",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
                marginTop: 6,
              }}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>

          <p
            style={{
              textAlign: "center",
              marginTop: 20,
              fontSize: 13,
              color: "#6a8a9a",
            }}
          >
            Don't have an account?{" "}
            <a
              href="/createaccount"
              style={{
                color: "#00b4d8",
                textDecoration: "none",
              }}
            >
              Create Account
            </a>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "#050a0f",
  border: "1px solid #0d2030",
  borderRadius: 6,
  padding: "10px 14px",
  color: "#c8dde8",
  fontSize: 14,
  outline: "none",
};