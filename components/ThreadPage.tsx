"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import Navbar from "./Navbar";
import Footer from "./Footbar";

interface ThreadPageProps {
  threadId: string;
}

interface Thread {
  id: string;
  title: string;
  content: string;
  category: string;
  subcategory: string;
  created_at: string;
}

interface Reply {
  id: string;
  content: string;
  created_at: string;
  image_url?: string | null;
  video_url?: string | null;
}

const STORAGE_BUCKET = "thread-attachments";
const MAX_FILE_SIZE_MB = 25;

export default function ThreadPage({ threadId }: ThreadPageProps) {
  const router = useRouter();

  const [thread, setThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(true);

  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyText, setReplyText] = useState("");

  // Attachment state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Emoji picker
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadThread() {
      const { data } = await supabase
        .from("threads")
        .select("*")
        .eq("id", threadId)
        .single();

      setThread(data);

      const { data: replyData } = await supabase
        .from("replies")
        .select("*")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });

      setReplies(replyData || []);
      setLoading(false);
    }

    loadThread();
  }, [threadId]);

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

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#050a0f",
          color: "#fff",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        Loading...
      </div>
    );
  }

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
    const fileName = `${threadId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${fileExt}`;

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, file);

    if (error) {
      console.error("Upload error:", error.message);
      return null;
    }

    const { data } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName);

    return data.publicUrl;
  }

  async function handleReply() {
    if (!replyText.trim() && !imageFile && !videoFile) return;

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
            setUploading(false);
            setPosting(false);
            return;
          }
        }

        if (videoFile) {
          video_url = await uploadFile(videoFile);
          if (!video_url) {
            setErrorMsg("Video upload failed. Please try again.");
            setUploading(false);
            setPosting(false);
            return;
          }
        }

        setUploading(false);
      }

      const { data, error } = await supabase
        .from("replies")
        .insert([
          {
            thread_id: threadId,
            content: replyText,
            image_url,
            video_url,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Reply insert error:", error.message);
        setErrorMsg("Could not post your reply. Please try again.");
        return;
      }

      if (data) {
        setReplies((prev) => [...prev, data]);
        setReplyText("");
        clearImage();
        clearVideo();
        setShowEmojiPicker(false);
      }
    } finally {
      setPosting(false);
    }
  }

  if (!thread) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#050a0f",
          color: "#fff",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        Thread not found
      </div>
    );
  }

  const canPost = (replyText.trim().length > 0 || imageFile || videoFile) && !posting;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050a0f",
        color: "#e7e7e7",
      }}
    >
      <Navbar />

      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "80px 16px",
        }}
      >
        {/* Breadcrumb */}
        <div
          style={{
            fontSize: 13,
            color: "#4a7a94",
            marginBottom: 16,
          }}
        >
          <span style={{ cursor: "pointer" }} onClick={() => router.push("/")}>
            Home
          </span>
          {" > "}
          <span
            style={{ cursor: "pointer" }}
            onClick={() => router.push(`/forum/${thread.category}`)}
          >
            {thread.category}
          </span>
          {" > "}
          <span
            style={{ cursor: "pointer" }}
            onClick={() =>
              router.push(`/forum/${thread.category}/${thread.subcategory}`)
            }
          >
            {thread.subcategory}
          </span>
          {" > "}
          {thread.title}
        </div>

        {/* Thread content */}
        <div
          style={{
            background: "#0a1520",
            border: "1px solid #1a2535",
            borderRadius: 10,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <h1 style={{ marginBottom: 12 }}>{thread.title}</h1>

          <div
            style={{
              color: "#4a7a94",
              fontSize: 13,
              marginBottom: 20,
            }}
          >
            {new Date(thread.created_at).toLocaleString()}
          </div>

          <div
            style={{
              lineHeight: 1.8,
              whiteSpace: "pre-wrap",
            }}
          >
            {thread.content}
          </div>
        </div>

        {/* Replies */}
        <div
          style={{
            background: "#0a1520",
            border: "1px solid #1a2535",
            borderRadius: 10,
            padding: 20,
          }}
        >
          <h2 style={{ marginBottom: 20 }}>
            Replies {replies.length > 0 && `(${replies.length})`}
          </h2>

          {/* Reply composer */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ position: "relative" }}>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                style={{
                  width: "100%",
                  minHeight: 120,
                  background: "#050a0f",
                  border: "1px solid #1a2535",
                  borderRadius: 8,
                  color: "#fff",
                  padding: 12,
                  paddingBottom: 44,
                  resize: "vertical",
                  outline: "none",
                  fontFamily: "inherit",
                  fontSize: 14,
                }}
              />

              {/* Toolbar: emoji + attach buttons, anchored inside textarea */}
              <div
                style={{
                  position: "absolute",
                  left: 8,
                  bottom: 8,
                  display: "flex",
                  gap: 6,
                }}
              >
                <button
                  ref={emojiButtonRef}
                  type="button"
                  onClick={() => setShowEmojiPicker((v) => !v)}
                  title="Add emoji"
                  style={{
                    background: showEmojiPicker ? "#1a2535" : "transparent",
                    border: "1px solid #1a2535",
                    borderRadius: 6,
                    color: "#c8dde8",
                    width: 34,
                    height: 34,
                    fontSize: 16,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  😊
                </button>

                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  title="Attach image"
                  style={{
                    background: "transparent",
                    border: "1px solid #1a2535",
                    borderRadius: 6,
                    color: "#c8dde8",
                    width: 34,
                    height: 34,
                    fontSize: 15,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  🖼️
                </button>

                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  title="Attach video"
                  style={{
                    background: "transparent",
                    border: "1px solid #1a2535",
                    borderRadius: 6,
                    color: "#c8dde8",
                    width: 34,
                    height: 34,
                    fontSize: 15,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  🎬
                </button>
              </div>

              {showEmojiPicker && (
  <div
    ref={emojiPickerRef}
    style={{
      position: "absolute",
      bottom: 50,
      left: 8,
      zIndex: 9999,
      overflow: "visible",
    }}
  >
    <EmojiPicker
      onEmojiClick={handleEmojiClick}
      theme={Theme.DARK}
      width={320}
      height={400}
    />
  </div>
)}
            </div>

            {/* Hidden file inputs */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              style={{ display: "none" }}
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={handleVideoSelect}
              style={{ display: "none" }}
            />

            {/* Previews */}
            {(imagePreview || videoPreview) && (
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  marginTop: 12,
                  flexWrap: "wrap",
                }}
              >
                {imagePreview && (
                  <div style={{ position: "relative" }}>
                    <img
                      src={imagePreview}
                      alt="Image preview"
                      style={{
                        maxWidth: 160,
                        maxHeight: 160,
                        borderRadius: 8,
                        border: "1px solid #1a2535",
                        display: "block",
                      }}
                    />
                    <button
                      onClick={clearImage}
                      title="Remove image"
                      style={{
                        position: "absolute",
                        top: -8,
                        right: -8,
                        background: "#1a2535",
                        border: "1px solid #2a3a4f",
                        color: "#fff",
                        borderRadius: "50%",
                        width: 22,
                        height: 22,
                        cursor: "pointer",
                        fontSize: 12,
                        lineHeight: 1,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}

                {videoPreview && (
                  <div style={{ position: "relative" }}>
                    <video
                      src={videoPreview}
                      controls
                      style={{
                        maxWidth: 220,
                        maxHeight: 160,
                        borderRadius: 8,
                        border: "1px solid #1a2535",
                        display: "block",
                      }}
                    />
                    <button
                      onClick={clearVideo}
                      title="Remove video"
                      style={{
                        position: "absolute",
                        top: -8,
                        right: -8,
                        background: "#1a2535",
                        border: "1px solid #2a3a4f",
                        color: "#fff",
                        borderRadius: "50%",
                        width: 22,
                        height: 22,
                        cursor: "pointer",
                        fontSize: 12,
                        lineHeight: 1,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            )}

            {errorMsg && (
              <div
                style={{
                  color: "#ff6b6b",
                  fontSize: 13,
                  marginTop: 8,
                }}
              >
                {errorMsg}
              </div>
            )}

            <button
              onClick={handleReply}
              disabled={!canPost}
              style={{
                marginTop: 12,
                background: canPost ? "#6c63ff" : "#3a3760",
                border: "none",
                color: "#fff",
                padding: "10px 20px",
                borderRadius: 8,
                cursor: canPost ? "pointer" : "not-allowed",
                fontWeight: 500,
              }}
            >
              {uploading
                ? "Uploading..."
                : posting
                ? "Posting..."
                : "Post Reply"}
            </button>
          </div>

          {/* Replies list */}
          {replies.length === 0 ? (
            <div
              style={{
                color: "#4a7a94",
                textAlign: "center",
                padding: "40px 0",
                border: "1px dashed #1a2535",
                borderRadius: 8,
              }}
            >
              No replies yet.
            </div>
          ) : (
            replies.map((reply) => (
              <div
                key={reply.id}
                style={{
                  background: "#050a0f",
                  border: "1px solid #1a2535",
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 12,
                }}
              >
                {reply.content && (
                  <div
                    style={{
                      color: "#c8dde8",
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.7,
                    }}
                  >
                    {reply.content}
                  </div>
                )}

                {reply.image_url && (
                  <img
                    src={reply.image_url}
                    alt="Reply attachment"
                    style={{
                      maxWidth: "100%",
                      maxHeight: 400,
                      borderRadius: 8,
                      marginTop: reply.content ? 12 : 0,
                      display: "block",
                    }}
                  />
                )}

                {reply.video_url && (
                  <video
                    src={reply.video_url}
                    controls
                    style={{
                      maxWidth: "100%",
                      maxHeight: 400,
                      borderRadius: 8,
                      marginTop: reply.content || reply.image_url ? 12 : 0,
                      display: "block",
                    }}
                  />
                )}

                <div
                  style={{
                    color: "#4a7a94",
                    marginTop: 12,
                    fontSize: 12,
                  }}
                >
                  {new Date(reply.created_at).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}