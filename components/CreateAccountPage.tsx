"use client";

import { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footbar";
import { supabase } from "@/lib/supabase";

const EyeIcon = ({ open }: { open: boolean }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    {open ? (
      <>
        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    )}
  </svg>
);

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21v-1a8 8 0 0 1 16 0v1" />
  </svg>
);

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M2 7l10 6 10-6" />
  </svg>
);

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

function passwordStrength(pw: string) {
  if (!pw) return { score: 0, label: "", color: "#0d2030" };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { label: "Weak", color: "#ef4444" },
    { label: "Fair", color: "#f59e0b" },
    { label: "Good", color: "#00b4d8" },
    { label: "Strong", color: "#22c55e" },
  ];
  const idx = Math.min(score, levels.length - 1);
  return { score: idx + 1, ...levels[idx] };
}

export default function CreateAccountPage() {
  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => setMounted(true), []);

  const strength = useMemo(() => passwordStrength(password), [password]);

  function fail(msg: string) {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 400);
  }

  const handleSignup = async () => {
    setError("");

    if (!username.trim() || !email.trim() || !password) return fail("Please fill in all fields.");
    if (username.trim().length < 3) return fail("Username must be at least 3 characters.");
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim()))
      return fail("Username can only contain letters, numbers, and underscores.");
    if (password.length < 6) return fail("Password must be at least 6 characters.");
    if (password !== confirmPassword) return fail("Passwords do not match.");

    setLoading(true);

    const { data: existing } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", username.trim())
      .maybeSingle();

    if (existing) {
      setLoading(false);
      return fail("Username already taken. Choose another.");
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { username: username.trim() } },
    });

    if (signUpError) {
      setLoading(false);
      return fail(signUpError.message);
    }

    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").upsert(
        { id: data.user.id, username: username.trim(), join_date: new Date().toISOString() },
        { onConflict: "id" }
      );
      if (profileError) console.error("Profile upsert error:", profileError.message);
    }

    setLoading(false);
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="auth-page">
        <Navbar />
        <div className="auth-shell">
          <div className="auth-card in success-card">
            <div className="auth-topbar" />
            <div className="auth-success-icon">✅</div>
            <h1>Account Created!</h1>
            <p className="auth-sub">
              Welcome to MRCombo, <strong style={{ color: "#c8dde8" }}>{username}</strong>.
              <br />
              Please check your email to activate your account.
            </p>
            <a href="/login" className="auth-btn auth-btn-cyan auth-btn-link">
              Go to Login
            </a>
          </div>
        </div>
        <Footer />
        <style>{sharedStyles}</style>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <Navbar />
      <div className="auth-shell">
        <div className={`auth-card ${mounted ? "in" : ""} ${shake ? "shake" : ""}`}>
          <div className="auth-topbar" />
          <div className="auth-logo">MRCOMBO</div>
          <h1>Create Account</h1>
          <p className="auth-sub">Join the MRCombo community</p>

          <div className="auth-field">
            <span className="auth-icon"><UserIcon /></span>
            <input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={20}
            />
          </div>
          <div className="auth-hint">3–20 characters. Cannot be changed without subscription.</div>

          <div className="auth-field">
            <span className="auth-icon"><MailIcon /></span>
            <input
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="auth-field">
            <span className="auth-icon"><LockIcon /></span>
            <input
              placeholder="Password"
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="button" className="auth-eye" onClick={() => setShowPass(!showPass)}>
              <EyeIcon open={showPass} />
            </button>
          </div>

          {password && (
            <div className="auth-strength">
              <div className="auth-strength-bars">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="auth-strength-bar"
                    style={{ background: i < strength.score ? strength.color : "#0d2030" }}
                  />
                ))}
              </div>
              <span className="auth-strength-label" style={{ color: strength.color }}>
                {strength.label}
              </span>
            </div>
          )}

          <div className="auth-field" style={{ marginTop: password ? 12 : 0 }}>
            <span className="auth-icon"><LockIcon /></span>
            <input
              placeholder="Confirm Password"
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSignup()}
            />
            <button type="button" className="auth-eye" onClick={() => setShowConfirm(!showConfirm)}>
              <EyeIcon open={showConfirm} />
            </button>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button className="auth-btn" onClick={handleSignup} disabled={loading}>
            {loading ? <span className="auth-spinner" /> : "Create Account"}
          </button>

          <p className="auth-footer-text">
            Already have an account? <a href="/login">Log in</a>
          </p>
        </div>
      </div>
      <Footer />
      <style>{sharedStyles}</style>
    </div>
  );
}

