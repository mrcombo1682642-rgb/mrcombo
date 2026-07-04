"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footbar";
import { supabase } from "@/lib/supabase";

type Step = "email" | "code" | "success";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startCooldown() {
    setResendCooldown(45);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(v => {
        if (v <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
  }

  async function handleSendCode() {
    setError("");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    setLoading(true);
    const { error: sendErr } = await supabase.auth.resetPasswordForEmail(email.trim());
    setLoading(false);

    if (sendErr) {
      setError(sendErr.message);
      return;
    }
    setStep("code");
    startCooldown();
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setError("");
    setLoading(true);
    const { error: sendErr } = await supabase.auth.resetPasswordForEmail(email.trim());
    setLoading(false);
    if (sendErr) { setError(sendErr.message); return; }
    startCooldown();
  }

  async function handleVerifyAndReset() {
    setError("");
    if (!code.trim() || code.trim().length < 6) {
      setError("Enter the 6-digit code sent to your email.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error: verifyErr } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "recovery",
    });

    if (verifyErr) {
      setLoading(false);
      setError("Invalid or expired code. Please try again or request a new one.");
      return;
    }

    const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (updateErr) {
      setError(updateErr.message);
      return;
    }

    setStep("success");
  }

  return (
    <div style={{ minHeight: "100vh", background: "#050a0f", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "100px 16px 60px" }}>
        <div style={{
          background: "#0a1520", border: "1px solid #0d2030", borderRadius: 12,
          padding: "32px 28px", width: "100%", maxWidth: 380,
        }}>

          {step === "email" && (
            <>
              <h1 style={{ color: "#e0f0ff", fontSize: 20, margin: "0 0 6px", textAlign: "center" }}>Forgot Password</h1>
              <p style={{ color: "#6a8a9a", fontSize: 13, textAlign: "center", marginBottom: 24, lineHeight: 1.6 }}>
                Enter your email and we&apos;ll send you a 6-digit verification code.
              </p>

              <input
                placeholder="Your email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSendCode()}
                style={inputStyle}
              />

              {error && <ErrorBox>{error}</ErrorBox>}

              <button onClick={handleSendCode} disabled={loading} style={btnStyle(loading)}>
                {loading ? "Sending..." : "Send Verification Code"}
              </button>

              <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#6a8a9a" }}>
                Remembered it? <Link href="/login" style={{ color: "#00b4d8", textDecoration: "none" }}>Back to Login</Link>
              </p>
            </>
          )}

          {step === "code" && (
            <>
              <h1 style={{ color: "#e0f0ff", fontSize: 20, margin: "0 0 6px", textAlign: "center" }}>Enter Code</h1>
              <p style={{ color: "#6a8a9a", fontSize: 13, textAlign: "center", marginBottom: 22, lineHeight: 1.6 }}>
                We sent a 6-digit code to <strong style={{ color: "#c8dde8" }}>{email}</strong>. Enter it below along with your new password.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input
                  placeholder="6-digit code"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  style={{ ...inputStyle, textAlign: "center", letterSpacing: 6, fontSize: 18, fontWeight: 700 }}
                  maxLength={6}
                  inputMode="numeric"
                />
                <input
                  placeholder="New password"
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  style={inputStyle}
                />
                <input
                  placeholder="Confirm new password"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleVerifyAndReset()}
                  style={inputStyle}
                />
              </div>

              {error && <ErrorBox>{error}</ErrorBox>}

              <button onClick={handleVerifyAndReset} disabled={loading} style={{ ...btnStyle(loading), marginTop: 6 }}>
                {loading ? "Verifying..." : "Reset Password"}
              </button>

              <div style={{ textAlign: "center", marginTop: 16, fontSize: 12.5, color: "#4a7a94" }}>
                Didn&apos;t get the code?{" "}
                {resendCooldown > 0 ? (
                  <span>Resend in {resendCooldown}s</span>
                ) : (
                  <span onClick={handleResend} style={{ color: "#00b4d8", cursor: "pointer" }}>Resend Code</span>
                )}
              </div>
            </>
          )}

          {step === "success" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
              <h2 style={{ color: "#e0f0ff", margin: "0 0 10px", fontSize: 20 }}>Password Reset!</h2>
              <p style={{ color: "#6a8a9a", fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
                Your password has been updated successfully. You can now log in with your new password.
              </p>
              <Link href="/login" style={{
                display: "inline-block", background: "#00b4d8", color: "#fff",
                padding: "10px 28px", borderRadius: 6, textDecoration: "none",
                fontWeight: 700, fontSize: 14,
              }}>
                Go to Login
              </Link>
            </div>
          )}

        </div>
      </div>
      <Footer />
    </div>
  );
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "#ef444415", border: "1px solid #ef444430",
      borderRadius: 6, padding: "8px 12px", color: "#ef4444", fontSize: 12.5,
      marginTop: 12,
    }}>
      {children}
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
  width: "100%",
  boxSizing: "border-box",
};

function btnStyle(loading: boolean): React.CSSProperties {
  return {
    background: "#6c63ff", border: "none", borderRadius: 6,
    padding: "11px 0", color: "#fff", fontSize: 14, fontWeight: 700,
    cursor: loading ? "not-allowed" : "pointer",
    opacity: loading ? 0.6 : 1, marginTop: 14, width: "100%",
  };
}