"use client";
import Navbar from "@/components/Navbar";
import Footbar from "@/components/Footbar";

// ============================================================
// MessagesClient.tsx
// Two-pane DM system, styled to match the forum's dark theme
// (same palette / components as ThreadPage.tsx).
// Fully responsive: on mobile only one pane (inbox OR thread)
// is shown at a time, switched via a CSS class on the container
// so the media query has full control (no inline-style conflicts).
//
// Expects these RPC functions (already created via SQL migration):
//   get_or_create_conversation(target_username text) -> uuid
//   get_my_conversations() -> table(...)
//   get_conversation_messages(conversation_id_input uuid) -> table(...)
//   send_message(conversation_id_input uuid, content_input text) -> uuid
//   mark_conversation_read(conversation_id_input uuid) -> void
//
// Route usage:
//   /messages            -> inbox only
//   /messages?to=someone -> opens/creates conversation with "someone"
// ============================================================

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

// ---------- Shared constants (same as ThreadPage) ----------

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

const ROLE_BADGES: Record<string, { label: string; color: string; icon: string }> = {
  admin:     { label: "Admin",     color: "#ff6b6b", icon: "👑" },
  moderator: { label: "Moderator", color: "#6cc6ff", icon: "🛡️" },
  vip:       { label: "VIP",       color: "#00b4d8", icon: "⭐" },
  "vip+":    { label: "VIP+",      color: "#a855f7", icon: "💎" },
  lifetime:  { label: "Lifetime",  color: "#f59e0b", icon: "♛" },
  member:    { label: "Member",    color: "#4a7a94", icon: "👤" },
};

// ---------- Types ----------

interface ConversationRow {
  conversation_id: string;
  other_user_id: string;
  other_username: string;
  other_avatar_url: string | null;
  other_role: string | null;
  other_last_seen: string | null;
  last_message: string | null;
  last_message_at: string;
  last_message_sender_id: string | null;
  unread_count: number;
}

interface MessageRow {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

// ---------- Helpers (same style as ThreadPage) ----------

function timeAgo(dateStr: string | null) {
  if (!dateStr) return "";
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

function formatMsgTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function isOnline(lastSeen: string | null) {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < ONLINE_THRESHOLD_MS;
}

function initials(name: string) {
  return (name || "?").slice(0, 2).toUpperCase();
}

// ---------- Component ----------

export default function MessagesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetUsername = searchParams.get("to");

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [activeOtherUser, setActiveOtherUser] = useState<
    Pick<ConversationRow, "other_username" | "other_avatar_url" | "other_role" | "other_last_seen"> | null
  >(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [draft, setDraft] = useState("");
  const [loadingInbox, setLoadingInbox] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Controls which pane is active ON MOBILE ONLY. Desktop always shows both.
  const [mobileView, setMobileView] = useState<"inbox" | "thread">("inbox");

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  }, []);

  const loadInbox = useCallback(async () => {
    setLoadingInbox(true);
    const { data, error } = await supabase.rpc("get_my_conversations");
    if (error) setErrorMsg(error.message);
    else setConversations((data as ConversationRow[]) || []);
    setLoadingInbox(false);
  }, []);

  useEffect(() => {
    loadInbox();
  }, [loadInbox]);

