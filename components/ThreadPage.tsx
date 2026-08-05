"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import PremiumOfferBanner from "@/components/PremiumOfferBanner";
import DailyLimitBadge from "@/components/DailyLimitBadge";

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
}

const STORAGE_BUCKET = "thread-attachments";
const MAX_FILE_SIZE_MB = 25;
const ONLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
const HEARTBEAT_INTERVAL_MS = 60 * 1000; // 60 seconds
const POSTS_PER_PAGE = 10;

const ROLE_BADGES: Record<string, { label: string; color: string; icon: string }> = {
  admin:     { label: "Admin",     color: "#ff6b6b", icon: "👑" },
  moderator: { label: "Moderator", color: "#6cc6ff", icon: "🛡️" },
  vip:       { label: "VIP",       color: "#00b4d8", icon: "⭐" },
  "vip+":    { label: "VIP+",      color: "#a855f7", icon: "💎" },
  lifetime:  { label: "Lifetime",  color: "#f59e0b", icon: "♛" },
  member:    { label: "Member",    color: "#4a7a94", icon: "👤" },
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

function isOnline(lastSeen: string | null) {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < ONLINE_THRESHOLD_MS;
}

// ── Resolve hidden link blocks in thread content ──
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
        el.outerHTML =
          `<div style="border-left:3px solid #22c55e;padding:10px 12px;margin:10px 0;background:rgba(34,197,94,0.06);border-radius:6px;">` +
          `<div style="color:#22c55e;font-weight:700;font-size:10.5px;letter-spacing:0.5px;margin-bottom:6px;">🔓 UNLOCKED CONTENT</div>` +
          content +
          `</div>`;
      } else {
        el.outerHTML =
          `<div style="border:1px dashed #f0a500;border-radius:8px;padding:16px;margin:12px 0;background:rgba(240,165,0,0.06);text-align:center;">` +
          `<div style="font-size:22px;">🔒</div>` +
          `<div style="color:#f0a500;font-weight:700;font-size:13px;margin-top:6px;">Hidden Content</div>` +
          `<div style="color:#9ab0bf;font-size:12px;margin-top:4px;line-height:1.6;">Reply to this thread to unlock this content instantly, or upgrade to Premium to view without replying.</div>` +
          `<a href="#reply-box" style="display:inline-block;margin-top:10px;background:#6c63ff;color:#fff;padding:7px 16px;border-radius:6px;font-size:12px;font-weight:700;text-decoration:none;">Jump to Reply Box</a>` +
          `</div>`;
      }
    })
  );

  return doc.body.innerHTML;
}

// ── Reusable profile sidebar (used for the OP and every reply) ──
function PostAuthorSidebar({
  username,
  avatarUrl,
  role,
  online,
  rep,
  likesGiven,
  postsCount,
  threadsCount,
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
  onClick: () => void;
}) {
  const badge = ROLE_BADGES[role || "member"] || ROLE_BADGES.member;

  return (
    <div style={{ width: 140, flexShrink: 0, textAlign: "center" }}>
      <div
        onClick={onClick}
        style={{
          width: 72, height: 72, borderRadius: 6, margin: "0 auto 8px",
          border: `2px solid ${badge.color}`, overflow: "hidden",
          background: "#1a2535", display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 22, fontWeight: 700,
          color: badge.color, cursor: username ? "pointer" : "default",
        }}
      >
        {avatarUrl
          ? <img src={avatarUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : (username || "?").slice(0, 2).toUpperCase()
        }
      </div>

      <div
        onClick={onClick}
        style={{ fontSize: 13, fontWeight: 700, color: "#6cc6ff", cursor: username ? "pointer" : "default" }}
      >
        {username || "Unknown"}
      </div>

      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
        fontSize: 11, marginTop: 3, color: online ? "#22c55e" : "#4a7a94", fontWeight: 600,
      }}>
        <span style={{
          width: 7, height: 7, borderRadius: "50%",
          background: online ? "#22c55e" : "#4a7a94",
          boxShadow: online ? "0 0 5px #22c55e" : "none",
        }} />
        {online ? "Online" : "Offline"}
      </div>

      <div style={{
        marginTop: 8, paddingTop: 8, borderTop: "1px dashed #1a2535",
        display: "flex", justifyContent: "center", gap: 14,
      }}>
        <StatCell label="REP" value={rep} color="#f59e0b" />
        <StatCell label="LIKES" value={likesGiven} color="#e74c8c" />
      </div>

      <div style={{
        marginTop: 8, display: "inline-block", fontSize: 10.5, fontWeight: 700,
        color: badge.color, background: `${badge.color}1a`,
        border: `1px solid ${badge.color}44`, borderRadius: 4, padding: "2px 10px",
      }}>
        {badge.icon} {badge.label}
      </div>

      <div style={{
        marginTop: 10, paddingTop: 8, borderTop: "1px dashed #1a2535",
        display: "grid", gridTemplateColumns: "1fr 1fr", rowGap: 6, columnGap: 4,
      }}>
        <StatCell label="POSTS" value={postsCount} color="#6cc6ff" />
        <StatCell label="THREADS" value={threadsCount} color="#a855f7" />
      </div>
    </div>
  );
}

