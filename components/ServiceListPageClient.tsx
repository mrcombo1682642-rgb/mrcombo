"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface ForumService {
  id: string;
  service_slug: string;
  service_name: string;
  description: string | null;
  icon: string;
  sort_order: number;
  threads_count: number;
  posts_count: number;
  last_thread_title: string | null;
  last_thread_id: string | null;
  last_post_username: string | null;
  last_post_at: string | null;
}

function timeAgo(dateStr: string | null) {
  if (!dateStr) return "";
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

export default function ServiceListPageClient({
  slug,
  subcategory,
}: {
  slug: string;
  subcategory: string;
}) {
  const [services, setServices] = useState<ForumService[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<{ names: string[]; count: number }>({ names: [], count: 0 });

  useEffect(() => {
    const names = ["disbalance", "fthdid", "negromalontes", "VYV"];
    const count = Math.floor(Math.random() * 400) + 200;
    setOnlineUsers({ names, count });
  }, []);

  useEffect(() => {
    loadServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, subcategory]);

  async function loadServices() {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_forum_services", {
      category_input: slug,
      subcategory_input: subcategory,
    });

    if (error) {
      console.error("Failed to load services:", error.message);
      setServices([]);
    } else {
      setServices(data || []);
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#050a0f", color: "#c8dde8", padding: "80px 16px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: 13, color: "#4a7a94", marginBottom: 14 }}>
          <Link href="/" style={{ color: "#4a7a94" }}>Home</Link>
          {" > "}
          <Link href={`/forum/${slug}`} style={{ color: "#4a7a94" }}>{slug}</Link>
          {" > "}
          {subcategory}
        </div>

        {/* Online users strip */}
        {onlineUsers.count > 0 && (
          <div style={{
            background: "#0a1520", border: "1px solid #0d2030", borderRadius: "8px 8px 0 0",
            padding: "10px 18px", fontSize: 12, color: "#4a7a94",
          }}>
            👁️ Users browsing this forum:{" "}
            {onlineUsers.names.map((n, i) => (
              <span key={n}>
                <span style={{ color: "#ff9b6b", fontWeight: 600 }}>{n}</span>
                {i < onlineUsers.names.length - 1 ? ", " : ""}
              </span>
            ))}
            , {onlineUsers.count} Guest(s)
          </div>
        )}

        {/* Header */}
        <div style={{
          background: "#6c63ff", padding: "10px 18px",
          fontWeight: 700, fontSize: 14, textAlign: "center",
        }}>
          Forums in &apos;{subcategory.charAt(0).toUpperCase() + subcategory.slice(1)}&apos;
        </div>

        {/* Table header */}
        <div
          className="service-table-header"
          style={{
            background: "#0a1520", border: "1px solid #0d2030", borderTop: "none",
            padding: "10px 18px", display: "grid",
            gridTemplateColumns: "1fr 90px 90px 200px", gap: 12,
            fontSize: 11, fontWeight: 700, color: "#4a7a94",
            letterSpacing: 0.5, textTransform: "uppercase",
          }}
        >
          <span>Forum</span>
          <span style={{ textAlign: "center" }}>Threads</span>
          <span style={{ textAlign: "center" }}>Posts</span>
          <span>Last Post</span>
        </div>

        {/* Services list */}
        <div style={{
          background: "#080e18", border: "1px solid #0d2030", borderTop: "none",
          borderRadius: "0 0 8px 8px", overflow: "hidden",
        }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#4a7a94" }}>
              Loading forums...
            </div>
          ) : services.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#4a7a94" }}>
              No forums configured yet.
            </div>
          ) : (
            services.map((s, i) => (
              <Link
                key={s.id}
                href={`/forum/${slug}/${subcategory}/${s.service_slug}`}
                style={{ textDecoration: "none", display: "block" }}
              >
                <div
                  className="service-row"
                  style={{
                    padding: "16px 18px",
                    borderBottom: i !== services.length - 1 ? "1px solid #0a1520" : "none",
                    display: "grid",
                    gridTemplateColumns: "1fr 90px 90px 200px",
                    gap: 12, alignItems: "center",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#0a1520")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  {/* Forum name + icon + description */}
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start", minWidth: 0 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                      background: "#0d2030", border: "1px solid #1a3042",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                    }}>
                      {s.icon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                        {s.service_name}
                      </div>
                      {s.description && (
                        <div style={{
                          fontSize: 12.5, color: "#6a8a9a", lineHeight: 1.5,
                          maxWidth: 500,
                        }}>
                          {s.description}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Threads */}
                  <div className="service-stat" style={{ textAlign: "center" }}>
                    <span className="mobile-label">Threads: </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#c8dde8" }}>
                      {s.threads_count}
                    </span>
                  </div>

                  {/* Posts */}
                  <div className="service-stat" style={{ textAlign: "center" }}>
                    <span className="mobile-label">Posts: </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#c8dde8" }}>
                      {s.posts_count}
                    </span>
                  </div>

                  {/* Last Post */}
                  <div className="service-stat">
                    {s.last_thread_id ? (
                      <div>
                        <div style={{
                          fontSize: 12.5, color: "#00b4d8", fontWeight: 600,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          maxWidth: 190,
                        }}>
                          {s.last_thread_title}
                        </div>
                        <div style={{ fontSize: 11, color: "#4a7a94", marginTop: 2 }}>
                          {s.last_post_username || "Unknown"} · {timeAgo(s.last_post_at)}
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: "#3d6a80" }}>No posts yet</span>
                    )}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 760px) {
          .service-table-header { display: none !important; }
          .service-row {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }
          .service-stat {
            text-align: left !important;
            font-size: 12px !important;
          }
          .mobile-label {
            color: #4a7a94;
            font-weight: 600;
          }
        }
        @media (min-width: 761px) {
          .mobile-label { display: none; }
        }
      `}</style>
    </div>
  );
}