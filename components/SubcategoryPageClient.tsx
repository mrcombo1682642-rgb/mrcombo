"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { ThreadListItem } from "@/lib/types";
import CreateThreadModal from "@/components/CreateThreadModal";
import ThreadList from "@/components/ThreadList";

export default function SubcategoryPageClient({
  slug,
  subcategory,
}: {
  slug: string;
  subcategory: string;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [threads, setThreads] = useState<ThreadListItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadThreads() {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_thread_list", {
      category_input: slug,
      subcategory_input: subcategory,
    });

    if (error) {
  console.error("Failed to load threads:", error.message);
  setThreads([]);
} else {
  console.log("THREAD DATA:", data);
  setThreads(data || []);
}
    setLoading(false);
  }

  useEffect(() => {
    loadThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, subcategory]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050a0f",
        color: "#c8dde8",
        padding: "80px 16px",
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        {/* Breadcrumb */}
        <div
          style={{
            fontSize: 13,
            color: "#4a7a94",
            marginBottom: 20,
          }}
        >
          <Link href="/" style={{ color: "#4a7a94" }}>
            Home
          </Link>
          {" > "}
          <Link href={`/forum/${slug}`} style={{ color: "#4a7a94" }}>
            {slug}
          </Link>
          {" > "}
          {subcategory}
        </div>

        {/* Header */}
        <div
          style={{
            background: "#6c63ff",
            padding: "12px 16px",
            borderRadius: "8px 8px 0 0",
            fontWeight: 700,
          }}
        >
          {subcategory}
        </div>

        <div
          style={{
            background: "#080e18",
            border: "1px solid #0d2030",
            borderTop: "none",
            borderRadius: "0 0 8px 8px",
            padding: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 20,
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <h2 style={{ margin: 0 }}>{subcategory}</h2>

            <button
              onClick={() => setModalOpen(true)}
              style={{
                background: "#6c63ff",
                color: "#fff",
                padding: "10px 16px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              + Create Thread
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#4a7a94" }}>
              Loading threads...
            </div>
          ) : (
            <ThreadList threads={threads} />
          )}
        </div>
      </div>

      <CreateThreadModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          loadThreads(); // refresh list after a new thread is created
        }}
        category={slug}
        subcategory={subcategory}
      />
    </div>
  );
}