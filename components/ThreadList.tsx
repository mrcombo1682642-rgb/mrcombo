"use client";

import { useRouter } from "next/navigation";
import type { ThreadListItem } from "@/lib/types";
import { stripHiddenBlocks } from "@/lib/stripHiddenBlocks";

interface ThreadListProps {
  threads: ThreadListItem[];
  currentUserId: string | null;
  currentUserRole: string | null;
  likedThreadIds: Set<string>;
  onToggleLike: (e: React.MouseEvent, threadId: string) => Promise<void>;
  onDeleteThread: (e: React.MouseEvent, threadId: string) => Promise<void>;
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
  currentUserId,
  currentUserRole,
  likedThreadIds,
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
          padding: "60px 20px",
          border: "1px dashed #1a3042",
          borderRadius: 8,
          color: "#4a7a94",
        }}
      >
        No threads yet. Be the first to start one!
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
            style={{
              background: thread.pinned ? "#10182a" : "#080e18",
              border: thread.pinned
                ? "1px solid #6c63ff44"
                : "1px solid #0d2030",
              borderRadius: 10,
              padding: "16px 18px",
              cursor: "pointer",
              display: "flex",
              gap: 14,
              alignItems: "flex-start",
              transition: "border-color 0.15s",
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "#1a2535",
                flexShrink: 0,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 600,
                color: "#c8dde8",
              }}
            >
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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 4,
                  flexWrap: "wrap",
                }}
              >
                {thread.pinned && (
                  <span style={{ fontSize: 12, color: "#6c63ff" }}>
                    📌 Pinned
                  </span>
                )}
                {thread.locked && (
                  <span style={{ fontSize: 12, color: "#ff9b6b" }}>
                    🔒 Locked
                  </span>
                )}
                <h3
                  style={{
                    margin: 0,
                    fontSize: 16,
                    color: "#fff",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {thread.title}
                </h3>
              </div>

              {excerpt && (
                <p
                  style={{
                    margin: 0,
                    marginBottom: hasHiddenLink ? 6 : 8,
                    color: "#7fa3b8",
                    fontSize: 13.5,
                    lineHeight: 1.5,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {excerpt}
                </p>
              )}

              {hasHiddenLink && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    marginBottom: 8,
                    padding: "3px 9px",
                    borderRadius: 999,
                    background: "rgba(108,99,255,0.12)",
                    border: "1px solid rgba(108,99,255,0.3)",
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: "#a5a0ff",
                  }}
                >
                  🔒 This thread contains a hidden link — open the thread to view it
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  gap: 14,
                  fontSize: 12,
                  color: "#4a7a94",
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <span>
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
                <span>{timeAgo(thread.created_at)}</span>
                <span>💬 {thread.reply_count} replies</span>
                <span>👁️ {thread.views_count} views</span>

                <button
                  type="button"
                  onClick={(e) => onToggleLike(e, thread.id)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: isLiked ? "#ff4d6d" : "#7fa3b8",
                    cursor: "pointer",
                    fontSize: 13,
                    padding: 0,
                    fontWeight: isLiked ? 700 : 400,
                  }}
                >
                  {isLiked ? "❤️" : "🤍"} {thread.likes_count || 0}
                </button>

                {canDelete && (
                  <button
                    type="button"
                    onClick={(e) => onDeleteThread(e, thread.id)}
                    style={{
                      background: "rgba(239,68,68,0.1)",
                      border: "1px solid rgba(239,68,68,0.3)",
                      borderRadius: 6,
                      color: "#ef4444",
                      cursor: "pointer",
                      fontSize: 11.5,
                      fontWeight: 700,
                      padding: "3px 10px",
                      marginLeft: "auto",
                    }}
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
  );
}