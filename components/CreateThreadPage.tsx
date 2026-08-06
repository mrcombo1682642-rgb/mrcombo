"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navbar from "./Navbar";
import Footbar from "./Footbar";

export default function CreateThreadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const category = searchParams.get("category") || "";
  const subcategory = searchParams.get("subcategory") || "";

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    setError("");

    if (!title.trim() || !content.trim()) {
      setError("Please fill in both the title and the content.");
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in to create a thread.");
      setLoading(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from("threads")
      .insert([
        {
          title: title.trim(),
          content: content.trim(),
          category,
          subcategory,
          user_id: user.id,
        },
      ])
      .select()
      .single();

    setLoading(false);

    if (insertError) {
      console.error(insertError);
      setError(insertError.message || "Failed to create thread.");
      return;
    }

    router.push(`/thread/${data.id}`);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#050a0f", color: "#c8dde8" }}>
      <Navbar />

      <div
        style={{
          maxWidth: 760,
          margin: "0 auto",
          padding: "100px 16px 60px",
        }}
      >
        {/* Breadcrumb */}
        <div style={{ fontSize: 13, color: "#4a7a94", marginBottom: 16 }}>
          Home {category && `› ${category}`} {subcategory && `› ${subcategory}`}
        </div>

        <div style={{
          background: "#0a1520", border: "1px solid #1a2535", borderRadius: 10, overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{ background: "#6c63ff", padding: "14px 20px" }}>
            <div style={{ fontWeight: 700, fontSize: 17, color: "#fff" }}>Create Thread</div>
            {(category || subcategory) && (
              <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>
                Posting in: {category}{subcategory ? ` / ${subcategory}` : ""}
              </div>
            )}
          </div>

          <div style={{ padding: 20 }}>
            {/* Title */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: "#4a7a94", fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>
                THREAD TITLE
              </div>
              <input
                placeholder="Enter a clear, descriptive title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  background: "#050a0f",
                  color: "#c8dde8",
                  border: "1px solid #1a2535",
                  borderRadius: 6,
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Content */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: "#4a7a94", fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>
                CONTENT
              </div>
              <textarea
                placeholder="Write your message..."
                rows={10}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  background: "#050a0f",
                  color: "#c8dde8",
                  border: "1px solid #1a2535",
                  borderRadius: 6,
                  fontSize: 14,
                  lineHeight: 1.6,
                  outline: "none",
                  resize: "vertical",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {error && (
              <div style={{
                marginTop: 10, background: "#ef444415", border: "1px solid #ef444430",
                borderRadius: 6, padding: "8px 12px", color: "#ef4444", fontSize: 13,
              }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button
                onClick={handleCreate}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "12px 0",
                  background: loading ? "#3a3760" : "#6c63ff",
                  border: "none",
                  borderRadius: 8,
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Creating..." : "Create Thread"}
              </button>
              <button
                onClick={() => router.back()}
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

      <Footbar />
    </div>
  );
}