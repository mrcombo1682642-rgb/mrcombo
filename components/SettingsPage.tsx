"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footbar";
import { supabase } from "@/lib/supabase";

const COMING_SOON = [
  { icon: "🔒", label: "2FA Security" },
  { icon: "🎨", label: "Custom Theme Color" },
  { icon: "🪟", label: "Thread View Options" },
  { icon: "🌈", label: "Rank Hue" },
  { icon: "🖼️", label: "Postbit Background" },
  { icon: "✉️", label: "PM Settings" },
  { icon: "🏆", label: "Award Order" },
  { icon: "👥", label: "Usergroups" },
  { icon: "🙈", label: "Privacy" },
  { icon: "🔔", label: "Notifications" },
  { icon: "🕐", label: "Date & Time" },
];

export default function SettingsPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [pwError, setPwError] = useState("");

  const [newEmail, setNewEmail] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMsg, setEmailMsg] = useState("");
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { router.push("/login"); return; }
      setUser(data.user);
      setCurrentEmail(data.user.email || "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", data.user.id)
        .single();
      if (profile) setUsername(profile.username);

      setChecking(false);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleChangePassword() {
    setPwError(""); setPwMsg("");
    if (newPassword.length < 6) { setPwError("Password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setPwError("Passwords do not match."); return; }

    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwSaving(false);

    if (error) { setPwError(error.message); return; }
    setPwMsg("Password updated successfully!");
    setNewPassword(""); setConfirmPassword("");
  }

  async function handleChangeEmail() {
    setEmailError(""); setEmailMsg("");
    if (!/^\S+@\S+\.\S+$/.test(newEmail.trim())) { setEmailError("Enter a valid email address."); return; }

    setEmailSaving(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    setEmailSaving(false);

    if (error) { setEmailError(error.message); return; }
    setEmailMsg("Confirmation link sent to your new email — click it to finish the change.");
    setNewEmail("");
  }

  if (checking) {
    return (
      <div style={{ minHeight: "100vh", background: "#050a0f" }}>
        <Navbar />
        <div style={{ textAlign: "center", padding: "140px 0", color: "#4a7a94" }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#050a0f", color: "#c8dde8", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <div style={{ flex: 1, maxWidth: 760, width: "100%", margin: "0 auto", padding: "40px 16px 60px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 4 }}>⚙️ Options</h1>
        <p style={{ fontSize: 13, color: "#6a8a9a", marginBottom: 28 }}>
          User Control Panel — <strong style={{ color: "#c8dde8" }}>{username}</strong>
        </p>

        {/* ── ACCOUNT ── */}
        <SectionLabel text="ACCOUNT" />
        <div style={cardStyle}>
          <SettingRow icon="🔑" title="Change Password" desc="Update your account password.">
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
              <input type="password" placeholder="New password" value={newPassword}
                onChange={e => setNewPassword(e.target.value)} style={inputStyle} />
              <input type="password" placeholder="Confirm new password" value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)} style={inputStyle} />
              {pwError && <Msg color="#ef4444">{pwError}</Msg>}
              {pwMsg && <Msg color="#22c55e">{pwMsg}</Msg>}
              <button onClick={handleChangePassword} disabled={pwSaving || !newPassword} style={btnStyle(pwSaving || !newPassword)}>
                {pwSaving ? "Updating..." : "Update Password"}
              </button>
            </div>
          </SettingRow>

          <div style={dividerStyle} />

          <SettingRow icon="✉️" title="Change E-Mail" desc={`Current: ${currentEmail}`}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
              <input type="email" placeholder="New email address" value={newEmail}
                onChange={e => setNewEmail(e.target.value)} style={inputStyle} />
              {emailError && <Msg color="#ef4444">{emailError}</Msg>}
              {emailMsg && <Msg color="#22c55e">{emailMsg}</Msg>}
              <button onClick={handleChangeEmail} disabled={emailSaving || !newEmail} style={btnStyle(emailSaving || !newEmail)}>
                {emailSaving ? "Sending..." : "Update Email"}
              </button>
            </div>
          </SettingRow>
        </div>

        {/* ── PROFILE ── */}
        <SectionLabel text="PROFILE" />
        <div style={cardStyle}>
          <LinkRow icon="👤" title="Edit Profile" desc="Bio, Discord, Telegram, Date of Birth" href="/profile" />
          <div style={dividerStyle} />
          <LinkRow icon="🖼️" title="Change Avatar & Cover" desc="Update your profile pictures" href="/profile" />
          <div style={dividerStyle} />
          <LinkRow icon="✍️" title="Change Signature" desc="Shown under your posts" href="/profile" />
        </div>

        {/* ── PRIVILEGED ── */}
        <SectionLabel text="PRIVILEGED" />
        <div style={cardStyle}>
          <LinkRow icon="⬆️" title="Subscriptions" desc="Upgrade to VIP / VIP+ / Lifetime" href="/upgrade" />
          <div style={dividerStyle} />
          <LinkRow icon="🔤" title="Change Username" desc="VIP members only — 3x per month, admin approval required" href="/profile" />
        </div>

        {/* ── COMING SOON ── */}
        <SectionLabel text="COMING SOON" />
        <div style={{ ...cardStyle, opacity: 0.55 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            {COMING_SOON.map((item, i) => (
              <div key={item.label} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
                borderBottom: i < COMING_SOON.length - (COMING_SOON.length % 2 === 0 ? 2 : 1) ? "1px solid #0d2030" : "none",
              }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span style={{ fontSize: 12.5, color: "#6a8a9a" }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
        <p style={{ fontSize: 11.5, color: "#3d6a80", marginTop: 8, lineHeight: 1.6 }}>
          Yeh features abhi build nahi hue — jab chahein bata dein, ek ek karke add kar denge.
        </p>
      </div>

      <Footer />
    </div>
  );
}

function SectionLabel({ text }: { text: string }) {
  return <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#4a7a94", margin: "22px 0 10px" }}>{text}</div>;
}

function SettingRow({ icon, title, desc, children }: { icon: string; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 17 }}>{icon}</span>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "#e4e4e7" }}>{title}</div>
          <div style={{ fontSize: 11.5, color: "#4a7a94", marginTop: 1 }}>{desc}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

function LinkRow({ icon, title, desc, href }: { icon: string; title: string; desc: string; href: string }) {
  return (
    <Link href={href} style={{
      display: "flex", alignItems: "center", gap: 10, padding: "14px 16px",
      textDecoration: "none", transition: "background .15s",
    }}
      onMouseEnter={e => (e.currentTarget.style.background = "#0a1520")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      <span style={{ fontSize: 17 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#e4e4e7" }}>{title}</div>
        <div style={{ fontSize: 11.5, color: "#4a7a94", marginTop: 1 }}>{desc}</div>
      </div>
      <span style={{ color: "#4a7a94" }}>→</span>
    </Link>
  );
}

function Msg({ color, children }: { color: string; children: React.ReactNode }) {
  return <div style={{ fontSize: 12, color }}>{children}</div>;
}

const cardStyle: React.CSSProperties = {
  background: "#080e18", border: "1px solid #0d2030", borderRadius: 10, overflow: "hidden",
};

const dividerStyle: React.CSSProperties = { borderBottom: "1px solid #0d2030" };

const inputStyle: React.CSSProperties = {
  background: "#050a0f", border: "1px solid #0d2030", borderRadius: 6,
  padding: "9px 12px", color: "#c8dde8", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box",
};

function btnStyle(disabled: boolean): React.CSSProperties {
  return {
    background: "linear-gradient(135deg,#0077b6,#00b4d8)", border: "none", borderRadius: 6,
    padding: "9px 0", color: "#fff", fontSize: 12.5, fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
  };
}