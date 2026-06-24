"use client";
import { useRouter } from "next/navigation";
import type { ThreadListItem } from "@/lib/types";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface ThreadListProps {
  threads: ThreadListItem[];
}

function getPreview(content: string, maxLen = 140) {
  const clean = content.replace(/\s+/g, " ").trim();
  return clean.length > maxLen ? clean.slice(0, maxLen) + "…" : clean;
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

export default function ThreadList({ threads }: ThreadListProps) {
  const [threadList, setThreadList] = useState<ThreadListItem[]>(threads);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    setThreadList(threads);
  }, [threads]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  const handleLike = async (e: React.MouseEvent, threadId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      alert("Login required");
      return;
    }

    const { error } = await supabase.rpc("toggle_thread_like", {
      t_id: threadId,
      u_id: user.id,
    });

    if (error) {
      console.error("LIKE ERROR:", error);
      return;
    }

    setThreadList((prev) =>
      prev.map((t) =>
        t.id === threadId
          ? { ...t, likes_count: (t.likes_count || 0) + 1 }
          : t
      )
    );
  };

  if (threadList.length === 0) {
    return (
      <div style={{
        textAlign: "center",
        padding: "60px 20px",
        border: "1px dashed #1a3042",
        borderRadius: 8,
        color: "#4a7a94",
      }}>
        No threads yet. Be the first to start one!
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {threadList.map((thread) => (
        <div
          key={thread.id}
          onClick={() => router.push(`/thread/${thread.id}`)}
          style={{
            background: thread.pinned ? "#10182a" : "#080e18",
            border: thread.pinned ? "1px solid #6c63ff44" : "1px solid #0d2030",
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
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            background: "#1a2535", flexShrink: 0, overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 600, color: "#c8dde8",
          }}>
            {thread.avatar_url ? (
              <img src={thread.avatar_url} alt={thread.username || "User"}
                style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              (thread.username || "?").slice(0, 2).toUpperCase()
            )}
          </div>

          {/* Main content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
              {thread.pinned && <span style={{ fontSize: 12, color: "#6c63ff" }}>📌 Pinned</span>}
              {thread.locked && <span style={{ fontSize: 12, color: "#ff9b6b" }}>🔒 Locked</span>}
              <h3 style={{ margin: 0, fontSize: 16, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {thread.title}
              </h3>
            </div>

            <p style={{ margin: 0, marginBottom: 8, color: "#7fa3b8", fontSize: 13.5, lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {getPreview(thread.content)}
            </p>

            <div style={{ display: "flex", gap: 14, fontSize: 12, color: "#4a7a94", flexWrap: "wrap", alignItems: "center" }}>
              <span>
                by <strong style={{ color: "#c8dde8" }}>{thread.username || "Unknown"}</strong>
                {thread.role === "admin" && <span style={{ color: "#ff6b6b", marginLeft: 4 }}>● Admin</span>}
                {thread.role === "moderator" && <span style={{ color: "#6cc6ff", marginLeft: 4 }}>● Mod</span>}
                {thread.badge && <span style={{ color: "#ffd76c", marginLeft: 4 }}>🏆 {thread.badge}</span>}
              </span>
              <span>{timeAgo(thread.created_at)}</span>
              <span>💬 {thread.reply_count} replies</span>
              <span>👁️ {thread.views_count} views</span>
              <button
                type="button"
                onClick={(e) => handleLike(e, thread.id)}
                style={{
                  background: "transparent", border: "none",
                  color: "#ff4d6d", cursor: "pointer", fontSize: 13, padding: 0,
                }}
              >
                ❤️ {thread.likes_count || 0}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}