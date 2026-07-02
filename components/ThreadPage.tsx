"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import Navbar from "./Navbar";
import Footer from "./Footbar";
import PremiumLinks from "@/components/PremiumLinks";

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
}

const STORAGE_BUCKET = "thread-attachments";
const MAX_FILE_SIZE_MB = 25;

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

export default function ThreadPage({ threadId }: ThreadPageProps) {
  const router = useRouter();

  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyText, setReplyText] = useState("");

  // Current user state
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [threadLikedByMe, setThreadLikedByMe] = useState(false);
  const [likedReplies, setLikedReplies] = useState<Set<string>>(new Set());

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
    loadThread();
    loadCurrentUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  async function loadCurrentUser() {
    const { data } = await supabase.auth.getUser();
    const uid = data.user?.id || null;
    setCurrentUserId(uid);
    if (uid) {
      const { data: profile } = await supabase
        .from("profiles").select("role").eq("id", uid).single();
      setCurrentUserRole(profile?.role || "member");

      const { data: likeData } = await supabase
        .from("thread_likes").select("id").eq("thread_id", threadId).eq("user_id", uid).single();
      setThreadLikedByMe(!!likeData);

      const { data: replyLikes } = await supabase
        .from("reply_likes").select("reply_id").eq("user_id", uid);
      if (replyLikes) setLikedReplies(new Set(replyLikes.map(r => r.reply_id)));
    }
  }

  async function loadThread() {
    setLoading(true);

    const { data: threadData } = await supabase.rpc("get_thread_detail", {
      thread_id_input: threadId,
    });
    if (threadData && threadData[0]) {
      setThread(threadData[0] as ThreadDetail);
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
        setErrorMsg("Could not post your reply. Please try again.");
        return;
      }

      setReplyText("");
      clearImage();
      clearVideo();
      setShowEmojiPicker(false);
      loadThread();
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
      await supabase.from("thread_likes").insert({ thread_id: thread.id, user_id: currentUserId });
      setThreadLikedByMe(true);
      setThread(prev => prev ? { ...prev, likes_count: prev.likes_count + 1 } : prev);
    }
  }

  // ── Reply Like ──
  async function toggleReplyLike(replyId: string) {
    if (!currentUserId) return;
    const isLiked = likedReplies.has(replyId);

    if (isLiked) {
      await supabase.from("reply_likes").delete().eq("reply_id", replyId).eq("user_id", currentUserId);
      setLikedReplies(prev => { const s = new Set(prev); s.delete(replyId); return s; });
      setReplies(prev => prev.map(r => r.id === replyId ? { ...r, likes_count: Math.max(0, r.likes_count - 1) } : r));
    } else {
      await supabase.from("reply_likes").insert({ reply_id: replyId, user_id: currentUserId });
      setLikedReplies(prev => new Set(prev).add(replyId));
      setReplies(prev => prev.map(r => r.id === replyId ? { ...r, likes_count: r.likes_count + 1 } : r));
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
  const threadBadge = ROLE_BADGES[thread.role || "member"] || ROLE_BADGES.member;

  return (
    <div style={{ minHeight: "100vh", background: "#050a0f", color: "#e7e7e7" }}>
      <Navbar />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "80px 16px" }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: 13, color: "#4a7a94", marginBottom: 16 }}>
          <span style={{ cursor: "pointer" }} onClick={() => router.push("/")}>Home</span>
          {" > "}
          <span style={{ cursor: "pointer" }} onClick={() => router.push(`/forum/${thread.category}`)}>
            {thread.category}
          </span>
          {" > "}
          <span style={{ cursor: "pointer" }} onClick={() => router.push(`/forum/${thread.category}/${thread.subcategory}`)}>
            {thread.subcategory}
          </span>
          {" > "}
          {thread.title}
        </div>

        <PremiumLinks placement="thread" />

        {/* ── THREAD CARD ── */}
        <div style={{ background: "#0a1520", border: "1px solid #1a2535", borderRadius: 10, marginBottom: 20, overflow: "hidden" }}>

          {/* Title bar */}
          <div style={{ padding: "18px 20px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
              {thread.pinned && (
                <span style={{ fontSize: 11, fontWeight: 700, color: "#6c63ff", background: "rgba(108,99,255,0.15)", padding: "2px 8px", borderRadius: 4 }}>
                  📌 PINNED
                </span>
              )}
              {thread.locked && (
                <span style={{ fontSize: 11, fontWeight: 700, color: "#ff9b6b", background: "rgba(255,155,107,0.1)", padding: "2px 8px", borderRadius: 4 }}>
                  🔒 LOCKED
                </span>
              )}
            </div>

            {editingThread ? (
              <input
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                style={{
                  width: "100%", background: "#050a0f", border: "1px solid #1a2535",
                  borderRadius: 6, padding: "8px 12px", color: "#fff", fontSize: 20,
                  fontWeight: 700, outline: "none", marginBottom: 12, boxSizing: "border-box",
                }}
              />
            ) : (
              <h1 style={{ margin: "0 0 12px", fontSize: 22 }}>{thread.title}</h1>
            )}
          </div>

          <div style={{ display: "flex", gap: 16, padding: "0 20px 18px", flexWrap: "wrap" }}>
            {/* Author sidebar */}
            <div style={{ width: 130, flexShrink: 0, textAlign: "center" }}>
              <div
                onClick={() => thread.username && router.push(`/profile/${thread.username}`)}
                style={{
                  width: 70, height: 70, borderRadius: 12, margin: "0 auto 8px",
                  border: `2px solid ${threadBadge.color}`, overflow: "hidden",
                  background: "#1a2535", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 24, fontWeight: 700,
                  color: threadBadge.color, cursor: thread.username ? "pointer" : "default",
                }}
              >
                {thread.avatar_url
                  ? <img src={thread.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : (thread.username || "?").slice(0, 2).toUpperCase()
                }
              </div>
              <div
                onClick={() => thread.username && router.push(`/profile/${thread.username}`)}
                style={{ fontSize: 13, fontWeight: 700, color: "#e7e7e7", cursor: thread.username ? "pointer" : "default" }}
              >
                {thread.username || "Unknown"}
              </div>
              <div style={{
                fontSize: 10.5, fontWeight: 700, color: threadBadge.color,
                marginTop: 4, display: "inline-block", background: `${threadBadge.color}1a`,
                border: `1px solid ${threadBadge.color}44`, borderRadius: 4, padding: "2px 8px",
              }}>
                {threadBadge.icon} {threadBadge.label}
              </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "#4a7a94", fontSize: 12.5, marginBottom: 12 }}>
                {new Date(thread.created_at).toLocaleString()} · 👁️ {thread.views_count} views
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
                  dangerouslySetInnerHTML={{ __html: thread.content }}
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

              {/* Actions */}
              {!editingThread && (
                <div style={{ display: "flex", gap: 8, marginTop: 16, alignItems: "center" }}>
                  <button
                    onClick={toggleThreadLike}
                    disabled={!currentUserId}
                    style={{
                      background: threadLikedByMe ? "rgba(231,76,140,0.15)" : "transparent",
                      border: `1px solid ${threadLikedByMe ? "#e74c8c" : "#1a2535"}`,
                      borderRadius: 6, padding: "6px 14px", color: threadLikedByMe ? "#e74c8c" : "#9ab0bf",
                      fontSize: 12.5, fontWeight: 600, cursor: currentUserId ? "pointer" : "default",
                      display: "flex", alignItems: "center", gap: 6,
                    }}
                  >
                    {threadLikedByMe ? "❤️" : "🤍"} {thread.likes_count}
                  </button>

                  {canManageThread() && (
                    <>
                      <button onClick={startEditThread} style={btnGhost}>✏️ Edit</button>
                      <button onClick={deleteThread} style={{ ...btnGhost, color: "#ef4444", borderColor: "#ef444444" }}>
                        🗑️ Delete
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── REPLIES ── */}
        <div style={{ background: "#0a1520", border: "1px solid #1a2535", borderRadius: 10, padding: 20 }}>
          <h2 style={{ marginBottom: 20, fontSize: 18 }}>
            Replies {replies.length > 0 && `(${replies.length})`}
          </h2>

          {/* Reply composer */}
          {currentUserId ? (
            <div style={{ marginBottom: 24 }}>
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
              padding: "16px", textAlign: "center", marginBottom: 24, fontSize: 13, color: "#4a7a94",
            }}>
              <a href="/login" style={{ color: "#00b4d8", textDecoration: "none", fontWeight: 600 }}>Login</a> to post a reply
            </div>
          )}

          {/* Replies list */}
          {replies.length === 0 ? (
            <div style={{ color: "#4a7a94", textAlign: "center", padding: "40px 0", border: "1px dashed #1a2535", borderRadius: 8 }}>
              No replies yet.
            </div>
          ) : (
            replies.map((reply) => {
              const replyBadge = ROLE_BADGES[reply.role || "member"] || ROLE_BADGES.member;
              const isLiked = likedReplies.has(reply.id);
              const isEditing = editingReplyId === reply.id;

              return (
                <div key={reply.id} style={{
                  background: "#050a0f", border: "1px solid #1a2535", borderRadius: 8,
                  padding: 16, marginBottom: 12, display: "flex", gap: 14,
                }}>
                  {/* Author */}
                  <div style={{ width: 80, flexShrink: 0, textAlign: "center" }}>
                    <div
                      onClick={() => reply.username && router.push(`/profile/${reply.username}`)}
                      style={{
                        width: 48, height: 48, borderRadius: 10, margin: "0 auto 6px",
                        border: `2px solid ${replyBadge.color}`, overflow: "hidden",
                        background: "#1a2535", display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: 16, fontWeight: 700,
                        color: replyBadge.color, cursor: reply.username ? "pointer" : "default",
                      }}
                    >
                      {reply.avatar_url
                        ? <img src={reply.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : (reply.username || "?").slice(0, 2).toUpperCase()
                      }
                    </div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: "#e7e7e7", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {reply.username || "Unknown"}
                    </div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: replyBadge.color, marginTop: 3 }}>
                      {replyBadge.icon} {replyBadge.label}
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
                      <span style={{ fontSize: 11.5, color: "#4a7a94" }}>
                        {timeAgo(reply.created_at)}
                        {reply.edited_at && <span style={{ fontStyle: "italic" }}> · edited</span>}
                      </span>
                    </div>

                    {isEditing ? (
                      <>
                        <textarea
                          value={editReplyText}
                          onChange={e => setEditReplyText(e.target.value)}
                          style={{
                            width: "100%", minHeight: 90, background: "#0a1520",
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

                        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                          <button
                            onClick={() => toggleReplyLike(reply.id)}
                            disabled={!currentUserId}
                            style={{
                              background: isLiked ? "rgba(231,76,140,0.15)" : "transparent",
                              border: `1px solid ${isLiked ? "#e74c8c" : "#1a2535"}`,
                              borderRadius: 6, padding: "4px 10px", color: isLiked ? "#e74c8c" : "#9ab0bf",
                              fontSize: 11.5, fontWeight: 600, cursor: currentUserId ? "pointer" : "default",
                            }}
                          >
                            {isLiked ? "❤️" : "🤍"} {reply.likes_count}
                          </button>

                          {canManageReply(reply) && (
                            <>
                              <button onClick={() => startEditReply(reply)} style={{ ...btnGhost, padding: "4px 10px", fontSize: 11.5 }}>✏️ Edit</button>
                              <button onClick={() => deleteReply(reply.id)} style={{ ...btnGhost, padding: "4px 10px", fontSize: 11.5, color: "#ef4444", borderColor: "#ef444444" }}>🗑️ Delete</button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })
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

      <Footer />
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