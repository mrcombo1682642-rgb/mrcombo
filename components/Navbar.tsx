"use client";

import { useState, useEffect } from "react";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [extrasOpen, setExtrasOpen] = useState(false);

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
  const loadUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user);

    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

      if (data) {
        setUsername(data.username);
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
        .select("username")
        .eq("id", session.user.id)
        .single();

      if (data) {
        setUsername(data.username);
      }
    } else {
      setUsername("");
    }
  });

  return () => subscription.unsubscribe();
}, []);
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700&family=Inter:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{
          --bg:#050a0f;--bg2:#060c12;--surface:#0a1520;
          --border:#0d2030;--accent:#00b4d8;--accent2:#0077b6;
          --text:#c8dde8;--muted:#4a7a94;--purple:#6c63ff;
        }
        body{background:var(--bg);color:var(--text);font-family:'Inter',sans-serif;min-height:100vh}

        /* NAVBAR */
        .nav{position:fixed;top:0;left:0;right:0;z-index:100;height:64px;
          display:flex;align-items:center;padding:0 16px;gap:12px;
          background:${scrolled?"rgba(5,10,15,0.97)":"var(--bg)"};
          border-bottom:1px solid var(--border);
          backdrop-filter:${scrolled?"blur(12px)":"none"};
          transition:background .3s;}
        .hamburger{display:flex;flex-direction:column;justify-content:center;gap:5px;
          width:40px;height:40px;cursor:pointer;background:none;border:none;
          padding:8px;border-radius:8px;transition:background .2s;flex-shrink:0;}
        .hamburger:hover{background:var(--surface)}
        .hamburger span{display:block;height:2px;background:var(--text);border-radius:2px;transition:all .3s;width:100%}
        .hamburger.open span:nth-child(1){transform:translateY(7px) rotate(45deg)}
        .hamburger.open span:nth-child(2){opacity:0;transform:scaleX(0)}
        .hamburger.open span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}
        .nav-logo{flex:1;display:flex;align-items:center;text-decoration:none}
        .nav-logo img{height:46px;width:auto;object-fit:contain;mix-blend-mode:lighten}
        .nav-actions{display:flex;gap:8px;align-items:center}
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

        /* OVERLAY */
        .overlay{position:fixed;inset:0;z-index:150;background:rgba(0,0,0,.65);
          backdrop-filter:blur(3px);opacity:0;pointer-events:none;transition:opacity .3s}
        .overlay.open{opacity:1;pointer-events:all}

        /* SIDEBAR */
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

      {/* TOP NAVBAR */}
      <nav className="nav">
        <button id="hamburger" className={`hamburger ${sidebarOpen?"open":""}`}
          onClick={() => setSidebarOpen(v => !v)} aria-label="Menu">
          <span/><span/><span/>
        </button>

        <Link href="/" className="nav-logo">
          <img src="/logo.png" alt="MRCombo"/>
        </Link>

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
    <>

      <Link
  href="/profile"
  style={{
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "#0a1520",
    border: "1px solid #0d2030",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    textDecoration: "none",
  }}
>
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M20 21a8 8 0 0 0-16 0" />
    <circle cx="12" cy="7" r="4" />
  </svg>
</Link>

      <button
        onClick={handleLogout}
        className="btn-login"
        style={{ cursor: "pointer" }}
      >
        Logout
      </button>
    </>
  )}
</div>
      </nav>

      {/* OVERLAY */}
      <div className={`overlay ${sidebarOpen?"open":""}`} onClick={() => setSidebarOpen(false)}/>

      {/* SIDEBAR */}
      <aside id="sidebar" className={`sidebar ${sidebarOpen?"open":""}`}>
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
                    <svg className={`dropdown-arrow ${extrasOpen?"open":""}`}
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