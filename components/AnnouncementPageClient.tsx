"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footbar";
import "@/app/globals.css";

type Announcement = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  pinned: boolean;
  username: string | null;
  avatar_url: string | null;
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

export default function AnnouncementPageClient({
  subcategory,
}: {
  subcategory: string;
}) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pinned, setPinned] = useState(false);
  const [posting, setPosting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function checkAdmin() {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return;
      setUserId(uid);

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", uid)
        .single();

      if (profile?.role === "admin") setIsAdmin(true);
    }
    checkAdmin();
  }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_announcements", {
      subcategory_input: subcategory,
    });
    if (error) console.error(error.message);
    else setAnnouncements(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [subcategory]);

  async function handlePost() {
    if (!title.trim() || !content.trim() || !userId) return;
    setPosting(true);

    const { error } = await supabase.from("threads").insert({
      title: title.trim(),
      content: content.trim(),
      category: "announcements",
      subcategory: subcategory,
      user_id: userId,
      pinned: pinned,
      locked: true,
    });

    setPosting(false);
    if (!error) {
      setModalOpen(false);
      setTitle("");
      setContent("");
      setPinned(false);
      load();
    } else {
      console.error(error.message);
    }
  }

  return (
    <>

      {/* Create Announcement Modal */}
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

            {/* Modal Header */}
            <div style={{
              background: "#6c63ff", padding: "14px 18px", borderRadius: "12px 12px 0 0",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>
                📢 New Announcement
              </span>
              <button onClick={() => setModalOpen(false)} style={{
                background: "rgba(255,255,255,0.15)", border: "none",
                borderRadius: 6, width: 28, height: 28, color: "#fff",
                fontSize: 16, cursor: "pointer",
              }}>✕</button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "20px 18px" }}>
              <label style={{ fontSize: 12, color: "#4a7a94", fontWeight: 700, letterSpacing: 1, display: "block", marginBottom: 6 }}>
                TITLE
              </label>
              <input
                className="ann-input"
                placeholder="Announcement title..."
                value={title}
                onChange={e => setTitle(e.target.value)}
              />

              <label style={{ fontSize: 12, color: "#4a7a94", fontWeight: 700, letterSpacing: 1, display: "block", marginBottom: 6 }}>
                CONTENT
              </label>
              <textarea
                className="ann-textarea"
                placeholder="Write your announcement here..."
                value={content}
                onChange={e => setContent(e.target.value)}
              />

              {/* Pinned toggle */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <div
                  onClick={() => setPinned(v => !v)}
                  style={{
                    width: 18, height: 18, borderRadius: 4,
                    border: `1.5px solid ${pinned ? "#6c63ff" : "#4a7a94"}`,
                    background: pinned ? "#6c63ff" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", flexShrink: 0,
                  }}
                >
                  {pinned && <span style={{ color: "#fff", fontSize: 12 }}>✓</span>}
                </div>
                <span style={{ fontSize: 13, color: "#c8dde8" }}>Pin this announcement</span>
              </div>

              <button
                onClick={handlePost}
                disabled={posting || !title.trim() || !content.trim()}
                style={{
                  width: "100%", background: "#6c63ff", border: "none",
                  borderRadius: 8, padding: "12px 0", color: "#fff",
                  fontSize: 14, fontWeight: 700, cursor: "pointer",
                  opacity: posting || !title.trim() || !content.trim() ? 0.5 : 1,
                }}
              >
                {posting ? "Posting..." : "Post Announcement"}
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
            <Link href="/forum/announcements" style={{ color: "#4a7a94", textDecoration: "none" }}>
              Announcements
            </Link>
            {" › "}{subcategory}
          </div>

          {/* Header */}
          <div style={{
            background: "#6c63ff", borderRadius: "8px 8px 0 0",
            padding: "10px 16px", display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{
              background: "rgba(255,255,255,.18)", borderRadius: 5,
              padding: "3px 12px", fontSize: 13, fontWeight: 700, color: "#fff",
            }}>
              📢 {subcategory}
            </span>
            <span style={{
              marginLeft: "auto", fontSize: 11,
              color: "rgba(255,255,255,0.6)", fontWeight: 600, letterSpacing: 1,
            }}>
              ADMIN ONLY
            </span>

            {/* Admin Button */}
            {isAdmin && (
              <button
                onClick={() => setModalOpen(true)}
                style={{
                  background: "rgba(255,255,255,0.2)", border: "none",
                  borderRadius: 6, padding: "5px 14px", color: "#fff",
                  fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}
              >
                + New Announcement
              </button>
            )}
          </div>

          {/* Body */}
          <div style={{
            background: "#080e18", border: "1px solid #0d2030",
            borderTop: "none", borderRadius: "0 0 8px 8px", overflow: "hidden",
          }}>
            {loading ? (
              <div style={{ padding: "60px 0", textAlign: "center", color: "#4a7a94" }}>
                Loading announcements...
              </div>
            ) : announcements.length === 0 ? (
              <div style={{ padding: "60px 0", textAlign: "center", color: "#4a7a94" }}>
                No announcements yet.
              </div>
            ) : (
              announcements.map((a) => (
                <Link key={a.id} href={`/thread/${a.id}`} style={{ textDecoration: "none", display: "block" }}>
                  <div
                    style={{
                      padding: "14px 16px", borderBottom: "1px solid #0a1520",
                      cursor: "pointer", transition: "background .2s",
                      display: "flex", gap: 12, alignItems: "flex-start",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#0a1520")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{
                      width: 42, height: 42, borderRadius: 8,
                      background: "#0a1520", border: "1px solid #0d2030",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 20, flexShrink: 0,
                    }}>
                      {a.pinned ? "📌" : "📢"}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                        {a.pinned && (
                          <span style={{ fontSize: 11, color: "#6c63ff", fontWeight: 700,
                            background: "rgba(108,99,255,0.15)", padding: "2px 8px", borderRadius: 4 }}>
                            📌 PINNED
                          </span>
                        )}
                        <span style={{ fontWeight: 700, fontSize: 14, color: "#e4e4e7" }}>
                          {a.title}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "#4a7a94" }}>
                        by{" "}
                        <span style={{ color: "#ff6b6b", fontWeight: 700 }}>
                          👑 {a.username || "Admin"}
                        </span>
                        {" · "}{timeAgo(a.created_at)}
                      </div>
                      {a.content && (
                        <div style={{
                          fontSize: 12, color: "#7fa3b8", marginTop: 4,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {a.content.slice(0, 120)}...
                        </div>
                      )}
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