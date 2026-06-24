"use client";

import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footbar";
import { supabase } from "@/lib/supabase";


const CHAT_TABS = ["General", "Marketplace", "WTB", "Threads"];

type ChatMessage = {
  id?: string;
  avatar_letter: string;
  username: string;
  color: string;
  created_at?: string;
  content: string;
  tab?: string;
};

const AVATAR_COLORS = ["#00b4d8","#e91e8c","#f0a500","#6c63ff","#27ae60","#e74c3c"];
function randomColor() {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

function timeAgo(dateStr?: string) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins>1?"s":""} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours>1?"s":""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days>1?"s":""} ago`;
}

function Av({ l, size=34 }: { l:string; size?:number }) {
  return (
    <div style={{
      width:size, height:size, flexShrink:0,
      background:"#0a1520", border:"1px solid #0d2030",
      borderRadius:6, display:"flex", alignItems:"center",
      justifyContent:"center", fontSize:size*0.38,
      color:"#4a7a94", fontWeight:700,
    }}>{l[0]?.toUpperCase()}</div>
  );
}

export default function FullscreenChat() {
  const [user, setUser] = useState<any>(null);
  const [chatTab, setChatTab] = useState("General");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [chatUsername, setChatUsername] = useState("");
  const [sending, setSending] = useState(false);
  const msgEndRef = useRef<HTMLDivElement>(null);

  
  useEffect(() => {
  const getUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user);

    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

      if (data?.username) {
        setChatUsername(data.username);
      }
    }
  };

  getUser();
}, []);

  useEffect(() => {
    let isActive = true;

   

    supabase
      .from("chat_messages")
      .select("*")
      .eq("tab", chatTab)
      .order("created_at", { ascending: true })
      .limit(100)
      .then(({ data, error }) => {
        if (isActive && data) setMessages(data as ChatMessage[]);
        if (error) console.error("Chat load error:", error.message);
      });

    const channel = supabase
      .channel("chat-fullscreen-" + chatTab)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `tab=eq.${chatTab}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      isActive = false;
      supabase.removeChannel(channel);
    };
  }, [chatTab]);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = messageInput.trim();
     const name = (chatUsername || user?.email || "User").trim();
    if (!text || !user || sending) return;

    setSending(true);
    sessionStorage.setItem("mrc_chat_username", name);

    const { error } = await supabase.from("chat_messages").insert({
      username: name,
      avatar_letter: name[0] || "?",
      color: randomColor(),
      content: text,
      tab: chatTab,
    });

    setSending(false);
    if (!error) setMessageInput("");
    else console.error("Send error:", error.message);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#050a0f", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <div style={{ marginTop: 64, flex: 1, maxWidth: 720, width: "100%", margin: "64px auto 0", padding: "20px 12px" }}>

        <div style={{ marginBottom: 14 }}>
          <a href="/" style={{ color: "#4a7a94", fontSize: 13, textDecoration: "none" }}>← Back to Home</a>
        </div>

        <div style={{ background: "#080e18", border: "1px solid #0d2030", borderRadius: 10, overflow: "hidden", display: "flex", flexDirection: "column", height: "calc(100vh - 200px)", minHeight: 480 }}>

          <div style={{ background: "#6c63ff", padding: "12px 16px", display: "flex", alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>💬 MRCombo Chat</span>
          </div>

          <div style={{ display: "flex", background: "#050a0f", borderBottom: "1px solid #0a1520", overflowX: "auto" }}>
            {CHAT_TABS.map(t => (
              <button key={t}
                onClick={() => setChatTab(t)}
                style={{
                  padding: "10px 18px", fontSize: 13, fontWeight: 600, border: "none",
                  background: "none", cursor: "pointer", whiteSpace: "nowrap",
                  color: chatTab === t ? "#fff" : "#4a7a94",
                  borderBottom: chatTab === t ? "2px solid #6c63ff" : "2px solid transparent",
                }}>
                {t}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {messages.length === 0 && (
              <div style={{ padding: "30px 14px", textAlign: "center", color: "#3d6a80", fontSize: 13 }}>
                No messages yet. Be the first to say hi!
              </div>
            )}
            {messages.map((m, i) => (
              <div key={m.id || i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 16px", borderBottom: "1px solid #080e18" }}>
                <Av l={m.avatar_letter} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: m.color }}>{m.username}</span>
                    {m.content && <span style={{ fontSize: 13, color: "#8ab0bf" }}>{m.content}</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "#3d6a80", marginTop: 2 }}>{timeAgo(m.created_at)}</div>
                </div>
              </div>
            ))}
            <div ref={msgEndRef} />
          </div>

         <div style={{ padding: "8px 12px 0", background: "#050a0f" }}>
  {!user && (
    <div style={{ color: "#f59e0b", fontSize: 13, marginBottom: 8 }}>
      Login required to send messages.
    </div>
  )}

  <div style={{ display: "flex", gap: 8, padding: "12px 0", borderTop: "1px solid #0d2030" }}>
           {!user && (
  <div
    style={{
      color: "#f59e0b",
      fontSize: 13,
      marginBottom: 8,
    }}
  >
    Login required to send messages.
  </div>
)}
            <input
              placeholder={`Message #${chatTab}...`}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              maxLength={300}
              style={{ flex: 1, background: "#0a1520", border: "1px solid #0d2030", borderRadius: 6, padding: "9px 12px", color: "#c8dde8", fontSize: 13, outline: "none" }}
            />
           <button
  onClick={handleSend}
  disabled={!user || sending || !messageInput.trim()}
  style={{
    background: !user ? "#2a2f3a" : "#6c63ff",
    border: "none",
    borderRadius: 6,
    padding: "9px 18px",
    color: !user ? "#6a7a8a" : "#fff",
    fontSize: 13,
    fontWeight: 700,
    cursor: !user ? "not-allowed" : "pointer",
    flexShrink: 0,
    opacity: sending || !messageInput.trim() ? 0.6 : 1,
    transition: "all 0.2s ease",
  }}
>
  {!user ? "Login Required" : sending ? "Sending..." : "Send"}
</button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
    </div>
  );
   }


