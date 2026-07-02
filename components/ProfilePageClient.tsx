"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footbar";
import type { Profile, ProfileStats, ProfileVisitor } from "@/lib/types";

const ROLE_BADGES: Record<string, { label: string; color: string; icon: string }> = {
  admin:     { label: "Admin",     color: "#ff6b6b", icon: "👑" },
  moderator: { label: "Moderator", color: "#6cc6ff", icon: "🛡️" },
  vip:       { label: "VIP",       color: "#00b4d8", icon: "⭐" },
  "vip+":    { label: "VIP+",      color: "#a855f7", icon: "💎" },
  lifetime:  { label: "Lifetime",  color: "#f59e0b", icon: "♛" },
  member:    { label: "Member",    color: "#4a7a94", icon: "👤" },
};

const SUBSCRIPTION_ROLES = ["vip", "vip+", "lifetime", "admin"];

function timeAgo(dateStr: string | null) {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "Not specified";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

type SettingsTab = "profile" | "username" | "music" | "account";

export default function ProfilePageClient({ targetUsername }: { targetUsername: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [visitors, setVisitors] = useState<ProfileVisitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  // Music
  const [music, setMusic] = useState<{ song_url: string; song_title: string; autoplay: boolean } | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  // Settings panel
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("profile");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Profile edit fields
  const [editBio, setEditBio] = useState("");
  const [editSignature, setEditSignature] = useState("");
  const [editDiscord, setEditDiscord] = useState("");
  const [editTelegram, setEditTelegram] = useState("");
  const [editDob, setEditDob] = useState("");

  // Username change
  const [newUsername, setNewUsername] = useState("");
  const [usernameMsg, setUsernameMsg] = useState("");
  const [usernameRequests, setUsernameRequests] = useState<any[]>([]);

  // Music settings
  const [musicUrl, setMusicUrl] = useState("");
  const [musicTitle, setMusicTitle] = useState("");
  const [musicAutoplay, setMusicAutoplay] = useState(false);

  // Image upload
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUsername]);

  async function init() {
    setLoading(true);
    setNotFound(false);

    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id || null;
    setCurrentUserId(uid);

    const { data: profileData, error } = await supabase
      .from("profiles").select("*").eq("username", targetUsername).single();

    if (error || !profileData) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setProfile(profileData as Profile);
    setEditBio(profileData.bio || "");
    setEditSignature(profileData.signature || "");
    setEditDiscord(profileData.discord_id || "");
    setEditTelegram(profileData.telegram_id || "");
    setEditDob(profileData.date_of_birth || "");

    const owner = uid === profileData.id;
    setIsOwner(owner);

    if (profileData.last_seen) {
      const diffMin = (Date.now() - new Date(profileData.last_seen).getTime()) / 60000;
      setIsOnline(diffMin < 5);
    }

    // Track visit
    let visitorUsername = "Guest";
    if (uid) {
      const { data: myProfile } = await supabase
        .from("profiles").select("username").eq("id", uid).single();
      visitorUsername = myProfile?.username || "Unknown";
    }
    supabase.rpc("track_profile_visit", {
      target_user_id: profileData.id,
      visitor_id_input: uid,
      visitor_username_input: visitorUsername,
    });

    // Stats
    const { data: statsData } = await supabase.rpc("get_profile_stats", {
      profile_user_id: profileData.id,
    });
    if (statsData && statsData[0]) setStats(statsData[0] as ProfileStats);

    // Visitors
    const { data: visitData } = await supabase
      .from("profile_visits").select("visitor_username, visited_at")
      .eq("profile_user_id", profileData.id)
      .order("visited_at", { ascending: false }).limit(5);
    if (visitData) setVisitors(visitData as ProfileVisitor[]);

    // Music
    const { data: musicData } = await supabase
      .from("profile_music").select("*").eq("user_id", profileData.id).single();
    if (musicData) {
      setMusic(musicData);
      setMusicUrl(musicData.song_url || "");
      setMusicTitle(musicData.song_title || "");
      setMusicAutoplay(musicData.autoplay || false);
    }

    // Username requests (owner only)
    if (owner && uid) {
      const { data: requests } = await supabase
        .from("username_change_requests").select("*")
        .eq("user_id", uid).order("created_at", { ascending: false }).limit(5);
      setUsernameRequests(requests || []);
    }

    // Update last_seen
    if (uid && owner) {
      supabase.from("profiles").update({ last_seen: new Date().toISOString() }).eq("id", uid);
    }

    setLoading(false);
  }

  async function uploadImage(file: File, type: "avatar" | "cover") {
    if (!currentUserId || !profile) return;
    const setUploading = type === "avatar" ? setUploadingAvatar : setUploadingCover;
    setUploading(true);
    const bucket = type === "avatar" ? "avatars" : "covers";
    const ext = file.name.split(".").pop();
    const path = `${currentUserId}/${type}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (uploadError) { setUploading(false); return; }
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
    const column = type === "avatar" ? "avatar_url" : "cover_url";
    await supabase.from("profiles").update({ [column]: urlData.publicUrl }).eq("id", currentUserId);
    setProfile(prev => prev ? { ...prev, [column]: urlData.publicUrl } as Profile : prev);
    setUploading(false);
  }

  async function handleSaveProfile() {
    if (!currentUserId) return;
    setSaving(true); setSaveMsg("");
    const { error } = await supabase.from("profiles").update({
      bio: editBio.trim() || null,
      signature: editSignature.trim() || null,
      discord_id: editDiscord.trim() || null,
      telegram_id: editTelegram.trim() || null,
      date_of_birth: editDob || null,
    }).eq("id", currentUserId);
    setSaving(false);
    if (error) { setSaveMsg("Error saving."); return; }
    setProfile(prev => prev ? { ...prev, bio: editBio.trim() || null, signature: editSignature.trim() || null, discord_id: editDiscord.trim() || null, telegram_id: editTelegram.trim() || null, date_of_birth: editDob || null } as Profile : prev);
    setSaveMsg("Saved!");
    setTimeout(() => setSaveMsg(""), 2000);
  }

  async function handleUsernameRequest() {
    if (!currentUserId || !profile) return;
    setUsernameMsg("");

    if (!SUBSCRIPTION_ROLES.includes(profile.role)) {
      setUsernameMsg("❌ Username change requires a subscription (VIP, VIP+, or Lifetime).");
      return;
    }
    if (!newUsername.trim() || newUsername.trim().length < 3) {
      setUsernameMsg("❌ Username must be at least 3 characters.");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(newUsername.trim())) {
      setUsernameMsg("❌ Only letters, numbers, and underscores allowed.");
      return;
    }

    // Check monthly limit (3 per month)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { data: monthRequests } = await supabase
      .from("username_change_requests")
      .select("id").eq("user_id", currentUserId)
      .gte("created_at", monthStart);

    if ((monthRequests?.length || 0) >= 3) {
      setUsernameMsg("❌ You have reached the limit of 3 username change requests this month.");
      return;
    }

    // Check if username taken
    const { data: existing } = await supabase
      .from("profiles").select("username").eq("username", newUsername.trim()).maybeSingle();
    if (existing) { setUsernameMsg("❌ Username already taken."); return; }

    // Submit request
    const { error } = await supabase.from("username_change_requests").insert({
      user_id: currentUserId,
      current_username: profile.username,
      requested_username: newUsername.trim(),
      status: "pending",
    });

    if (error) { setUsernameMsg("❌ Error submitting request."); return; }

    setUsernameMsg("✅ Request submitted! Admin will review and approve it.");
    setNewUsername("");

    // Refresh requests
    const { data: requests } = await supabase
      .from("username_change_requests").select("*")
      .eq("user_id", currentUserId).order("created_at", { ascending: false }).limit(5);
    setUsernameRequests(requests || []);
  }

  async function handleSaveMusic() {
    if (!currentUserId) return;
    if (!musicUrl.trim()) {
      setSaveMsg("❌ Please enter a music URL.");
      return;
    }
    setSaving(true); setSaveMsg("");
    const { error } = await supabase.from("profile_music").upsert({
      user_id: currentUserId,
      song_url: musicUrl.trim(),
      song_title: musicTitle.trim() || "My Song",
      autoplay: musicAutoplay,
    }, { onConflict: "user_id" });
    setSaving(false);
    if (error) { setSaveMsg("❌ Error saving music."); return; }
    setMusic({ song_url: musicUrl.trim(), song_title: musicTitle.trim() || "My Song", autoplay: musicAutoplay });
    setSaveMsg("✅ Music saved!");
    setTimeout(() => setSaveMsg(""), 2000);
  }

  async function handleRemoveMusic() {
    if (!currentUserId) return;
    await supabase.from("profile_music").delete().eq("user_id", currentUserId);
    setMusic(null); setMusicUrl(""); setMusicTitle(""); setMusicAutoplay(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  function togglePlay() {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#050a0f" }}>
      <Navbar />
      <div style={{ textAlign: "center", padding: "140px 0", color: "#4a7a94" }}>Loading profile...</div>
      <Footer />
    </div>
  );

  if (notFound || !profile) return (
    <div style={{ minHeight: "100vh", background: "#050a0f" }}>
      <Navbar />
      <div style={{ textAlign: "center", padding: "140px 16px", color: "#4a7a94" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h1 style={{ color: "#e0f0ff", fontSize: 22, marginBottom: 8 }}>User not found</h1>
        <Link href="/" style={{ color: "#00b4d8", fontSize: 13 }}>← Back to Home</Link>
      </div>
      <Footer />
    </div>
  );

  const badge = ROLE_BADGES[profile.role] || ROLE_BADGES.member;
  const isSubscriber = SUBSCRIPTION_ROLES.includes(profile.role);

  return (
    <div style={{ minHeight: "100vh", background: "#050a0f", color: "#c8dde8", fontFamily: "Inter, sans-serif" }}>
      <Navbar />

      {/* Music player */}
      {music && (
        <div style={{
          position: "fixed", bottom: 20, right: 20, zIndex: 100,
          background: "#0a1520", border: "1px solid #1a2535", borderRadius: 12,
          padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)", minWidth: 220,
        }}>
          <audio ref={audioRef} src={music.song_url} loop onEnded={() => setPlaying(false)} />
          <button onClick={togglePlay} style={{
            width: 36, height: 36, borderRadius: "50%", background: "#6c63ff",
            border: "none", color: "#fff", fontSize: 16, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {playing ? "⏸" : "▶"}
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#e7e7e7", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              🎵 {music.song_title || "Profile Music"}
            </div>
            <div style={{ fontSize: 10, color: "#4a7a94" }}>
              {profile.username}&apos;s music
            </div>
          </div>
          <button onClick={() => setMusic(null)} style={{
            background: "none", border: "none", color: "#4a7a94", cursor: "pointer", fontSize: 16,
          }}>✕</button>
        </div>
      )}

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "80px 14px 60px" }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: 13, color: "#4a7a94", marginBottom: 14 }}>
          <Link href="/" style={{ color: "#4a7a94", textDecoration: "none" }}>Home</Link>
          {" › "}Profile of {profile.username}
        </div>

        {/* COVER BANNER */}
        <div style={{
          position: "relative", height: 200, borderRadius: "12px 12px 0 0", overflow: "hidden",
          background: profile.cover_url ? `url(${profile.cover_url}) center/cover no-repeat` : "linear-gradient(135deg, #1a0840, #0d1f2d, #001a2d)",
          border: "1px solid #1a2535", borderBottom: "none",
        }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(5,10,15,0.85))" }} />
          {isOwner && (
            <button onClick={() => coverInputRef.current?.click()} disabled={uploadingCover}
              style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 6, padding: "6px 14px", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", zIndex: 2 }}>
              {uploadingCover ? "Uploading..." : "📷 Change Cover"}
            </button>
          )}
          <input ref={coverInputRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], "cover")} />
        </div>

        {/* PROFILE HEADER */}
        <div style={{ background: "#0a1520", border: "1px solid #1a2535", borderTop: "none", padding: "0 24px 20px", display: "flex", alignItems: "flex-end", gap: 18, flexWrap: "wrap", position: "relative" }}>
          <div style={{ marginTop: -50, position: "relative", flexShrink: 0 }}>
            <div style={{ width: 100, height: 100, borderRadius: 14, border: `3px solid ${badge.color}`, overflow: "hidden", background: "#1a2535", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, fontWeight: 700, color: badge.color, boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}>
              {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.username || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (profile.username || "?").slice(0, 2).toUpperCase()}
            </div>
            <div style={{ position: "absolute", bottom: -4, right: -4, width: 18, height: 18, borderRadius: "50%", background: isOnline ? "#22c55e" : "#4a5568", border: "3px solid #0a1520" }} />
            {isOwner && (
              <>
                <button onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar}
                  style={{ position: "absolute", inset: 0, borderRadius: 14, background: "rgba(0,0,0,0.55)", border: "none", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", opacity: 0, transition: "opacity 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={e => (e.currentTarget.style.opacity = "0")}>
                  {uploadingAvatar ? "..." : "✏️ Edit"}
                </button>
                <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: "none" }}
                  onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], "avatar")} />
              </>
            )}
          </div>

          <div style={{ flex: 1, paddingTop: 12, minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#fff" }}>{profile.username}</h1>
              <span style={{ fontSize: 12, fontWeight: 700, color: badge.color, background: `${badge.color}1a`, border: `1px solid ${badge.color}44`, borderRadius: 5, padding: "3px 10px" }}>
                {badge.icon} {badge.label}
              </span>
              {isSubscriber && <span style={{ fontSize: 10, color: "#f59e0b", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 4, padding: "2px 8px", fontWeight: 700 }}>SUBSCRIBER</span>}
            </div>
            <div style={{ fontSize: 13, color: isOnline ? "#22c55e" : "#4a7a94", marginTop: 4 }}>
              {isOnline ? "● Online now" : `Last seen ${timeAgo(profile.last_seen)}`}
            </div>
            {profile.bio && <p style={{ fontSize: 13, color: "#9ab0bf", marginTop: 8, maxWidth: 500 }}>{profile.bio}</p>}
          </div>

          <div style={{ display: "flex", gap: 8, paddingTop: 12, flexWrap: "wrap" }}>
            {isOwner ? (
              <>
                <button onClick={() => setSettingsOpen(true)} style={{ background: "#6c63ff", border: "none", borderRadius: 7, padding: "9px 18px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  ⚙️ Settings
                </button>
                <button onClick={handleLogout} style={{ background: "#1a2535", border: "1px solid #2a3545", borderRadius: 7, padding: "9px 18px", color: "#c8dde8", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Logout
                </button>
              </>
            ) : (
              currentUserId && (
                <Link href="/" style={{ background: "#0d2030", border: "1px solid #1a3042", borderRadius: 7, padding: "9px 18px", color: "#00b4d8", fontSize: 13, fontWeight: 700, textDecoration: "none", display: "inline-block" }}>
                  💬 Message
                </Link>
              )
            )}
          </div>
        </div>

        {/* REPUTATION + LIKES */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "#1a2535" }}>
          <div style={{ background: "#0a1520", padding: "16px", textAlign: "center" }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#22c55e" }}>{profile.reputation || 0}</div>
            <div style={{ fontSize: 11, color: "#6a8a9a", textTransform: "uppercase", letterSpacing: 1 }}>Reputation</div>
          </div>
          <div style={{ background: "#0a1520", padding: "16px", textAlign: "center" }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#e74c8c" }}>{profile.likes_received || 0}</div>
            <div style={{ fontSize: 11, color: "#6a8a9a", textTransform: "uppercase", letterSpacing: 1 }}>Likes</div>
          </div>
        </div>

        {/* MAIN GRID */}
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr 260px", gap: 16, marginTop: 16 }} className="profile-grid">
          {/* LEFT */}
          <div>
            <BoxHeader title="Information" color="#6c63ff" />
            <BoxBody>
              <InfoRow label="Status" value={isOnline ? "Online" : "Offline"} valueColor={isOnline ? "#22c55e" : "#9a9ca3"} />
              <InfoRow label="UID" value={profile.id.slice(0, 8).toUpperCase()} />
              <InfoRow label="Joined" value={formatDate(profile.join_date)} />
              <InfoRow label="Date of Birth" value={formatDate(profile.date_of_birth)} />
              <InfoRow label="Last Visit" value={timeAgo(profile.last_seen)} />
              <InfoRow label="Profile Views" value={String(profile.profile_views || 0)} />
              <InfoRow label="Discord ID" value={profile.discord_id || "Not specified"} />
              <InfoRow label="Telegram ID" value={profile.telegram_id || "Not specified"} />
            </BoxBody>
          </div>

          {/* CENTER */}
          <div>
            <BoxHeader title="Statistics" color="#00b4d8" />
            <BoxBody>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px" }}>
                <StatRow icon="💬" label="Posts" value={stats?.posts_count ?? 0} />
                <StatRow icon="📝" label="Threads" value={stats?.threads_count ?? 0} />
                <StatRow icon="❤️" label="Likes" value={stats?.likes_count ?? 0} />
                <StatRow icon="⭐" label="Reputation" value={profile.reputation ?? 0} />
                <StatRow icon="🚩" label="Reported Posts" value={stats?.reported_posts ?? 0} />
                <StatRow icon="🏆" label="Vouches" value={0} />
              </div>
            </BoxBody>

            <div style={{ marginTop: 16 }}>
              <BoxHeader title="Signature" color="#f59e0b" />
              <BoxBody>
                {profile.signature ? (
                  <p style={{ fontSize: 13, color: "#9ab0bf", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>{profile.signature}</p>
                ) : (
                  <p style={{ fontSize: 13, color: "#3d6a80", margin: 0 }}>No signature set.</p>
                )}
              </BoxBody>
            </div>

            {/* Music player on profile */}
            {music && (
              <div style={{ marginTop: 16 }}>
                <BoxHeader title="🎵 Profile Music" color="#a855f7" />
                <BoxBody>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button onClick={togglePlay} style={{ width: 36, height: 36, borderRadius: "50%", background: "#a855f7", border: "none", color: "#fff", fontSize: 16, cursor: "pointer" }}>
                      {playing ? "⏸" : "▶"}
                    </button>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#e7e7e7" }}>{music.song_title || "Profile Music"}</div>
                      <div style={{ fontSize: 11, color: "#4a7a94" }}>Click to {playing ? "pause" : "play"}</div>
                    </div>
                  </div>
                </BoxBody>
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div>
            <BoxHeader title="Awards" color="#a855f7" />
            <BoxBody>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["🏅", "🔥", "🛡️"].map((icon, i) => (
                  <div key={i} style={{ width: 38, height: 38, borderRadius: 8, background: "#0d2030", border: "1px solid #1a3042", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{icon}</div>
                ))}
              </div>
            </BoxBody>

            <div style={{ marginTop: 16 }}>
              <BoxHeader title="Last Visitors" color="#22c55e" />
              <BoxBody>
                {visitors.length === 0 ? (
                  <p style={{ fontSize: 12, color: "#3d6a80", margin: 0 }}>No visitors yet.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {visitors.map((v, i) => (
                      <Link key={i} href={`/profile/${v.visitor_username}`} style={{ textDecoration: "none" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 26, height: 26, borderRadius: 6, flexShrink: 0, background: "#1a2535", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#6cc6ff" }}>
                            {v.visitor_username?.slice(0, 2).toUpperCase()}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 12.5, color: "#c8dde8", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.visitor_username}</div>
                            <div style={{ fontSize: 10.5, color: "#3d6a80" }}>{timeAgo(v.visited_at)}</div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </BoxBody>
            </div>
          </div>
        </div>
      </div>

      {/* ── SETTINGS MODAL ── */}
      {settingsOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setSettingsOpen(false)}>
          <div style={{ background: "#0a1520", border: "1px solid #1a2535", borderRadius: 12, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>

            {/* Modal Header */}
            <div style={{ background: "#6c63ff", padding: "14px 18px", borderRadius: "12px 12px 0 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>⚙️ Profile Settings</span>
              <button onClick={() => setSettingsOpen(false)} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 6, width: 28, height: 28, color: "#fff", fontSize: 16, cursor: "pointer" }}>✕</button>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid #1a2535", background: "#080e18" }}>
              {([
                { key: "profile", label: "👤 Profile" },
                { key: "username", label: "✏️ Username" },
                { key: "music", label: "🎵 Music" },
                { key: "account", label: "🔐 Account" },
              ] as { key: SettingsTab; label: string }[]).map(tab => (
                <button key={tab.key} onClick={() => setSettingsTab(tab.key)} style={{
                  flex: 1, padding: "12px 6px", background: settingsTab === tab.key ? "#0a1520" : "transparent",
                  border: "none", borderBottom: settingsTab === tab.key ? "2px solid #6c63ff" : "2px solid transparent",
                  color: settingsTab === tab.key ? "#fff" : "#4a7a94", fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}>
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ padding: 20 }}>

              {/* PROFILE TAB */}
              {settingsTab === "profile" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <Field label="BIO">
                    <textarea value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Tell others about yourself..." rows={3} style={textareaStyle} />
                  </Field>
                  <Field label="SIGNATURE">
                    <textarea value={editSignature} onChange={e => setEditSignature(e.target.value)} placeholder="Your forum signature..." rows={3} style={textareaStyle} />
                  </Field>
                  <Field label="DISCORD ID">
                    <input value={editDiscord} onChange={e => setEditDiscord(e.target.value)} placeholder="username#0000" style={inputStyle} />
                  </Field>
                  <Field label="TELEGRAM ID">
                    <input value={editTelegram} onChange={e => setEditTelegram(e.target.value)} placeholder="@username" style={inputStyle} />
                  </Field>
                  <Field label="DATE OF BIRTH">
                    <input type="date" value={editDob} onChange={e => setEditDob(e.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="AVATAR">
                    <button onClick={() => avatarInputRef.current?.click()} style={{ background: "#0d2030", border: "1px solid #1a2535", borderRadius: 6, padding: "9px 16px", color: "#00b4d8", fontSize: 13, cursor: "pointer" }}>
                      {uploadingAvatar ? "Uploading..." : "📷 Change Avatar"}
                    </button>
                  </Field>
                  <Field label="COVER PHOTO">
                    <button onClick={() => coverInputRef.current?.click()} style={{ background: "#0d2030", border: "1px solid #1a2535", borderRadius: 6, padding: "9px 16px", color: "#00b4d8", fontSize: 13, cursor: "pointer" }}>
                      {uploadingCover ? "Uploading..." : "🖼️ Change Cover"}
                    </button>
                  </Field>
                  {saveMsg && <div style={{ fontSize: 12, color: saveMsg.includes("❌") ? "#ef4444" : "#22c55e" }}>{saveMsg}</div>}
                  <button onClick={handleSaveProfile} disabled={saving} style={{ background: "#6c63ff", border: "none", borderRadius: 8, padding: "12px 0", color: "#fff", fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}>
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}

              {/* USERNAME TAB */}
              {settingsTab === "username" && (
                <div>
                  {!isSubscriber ? (
                    <div style={{ background: "#1a0a00", border: "1px solid #f59e0b33", borderRadius: 8, padding: 16, textAlign: "center" }}>
                      <div style={{ fontSize: 32, marginBottom: 10 }}>🔒</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#f59e0b", marginBottom: 8 }}>Subscription Required</div>
                      <div style={{ fontSize: 13, color: "#9a9ca3", marginBottom: 16 }}>
                        Username changes are only available for VIP, VIP+, and Lifetime subscribers. You can change your username up to 3 times per month, pending admin approval.
                      </div>
                      <Link href="/upgrade" style={{ background: "#f59e0b", color: "#000", padding: "10px 24px", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 13 }}>
                        Upgrade Now →
                      </Link>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      <div style={{ background: "#050a0f", border: "1px solid #1a2535", borderRadius: 8, padding: 12, fontSize: 12, color: "#6a8a9a" }}>
                        ℹ️ Current username: <strong style={{ color: "#c8dde8" }}>{profile.username}</strong><br />
                        You can request up to <strong style={{ color: "#f59e0b" }}>3 changes per month</strong>. Admin will review and approve your request.
                      </div>

                      <Field label="NEW USERNAME">
                        <input value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="Enter desired username..." style={inputStyle} maxLength={20} />
                      </Field>

                      {usernameMsg && (
                        <div style={{ fontSize: 12, color: usernameMsg.includes("❌") ? "#ef4444" : "#22c55e", padding: "8px 12px", background: usernameMsg.includes("❌") ? "#ef444415" : "#22c55e15", borderRadius: 6 }}>
                          {usernameMsg}
                        </div>
                      )}

                      <button onClick={handleUsernameRequest} style={{ background: "#6c63ff", border: "none", borderRadius: 8, padding: "12px 0", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                        Submit Change Request
                      </button>

                      {usernameRequests.length > 0 && (
                        <div style={{ marginTop: 8 }}>
                          <div style={{ fontSize: 11, color: "#4a7a94", fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>YOUR REQUESTS</div>
                          {usernameRequests.map((r: any) => (
                            <div key={r.id} style={{ background: "#050a0f", border: "1px solid #1a2535", borderRadius: 6, padding: "10px 12px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div>
                                <div style={{ fontSize: 13, color: "#c8dde8" }}>{r.current_username} → <strong>{r.requested_username}</strong></div>
                                <div style={{ fontSize: 11, color: "#4a7a94" }}>{new Date(r.created_at).toLocaleDateString()}</div>
                              </div>
                              <span style={{
                                fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 4,
                                background: r.status === "approved" ? "#22c55e22" : r.status === "rejected" ? "#ef444422" : "#f59e0b22",
                                color: r.status === "approved" ? "#22c55e" : r.status === "rejected" ? "#ef4444" : "#f59e0b",
                              }}>
                                {r.status.toUpperCase()}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* MUSIC TAB */}
              {settingsTab === "music" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ background: "#050a0f", border: "1px solid #1a2535", borderRadius: 8, padding: 12, fontSize: 12, color: "#6a8a9a" }}>
                    🎵 Add a music URL (MP3, OGG, or any direct audio link) that plays on your profile. Visitors can play/pause it from a floating player.
                  </div>

                  <Field label="MUSIC URL (direct MP3/OGG link)">
                    <input value={musicUrl} onChange={e => setMusicUrl(e.target.value)} placeholder="https://example.com/song.mp3" style={inputStyle} />
                  </Field>

                  <Field label="SONG TITLE">
                    <input value={musicTitle} onChange={e => setMusicTitle(e.target.value)} placeholder="e.g. My Favorite Song" style={inputStyle} />
                  </Field>

                  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                    <div onClick={() => setMusicAutoplay(v => !v)} style={{
                      width: 18, height: 18, borderRadius: 4,
                      border: `1.5px solid ${musicAutoplay ? "#a855f7" : "#4a7a94"}`,
                      background: musicAutoplay ? "#a855f7" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
                    }}>
                      {musicAutoplay && <span style={{ color: "#fff", fontSize: 12 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 13, color: "#c8dde8" }}>Autoplay when someone visits my profile</span>
                  </label>

                  {saveMsg && <div style={{ fontSize: 12, color: saveMsg.includes("❌") ? "#ef4444" : "#22c55e" }}>{saveMsg}</div>}

                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={handleSaveMusic} disabled={saving} style={{ flex: 1, background: "#a855f7", border: "none", borderRadius: 8, padding: "12px 0", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
                      {saving ? "Saving..." : "🎵 Save Music"}
                    </button>
                    {music && (
                      <button onClick={handleRemoveMusic} style={{ background: "#1a2535", border: "1px solid #2a3545", borderRadius: 8, padding: "12px 16px", color: "#ef4444", fontSize: 13, cursor: "pointer" }}>
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ACCOUNT TAB */}
              {settingsTab === "account" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ background: "#050a0f", border: "1px solid #1a2535", borderRadius: 8, padding: 14 }}>
                    <div style={{ fontSize: 13, color: "#9a9ca3", marginBottom: 4 }}>Username</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#e7e7e7" }}>{profile.username}</div>
                  </div>
                  <div style={{ background: "#050a0f", border: "1px solid #1a2535", borderRadius: 8, padding: 14 }}>
                    <div style={{ fontSize: 13, color: "#9a9ca3", marginBottom: 4 }}>Account Role</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: badge.color }}>{badge.icon} {badge.label}</div>
                  </div>
                  <div style={{ background: "#050a0f", border: "1px solid #1a2535", borderRadius: 8, padding: 14 }}>
                    <div style={{ fontSize: 13, color: "#9a9ca3", marginBottom: 4 }}>Member Since</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#e7e7e7" }}>{formatDate(profile.join_date)}</div>
                  </div>
                  {!isSubscriber && (
                    <Link href="/upgrade" style={{ display: "block", textAlign: "center", background: "linear-gradient(135deg, #6c63ff, #a855f7)", color: "#fff", padding: "12px", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
                      ⭐ Upgrade to Premium
                    </Link>
                  )}
                  <button onClick={handleLogout} style={{ background: "#1a0000", border: "1px solid #ef444430", borderRadius: 8, padding: "12px 0", color: "#ef4444", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 860px) { .profile-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      <Footer />
    </div>
  );
}

function BoxHeader({ title, color }: { title: string; color: string }) {
  return <div style={{ background: color, borderRadius: "8px 8px 0 0", padding: "8px 14px", fontSize: 13, fontWeight: 700, color: "#fff" }}>{title}</div>;
}

function BoxBody({ children }: { children: React.ReactNode }) {
  return <div style={{ background: "#0a1520", border: "1px solid #1a2535", borderTop: "none", borderRadius: "0 0 8px 8px", padding: "14px 16px" }}>{children}</div>;
}

function InfoRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "6px 0", borderBottom: "1px solid #0d1c28", fontSize: 12.5 }}>
      <span style={{ color: "#6a8a9a" }}>{label}</span>
      <span style={{ color: valueColor || "#c8dde8", fontWeight: 600, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function StatRow({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
      <span>{icon}</span>
      <span style={{ color: "#6a8a9a", flex: 1 }}>{label}</span>
      <span style={{ color: "#fff", fontWeight: 700 }}>{value}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "#4a7a94", fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#050a0f", border: "1px solid #1a2535",
  borderRadius: 6, padding: "10px 14px", color: "#c8dde8",
  fontSize: 13, outline: "none", boxSizing: "border-box",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle, resize: "vertical", fontFamily: "Inter, sans-serif",
};