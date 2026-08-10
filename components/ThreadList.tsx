"use client";

import { useRouter } from "next/navigation";
import type { ThreadListItem } from "@/lib/types";
import { stripHiddenBlocks } from "@/lib/stripHiddenBlocks";

interface ThreadListProps {
  threads: ThreadListItem[];
  currentUserId?: string | null;
  currentUserRole?: string | null;
  likedThreadIds?: Set<string>;
  onToggleLike?: (e: React.MouseEvent, threadId: string) => Promise<void>;
  onDeleteThread?: (e: React.MouseEvent, threadId: string) => Promise<void>;
}

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

export default function ThreadList({
  threads,
  currentUserId = null,
  currentUserRole = null,
  likedThreadIds = new Set(),
  onToggleLike,
  onDeleteThread,
}: ThreadListProps) {
  const router = useRouter();
  const canDelete =
    currentUserRole === "admin" || currentUserRole === "moderator";

  if (threads.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "70px 20px",
          border: "1px dashed #1a3042",
          borderRadius: 14,
          color: "#4a7a94",
          background:
            "linear-gradient(180deg, rgba(108,99,255,0.03), transparent)",
        }}
      >
        <div style={{ fontSize: 34, marginBottom: 10 }}>🗂️</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#7fa3b8" }}>
          No threads yet
        </div>
        <div style={{ fontSize: 13, marginTop: 4 }}>
          Be the first to start one!
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="thread-list-wrap">
        {threads.map((thread) => {
          // Strip hidden-link block markup out of the preview so the real
          // content is never leaked here — only a small badge shows that
          // this thread contains a hidden link. Full content (and the
          // resolved hidden-link card) only appears on the thread page.
          const { excerpt, hasHiddenLink } = stripHiddenBlocks(
            thread.content,
            140
          );

          const isLiked = likedThreadIds.has(thread.id);

          return (
            <div
              key={thread.id}
              onClick={() => router.push(`/thread/${thread.id}`)}
              className={`thread-card${thread.pinned ? " thread-card--pinned" : ""}`}
            >
              {/* Avatar */}
              <div className="thread-avatar">
                {thread.avatar_url ? (
                  <img
                    src={thread.avatar_url}
                    alt={thread.username || "User"}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  (thread.username || "?").slice(0, 2).toUpperCase()
                )}
              </div>

              {/* Main content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="thread-card-toprow">
                  {thread.pinned && (
                    <span className="thread-tag thread-tag--pinned">
                      📌 Pinned
                    </span>
                  )}
                  {thread.locked && (
                    <span className="thread-tag thread-tag--locked">
                      🔒 Locked
                    </span>
                  )}
                  <h3 className="thread-title">{thread.title}</h3>
                </div>

                {excerpt && (
                  <p
                    className="thread-excerpt"
                    style={{ marginBottom: hasHiddenLink ? 8 : 10 }}
                  >
                    {excerpt}
                  </p>
                )}

                {hasHiddenLink && (
                  <div className="thread-hiddenlink-badge">
                    🔒 This thread contains a hidden link — open the thread to
                    view it
                  </div>
                )}

                <div className="thread-meta">
                  <span className="thread-meta-author">
                    by{" "}
                    <strong style={{ color: "#c8dde8" }}>
                      {thread.username || "Unknown"}
                    </strong>
                    {thread.role === "admin" && (
                      <span style={{ color: "#ff6b6b", marginLeft: 4 }}>
                        ● Admin
                      </span>
                    )}
                    {thread.role === "moderator" && (
                      <span style={{ color: "#6cc6ff", marginLeft: 4 }}>
                        ● Mod
                      </span>
                    )}
                    {thread.badge && (
                      <span style={{ color: "#ffd76c", marginLeft: 4 }}>
                        🏆 {thread.badge}
                      </span>
                    )}
                  </span>

                  <span className="thread-meta-dot">·</span>
                  <span>{timeAgo(thread.created_at)}</span>

                  <span className="thread-meta-stat">
                    💬 {thread.reply_count}
                  </span>
                  <span className="thread-meta-stat">
                    👁️ {thread.views_count}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => onToggleLike?.(e, thread.id)}
                    className={`thread-like-btn${isLiked ? " thread-like-btn--active" : ""}`}
                  >
                    {isLiked ? "❤️" : "🤍"} {thread.likes_count || 0}
                  </button>

                  {canDelete && (
                    <button
                      type="button"
                      onClick={(e) => onDeleteThread?.(e, thread.id)}
                      className="thread-delete-btn"
                    >
                      🗑 Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .thread-list-wrap {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .thread-card {
          background: #080e18;
          border: 1px solid #0d2030;
          border-radius: 12px;
          padding: 18px 20px;
          cursor: pointer;
          display: flex;
          gap: 16px;
          align-items: flex-start;
          transition: border-color 0.18s ease, transform 0.18s ease,
            box-shadow 0.18s ease, background 0.18s ease;
        }

        .thread-card:hover {
          border-color: #2a3a55;
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
          background: #0a1220;
        }

        .thread-card:active {
          transform: translateY(0);
        }

        .thread-card--pinned {
          background: linear-gradient(135deg, #10182a, #0c1120);
          border: 1px solid #6c63ff44;
        }

        .thread-card--pinned:hover {
          border-color: #6c63ff88;
        }

        .thread-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1a2535, #22304a);
          flex-shrink: 0;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          color: #c8dde8;
          border: 1px solid #24344a;
        }

        .thread-card-toprow {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 5px;
          flex-wrap: wrap;
        }

        .thread-tag {
          font-size: 11.5px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 999px;
          white-space: nowrap;
        }

        .thread-tag--pinned {
          color: #a5a0ff;
          background: rgba(108, 99, 255, 0.12);
          border: 1px solid rgba(108, 99, 255, 0.3);
        }

        .thread-tag--locked {
          color: #ff9b6b;
          background: rgba(255, 155, 107, 0.1);
          border: 1px solid rgba(255, 155, 107, 0.3);
        }

        .thread-title {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: #fff;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
        }

        .thread-excerpt {
          margin: 0;
          color: #7fa3b8;
          font-size: 13.5px;
          line-height: 1.5;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .thread-hiddenlink-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          margin-bottom: 10px;
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(108, 99, 255, 0.12);
          border: 1px solid rgba(108, 99, 255, 0.3);
          font-size: 10.5px;
          font-weight: 700;
          color: #a5a0ff;
        }

        .thread-meta {
          display: flex;
          gap: 14px;
          font-size: 12px;
          color: #4a7a94;
          flex-wrap: wrap;
          align-items: center;
          row-gap: 8px;
        }

        .thread-meta-dot {
          opacity: 0.6;
        }

        .thread-meta-stat {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          white-space: nowrap;
        }

        .thread-like-btn {
          background: transparent;
          border: none;
          color: #7fa3b8;
          cursor: pointer;
          font-size: 13px;
          padding: 2px 4px;
          border-radius: 6px;
          font-weight: 400;
          transition: background 0.15s, color 0.15s;
        }

        .thread-like-btn:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .thread-like-btn--active {
          color: #ff4d6d;
          font-weight: 700;
        }

        .thread-delete-btn {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 6px;
          color: #ef4444;
          cursor: pointer;
          font-size: 11.5px;
          font-weight: 700;
          padding: 4px 10px;
          margin-left: auto;
          transition: background 0.15s;
        }

        .thread-delete-btn:hover {
          background: rgba(239, 68, 68, 0.2);
        }

        @media (max-width: 640px) {
          .thread-card {
            padding: 14px;
            gap: 12px;
            border-radius: 10px;
          }
          .thread-avatar {
            width: 38px;
            height: 38px;
            font-size: 12px;
          }
          .thread-title {
            font-size: 14.5px;
            white-space: normal;
            overflow: visible;
            text-overflow: unset;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          }
          .thread-excerpt {
            white-space: normal;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          }
          .thread-meta {
            gap: 10px;
            font-size: 11.5px;
          }
          .thread-delete-btn {
            margin-left: 0;
          }
        }
      `}</style>
    </>
  );
}