"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footbar";
import ThreadList from "@/components/ThreadList";
import CreateThreadModal from "@/components/CreateThreadModal";
import type { ThreadListItem } from "@/lib/types";

const ALLOWED_ROLES = ["admin", "moderator", "vip", "vip+", "lifetime"];

type VipMessage = {
  id?: string;
  username: string;
  color: string;
  content: string;
  created_at?: string;
};

const AVATAR_COLORS = ["#00b4d8", "#a855f7", "#f59e0b", "#22c55e", "#e74c3c", "#6c63ff"];
function randomColor() {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}
function timeAgo(dateStr?: string) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function PremiumPageClient({ subcategory }: { subcategory: string }) {
  const [threads, setThreads] = useState<ThreadListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // VIP Chat state
  const [messages, setMessages] = useState<VipMessage[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [sending, setSending] = useState(false);
  const [lastSent, setLastSent] = useState(0);
  const msgEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function checkAccess() {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) { setCheckingAuth(false); return; }
      setUserId(uid);

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, username")
        .eq("id", uid)
        .single();

      const role = profile?.role || "member";
      setUserRole(role);
      setUsername(profile?.username || userData.user?.email || "Anonymous");
      setHasAccess(ALLOWED_ROLES.includes(role));
      setCheckingAuth(false);
    }
    checkAccess();
  }, []);

  // VIP Chat — load + realtime
  useEffect(() => {
    if (!hasAccess || subcategory !== "general") return;

    supabase
      .from("chat_messages")
      .select("*")
      .eq("tab", "vip-general")
      .order("created_at", { ascending: true })
      .limit(60)
      .then(({ data }) => setMessages((data as VipMessage[]) || []));

    const channel = supabase
      .channel("vip-general-chat")
      .on("postgres_changes", {
        event: "INSERT", schema: "public",
        table: "chat_messages",
        filter: "tab=eq.vip-general",
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as VipMessage]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [hasAccess, subcategory]);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadThreads() {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_thread_list", {
      category_input: "premium",
      subcategory_input: subcategory,
    });
    if (!error) setThreads(data || []);
    setLoading(false);
  }

  useEffect(() => {
    if (hasAccess && subcategory === "leaks") loadThreads();
  }, [hasAccess, subcategory]);

  async function handleSend() {
    if (!msgInput.trim() || sending || !userId) return;
    if (Date.now() - lastSent < 2000) return;
    setLastSent(Date.now());
    setSending(true);

    await supabase.from("chat_messages").insert({
      username,
      avatar_letter: username[0]?.toUpperCase() || "V",
      color: randomColor(),
      content: msgInput.trim(),
      tab: "vip-general",
    });

    setSending(false);
    setMsgInput("");
  }

  // Loading
  if (checkingAuth) {
    return (
      <div style={{ minHeight: "100vh", background: "#050a0f" }}>
        <Navbar />
        <div style={{ textAlign: "center", padding: "120px 0", color: "#4a7a94" }}>
          Checking access...
        </div>
        <Footer />
      </div>
    );
  }

  // No access
  if (!hasAccess) {
    return (
      <div style={{ minHeight: "100vh", background: "#050a0f" }}>
        <Navbar />
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "100px 16px", textAlign: "center" }}>
          <div style={{
            width: 90, height: 90, borderRadius: "50%",
            background: "linear-gradient(135deg, #1a0840, #0d1f2d)",
            border: "2px solid #6c63ff44",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 40, margin: "0 auto 24px",
          }}>🔒</div>

          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#e7e7e7", margin: "0 0 12px" }}>
            Premium Area
          </h1>
          <p style={{ fontSize: 14, color: "#9a9ca3", lineHeight: 1.7, marginBottom: 32 }}>
            This section is exclusive to{" "}
            <strong style={{ color: "#00b4d8" }}>VIP</strong>,{" "}
            <strong style={{ color: "#a855f7" }}>VIP+</strong>, and{" "}
            <strong style={{ color: "#f59e0b" }}>Lifetime</strong> members.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 32 }}>
            {[
              { name: "VIP", price: "$9.99/mo", color: "#00b4d8", icon: "⭐" },
              { name: "VIP+", price: "$19.99/mo", color: "#a855f7", icon: "💎" },
              { name: "Lifetime", price: "$49.99", color: "#f59e0b", icon: "👑" },
            ].map(t => (
              <div key={t.name} style={{
                background: "#0a1520", border: `1px solid ${t.color}44`,
                borderRadius: 10, padding: "16px 12px", textAlign: "center",
              }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{t.icon}</div>
                <div style={{ fontWeight: 700, color: t.color, fontSize: 14 }}>{t.name}</div>
                <div style={{ fontSize: 12, color: "#9a9ca3", marginTop: 4 }}>{t.price}</div>
              </div>
            ))}
          </div>

          <Link href="/upgrade" style={{
            display: "inline-block",
            background: "linear-gradient(135deg, #6c63ff, #a855f7)",
            borderRadius: 10, padding: "14px 40px",
            color: "#fff", fontSize: 15, fontWeight: 700, textDecoration: "none",
          }}>
            Upgrade Now →
          </Link>

          <div style={{ marginTop: 16 }}>
            <Link href="/" style={{ fontSize: 13, color: "#4a7a94", textDecoration: "none" }}>
              ← Back to Home
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ── VIP GENERAL CHAT ──
  if (subcategory === "general") {
    return (
      <div style={{ minHeight: "100vh", background: "#050a0f" }}>
        <Navbar />
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "80px 12px 48px" }}>

          <div style={{ fontSize: 13, color: "#4a7a94", marginBottom: 16 }}>
            <Link href="/" style={{ color: "#4a7a94", textDecoration: "none" }}>Home</Link>
            {" › "}
            <Link href="/forum/premium" style={{ color: "#4a7a94", textDecoration: "none" }}>Premium</Link>
            {" › "} VIP General Chat
          </div>

          {/* Chat Box */}
          <div style={{ background: "#080e18", border: "1px solid #6c63ff33", borderRadius: 12, overflow: "hidden" }}>

            {/* Header */}
            <div style={{
              background: "linear-gradient(135deg, #6c63ff, #a855f7)",
              padding: "14px 18px", display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "rgba(255,255,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
              }}>⭐</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>VIP General Chat</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
                  Exclusive to VIP members · {userRole?.toUpperCase()}
                </div>
              </div>
              <div style={{
                marginLeft: "auto", display: "flex", alignItems: "center", gap: 6,
                background: "rgba(255,255,255,0.1)", borderRadius: 20, padding: "4px 12px",
              }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e" }} />
                <span style={{ fontSize: 12, color: "#fff" }}>Live</span>
              </div>
            </div>

            {/* Notice */}
            <div style={{
              padding: "10px 16px", background: "#050a0f",
              borderBottom: "1px solid #0d2030",
              fontSize: 12, color: "#4a7a94", display: "flex", gap: 8,
            }}>
              <span>👑</span>
              <span>Welcome to VIP Chat — Keep discussions high quality. No spam or ads.</span>
            </div>

            {/* Messages */}
            <div style={{ maxHeight: 380, overflowY: "auto", padding: "8px 0" }}>
              {messages.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#4a7a94", fontSize: 13 }}>
                  No messages yet. Start the conversation!
                </div>
              )}
              {messages.map((m, i) => (
                <div key={m.id || i} style={{
                  display: "flex", gap: 10, padding: "8px 16px",
                  borderBottom: "1px solid #080e18",
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                    background: m.color + "22", border: `1px solid ${m.color}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 700, color: m.color,
                  }}>
                    {m.username?.[0]?.toUpperCase() || "V"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 2 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: m.color }}>{m.username}</span>
                      <span style={{ fontSize: 10, color: "#3d6a80" }}>{timeAgo(m.created_at)}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "#c8dde8", lineHeight: 1.5 }}>{m.content}</div>
                  </div>
                </div>
              ))}
              <div ref={msgEndRef} />
            </div>

            {/* Input */}
            <div style={{
              display: "flex", gap: 8, padding: "12px 14px",
              borderTop: "1px solid #0d2030", background: "#050a0f",
            }}>
              <input
                value={msgInput}
                onChange={e => setMsgInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                placeholder="Message VIP General..."
                style={{
                  flex: 1, background: "#0a1520", border: "1px solid #6c63ff44",
                  borderRadius: 8, padding: "10px 14px", color: "#c8dde8",
                  fontSize: 13, outline: "none",
                }}
              />
              <button onClick={handleSend} disabled={sending || !msgInput.trim()} style={{
                background: "linear-gradient(135deg, #6c63ff, #a855f7)",
                border: "none", borderRadius: 8, padding: "10px 20px",
                color: "#fff", fontSize: 13, fontWeight: 700,
                cursor: sending ? "not-allowed" : "pointer",
                opacity: sending || !msgInput.trim() ? 0.5 : 1,
              }}>
                {sending ? "..." : "Send"}
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ── VIP LEAKS ──
  return (
    <div style={{ minHeight: "100vh", background: "#050a0f" }}>
      <Navbar />
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "80px 12px 48px" }}>

        <div style={{ fontSize: 13, color: "#4a7a94", marginBottom: 16 }}>
          <Link href="/" style={{ color: "#4a7a94", textDecoration: "none" }}>Home</Link>
          {" › "}
          <Link href="/forum/premium" style={{ color: "#4a7a94", textDecoration: "none" }}>Premium</Link>
          {" › "} VIP Leaks
        </div>

        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #a855f7, #6c63ff)",
          borderRadius: "8px 8px 0 0", padding: "12px 16px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 20 }}>💎</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>VIP Leaks</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Exclusive content for premium members</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600,
              background: "rgba(255,255,255,0.15)", padding: "3px 10px", borderRadius: 4,
            }}>
              {userRole?.toUpperCase()}
            </span>
            {["admin", "moderator"].includes(userRole || "") && (
              <button onClick={() => setModalOpen(true)} style={{
                background: "rgba(255,255,255,0.2)", border: "none",
                borderRadius: 6, padding: "6px 14px", color: "#fff",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}>
                + New Leak
              </button>
            )}
          </div>
        </div>

        <div style={{
          background: "#080e18", border: "1px solid #0d2030",
          borderTop: "none", borderRadius: "0 0 8px 8px", padding: 20,
        }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#4a7a94" }}>Loading...</div>
          ) : (
            <ThreadList threads={threads} />
          )}
        </div>
      </div>

      <CreateThreadModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); loadThreads(); }}
        category="premium"
        subcategory={subcategory}
      />
      <Footer />
    </div>
  );
}