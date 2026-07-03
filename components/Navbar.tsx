"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const NAV_LINKS = [
  {
    label: "Home",
    href: "/",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>,
  },
  {
    label: "Upgrade",
    href: "/upgrade",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 11 12 6 7 11"/><polyline points="17 18 12 13 7 18"/></svg>,
  },
  {
    label: "Credits",
    href: "/no-permission",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  },
  {
    label: "Search",
    href: "/no-permission",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  },
  {
    label: "Vouches",
    href: "/vouches",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  },
  {
    label: "Awards",
    href: "/no-permission",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>,
  },
  {
    label: "Telegram",
    href: "https://t.me/mrcombo",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.012 9.483c-.148.658-.537.818-1.088.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.879.738z"/></svg>,
  },
  {
    label: "Extras",
    href: "#",
    hasDropdown: true,
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="9" height="9" rx="1"/><rect x="13" y="2" width="9" height="9" rx="1"/><rect x="2" y="13" width="9" height="9" rx="1"/><rect x="13" y="13" width="9" height="9" rx="1"/></svg>,
    dropdown: [
      { label: "Features", href: "/no-permission" },
      { label: "Changelogs", href: "/no-permission" },
      { label: "Help", href: "/help" },
    ],
  },
];

export default function Navbar() {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [role, setRole] = useState("member");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [extrasOpen, setExtrasOpen] = useState(false);
  const [desktopExtrasOpen, setDesktopExtrasOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const desktopExtrasRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!sidebarOpen) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest("#sidebar") && !t.closest("#hamburger")) setSidebarOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [sidebarOpen]);

  useEffect(() => {
    if (!desktopExtrasOpen) return;
    const handler = (e: MouseEvent) => {
      if (desktopExtrasRef.current && !desktopExtrasRef.current.contains(e.target as Node)) {
        setDesktopExtrasOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [desktopExtrasOpen]);

  useEffect(() => {
    if (!profileMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [profileMenuOpen]);

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("username, avatar_url, role")
          .eq("id", user.id)
          .single();

        if (data) {
          setUsername(data.username);
          setAvatarUrl(data.avatar_url || "");
          setRole(data.role || "member");
        }
      }
    };

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        const { data } = await supabase
          .from("profiles")
          .select("username, avatar_url, role")
          .eq("id", session.user.id)
          .single();

        if (data) {
          setUsername(data.username);
          setAvatarUrl(data.avatar_url || "");
          setRole(data.role || "member");
        }
      } else {
        setUsername("");
        setAvatarUrl("");
        setRole("member");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700&family=Rajdhani:wght@700&family=Inter:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{
          --bg:#050a0f;--bg2:#060c12;--surface:#0a1520;
          --border:#0d2030;--accent:#00b4d8;--accent2:#0077b6;
          --text:#c8dde8;--muted:#4a7a94;--purple:#6c63ff;
        }
        body{background:var(--bg);color:var(--text);font-family:'Inter',sans-serif;min-height:100vh}

        /* NAVBAR */
        .nav{position:fixed;top:0;left:0;right:0;z-index:100;height:64px;
          display:flex;align-items:center;padding:0 16px;gap:10px;
          background:${scrolled ? "rgba(5,10,15,0.97)" : "var(--bg)"};
          border-bottom:1px solid var(--border);
          backdrop-filter:${scrolled ? "blur(12px)" : "none"};
          transition:background .3s, height .3s;}
        .hamburger{display:flex;flex-direction:column;justify-content:center;gap:5px;
          width:40px;height:40px;cursor:pointer;background:none;border:none;
          padding:8px;border-radius:8px;transition:background .2s;flex-shrink:0;}
        .hamburger:hover{background:var(--surface)}
        .hamburger span{display:block;height:2px;background:var(--text);border-radius:2px;transition:all .3s;width:100%}
        .hamburger.open span:nth-child(1){transform:translateY(7px) rotate(45deg)}
        .hamburger.open span:nth-child(2){opacity:0;transform:scaleX(0)}
        .hamburger.open span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}
        .nav-logo{display:flex;align-items:center;text-decoration:none;flex-shrink:0}
        .nav-logo img{height:40px;width:auto;object-fit:contain;mix-blend-mode:lighten;transition:height .3s}
        .nav-actions{display:flex;gap:10px;align-items:center;margin-left:auto;flex-shrink:0;padding-left:14px}

        /* PROFILE DROPDOWN */
        .profile-menu-wrap{position:relative}
        .profile-trigger{width:40px;height:40px;border-radius:50%;background:var(--surface);
          border:1px solid var(--border);display:flex;align-items:center;justify-content:center;
          color:#fff;cursor:pointer;overflow:hidden;padding:0;transition:border-color .2s}
        .profile-trigger:hover{border-color:var(--accent)}
        .profile-trigger img{width:100%;height:100%;object-fit:cover}
        .profile-dropdown{position:absolute;top:calc(100% + 10px);right:0;width:290px;
          background:var(--bg2);border:1px solid var(--border);border-radius:12px;
          box-shadow:0 16px 40px rgba(0,0,0,.55);overflow:hidden;z-index:700;}
        .profile-dropdown-header{display:flex;gap:12px;align-items:flex-start;padding:16px;
          border-bottom:1px solid var(--border)}
        .profile-dropdown-avatar{width:46px;height:46px;border-radius:10px;flex-shrink:0;
          background:var(--surface);border:1px solid var(--border);overflow:hidden;
          display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;color:var(--accent)}
        .profile-dropdown-avatar img{width:100%;height:100%;object-fit:cover}
        .profile-dropdown-minilink{font-size:11.5px;color:var(--accent);text-decoration:none}
        .profile-dropdown-minilink:hover{text-decoration:underline}
        .profile-dropdown-section{padding:10px 16px;border-bottom:1px solid var(--border)}
        .profile-dropdown-label{font-size:10px;font-weight:700;letter-spacing:1.5px;
          color:var(--muted);text-transform:uppercase;margin-bottom:8px}
        .profile-dropdown-grid{display:grid;grid-template-columns:1fr 1fr;gap:4px}
        .profile-dropdown-item{display:flex;align-items:center;gap:7px;padding:8px 9px;
          border-radius:7px;color:var(--text);font-size:12.5px;font-weight:500;
          text-decoration:none;transition:background .15s;}
        .profile-dropdown-item:hover{background:var(--surface)}
        .profile-dropdown-item svg{opacity:.7;flex-shrink:0}
        .profile-dropdown-item.full{grid-column:1 / -1}
        .profile-dropdown-logout{display:flex;align-items:center;justify-content:center;gap:8px;
          width:100%;background:linear-gradient(135deg,var(--accent2),var(--accent));border:none;
          padding:13px 0;color:#fff;font-size:13px;font-weight:700;cursor:pointer;transition:opacity .2s}
        .profile-dropdown-logout:hover{opacity:.9}
        .btn-login{display:flex;align-items:center;gap:6px;padding:8px 16px;
          background:var(--surface);border:1px solid var(--border);border-radius:8px;
          color:var(--text);font-size:13px;font-weight:500;cursor:pointer;
          transition:all .2s;white-space:nowrap;text-decoration:none;}
        .btn-login:hover{border-color:var(--accent);color:var(--accent)}
        .btn-create{display:flex;align-items:center;gap:6px;padding:8px 16px;
          background:linear-gradient(135deg,var(--accent2),var(--accent));
          border:none;border-radius:8px;color:#fff;font-size:13px;font-weight:600;
          cursor:pointer;transition:opacity .2s;white-space:nowrap;text-decoration:none;}
        .btn-create:hover{opacity:.88}

        /* DESKTOP HORIZONTAL NAV */
        .desktop-nav{display:none;align-items:center;gap:2px;flex:1;min-width:0;
          overflow-x:auto;scrollbar-width:none;-ms-overflow-style:none;}
        .desktop-nav::-webkit-scrollbar{display:none}
        .desktop-link{display:flex;align-items:center;gap:7px;padding:9px 12px;border-radius:8px;
          color:var(--muted);font-size:13px;font-weight:600;text-decoration:none;white-space:nowrap;
          position:relative;transition:all .2s;background:none;border:none;cursor:pointer;flex-shrink:0;}
        .desktop-link:hover{background:var(--surface);color:#fff}
        .desktop-link svg{opacity:.75;flex-shrink:0}
        .desktop-link:hover svg{opacity:1}
        .desktop-link .link-text{display:none}
        .desktop-link .arrow{width:12px;height:12px;opacity:.6;transition:transform .2s;flex-shrink:0}
        .desktop-link .arrow.open{transform:rotate(180deg)}
        .desktop-dropdown{position:absolute;top:calc(100% + 8px);left:0;background:var(--bg2);
          border:1px solid var(--border);border-radius:8px;min-width:170px;padding:6px;
          display:flex;flex-direction:column;gap:2px;box-shadow:0 12px 28px rgba(0,0,0,.5);z-index:600;}
        .desktop-dropdown a{padding:8px 12px;border-radius:6px;color:var(--muted);font-size:13px;
          text-decoration:none;transition:all .2s;}
        .desktop-dropdown a:hover{background:var(--surface);color:#fff}

        @media(min-width:1024px){
          .nav{height:72px;padding:0 20px;gap:6px;}
          .hamburger{display:none}
          .nav-logo img{height:46px}
          .desktop-nav{display:flex}
        }
        @media(min-width:1280px){
          .nav{padding:0 32px;gap:10px;}
          .nav-logo img{height:52px}
          .desktop-link{padding:9px 14px;gap:8px}
          .desktop-link .link-text{display:inline}
        }

        /* HERO — attached directly below fixed navbar, appears on every page */
        .navbar-hero{width:100%;margin-top:64px;position:relative;display:flex;flex-direction:column;
          align-items:center;justify-content:center;padding:26px 16px 18px;text-align:center;overflow:hidden;
          background:radial-gradient(ellipse 70% 100% at 50% 0%, rgba(0,180,216,0.08) 0%, transparent 70%);
          border-bottom:1px solid #0a1520;}
        .navbar-hero img{height:100px;width:auto;object-fit:contain;mix-blend-mode:lighten;
          filter:drop-shadow(0 0 28px rgba(0,180,216,.4));}
        .navbar-hero-tag{font-family:'Rajdhani',sans-serif;font-weight:700;font-size:11px;letter-spacing:3px;
          color:#7fd8ec;text-transform:uppercase;margin-top:-2px;text-shadow:0 0 14px rgba(0,180,216,.4);}
        @media(min-width:1024px){
          .navbar-hero{margin-top:72px;padding:52px 24px 36px;
            background:
              radial-gradient(ellipse 55% 100% at 25% 15%, rgba(108,99,255,.16) 0%, transparent 65%),
              radial-gradient(ellipse 50% 90% at 75% 55%, rgba(0,180,216,.14) 0%, transparent 70%),
              linear-gradient(180deg,#0a0718 0%,#050a0f 100%);}
          .navbar-hero img{height:180px}
          .navbar-hero-tag{font-size:16px;letter-spacing:5px}
        }

        /* OVERLAY */
        .overlay{position:fixed;inset:0;z-index:150;background:rgba(0,0,0,.65);
          backdrop-filter:blur(3px);opacity:0;pointer-events:none;transition:opacity .3s}
        .overlay.open{opacity:1;pointer-events:all}

        /* SIDEBAR (mobile) */
        .sidebar{position:fixed;top:0;left:0;z-index:200;width:270px;height:100vh;
          background:var(--bg2);border-right:1px solid var(--border);
          display:flex;flex-direction:column;padding:0;
          transform:translateX(-100%);
          transition:transform .32s cubic-bezier(.4,0,.2,1);overflow-y:auto}
        .sidebar.open{transform:translateX(0)}
        .sidebar-header{display:flex;align-items:center;padding:16px 20px;
          border-bottom:1px solid var(--border);}
        .sidebar-logo{flex:1;display:flex;align-items:center}
        .sidebar-logo img{height:44px;width:auto;object-fit:contain;mix-blend-mode:lighten}
        .sidebar-close{width:32px;height:32px;background:var(--surface);
          border:1px solid var(--border);border-radius:6px;cursor:pointer;
          display:flex;align-items:center;justify-content:center;
          color:var(--muted);transition:all .2s;flex-shrink:0}
        .sidebar-close:hover{color:#fff;background:#0d1e2e}
        .sidebar-nav{display:flex;flex-direction:column;gap:2px;padding:12px}
        .nav-link{display:flex;align-items:center;gap:12px;padding:11px 14px;
          border-radius:8px;color:var(--muted);font-size:14px;font-weight:500;
          cursor:pointer;text-decoration:none;transition:all .2s;
          border:none;background:none;width:100%;text-align:left;position:relative}
        .nav-link:hover{background:var(--surface);color:var(--text)}
        .nav-link.active{background:linear-gradient(135deg,var(--accent2),var(--accent));color:#fff}
        .nav-link svg{opacity:.7;flex-shrink:0}
        .nav-link.active svg{opacity:1}
        .nav-link-label{flex:1}
        .dropdown-arrow{width:16px;height:16px;opacity:.5;transition:transform .2s}
        .dropdown-arrow.open{transform:rotate(180deg)}
        .dropdown-menu{display:flex;flex-direction:column;gap:1px;
          padding:4px 0 4px 44px;}
        .dropdown-item{display:flex;align-items:center;padding:8px 14px;
          border-radius:6px;color:var(--muted);font-size:13px;
          text-decoration:none;transition:all .2s}
        .dropdown-item:hover{background:var(--surface);color:var(--text)}

        @media(max-width:480px){
          .btn-login{padding:7px 10px;font-size:12px}
          .btn-create{padding:7px 10px;font-size:12px}
        }
      `}</style>

      {/* TOP NAVBAR (fixed) */}
      <nav className="nav">
        <button id="hamburger" className={`hamburger ${sidebarOpen ? "open" : ""}`}
          onClick={() => setSidebarOpen(v => !v)} aria-label="Menu">
          <span/><span/><span/>
        </button>

        <Link href="/" className="nav-logo">
          <img src="/logo.png" alt="MRCombo"/>
        </Link>

        {/* DESKTOP HORIZONTAL LINKS */}
        <div className="desktop-nav" ref={desktopExtrasRef}>
          {NAV_LINKS.map(link => (
            link.hasDropdown ? (
              <div key={link.label} style={{ position: "relative" }}>
                <button className="desktop-link" onClick={() => setDesktopExtrasOpen(v => !v)}>
                  {link.icon}
                  <span className="link-text">{link.label}</span>
                  <svg className={`arrow ${desktopExtrasOpen ? "open" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {desktopExtrasOpen && (
                  <div className="desktop-dropdown">
                    {link.dropdown?.map(item => (
                      <Link key={item.label} href={item.href} onClick={() => setDesktopExtrasOpen(false)}>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link key={link.label} href={link.href} className="desktop-link" title={link.label}>
                {link.icon}
                <span className="link-text">{link.label}</span>
              </Link>
            )
          ))}
        </div>

        <div className="nav-actions">
          {!user ? (
            <>
              <Link href="/login" className="btn-login">
                Login
              </Link>

              <Link href="/createaccount" className="btn-create">
                Create Account
              </Link>
            </>
          ) : (
            <div className="profile-menu-wrap" ref={profileMenuRef}>
              <button
                onClick={() => setProfileMenuOpen(v => !v)}
                className="profile-trigger"
                aria-label="Account menu"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={username} />
                ) : (
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21a8 8 0 0 0-16 0" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                )}
              </button>

              {profileMenuOpen && (
                <div className="profile-dropdown">
                  {/* Mini profile card */}
                  <div className="profile-dropdown-header">
                    <div className="profile-dropdown-avatar">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={username} />
                      ) : (
                        (username || "?").slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {username}
                      </div>
                      <div style={{ fontSize: 11.5, color: "#7fa8bb", textTransform: "capitalize" }}>{role}</div>
                      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                        <Link href={`/profile/${username}`} className="profile-dropdown-minilink" onClick={() => setProfileMenuOpen(false)}>
                          View Profile
                        </Link>
                        <Link href="/settings" className="profile-dropdown-minilink" onClick={() => setProfileMenuOpen(false)}>
                          Control Panel
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="profile-dropdown-section">
                    <div className="profile-dropdown-label">User Settings</div>
                    <div className="profile-dropdown-grid">
                      <Link href="/profile" className="profile-dropdown-item" onClick={() => setProfileMenuOpen(false)}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>
                        Edit Profile
                      </Link>
                      <Link href="/profile" className="profile-dropdown-item" onClick={() => setProfileMenuOpen(false)}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 17l6-6 4 4 8-8"/></svg>
                        Change Signature
                      </Link>
                      <Link href="/settings" className="profile-dropdown-item" onClick={() => setProfileMenuOpen(false)}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        Change Password
                      </Link>
                      <Link href="/settings" className="profile-dropdown-item" onClick={() => setProfileMenuOpen(false)}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>
                        Change E-Mail
                      </Link>
                    </div>
                  </div>

                  <div className="profile-dropdown-section">
                    <div className="profile-dropdown-label">Preferences</div>
                    <Link href="/settings" className="profile-dropdown-item full" onClick={() => setProfileMenuOpen(false)}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                      Options
                    </Link>
                  </div>

                  <button onClick={handleLogout} className="profile-dropdown-logout">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* HERO LOGO — attached directly below navbar, shows on every page, mobile + desktop */}
      <div className="navbar-hero">
        <img src="/logo.png" alt="MRCombo" />
        <div className="navbar-hero-tag">Defying Every Limit</div>
      </div>

      {/* OVERLAY */}
      <div className={`overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)}/>

      {/* SIDEBAR (mobile only) */}
      <aside id="sidebar" className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <span className="sidebar-logo">
            <img src="/logo.png" alt="MRCombo"/>
          </span>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_LINKS.map(link => (
            <div key={link.label}>
              {link.hasDropdown ? (
                <>
                  <button
                    className="nav-link"
                    onClick={() => setExtrasOpen(v => !v)}
                  >
                    {link.icon}
                    <span className="nav-link-label">{link.label}</span>
                    <svg className={`dropdown-arrow ${extrasOpen ? "open" : ""}`}
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                  {extrasOpen && (
                    <div className="dropdown-menu">
                      {link.dropdown?.map(item => (
                        <Link key={item.label} href={item.href}
                          className="dropdown-item"
                          onClick={() => setSidebarOpen(false)}>
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={link.href}
                  className="nav-link"
                  onClick={() => setSidebarOpen(false)}
                >
                  {link.icon}
                  <span className="nav-link-label">{link.label}</span>
                </Link>
              )}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}