"use client";

import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footbar";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

// ── Data ──────────────────────────────────────────────────────
const ADS = [
  {
    id: 1,
    parts: [
      { text: "[EXOGATOR.com] #1 Crypto Drainer | +470 Wallet | +$800m drained | More... || ORVX.PW — Since 2019: cPanel, SMTP, RDP, Webmail, Accounts & Leads.", color: "#a855f7" },
    ],
  },
  {
    id: 2,
    parts: [
      { text: "Real Non-VoIP SMS Numbers | Instant OTP | Long Rental | Reuse Numbers FREE ", color: "#e91e8c" },
      { text: "|| Sirx.to shop — Since 2023: cPanel, SMTP, RDP, Webmail, Accounts & Leads.", color: "#00b4d8" },
    ],
  },
];

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

const PINNED: Record<string, { username: string; color: string; link: string; time: string } | null> = {
  General: { username: "Stack", color: "#27ae60", link: "http://mrcombo.cc/Thread-tier-2-auth-cracked-qparser-v2-multi-pentesting-tool", time: "2 days ago" },
  Marketplace: null,
  WTB: { username: "beastmode", color: "#e74c3c", link: "This channel is strictly for WTB (Want to Buy) requests. No WTS (Selling) offers or trolling.", time: "8 days ago" },
  Threads: { username: "Stack", color: "#27ae60", link: "http://mrcombo.cc/Thread-tier-2-auth-cracked-qparser-v2-multi-pentesting-tool", time: "2 days ago" },
};

const NAV_CATEGORIES = [
  { icon: "🏠", label: "Home", href: "/" },
  { icon: "⚙️", label: "Cracking", href: "/forum/cracking" },
  { icon: "💧", label: "Leaks", href: "/forum/leaks" },
  { icon: "💻", label: "Coding", href: "/forum/coding" },
  { icon: "💵", label: "Money", href: "/forum/money" },
  { icon: "🛒", label: "MarketPlace", href: "/forum/marketplace" },
  { icon: "⭐", label: "Premium", href: "/forum/premium" },
];

const FORUM_SECTIONS = [
  {
    name: "Forum",
    categories: [
      { icon: "📢", title: "Announcements", desc: "Look here for general announcements.", href: "/forum/announcements", subfolders: [] },
      { icon: "📁", title: "Changelogs", desc: "", href: "/forum/changelogs", folder: true },
      { icon: "📦", title: "Releases", desc: "Cracked programs provided exclusively by MRCombo.", href: "/forum/releases", subfolders: [] },
      { icon: "💬", title: "Feedback & Suggestions", desc: "Leave feedback or post suggestions to improve quality.", href: "/forum/feedback", subfolders: [] },
      { icon: "📁", title: "Solved", desc: "", href: "/forum/solved", folder: true },
      { icon: "🛟", title: "Support & Bugs", desc: "If you need help or have problems use this section.", href: "/forum/support", subfolders: ["Answered", "Ban Appeal", "Account Recovery"] },
    ],
  },
  {
    name: "General & Discussion",
    categories: [
      { icon: "🛋️", title: "The Lounge", desc: "The section you're looking for for chats.", href: "/forum/lounge", subfolders: ["Introductions", "HQ Lounge"] },
      { icon: "₿", title: "Crypto Currencies", desc: "Discussion area for Bitcoin, Ethereum, Litecoin and other coins.", href: "/forum/crypto", subfolders: [] },
      { icon: "🎬", title: "Entertainment", desc: "Talk about your favorite movies, TV shows, music.", href: "/forum/entertainment", subfolders: ["Music", "Movies / Series", "Games"] },
      { icon: "👤", title: "Personal Life", desc: "For great discussions about your life.", href: "/forum/personal", subfolders: [] },
      { icon: "🏆", title: "Achievements & Bragging", desc: "Showcase your dream achievements.", href: "/forum/achievements", subfolders: [] },
      { icon: "🎮", title: "Gaming", desc: "Everything related to gaming can be found here.", href: "/forum/gaming", subfolders: ["League of Legends", "Fortnite", "FPS", "MMORPG"] },
      { icon: "🎨", title: "Graphics", desc: "Show your awesome designs or creativity here.", href: "/forum/graphics", subfolders: ["Graphic Resources", "Paid Graphic Work"] },
      { icon: "💸", title: "Giveaways", desc: "Want to host a giveaway? This area is dedicated to giveaways.", href: "/forum/giveaways", subfolders: ["Ended Giveaways"] },
      { icon: "🌍", title: "International Lounge", desc: "A dedicated space for communication in languages other than English.", href: "/forum/international", subfolders: ["Français", "Español", "Italiano", "العَرَبِيَّة", "Türkçe", "Japan", "Brazil", "Korea", "Deutsch", "Morocco", "Português", "Indian"] },
    ],
  },
];

