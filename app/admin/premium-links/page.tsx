"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const THEME_OPTIONS = [
  { value: "gold", label: "Gold Rush", swatch: "linear-gradient(135deg,#ffd76a,#ffb238)" },
  { value: "purple", label: "Royal Purple", swatch: "linear-gradient(135deg,#c084fc,#8b5cf6)" },
  { value: "emerald", label: "Emerald Elite", swatch: "linear-gradient(135deg,#6ee7b7,#10b981)" },
  { value: "ruby", label: "Ruby Red", swatch: "linear-gradient(135deg,#ff8fa3,#ff3b57)" },
  { value: "diamond", label: "Diamond Blue", swatch: "linear-gradient(135deg,#7dd3fc,#38bdf8)" },
];

const THEME_CARD_BG: Record<string, string> = {
  gold: "linear-gradient(135deg,#3a2c00 0%,#5c4400 40%,#3a2c00 100%)",
  purple: "linear-gradient(135deg,#241033 0%,#3d1a5c 40%,#241033 100%)",
  emerald: "linear-gradient(135deg,#052e1f 0%,#0a4f34 40%,#052e1f 100%)",
  ruby: "linear-gradient(135deg,#330a10 0%,#5c111c 40%,#330a10 100%)",
  diamond: "linear-gradient(135deg,#031b2e 0%,#0a3a5c 40%,#031b2e 100%)",
};

type LinkRow = {
  id: string;
  title: string;
  description: string | null;
  url: string;
  icon: string | null;
  image_url: string | null;
  badge_text: string | null;
  cta_text: string | null;
  theme: string | null;
  show_on_home: boolean;
  show_on_thread: boolean;
  active: boolean;
  expires_at: string | null;
  priority: number;
  created_at: string;
};

const EMPTY_FORM = {
  title: "",
  description: "",
  url: "",
  icon: "🎁",
  image_url: "",
  badge_text: "PREMIUM",
  cta_text: "Claim Offer",
  theme: "gold",
  show_on_home: true,
  show_on_thread: true,
  active: true,
  expires_at: "",
  priority: 0,
  thread_id: "",
};

