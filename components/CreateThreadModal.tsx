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

// ── Shared markup for a "hidden content" block (used by both the
// toolbar 🔒 button and the [hide]...[/hide] shortcode parser below) ──
function buildHiddenBlockHTML(innerHTML: string): string {
  return (
    `<div class="hlb-pending" contenteditable="false" style="border:1px dashed #f0a500;border-radius:6px;padding:8px 10px;margin:6px 0;background:rgba(240,165,0,0.08);">` +
    `<div class="hlb-editor-label" style="color:#f0a500;font-size:11px;font-weight:700;margin-bottom:4px;">🔒 HIDDEN CONTENT — visible after reply, or instantly for Admins &amp; Premium users</div>` +
    `<div class="hlb-editor-content">${innerHTML}</div>` +
    `</div><div><br></div>`
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ── Builds a standalone link CARD: a short label on top, a
// downward arrow, then the actual clickable link as its own button —
// each on its own row, inside a bordered box. Used for both regular
// inserted links and links placed inside a hidden-content block. ──
function buildLinkCardHTML(safeUrl: string, safeLabel: string): string {
  return (
    `<div class="link-card" contenteditable="false">` +
    `<div class="link-card-label">${safeLabel}</div>` +
    `<div class="link-card-arrow">↓</div>` +
    `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="link-card-url">${safeUrl}</a>` +
    `</div><div><br></div>`
  );
}

// ── Converts any [hide]...[/hide] shortcode typed directly into the
// editor into the same hidden-block markup the 🔒 toolbar button
// produces, so both ways of hiding content end up handled identically
// by the extraction logic in handlePost(). ──
function convertHideShortcodes(html: string): string {
  return html.replace(/\[hide\]([\s\S]*?)\[\/hide\]/gi, (_match, inner: string) => {
    return buildHiddenBlockHTML(inner);
  });
}

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

  // ── Insert a professional link CARD: label on top, an arrow,
  // then the clickable link — each in its own row inside a bordered
  // box, instead of a cramped inline chip. ──
  function handleLinkInsert() {
    const url = prompt("Enter the link URL (e.g. https://example.com):");
    if (!url || !url.trim()) return;

    let defaultLabel = url.trim();
    try {
      defaultLabel = new URL(url.trim()).hostname.replace(/^www\./, "");
    } catch {
      // not a valid absolute URL — just fall back to the raw text
    }

    const labelInput = prompt("Display text for this link (optional):", defaultLabel);
    const label = (labelInput && labelInput.trim()) ? labelInput.trim() : defaultLabel;

    const safeUrl = url.trim().replace(/"/g, "&quot;");
    const safeLabel = escapeHtml(label);
    const html = buildLinkCardHTML(safeUrl, safeLabel);

    document.execCommand("insertHTML", false, html);
    editorRef.current?.focus();
  }

  // ── Insert a hidden content block (text OR link) via the toolbar
  // button. If it's a link, ask for a short professional display
  // label too — same pattern as handleLinkInsert — instead of
  // showing the raw URL as the visible text. ──
  function insertHiddenContent() {
    const raw = prompt("Please enter the text or link you want to hide:");
    if (!raw || !raw.trim()) return;

    const trimmed = raw.trim();
    const isUrl = /^https?:\/\/\S+$/i.test(trimmed);

    let innerHTML: string;

    if (isUrl) {
      let defaultLabel = trimmed;
      try {
        defaultLabel = new URL(trimmed).hostname.replace(/^www\./, "");
      } catch {
        // not a valid absolute URL — fall back to raw text
      }
      const labelInput = prompt("Display text for this hidden link:", defaultLabel);
      const label = (labelInput && labelInput.trim()) ? labelInput.trim() : defaultLabel;

      const safeUrl = trimmed.replace(/"/g, "&quot;");
      const safeLabel = escapeHtml(label);
      innerHTML = buildLinkCardHTML(safeUrl, safeLabel);
    } else {
      innerHTML = escapeHtml(trimmed);
    }

    document.execCommand("insertHTML", false, buildHiddenBlockHTML(innerHTML));
    editorRef.current?.focus();
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

    // Run [hide]...[/hide] shortcode conversion first, so any hidden
    // content typed directly (without using the 🔒 button) is picked
    // up by the same extraction logic below.
    const rawHTML = convertHideShortcodes(editorRef.current?.innerHTML.trim() || "");
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

    // ── Extract hidden blocks from content before saving ──
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHTML, "text/html");
    const hiddenEls = Array.from(doc.querySelectorAll(".hlb-pending"));
    const hiddenContents: string[] = [];

    hiddenEls.forEach((el, idx) => {
      const contentEl = el.querySelector(".hlb-editor-content");
      hiddenContents.push(contentEl ? contentEl.innerHTML : el.innerHTML);
      const placeholder = doc.createElement("div");
      placeholder.className = "hlb-placeholder";
      placeholder.setAttribute("data-hlb-temp-index", String(idx));
      el.replaceWith(placeholder);
    });

    const content = doc.body.innerHTML;

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
      if (threadError?.message?.includes("DAILY_LIMIT_REACHED")) {
        setError("Aap ne aaj ki 17 posts/threads ki limit poori kar li hai. Kal try karein ya premium upgrade karein.");
      } else {
        setError(threadError?.message || "Failed to create thread.");
      }
      return;
    }

    // ── Insert hidden blocks (now that we have the real thread_id) ──
    if (hiddenContents.length > 0) {
      const blockIdMap: Record<number, string> = {};

      for (let i = 0; i < hiddenContents.length; i++) {
        const { data: blockData, error: blockError } = await supabase
          .from("thread_hidden_blocks")
          .insert({ thread_id: threadData.id, content: hiddenContents[i] })
          .select()
          .single();

        if (!blockError && blockData) {
          blockIdMap[i] = blockData.id;
        }
      }

      const doc2 = parser.parseFromString(content, "text/html");
      doc2.querySelectorAll(".hlb-placeholder").forEach(el => {
        const idx = el.getAttribute("data-hlb-temp-index");
        const blockId = idx !== null ? blockIdMap[Number(idx)] : undefined;
        if (blockId) {
          el.setAttribute("data-hlb-id", blockId);
          el.removeAttribute("data-hlb-temp-index");
        }
      });
      const finalContent = doc2.body.innerHTML;

      await supabase.from("threads").update({ content: finalContent }).eq("id", threadData.id);
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
            <ToolBtn
              label="🔒"
              title="Hide content (text or link) — visible instantly for Admins & Premium users, after reply for everyone else"
              color="#f0a500"
              onClick={insertHiddenContent}
            />
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

          <div style={{ fontSize: 11, color: "#4a7a94", marginTop: 6 }}>
            Tip: Click the 🔒 button to hide a piece of text or a link — or just wrap it yourself like{" "}
            <code style={{ color: "#c8dde8" }}>[hide]your text or link[/hide]</code>. Admins and Premium
            users will see it instantly; everyone else needs to reply to this thread first.
          </div>

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
            .rte-editable a.thread-link-chip,
            .rte-editable a {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              max-width: 100%;
              padding: 5px 12px;
              margin: 2px 2px;
              background: rgba(0,180,216,0.08);
              border: 1px solid rgba(0,180,216,0.35);
              border-radius: 6px;
              color: #6cc6ff;
              font-size: 13px;
              font-weight: 600;
              text-decoration: none;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              vertical-align: middle;
            }
            .rte-editable a.thread-link-chip::before,
            .rte-editable a::before {
              content: "🔗";
              font-size: 11px;
            }
            .rte-editable a:hover {
              background: rgba(0,180,216,0.16);
              border-color: #00b4d8;
            }
            .rte-editable .link-card {
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
            .rte-editable .link-card-label {
              font-size: 13px;
              font-weight: 700;
              color: #c8dde8;
              text-align: center;
              word-break: break-word;
            }
            .rte-editable .link-card-arrow {
              font-size: 15px;
              color: #4a7a94;
              line-height: 1;
            }
            .rte-editable .link-card-url {
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
            .rte-editable .link-card-url:hover {
              background: rgba(0,180,216,0.22);
              border-color: #00b4d8;
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