function StatCell({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 8.5, color: "#4a7a94", fontWeight: 700, letterSpacing: 0.4 }}>{label}</div>
    </div>
  );
}

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
            background: p === page ? "#6c63ff" : "#0d1c28",
            border: `1px solid ${p === page ? "#6c63ff" : "#1a2535"}`,
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
          }}
        >
          Next ›
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

  // Current user state
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [threadLikedByMe, setThreadLikedByMe] = useState(false);
  const [threadDislikedByMe, setThreadDislikedByMe] = useState(false);
  const [likedReplies, setLikedReplies] = useState<Set<string>>(new Set());
  const [dislikedReplies, setDislikedReplies] = useState<Set<string>>(new Set());
  const [shareCopied, setShareCopied] = useState(false);

  // Attachment state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edit thread state (admin/owner)
  const [editingThread, setEditingThread] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const editContentRef = useRef<HTMLDivElement>(null);

  // Editing a reply
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editReplyText, setEditReplyText] = useState("");

  // Emoji picker
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

  // ── Heartbeat: keep last_seen fresh while user is on the page ──
  useEffect(() => {
    if (!currentUserId) return;
    supabase.rpc("touch_last_seen");
    const interval = setInterval(() => {
      supabase.rpc("touch_last_seen");
    }, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [currentUserId]);

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

    // Increment view count (fire and forget)
    supabase.rpc("increment_thread_views", { thread_id_input: threadId });

    setLoading(false);
  }

  // Close emoji picker when clicking outside
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

  // ── Thread Like ──
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

  // ── Thread Dislike ──
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

  // ── Reply Like ──
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

  // ── Reply Dislike ──
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

  // ── Report (thread or reply) ──
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

  // ── Share (copy link) ──
  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // clipboard unavailable — silently ignore
    }
  }

  // ── Thread Edit/Delete (owner or admin) ──
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

  // ── Reply Edit/Delete ──
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
      <div style={{ minHeight: "100vh", background: "#050a0f", color: "#fff", display: "flex", justifyContent: "center", alignItems: "center" }}>
        Loading...
      </div>
    );
  }

  if (!thread) {
    return (
      <div style={{ minHeight: "100vh", background: "#050a0f", color: "#fff", display: "flex", justifyContent: "center", alignItems: "center" }}>
        Thread not found
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
  const opPostNumber = 1;
  const firstReplyNumber = safePage === 1 ? 2 : replyStartIndex + 2;

  return (
    <div style={{ minHeight: "100vh", background: "#050a0f", color: "#e7e7e7" }}>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "80px 16px" }}>

        <div style={{ fontSize: 13, color: "#4a7a94", marginBottom: 10 }}>
          <span style={{ cursor: "pointer" }} onClick={() => router.push("/")}>Home</span>
          {" > "}
          <span style={{ cursor: "pointer" }} onClick={() => router.push(`/forum/${thread.category}`)}>
            {thread.category}
          </span>
          {" > "}
          <span
            style={{ cursor: "pointer", color: "#6cc6ff" }}
            onClick={() => router.push(`/forum/${thread.category}/${thread.subcategory}`)}
          >
            {thread.subcategory}
          </span>
        </div>

        <PremiumOfferBanner context="thread" />

        <div style={{ marginBottom: 14, marginTop: 14 }}>
          <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 800, color: "#fff" }}>
            {thread.pinned && <span style={{ fontSize: 13, color: "#f0a500", marginRight: 8 }}>📌</span>}
            {thread.locked && <span style={{ fontSize: 13, color: "#ef4444", marginRight: 8 }}>🔒</span>}
            {thread.title}
          </h1>
          <div style={{ fontSize: 12.5, color: "#4a7a94" }}>
            Submitted by{" "}
            <span
              style={{ color: "#6cc6ff", fontWeight: 700, cursor: thread.username ? "pointer" : "default" }}
              onClick={() => thread.username && router.push(`/profile/${thread.username}`)}
            >
              {thread.username || "Unknown"}
            </span>{" "}
            at {formatFullDate(thread.created_at)}
          </div>
        </div>

        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 10, marginBottom: 14,
        }}>
          <PaginationBar page={safePage} totalPages={totalPages} onChange={setPage} />

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              fontSize: 12, fontWeight: 700, color: "#c8dde8", background: "#0d2030",
              border: "1px solid #1a3042", padding: "6px 12px", borderRadius: 6,
              display: "flex", alignItems: "center", gap: 5,
            }}>
              👁️ {thread.views_count} Views
            </span>
            <button
              onClick={handleShare}
              title="Copy link to this thread"
              style={{
                fontSize: 12, fontWeight: 700, color: "#c8dde8", background: "#0d2030",
                border: "1px solid #1a3042", padding: "6px 12px", borderRadius: 6, cursor: "pointer",
              }}
            >
              {shareCopied ? "✅ Copied" : "🔗 Share"}
            </button>
            <button
              onClick={() => document.getElementById("reply-box")?.scrollIntoView({ behavior: "smooth" })}
              style={{
                fontSize: 12, fontWeight: 700, color: "#fff", background: "#6c63ff",
                border: "none", padding: "6px 14px", borderRadius: 6, cursor: "pointer",
              }}
            >
              ↩ New Reply
            </button>
          </div>
        </div>

        {showOP && (
          <div style={{ background: "#0a1520", border: "1px solid #1a2535", borderRadius: 10, marginBottom: 14, overflow: "hidden" }}>
            <div style={{ background: "linear-gradient(90deg, #4c5fd6, #6c7ef0)", padding: "9px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {thread.title}
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>#{opPostNumber}</span>
            </div>

            <div style={{ display: "flex", gap: 16, padding: "18px 20px", flexWrap: "wrap" }}>
              <PostAuthorSidebar
                username={thread.username}
                avatarUrl={thread.avatar_url}
                role={thread.role}
                online={threadOnline}
                rep={thread.author_rep || 0}
                likesGiven={thread.author_likes_given || 0}
                postsCount={thread.author_posts_count || 0}
                threadsCount={thread.author_threads_count || 0}
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
                  <div style={{ display: "flex", gap: 8, marginTop: 16, alignItems: "center", justifyContent: "flex-end" }}>
                    {canManageThread() && (
                      <>
                        <button onClick={startEditThread} style={btnGhost}>✏️ Edit</button>
                        <button onClick={deleteThread} style={{ ...btnGhost, color: "#ef4444", borderColor: "#ef444444" }}>
                          🗑️ Delete
                        </button>
                      </>
                    )}
                    {currentUserId && currentUserId !== thread.user_id && (
                      <button
                        onClick={() => handleReport("thread", thread.id)}
                        title="Report this thread"
                        style={btnGhost}
                      >
                        🚩 Report
                      </button>
                    )}
                    <button
                      onClick={toggleThreadLike}
                      disabled={!currentUserId}
                      title={threadLikedByMe ? "Unlike" : "Like"}
                      style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: threadLikedByMe ? "rgba(34,197,94,0.18)" : "transparent",
                        border: `1.5px solid ${threadLikedByMe ? "#22c55e" : "#2a3545"}`,
                        color: threadLikedByMe ? "#22c55e" : "#9ab0bf",
                        fontSize: 15, cursor: currentUserId ? "pointer" : "default",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      👍
                    </button>
                    <span style={{ fontSize: 12.5, color: "#22c55e", fontWeight: 600, minWidth: 14 }}>{thread.likes_count}</span>
                    <button
                      onClick={toggleThreadDislike}
                      disabled={!currentUserId}
                      title={threadDislikedByMe ? "Remove dislike" : "Dislike"}
                      style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: threadDislikedByMe ? "rgba(239,68,68,0.18)" : "transparent",
                        border: `1.5px solid ${threadDislikedByMe ? "#ef4444" : "#2a3545"}`,
                        color: threadDislikedByMe ? "#ef4444" : "#9ab0bf",
                        fontSize: 15, cursor: currentUserId ? "pointer" : "default",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      👎
                    </button>
                    <span style={{ fontSize: 12.5, color: "#ef4444", fontWeight: 600, minWidth: 14 }}>{thread.dislikes_count}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {visibleReplies.map((reply, idx) => {
          const isLiked = likedReplies.has(reply.id);
          const isDisliked = dislikedReplies.has(reply.id);
          const isEditing = editingReplyId === reply.id;
          const replyOnline = isOnline(reply.author_last_seen);
          const postNumber = firstReplyNumber + idx;

          return (
            <div key={reply.id} style={{
              background: "#0a1520", border: "1px solid #1a2535", borderRadius: 10,
              marginBottom: 14, overflow: "hidden",
            }}>
              <div style={{ background: "#122236", padding: "8px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: "#c8dde8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  Re: {thread.title}
                </span>
                <span style={{ fontSize: 11, color: "#6a8a9a" }}>
                  #{postNumber} · {timeAgo(reply.created_at)}
                  {reply.edited_at && <span style={{ fontStyle: "italic" }}> · edited</span>}
                </span>
              </div>

              <div style={{ padding: 16, display: "flex", gap: 14, flexWrap: "wrap" }}>
                <PostAuthorSidebar
                  username={reply.username}
                  avatarUrl={reply.avatar_url}
                  role={reply.role}
                  online={replyOnline}
                  rep={reply.author_rep || 0}
                  likesGiven={reply.author_likes_given || 0}
                  postsCount={reply.author_posts_count || 0}
                  threadsCount={reply.author_threads_count || 0}
                  onClick={() => reply.username && router.push(`/profile/${reply.username}`)}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: "#4a7a94", marginBottom: 10 }}>
                    Posted at {formatFullDate(reply.created_at)}
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

                      <div style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "center", justifyContent: "flex-end" }}>
                        {canManageReply(reply) && (
                          <>
                            <button onClick={() => startEditReply(reply)} style={{ ...btnGhost, padding: "5px 12px", fontSize: 11.5 }}>✏️ Edit</button>
                            <button onClick={() => deleteReply(reply.id)} style={{ ...btnGhost, padding: "5px 12px", fontSize: 11.5, color: "#ef4444", borderColor: "#ef444444" }}>🗑️ Delete</button>
                          </>
                        )}
                        {currentUserId && currentUserId !== reply.user_id && (
                          <button
                            onClick={() => handleReport("reply", reply.id)}
                            title="Report this reply"
                            style={{ ...btnGhost, padding: "5px 12px", fontSize: 11.5 }}
                          >
                            🚩 Report
                          </button>
                        )}
                        <button
                          onClick={() => toggleReplyLike(reply.id)}
                          disabled={!currentUserId}
                          title={isLiked ? "Unlike" : "Like"}
                          style={{
                            width: 30, height: 30, borderRadius: "50%",
                            background: isLiked ? "rgba(34,197,94,0.18)" : "transparent",
                            border: `1.5px solid ${isLiked ? "#22c55e" : "#2a3545"}`,
                            color: isLiked ? "#22c55e" : "#9ab0bf",
                            fontSize: 13, cursor: currentUserId ? "pointer" : "default",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >
                          👍
                        </button>
                        <span style={{ fontSize: 11.5, color: "#22c55e", fontWeight: 600, minWidth: 12 }}>{reply.likes_count}</span>
                        <button
                          onClick={() => toggleReplyDislike(reply.id)}
                          disabled={!currentUserId}
                          title={isDisliked ? "Remove dislike" : "Dislike"}
                          style={{
                            width: 30, height: 30, borderRadius: "50%",
                            background: isDisliked ? "rgba(239,68,68,0.18)" : "transparent",
                            border: `1.5px solid ${isDisliked ? "#ef4444" : "#2a3545"}`,
                            color: isDisliked ? "#ef4444" : "#9ab0bf",
                            fontSize: 13, cursor: currentUserId ? "pointer" : "default",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >
                          👎
                        </button>
                        <span style={{ fontSize: 11.5, color: "#ef4444", fontWeight: 600, minWidth: 12 }}>{reply.dislikes_count}</span>
                      </div>
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

        <div id="reply-box" style={{ background: "#0a1520", border: "1px solid #1a2535", borderRadius: 10, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>
              Replies {replies.length > 0 && `(${replies.length})`}
            </h2>
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
                    width: "100%", minHeight: 120, background: "#050a0f",
                    border: "1px solid #1a2535", borderRadius: 8, color: "#fff",
                    padding: 12, paddingBottom: 44, resize: "vertical", outline: "none",
                    fontFamily: "inherit", fontSize: 14, boxSizing: "border-box",
                  }}
                />
                <div style={{ position: "absolute", left: 8, bottom: 8, display: "flex", gap: 6 }}>
                  <button ref={emojiButtonRef} type="button" onClick={() => setShowEmojiPicker(v => !v)} title="Add emoji" style={toolbarBtnStyle(showEmojiPicker)}>😊</button>
                  <button type="button" onClick={() => imageInputRef.current?.click()} title="Attach image" style={toolbarBtnStyle(false)}>🖼️</button>
                  <button type="button" onClick={() => videoInputRef.current?.click()} title="Attach video" style={toolbarBtnStyle(false)}>🎬</button>
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

              <button onClick={handleReply} disabled={!canPost} style={{
                marginTop: 12, background: canPost ? "#6c63ff" : "#3a3760", border: "none",
                color: "#fff", padding: "10px 20px", borderRadius: 8,
                cursor: canPost ? "pointer" : "not-allowed", fontWeight: 500,
              }}>
                {uploading ? "Uploading..." : posting ? "Posting..." : "Post Reply"}
              </button>
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

      <style>{`
        .rte-content blockquote {
          border-left: 3px solid #6c63ff;
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
      `}</style>

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
        minWidth: 28, height: 28, color: "#c8dde8", fontSize: 12, cursor: "pointer",
      }}>🔗</button>
      <button type="button" onClick={() => exec("insertUnorderedList")} style={{
        background: "#0d1c28", border: "1px solid #1a2535", borderRadius: 4,
        minWidth: 28, height: 28, color: "#c8dde8", fontSize: 12, cursor: "pointer",
      }}>•≡</button>
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  background: "#6c63ff", border: "none", borderRadius: 6, padding: "8px 18px",
  color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
};

const btnSecondary: React.CSSProperties = {
  background: "#1a2535", border: "1px solid #2a3545", borderRadius: 6, padding: "8px 18px",
  color: "#c8dde8", fontSize: 13, fontWeight: 600, cursor: "pointer",
};

const btnGhost: React.CSSProperties = {
  background: "transparent", border: "1px solid #1a2535", borderRadius: 6,
  padding: "6px 14px", color: "#9ab0bf", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
};

function toolbarBtnStyle(active: boolean): React.CSSProperties {
  return {
    background: active ? "#1a2535" : "transparent", border: "1px solid #1a2535",
    borderRadius: 6, color: "#c8dde8", width: 34, height: 34, fontSize: 16,
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
  };
}

const removeBtnStyle: React.CSSProperties = {
  position: "absolute", top: -8, right: -8, background: "#1a2535",
  border: "1px solid #2a3a4f", color: "#fff", borderRadius: "50%",
  width: 22, height: 22, cursor: "pointer", fontSize: 12, lineHeight: 1,
};