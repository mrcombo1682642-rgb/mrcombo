"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { ThreadListItem } from "@/lib/types";
import CreateThreadModal from "@/components/CreateThreadModal";

type SortField = "last_post" | "title" | "views" | "replies" | "likes" | "created";
type SortOrder = "asc" | "desc";

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

const PAGE_SIZE = 20;

export default function SubcategoryPageClient({
  slug,
  subcategory,
}: {
  slug: string;
  subcategory: string;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [allThreads, setAllThreads] = useState<ThreadListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const [sortField, setSortField] = useState<SortField>("last_post");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);
  const [onlineCount] = useState(() => Math.floor(Math.random() * 30) + 5);

  async function loadThreads() {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_thread_list", {
      category_input: slug,
      subcategory_input: subcategory,
    });

    if (error) {
      console.error("Failed to load threads:", error.message);
      setAllThreads([]);
    } else {
      setAllThreads(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadThreads();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, subcategory]);

  function sortThreads(list: ThreadListItem[]) {
    const sorted = [...list];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
        case "views":
          cmp = a.views_count - b.views_count;
          break;
        case "replies":
          cmp = a.reply_count - b.reply_count;
          break;
        case "likes":
          cmp = (a.likes_count || 0) - (b.likes_count || 0);
          break;
        case "created":
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "last_post":
        default:
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });
    // Pinned always first regardless of sort
    return [
      ...sorted.filter(t => t.pinned),
      ...sorted.filter(t => !t.pinned),
    ];
  }

  const sortedThreads = sortThreads(allThreads);
  const totalPages = Math.max(1, Math.ceil(sortedThreads.length / PAGE_SIZE));
  const pageThreads = sortedThreads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050a0f",
        color: "#c8dde8",
        padding: "80px 16px",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: 13, color: "#4a7a94", marginBottom: 14 }}>
          <Link href="/" style={{ color: "#4a7a94" }}>Home</Link>
          {" > "}
          <Link href={`/forum/${slug}`} style={{ color: "#4a7a94" }}>{slug}</Link>
          {" > "}
          {subcategory}
        </div>

        {/* Header */}
        <div
          style={{
            background: "#6c63ff",
            padding: "12px 18px",
            borderRadius: "8px 8px 0 0",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <span>{subcategory}</span>
          {user && (
            <button
              onClick={() => setModalOpen(true)}
              style={{
                background: "rgba(255,255,255,0.2)",
                color: "#fff",
                padding: "7px 16px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              + Create Thread
            </button>
          )}
        </div>

        {/* Online users strip */}
        <div style={{
          background: "#080e18", border: "1px solid #0d2030", borderTop: "none",
          padding: "8px 18px", fontSize: 12, color: "#4a7a94",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          👁️ Users browsing this forum: <strong style={{ color: "#6cc6ff" }}>{onlineCount} Guest(s)</strong>
        </div>

        {/* Sort bar */}
        <div style={{
          background: "#0a1520", border: "1px solid #0d2030", borderTop: "none",
          padding: "10px 18px", display: "flex", alignItems: "center", gap: 10,
          flexWrap: "wrap", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "#4a7a94" }}>Sort by:</span>
            <select
              value={sortField}
              onChange={e => setSortField(e.target.value as SortField)}
              style={selectStyle}
            >
              <option value="last_post">Last Post</option>
              <option value="title">Title</option>
              <option value="views">Views</option>
              <option value="replies">Replies</option>
              <option value="likes">Likes</option>
              <option value="created">Created Date</option>
            </select>
            <select
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value as SortOrder)}
              style={selectStyle}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
          <div style={{ fontSize: 12, color: "#4a7a94" }}>
            {sortedThreads.length} thread{sortedThreads.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Table header (desktop only) */}
        <div
          className="thread-table-header"
          style={{
            background: "#080e18", border: "1px solid #0d2030", borderTop: "none",
            padding: "10px 18px", display: "grid",
            gridTemplateColumns: "1fr 90px 90px 90px 150px",
            gap: 12, fontSize: 11, fontWeight: 700, color: "#4a7a94",
            letterSpacing: 0.5, textTransform: "uppercase",
          }}
        >
          <span>Thread / Author</span>
          <span style={{ textAlign: "center" }}>Views</span>
          <span style={{ textAlign: "center" }}>Replies</span>
          <span style={{ textAlign: "center" }}>Likes</span>
          <span>Last Post</span>
        </div>

        {/* Thread list */}
        <div style={{
          background: "#080e18", border: "1px solid #0d2030", borderTop: "none",
          borderRadius: "0 0 8px 8px", overflow: "hidden",
        }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#4a7a94" }}>
              Loading threads...
            </div>
          ) : pageThreads.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#4a7a94" }}>
              No threads yet. Be the first to start one!
            </div>
          ) : (
            pageThreads.map((t, i) => (
              <Link key={t.id} href={`/thread/${t.id}`} style={{ textDecoration: "none", display: "block" }}>
                <div
                  className="thread-row"
                  style={{
                    padding: "12px 18px",
                    borderBottom: i !== pageThreads.length - 1 ? "1px solid #0a1520" : "none",
                    display: "grid",
                    gridTemplateColumns: "1fr 90px 90px 90px 150px",
                    gap: 12, alignItems: "center",
                    background: t.pinned ? "#0d1326" : "transparent",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = t.pinned ? "#121a38" : "#0a1520")}
                  onMouseLeave={e => (e.currentTarget.style.background = t.pinned ? "#0d1326" : "transparent")}
                >
                  {/* Thread / Author */}
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start", minWidth: 0 }}>
                    <div style={{ fontSize: 18, flexShrink: 0, marginTop: 2 }}>
                      {t.locked ? "🔒" : t.pinned ? "📌" : "👤"}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        {t.pinned && (
                          <span style={{
                            fontSize: 10, fontWeight: 700, color: "#6c63ff",
                            background: "rgba(108,99,255,0.15)", padding: "1px 6px", borderRadius: 3,
                          }}>PINNED</span>
                        )}
                        <span style={{
                          fontSize: 14, fontWeight: 600, color: "#e4e4e7",
                          overflow: "hidden", textOverflow: "ellipsis",
                        }}>
                          {t.title}
                        </span>
                      </div>
                      <div style={{ fontSize: 11.5, color: "#4a7a94", marginTop: 3 }}>
                        Started by{" "}
                        <span style={{ color: "#ff9b6b", fontWeight: 600 }}>{t.username || "Unknown"}</span>
                        {" · "}{timeAgo(t.created_at)}
                      </div>
                    </div>
                  </div>

                  {/* Views */}
                  <div className="thread-stat" style={{ textAlign: "center", fontSize: 13, color: "#9ab0bf" }}>
                    <span className="mobile-label">Views: </span>{t.views_count}
                  </div>

                  {/* Replies */}
                  <div className="thread-stat" style={{ textAlign: "center", fontSize: 13, color: "#9ab0bf" }}>
                    <span className="mobile-label">Replies: </span>{t.reply_count}
                  </div>

                  {/* Likes */}
                  <div className="thread-stat" style={{ textAlign: "center" }}>
                    <span className="mobile-label">Likes: </span>
                    <span style={{
                      fontSize: 12, fontWeight: 700, color: (t.likes_count || 0) > 0 ? "#22c55e" : "#4a7a94",
                      background: (t.likes_count || 0) > 0 ? "rgba(34,197,94,0.12)" : "transparent",
                      padding: "2px 8px", borderRadius: 4,
                    }}>
                      {t.likes_count || 0}
                    </span>
                  </div>

                  {/* Last Post */}
                  <div className="thread-stat" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: 5, flexShrink: 0,
                      background: "#1a2535", display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#6cc6ff",
                      overflow: "hidden",
                    }}>
                      {t.avatar_url
                        ? <img src={t.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : (t.username || "?").slice(0, 2).toUpperCase()
                      }
                    </div>
                    <div style={{ fontSize: 11, color: "#6a8a9a", minWidth: 0 }}>
                      <div style={{ color: "#9ab0bf", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {t.username || "Unknown"}
                      </div>
                      <div>{timeAgo(t.created_at)}</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: "flex", justifyContent: "center", alignItems: "center",
            gap: 6, marginTop: 18, flexWrap: "wrap",
          }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={pageBtnStyle(false, page === 1)}
            >
              ‹ Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .map((p, idx, arr) => (
                <span key={p} style={{ display: "flex", alignItems: "center" }}>
                  {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <span style={{ color: "#4a7a94", padding: "0 4px" }}>…</span>
                  )}
                  <button onClick={() => setPage(p)} style={pageBtnStyle(p === page, false)}>
                    {p}
                  </button>
                </span>
              ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={pageBtnStyle(false, page === totalPages)}
            >
              Next ›
            </button>
          </div>
        )}
      </div>

      <CreateThreadModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          loadThreads();
        }}
        category={slug}
        subcategory={subcategory}
      />

      <style>{`
        @media (max-width: 760px) {
          .thread-table-header { display: none !important; }
          .thread-row {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }
          .thread-stat {
            text-align: left !important;
            display: flex !important;
            gap: 4px;
            font-size: 12px !important;
          }
          .mobile-label {
            color: #4a7a94;
            font-weight: 600;
          }
        }
        @media (min-width: 761px) {
          .mobile-label { display: none; }
        }
      `}</style>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  background: "#050a0f", border: "1px solid #1a2535", borderRadius: 6,
  padding: "6px 10px", color: "#c8dde8", fontSize: 12, outline: "none", cursor: "pointer",
};

function pageBtnStyle(active: boolean, disabled: boolean): React.CSSProperties {
  return {
    background: active ? "#6c63ff" : "#0a1520",
    border: `1px solid ${active ? "#6c63ff" : "#1a2535"}`,
    borderRadius: 6, padding: "6px 12px", color: active ? "#fff" : "#c8dde8",
    fontSize: 13, fontWeight: active ? 700 : 500,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.4 : 1,
  };
}