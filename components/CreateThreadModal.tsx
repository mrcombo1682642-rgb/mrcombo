"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

interface CreateThreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
  subcategory: string;
}

const PREFIXES = ["No Prefix", "Discussion", "Question", "Guide", "Release", "Request"];

const FONT_SIZES = ["12px", "13px", "14px", "16px", "18px", "20px", "24px", "28px"];

const TEXT_COLORS = [
  "#c8dde8", "#ff6b6b", "#22c55e", "#00b4d8",
  "#f59e0b", "#a855f7", "#6c63ff", "#ffffff",
];

export default function CreateThreadModal({
  isOpen,
  onClose,
  category,
  subcategory,
}: CreateThreadModalProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [title, setTitle] = useState("");
  const [prefix, setPrefix] = useState("No Prefix");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  // Post options
  const [includeSignature, setIncludeSignature] = useState(true);
  const [disableSmilies, setDisableSmilies] = useState(false);
  const [subscriptionType, setSubscriptionType] = useState("none");

  // Poll
  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);

  // Editor
  const editorRef = useRef<HTMLDivElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontSize, setShowFontSize] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      supabase.auth.getUser().then(({ data }) => setUser(data.user));
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      // reset on close
      setTitle("");
      setPrefix("No Prefix");
      setError("");
      setIncludeSignature(true);
      setDisableSmilies(false);
      setSubscriptionType("none");
      setShowPoll(false);
      setPollQuestion("");
      setPollOptions(["", ""]);
      if (editorRef.current) editorRef.current.innerHTML = "";
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function exec(command: string, value?: string) {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }

  function handleImageInsert() {
    imageInputRef.current?.click();
  }

  async function onImageSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const ext = file.name.split(".").pop();
    const path = `${user.id}/thread-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars") // reuse public bucket for inline images
      .upload(path, file, { upsert: true });

    if (uploadError) {
      console.error("Image upload failed:", uploadError.message);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    exec("insertImage", urlData.publicUrl);
    e.target.value = "";
  }

  function handleLinkInsert() {
    const url = prompt("Enter URL:");
    if (url) exec("createLink", url);
  }

  function addPollOption() {
    if (pollOptions.length < 10) setPollOptions([...pollOptions, ""]);
  }

  function removePollOption(i: number) {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, idx) => idx !== i));
    }
  }

  async function handlePost() {
    setError("");
    const content = editorRef.current?.innerHTML.trim() || "";
    const plainText = editorRef.current?.innerText.trim() || "";

    if (!title.trim()) {
      setError("Please enter a thread title.");
      return;
    }
    if (!plainText) {
      setError("Please write your message.");
      return;
    }
    if (!user) {
      setError("You must be logged in to post.");
      return;
    }
    if (showPoll) {
      if (!pollQuestion.trim()) {
        setError("Please enter a poll question.");
        return;
      }
      const validOptions = pollOptions.filter(o => o.trim());
      if (validOptions.length < 2) {
        setError("Poll needs at least 2 options.");
        return;
      }
    }

    setPosting(true);

    const { data: threadData, error: threadError } = await supabase
      .from("threads")
      .insert({
        title: title.trim(),
        content,
        category,
        subcategory,
        user_id: user.id,
        prefix: prefix === "No Prefix" ? null : prefix,
        include_signature: includeSignature,
        disable_smilies: disableSmilies,
        subscription_type: subscriptionType,
        pinned: false,
        locked: false,
      })
      .select()
      .single();

    if (threadError || !threadData) {
      setPosting(false);
      setError(threadError?.message || "Failed to create thread.");
      return;
    }

    // Poll
    if (showPoll) {
      const validOptions = pollOptions.filter(o => o.trim());
      await supabase.from("thread_polls").insert({
        thread_id: threadData.id,
        question: pollQuestion.trim(),
        options: validOptions,
      });
    }

    // Subscription
    if (subscriptionType !== "none") {
      await supabase.from("thread_subscriptions").insert({
        thread_id: threadData.id,
        user_id: user.id,
        notify_type: subscriptionType,
      });
    }

    setPosting(false);
    onClose();
    router.push(`/thread/${threadData.id}`);
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 500,
        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        overflowY: "auto",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#0a1520", border: "1px solid #1a2535", borderRadius: 12,
          width: "100%", maxWidth: 720, maxHeight: "90vh", overflowY: "auto",
          margin: "auto",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          background: "#6c63ff", padding: "14px 20px", borderRadius: "12px 12px 0 0",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 2,
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>Create Thread</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
              Posting in: {category} / {subcategory}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.15)", border: "none",
            borderRadius: 6, width: 28, height: 28, color: "#fff",
            fontSize: 16, cursor: "pointer", flexShrink: 0,
          }}>✕</button>
        </div>

        <div style={{ padding: "20px" }}>

          {/* Prefix + Title */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <select
              value={prefix}
              onChange={e => setPrefix(e.target.value)}
              style={{
                background: "#050a0f", border: "1px solid #1a2535", borderRadius: 6,
                padding: "10px 10px", color: "#c8dde8", fontSize: 13, outline: "none",
                flexShrink: 0, cursor: "pointer",
              }}
            >
              {PREFIXES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Thread title..."
              style={{
                flex: 1, background: "#050a0f", border: "1px solid #1a2535",
                borderRadius: 6, padding: "10px 14px", color: "#c8dde8",
                fontSize: 14, outline: "none",
              }}
            />
          </div>

          {/* Rich Text Toolbar */}
          <div style={{
            display: "flex", flexWrap: "wrap", gap: 4,
            background: "#050a0f", border: "1px solid #1a2535", borderRadius: "6px 6px 0 0",
            padding: "6px 8px", position: "relative",
          }}>
            <ToolBtn label="B" title="Bold" bold onClick={() => exec("bold")} />
            <ToolBtn label="I" title="Italic" italic onClick={() => exec("italic")} />
            <ToolBtn label="U" title="Underline" underline onClick={() => exec("underline")} />
            <ToolBtn label="S" title="Strikethrough" strike onClick={() => exec("strikeThrough")} />
            <Divider />
            <ToolBtn label="⬅" title="Align Left" onClick={() => exec("justifyLeft")} />
            <ToolBtn label="⬌" title="Align Center" onClick={() => exec("justifyCenter")} />
            <ToolBtn label="➡" title="Align Right" onClick={() => exec("justifyRight")} />
            <Divider />

            {/* Font size dropdown */}
            <div style={{ position: "relative" }}>
              <ToolBtn label="Size" title="Font Size" onClick={() => { setShowFontSize(v => !v); setShowColorPicker(false); }} />
              {showFontSize && (
                <div style={{
                  position: "absolute", top: "100%", left: 0, marginTop: 4,
                  background: "#0d1c28", border: "1px solid #1a2535", borderRadius: 6,
                  padding: 6, zIndex: 10, display: "flex", flexDirection: "column", gap: 2,
                  minWidth: 70,
                }}>
                  {FONT_SIZES.map(size => (
                    <button key={size} onClick={() => { exec("fontSize", "3"); document.execCommand("fontSize", false, "3"); setShowFontSize(false); }} style={{
                      background: "none", border: "none", color: "#c8dde8", fontSize: size,
                      textAlign: "left", padding: "4px 8px", cursor: "pointer", borderRadius: 4,
                    }} onMouseEnter={e => (e.currentTarget.style.background = "#1a2535")}
                       onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      {size}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Color picker */}
            <div style={{ position: "relative" }}>
              <ToolBtn label="A" title="Text Color" color="#ff6b6b" onClick={() => { setShowColorPicker(v => !v); setShowFontSize(false); }} />
              {showColorPicker && (
                <div style={{
                  position: "absolute", top: "100%", left: 0, marginTop: 4,
                  background: "#0d1c28", border: "1px solid #1a2535", borderRadius: 6,
                  padding: 8, zIndex: 10, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6,
                }}>
                  {TEXT_COLORS.map(c => (
                    <div key={c} onClick={() => { exec("foreColor", c); setShowColorPicker(false); }}
                      style={{
                        width: 20, height: 20, borderRadius: 4, background: c,
                        cursor: "pointer", border: "1px solid #2a3545",
                      }} />
                  ))}
                </div>
              )}
            </div>

            <Divider />
            <ToolBtn label="🔗" title="Insert Link" onClick={handleLinkInsert} />
            <ToolBtn label="🖼️" title="Insert Image" onClick={handleImageInsert} />
            <input ref={imageInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onImageSelected} />
            <Divider />
            <ToolBtn label="•≡" title="Bullet List" onClick={() => exec("insertUnorderedList")} />
            <ToolBtn label="1≡" title="Numbered List" onClick={() => exec("insertOrderedList")} />
            <ToolBtn label="❝❞" title="Quote" onClick={() => exec("formatBlock", "<blockquote>")} />
            <ToolBtn label="</>" title="Code" onClick={() => exec("formatBlock", "<pre>")} />
            <Divider />
            <ToolBtn label="↺" title="Undo" onClick={() => exec("undo")} />
            <ToolBtn label="↻" title="Redo" onClick={() => exec("redo")} />
          </div>

          {/* Editable area */}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            data-placeholder="Write your message here..."
            style={{
              minHeight: 200, maxHeight: 400, overflowY: "auto",
              background: "#050a0f", border: "1px solid #1a2535", borderTop: "none",
              borderRadius: "0 0 6px 6px", padding: "12px 14px",
              color: "#c8dde8", fontSize: 14, lineHeight: 1.6, outline: "none",
            }}
            className="rte-editable"
          />

          <style>{`
            .rte-editable:empty:before {
              content: attr(data-placeholder);
              color: #3d6a80;
            }
            .rte-editable blockquote {
              border-left: 3px solid #6c63ff;
              padding-left: 12px;
              margin: 8px 0;
              color: #9ab0bf;
            }
            .rte-editable pre {
              background: #0a1520;
              border: 1px solid #1a2535;
              border-radius: 6px;
              padding: 10px;
              font-family: monospace;
              font-size: 13px;
              overflow-x: auto;
              margin: 8px 0;
            }
            .rte-editable img {
              max-width: 100%;
              border-radius: 6px;
              margin: 8px 0;
            }
            .rte-editable a {
              color: #00b4d8;
            }
            .rte-editable ul, .rte-editable ol {
              padding-left: 22px;
              margin: 8px 0;
            }
          `}</style>

          {/* Poll section */}
          <div style={{ marginTop: 18 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <Checkbox checked={showPoll} onChange={() => setShowPoll(v => !v)} />
              <span style={{ fontSize: 13, color: "#c8dde8" }}>I want to attach a poll to this thread</span>
            </label>

            {showPoll && (
              <div style={{
                marginTop: 12, background: "#050a0f", border: "1px solid #1a2535",
                borderRadius: 8, padding: 14,
              }}>
                <input
                  value={pollQuestion}
                  onChange={e => setPollQuestion(e.target.value)}
                  placeholder="Poll question..."
                  style={{
                    width: "100%", background: "#0a1520", border: "1px solid #1a2535",
                    borderRadius: 6, padding: "9px 12px", color: "#c8dde8",
                    fontSize: 13, outline: "none", marginBottom: 10, boxSizing: "border-box",
                  }}
                />
                {pollOptions.map((opt, i) => (
                  <div key={i} style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                    <input
                      value={opt}
                      onChange={e => {
                        const copy = [...pollOptions];
                        copy[i] = e.target.value;
                        setPollOptions(copy);
                      }}
                      placeholder={`Option ${i + 1}`}
                      style={{
                        flex: 1, background: "#0a1520", border: "1px solid #1a2535",
                        borderRadius: 6, padding: "8px 12px", color: "#c8dde8",
                        fontSize: 13, outline: "none",
                      }}
                    />
                    {pollOptions.length > 2 && (
                      <button onClick={() => removePollOption(i)} style={{
                        background: "#1a2535", border: "none", borderRadius: 6,
                        padding: "0 12px", color: "#ef4444", cursor: "pointer", fontSize: 14,
                      }}>✕</button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 10 && (
                  <button onClick={addPollOption} style={{
                    background: "none", border: "1px dashed #1a3042", borderRadius: 6,
                    padding: "6px 14px", color: "#00b4d8", fontSize: 12,
                    cursor: "pointer", fontWeight: 600,
                  }}>
                    + Add Option
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Post options */}
          <div style={{
            marginTop: 18, paddingTop: 16, borderTop: "1px solid #1a2535",
            display: "flex", flexDirection: "column", gap: 10,
          }}>
            <div style={{ fontSize: 12, color: "#4a7a94", fontWeight: 700, letterSpacing: 1 }}>
              POST OPTIONS
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <Checkbox checked={includeSignature} onChange={() => setIncludeSignature(v => !v)} />
              <span style={{ fontSize: 13, color: "#c8dde8" }}>
                Signature: include your signature (registered users only)
              </span>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <Checkbox checked={disableSmilies} onChange={() => setDisableSmilies(v => !v)} />
              <span style={{ fontSize: 13, color: "#c8dde8" }}>
                Disable Smilies: disable smilies from showing in this post
              </span>
            </label>

            <div style={{ marginTop: 6 }}>
              <div style={{ fontSize: 12, color: "#4a7a94", fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>
                THREAD SUBSCRIPTION
              </div>
              {[
                { value: "none", label: "Do not subscribe to this thread" },
                { value: "no_notify", label: "Subscribe without receiving any notification of new replies" },
                { value: "email", label: "Subscribe and receive email notification of new replies" },
                { value: "pm", label: "Subscribe and receive PM notification of new replies" },
              ].map(opt => (
                <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 6 }}>
                  <input
                    type="radio"
                    name="subscription"
                    checked={subscriptionType === opt.value}
                    onChange={() => setSubscriptionType(opt.value)}
                    style={{ accentColor: "#6c63ff", width: 14, height: 14, cursor: "pointer" }}
                  />
                  <span style={{ fontSize: 12.5, color: "#9ab0bf" }}>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div style={{
              marginTop: 14, background: "#ef444415", border: "1px solid #ef444430",
              borderRadius: 6, padding: "8px 12px", color: "#ef4444", fontSize: 13,
            }}>
              {error}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button
              onClick={handlePost}
              disabled={posting}
              style={{
                flex: 1, background: "#6c63ff", border: "none", borderRadius: 8,
                padding: "12px 0", color: "#fff", fontSize: 14, fontWeight: 700,
                cursor: posting ? "not-allowed" : "pointer", opacity: posting ? 0.6 : 1,
              }}
            >
              {posting ? "Posting..." : "Post Thread"}
            </button>
            <button
              onClick={onClose}
              style={{
                background: "#1a2535", border: "1px solid #2a3545", borderRadius: 8,
                padding: "12px 24px", color: "#c8dde8", fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──

function ToolBtn({
  label, title, onClick, bold, italic, underline, strike, color,
}: {
  label: string; title: string; onClick: () => void;
  bold?: boolean; italic?: boolean; underline?: boolean; strike?: boolean; color?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        background: "#0d1c28", border: "1px solid #1a2535", borderRadius: 4,
        minWidth: 28, height: 28, padding: "0 6px", color: color || "#c8dde8",
        fontSize: 12, fontWeight: bold ? 800 : 600,
        fontStyle: italic ? "italic" : "normal",
        textDecoration: underline ? "underline" : strike ? "line-through" : "none",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "#1a2535")}
      onMouseLeave={e => (e.currentTarget.style.background = "#0d1c28")}
    >
      {label}
    </button>
  );
}

function Divider() {
  return <div style={{ width: 1, background: "#1a2535", margin: "2px 4px" }} />;
}

function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div
      onClick={onChange}
      style={{
        width: 18, height: 18, borderRadius: 4,
        border: `1.5px solid ${checked ? "#6c63ff" : "#4a7a94"}`,
        background: checked ? "#6c63ff" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", flexShrink: 0,
      }}
    >
      {checked && <span style={{ color: "#fff", fontSize: 12 }}>✓</span>}
    </div>
  );
}