  useEffect(() => {
    if (!targetUsername) return;
    let cancelled = false;
    (async () => {
      setErrorMsg(null);
      const { data: convId, error } = await supabase.rpc("get_or_create_conversation", {
        target_username: targetUsername,
      });
      if (cancelled) return;
      if (error) {
        setErrorMsg(error.message === "User not found" ? `User "${targetUsername}" not found.` : error.message);
        return;
      }
      if (convId) {
        openConversation(convId as string, {
          other_username: targetUsername,
          other_avatar_url: null,
          other_role: null,
          other_last_seen: null,
        });
        loadInbox();
        router.replace("/messages");
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUsername]);

  async function openConversation(
    convId: string,
    otherUserHint?: Pick<ConversationRow, "other_username" | "other_avatar_url" | "other_role" | "other_last_seen">
  ) {
    setActiveConvId(convId);
    setMobileView("thread");
    setLoadingThread(true);
    setErrorMsg(null);

    const existingRow = conversations.find((c) => c.conversation_id === convId);
    if (existingRow) {
      setActiveOtherUser({
        other_username: existingRow.other_username,
        other_avatar_url: existingRow.other_avatar_url,
        other_role: existingRow.other_role,
        other_last_seen: existingRow.other_last_seen,
      });
    } else if (otherUserHint) {
      setActiveOtherUser(otherUserHint);
    }

    const { data, error } = await supabase.rpc("get_conversation_messages", {
      conversation_id_input: convId,
    });

    if (error) {
      setErrorMsg(error.message);
      setMessages([]);
    } else {
      setMessages((data as MessageRow[]) || []);
    }
    setLoadingThread(false);

    supabase.rpc("mark_conversation_read", { conversation_id_input: convId });
    setConversations((prev) =>
      prev.map((c) => (c.conversation_id === convId ? { ...c, unread_count: 0 } : c))
    );
  }

  useEffect(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (!activeConvId) return;

    const channel = supabase
      .channel(`messages:${activeConvId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeConvId}` },
        (payload) => {
          const newMsg = payload.new as MessageRow;
          setMessages((prev) => (prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]));
          if (newMsg.sender_id !== currentUserId) {
            supabase.rpc("mark_conversation_read", { conversation_id_input: activeConvId });
          }
          setConversations((prev) => {
            const idx = prev.findIndex((c) => c.conversation_id === activeConvId);
            if (idx === -1) return prev;
            const updated = [...prev];
            updated[idx] = {
              ...updated[idx],
              last_message: newMsg.content,
              last_message_at: newMsg.created_at,
              last_message_sender_id: newMsg.sender_id,
            };
            const [row] = updated.splice(idx, 1);
            return [row, ...updated];
          });
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConvId, currentUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const content = draft.trim();
    if (!content || !activeConvId || sending) return;

    setSending(true);
    setDraft("");
    const { error } = await supabase.rpc("send_message", {
      conversation_id_input: activeConvId,
      content_input: content,
    });
    setSending(false);

    if (error) {
      setErrorMsg(error.message);
      setDraft(content);
    }
  }

  // ---------- Render ----------

  const otherBadge = ROLE_BADGES[activeOtherUser?.other_role || "member"] || ROLE_BADGES.member;
  const otherOnline = isOnline(activeOtherUser?.other_last_seen || null);

  return (
    <div style={{ minHeight: "100vh", background: "#050a0f", color: "#e7e7e7" }}>

     <Navbar/>

      <div className="dm-page-wrap" style={{ maxWidth: 1000, margin: "0 auto", padding: "80px 16px" }}>
        <div className="dm-breadcrumb" style={{ fontSize: 13, color: "#4a7a94", marginBottom: 14 }}>
          <span style={{ cursor: "pointer" }} onClick={() => router.push("/")}>Home</span>
          {" > "}
          <span style={{ color: "#6cc6ff" }}>Messages</span>
        </div>

        <div
          className={`dm-shell dm-view-${mobileView}`}
          style={{
            background: "#0a1520",
            border: "1px solid #1a2535",
            borderRadius: 10,
            overflow: "hidden",
            display: "flex",
            height: "70vh",
            minHeight: 480,
          }}
        >
          {/* ---------- Left pane: inbox ---------- */}
          <div className="dm-inbox" style={{ width: 300, flexShrink: 0, borderRight: "1px solid #1a2535", display: "flex", flexDirection: "column" }}>
            <div style={{
              padding: "14px 18px",
              borderBottom: "1px solid #1a2535",
              background: "linear-gradient(90deg, #4c5fd6, #6c7ef0)",
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>💬 Messages</span>
            </div>

            <div style={{ flex: 1, overflowY: "auto" }}>
              {loadingInbox && (
                <div style={{ padding: 16, fontSize: 13, color: "#4a7a94" }}>Loading conversations...</div>
              )}

              {!loadingInbox && conversations.length === 0 && (
                <div style={{ padding: 20, fontSize: 12.5, color: "#4a7a94", textAlign: "center", lineHeight: 1.7 }}>
                  No conversations yet.<br />Visit someone's profile and tap "💬 Message" to start one.
                </div>
              )}

              {conversations.map((c) => {
                const badge = ROLE_BADGES[c.other_role || "member"] || ROLE_BADGES.member;
                const online = isOnline(c.other_last_seen);
                const active = activeConvId === c.conversation_id;
                return (
                  <div
                    key={c.conversation_id}
                    onClick={() => openConversation(c.conversation_id)}
                    style={{
                      display: "flex",
                      gap: 10,
                      padding: "12px 16px",
                      borderBottom: "1px solid #101c28",
                      cursor: "pointer",
                      background: active ? "#122236" : "transparent",
                    }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: 6, flexShrink: 0,
                      border: `2px solid ${badge.color}`, overflow: "hidden",
                      background: "#1a2535", display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: 13, fontWeight: 700, color: badge.color,
                      position: "relative",
                    }}>
                      {c.other_avatar_url
                        ? <img src={c.other_avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : initials(c.other_username)}
                      <span style={{
                        position: "absolute", bottom: -1, right: -1, width: 9, height: 9,
                        borderRadius: "50%", border: "2px solid #0a1520",
                        background: online ? "#22c55e" : "#4a7a94",
                      }} />
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{
                          fontSize: 13, fontWeight: 700, color: "#6cc6ff",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {c.other_username}
                        </span>
                        <span style={{ fontSize: 10.5, color: "#4a7a94", flexShrink: 0, marginLeft: 6 }}>
                          {timeAgo(c.last_message_at)}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
                        <span style={{
                          fontSize: 12, color: c.unread_count > 0 ? "#c8dde8" : "#4a7a94",
                          fontWeight: c.unread_count > 0 ? 700 : 500,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 170,
                        }}>
                          {c.last_message_sender_id === currentUserId ? "You: " : ""}
                          {c.last_message || "Say hi 👋"}
                        </span>
                        {c.unread_count > 0 && (
                          <span style={{
                            marginLeft: 6, background: "#6c63ff", color: "#fff", fontSize: 9.5,
                            fontWeight: 800, borderRadius: 999, padding: "1px 6px", flexShrink: 0,
                          }}>
                            {c.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ---------- Right pane: conversation ---------- */}
          <div className="dm-thread" style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
            {!activeConvId && (
              <div style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                color: "#4a7a94", fontSize: 13, padding: "0 20px", textAlign: "center",
              }}>
                Select a conversation to start chatting
              </div>
            )}

            {activeConvId && (
              <>
                <div style={{
                  padding: "10px 18px", borderBottom: "1px solid #1a2535",
                  display: "flex", alignItems: "center", gap: 10, background: "#0d1c28", flexShrink: 0,
                }}>
                  <button
                    onClick={() => setMobileView("inbox")}
                    className="dm-back-btn"
                    style={{
                      background: "transparent", border: "none",
                      color: "#9ab0bf", fontSize: 18, cursor: "pointer", padding: "0 4px 0 0",
                      lineHeight: 1,
                    }}
                  >
                    ←
                  </button>

                  <div style={{
                    width: 34, height: 34, borderRadius: 6, flexShrink: 0,
                    border: `2px solid ${otherBadge.color}`, overflow: "hidden",
                    background: "#1a2535", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 12, fontWeight: 700, color: otherBadge.color,
                    cursor: "pointer",
                  }}
                    onClick={() => activeOtherUser?.other_username && router.push(`/profile/${activeOtherUser.other_username}`)}
                  >
                    {activeOtherUser?.other_avatar_url
                      ? <img src={activeOtherUser.other_avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : initials(activeOtherUser?.other_username || "?")}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13, fontWeight: 700, color: "#6cc6ff", cursor: "pointer",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}
                      onClick={() => activeOtherUser?.other_username && router.push(`/profile/${activeOtherUser.other_username}`)}
                    >
                      {activeOtherUser?.other_username}
                    </div>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 4, fontSize: 10.5,
                      color: otherOnline ? "#22c55e" : "#4a7a94", fontWeight: 600,
                    }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: otherOnline ? "#22c55e" : "#4a7a94",
                        boxShadow: otherOnline ? "0 0 5px #22c55e" : "none",
                        flexShrink: 0,
                      }} />
                      {otherOnline ? "Online" : "Offline"}
                    </div>
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
                  {loadingThread && <div style={{ fontSize: 13, color: "#4a7a94" }}>Loading messages...</div>}

                  {!loadingThread && messages.length === 0 && (
                    <div style={{ fontSize: 13, color: "#4a7a94", textAlign: "center", marginTop: 24 }}>
                      No messages yet — say hello 👋
                    </div>
                  )}

                  {messages.map((m) => {
                    const mine = m.sender_id === currentUserId;
                    return (
                      <div key={m.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
                        <div className="dm-bubble" style={{
                          maxWidth: "70%", padding: "8px 12px", borderRadius: 12,
                          fontSize: 13.5, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word",
                          background: mine ? "#6c63ff" : "#122236",
                          color: mine ? "#fff" : "#c8dde8",
                          border: mine ? "none" : "1px solid #1a2535",
                          borderBottomRightRadius: mine ? 3 : 12,
                          borderBottomLeftRadius: mine ? 12 : 3,
                        }}>
                          {m.content}
                          <div style={{
                            fontSize: 9.5, marginTop: 4,
                            color: mine ? "rgba(255,255,255,0.7)" : "#4a7a94",
                            textAlign: "right",
                          }}>
                            {formatMsgTime(m.created_at)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {errorMsg && (
                  <div style={{ padding: "6px 18px", color: "#ff6b6b", fontSize: 12 }}>{errorMsg}</div>
                )}

                <form
                  onSubmit={handleSend}
                  style={{
                    padding: "10px 12px", borderTop: "1px solid #1a2535",
                    display: "flex", gap: 8, alignItems: "center", flexShrink: 0,
                  }}
                >
                  <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Type a message..."
                    style={{
                      flex: 1, minWidth: 0, background: "#050a0f", border: "1px solid #1a2535",
                      borderRadius: 999, padding: "9px 16px", color: "#fff",
                      fontSize: 13.5, outline: "none", fontFamily: "inherit",
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!draft.trim() || sending}
                    style={{
                      flexShrink: 0,
                      background: draft.trim() && !sending ? "#6c63ff" : "#3a3760",
                      border: "none", color: "#fff", fontSize: 13, fontWeight: 700,
                      borderRadius: 999, padding: "9px 18px",
                      cursor: draft.trim() && !sending ? "pointer" : "not-allowed",
                    }}
                  >
                    Send
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>

      {/*
        Responsive rules:
        - Desktop (>640px): inbox (300px) + thread side by side, both always visible.
        - Mobile (<=640px): only ONE pane visible at a time, controlled by the
          dm-view-inbox / dm-view-thread class on the container. The back
          button (hidden on desktop) switches back to the inbox.
      */}
      <style>{`
        .dm-back-btn {
          display: none;
        }

        @media (max-width: 640px) {
          .dm-page-wrap {
            padding: 64px 8px 24px !important;
          }
          .dm-breadcrumb {
            margin-bottom: 8px !important;
          }
          .dm-shell {
            height: calc(100vh - 110px) !important;
            min-height: 380px !important;
            border-radius: 8px !important;
          }
          .dm-inbox,
          .dm-thread {
            width: 100% !important;
            flex: 1 1 100% !important;
          }
          .dm-view-inbox .dm-thread {
            display: none !important;
          }
          .dm-view-thread .dm-inbox {
            display: none !important;
          }
          .dm-inbox {
            border-right: none !important;
          }
          .dm-back-btn {
            display: inline-block !important;
          }
          .dm-bubble {
            max-width: 85% !important;
          }
        }
      `}</style>

     <Footbar/>

    </div>
  );
}