export default function AdminPremiumLinksPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) {
        router.push("/");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", auth.user.id)
        .single();

      if (profile?.role !== "admin") {
        router.push("/");
        return;
      }
      setIsAdmin(true);
      setChecking(false);
      loadLinks();
    })();
  }, []);

  async function loadLinks() {
    const { data } = await supabase
      .from("premium_links")
      .select("*")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });
    if (data) setLinks(data as LinkRow[]);
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  function editLink(l: LinkRow) {
    setForm({
      title: l.title || "",
      description: l.description || "",
      url: l.url || "",
      icon: l.icon || "🎁",
      image_url: l.image_url || "",
      badge_text: l.badge_text || "PREMIUM",
      cta_text: l.cta_text || "Claim Offer",
      theme: l.theme || "gold",
      show_on_home: l.show_on_home,
      show_on_thread: l.show_on_thread,
      active: l.active,
      expires_at: l.expires_at ? l.expires_at.slice(0, 16) : "",
      priority: l.priority || 0,
      thread_id: (l as any).thread_id || "",
    });
    setEditingId(l.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveLink() {
    if (!form.title.trim() || !form.url.trim()) {
      setMsg("Title aur URL zaroori hain.");
      return;
    }
    setSaving(true);
    setMsg("");

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      url: form.url.trim(),
      icon: form.icon.trim() || "🎁",
      image_url: form.image_url.trim() || null,
      badge_text: form.badge_text.trim() || "PREMIUM",
      cta_text: form.cta_text.trim() || "Claim Offer",
      theme: form.theme,
      show_on_home: form.show_on_home,
      show_on_thread: form.show_on_thread,
      active: form.active,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      priority: Number(form.priority) || 0,
    };

    const query = editingId
      ? supabase.from("premium_links").update(payload).eq("id", editingId)
      : supabase.from("premium_links").insert(payload);

    const { error } = await query;
    setSaving(false);

    if (error) {
      setMsg("Error: " + error.message);
      return;
    }
    setMsg(editingId ? "Update ho gaya ✅" : "Naya offer create ho gaya ✅");
    resetForm();
    loadLinks();
  }

  async function deleteLink(id: string) {
    if (!confirm("Yeh offer delete karna hai?")) return;
    await supabase.from("premium_links").delete().eq("id", id);
    loadLinks();
  }

  async function toggleActive(l: LinkRow) {
    await supabase
      .from("premium_links")
      .update({ active: !l.active })
      .eq("id", l.id);
    loadLinks();
  }

  if (checking) {
    return <div style={{ padding: 40, color: "#fff" }}>Checking access…</div>;
  }
  if (!isAdmin) return null;

  const themeBg = THEME_CARD_BG[form.theme] || THEME_CARD_BG.gold;

  return (
    <div className="pl-admin">
      <h1>Premium Offers / Links</h1>
      <p className="pl-sub">
        Yeh offers sirf premium (upgraded) users ko nazar aayenge — jahan aap
        toggle karein (home page / thread page).
      </p>

      <div className="pl-grid">
        {/* ── FORM ─────────────────────────── */}
        <div className="pl-form-box">
          <h2>{editingId ? "Offer Edit karein" : "Naya Offer Banayein"}</h2>

          <label>Title *</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. 50% Off Lifetime Upgrade"
          />

          <label>Description (chhota, optional)</label>
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="e.g. Sirf 24 ghante ke liye"
          />

          <label>Link URL *</label>
          <input
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="https://..."
          />

          <div className="pl-row-2">
            <div>
              <label>Icon (emoji)</label>
              <input
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                placeholder="🎁"
              />
            </div>
            <div>
              <label>Ya Image URL (icon ki jagah)</label>
              <input
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="https://...png"
              />
            </div>
          </div>

          <div className="pl-row-2">
            <div>
              <label>Badge Text</label>
              <input
                value={form.badge_text}
                onChange={(e) => setForm({ ...form, badge_text: e.target.value })}
                placeholder="PREMIUM"
              />
            </div>
            <div>
              <label>Button Text</label>
              <input
                value={form.cta_text}
                onChange={(e) => setForm({ ...form, cta_text: e.target.value })}
                placeholder="Claim Offer"
              />
            </div>
          </div>

          <label>Theme</label>
          <div className="pl-theme-picker">
            {THEME_OPTIONS.map((t) => (
              <button
                type="button"
                key={t.value}
                className={`pl-swatch ${form.theme === t.value ? "active" : ""}`}
                style={{ background: t.swatch }}
                onClick={() => setForm({ ...form, theme: t.value })}
                title={t.label}
              />
            ))}
            <span className="pl-theme-label">
              {THEME_OPTIONS.find((t) => t.value === form.theme)?.label}
            </span>
          </div>

          <div className="pl-row-2">
            <div>
              <label>Expiry (optional)</label>
              <input
                type="datetime-local"
                value={form.expires_at}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
              />
            </div>
            <div>
              <label>Priority (bara number = upar dikhega)</label>
              <input
                type="number"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              />
            </div>
          </div>

          <div className="pl-toggles">
            <label className="pl-check">
              <input
                type="checkbox"
                checked={form.show_on_home}
                onChange={(e) =>
                  setForm({ ...form, show_on_home: e.target.checked })
                }
              />
              Home page par dikhaayein
            </label>
            <label className="pl-check">
              <input
                type="checkbox"
                checked={form.show_on_thread}
                onChange={(e) =>
                  setForm({ ...form, show_on_thread: e.target.checked })
                }
              />
              Thread page par dikhaayein
            </label>
            <label className="pl-check">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              Active (live)
            </label>
          </div>

          {msg && <div className="pl-msg">{msg}</div>}

          <div className="pl-form-actions">
            <button className="pl-btn-primary" onClick={saveLink} disabled={saving}>
              {saving ? "Saving…" : editingId ? "Update Karein" : "Create Karein"}
            </button>
            {editingId && (
              <button className="pl-btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* ── LIVE PREVIEW ─────────────────────────── */}
        <div className="pl-preview-box">
          <h2>Live Preview</h2>
          <a
            className="pl-preview-card"
            style={{ background: themeBg }}
            href="#"
            onClick={(e) => e.preventDefault()}
          >
            <span className="pl-preview-shine" />
            <span
              className="pl-preview-badge"
              style={{
                background:
                  THEME_OPTIONS.find((t) => t.value === form.theme)?.swatch,
              }}
            >
              {form.badge_text || "PREMIUM"}
            </span>
            <div className="pl-preview-body">
              {form.image_url ? (
                <img src={form.image_url} alt="" className="pl-preview-img" />
              ) : (
                <span className="pl-preview-icon">{form.icon || "🎁"}</span>
              )}
              <div className="pl-preview-text">
                <div className="pl-preview-title">
                  {form.title || "Offer title yahan aayega"}
                </div>
                {form.description && (
                  <div className="pl-preview-desc">{form.description}</div>
                )}
              </div>
              <span
                className="pl-preview-btn"
                style={{
                  background:
                    THEME_OPTIONS.find((t) => t.value === form.theme)?.swatch,
                }}
              >
                {form.cta_text || "Claim Offer"}
              </span>
            </div>
          </a>
          <p className="pl-preview-note">
            Yeh exact design hai jo premium users ko home page / thread page par
            nazar aayegi.
          </p>
        </div>
      </div>

      {/* ── LIST ─────────────────────────── */}
      <h2 className="pl-list-heading">Sab Offers ({links.length})</h2>
      <div className="pl-list">
        {links.map((l) => (
          <div key={l.id} className="pl-list-item">
            <span
              className="pl-list-dot"
              style={{ background: THEME_CARD_BG[l.theme || "gold"] }}
            />
            <div className="pl-list-info">
              <div className="pl-list-title">
                {l.title}{" "}
                {!l.active && <span className="pl-tag-off">OFF</span>}
                {l.expires_at &&
                  new Date(l.expires_at).getTime() < Date.now() && (
                    <span className="pl-tag-expired">EXPIRED</span>
                  )}
              </div>
              <div className="pl-list-meta">
                {l.show_on_home && <span className="pl-tag">Home</span>}
                {l.show_on_thread && <span className="pl-tag">Thread</span>}
                <span className="pl-tag">priority: {l.priority}</span>
              </div>
            </div>
            <div className="pl-list-actions">
              <button onClick={() => toggleActive(l)}>
                {l.active ? "Pause" : "Resume"}
              </button>
              <button onClick={() => editLink(l)}>Edit</button>
              <button className="pl-danger" onClick={() => deleteLink(l.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
        {links.length === 0 && (
          <div className="pl-empty">Abhi koi offer nahi bana.</div>
        )}
      </div>

      <style jsx>{`
        .pl-admin {
          max-width: 1100px;
          margin: 0 auto;
          padding: 24px 16px 60px;
          color: #fff;
        }
        h1 {
          font-size: 24px;
          margin-bottom: 4px;
        }
        .pl-sub {
          color: rgba(255, 255, 255, 0.6);
          font-size: 13.5px;
          margin-bottom: 24px;
        }
        h2 {
          font-size: 16px;
          margin-bottom: 14px;
        }
        .pl-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 20px;
        }
        @media (max-width: 860px) {
          .pl-grid {
            grid-template-columns: 1fr;
          }
        }
        .pl-form-box,
        .pl-preview-box {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 20px;
        }
        label {
          display: block;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.65);
          margin: 12px 0 5px;
        }
        input {
          width: 100%;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 8px;
          padding: 9px 11px;
          color: #fff;
          font-size: 13.5px;
        }
        input:focus {
          outline: none;
          border-color: #ffb238;
        }
        .pl-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .pl-theme-picker {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .pl-swatch {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 2px solid transparent;
          cursor: pointer;
        }
        .pl-swatch.active {
          border-color: #fff;
          transform: scale(1.1);
        }
        .pl-theme-label {
          font-size: 12.5px;
          color: rgba(255, 255, 255, 0.7);
        }
        .pl-toggles {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 16px;
        }
        .pl-check {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.85);
        }
        .pl-check input {
          width: auto;
        }
        .pl-msg {
          margin-top: 12px;
          font-size: 13px;
          color: #ffd76a;
        }
        .pl-form-actions {
          display: flex;
          gap: 10px;
          margin-top: 18px;
        }
        .pl-btn-primary {
          background: linear-gradient(90deg, #ffd76a, #ffb238);
          color: #241900;
          font-weight: 800;
          border: none;
          padding: 10px 20px;
          border-radius: 999px;
          cursor: pointer;
          font-size: 13.5px;
        }
        .pl-btn-secondary {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #fff;
          padding: 10px 18px;
          border-radius: 999px;
          cursor: pointer;
          font-size: 13.5px;
        }

        .pl-preview-card {
          position: relative;
          display: block;
          border-radius: 14px;
          padding: 16px 18px;
          text-decoration: none;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.08);
          cursor: default;
        }
        .pl-preview-shine {
          position: absolute;
          top: 0;
          left: -60%;
          width: 45%;
          height: 100%;
          background: linear-gradient(
            120deg,
            transparent 0%,
            rgba(255, 255, 255, 0.18) 45%,
            transparent 100%
          );
          transform: skewX(-20deg);
          animation: plShine 3.2s ease-in-out infinite;
        }
        @keyframes plShine {
          0% {
            left: -60%;
          }
          55% {
            left: 130%;
          }
          100% {
            left: 130%;
          }
        }
        .pl-preview-badge {
          position: absolute;
          top: 10px;
          right: -34px;
          transform: rotate(38deg);
          color: #241900;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.06em;
          padding: 3px 40px;
        }
        .pl-preview-body {
          position: relative;
          display: flex;
          align-items: center;
          gap: 14px;
          z-index: 1;
        }
        .pl-preview-icon {
          font-size: 30px;
        }
        .pl-preview-img {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          object-fit: cover;
        }
        .pl-preview-text {
          flex: 1;
          min-width: 0;
        }
        .pl-preview-title {
          font-weight: 700;
          font-size: 15px;
        }
        .pl-preview-desc {
          color: rgba(255, 255, 255, 0.72);
          font-size: 12.5px;
          margin-top: 2px;
        }
        .pl-preview-btn {
          flex-shrink: 0;
          color: #241900;
          font-size: 12.5px;
          font-weight: 800;
          padding: 8px 16px;
          border-radius: 999px;
          white-space: nowrap;
        }
        .pl-preview-note {
          margin-top: 12px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
        }

        .pl-list-heading {
          margin-top: 30px;
        }
        .pl-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .pl-list-item {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 10px;
          padding: 12px 14px;
        }
        .pl-list-dot {
          width: 10px;
          height: 34px;
          border-radius: 4px;
          flex-shrink: 0;
        }
        .pl-list-info {
          flex: 1;
          min-width: 0;
        }
        .pl-list-title {
          font-size: 14px;
          font-weight: 600;
        }
        .pl-list-meta {
          display: flex;
          gap: 6px;
          margin-top: 4px;
        }
        .pl-tag,
        .pl-tag-off,
        .pl-tag-expired {
          font-size: 10.5px;
          padding: 2px 7px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.7);
        }
        .pl-tag-off {
          background: rgba(255, 80, 80, 0.15);
          color: #ff8080;
        }
        .pl-tag-expired {
          background: rgba(255, 180, 0, 0.15);
          color: #ffb400;
        }
        .pl-list-actions {
          display: flex;
          gap: 6px;
          flex-shrink: 0;
        }
        .pl-list-actions button {
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #fff;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          cursor: pointer;
        }
        .pl-list-actions .pl-danger {
          background: rgba(255, 60, 60, 0.15);
          border-color: rgba(255, 60, 60, 0.3);
          color: #ff7373;
        }
        .pl-empty {
          color: rgba(255, 255, 255, 0.5);
          font-size: 13px;
          padding: 20px;
          text-align: center;
        }
      `}</style>
    </div>
  );
}