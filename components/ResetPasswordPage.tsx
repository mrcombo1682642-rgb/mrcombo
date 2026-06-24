 "use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footbar";

const inputStyle: React.CSSProperties = {
  background: "#050a0f",
  border: "1px solid #0d2030",
  borderRadius: 6,
  padding: "10px 14px",
  color: "#c8dde8",
  fontSize: 14,
  outline: "none",
  width: "100%",
};

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleReset = async () => {
    setError("");
    if (!password || !confirm) { setError("Please fill in all fields."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) { setError(error.message); return; }
    setDone(true);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#050a0f", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "100px 16px 60px" }}>
        <div style={{ background: "#0a1520", border: "1px solid #0d2030", borderRadius: 12, padding: "32px 28px", width: "100%", maxWidth: 380 }}>

          {done ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 44, marginBottom: 16 }}>✅</div>
              <h2 style={{ color: "#e0f0ff", fontSize: 20, margin: "0 0 10px" }}>Password Updated!</h2>
              <p style={{ color: "#6a8a9a", fontSize: 13, marginBottom: 24 }}>Your password has been changed successfully.</p>
              <a href="/login" style={{ display: "inline-block", background: "#6c63ff", color: "#fff", padding: "10px 28px", borderRadius: 6, textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
                Go to Login
              </a>
            </div>
          ) : (
            <>
              <h1 style={{ color: "#e0f0ff", fontSize: 22, margin: "0 0 6px", textAlign: "center" }}>Reset Password</h1>
              <p style={{ color: "#6a8a9a", fontSize: 13, textAlign: "center", marginBottom: 24 }}>Enter your new password</p>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input type="password" placeholder="New password" value={password}
                  onChange={e => setPassword(e.target.value)} style={inputStyle} />
                <input type="password" placeholder="Confirm new password" value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleReset()}
                  style={inputStyle} />

                {error && (
                  <div style={{ background: "#ef444415", border: "1px solid #ef444430", borderRadius: 6, padding: "8px 12px", color: "#ef4444", fontSize: 13 }}>
                    {error}
                  </div>
                )}

                <button onClick={handleReset} disabled={loading} style={{
                  background: "#6c63ff", border: "none", borderRadius: 6,
                  padding: "11px 0", color: "#fff", fontSize: 14, fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1,
                }}>
                  {loading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