const ONLINE_ROLES = [
  { label: "Admin", count: 2, color: "#e74c3c" }, { label: "Reverser", count: null, color: "#27ae60" },
  { label: "Moderator", count: null, color: "#00b4d8" }, { label: "Developer", count: null, color: "#6c63ff" },
  { label: "Gladiator", count: 4, color: "#f0a500" }, { label: "Glory", count: 2, color: "#e91e8c" },
  { label: "Legendary", count: 4, color: "#f0a500" }, { label: "Coder", count: null, color: "#6c63ff" },
  { label: "Royal", count: 3, color: "#00b4d8" }, { label: "Designer", count: 2, color: "#e91e8c" },
  { label: "Diamond", count: 40, color: "#00b4d8" }, { label: "Nova", count: 85, color: "#f0a500" },
  { label: "Contributor", count: 5, color: "#f0a500" }, { label: "V.I.P", count: 7, color: "#e91e8c" },
  { label: "Member", count: 284, color: "#c8dde8" },
];

const STATS = [
  { value: "4,605,675", label: "Total Posts" },
  { value: "251,952", label: "Total Threads" },
  { value: "629,984", label: "Total Members" },
  { value: "Joeeeee", label: "Last Member" },
  { value: "338,873", label: "Most Online" },
];

const AVATAR_COLORS = ["#00b4d8", "#e91e8c", "#f0a500", "#6c63ff", "#27ae60", "#e74c3c"];
function randomColor() {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

// ── Modal ──────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }} onClick={onClose}>
      <div style={{ background: "#0a1520", border: "1px solid #0d2030", borderRadius: 12, width: "100%", maxWidth: 480, maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
        <div style={{ background: "#6c63ff", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>{title}</span>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 6, width: 28, height: 28, color: "#fff", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

// ── Avatar ─────────────────────────────────────────────────────
function Av({ l, size = 34 }: { l: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, flexShrink: 0, background: "#0a1520", border: "1px solid #0d2030", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, color: "#4a7a94", fontWeight: 700 }}>
      {l[0]?.toUpperCase()}
    </div>
  );
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

// ── Read Only Tab Content ──────────────────────────────────────
function ReadOnlyTabContent({ tab }: { tab: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      if (tab === "Marketplace") {
        const { data } = await supabase.rpc("get_thread_list", { category_input: "marketplace", subcategory_input: "lobby" });
        setItems(data || []);
      } else if (tab === "WTB") {
        const { data } = await supabase.rpc("get_thread_list", { category_input: "marketplace", subcategory_input: "buyers" });
        setItems(data || []);
      } else if (tab === "Threads") {
        const { data } = await supabase
          .from("threads")
          .select("id, title, category, subcategory, created_at, views_count")
          .order("created_at", { ascending: false })
          .limit(20);
        setItems(data || []);
      }
      setLoading(false);
    }
    load();
  }, [tab]);

  if (loading) return <div style={{ padding: "30px 0", textAlign: "center", color: "#3d6a80", fontSize: 12 }}>Loading...</div>;
  if (items.length === 0) return <div style={{ padding: "30px 0", textAlign: "center", color: "#3d6a80", fontSize: 12 }}>No {tab} posts yet.</div>;

  return (
    <>
      <div style={{ padding: "6px 12px", background: "#050a0f", borderBottom: "1px solid #0a1520", fontSize: 11, color: "#3d6a80", display: "flex", alignItems: "center", gap: 6 }}>
        <span>👁️</span>
        <span>Read-only — <a href={tab === "Marketplace" ? "/forum/marketplace/lobby" : tab === "WTB" ? "/forum/marketplace/buyers" : "/forum/cracking/tools"} style={{ color: "#00b4d8", textDecoration: "none" }}>Go to {tab} →</a></span>
      </div>
      {items.map((item, i) => (
        <a key={item.id || i} href={`/thread/${item.id}`} style={{ textDecoration: "none", display: "block" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "8px 12px", borderBottom: "1px solid #080e18" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#0a1520")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <div style={{ width: 34, height: 34, borderRadius: 6, flexShrink: 0, background: "#0a1520", border: "1px solid #0d2030", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
              {tab === "Marketplace" ? "🛒" : tab === "WTB" ? "🖨️" : "💬"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "#c8dde8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</div>
              <div style={{ fontSize: 10.5, color: "#3d6a80", marginTop: 2 }}>{item.category}/{item.subcategory} · {item.views_count || 0} views</div>
            </div>
          </div>
        </a>
      ))}
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [lastSent, setLastSent] = useState(0);

  const [chatTab, setChatTab] = useState("General");
  const [showOnline, setShowOnline] = useState(false);
  const [pinnedOpen, setPinnedOpen] = useState(true);
  const [modal, setModal] = useState<null | "topChatters" | "banned" | "aboutChat" | "settings">(null);
  const [soundOn, setSoundOn] = useState(true);
  const [customEmoji, setCustomEmoji] = useState(false);
  const [customAuto, setCustomAuto] = useState(false);

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const msgEndRef = useRef<HTMLDivElement>(null);

  // Top chatters & banned (live)
  const [topChatters, setTopChatters] = useState<any[]>([]);
  const [bannedUsers, setBannedUsers] = useState<any[]>([]);

  // Ban modal (admin)
  const [banModal, setBanModal] = useState(false);
  const [banUsername, setBanUsername] = useState("");
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState("");

  // DM
  const [dmOpen, setDmOpen] = useState(false);
  const [dmUser, setDmUser] = useState<{ id?: string; username: string } | null>(null);
  const [dmMessages, setDmMessages] = useState<any[]>([]);
  const [dmInput, setDmInput] = useState("");
  const [dmSending, setDmSending] = useState(false);

  const pinned = PINNED[chatTab];

  // Auth check
  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setAuthLoading(false);
      if (data.user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
        if (profile?.role === "admin") setIsAdmin(true);
      }
    }
    getUser();
  }, []);

  // Top chatters load
  useEffect(() => {
    supabase.from("chat_messages").select("username, color").then(({ data }) => {
      if (!data) return;
      const counts: Record<string, { count: number; color: string }> = {};
      data.forEach(m => {
        if (!counts[m.username]) counts[m.username] = { count: 0, color: m.color };
        counts[m.username].count++;
      });
      const sorted = Object.entries(counts)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10)
        .map(([username, val], i) => ({ rank: i + 1, username, ...val }));
      setTopChatters(sorted);
    });

    supabase.from("banned_users").select("*").order("created_at", { ascending: false }).then(({ data }) => setBannedUsers(data || []));
  }, []);

  // General chat messages + realtime
  useEffect(() => {
    if (chatTab !== "General") return;
    let isActive = true;

    supabase.from("chat_messages").select("*").eq("tab", "General").order("created_at", { ascending: true }).limit(50)
      .then(({ data, error }) => {
        if (isActive && data) setMessages(data as ChatMessage[]);
        if (error) console.error("Chat load error:", error.message);
      });

    const channel = supabase.channel("chat-General")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: "tab=eq.General" },
        (payload) => setMessages(prev => [...prev, payload.new as ChatMessage])
      ).subscribe();

    return () => { isActive = false; supabase.removeChannel(channel); };
  }, [chatTab]);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const handleSend = async () => {
    if (!user || chatTab !== "General") return;
    const text = messageInput.trim();
    if (!text || sending) return;
    if (Date.now() - lastSent < 2000) return;
    setLastSent(Date.now());

    const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).single();
    const name = profile?.username || user.email || "Anonymous";

    setSending(true);
    const { error } = await supabase.from("chat_messages").insert({
      username: name,
      avatar_letter: name[0]?.toUpperCase() || "?",
      color: randomColor(),
      content: text,
      tab: "General",
      user_id: user.id,
    });
    setSending(false);
    if (!error) setMessageInput("");
    else console.error("Send error:", error.message);
  };

  // Ban user (admin)
  async function handleBan() {
    if (!banUsername.trim() || !banReason.trim()) return;
    await supabase.from("banned_users").insert({
      username: banUsername.trim(),
      reason: banReason.trim(),
      duration: banDuration.trim() || "Permanent",
      banned_by: user?.id,
    });
    setBanModal(false);
    setBanUsername(""); setBanReason(""); setBanDuration("");
    const { data } = await supabase.from("banned_users").select("*").order("created_at", { ascending: false });
    setBannedUsers(data || []);
  }

  // Open DM
  async function openDm(username: string) {
    if (!user) { router.push("/login"); return; }
    setDmUser({ username });
    setDmOpen(true);
    setDmMessages([]);

    const { data: profile } = await supabase.from("profiles").select("id, username").eq("username", username).single();
    if (profile) {
      setDmUser({ id: profile.id, username: profile.username });
      const { data: msgs } = await supabase.from("dm_messages").select("*")
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${profile.id}),and(sender_id.eq.${profile.id},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: true });
      setDmMessages(msgs || []);
    }
  }

  // Send DM
  async function sendDm() {
    if (!dmInput.trim() || !dmUser?.id || !user || dmSending) return;
    setDmSending(true);
    const { data: myProfile } = await supabase.from("profiles").select("username").eq("id", user.id).single();
    await supabase.from("dm_messages").insert({
      sender_id: user.id,
      receiver_id: dmUser.id,
      sender_username: myProfile?.username || user.email,
      receiver_username: dmUser.username,
      content: dmInput.trim(),
    });
    setDmInput("");
    setDmSending(false);
    const { data: msgs } = await supabase.from("dm_messages").select("*")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${dmUser.id}),and(sender_id.eq.${dmUser.id},receiver_id.eq.${user.id})`)
      .order("created_at", { ascending: true });
    setDmMessages(msgs || []);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@700&family=Inter:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#050a0f;color:#b8cfd8;font-family:'Inter',sans-serif}
        .hp{min-height:100vh;background:#050a0f;display:flex;flex-direction:column}
        .hp-inner{flex:1;max-width:780px;width:100%;margin:0 auto;padding:16px 12px 48px}
        .hp-banner{width:100%;height:110px;border-radius:10px;overflow:hidden;margin-bottom:10px;position:relative;background:linear-gradient(135deg,#0a0520,#1a0840,#0a0520);border:1px solid #1a0a30;}
        .hp-banner-glow{position:absolute;inset:0;background:radial-gradient(ellipse 55% 80% at 25% 50%,rgba(168,85,247,.25) 0%,transparent 70%);}
        .hp-banner-content{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:36px;padding:0 24px;}
        .hp-banner-item{display:flex;align-items:center;gap:8px;font-family:'Rajdhani',sans-serif;font-size:16px;font-weight:700;color:#fff;letter-spacing:.5px;text-align:center;line-height:1.3;}
        .hp-slabel{text-align:center;font-size:11px;font-weight:700;letter-spacing:3px;color:#e74c3c;text-transform:uppercase;padding:12px;background:#080e18;border:1px solid #0d2030;border-radius:8px;margin-bottom:10px}
        .hp-ad{border-radius:8px;padding:11px 14px;font-size:12.5px;font-weight:600;line-height:1.65;margin-bottom:10px;border:1px solid #0d2030;background:#080e18;text-align:center;cursor:pointer;transition:border-color .2s}
        .hp-ad:hover{border-color:#6c63ff}
        .hp-chat{background:#080e18;border:1px solid #0d2030;border-radius:10px;overflow:hidden;margin-bottom:14px}
        .hp-ctoolbar{background:#6c63ff;padding:8px 12px;display:flex;align-items:center;gap:8px}
        .hp-cbtn{background:rgba(255,255,255,.2);border:none;border-radius:6px;padding:5px 14px;color:#fff;font-size:13px;font-weight:700;cursor:pointer}
        .hp-cicon{width:30px;height:30px;background:rgba(255,255,255,.12);border:none;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;cursor:pointer;transition:background .2s}
        .hp-cicon:hover{background:rgba(255,255,255,.25)}
        .hp-cnotice{display:flex;gap:10px;align-items:flex-start;padding:10px 14px;border-bottom:1px solid #0a1520;font-size:12px;color:#8ab0bf;line-height:1.55}
        .hp-ctabs{display:flex;background:#050a0f;border-bottom:1px solid #0a1520;overflow-x:auto}
        .hp-ctab{padding:8px 15px;font-size:12px;font-weight:600;border:none;background:none;cursor:pointer;color:#4a7a94;white-space:nowrap;border-bottom:2px solid transparent;transition:all .2s}
        .hp-ctab.on{color:#fff;border-bottom-color:#6c63ff}
        .hp-pinned{background:#050a0f;border-bottom:1px solid #0d2030;padding:8px 12px;display:flex;align-items:center;gap:8px;cursor:pointer}
        .hp-cmsgs{max-height:260px;overflow-y:auto}
        .hp-cmsgs::-webkit-scrollbar{width:3px}
        .hp-cmsgs::-webkit-scrollbar-thumb{background:#0d2030;border-radius:4px}
        .hp-cmsg{display:flex;align-items:flex-start;gap:9px;padding:8px 12px;border-bottom:1px solid #080e18}
        .hp-cinput-row{display:flex;gap:8px;padding:10px 12px;border-top:1px solid #0d2030;background:#050a0f}
        .hp-cinput{flex:1;background:#0a1520;border:1px solid #0d2030;border-radius:6px;padding:8px 12px;color:#c8dde8;font-size:13px;outline:none}
        .hp-cinput:focus{border-color:#6c63ff}
        .hp-csend{background:#6c63ff;border:none;border-radius:6px;padding:8px 16px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;flex-shrink:0}
        .hp-csend:disabled{opacity:.5;cursor:not-allowed}
        .hp-cats{display:flex;flex-direction:column;gap:5px;margin-bottom:16px}
        .hp-cat{display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:8px;font-size:13.5px;font-weight:600;cursor:pointer;border:1px solid #0d2030;transition:all .2s;background:#080e18;color:#8ab0bf;text-decoration:none}
        .hp-cat.on{background:#6c63ff;color:#fff;border-color:#6c63ff}
        .hp-cat:not(.on):hover{border-color:#6c63ff;color:#fff}
        .hp-fhdr{background:#6c63ff;border-radius:8px 8px 0 0;padding:10px 16px;display:flex;align-items:center}
        .hp-fbadge{background:rgba(255,255,255,.18);border-radius:5px;padding:3px 10px;font-size:12px;font-weight:700;color:#fff}
        .hp-flabel{font-size:10px;font-weight:700;letter-spacing:2px;color:#4a7a94;padding:7px 16px;background:#080e18;border-left:1px solid #0d2030;border-right:1px solid #0d2030}
        .hp-fbody{background:#080e18;border:1px solid #0d2030;border-top:none;border-radius:0 0 8px 8px;margin-bottom:14px;overflow:hidden}
        .hp-fcat{padding:13px 16px;border-bottom:1px solid #0a1520;cursor:pointer;transition:background .2s;text-decoration:none;display:block}
        .hp-fcat:hover{background:#0a1520}
        .hp-fcat:last-child{border-bottom:none}
        .hp-ffolder{padding:9px 16px;border-bottom:1px solid #0a1520;display:flex;align-items:center;gap:7px;color:#4a7a94;font-size:12.5px}
        .hp-online{background:#6c63ff;border-radius:10px;padding:14px 16px;margin-bottom:12px}
        .hp-online-row{display:flex;align-items:center;margin-bottom:4px}
        .hp-slbtn{display:flex;align-items:center;gap:5px;margin-left:auto;background:rgba(255,255,255,.15);border:none;border-radius:6px;padding:5px 11px;color:#fff;font-size:12px;font-weight:600;cursor:pointer}
        .hp-roles{background:#050a0f;border-radius:7px;padding:11px 13px;margin-top:10px;display:flex;flex-wrap:wrap;gap:7px;justify-content:center}
        .hp-stats{display:flex;flex-direction:column;gap:5px;margin-bottom:16px}
        .hp-srow{display:flex;background:#080e18;border:1px solid #0d2030;border-radius:8px;overflow:hidden}
        .hp-sval{padding:10px 16px;font-weight:700;font-size:14px;color:#fff;min-width:130px}
        .hp-slbl{padding:10px 16px;font-size:13px;color:#4a7a94;border-left:1px solid #0d2030;flex:1}
        .m-row{display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid #0d2030}
        .m-rank{font-size:13px;font-weight:700;color:#f0a500;width:28px;flex-shrink:0}
        .m-count{background:#1a1a2e;border:1px solid #0d2030;border-radius:6px;padding:4px 10px;font-size:13px;font-weight:700;color:#fff;flex-shrink:0;margin-left:auto}
        .m-dur{background:#e74c3c;border-radius:5px;padding:3px 8px;font-size:11px;font-weight:700;color:#fff;flex-shrink:0;margin-left:auto}
        .chk{width:18px;height:18px;border-radius:4px;border:1.5px solid #4a7a94;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0}
        .chk.on{background:#6c63ff;border-color:#6c63ff}
        .dm-bubble-mine{background:#6c63ff;border-radius:12px 12px 4px 12px;padding:8px 12px;max-width:75%;}
        .dm-bubble-other{background:#0d2030;border-radius:12px 12px 12px 4px;padding:8px 12px;max-width:75%;}
      `}</style>

      {/* ── Top Chatters Modal ── */}
      {modal === "topChatters" && (
        <Modal title="🏆 Top Chatters" onClose={() => setModal(null)}>
          {topChatters.length === 0 ? (
            <div style={{ padding: "30px", textAlign: "center", color: "#4a7a94" }}>No chat data yet.</div>
          ) : topChatters.map((u, i) => (
            <div key={i} className="m-row" style={{ cursor: "pointer" }}
              onClick={() => { setModal(null); openDm(u.username); }}
            >
              <span className="m-rank">#{u.rank}</span>
              <Av l={u.username} size={32} />
              <span style={{ fontWeight: 700, fontSize: 13, color: u.color, flex: 1 }}>{u.username}</span>
              <span className="m-count">{u.count}</span>
            </div>
          ))}
        </Modal>
      )}

      {/* ── Banned Users Modal ── */}
      {modal === "banned" && (
        <Modal title="🚫 Banned Users" onClose={() => setModal(null)}>
          {isAdmin && (
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #0d2030" }}>
              {!banModal ? (
                <button onClick={() => setBanModal(true)} style={{ background: "#e74c3c", border: "none", borderRadius: 6, padding: "7px 16px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  + Ban User
                </button>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <input placeholder="Username" value={banUsername} onChange={e => setBanUsername(e.target.value)}
                    style={{ background: "#0a1520", border: "1px solid #0d2030", borderRadius: 6, padding: "8px 12px", color: "#c8dde8", fontSize: 13, outline: "none" }} />
                  <input placeholder="Reason" value={banReason} onChange={e => setBanReason(e.target.value)}
                    style={{ background: "#0a1520", border: "1px solid #0d2030", borderRadius: 6, padding: "8px 12px", color: "#c8dde8", fontSize: 13, outline: "none" }} />
                  <input placeholder="Duration (e.g. 3d, 1mo, Permanent)" value={banDuration} onChange={e => setBanDuration(e.target.value)}
                    style={{ background: "#0a1520", border: "1px solid #0d2030", borderRadius: 6, padding: "8px 12px", color: "#c8dde8", fontSize: 13, outline: "none" }} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={handleBan} style={{ background: "#e74c3c", border: "none", borderRadius: 6, padding: "7px 16px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", flex: 1 }}>Ban</button>
                    <button onClick={() => setBanModal(false)} style={{ background: "#0a1520", border: "1px solid #0d2030", borderRadius: 6, padding: "7px 16px", color: "#c8dde8", fontSize: 13, cursor: "pointer" }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}
          {bannedUsers.length === 0 ? (
            <div style={{ padding: "30px", textAlign: "center", color: "#4a7a94" }}>No banned users.</div>
          ) : bannedUsers.map((u, i) => (
            <div key={i} className="m-row">
              <Av l={u.username[0]} size={36} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#c8dde8" }}>{u.username}</div>
                <div style={{ fontSize: 11, color: "#4a7a94" }}>{u.reason}</div>
              </div>
              <span className="m-dur">{u.duration}</span>
            </div>
          ))}
        </Modal>
      )}

      {/* ── About Chat Modal ── */}
      {modal === "aboutChat" && (
        <Modal title="❓ About Chat" onClose={() => setModal(null)}>
          <div style={{ padding: "16px 18px" }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#fff", marginBottom: 6 }}>Markdown</div>
              <div style={{ fontSize: 13, color: "#8ab0bf", lineHeight: 1.6 }}>MRCombo chat is powered with Markdown for easy text formatting.</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#fff", marginBottom: 6 }}>Styling text</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr>{["Style", "Syntax", "Output"].map(h => <th key={h} style={{ padding: "6px 8px", borderBottom: "1px solid #0d2030", color: "#c8dde8", textAlign: "left" }}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {[["Bold", "** **", "Bold text"], ["Italic", "* *", "Italicized text"], ["Strikethrough", "~~ ~~", "Strikethrough text"]].map(([s, sy, out], i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #0a1520" }}>
                      <td style={{ padding: "6px 8px", color: "#c8dde8" }}>{s}</td>
                      <td style={{ padding: "6px 8px", color: "#6c63ff", fontFamily: "monospace" }}>{sy}</td>
                      <td style={{ padding: "6px 8px", color: "#8ab0bf" }}>{out}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#fff", marginBottom: 6 }}>Mentioning user</div>
              <div style={{ fontSize: 13, color: "#8ab0bf", lineHeight: 1.6 }}>Type <span style={{ color: "#6c63ff", fontFamily: "monospace" }}>@username</span> to mention someone.</div>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Settings Modal ── */}
      {modal === "settings" && (
        <Modal title="⚙️ Settings" onClose={() => setModal(null)}>
          <div style={{ padding: "16px 18px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#4a7a94", marginBottom: 12 }}>NOTIFICATIONS</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ fontSize: 14, color: "#c8dde8" }}>Sound notifications</span>
              <div className={`chk ${soundOn ? "on" : ""}`} onClick={() => setSoundOn(v => !v)}>{soundOn && <span style={{ color: "#fff", fontSize: 12 }}>✓</span>}</div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#4a7a94", marginBottom: 12 }}>EMOJI</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 14, color: "#c8dde8" }}>Custom emotes only (picker)</span>
              <div className={`chk ${customEmoji ? "on" : ""}`} onClick={() => setCustomEmoji(v => !v)}>{customEmoji && <span style={{ color: "#fff", fontSize: 12 }}>✓</span>}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 14, color: "#c8dde8" }}>Custom emotes only (autocomplete)</span>
              <div className={`chk ${customAuto ? "on" : ""}`} onClick={() => setCustomAuto(v => !v)}>{customAuto && <span style={{ color: "#fff", fontSize: 12 }}>✓</span>}</div>
            </div>
          </div>
        </Modal>
      )}

      {/* ── DM Modal ── */}
      {dmOpen && dmUser && (
        <div style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => setDmOpen(false)}>
          <div style={{ background: "#0a1520", border: "1px solid #0d2030", borderRadius: 12, width: "100%", maxWidth: 440, maxHeight: "80vh", display: "flex", flexDirection: "column" }}
            onClick={e => e.stopPropagation()}>
            {/* DM Header */}
            <div style={{ background: "#6c63ff", padding: "12px 16px", borderRadius: "12px 12px 0 0", display: "flex", alignItems: "center", gap: 10 }}>
              <Av l={dmUser.username} size={32} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>{dmUser.username}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Direct Message</div>
              </div>
              <button onClick={() => setDmOpen(false)} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 6, width: 28, height: 28, color: "#fff", fontSize: 16, cursor: "pointer" }}>✕</button>
            </div>
            {/* DM Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: 8, minHeight: 220 }}>
              {dmMessages.length === 0 ? (
                <div style={{ textAlign: "center", color: "#4a7a94", fontSize: 13, padding: "30px 0" }}>No messages yet. Say hello! 👋</div>
              ) : dmMessages.map((m, i) => {
                const isMine = m.sender_id === user?.id;
                return (
                  <div key={i} style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start" }}>
                    <div className={isMine ? "dm-bubble-mine" : "dm-bubble-other"}>
                      <div style={{ fontSize: 13, color: "#fff" }}>{m.content}</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 4, textAlign: isMine ? "right" : "left" }}>{timeAgo(m.created_at)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* DM Input */}
            {!user ? (
              <div style={{ padding: "12px", borderTop: "1px solid #0d2030", textAlign: "center", fontSize: 13, color: "#4a7a94" }}>Login to send messages</div>
            ) : (
              <div style={{ display: "flex", gap: 8, padding: "10px 12px", borderTop: "1px solid #0d2030" }}>
                <input value={dmInput} onChange={e => setDmInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendDm()}
                  placeholder={`Message ${dmUser.username}...`}
                  style={{ flex: 1, background: "#0a1520", border: "1px solid #0d2030", borderRadius: 6, padding: "8px 12px", color: "#c8dde8", fontSize: 13, outline: "none" }} />
                <button onClick={sendDm} disabled={dmSending || !dmInput.trim()}
                  style={{ background: "#6c63ff", border: "none", borderRadius: 6, padding: "8px 14px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: dmSending || !dmInput.trim() ? 0.5 : 1 }}>
                  {dmSending ? "..." : "Send"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="hp">
        <Navbar />
        <div style={{ marginTop: 64 }}>

          {/* HERO */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 16px 28px", textAlign: "center", background: "radial-gradient(ellipse 70% 100% at 50% 0%, rgba(0,180,216,0.08) 0%, transparent 70%)" }}>
            <img src="/logo.png" alt="MRCombo" style={{ height: 170, width: "auto", objectFit: "contain", mixBlendMode: "lighten", marginBottom: 2, filter: "drop-shadow(0 0 35px rgba(0,180,216,0.4))" }} />
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: 4, color: "#7fd8ec", textTransform: "uppercase", marginTop: -6, textShadow: "0 0 16px rgba(0,180,216,0.45)" }}>
              Defying Every Limit
            </div>
          </div>

          <div className="hp-inner">

            <div className="hp-banner">
              <div className="hp-banner-glow" />
              <div className="hp-banner-content">
                <div className="hp-banner-item"><span style={{ color: "#a855f7", fontSize: 22 }}>⚡</span>FAST RESPONSE<br />FROM SELLERS</div>
                <div style={{ width: 1, height: 50, background: "rgba(168,85,247,.3)" }} />
                <div className="hp-banner-item"><span style={{ color: "#a855f7", fontSize: 22 }}>🔄</span>RELIABLE REPLACE<br />SYSTEM</div>
              </div>
            </div>

            <div className="hp-slabel">REFUNDING SERVICES</div>

            {ADS.map(ad => (
              <div key={ad.id} className="hp-ad">
                {ad.parts.map((p, i) => <span key={i} style={{ color: p.color }}>{p.text}</span>)}
              </div>
            ))}

            {/* ── CHAT ── */}
            <div className="hp-chat">
              <div className="hp-ctoolbar">
                <button className="hp-cbtn">Chat</button>
                <div style={{ flex: 1 }} />
                <button className="hp-cicon" title="Fullscreen" onClick={() => window.open("/chat", "_blank", "noopener,noreferrer")}>⤢</button>
                <button className="hp-cicon" title="Top Chatters" onClick={() => setModal("topChatters")}>🏆</button>
                {isAdmin && <button className="hp-cicon" title="Banned Users" onClick={() => setModal("banned")}>🚫</button>}
                <button className="hp-cicon" title="About Chat" onClick={() => setModal("aboutChat")}>❓</button>
                <button className="hp-cicon" title="Settings" onClick={() => setModal("settings")}>⚙️</button>
              </div>

              <div className="hp-cnotice">
                <span style={{ fontSize: 15 }}>✉️</span>
                <span><b>Welcome to MRCombo</b>, Please read the <span style={{ color: "#00b4d8", fontWeight: 600, cursor: "pointer" }}>forum rules</span> keep chatbox English at all times. Remember to run downloaded files in a <b>Virtual Machine or Sandboxie</b>. Don&apos;t trust anyone.</span>
              </div>

              <div className="hp-ctabs">
                {CHAT_TABS.map(t => (
                  <button key={t} className={`hp-ctab ${chatTab === t ? "on" : ""}`} onClick={() => setChatTab(t)}>{t}</button>
                ))}
              </div>

              {pinned && chatTab === "General" && (
                <div className="hp-pinned" onClick={() => setPinnedOpen(v => !v)}>
                  <span style={{ color: "#6c63ff", fontSize: 14 }}>📌</span>
                  <span style={{ color: "#6c63ff", fontWeight: 600, fontSize: 13 }}>Pinned Messages (1)</span>
                  <span style={{ marginLeft: "auto", color: "#6c63ff" }}>{pinnedOpen ? "▼" : "▶"}</span>
                </div>
              )}
              {pinned && pinnedOpen && chatTab === "General" && (
                <div style={{ padding: "10px 14px", borderBottom: "1px solid #0d2030", background: "#060c14" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ color: "#4a7a94", fontSize: 12 }}>@</span>
                    <Av l={pinned.username} size={28} />
                    <div style={{ flex: 1 }}>
                      <span style={{ color: pinned.color, fontWeight: 700, fontSize: 12 }}>{pinned.username}</span>{" "}
                      <span style={{ color: "#00b4d8", fontSize: 12, wordBreak: "break-all" }}>{pinned.link}</span>
                    </div>
                    <span style={{ color: "#3d6a80", fontSize: 11, flexShrink: 0 }}>{pinned.time}</span>
                  </div>
                </div>
              )}

              <div className="hp-cmsgs">
                {chatTab === "General" ? (
                  <>
                    {messages.length === 0 && (
                      <div style={{ padding: "20px 14px", textAlign: "center", color: "#3d6a80", fontSize: 12 }}>No messages yet. Be the first to say hi!</div>
                    )}
                    {messages.map((m, i) => (
                      <div key={m.id || i} className="hp-cmsg">
                        <Av l={m.avatar_letter} size={34} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                            <span
                              style={{ fontWeight: 700, fontSize: 12.5, color: m.color, cursor: "pointer" }}
                              onClick={() => openDm(m.username)}
                              title={`DM ${m.username}`}
                            >
                              {m.username}
                            </span>
                            {m.content && <span style={{ fontSize: 12.5, color: "#8ab0bf" }}>{m.content}</span>}
                          </div>
                          <div style={{ fontSize: 10.5, color: "#3d6a80", marginTop: 2 }}>{timeAgo(m.created_at)}</div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <ReadOnlyTabContent tab={chatTab} />
                )}
                <div ref={msgEndRef} />
              </div>

              {/* Input — sirf General tab mein */}
              <div className="hp-cinput-row" style={{ display: chatTab === "General" ? "flex" : "none" }}>
                <input
                  className="hp-cinput"
                  placeholder={user ? "Message #General..." : "🔒 Login to chat"}
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSend()}
                  disabled={!user}
                />
                <button className="hp-csend" onClick={handleSend} disabled={sending || !messageInput.trim() || !user}>
                  {!user ? "Login" : sending ? "..." : "Send"}
                </button>
              </div>
            </div>

            <div className="hp-cats">
              {NAV_CATEGORIES.map(c => (
                <a key={c.label} href={c.href} className="hp-cat">
                  <span style={{ fontSize: 17 }}>{c.icon}</span>{c.label}
                </a>
              ))}
            </div>

            {FORUM_SECTIONS.map(sec => (
              <div key={sec.name}>
                <div className="hp-fhdr"><span className="hp-fbadge">{sec.name}</span></div>
                <div className="hp-flabel">FORUM</div>
                <div className="hp-fbody">
                  {sec.categories.map((cat, i) => (
                    (cat as any).folder ? (
                      <div key={i} className="hp-ffolder"><span>📁</span><span style={{ fontWeight: 600 }}>{cat.title}</span></div>
                    ) : (
                      <a key={i} href={(cat as any).href || "#"} className="hp-fcat">
                        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                          <div style={{ width: 40, height: 40, flexShrink: 0, background: "#0a1520", border: "1px solid #0d2030", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{cat.icon}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 13.5, color: "#e4e4e7", marginBottom: 3 }}>{cat.title}</div>
                            {cat.desc && <div style={{ fontSize: 12, color: "#4a7a94", lineHeight: 1.5 }}>{cat.desc}</div>}
                            {(cat as any).subfolders?.length > 0 && (
                              <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 5 }}>
                                {(cat as any).subfolders.map((sf: string, si: number) => (
                                  <span key={sf} style={{ fontSize: 11, color: "#4a7a94", display: "flex", alignItems: "center", gap: 3 }}>
                                    📁 {sf}{si < (cat as any).subfolders.length - 1 && <span style={{ color: "#1a2a3a" }}>,</span>}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </a>
                    )
                  ))}
                </div>
              </div>
            ))}

            <div className="hp-online">
              <div className="hp-online-row">
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", flex: 1 }}>115,330 Users online | 461 members and 114,858 guests</div>
                <button className="hp-slbtn" onClick={() => setShowOnline(v => !v)}>👁️ {showOnline ? "Hide List" : "Show List"}</button>
              </div>
              {showOnline && (
                <div className="hp-roles">
                  {ONLINE_ROLES.map(r => (
                    <span key={r.label} style={{ color: r.color, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                      {r.label}{r.count ? `(${r.count})` : ""}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="hp-stats">
              {STATS.map(st => (
                <div key={st.label} className="hp-srow">
                  <div className="hp-sval">{st.value}</div>
                  <div className="hp-slbl">{st.label}</div>
                </div>
              ))}
            </div>

          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}
