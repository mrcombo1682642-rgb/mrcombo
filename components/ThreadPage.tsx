"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import PremiumOfferBanner from "@/components/PremiumOfferBanner";
import DailyLimitBadge from "@/components/DailyLimitBadge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footbar";

interface ThreadPageProps {
  threadId: string;
}

interface ThreadDetail {
  id: string;
  title: string;
  content: string;
  category: string;
  subcategory: string;
  created_at: string;
  user_id: string | null;
  pinned: boolean;
  locked: boolean;
  views_count: number;
  username: string | null;
  avatar_url: string | null;
  role: string | null;
  badge: string | null;
  signature: string | null;
  join_date: string | null;
  likes_count: number;
  dislikes_count: number;
  author_rep: number;
  author_likes_given: number;
  author_posts_count: number;
  author_threads_count: number;
  author_last_seen: string | null;
}

interface Reply {
  id: string;
  thread_id: string;
  content: string;
  created_at: string;
  edited_at: string | null;
  user_id: string | null;
  image_url?: string | null;
  video_url?: string | null;
  username: string | null;
  avatar_url: string | null;
  role: string | null;
  badge: string | null;
  likes_count: number;
  dislikes_count: number;
  author_rep: number;
  author_likes_given: number;
  author_posts_count: number;
  author_threads_count: number;
  author_last_seen: string | null;
  author_join_date?: string | null;
}

const STORAGE_BUCKET = "thread-attachments";
const MAX_FILE_SIZE_MB = 25;
const ONLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
const HEARTBEAT_INTERVAL_MS = 60 * 1000; // 60 seconds
const POSTS_PER_PAGE = 10;

// ── Accent color — matches reference screenshots (blue, not purple) ──
const ACCENT = "#2f6fed";
const ACCENT_HOVER = "#255fd6";

const ROLE_BADGES: Record<string, { label: string; color: string; icon: string }> = {
  admin:     { label: "Admin",     color: "#ff6b6b", icon: "👑" },
  moderator: { label: "Moderator", color: "#6cc6ff", icon: "🛡️" },
  vip:       { label: "VIP",       color: "#00b4d8", icon: "⭐" },
  "vip+":    { label: "VIP+",      color: "#a855f7", icon: "💎" },
  lifetime:  { label: "Lifetime",  color: "#f59e0b", icon: "♛" },
  member:    { label: "Member",    color: "#33507a", icon: "👤" },
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

function formatFullDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-GB", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatJoinDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function isOnline(lastSeen: string | null) {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < ONLINE_THRESHOLD_MS;
}