const sharedStyles = `
  .auth-page {
    min-height: 100vh;
    background: #050a0f;
    display: flex;
    flex-direction: column;
  }
  .auth-shell {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 100px 16px 60px;
  }
  .auth-card {
    position: relative;
    background: #0a1520;
    border: 1px solid #0d2030;
    border-radius: 14px;
    padding: 34px 30px 28px;
    width: 100%;
    max-width: 380px;
    overflow: hidden;
    box-shadow: 0 25px 60px -25px rgba(0, 180, 216, 0.15);
    opacity: 0;
    transform: translateY(14px);
    transition: opacity 0.45s ease, transform 0.45s ease;
  }
  .auth-card.in { opacity: 1; transform: translateY(0); }
  .auth-card.shake { animation: authShake 0.4s ease; }
  @keyframes authShake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-6px); }
    75% { transform: translateX(6px); }
  }
  .auth-topbar {
    position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, #00b4d8, #6c63ff);
  }
  .auth-logo {
    text-align: center; font-weight: 800; font-size: 15px; letter-spacing: 1.5px;
    background: linear-gradient(90deg, #00b4d8, #6c63ff);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    margin-bottom: 18px;
  }
  .auth-page h1 { color: #e0f0ff; font-size: 21px; margin: 0 0 6px; text-align: center; font-weight: 700; }
  .auth-sub { color: #6a8a9a; font-size: 13px; text-align: center; margin: 0 0 22px; line-height: 1.5; }
  .auth-field {
    position: relative; display: flex; align-items: center;
    background: #050a0f; border: 1px solid #0d2030; border-radius: 8px;
    margin-bottom: 12px; transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }
  .auth-field:focus-within { border-color: #00b4d8; box-shadow: 0 0 0 3px rgba(0,180,216,0.1); }
  .auth-icon { display: flex; align-items: center; padding-left: 13px; color: #4a7a94; }
  .auth-field input { flex: 1; background: transparent; border: none; outline: none; padding: 11px 12px; color: #c8dde8; font-size: 14px; }
  .auth-eye { background: none; border: none; color: #4a7a94; padding: 0 12px; cursor: pointer; display: flex; align-items: center; }
  .auth-hint { font-size: 11px; color: #4a7a94; margin: -6px 0 12px 2px; }
  .auth-strength { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
  .auth-strength-bars { display: flex; gap: 4px; flex: 1; }
  .auth-strength-bar { height: 4px; flex: 1; border-radius: 2px; transition: background 0.2s ease; }
  .auth-strength-label { font-size: 11px; font-weight: 700; min-width: 40px; text-align: right; }
  .auth-error {
    background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25);
    border-radius: 6px; padding: 9px 12px; color: #ef4444; font-size: 12.5px; margin-bottom: 12px;
  }
  .auth-btn {
    width: 100%; background: linear-gradient(90deg, #6c63ff, #7d76ff); border: none;
    border-radius: 8px; padding: 12px 0; color: #fff; font-size: 14px; font-weight: 700;
    cursor: pointer; margin-top: 4px; display: flex; align-items: center; justify-content: center;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  .auth-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 20px -8px rgba(108,99,255,0.5); }
  .auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .auth-btn-cyan { background: linear-gradient(90deg, #00b4d8, #33c6e0); }
  .auth-btn-link { text-decoration: none; display: inline-flex; padding: 11px 28px; margin-top: 8px; }
  .auth-spinner {
    width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.35);
    border-top-color: #fff; border-radius: 50%; animation: authSpin 0.7s linear infinite;
  }
  @keyframes authSpin { to { transform: rotate(360deg); } }
  .auth-footer-text { text-align: center; margin-top: 20px; font-size: 13px; color: #6a8a9a; }
  .auth-footer-text a { color: #00b4d8; text-decoration: none; }
  .auth-footer-text a:hover { text-decoration: underline; }
  .success-card { text-align: center; }
  .auth-success-icon { font-size: 42px; margin-bottom: 12px; }
`;