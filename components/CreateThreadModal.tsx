"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

interface CreateThreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
  subcategory: string;
}

export default function CreateThreadModal({
  isOpen,
  onClose,
  category,
  subcategory,
}: CreateThreadModalProps) {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    async function checkUser() {
      setCheckingAuth(true);
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setCheckingAuth(false);
    }

    checkUser();
  }, [isOpen]);

  // Reset form state whenever modal closes
  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setContent("");
      setErrorMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSubmit() {
    if (!title.trim() || !content.trim()) {
      setErrorMsg("Title aur content dono zaroori hain.");
      return;
    }
    if (!user) return;

    setSubmitting(true);
    setErrorMsg(null);

    const { data, error } = await supabase
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

    setSubmitting(false);

    if (error) {
      console.error("Thread create error:", error.message);
      setErrorMsg("Thread create nahi ho saka. Dobara try karein.");
      return;
    }

    if (data) {
      onClose();
      router.push(`/thread/${data.id}`);
    }
  }

  function handleLoginRedirect() {
    const redirectTo = `/forum/${category}/${subcategory}`;
    router.push(`/login?redirect=${encodeURIComponent(redirectTo)}`);
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(2, 6, 12, 0.7)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0a1520",
          border: "1px solid #1a2535",
          borderRadius: 12,
          width: "100%",
          maxWidth: 560,
          padding: 24,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {checkingAuth ? (
          <div style={{ padding: "30px 0", textAlign: "center", color: "#4a7a94" }}>
            Checking login status...
          </div>
        ) : !user ? (
          // ---------- NOT LOGGED IN ----------
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
            <h3 style={{ marginBottom: 8 }}>Login Required</h3>
            <p style={{ color: "#4a7a94", marginBottom: 24, lineHeight: 1.6 }}>
              Thread create karne ke liye pehle login karein.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                onClick={handleLoginRedirect}
                style={{
                  background: "#6c63ff",
                  color: "#fff",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                Login / Sign Up
              </button>
              <button
                onClick={onClose}
                style={{
                  background: "transparent",
                  color: "#c8dde8",
                  border: "1px solid #1a2535",
                  padding: "10px 20px",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          // ---------- LOGGED IN: SHOW FORM ----------
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <h3 style={{ margin: 0 }}>Create Thread</h3>
              <button
                onClick={onClose}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#4a7a94",
                  fontSize: 20,
                  cursor: "pointer",
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                fontSize: 12,
                color: "#4a7a94",
                marginBottom: 16,
              }}
            >
              Posting in: <strong style={{ color: "#c8dde8" }}>{category} / {subcategory}</strong>
            </div>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Thread title..."
              style={{
                width: "100%",
                background: "#050a0f",
                border: "1px solid #1a2535",
                borderRadius: 8,
                color: "#fff",
                padding: 12,
                marginBottom: 12,
                outline: "none",
                fontSize: 14,
              }}
            />

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              style={{
                width: "100%",
                minHeight: 160,
                background: "#050a0f",
                border: "1px solid #1a2535",
                borderRadius: 8,
                color: "#fff",
                padding: 12,
                resize: "vertical",
                outline: "none",
                fontFamily: "inherit",
                fontSize: 14,
              }}
            />

            {errorMsg && (
              <div style={{ color: "#ff6b6b", fontSize: 13, marginTop: 8 }}>
                {errorMsg}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  background: submitting ? "#3a3760" : "#6c63ff",
                  color: "#fff",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: 8,
                  cursor: submitting ? "not-allowed" : "pointer",
                  fontWeight: 500,
                }}
              >
                {submitting ? "Posting..." : "Post Thread"}
              </button>
              <button
                onClick={onClose}
                disabled={submitting}
                style={{
                  background: "transparent",
                  color: "#c8dde8",
                  border: "1px solid #1a2535",
                  padding: "10px 20px",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}