"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { ThreadListItem } from "@/lib/types";
import CreateThreadModal from "@/components/CreateThreadModal";
import ThreadList from "@/components/ThreadList";

type SortField =
  | "last_post"
  | "title"
  | "views"
  | "replies"
  | "likes"
  | "created";

type SortOrder = "asc" | "desc";

const PAGE_SIZE = 20;

export default function SubcategoryPageClient({
  slug,
  subcategory,
}: {
  slug: string;
  subcategory: string;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [allThreads, setAllThreads] = useState<ThreadListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [user, setUser] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  const [likedThreadIds, setLikedThreadIds] = useState<Set<string>>(
    new Set()
  );

  const [sortField, setSortField] = useState<SortField>("last_post");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);
  const [onlineCount, setOnlineCount] = useState<number | null>(null);

  // --------------------------------------------------
  // Online users (display-only placeholder)
  // --------------------------------------------------

  useEffect(() => {
    setOnlineCount(Math.floor(Math.random() * 30) + 5);
  }, []);

  // --------------------------------------------------
  // Load threads
  // --------------------------------------------------

  async function loadThreads() {
    setLoading(true);
    setLoadError(null);

    try {
      const { data, error } = await supabase.rpc("get_thread_list", {
        category_input: slug,
        subcategory_input: subcategory,
      });

      if (error) {
        console.error("Failed to load threads:", error.message);
        setAllThreads([]);
        setLoadError("Could not load threads. Please try again.");
      } else {
        setAllThreads((data || []) as ThreadListItem[]);
      }
    } catch (err) {
      console.error("Network error loading threads:", err);
      setAllThreads([]);
      setLoadError(
        "Network error while loading threads. Please check your connection."
      );
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------------------------
  // Load current user
  // --------------------------------------------------

  async function loadCurrentUser() {
    try {
      const { data } = await supabase.auth.getUser();
      const currentUser = data.user || null;
      const uid = currentUser?.id || null;

      setUser(currentUser);
      setCurrentUserId(uid);

      if (!uid) {
        setCurrentUserRole(null);
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", uid)
        .single();

      if (error) {
        console.error("Failed to load user role:", error.message);
        setCurrentUserRole("member");
      } else {
        setCurrentUserRole(profile?.role || "member");
      }
    } catch (err) {
      console.error("Network error loading user:", err);
      setUser(null);
      setCurrentUserId(null);
      setCurrentUserRole(null);
    }
  }

  // --------------------------------------------------
  // Initial load
  // --------------------------------------------------

  useEffect(() => {
    setPage(1);
    loadThreads();
    loadCurrentUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, subcategory]);

  // --------------------------------------------------
  // Load liked threads
  // --------------------------------------------------

  useEffect(() => {
    async function loadLikedThreads() {
      if (!currentUserId || allThreads.length === 0) {
        setLikedThreadIds(new Set());
        return;
      }

      try {
        const ids = allThreads.map((thread) => thread.id);

        const { data, error } = await supabase
          .from("thread_likes")
          .select("thread_id")
          .eq("user_id", currentUserId)
          .in("thread_id", ids);

        if (error) {
          console.error("Failed to load liked threads:", error.message);
          return;
        }

        if (data) {
          setLikedThreadIds(
            new Set(data.map((row: { thread_id: string }) => row.thread_id))
          );
        }
      } catch (err) {
        console.error("Network error loading liked threads:", err);
      }
    }

    loadLikedThreads();
  }, [allThreads, currentUserId]);

  // --------------------------------------------------
  // Role check
  // --------------------------------------------------

  function isAdminOrMod() {
    return currentUserRole === "admin" || currentUserRole === "moderator";
  }

  // --------------------------------------------------
  // Like / Unlike
  // --------------------------------------------------

  async function toggleThreadLike(e: React.MouseEvent, threadId: string) {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUserId) {
      alert("Please login to like threads.");
      return;
    }

    const isLiked = likedThreadIds.has(threadId);

    try {
      if (isLiked) {
        const { error } = await supabase
          .from("thread_likes")
          .delete()
          .eq("thread_id", threadId)
          .eq("user_id", currentUserId);

        if (error) {
          console.error("Unlike error:", error.message);
          return;
        }

        setLikedThreadIds((prev) => {
          const next = new Set(prev);
          next.delete(threadId);
          return next;
        });

        setAllThreads((prev) =>
          prev.map((thread) =>
            thread.id === threadId
              ? {
                  ...thread,
                  likes_count: Math.max(0, (thread.likes_count || 0) - 1),
                }
              : thread
          )
        );
      } else {
        const { error } = await supabase
          .from("thread_likes")
          .insert({ thread_id: threadId, user_id: currentUserId });

        if (error) {
          console.error("Like error:", error.message);
          return;
        }

        setLikedThreadIds((prev) => {
          const next = new Set(prev);
          next.add(threadId);
          return next;
        });

        setAllThreads((prev) =>
          prev.map((thread) =>
            thread.id === threadId
              ? { ...thread, likes_count: (thread.likes_count || 0) + 1 }
              : thread
          )
        );
      }
    } catch (err) {
      console.error("Network error toggling like:", err);
    }
  }

  // --------------------------------------------------
  // Admin / Moderator delete
  // --------------------------------------------------

  async function handleDeleteThread(e: React.MouseEvent, threadId: string) {
    e.preventDefault();
    e.stopPropagation();

    if (!isAdminOrMod()) return;

    const confirmed = confirm(
      "Delete this thread permanently? This cannot be undone."
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("threads")
        .delete()
        .eq("id", threadId);

      if (error) {
        console.error("Delete thread error:", error.message);
        alert("Could not delete thread.");
        return;
      }

      setAllThreads((prev) =>
        prev.filter((thread) => thread.id !== threadId)
      );

      setLikedThreadIds((prev) => {
        const next = new Set(prev);
        next.delete(threadId);
        return next;
      });
    } catch (err) {
      console.error("Network error deleting thread:", err);
      alert("Network error. Please try again.");
    }
  }

  // --------------------------------------------------
  // Sorting
  // --------------------------------------------------

  function sortThreads(list: ThreadListItem[]) {
    const sorted = [...list];

    sorted.sort((a, b) => {
      let cmp = 0;

      switch (sortField) {
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
        case "views":
          cmp = (a.views_count || 0) - (b.views_count || 0);
          break;
        case "replies":
          cmp = (a.reply_count || 0) - (b.reply_count || 0);
          break;
        case "likes":
          cmp = (a.likes_count || 0) - (b.likes_count || 0);
          break;
        case "created":
        case "last_post":
        default:
          cmp =
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime();
          break;
      }

      return sortOrder === "asc" ? cmp : -cmp;
    });

    // Pinned threads always stay at the top.
    return [
      ...sorted.filter((thread) => thread.pinned),
      ...sorted.filter((thread) => !thread.pinned),
    ];
  }

  const sortedThreads = sortThreads(allThreads);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedThreads.length / PAGE_SIZE)
  );

  const pageThreads = sortedThreads.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  // --------------------------------------------------
  // Keep page valid after deleting threads
  // --------------------------------------------------

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <div className="scp-page">
      <div className="scp-container">
        {/* Breadcrumb */}
        <div className="scp-breadcrumb">
          <Link href="/" className="scp-crumb-link">
            Home
          </Link>
          {" > "}
          <Link href={`/forum/${slug}`} className="scp-crumb-link">
            {slug}
          </Link>
          {" > "}
          <span className="scp-crumb-current">{subcategory}</span>
        </div>

        {/* Header */}
        <div className="scp-header">
          <span>{subcategory}</span>

          {user && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="scp-create-btn"
            >
              + Create Thread
            </button>
          )}
        </div>

        {/* Online users */}
        <div className="scp-online-bar">
          👁️ Users browsing this forum:{" "}
          <strong className="scp-online-count">
            {onlineCount ?? "..."} Guest(s)
          </strong>
        </div>

        {/* Sort bar */}
        <div className="scp-sort-bar">
          <div className="scp-sort-controls">
            <span className="scp-sort-label">Sort by:</span>

            <select
              value={sortField}
              onChange={(e) => {
                setSortField(e.target.value as SortField);
                setPage(1);
              }}
              className="scp-select"
            >
              <option value="last_post">Last Post</option>
              <option value="title">Title</option>
              <option value="views">Views</option>
              <option value="replies">Replies</option>
              <option value="likes">Likes</option>
              <option value="created">Created Date</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value as SortOrder);
                setPage(1);
              }}
              className="scp-select"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>

          <div className="scp-thread-count">
            {sortedThreads.length} thread{sortedThreads.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Threads (card-style list — see ThreadList.tsx) */}
        <div className="scp-thread-panel">
          {loading ? (
            <div className="scp-loading">Loading threads...</div>
          ) : loadError ? (
            <div className="scp-error">
              {loadError}
              <button
                type="button"
                onClick={loadThreads}
                className="scp-retry-btn"
              >
                Retry
              </button>
            </div>
          ) : (
            <ThreadList
              threads={pageThreads}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              likedThreadIds={likedThreadIds}
              onToggleLike={toggleThreadLike}
              onDeleteThread={handleDeleteThread}
            />
          )}
        </div>

        {/* Pagination */}
        {!loading && !loadError && totalPages > 1 && (
          <div className="scp-pagination">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="scp-page-btn"
            >
              ‹ Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 || p === totalPages || Math.abs(p - page) <= 1
              )
              .map((p, idx, arr) => (
                <span key={p} className="scp-page-group">
                  {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <span className="scp-ellipsis">…</span>
                  )}

                  <button
                    type="button"
                    onClick={() => setPage(p)}
                    className={
                      p === page ? "scp-page-btn scp-page-active" : "scp-page-btn"
                    }
                  >
                    {p}
                  </button>
                </span>
              ))}

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="scp-page-btn"
            >
              Next ›
            </button>
          </div>
        )}
      </div>

      {/* Create Thread Modal */}
      <CreateThreadModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          loadThreads();
        }}
        category={slug}
        subcategory={subcategory}
      />

      <style jsx>{`
        .scp-page {
          min-height: 100vh;
          background: #050a0f;
          color: #c8dde8;
          padding: 80px 16px;
        }

        .scp-container {
          max-width: 1100px;
          margin: 0 auto;
        }

        .scp-breadcrumb {
          font-size: 13px;
          color: #4a7a94;
          margin-bottom: 14px;
        }

        .scp-crumb-link {
          color: #4a7a94;
          text-decoration: none;
        }

        .scp-crumb-link:hover {
          color: #6cc6ff;
        }

        .scp-crumb-current {
          color: #7fa3b8;
        }

        .scp-header {
          background: #6c63ff;
          padding: 12px 18px;
          border-radius: 8px 8px 0 0;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        }

        .scp-create-btn {
          background: rgba(255, 255, 255, 0.2);
          color: #fff;
          padding: 7px 16px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
        }

        .scp-create-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .scp-online-bar {
          background: #080e18;
          border: 1px solid #0d2030;
          border-top: none;
          padding: 8px 18px;
          font-size: 12px;
          color: #4a7a94;
        }

        .scp-online-count {
          color: #6cc6ff;
        }

        .scp-sort-bar {
          background: #0a1520;
          border: 1px solid #0d2030;
          border-top: none;
          padding: 10px 18px;
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: space-between;
          border-radius: 0 0 8px 8px;
          margin-bottom: 16px;
        }

        .scp-sort-controls {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .scp-sort-label {
          font-size: 12px;
          color: #4a7a94;
        }

        .scp-select {
          background: #050a0f;
          border: 1px solid #1a2535;
          border-radius: 6px;
          padding: 6px 10px;
          color: #c8dde8;
          font-size: 12px;
          outline: none;
          cursor: pointer;
        }

        .scp-thread-count {
          font-size: 12px;
          color: #4a7a94;
        }

        .scp-thread-panel {
          margin-top: 0;
        }

        .scp-loading {
          text-align: center;
          padding: 60px 20px;
          color: #4a7a94;
          font-size: 13px;
        }

        .scp-error {
          text-align: center;
          padding: 40px 20px;
          color: #ff8b8b;
          font-size: 13px;
        }

        .scp-retry-btn {
          display: block;
          margin: 14px auto 0;
          background: #6c63ff;
          border: none;
          border-radius: 6px;
          color: #fff;
          padding: 8px 18px;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
        }

        .scp-pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 6px;
          margin-top: 18px;
          flex-wrap: wrap;
        }

        .scp-page-group {
          display: flex;
          align-items: center;
        }

        .scp-ellipsis {
          color: #4a7a94;
          padding: 0 4px;
        }

        .scp-page-btn {
          background: #0a1520;
          border: 1px solid #1a2535;
          border-radius: 6px;
          padding: 6px 12px;
          color: #c8dde8;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
        }

        .scp-page-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .scp-page-btn:hover:not(:disabled) {
          border-color: #6c63ff;
        }

        .scp-page-active {
          background: #6c63ff;
          border-color: #6c63ff;
          color: #fff;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}