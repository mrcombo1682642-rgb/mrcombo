"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footbar";
import { supabase } from "@/lib/supabase";

type PremiumLink = {
  id: string;
  title: string;
  url: string;
  icon: string;
  show_on_home: boolean;
  show_on_thread: boolean;
  created_at: string;
};

const ICON_PRESETS = ["🎁", "💎", "⚡", "🔥", "🏆", "💰", "🎯", "🚀", "⭐", "🔗"];

export default function AdminPremiumLinksPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [links, setLinks] = useState<PremiumLink[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [icon, setIcon] = useState("🎁");
  const [showHome, setShowHome] = useState(true);
  const [showThread, setShowThread] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    async function checkAdmin() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { router.push("/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .single();

      if (profile?.role !== "admin") {
        router.push("/");
        return;
      }
      setIsAdmin(true);
      setChecking(false);
      loadLinks();
    }
    checkAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadLinks() {
    setLoading(true);
    const { data } = await supabase
      .from("premium_links")
      .select("*")
      .order("created_at", { ascending: false });
    setLinks(data || []);
    setLoading(false);
  }

  function resetForm() {
    setTitle(""); setUrl(""); setIcon("🎁");
    setShowHome(true); setShowThread(true);
    setEditingId(null); setError("");
  }

  function startEdit(l: PremiumLink) {
    setEditingId(l.id);
    setTitle(l.title);
    setUrl(l.url);
    setIcon(l.icon || "🎁");
    setShowHome(l.show_on_home);
    setShowThread(l.show_on_thread);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSave() {
    setError("");
    if (!title.trim()) { setError("Title required."); return; }
    if (!url.trim() || !/^https?:\/\//.test(url.trim())) {
      setError("Valid URL required (must start with http:// or https://).");
      return;
    }

    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();

    if (editingId) {
      const { error: updErr } = await supabase
        .from("premium_links")
        .update({
          title: title.trim(),
          url: url.trim(),
          icon,
          show_on_home: showHome,
          show_on_thread: showThread,
        })
        .eq("id", editingId);
      if (updErr) setError(updErr.message);
    } else {
      const { error: insErr } = await supabase.from("premium_links").insert({
        title: title.trim(),
        url: url.trim(),
        icon,
        show_on_home: showHome,
        show_on_thread: showThread,
        created_by: userData.user?.id,
      });
      if (insErr) setError(insErr.message);
    }

    setSaving(false);
    if (!error) {
      resetForm();
      loadLinks();
    }
  }

  async function handleDelete(id: string) {
    await supabase.from("premium_links").delete().eq("id", id);
    loadLinks();
    if (editingId === id) resetForm();
  }

  if (checking) {
    return (
      <div style={{ minHeight: "100vh", background: "#050a0f" }}>
        <Navbar />
        <div style={{ textAlign: "center", padding: "140px 0", color: "#4a7a94" }}>Checking access...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#050a0f", color: "#c8dde8", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <div style={{ flex: 1, maxWidth: 720, width: "100%", margin: "0 auto", padding: "100px 16px 60px" }}>
        <div style={{ marginBottom: 4, fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#f0a500" }}>ADMIN ONLY</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 6 }}>
          💎 Premium Offer Links
        </h1>
        <p style={{ fontSize: 13, color: "#6a8a9a", marginBottom: 24, lineHeight: 1.6 }}>
          Yeh offers sirf VIP / VIP+ / Lifetime members ko dikhte hain — home page aur thread pages par,
          jahan aap enable karein.
        </p>

        {/* ── FORM ── */}
        <div style={{ background: "#0a1520", border: "1px solid #0d2030", borderRadius: 12, padding: 20, marginBottom: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 14 }}>
            {editingId ? "✏️ Edit Offer" : "+ New Offer"}
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>ICON</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {ICON_PRESETS.map(ic => (
                <button
                  key={ic}
                  onClick={() => setIcon(ic)}
                  style={{
                    width: 38, height: 38, borderRadius: 8, fontSize: 18, cursor: "pointer",
                    background: icon === ic ? "#6c63ff" : "#050a0f",
                    border: icon === ic ? "1px solid #6c63ff" : "1px solid #0d2030",
                  }}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>OFFER TITLE</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Free Premium Combolist Access — Members Only"
              style={inputStyle}
              maxLength={100}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>LINK URL</label>
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://..."
              style={inputStyle}
            />
          </div>

          <div style={{ display: "flex", gap: 20, marginBottom: 16 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#c8dde8", cursor: "pointer" }}>
              <input type="checkbox" checked={showHome} onChange={e => setShowHome(e.target.checked)} />
              Show on Home Page
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#c8dde8", cursor: "pointer" }}>
              <input type="checkbox" checked={showThread} onChange={e => setShowThread(e.target.checked)} />
              Show on Thread Pages
            </label>
          </div>

          {error && (
            <div style={{ background: "#ef444415", border: "1px solid #ef444430", borderRadius: 6, padding: "8px 12px", color: "#ef4444", fontSize: 12.5, marginBottom: 12 }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 1, background: "linear-gradient(135deg,#6c63ff,#00b4d8)", border: "none",
                borderRadius: 8, padding: "11px 0", color: "#fff", fontSize: 13.5, fontWeight: 700,
                cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? "Saving..." : editingId ? "Save Changes" : "Create Offer"}
            </button>
            {editingId && (
              <button
                onClick={resetForm}
                style={{ background: "#0a1520", border: "1px solid #0d2030", borderRadius: 8, padding: "11px 18px", color: "#c8dde8", fontSize: 13, cursor: "pointer" }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* ── LIVE PREVIEW ── */}
        {title.trim() && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#4a7a94", marginBottom: 10 }}>LIVE PREVIEW</div>
            <PreviewCard icon={icon} title={title} />
          </div>
        )}

        {/* ── EXISTING LIST ── */}
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#4a7a94", marginBottom: 10 }}>
          ALL OFFERS ({links.length})
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "30px 0", color: "#4a7a94" }}>Loading...</div>
        ) : links.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 0", color: "#3d6a80", fontSize: 13 }}>No offers created yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {links.map(l => (
              <div key={l.id} style={{
                background: "#0a1520", border: "1px solid #0d2030", borderRadius: 10,
                padding: "12px 14px", display: "flex", alignItems: "center", gap: 12,
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 8, background: "#050a0f",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0,
                }}>
                  {l.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {l.title}
                  </div>
                  <div style={{ fontSize: 11, color: "#4a7a94", marginTop: 2, display: "flex", gap: 8 }}>
                    {l.show_on_home && <span>🏠 Home</span>}
                    {l.show_on_thread && <span>🧵 Thread</span>}
                    {!l.show_on_home && !l.show_on_thread && <span style={{ color: "#e74c3c" }}>Hidden everywhere</span>}
                  </div>
                </div>
                <button onClick={() => startEdit(l)} style={smallBtnStyle}>Edit</button>
                <button onClick={() => handleDelete(l.id)} style={{ ...smallBtnStyle, color: "#ef4444", borderColor: "#ef444430" }}>Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

function PreviewCard({ icon, title }: { icon: string; title: string }) {
  return (
    <div style={{
      borderRadius: 14, padding: 2,
      background: "linear-gradient(90deg, #f0a500, #e91e8c, #6c63ff, #00b4d8)",
    }}>
      <div style={{
        borderRadius: 12, background: "linear-gradient(135deg, #0a0f1a 0%, #0d1424 55%, #120a22 100%)",
        padding: "16px 18px", display: "flex", alignItems: "center", gap: 14,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 12, flexShrink: 0,
          background: "linear-gradient(135deg, rgba(240,165,0,0.18), rgba(108,99,255,0.18))",
          border: "1px solid rgba(255,255,255,0.08)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: "linear-gradient(135deg, #f0a500, #e91e8c)",
            color: "#fff", fontSize: 10, fontWeight: 800, letterSpacing: 1.2,
            padding: "3px 9px", borderRadius: 20, textTransform: "uppercase",
          }}>
            Premium Exclusive
          </div>
          <div style={{
            color: "#f5f8fa", fontWeight: 700, fontSize: 14.5, marginTop: 6,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {title || "Your offer title..."}
          </div>
        </div>
        <div style={{
          flexShrink: 0, background: "linear-gradient(135deg, #6c63ff, #00b4d8)",
          color: "#fff", fontSize: 12.5, fontWeight: 700, padding: "9px 16px", borderRadius: 8,
        }}>
          Visit →
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "#4a7a94", marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#050a0f", border: "1px solid #0d2030", borderRadius: 6,
  padding: "10px 14px", color: "#c8dde8", fontSize: 13.5, outline: "none", boxSizing: "border-box",
};

const smallBtnStyle: React.CSSProperties = {
  background: "#050a0f", border: "1px solid #0d2030", borderRadius: 6,
  padding: "6px 12px", color: "#c8dde8", fontSize: 12, cursor: "pointer", flexShrink: 0,
};