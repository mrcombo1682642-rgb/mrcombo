"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footbar";
import { supabase } from "@/lib/supabase";

export default function CreateAccountPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSignup = async () => {
    setError("");

    if (!username.trim() || !email.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    // Check if username is taken
    const { data: existing } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", username.trim())
      .maybeSingle();

    if (existing) {
      setLoading(false);
      setError("Username already taken. Choose another.");
      return;
    }

    // Sign up with Supabase Auth
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }

    if (data.user) {
      // Create profile row
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        username: username.trim(),
      });

      if (profileError) {
        setLoading(false);
        setError("Account created but profile setup failed: " + profileError.message);
        return;
      }
    }

    setLoading(false);
    setSuccess(true);
  };

  if (success) {
    return (
      <div style={{ minHeight: "100vh", background: "#050a0f", display: "flex", flexDirection: "column" }}>
        <Navbar />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "100px 16px" }}>
          <div style={{ background: "#0a1520", border: "1px solid #0d2030", borderRadius: 12, padding: "40px 32px", textAlign: "center", maxWidth: 420 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
            <h2 style={{ color: "#e0f0ff", margin: "0 0 10px", fontSize: 20 }}>Account Created!</h2>
            <p style={{ color: "#6a8a9a", fontSize: 14, marginBottom: 24 }}>
              Welcome to MRCombo, {username}! You can now log in.
            </p>
            <a href="/login" style={{
              display: "inline-block", background: "#00b4d8", color: "#fff",
              padding: "10px 28px", borderRadius: 6, textDecoration: "none", fontWeight: 700, fontSize: 14,
            }}>
              Go to Login
            </a>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#050a0f", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "100px 16px 60px" }}>
        <div style={{ background: "#0a1520", border: "1px solid #0d2030", borderRadius: 12, padding: "32px 28px", width: "100%", maxWidth: 380 }}>
          <h1 style={{ color: "#e0f0ff", fontSize: 22, margin: "0 0 6px", textAlign: "center" }}>Create Account</h1>
          <p style={{ color: "#6a8a9a", fontSize: 13, textAlign: "center", marginBottom: 24 }}>
            Join the MRCombo community
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={inputStyle}
              maxLength={20}
            />
            <input
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />
            <input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
            <input
              placeholder="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSignup()}
              style={inputStyle}
            />

            {error && (
              <div style={{ background: "#ef444415", border: "1px solid #ef444430", borderRadius: 6, padding: "8px 12px", color: "#ef4444", fontSize: 13 }}>
                {error}
              </div>
            )}

            <button
              onClick={handleSignup}
              disabled={loading}
              style={{
                background: "#6c63ff", border: "none", borderRadius: 6,
                padding: "11px 0", color: "#fff", fontSize: 14, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, marginTop: 6,
              }}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </div>

          <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#6a8a9a" }}>
            Already have an account?{" "}
            <a href="/login" style={{ color: "#00b4d8", textDecoration: "none" }}>Log in</a>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "#050a0f", border: "1px solid #0d2030", borderRadius: 6,
  padding: "10px 14px", color: "#c8dde8", fontSize: 14, outline: "none",
};