"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footbar";
import { supabase } from "@/lib/supabase";

type View = "login" | "forgot-email" | "forgot-code" | "forgot-newpass" | "forgot-done";

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

export default function LoginPage() {
  const [view, setView] = useState<View>("login");
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newPass2, setNewPass2] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  function fail(msg: string) {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 400);
  }

  const handleLogin = async () => {
    setError("");
    if (!email.trim() || !password.trim()) return fail("Please fill in all fields.");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) return fail(error.message);
    window.location.href = "/";
  };

  const sendCode = async () => {
    setError("");
    if (!email.trim()) return fail("Please enter your email address.");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    setLoading(false);
    if (error) return fail(error.message);
    setView("forgot-code");
    setCooldown(45);
  };

  const verifyCode = async () => {
    setError("");
    if (code.trim().length < 6) return fail("Enter the full verification code.");
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "recovery",
    });
    setLoading(false);
    if (error) return fail("Invalid or expired code. Please try again.");
    setView("forgot-newpass");
  };

  const updatePassword = async () => {
    setError("");
    if (newPass.length < 6) return fail("Password must be at least 6 characters.");
    if (newPass !== newPass2) return fail("Passwords do not match.");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPass });
    setLoading(false);
    if (error) return fail(error.message);
    setView("forgot-done");
    setTimeout(() => {
      setView("login");
      setEmail("");
      setPassword("");
      setCode("");
      setNewPass("");
      setNewPass2("");
    }, 2500);
  };

  const resetToLogin = () => {
    setView("login");
    setError("");
    setCode("");
  };

  return (
    <div className="auth-page">
      <Navbar />
      <div className="auth-shell">
        <div className={`auth-card ${mounted ? "in" : ""} ${shake ? "shake" : ""}`}>
          <div className="auth-topbar" />
          <div className="auth-logo">MRCOMBO</div>

          {view === "login" && (
            <>
              <h1>Welcome Back</h1>
              <p className="auth-sub">Sign in to your MRCombo account</p>

              <div className="auth-field">
                <span className="auth-icon"><MailIcon /></span>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="auth-field">
                <span className="auth-icon"><LockIcon /></span>
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
                <button type="button" className="auth-eye" onClick={() => setShowPass(!showPass)}>
                  <EyeIcon open={showPass} />
                </button>
              </div>

              <div className="auth-forgot-row">
                <span
                  onClick={() => {
                    setView("forgot-email");
                    setError("");
                  }}
                  className="auth-link"
                >
                  Forgot password?
                </span>
              </div>

              {error && <div className="auth-error">{error}</div>}

              <button className="auth-btn" onClick={handleLogin} disabled={loading}>
                {loading ? <span className="auth-spinner" /> : "Login"}
              </button>

              <p className="auth-footer-text">
                Don&apos;t have an account? <a href="/createaccount">Create Account</a>
              </p>
            </>
          )}

          {view === "forgot-email" && (
            <>
              <button className="auth-back" onClick={resetToLogin}>← Back to Login</button>
              <h1>Forgot Password</h1>
              <p className="auth-sub">Enter your email — we&apos;ll send a verification code</p>

              <div className="auth-field">
                <span className="auth-icon"><MailIcon /></span>
                <input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendCode()}
                />
              </div>

              {error && <div className="auth-error">{error}</div>}

              <button className="auth-btn auth-btn-cyan" onClick={sendCode} disabled={loading}>
                {loading ? <span className="auth-spinner" /> : "Send Code"}
              </button>
            </>
          )}

          {view === "forgot-code" && (
            <>
              <button className="auth-back" onClick={resetToLogin}>← Back to Login</button>
              <h1>Enter Verification Code</h1>
              <p className="auth-sub">
                We sent a verification code to <strong>{email}</strong>
              </p>

              <input
                className="auth-code-input"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                placeholder="••••••••"
                inputMode="numeric"
                onKeyDown={(e) => e.key === "Enter" && verifyCode()}
              />

              {error && <div className="auth-error">{error}</div>}

              <button className="auth-btn auth-btn-cyan" onClick={verifyCode} disabled={loading}>
                {loading ? <span className="auth-spinner" /> : "Verify Code"}
              </button>

              <button className="auth-resend" onClick={sendCode} disabled={cooldown > 0 || loading}>
                {cooldown > 0 ? `Resend code (${cooldown}s)` : "Didn't get it? Resend code"}
              </button>
            </>
          )}

          {view === "forgot-newpass" && (
            <>
              <h1>Set New Password</h1>
              <p className="auth-sub">Choose a new password for your account</p>

              <div className="auth-field">
                <span className="auth-icon"><LockIcon /></span>
                <input
                  type={showNewPass ? "text" : "password"}
                  placeholder="New password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                />
                <button type="button" className="auth-eye" onClick={() => setShowNewPass(!showNewPass)}>
                  <EyeIcon open={showNewPass} />
                </button>
              </div>

              <div className="auth-field">
                <span className="auth-icon"><LockIcon /></span>
                <input
                  type={showNewPass ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={newPass2}
                  onChange={(e) => setNewPass2(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && updatePassword()}
                />
              </div>

              {error && <div className="auth-error">{error}</div>}

              <button className="auth-btn" onClick={updatePassword} disabled={loading}>
                {loading ? <span className="auth-spinner" /> : "Update Password"}
              </button>
            </>
          )}

          {view === "forgot-done" && (
            <div className="auth-success">
              <div className="auth-success-icon">✅</div>
              <h1>Password Updated!</h1>
              <p className="auth-sub">Taking you back to login…</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
      <style>{loginStyles}</style>
    </div>
  );
}

const loginStyles = `
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
  .auth-card.in {
    opacity: 1;
    transform: translateY(0);
  }
  .auth-card.shake {
    animation: authShake 0.4s ease;
  }
  @keyframes authShake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-6px); }
    75% { transform: translateX(6px); }
  }
  .auth-topbar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #00b4d8, #6c63ff);
  }
  .auth-logo {
    text-align: center;
    font-weight: 800;
    font-size: 15px;
    letter-spacing: 1.5px;
    background: linear-gradient(90deg, #00b4d8, #6c63ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 18px;
  }
  .auth-page h1 {
    color: #e0f0ff;
    font-size: 21px;
    margin: 0 0 6px;
    text-align: center;
    font-weight: 700;
  }
  .auth-sub {
    color: #6a8a9a;
    font-size: 13px;
    text-align: center;
    margin: 0 0 22px;
    line-height: 1.5;
  }
  .auth-field {
    position: relative;
    display: flex;
    align-items: center;
    background: #050a0f;
    border: 1px solid #0d2030;
    border-radius: 8px;
    margin-bottom: 12px;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }
  .auth-field:focus-within {
    border-color: #00b4d8;
    box-shadow: 0 0 0 3px rgba(0, 180, 216, 0.1);
  }
  .auth-icon {
    display: flex;
    align-items: center;
    padding-left: 13px;
    color: #4a7a94;
  }
  .auth-field input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    padding: 11px 12px;
    color: #c8dde8;
    font-size: 14px;
  }
  .auth-eye {
    background: none;
    border: none;
    color: #4a7a94;
    padding: 0 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
  }
  .auth-forgot-row {
    text-align: right;
    margin: -2px 0 6px;
  }
  .auth-link {
    font-size: 12px;
    color: #00b4d8;
    cursor: pointer;
  }
  .auth-link:hover {
    text-decoration: underline;
  }
  .auth-error {
    background: rgba(239, 68, 68, 0.08);
    border: 1px solid rgba(239, 68, 68, 0.25);
    border-radius: 6px;
    padding: 9px 12px;
    color: #ef4444;
    font-size: 12.5px;
    margin-bottom: 12px;
  }
  .auth-btn {
    width: 100%;
    background: linear-gradient(90deg, #6c63ff, #7d76ff);
    border: none;
    border-radius: 8px;
    padding: 12px 0;
    color: #fff;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    margin-top: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  .auth-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 20px -8px rgba(108, 99, 255, 0.5);
  }
  .auth-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .auth-btn-cyan {
    background: linear-gradient(90deg, #00b4d8, #33c6e0);
  }
  .auth-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.35);
    border-top-color: #fff;
    border-radius: 50%;
    animation: authSpin 0.7s linear infinite;
  }
  @keyframes authSpin {
    to { transform: rotate(360deg); }
  }
  .auth-back {
    background: none;
    border: none;
    color: #4a7a94;
    font-size: 13px;
    cursor: pointer;
    padding: 0;
    margin-bottom: 16px;
  }
  .auth-back:hover {
    color: #6a8a9a;
  }
  .auth-code-input {
    width: 100%;
    box-sizing: border-box;
    background: #050a0f;
    border: 1px solid #0d2030;
    border-radius: 8px;
    padding: 14px;
    color: #00b4d8;
    font-size: 24px;
    font-weight: 800;
    letter-spacing: 8px;
    text-align: center;
    outline: none;
    margin-bottom: 12px;
  }
  .auth-code-input:focus {
    border-color: #00b4d8;
    box-shadow: 0 0 0 3px rgba(0, 180, 216, 0.1);
  }
  .auth-resend {
    width: 100%;
    background: none;
    border: none;
    color: #6a8a9a;
    font-size: 12.5px;
    margin-top: 14px;
    cursor: pointer;
  }
  .auth-resend:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .auth-resend:hover:not(:disabled) {
    color: #00b4d8;
  }
  .auth-footer-text {
    text-align: center;
    margin-top: 20px;
    font-size: 13px;
    color: #6a8a9a;
  }
  .auth-footer-text a {
    color: #00b4d8;
    text-decoration: none;
  }
  .auth-footer-text a:hover {
    text-decoration: underline;
  }
  .auth-success {
    text-align: center;
  }
  .auth-success-icon {
    font-size: 42px;
    margin-bottom: 12px;
  }
`;