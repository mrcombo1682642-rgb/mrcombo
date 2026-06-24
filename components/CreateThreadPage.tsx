"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function CreateThreadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const category = searchParams.get("category") || "";
  const subcategory = searchParams.get("subcategory") || "";

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!title || !content) {
      alert("Fill all fields");
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Login required");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("threads")
      .insert([
        {
          title,
          content,
          category,
          subcategory,
          user_id: user.id,
        },
      ])
      .select()
      .single();

    setLoading(false);

    if (error) {
      console.log(error);
      alert(error.message);
      return;
    }

    router.push(`/thread/${data.id}`);
  }

  return (
    <div
      style={{
        maxWidth: 800,
        margin: "80px auto",
        padding: 20,
        color: "#fff",
      }}
    >
      <h1>Create Thread</h1>

      <input
        placeholder="Thread title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{
          width: "100%",
          padding: 12,
          marginBottom: 20,
          background: "#111827",
          color: "#fff",
          border: "1px solid #1f2937",
        }}
      />

      <textarea
        placeholder="Content..."
        rows={10}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={{
          width: "100%",
          padding: 12,
          background: "#111827",
          color: "#fff",
          border: "1px solid #1f2937",
        }}
      />

      <button
        onClick={handleCreate}
        disabled={loading}
        style={{
          marginTop: 20,
          padding: "12px 20px",
          background: "#6c63ff",
          border: "none",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        {loading ? "Creating..." : "Create Thread"}
      </button>
    </div>
  );
}