/* ─────────────────────────────────────────────────────────
   Icon set — replaces emoji with clean line icons so the UI
   matches the reference screenshots exactly.
───────────────────────────────────────────────────────── */
function Icon({ name, size = 15, color = "currentColor", strokeWidth = 2 }: {
  name: string; size?: number; color?: string; strokeWidth?: number;
}) {
  const p = {
    width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: color, strokeWidth, strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "eye":
      return <svg {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" /><circle cx="12" cy="12" r="3" /></svg>;
    case "message":
      return <svg {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
    case "clock":
      return <svg {...p}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>;
    case "flag":
      return <svg {...p}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>;
    case "edit":
      return <svg {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" /></svg>;
    case "trash":
      return <svg {...p}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>;
    case "thumbsUp":
      return <svg {...p}><path d="M7 10v12" /><path d="M15 5.88 14 10h6.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 18.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3 3 0 0 1 3 3.88Z" /></svg>;
    case "thumbsDown":
      return <svg {...p}><path d="M17 14V2" /><path d="M9 18.12 10 14H3.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 5.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3 3 0 0 1-3-3.88Z" /></svg>;
    case "share":
      return <svg {...p}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.6" y1="13.5" x2="15.4" y2="17.5" /><line x1="15.4" y1="6.5" x2="8.6" y2="10.5" /></svg>;
    case "check":
      return <svg {...p}><polyline points="20 6 9 17 4 12" /></svg>;
    case "moreVertical":
      return <svg {...p}><circle cx="12" cy="5" r="1.4" fill={color} stroke="none" /><circle cx="12" cy="12" r="1.4" fill={color} stroke="none" /><circle cx="12" cy="19" r="1.4" fill={color} stroke="none" /></svg>;
    case "smile":
      return <svg {...p}><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>;
    case "image":
      return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>;
    case "video":
      return <svg {...p}><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>;
    case "lock":
      return <svg {...p}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
    case "unlockDoc":
      return <svg {...p}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>;
    case "link":
      return <svg {...p}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>;
    case "externalLink":
      return <svg {...p}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>;
    case "chevronRight":
      return <svg {...p}><polyline points="9 18 15 12 9 6" /></svg>;
    default:
      return null;
  }
}

// Raw SVG markup — used inside dangerouslySetInnerHTML hidden-link cards
const SVG_LINK = `<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;
const SVG_LOCK = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ab0bf" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
const SVG_CHECK = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
const SVG_EXTERNAL = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#cfe0ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;

// ── Resolve hidden link blocks in thread content — locked / unlocked
// card design matching the reference mockups exactly. ──
async function resolveHiddenBlocks(html: string): Promise<string> {
  if (!html.includes("data-hlb-id")) return html;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const blocks = Array.from(doc.querySelectorAll("[data-hlb-id]"));
  if (blocks.length === 0) return html;

  await Promise.all(
    blocks.map(async (el) => {
      const blockId = el.getAttribute("data-hlb-id");
      if (!blockId) return;

      const { data: content } = await supabase.rpc("get_hidden_block", { block_id: blockId });

      if (content) {
        // ── UNLOCKED CARD ──
        el.outerHTML = `
          <div style="border:1px solid #2a3a6e;border-radius:10px;padding:16px;background:#0d1730;margin:12px 0;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
              <div style="display:flex;gap:12px;align-items:flex-start;">
                <div style="width:44px;height:44px;border-radius:10px;background:${ACCENT};display:flex;align-items:center;justify-content:center;flex-shrink:0;">${SVG_LINK}</div>
                <div>
                  <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                    <span style="font-weight:700;color:#fff;font-size:14px;">Hidden Link</span>
                    <span style="background:rgba(34,197,94,0.15);color:#22c55e;font-size:11px;font-weight:700;padding:2px 9px;border-radius:4px;">Unlocked</span>
                  </div>
                  <div style="color:#9ab0bf;font-size:12.5px;margin-top:3px;line-height:1.5;">This link is visible because you are an Admin / Premium user.</div>
                </div>
              </div>
              <div style="width:28px;height:28px;border-radius:50%;background:rgba(34,197,94,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;">${SVG_CHECK}</div>
            </div>
            <div style="margin-top:12px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;background:#0a1520;border:1px solid #1a3042;border-radius:8px;padding:10px 14px;">
              <div style="color:#6cc6ff;font-size:13px;word-break:break-all;">${content}</div>
              <a href="${content}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:6px;background:#12203a;border:1px solid #2a3a6e;color:#cfe0ff;padding:7px 14px;border-radius:6px;font-size:12px;font-weight:700;text-decoration:none;white-space:nowrap;">Open Link ${SVG_EXTERNAL}</a>
            </div>
          </div>`;
      } else {
        // ── LOCKED CARD ──
        el.outerHTML = `
          <div style="border:1px solid #2a3a6e;border-radius:10px;padding:16px;background:#0d1730;margin:12px 0;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;">
              <div style="display:flex;gap:12px;align-items:flex-start;">
                <div style="width:44px;height:44px;border-radius:10px;background:${ACCENT};display:flex;align-items:center;justify-content:center;flex-shrink:0;">${SVG_LINK}</div>
                <div>
                  <div style="font-weight:700;color:#fff;font-size:14px;">Hidden Link</div>
                  <div style="color:#9ab0bf;font-size:12.5px;margin-top:3px;line-height:1.5;">Reply to this thread to unlock this link, or upgrade to Premium to view without replying.</div>
                </div>
              </div>
              <div style="display:flex;flex-direction:column;align-items:flex-end;gap:10px;">
                <div style="width:32px;height:32px;border-radius:50%;background:#1a2535;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${SVG_LOCK}</div>
                <a href="#reply-box" style="background:${ACCENT};color:#fff;padding:8px 16px;border-radius:6px;font-size:12.5px;font-weight:700;text-decoration:none;white-space:nowrap;">Reply to Unlock</a>
              </div>
            </div>
          </div>`;
      }
    })
  );

  return doc.body.innerHTML;
}

// ── List-style author sidebar (matches reference: name, status,
// avatar, role badge, then a stacked label/value stats list) ──
function PostAuthorSidebar({
  username,
  avatarUrl,
  role,
  online,
  rep,
  likesGiven,
  postsCount,
  threadsCount,
  joinDate,
  onClick,
}: {
  username: string | null;
  avatarUrl: string | null;
  role: string | null;
  online: boolean;
  rep: number;
  likesGiven: number;
  postsCount: number;
  threadsCount: number;
  joinDate?: string | null;
  onClick: () => void;
}) {
  const badge = ROLE_BADGES[role || "member"] || ROLE_BADGES.member;

  return (
    <div style={{ width: 150, flexShrink: 0 }}>
      <div
        onClick={onClick}
        style={{ fontSize: 14, fontWeight: 700, color: "#6cc6ff", cursor: username ? "pointer" : "default" }}
      >
        {username || "Unknown"}
      </div>
      <div style={{ fontSize: 12, color: online ? "#22c55e" : "#4a7a94", fontWeight: 600, marginTop: 2 }}>
        {online ? "Online" : "Offline"}
      </div>

      <div
        onClick={onClick}
        style={{
          width: 96, height: 96, borderRadius: 8, margin: "10px 0 10px",
          border: "1px solid #1a2535", overflow: "hidden",
          background: "#1a2535", display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 26, fontWeight: 700,
          color: "#4a5568", cursor: username ? "pointer" : "default",
        }}
      >
        {avatarUrl
          ? <img src={avatarUrl} alt={username || "avatar"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a8 8 0 0 1 16 0v1"/></svg>
        }
      </div>

      <div style={{
        display: "inline-block", fontSize: 10.5, fontWeight: 700,
        color: "#fff", background: badge.color,
        borderRadius: 4, padding: "3px 12px", marginBottom: 10, letterSpacing: 0.5,
      }}>
        {badge.label.toUpperCase()}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <StatRow label="REP" value={rep} />
        <StatRow label="LIKES" value={likesGiven} />
        <StatRow label="POSTS" value={postsCount} />
        <StatRow label="THREADS" value={threadsCount} />
        <StatRow label="JOINED" value={formatJoinDate(joinDate)} />
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5 }}>
      <span style={{ color: "#4a7a94", fontWeight: 600 }}>{label}</span>
      <span style={{ color: "#c8dde8", fontWeight: 700 }}>{value}</span>
    </div>
  );
}

// ── Report (left) + Like / Dislike / Share (right) action row ──
function PostActionsRow({
  canManage,
  onEdit,
  onDelete,
  onReport,
  showReport,
  liked,
  onLike,
  likeCount,
  disliked,
  onDislike,
  dislikeCount,
  onShare,
  shareCopied,
  disabled,
}: {
  canManage: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onReport: () => void;
  showReport: boolean;
  liked: boolean;
  onLike: () => void;
  likeCount: number;
  disliked: boolean;
  onDislike: () => void;
  dislikeCount: number;
  onShare?: () => void;
  shareCopied?: boolean;
  disabled: boolean;
}) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      marginTop: 16, flexWrap: "wrap", gap: 10,
    }}>
      <div style={{ display: "flex", gap: 8 }}>
        {showReport && (
          <button onClick={onReport} style={pillBtn}><Icon name="flag" size={13} /> Report</button>
        )}
        {canManage && onEdit && (
          <button onClick={onEdit} style={pillBtn}><Icon name="edit" size={13} /> Edit</button>
        )}
        {canManage && onDelete && (
          <button onClick={onDelete} style={{ ...pillBtn, color: "#ef4444", borderColor: "#ef444444" }}><Icon name="trash" size={13} /> Delete</button>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button
          onClick={onLike}
          disabled={disabled}
          style={{
            ...pillBtn,
            color: liked ? "#22c55e" : "#9ab0bf",
            borderColor: liked ? "#22c55e66" : "#1a2535",
            background: liked ? "rgba(34,197,94,0.1)" : "transparent",
          }}
        >
          <Icon name="thumbsUp" size={13} /> {likeCount}
        </button>
        <button
          onClick={onDislike}
          disabled={disabled}
          style={{
            ...pillBtn,
            color: disliked ? "#ef4444" : "#9ab0bf",
            borderColor: disliked ? "#ef444466" : "#1a2535",
            background: disliked ? "rgba(239,68,68,0.1)" : "transparent",
          }}
        >
          <Icon name="thumbsDown" size={13} /> {dislikeCount}
        </button>
        {onShare && (
          <button onClick={onShare} style={pillBtn}>
            <Icon name={shareCopied ? "check" : "share"} size={13} color={shareCopied ? "#22c55e" : undefined} />
            {shareCopied ? "Copied" : "Share"}
          </button>
        )}
      </div>
    </div>
  );
}

const pillBtn: React.CSSProperties = {
  background: "transparent", border: "1px solid #1a2535", borderRadius: 7,
  padding: "7px 14px", color: "#9ab0bf", fontSize: 12.5, fontWeight: 600,
  cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
};

// ── Pagination bar (1  2  3 ... Next >) ──
function PaginationBar({
  page, totalPages, onChange,
}: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
      {pages.map(p => (
        <button
          key={p}
          onClick={() => onChange(p)}
          style={{
            minWidth: 30, height: 30, borderRadius: 6, fontSize: 12.5, fontWeight: 700,
            cursor: "pointer",
            background: p === page ? ACCENT : "#0d1c28",
            border: `1px solid ${p === page ? ACCENT : "#1a2535"}`,
            color: p === page ? "#fff" : "#9ab0bf",
          }}
        >
          {p}
        </button>
      ))}
      {page < totalPages && (
        <button
          onClick={() => onChange(page + 1)}
          style={{
            height: 30, padding: "0 12px", borderRadius: 6, fontSize: 12.5, fontWeight: 700,
            cursor: "pointer", background: "#0d1c28", border: "1px solid #1a2535", color: "#9ab0bf",
            display: "inline-flex", alignItems: "center", gap: 4,
          }}
        >
          Next <Icon name="chevronRight" size={12} />
        </button>
      )}
    </div>
  );
}

export default function ThreadPage({ threadId }: ThreadPageProps) {
  const router = useRouter();

  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [resolvedContent, setResolvedContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyText, setReplyText] = useState("");
  const [page, setPage] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [threadLikedByMe, setThreadLikedByMe] = useState(false);
  const [threadDislikedByMe, setThreadDislikedByMe] = useState(false);
  const [likedReplies, setLikedReplies] = useState<Set<string>>(new Set());
  const [dislikedReplies, setDislikedReplies] = useState<Set<string>>(new Set());
  const [shareCopied, setShareCopied] = useState(false);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [editingThread, setEditingThread] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const editContentRef = useRef<HTMLDivElement>(null);

  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editReplyText, setEditReplyText] = useState("");

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPage(1);
    loadThread();
    loadCurrentUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  useEffect(() => {
    if (!currentUserId) return;
    supabase.rpc("touch_last_seen");
    const interval = setInterval(() => {
      supabase.rpc("touch_last_seen");
    }, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [currentUserId]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = () => setMenuOpen(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [menuOpen]);

  async function loadCurrentUser() {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Failed to fetch current user:", error);
        setCurrentUserId(null);
        return;
      }

      const uid = data?.user?.id || null;
      setCurrentUserId(uid);
      if (!uid) return;

      const { data: profile } = await supabase
        .from("profiles").select("role").eq("id", uid).single();
      setCurrentUserRole(profile?.role || "member");

      const { data: likeData } = await supabase
        .from("thread_likes").select("id").eq("thread_id", threadId).eq("user_id", uid).single();
      setThreadLikedByMe(!!likeData);

      const { data: dislikeData } = await supabase
        .from("thread_dislikes").select("id").eq("thread_id", threadId).eq("user_id", uid).single();
      setThreadDislikedByMe(!!dislikeData);

      const { data: replyLikes } = await supabase
        .from("reply_likes").select("reply_id").eq("user_id", uid);
      if (replyLikes) setLikedReplies(new Set(replyLikes.map(r => r.reply_id)));

      const { data: replyDislikes } = await supabase
        .from("reply_dislikes").select("reply_id").eq("user_id", uid);
      if (replyDislikes) setDislikedReplies(new Set(replyDislikes.map(r => r.reply_id)));
    } catch (error) {
      console.error("Error loading current user:", error);
      setCurrentUserId(null);
    }
  }

  async function loadThread() {
    setLoading(true);

    const { data: threadData } = await supabase.rpc("get_thread_detail", {
      thread_id_input: threadId,
    });
    if (threadData && threadData[0]) {
      const t = threadData[0] as ThreadDetail;
      setThread(t);
      const resolved = await resolveHiddenBlocks(t.content);
      setResolvedContent(resolved);
    }

    const { data: replyData } = await supabase.rpc("get_thread_replies", {
      thread_id_input: threadId,
    });
    setReplies((replyData as Reply[]) || []);

    supabase.rpc("increment_thread_views", { thread_id_input: threadId });

    setLoading(false);
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        showEmojiPicker &&
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target as Node) &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(e.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

  function handleEmojiClick(emojiData: EmojiClickData) {
    setReplyText((prev) => prev + emojiData.emoji);
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please select a valid image file.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setErrorMsg(`Image must be smaller than ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }
    setErrorMsg(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function handleVideoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setErrorMsg("Please select a valid video file.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setErrorMsg(`Video must be smaller than ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }
    setErrorMsg(null);
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  function clearVideo() {
    setVideoFile(null);
    setVideoPreview(null);
    if (videoInputRef.current) videoInputRef.current.value = "";
  }

  async function uploadFile(file: File): Promise<string | null> {
    const fileExt = file.name.split(".").pop();
    const fileName = `${threadId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(fileName, file);
    if (error) {
      console.error("Upload error:", error.message);
      return null;
    }
    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
    return data.publicUrl;
  }

  async function handleReply() {
    if (!replyText.trim() && !imageFile && !videoFile) return;
    if (!currentUserId) {
      setErrorMsg("You must be logged in to reply.");
      return;
    }

    setErrorMsg(null);
    setPosting(true);

    let image_url: string | null = null;
    let video_url: string | null = null;

    try {
      if (imageFile || videoFile) {
        setUploading(true);
        if (imageFile) {
          image_url = await uploadFile(imageFile);
          if (!image_url) {
            setErrorMsg("Image upload failed. Please try again.");
            setUploading(false); setPosting(false);
            return;
          }
        }
        if (videoFile) {
          video_url = await uploadFile(videoFile);
          if (!video_url) {
            setErrorMsg("Video upload failed. Please try again.");
            setUploading(false); setPosting(false);
            return;
          }
        }
        setUploading(false);
      }

      const { error } = await supabase.from("replies").insert([{
        thread_id: threadId,
        content: replyText,
        image_url,
        video_url,
        user_id: currentUserId,
      }]);

      if (error) {
        console.error("Reply insert error:", error.message);
        if (error.message.includes("DAILY_LIMIT_REACHED")) {
          setErrorMsg("Aap ne aaj ki 17 posts/comments ki limit poori kar li hai. Kal try karein ya premium upgrade karein.");
        } else {
          setErrorMsg("Could not post your reply. Please try again.");
        }
        return;
      }

      setReplyText("");
      clearImage();
      clearVideo();
      setShowEmojiPicker(false);
      await loadThread();
      setPage(p => p);
    } finally {
      setPosting(false);
    }
  }

  async function toggleThreadLike() {
    if (!currentUserId || !thread) return;

    if (threadLikedByMe) {
      await supabase.from("thread_likes").delete()
        .eq("thread_id", thread.id).eq("user_id", currentUserId);
      setThreadLikedByMe(false);
      setThread(prev => prev ? { ...prev, likes_count: Math.max(0, prev.likes_count - 1) } : prev);
    } else {
      if (threadDislikedByMe) {
        await supabase.from("thread_dislikes").delete()
          .eq("thread_id", thread.id).eq("user_id", currentUserId);
        setThreadDislikedByMe(false);
        setThread(prev => prev ? { ...prev, dislikes_count: Math.max(0, prev.dislikes_count - 1) } : prev);
      }
      await supabase.from("thread_likes").insert({ thread_id: thread.id, user_id: currentUserId });
      setThreadLikedByMe(true);
      setThread(prev => prev ? { ...prev, likes_count: prev.likes_count + 1 } : prev);
    }
  }

  async function toggleThreadDislike() {
    if (!currentUserId || !thread) return;

    if (threadDislikedByMe) {
      await supabase.from("thread_dislikes").delete()
        .eq("thread_id", thread.id).eq("user_id", currentUserId);
      setThreadDislikedByMe(false);
      setThread(prev => prev ? { ...prev, dislikes_count: Math.max(0, prev.dislikes_count - 1) } : prev);
    } else {
      if (threadLikedByMe) {
        await supabase.from("thread_likes").delete()
          .eq("thread_id", thread.id).eq("user_id", currentUserId);
        setThreadLikedByMe(false);
        setThread(prev => prev ? { ...prev, likes_count: Math.max(0, prev.likes_count - 1) } : prev);
      }
      await supabase.from("thread_dislikes").insert({ thread_id: thread.id, user_id: currentUserId });
      setThreadDislikedByMe(true);
      setThread(prev => prev ? { ...prev, dislikes_count: prev.dislikes_count + 1 } : prev);
    }
  }

  async function toggleReplyLike(replyId: string) {
    if (!currentUserId) return;
    const isLiked = likedReplies.has(replyId);
    const isDisliked = dislikedReplies.has(replyId);

    if (isLiked) {
      await supabase.from("reply_likes").delete().eq("reply_id", replyId).eq("user_id", currentUserId);
      setLikedReplies(prev => { const s = new Set(prev); s.delete(replyId); return s; });
      setReplies(prev => prev.map(r => r.id === replyId ? { ...r, likes_count: Math.max(0, r.likes_count - 1) } : r));
    } else {
      if (isDisliked) {
        await supabase.from("reply_dislikes").delete().eq("reply_id", replyId).eq("user_id", currentUserId);
        setDislikedReplies(prev => { const s = new Set(prev); s.delete(replyId); return s; });
        setReplies(prev => prev.map(r => r.id === replyId ? { ...r, dislikes_count: Math.max(0, r.dislikes_count - 1) } : r));
      }
      await supabase.from("reply_likes").insert({ reply_id: replyId, user_id: currentUserId });
      setLikedReplies(prev => new Set(prev).add(replyId));
      setReplies(prev => prev.map(r => r.id === replyId ? { ...r, likes_count: r.likes_count + 1 } : r));
    }
  }

  async function toggleReplyDislike(replyId: string) {
    if (!currentUserId) return;
    const isDisliked = dislikedReplies.has(replyId);
    const isLiked = likedReplies.has(replyId);

    if (isDisliked) {
      await supabase.from("reply_dislikes").delete().eq("reply_id", replyId).eq("user_id", currentUserId);
      setDislikedReplies(prev => { const s = new Set(prev); s.delete(replyId); return s; });
      setReplies(prev => prev.map(r => r.id === replyId ? { ...r, dislikes_count: Math.max(0, r.dislikes_count - 1) } : r));
    } else {
      if (isLiked) {
        await supabase.from("reply_likes").delete().eq("reply_id", replyId).eq("user_id", currentUserId);
        setLikedReplies(prev => { const s = new Set(prev); s.delete(replyId); return s; });
        setReplies(prev => prev.map(r => r.id === replyId ? { ...r, likes_count: Math.max(0, r.likes_count - 1) } : r));
      }
      await supabase.from("reply_dislikes").insert({ reply_id: replyId, user_id: currentUserId });
      setDislikedReplies(prev => new Set(prev).add(replyId));
      setReplies(prev => prev.map(r => r.id === replyId ? { ...r, dislikes_count: r.dislikes_count + 1 } : r));
    }
  }

  async function handleReport(targetType: "thread" | "reply", targetId: string) {
    if (!currentUserId) {
      setErrorMsg("You must be logged in to report content.");
      return;
    }
    const reason = window.prompt("Why are you reporting this? Please briefly describe the issue:");
    if (!reason || !reason.trim()) return;

    const { error } = await supabase.rpc("submit_report", {
      target_type_input: targetType,
      target_id_input: targetId,
      reason_input: reason.trim(),
    });

    if (error) {
      alert("Could not submit report: " + error.message);
      return;
    }
    alert("Report submitted. Our team will review it. Thank you!");
  }

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  }

  function canManageThread() {
    if (!currentUserId || !thread) return false;
    return currentUserId === thread.user_id || currentUserRole === "admin" || currentUserRole === "moderator";
  }

  function startEditThread() {
    if (!thread) return;
    setEditTitle(thread.title);
    setEditContent(thread.content);
    setEditingThread(true);
    setTimeout(() => {
      if (editContentRef.current) editContentRef.current.innerHTML = thread.content;
    }, 0);
  }

  async function saveEditThread() {
    if (!thread) return;
    const newContent = editContentRef.current?.innerHTML || editContent;
    const { error } = await supabase.from("threads")
      .update({ title: editTitle.trim(), content: newContent })
      .eq("id", thread.id);

    if (!error) {
      setThread(prev => prev ? { ...prev, title: editTitle.trim(), content: newContent } : prev);
      const resolved = await resolveHiddenBlocks(newContent);
      setResolvedContent(resolved);
      setEditingThread(false);
    }
  }

  async function deleteThread() {
    if (!thread) return;
    if (!confirm("Delete this thread permanently? This cannot be undone.")) return;
    const { error } = await supabase.from("threads").delete().eq("id", thread.id);
    if (!error) {
      router.push(`/forum/${thread.category}/${thread.subcategory}`);
    }
  }

  function execEditCmd(command: string, value?: string) {
    document.execCommand(command, false, value);
    editContentRef.current?.focus();
  }

  function canManageReply(reply: Reply) {
    if (!currentUserId) return false;
    return currentUserId === reply.user_id || currentUserRole === "admin" || currentUserRole === "moderator";
  }

  function startEditReply(reply: Reply) {
    setEditingReplyId(reply.id);
    setEditReplyText(reply.content);
  }

  async function saveEditReply(replyId: string) {
    const { error } = await supabase.from("replies")
      .update({ content: editReplyText, edited_at: new Date().toISOString() })
      .eq("id", replyId);
    if (!error) {
      setReplies(prev => prev.map(r => r.id === replyId
        ? { ...r, content: editReplyText, edited_at: new Date().toISOString() }
        : r));
      setEditingReplyId(null);
    }
  }

  async function deleteReply(replyId: string) {
    if (!confirm("Delete this reply?")) return;
    const { error } = await supabase.from("replies").delete().eq("id", replyId);
    if (!error) {
      setReplies(prev => prev.filter(r => r.id !== replyId));
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#050a0f", display: "flex", flexDirection: "column" }}>
        <Navbar />
        <div style={{ color: "#fff", display: "flex", justifyContent: "center", alignItems: "center", flex: 1, padding: "140px 0" }}>
          Loading...
        </div>
        <Footer />
      </div>
    );
  }

  if (!thread) {
    return (
      <div style={{ minHeight: "100vh", background: "#050a0f", display: "flex", flexDirection: "column" }}>
        <Navbar />
        <div style={{ color: "#fff", display: "flex", justifyContent: "center", alignItems: "center", flex: 1, padding: "140px 0" }}>
          Thread not found
        </div>
        <Footer />
      </div>
    );
  }

  const canPost = (replyText.trim().length > 0 || imageFile || videoFile) && !posting;
  const threadOnline = isOnline(thread.author_last_seen);

  const totalPostsCount = 1 + replies.length;
  const totalPages = Math.max(1, Math.ceil(totalPostsCount / POSTS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const showOP = safePage === 1;
  const replyStartIndex = safePage === 1 ? 0 : (safePage - 1) * POSTS_PER_PAGE - 1;
  const replyCountThisPage = safePage === 1 ? POSTS_PER_PAGE - 1 : POSTS_PER_PAGE;
  const visibleReplies = replies.slice(replyStartIndex, replyStartIndex + replyCountThisPage);
  const lastReplyTime = replies.length > 0 ? replies[replies.length - 1].created_at : thread.created_at;

  return (
    <div style={{ minHeight: "100vh", background: "#050a0f", color: "#e7e7e7", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "80px 16px 60px", width: "100%", flex: 1, boxSizing: "border-box" }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: 13, color: "#4a7a94", marginBottom: 16, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ cursor: "pointer" }} onClick={() => router.push("/")}>Home</span>
          <span>›</span>
          <span style={{ cursor: "pointer" }} onClick={() => router.push(`/forum/${thread.category}`)}>
            {thread.category}
          </span>
          <span>›</span>
          <span style={{ color: "#6cc6ff", fontWeight: 600 }}>{thread.title}</span>
        </div>

        <PremiumOfferBanner context="thread" />

        {/* ── HEADER: icon + title + byline, Reply button + menu ── */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          gap: 14, flexWrap: "wrap", marginBottom: 14,
        }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start", minWidth: 0 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10, flexShrink: 0,
              background: thread.locked ? "#3a2a10" : "#132030",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name={thread.locked ? "lock" : "unlockDoc"} size={20} color={thread.locked ? "#f0a500" : "#6cc6ff"} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#fff", wordBreak: "break-word" }}>
                {thread.pinned && <span style={{ fontSize: 13, color: "#f0a500", marginRight: 6 }}>📌</span>}
                {thread.title}
              </h1>
              <div style={{ fontSize: 13, color: "#4a7a94", marginTop: 4 }}>
                by{" "}
                <span
                  style={{ color: "#6cc6ff", fontWeight: 700, cursor: thread.username ? "pointer" : "default" }}
                  onClick={() => thread.username && router.push(`/profile/${thread.username}`)}
                >
                  {thread.username || "Unknown"}
                </span>{" "}
                · {timeAgo(thread.created_at)} in{" "}
                <span style={{ color: "#6cc6ff", cursor: "pointer" }} onClick={() => router.push(`/forum/${thread.category}`)}>
                  {thread.category}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
            <button
              onClick={() => document.getElementById("reply-box")?.scrollIntoView({ behavior: "smooth" })}
              style={{
                fontSize: 13, fontWeight: 700, color: "#fff", background: ACCENT,
                border: "none", padding: "9px 22px", borderRadius: 8, cursor: "pointer",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = ACCENT_HOVER)}
              onMouseLeave={e => (e.currentTarget.style.background = ACCENT)}
            >
              Reply
            </button>
            {canManageThread() && (
              <div style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => setMenuOpen(v => !v)}
                  style={{
                    width: 36, height: 36, borderRadius: 8, background: "#0d2030",
                    border: "1px solid #1a3042", color: "#c8dde8", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Icon name="moreVertical" size={17} />
                </button>
                {menuOpen && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 6px)", right: 0,
                    background: "#0a1520", border: "1px solid #1a2535", borderRadius: 8,
                    minWidth: 150, overflow: "hidden", zIndex: 50, boxShadow: "0 12px 28px rgba(0,0,0,0.5)",
                  }}>
                    <button onClick={() => { setMenuOpen(false); startEditThread(); }} style={menuItemStyle}><Icon name="edit" size={13} /> Edit Thread</button>
                    <button onClick={() => { setMenuOpen(false); deleteThread(); }} style={{ ...menuItemStyle, color: "#ef4444" }}><Icon name="trash" size={13} /> Delete Thread</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── PAGINATION (left) + STATS (right) — same row ── */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: 12, marginBottom: 16,
        }}>
          <PaginationBar page={safePage} totalPages={totalPages} onChange={setPage} />

          <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
            <StatBlock icon="eye" value={thread.views_count} label="Views" />
            <StatBlock icon="message" value={replies.length} label="Replies" />
            <StatBlock icon="clock" value={timeAgo(lastReplyTime)} label="Last Reply" />
          </div>
        </div>

        {/* ── OP POST CARD ── */}
        {showOP && (
          <div style={{ background: "#0a1520", border: "1px solid #1a2535", borderRadius: 10, marginBottom: 14, padding: 18 }}>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              <PostAuthorSidebar
                username={thread.username}
                avatarUrl={thread.avatar_url}
                role={thread.role}
                online={threadOnline}
                rep={thread.author_rep || 0}
                likesGiven={thread.author_likes_given || 0}
                postsCount={thread.author_posts_count || 0}
                threadsCount={thread.author_threads_count || 0}
                joinDate={thread.join_date}
                onClick={() => thread.username && router.push(`/profile/${thread.username}`)}
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: "#4a7a94", marginBottom: 12 }}>
                  Posted at {formatFullDate(thread.created_at)}
                </div>

                {editingThread ? (
                  <>
                    <ThreadEditToolbar exec={execEditCmd} />
                    <div
                      ref={editContentRef}
                      contentEditable
                      suppressContentEditableWarning
                      style={{
                        minHeight: 150, background: "#050a0f", border: "1px solid #1a2535",
                        borderTop: "none", borderRadius: "0 0 6px 6px", padding: "12px 14px",
                        color: "#c8dde8", fontSize: 14, lineHeight: 1.7, outline: "none",
                      }}
                    />
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <button onClick={saveEditThread} style={btnPrimary}>Save Changes</button>
                      <button onClick={() => setEditingThread(false)} style={btnSecondary}>Cancel</button>
                    </div>
                  </>
                ) : (
                  <div
                    className="rte-content"
                    style={{ lineHeight: 1.8, fontSize: 14.5 }}
                    dangerouslySetInnerHTML={{ __html: resolvedContent || thread.content }}
                  />
                )}

                {!editingThread && thread.signature && (
                  <div style={{
                    marginTop: 18, paddingTop: 12, borderTop: "1px dashed #1a2535",
                    fontSize: 12.5, color: "#6a8a9a", fontStyle: "italic", whiteSpace: "pre-wrap",
                  }}>
                    {thread.signature}
                  </div>
                )}

                {!editingThread && (
                  <PostActionsRow
                    canManage={false}
                    onReport={() => handleReport("thread", thread.id)}
                    showReport={!!currentUserId && currentUserId !== thread.user_id}
                    liked={threadLikedByMe}
                    onLike={toggleThreadLike}
                    likeCount={thread.likes_count}
                    disliked={threadDislikedByMe}
                    onDislike={toggleThreadDislike}
                    dislikeCount={thread.dislikes_count}
                    onShare={handleShare}
                    shareCopied={shareCopied}
                    disabled={!currentUserId}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── REPLIES SECTION HEADER ── */}
        {replies.length > 0 && (
          <div style={{ fontSize: 13, fontWeight: 700, color: "#9ab0bf", letterSpacing: 1, margin: "18px 0 10px" }}>
            {replies.length} REPLIES
          </div>
        )}

        {/* ── REPLY POST CARDS ── */}
        {visibleReplies.map((reply) => {
          const isLiked = likedReplies.has(reply.id);
          const isDisliked = dislikedReplies.has(reply.id);
          const isEditing = editingReplyId === reply.id;
          const replyOnline = isOnline(reply.author_last_seen);

          return (
            <div key={reply.id} style={{
              background: "#0a1520", border: "1px solid #1a2535", borderRadius: 10,
              marginBottom: 12, padding: 18,
            }}>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                <PostAuthorSidebar
                  username={reply.username}
                  avatarUrl={reply.avatar_url}
                  role={reply.role}
                  online={replyOnline}
                  rep={reply.author_rep || 0}
                  likesGiven={reply.author_likes_given || 0}
                  postsCount={reply.author_posts_count || 0}
                  threadsCount={reply.author_threads_count || 0}
                  joinDate={reply.author_join_date}
                  onClick={() => reply.username && router.push(`/profile/${reply.username}`)}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: "#4a7a94", marginBottom: 10 }}>
                    {timeAgo(reply.created_at)}
                    {reply.edited_at && <span style={{ fontStyle: "italic" }}> · edited</span>}
                  </div>

                  {isEditing ? (
                    <>
                      <textarea
                        value={editReplyText}
                        onChange={e => setEditReplyText(e.target.value)}
                        style={{
                          width: "100%", minHeight: 90, background: "#050a0f",
                          border: "1px solid #1a2535", borderRadius: 6, color: "#fff",
                          padding: 10, fontSize: 13.5, outline: "none", resize: "vertical",
                          boxSizing: "border-box", marginBottom: 8,
                        }}
                      />
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => saveEditReply(reply.id)} style={btnPrimary}>Save</button>
                        <button onClick={() => setEditingReplyId(null)} style={btnSecondary}>Cancel</button>
                      </div>
                    </>
                  ) : (
                    <>
                      {reply.content && (
                        <div className="rte-content" style={{ color: "#c8dde8", lineHeight: 1.7, fontSize: 14 }}
                          dangerouslySetInnerHTML={{ __html: reply.content }} />
                      )}
                      {reply.image_url && (
                        <img src={reply.image_url} alt="Reply attachment" style={{ maxWidth: "100%", maxHeight: 400, borderRadius: 8, marginTop: reply.content ? 12 : 0, display: "block" }} />
                      )}
                      {reply.video_url && (
                        <video src={reply.video_url} controls style={{ maxWidth: "100%", maxHeight: 400, borderRadius: 8, marginTop: 12, display: "block" }} />
                      )}

                      <PostActionsRow
                        canManage={canManageReply(reply)}
                        onEdit={() => startEditReply(reply)}
                        onDelete={() => deleteReply(reply.id)}
                        onReport={() => handleReport("reply", reply.id)}
                        showReport={!!currentUserId && currentUserId !== reply.user_id}
                        liked={isLiked}
                        onLike={() => toggleReplyLike(reply.id)}
                        likeCount={reply.likes_count}
                        disliked={isDisliked}
                        onDislike={() => toggleReplyDislike(reply.id)}
                        dislikeCount={reply.dislikes_count}
                        disabled={!currentUserId}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <PaginationBar page={safePage} totalPages={totalPages} onChange={setPage} />
          </div>
        )}

        {/* ── QUICK REPLY ── */}
        <div id="reply-box" style={{ background: "#0a1520", border: "1px solid #1a2535", borderRadius: 10, padding: 20, marginTop: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Quick Reply</h2>
            {currentUserId && <DailyLimitBadge />}
          </div>

          {currentUserId ? (
            <div>
              <div style={{ position: "relative" }}>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  style={{
                    width: "100%", minHeight: 100, background: "#050a0f",
                    border: "1px solid #1a2535", borderRadius: 8, color: "#fff",
                    padding: 12, paddingBottom: 44, resize: "vertical", outline: "none",
                    fontFamily: "inherit", fontSize: 14, boxSizing: "border-box",
                  }}
                />
                <div style={{ position: "absolute", left: 8, bottom: 8, display: "flex", gap: 6 }}>
                  <button ref={emojiButtonRef} type="button" onClick={() => setShowEmojiPicker(v => !v)} title="Add emoji" style={toolbarBtnStyle(showEmojiPicker)}>
                    <Icon name="smile" size={16} />
                  </button>
                  <button type="button" onClick={() => imageInputRef.current?.click()} title="Attach image" style={toolbarBtnStyle(false)}>
                    <Icon name="image" size={16} />
                  </button>
                  <button type="button" onClick={() => videoInputRef.current?.click()} title="Attach video" style={toolbarBtnStyle(false)}>
                    <Icon name="video" size={16} />
                  </button>
                </div>

                {showEmojiPicker && (
                  <div ref={emojiPickerRef} style={{ position: "absolute", bottom: 50, left: 8, zIndex: 9999 }}>
                    <EmojiPicker onEmojiClick={handleEmojiClick} theme={Theme.DARK} width={320} height={400} />
                  </div>
                )}
              </div>

              <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageSelect} style={{ display: "none" }} />
              <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoSelect} style={{ display: "none" }} />

              {(imagePreview || videoPreview) && (
                <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
                  {imagePreview && (
                    <div style={{ position: "relative" }}>
                      <img src={imagePreview} alt="Image preview" style={{ maxWidth: 160, maxHeight: 160, borderRadius: 8, border: "1px solid #1a2535", display: "block" }} />
                      <button onClick={clearImage} style={removeBtnStyle}>✕</button>
                    </div>
                  )}
                  {videoPreview && (
                    <div style={{ position: "relative" }}>
                      <video src={videoPreview} controls style={{ maxWidth: 220, maxHeight: 160, borderRadius: 8, border: "1px solid #1a2535", display: "block" }} />
                      <button onClick={clearVideo} style={removeBtnStyle}>✕</button>
                    </div>
                  )}
                </div>
              )}

              {errorMsg && <div style={{ color: "#ff6b6b", fontSize: 13, marginTop: 8 }}>{errorMsg}</div>}

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                <button
                  onClick={handleReply}
                  disabled={!canPost}
                  style={{
                    background: canPost ? ACCENT : "#26314a", border: "none",
                    color: "#fff", padding: "10px 22px", borderRadius: 8,
                    cursor: canPost ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 13.5,
                    display: "flex", alignItems: "center", gap: 7,
                  }}
                  onMouseEnter={e => { if (canPost) e.currentTarget.style.background = ACCENT_HOVER; }}
                  onMouseLeave={e => { if (canPost) e.currentTarget.style.background = ACCENT; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M2 21l21-9L2 3v7l15 2-15 2z" /></svg>
                  {uploading ? "Uploading..." : posting ? "Posting..." : "Post Reply"}
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              background: "#050a0f", border: "1px solid #1a2535", borderRadius: 8,
              padding: "16px", textAlign: "center", fontSize: 13, color: "#4a7a94",
            }}>
              <a href="/login" style={{ color: "#00b4d8", textDecoration: "none", fontWeight: 600 }}>Login</a> to post a reply
            </div>
          )}
        </div>
      </div>

      <Footer />

      <style>{`
        .rte-content blockquote {
          border-left: 3px solid ${ACCENT};
          padding-left: 12px;
          margin: 8px 0;
          color: #9ab0bf;
        }
        .rte-content pre {
          background: #0a1520;
          border: 1px solid #1a2535;
          border-radius: 6px;
          padding: 10px;
          font-family: monospace;
          font-size: 13px;
          overflow-x: auto;
          margin: 8px 0;
        }
        .rte-content img {
          max-width: 100%;
          border-radius: 6px;
          margin: 8px 0;
        }
        .rte-content a {
          color: #00b4d8;
        }
        .rte-content ul, .rte-content ol {
          padding-left: 22px;
          margin: 8px 0;
        }
        .rte-content .link-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          background: #0a1520;
          border: 1px solid #1a3042;
          border-radius: 10px;
          padding: 16px 22px;
          margin: 10px 0;
          max-width: 100%;
          width: fit-content;
        }
        .rte-content .link-card-label {
          font-size: 13px;
          font-weight: 700;
          color: #c8dde8;
          text-align: center;
          word-break: break-word;
        }
        .rte-content .link-card-arrow {
          font-size: 15px;
          color: #4a7a94;
          line-height: 1;
        }
        .rte-content .link-card-url {
          display: inline-block;
          background: rgba(0,180,216,0.12);
          border: 1px solid rgba(0,180,216,0.4);
          border-radius: 7px;
          padding: 8px 20px;
          color: #00b4d8;
          font-weight: 700;
          font-size: 13px;
          text-decoration: none;
          word-break: break-all;
          text-align: center;
          max-width: 100%;
        }
        .rte-content .link-card-url:hover {
          background: rgba(0,180,216,0.22);
          border-color: #00b4d8;
        }

        @media (max-width: 640px) {
          .rte-content .link-card { padding: 12px 14px; }
        }
      `}</style>

    </div>
  );
}

function StatBlock({ icon, value, label }: { icon: string; value: number | string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Icon name={icon} size={16} color="#4a7a94" />
      <div style={{ lineHeight: 1.25 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#c8dde8" }}>{value}</div>
        <div style={{ fontSize: 10.5, color: "#4a7a94" }}>{label}</div>
      </div>
    </div>
  );
}

function ThreadEditToolbar({ exec }: { exec: (cmd: string, val?: string) => void }) {
  return (
    <div style={{
      display: "flex", flexWrap: "wrap", gap: 4, background: "#050a0f",
      border: "1px solid #1a2535", borderRadius: "6px 6px 0 0", padding: "6px 8px",
    }}>
      {[
        { label: "B", cmd: "bold", bold: true },
        { label: "I", cmd: "italic", italic: true },
        { label: "U", cmd: "underline", underline: true },
      ].map(b => (
        <button key={b.cmd} type="button" onClick={() => exec(b.cmd)} style={{
          background: "#0d1c28", border: "1px solid #1a2535", borderRadius: 4,
          minWidth: 28, height: 28, color: "#c8dde8", fontSize: 12,
          fontWeight: b.bold ? 800 : 600, fontStyle: b.italic ? "italic" : "normal",
          textDecoration: b.underline ? "underline" : "none", cursor: "pointer",
        }}>{b.label}</button>
      ))}
      <button type="button" onClick={() => { const url = prompt("Enter URL:"); if (url) exec("createLink", url); }} style={{
        background: "#0d1c28", border: "1px solid #1a2535", borderRadius: 4,
        minWidth: 28, height: 28, color: "#c8dde8", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
      }}><Icon name="link" size={13} /></button>
      <button type="button" onClick={() => exec("insertUnorderedList")} style={{
        background: "#0d1c28", border: "1px solid #1a2535", borderRadius: 4,
        minWidth: 28, height: 28, color: "#c8dde8", fontSize: 12, cursor: "pointer",
      }}>•≡</button>
    </div>
  );
}

const menuItemStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left",
  background: "none", border: "none", padding: "10px 14px", color: "#c8dde8",
  fontSize: 12.5, fontWeight: 600, cursor: "pointer",
};

const btnPrimary: React.CSSProperties = {
  background: ACCENT, border: "none", borderRadius: 6, padding: "8px 18px",
  color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
};

const btnSecondary: React.CSSProperties = {
  background: "#1a2535", border: "1px solid #2a3545", borderRadius: 6, padding: "8px 18px",
  color: "#c8dde8", fontSize: 13, fontWeight: 600, cursor: "pointer",
};

function toolbarBtnStyle(active: boolean): React.CSSProperties {
  return {
    background: active ? "#1a2535" : "transparent", border: "1px solid #1a2535",
    borderRadius: 6, color: "#c8dde8", width: 34, height: 34,
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
  };
}

const removeBtnStyle: React.CSSProperties = {
  position: "absolute", top: -8, right: -8, background: "#1a2535",
  border: "1px solid #2a3a4f", color: "#fff", borderRadius: "50%",
  width: 22, height: 22, cursor: "pointer", fontSize: 12, lineHeight: 1,
};