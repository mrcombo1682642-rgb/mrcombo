"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footbar";

type Listing = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  pinned: boolean;
  locked: boolean;
  username: string | null;
  avatar_url: string | null;
  role: string | null;
  badge: string | null;
  reply_count: number;
  views_count: number;
};

const SUBCATEGORY_INFO: Record<string, { icon: string; desc: string; color: string }> = {
  lobby:    { icon: "🏪", desc: "Browse and chat about the market. Report scams here.", color: "#6c63ff" },
  premium:  { icon: "🏬", desc: "Premium sellers only — Products, Services, Accounts.", color: "#f0a500" },
  buyers:   { icon: "🖨️", desc: "Looking to buy? Post your requests here.", color: "#00b4d8" },
  trading:  { icon: "🔄", desc: "Exchange goods, services, or forum credits.", color: "#27ae60" },
  archive:  { icon: "🗄️", desc: "Archived marketplace threads.", color: "#4a7a94" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function MarketplacePageClient({ subcategory }: { subcategory: string }) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("member");
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);

  const info = SUBCATEGORY_INFO[subcategory] || { icon: "🛒", desc: "", color: "#6c63ff" };

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (uid) {
        setUser(userData.user);
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", uid)
          .single();
        if (profile?.role) setUserRole(profile.role);
      }
    }
    init();
  }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_thread_list", {
      category_input: "marketplace",
      subcategory_input: subcategory,
    });
    if (error) console.error(error.message);
    else setListings(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [subcategory]);

  async function handlePost() {
    if (!title.trim() || !content.trim() || !user) return;
    setPosting(true);
    const { error } = await supabase.from("threads").insert({
      title: title.trim(),
      content: content.trim(),
      category: "marketplace",
      subcategory,
      user_id: user.id,
      pinned: false,
      locked: false,
    });
    setPosting(false);
    if (!error) {
      setModalOpen(false);
      setTitle("");
      setContent("");
      load();
    }
  }

  // Premium sellers — sirf premium/admin/moderator post kar sakte hain
  const canPost = subcategory === "premium"
    ? ["admin", "moderator", "premium"].includes(userRole)
    : !!user;

  return (
    <>
      {modalOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 500,
          background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        }} onClick={() => setModalOpen(false)}>
          <div style={{
            background: "#0a1520", border: "1px solid #0d2030",
            borderRadius: 12, width: "100%", maxWidth: 520,
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              background: info.color, padding: "14px 18px",
              borderRadius: "12px 12px 0 0",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>
                {info.icon} New Listing
              </span>
              <button onClick={() => setModalOpen(false)} style={{
                background: "rgba(255,255,255,0.15)", border: "none",
                borderRadius: 6, width: 28, height: 28,
                color: "#fff", fontSize: 16, cursor: "pointer",
              }}>✕</button>
            </div>
            <div style={{ padding: "20px 18px" }}>
              <label style={{ fontSize: 12, color: "#4a7a94", fontWeight: 700, letterSpacing: 1, display: "block", marginBottom: 6 }}>
                TITLE
              </label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Listing title..."
                style={{
                  width: "100%", background: "#0a1520", border: "1px solid #0d2030",
                  borderRadius: 8, padding: "10px 14px", color: "#c8dde8",
                  fontSize: 14, outline: "none", marginBottom: 12,
                }}
              />
              <label style={{ fontSize: 12, color: "#4a7a94", fontWeight: 700, letterSpacing: 1, display: "block", marginBottom: 6 }}>
                DESCRIPTION
              </label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Describe your listing..."
                style={{
                  width: "100%", background: "#0a1520", border: "1px solid #0d2030",
                  borderRadius: 8, padding: "10px 14px", color: "#c8dde8",
                  fontSize: 14, outline: "none", resize: "vertical",
                  minHeight: 140, marginBottom: 16, fontFamily: "Inter, sans-serif",
                }}
              />
              <button
                onClick={handlePost}
                disabled={posting || !title.trim() || !content.trim()}
                style={{
                  width: "100%", background: info.color, border: "none",
                  borderRadius: 8, padding: "12px 0", color: "#fff",
                  fontSize: 14, fontWeight: 700, cursor: "pointer",
                  opacity: posting || !title.trim() || !content.trim() ? 0.5 : 1,
                }}
              >
                {posting ? "Posting..." : "Post Listing"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ minHeight: "100vh", background: "#050a0f" }}>
        <Navbar />
        <div style={{ maxWidth: 780, margin: "0 auto", padding: "80px 12px 48px" }}>

          {/* Breadcrumb */}
          <div style={{ fontSize: 13, color: "#4a7a94", marginBottom: 16 }}>
            <Link href="/" style={{ color: "#4a7a94", textDecoration: "none" }}>Home</Link>
            {" › "}
            <Link href="/forum/marketplace" style={{ color: "#4a7a94", textDecoration: "none" }}>Marketplace</Link>
            {" › "}{subcategory}
          </div>

          {/* Header */}
          <div style={{
            background: info.color, borderRadius: "8px 8px 0 0",
            padding: "12px 16px", display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 20 }}>{info.icon}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>
                {subcategory.charAt(0).toUpperCase() + subcategory.slice(1)}
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{info.desc}</div>
            </div>
            {canPost && (
              <button
                onClick={() => setModalOpen(true)}
                style={{
                  marginLeft: "auto", background: "rgba(255,255,255,0.2)",
                  border: "none", borderRadius: 6, padding: "7px 16px",
                  color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                }}
              >
                + New Listing
              </button>
            )}
          </div>

          {/* Premium warning */}
          {subcategory === "premium" && !canPost && user && (
            <div style={{
              background: "#1a0a00", border: "1px solid #f0a50033",
              padding: "10px 16px", fontSize: 13, color: "#f0a500",
            }}>
              ⭐ Only Premium members and above can post here.{" "}
              <Link href="/upgrade" style={{ color: "#f0a500", fontWeight: 700 }}>Upgrade now →</Link>
            </div>
          )}

          {/* Listings */}
          <div style={{
            background: "#080e18", border: "1px solid #0d2030",
            borderTop: "none", borderRadius: "0 0 8px 8px", overflow: "hidden",
          }}>
            {loading ? (
              <div style={{ padding: "60px 0", textAlign: "center", color: "#4a7a94" }}>
                Loading listings...
              </div>
            ) : listings.length === 0 ? (
              <div style={{ padding: "60px 0", textAlign: "center", color: "#4a7a94" }}>
                No listings yet.{canPost && " Be the first to post!"}
              </div>
            ) : (
              listings.map((l) => (
                <Link key={l.id} href={`/thread/${l.id}`} style={{ textDecoration: "none", display: "block" }}>
                  <div
                    style={{
                      padding: "14px 16px", borderBottom: "1px solid #0a1520",
                      display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#0a1520")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: 42, height: 42, borderRadius: 8,
                      background: "#0a1520", border: "1px solid #0d2030",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16, fontWeight: 700, color: info.color, flexShrink: 0,
                    }}>
                      {l.avatar_url
                        ? <img src={l.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} />
                        : (l.username || "?").slice(0, 2).toUpperCase()
                      }
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                        {l.pinned && <span style={{ fontSize: 11, color: "#6c63ff", fontWeight: 700, background: "rgba(108,99,255,0.15)", padding: "2px 7px", borderRadius: 4 }}>📌 PINNED</span>}
                        {l.locked && <span style={{ fontSize: 11, color: "#ff9b6b", fontWeight: 700, background: "rgba(255,155,107,0.1)", padding: "2px 7px", borderRadius: 4 }}>🔒 LOCKED</span>}
                        <span style={{ fontWeight: 700, fontSize: 14, color: "#e4e4e7" }}>{l.title}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#7fa3b8", marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {l.content?.slice(0, 120)}
                      </div>
                      <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#4a7a94", flexWrap: "wrap" }}>
                        <span>by <strong style={{ color: "#c8dde8" }}>{l.username || "Unknown"}</strong>
                          {l.role === "admin" && <span style={{ color: "#ff6b6b", marginLeft: 4 }}>● Admin</span>}
                          {l.badge && <span style={{ color: "#ffd76c", marginLeft: 4 }}>🏆 {l.badge}</span>}
                        </span>
                        <span>{timeAgo(l.created_at)}</span>
                        <span>💬 {l.reply_count}</span>
                        <span>👁️ {l.views_count}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}