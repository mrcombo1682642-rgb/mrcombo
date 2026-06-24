"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footbar";
import ThreadList from "@/components/ThreadList";
import CreateThreadModal from "@/components/CreateThreadModal";
import type { ThreadListItem } from "@/lib/types";

const GAME_INFO: Record<string, { icon: string; title: string; desc: string; color: string; banner: string }> = {
  lol:     { icon: "⚔️", title: "League of Legends", desc: "Discuss champions, builds, ranked tips and more.", color: "#C89B3C", banner: "linear-gradient(135deg, #1a0a00, #2d1a00)" },
  fortnite:{ icon: "🎯", title: "Fortnite",          desc: "Battle royale tips, skins, and strategies.",      color: "#00d4ff", banner: "linear-gradient(135deg, #001a2d, #002d4a)" },
  fps:     { icon: "🎮", title: "FPS Games",          desc: "CS2, Valorant, COD and all FPS discussions.",    color: "#e74c3c", banner: "linear-gradient(135deg, #1a0000, #2d0000)" },
  mmorpg:  { icon: "🐉", title: "MMORPG",             desc: "WoW, FFXIV, Lost Ark and more.",                 color: "#a855f7", banner: "linear-gradient(135deg, #1a0040, #2d0060)" },
  other:   { icon: "🕹️", title: "Other Games",        desc: "All other gaming discussions go here.",          color: "#22c55e", banner: "linear-gradient(135deg, #001a0a, #002d14)" },
};

type GameThread = ThreadListItem & { game_tag?: string };

export default function GamingPageClient({ subcategory }: { subcategory: string }) {
  const [threads, setThreads] = useState<GameThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const game = GAME_INFO[subcategory] || {
    icon: "🎮", title: subcategory, desc: "", color: "#6c63ff",
    banner: "linear-gradient(135deg, #0a0520, #1a0840)",
  };

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (uid) {
        setUser(userData.user);
        const { data: profile } = await supabase
          .from("profiles").select("role").eq("id", uid).single();
        if (profile?.role === "admin") setIsAdmin(true);
      }
    }
    init();
    loadThreads();
  }, [subcategory]);

  async function loadThreads() {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_thread_list", {
      category_input: "gaming",
      subcategory_input: subcategory,
    });
    if (!error) setThreads(data || []);
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#050a0f" }}>
      <Navbar />
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "80px 12px 48px" }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: 13, color: "#4a7a94", marginBottom: 16 }}>
          <Link href="/" style={{ color: "#4a7a94", textDecoration: "none" }}>Home</Link>
          {" › "}
          <Link href="/forum/gaming" style={{ color: "#4a7a94", textDecoration: "none" }}>Gaming</Link>
          {" › "}{game.title}
        </div>

        {/* Banner */}
        <div style={{
          background: game.banner, border: `1px solid ${game.color}33`,
          borderRadius: 12, padding: "24px 24px", marginBottom: 20,
          display: "flex", alignItems: "center", gap: 20, position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", inset: 0,
            background: `radial-gradient(ellipse 60% 80% at 80% 50%, ${game.color}15 0%, transparent 70%)`,
          }} />
          <div style={{
            width: 70, height: 70, borderRadius: 16, flexShrink: 0,
            background: `${game.color}22`, border: `2px solid ${game.color}44`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36,
            position: "relative",
          }}>
            {game.icon}
          </div>
          <div style={{ position: "relative" }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#fff" }}>{game.title}</h1>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "#9a9ca3" }}>{game.desc}</p>
          </div>

          {/* Admin — add game button */}
          {isAdmin && (
            <button onClick={() => setModalOpen(true)} style={{
              marginLeft: "auto", position: "relative",
              background: `linear-gradient(135deg, ${game.color}, ${game.color}99)`,
              border: "none", borderRadius: 8, padding: "10px 18px",
              color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
              flexShrink: 0,
            }}>
              + Add Post
            </button>
          )}
        </div>

        {/* Stats bar */}
        <div style={{
          background: "#080e18", border: "1px solid #0d2030",
          borderRadius: 8, padding: "10px 16px", marginBottom: 16,
          display: "flex", gap: 20, fontSize: 12, color: "#4a7a94",
        }}>
          <span>📌 {threads.filter(t => t.pinned).length} Pinned</span>
          <span>💬 {threads.length} Threads</span>
          <span>🎮 {game.title}</span>
          {!isAdmin && user && (
            <button onClick={() => setModalOpen(true)} style={{
              marginLeft: "auto", background: `${game.color}22`,
              border: `1px solid ${game.color}44`, borderRadius: 6,
              padding: "4px 14px", color: game.color,
              fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>
              + New Thread
            </button>
          )}
          {!user && (
            <Link href="/login" style={{
              marginLeft: "auto", color: game.color,
              fontSize: 12, fontWeight: 700, textDecoration: "none",
            }}>
              Login to post →
            </Link>
          )}
        </div>

        {/* Thread List */}
        <div style={{
          background: "#080e18", border: "1px solid #0d2030",
          borderRadius: 10, overflow: "hidden",
        }}>
          <div style={{
            padding: "10px 16px", borderBottom: "1px solid #0d2030",
            fontSize: 11, fontWeight: 700, letterSpacing: 2,
            color: "#4a7a94", background: "#060c12",
          }}>
            THREADS
          </div>
          <div style={{ padding: 16 }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#4a7a94" }}>
                Loading threads...
              </div>
            ) : (
              <ThreadList threads={threads} />
            )}
          </div>
        </div>
      </div>

      <CreateThreadModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); loadThreads(); }}
        category="gaming"
        subcategory={subcategory}
      />

      <Footer />
    </div>
  );
}