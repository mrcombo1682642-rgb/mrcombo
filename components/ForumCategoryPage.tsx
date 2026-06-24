"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footbar";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ── Category Data ─────────────────────────────────────────────
const CATEGORY_DATA: Record<string, {
  title: string;
  icon: string;
  color: string;
  sections: Array<{
    name: string;
    items: Array<{
      icon: string;
      title: string;
      desc?: string;
      subfolders?: string[];
      href: string;
    }>;
  }>;
}> = {
  cracking: {
    title: "Cracking", icon: "⚙️", color: "#6c63ff",
    sections: [{
      name: "Cracking",
      items: [
        { icon: "🧰", title: "Cracking Tools", desc: "This section includes account checkers, dorks, SQL tools, and utilities for data scraping and automated pentesting.", href: "/forum/cracking/tools", subfolders: [] },
        { icon: "🖥️", title: "Cracking Tutorials", desc: "This section contains tutorials on cracking, configs, data scraping, and more.", href: "/forum/cracking/tutorials", subfolders: [] },
        { icon: "📄", title: "Configs", desc: "You can find configs for all kind of tools here to perform web requests for scraping, parsing data or pentesting.", href: "/forum/cracking/configs", subfolders: ["OpenBullet", "OpenBullet 2", "Silverbullet", "Sentry MBA", "BlackBullet", "Storm"] },
        { icon: "🔗", title: "Proxies", desc: "Access proxies for rate limit issues or your privacy.", href: "/forum/cracking/proxies", subfolders: [] },
        { icon: "📁", title: "Combolist", desc: "Combolists can be posted and found in this section.", href: "/forum/cracking/combolist", subfolders: [] },
      ],
    }],
  },
  leaks: {
    title: "Leaks", icon: "💧", color: "#6c63ff",
    sections: [{
      name: "Leaks",
      items: [
        { icon: "🔧", title: "Cracked Programs", desc: "Cracked programs can be found here.", href: "/forum/leaks/programs", subfolders: [] },
        { icon: "👤", title: "Accounts", desc: "Any other logins, serials etc. owned by you should go here.", href: "/forum/leaks/accounts", subfolders: ["Fooding", "Gaming", "Porn", "Shopping", "Streaming", "VPN"] },
        { icon: "📱", title: "Mobile Apps", desc: "", href: "/forum/leaks/mobile", subfolders: ["Android", "iOS"] },
        { icon: "📚", title: "Tutorials, Guides, Ebooks, etc.", desc: "All leaks regarding this subject goes here.", href: "/forum/leaks/tutorials", subfolders: [] },
        { icon: "💻", title: "Source Codes", desc: "", href: "/forum/leaks/sourcecodes", subfolders: [] },
        { icon: "📁", title: "Other Leaks", desc: "Containing other leaks that doesn't fit the categories above.", href: "/forum/leaks/other", subfolders: [] },
        { icon: "🙏", title: "Requests", desc: "Request anything you want to be leaked here.", href: "/forum/leaks/requests", subfolders: [] },
      ],
    }],
  },
  coding: {
    title: "Coding", icon: "💻", color: "#6c63ff",
    sections: [
      {
        name: "Coding",
        items: [
          { icon: "💻", title: ".NET Framework", desc: "Coding help or tutorials pointed towards Visual Basic and C# should go here.", href: "/forum/coding/dotnet", subfolders: [] },
          { icon: "💻", title: "HTML, CSS, JS & PHP", desc: "Forum dedicated to web based languages. Its strength is its simplicity.", href: "/forum/coding/web", subfolders: [] },
          { icon: "💻", title: "C/C++", desc: "A forum for the entire family of C/C++ Coding. Gain help on compiling, objects, classes, and functions.", href: "/forum/coding/cpp", subfolders: [] },
          { icon: "💻", title: "Other languages", desc: "Any languages not covered in other forums should be discussed and posted here.", href: "/forum/coding/other", subfolders: [] },
        ],
      },
      {
        name: "Reverse Engineering",
        items: [
          { icon: "💬", title: "General", desc: "General chat for Reverse Engineering discussion.", href: "/forum/coding/re-general", subfolders: [] },
          { icon: "❓", title: "Reverse Engineering Guides and Tips", desc: "", href: "/forum/coding/re-guides", subfolders: [] },
          { icon: "🔧", title: "Tools", desc: "Reverse Engineering Tools and Resources.", href: "/forum/coding/re-tools", subfolders: [] },
        ],
      },
    ],
  },
  money: {
    title: "Money", icon: "💵", color: "#6c63ff",
    sections: [{
      name: "Money",
      items: [
        { icon: "💲", title: "Monetizing Techniques", desc: "Your place to learn how to make money online. Discuss techniques or post leaked tutorials.", href: "/forum/money/monetizing", subfolders: [] },
        { icon: "👥", title: "Social Engineering", desc: "Discuss everything related to Social Engineering here.", href: "/forum/money/social", subfolders: [] },
        { icon: "💬", title: "E-Whoring", desc: "", href: "/forum/money/ewhoring", subfolders: [] },
        { icon: "🧰", title: "Real life businesses", desc: "", href: "/forum/money/business", subfolders: [] },
        { icon: "₿", title: "Cryptocoins", desc: "Talk about everything crypto related here", href: "/forum/money/crypto", subfolders: [] },
      ],
    }],
  },
  marketplace: {
    title: "Marketplace", icon: "🛒", color: "#6c63ff",
    sections: [{
      name: "Marketplace",
      items: [
        { icon: "🏪", title: "Marketplace Lobby", desc: "Browse here to chat about the market. You can also use this section in case of any scam.", href: "/forum/marketplace/lobby", subfolders: ["Scam reports"] },
        { icon: "🏬", title: "Premium Sellers", desc: "Only members with Premium, Contributor, or higher ranks are allowed to offer their services or products in our marketplace.", href: "/forum/marketplace/premium", subfolders: ["Products", "Services", "Refunding Services", "Accounts", "E-books / Monetizing Guides"] },
        { icon: "🖨️", title: "Buyers bay", desc: "Buyers Bay is for those looking to buy. Explore Services, Accounts, and Hiring to find the best opportunities from sellers.", href: "/forum/marketplace/buyers", subfolders: ["Services", "Accounts", "Hiring"] },
        { icon: "🔄", title: "Trading Station", desc: "Trading Station is dedicated to those looking to exchange goods, services, or forum credits. Connect with others and make trades.", href: "/forum/marketplace/trading", subfolders: [] },
        { icon: "🗄️", title: "Archive", desc: "", href: "/forum/marketplace/archive", subfolders: [] },
      ],
    }],
  },
  premium: {
    title: "Premium", icon: "⭐", color: "#6c63ff",
    sections: [{
      name: "Vip",
      items: [
        { icon: "⭐", title: "VIP General Chat", desc: "Premium accounts area. It is for rank above VIP+.", href: "/forum/premium/general", subfolders: [] },
        { icon: "⭐", title: "VIP Leaks", desc: "Premium leaks area. It is for rank above VIP+.", href: "/forum/premium/leaks", subfolders: [] },
      ],
    }],
  },
  announcements: {
    title: "Announcements", icon: "📢", color: "#6c63ff",
    sections: [{ name: "Announcements", items: [
      { icon: "📢", title: "General Announcements", desc: "Official announcements from staff.", href: "/forum/announcements/general", subfolders: [] },
      { icon: "📌", title: "Important Notices", desc: "Critical notices you should read.", href: "/forum/announcements/notices", subfolders: [] },
    ]}],
  },
  releases: {
    title: "Releases", icon: "📦", color: "#6c63ff",
    sections: [{ name: "Releases", items: [
      { icon: "📦", title: "MRCombo Exclusive Releases", desc: "Cracked programs provided exclusively by MRCombo.", href: "/forum/releases/exclusive", subfolders: [] },
      { icon: "🔓", title: "Public Releases", desc: "Tools and programs released to the public.", href: "/forum/releases/public", subfolders: [] },
    ]}],
  },
  feedback: {
    title: "Feedback & Suggestions", icon: "💬", color: "#6c63ff",
    sections: [{ name: "Feedback", items: [
      { icon: "💡", title: "Suggestions", desc: "Post your suggestions to improve the forum.", href: "/forum/feedback/suggestions", subfolders: [] },
      { icon: "🐛", title: "Bug Reports", desc: "Report any bugs or issues you find.", href: "/forum/feedback/bugs", subfolders: [] },
    ]}],
  },
  support: {
    title: "Support & Bugs", icon: "🛟", color: "#6c63ff",
    sections: [{ name: "Support", items: [
      { icon: "✅", title: "Answered", desc: "Resolved support tickets.", href: "/forum/support/answered", subfolders: [] },
      { icon: "🔨", title: "Ban Appeal", desc: "Appeal your ban here.", href: "/forum/support/ban-appeal", subfolders: [] },
      { icon: "🔑", title: "Account Recovery", desc: "Recover your account.", href: "/forum/support/recovery", subfolders: [] },
    ]}],
  },
  lounge: {
    title: "The Lounge", icon: "🛋️", color: "#6c63ff",
    sections: [{ name: "The Lounge", items: [
      { icon: "👋", title: "Introductions", desc: "Introduce yourself to the community.", href: "/forum/lounge/introductions", subfolders: [] },
      { icon: "👑", title: "HQ Lounge", desc: "High quality discussions.", href: "/forum/lounge/hq", subfolders: [] },
    ]}],
  },
  crypto: {
    title: "Crypto Currencies", icon: "₿", color: "#6c63ff",
    sections: [{ name: "Crypto", items: [
      { icon: "₿", title: "Bitcoin", desc: "Bitcoin discussions.", href: "/forum/crypto/bitcoin", subfolders: [] },
      { icon: "💎", title: "Ethereum", desc: "Ethereum and ERC20 tokens.", href: "/forum/crypto/ethereum", subfolders: [] },
      { icon: "Ł", title: "Litecoin", desc: "Litecoin discussions.", href: "/forum/crypto/litecoin", subfolders: [] },
      { icon: "🪙", title: "Other Coins", desc: "All other crypto discussions.", href: "/forum/crypto/other", subfolders: [] },
    ]}],
  },
  entertainment: {
    title: "Entertainment", icon: "🎬", color: "#6c63ff",
    sections: [{ name: "Entertainment", items: [
      { icon: "🎵", title: "Music", desc: "Share and discuss music.", href: "/forum/entertainment/music", subfolders: [] },
      { icon: "🎬", title: "Movies / Series", desc: "Discuss your favorite movies and series.", href: "/forum/entertainment/movies", subfolders: [] },
      { icon: "🎮", title: "Games", desc: "Gaming entertainment discussions.", href: "/forum/entertainment/games", subfolders: [] },
    ]}],
  },
  personal: {
    title: "Personal Life", icon: "👤", color: "#6c63ff",
    sections: [{ name: "Personal Life", items: [
      { icon: "👤", title: "Personal Discussions", desc: "Talk about your personal life.", href: "/forum/personal/general", subfolders: [] },
      { icon: "❤️", title: "Relationships", desc: "Discuss relationships and social life.", href: "/forum/personal/relationships", subfolders: [] },
    ]}],
  },
  achievements: {
    title: "Achievements & Bragging", icon: "🏆", color: "#6c63ff",
    sections: [{ name: "Achievements", items: [
      { icon: "🏆", title: "Showcase", desc: "Show off your achievements.", href: "/forum/achievements/showcase", subfolders: [] },
    ]}],
  },
  gaming: {
    title: "Gaming", icon: "🎮", color: "#6c63ff",
    sections: [{ name: "Gaming", items: [
      { icon: "🎮", title: "League of Legends", desc: "", href: "/forum/gaming/lol", subfolders: [] },
      { icon: "🎮", title: "Fortnite", desc: "", href: "/forum/gaming/fortnite", subfolders: [] },
      { icon: "🎮", title: "FPS Games", desc: "", href: "/forum/gaming/fps", subfolders: [] },
      { icon: "🎮", title: "MMORPG", desc: "", href: "/forum/gaming/mmorpg", subfolders: [] },
      { icon: "🎮", title: "Other Games", desc: "All other games.", href: "/forum/gaming/other", subfolders: [] },
    ]}],
  },
  graphics: {
    title: "Graphics", icon: "🎨", color: "#6c63ff",
    sections: [{ name: "Graphics", items: [
      { icon: "🎨", title: "Graphic Resources", desc: "Free graphic resources.", href: "/forum/graphics/resources", subfolders: [] },
      { icon: "💼", title: "Paid Graphic Work", desc: "Hire designers for paid work.", href: "/forum/graphics/paid", subfolders: [] },
    ]}],
  },
  giveaways: {
    title: "Giveaways", icon: "💸", color: "#6c63ff",
    sections: [{ name: "Giveaways", items: [
      { icon: "🎁", title: "Active Giveaways", desc: "Currently running giveaways.", href: "/forum/giveaways/active", subfolders: [] },
      { icon: "📁", title: "Ended Giveaways", desc: "Past giveaways archive.", href: "/forum/giveaways/ended", subfolders: [] },
    ]}],
  },
  international: {
    title: "International Lounge", icon: "🌍", color: "#6c63ff",
    sections: [{ name: "International", items: [
      { icon: "🌍", title: "Français", desc: "", href: "/forum/international/fr", subfolders: [] },
      { icon: "🌍", title: "Español", desc: "", href: "/forum/international/es", subfolders: [] },
      { icon: "🌍", title: "Italiano", desc: "", href: "/forum/international/it", subfolders: [] },
      { icon: "🌍", title: "العَرَبِيَّة", desc: "", href: "/forum/international/ar", subfolders: [] },
      { icon: "🌍", title: "Türkçe", desc: "", href: "/forum/international/tr", subfolders: [] },
      { icon: "🌍", title: "Other Languages", desc: "All other languages.", href: "/forum/international/other", subfolders: [] },
    ]}],
  },
};

// Sub-category thread page (when clicking inside a category)
const THREADS_DATA: Record<string, Array<{
  id: number; icon: string; title: string; author: string; replies: number; views: number; time: string; tier?: string;
}>> = {};

function generateThreads(category: string) {
  
  const defaults = [
    { id: 1, icon: "🔥", title: `Welcome to ${category}`, author: "Admin", replies: 245, views: 12400, time: "2 days ago", tier: "TIER 1" },
    { id: 2, icon: "📌", title: `[GUIDE] Getting Started in ${category}`, author: "Stack", replies: 89, views: 5600, time: "5 days ago", tier: "TIER 2" },
    { id: 3, icon: "💬", title: `Best resources for ${category} 2025`, author: "Member1", replies: 34, views: 2100, time: "1 week ago" },
    { id: 4, icon: "❓", title: `Question about ${category}`, author: "newbie123", replies: 12, views: 890, time: "2 weeks ago" },
    { id: 5, icon: "🔗", title: `Share your ${category} experience`, author: "veteran_x", replies: 67, views: 3400, time: "3 weeks ago" },
  ];
  return defaults;
}

export default function ForumCategoryPage({ slug }: { slug: string }) {
  const [activeSubCat, setActiveSubCat] = useState<string | null>(null);
  const cat = CATEGORY_DATA[slug];
  const router = useRouter();

  if (!cat) {
    return (
      <div style={{ minHeight: "100vh", background: "#050a0f", color: "#c8dde8" }}>
        <Navbar />
        <div style={{ maxWidth: 780, margin: "80px auto", padding: "32px 16px", textAlign: "center" }}>
          <h1 style={{ color: "#e0f0ff", marginBottom: 16 }}>Category Not Found</h1>
          <a href="/" style={{ color: "#00b4d8" }}>← Back to Home</a>
        </div>
        <Footer />
      </div>
    );
  }

  const threads = generateThreads(cat.title);
  

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#050a0f;color:#b8cfd8;font-family:'Inter',sans-serif}
        .fc{min-height:100vh;background:#050a0f}
        .fc-inner{max-width:780px;margin:0 auto;padding:80px 12px 48px}
        .fc-bread{font-size:13px;color:#4a7a94;margin-bottom:16px}
        .fc-bread a{color:#4a7a94;text-decoration:none}
        .fc-bread a:hover{color:#00b4d8}
        .fc-hdr{background:#6c63ff;border-radius:8px 8px 0 0;padding:10px 16px;display:flex;align-items:center;gap:10px}
        .fc-badge{background:rgba(255,255,255,.18);border-radius:5px;padding:3px 12px;font-size:13px;font-weight:700;color:#fff}
        .fc-label{font-size:10px;font-weight:700;letter-spacing:2px;color:#4a7a94;padding:7px 16px;background:#080e18;border:1px solid #0d2030;border-left:1px solid #0d2030;border-right:1px solid #0d2030}
        .fc-body{background:#080e18;border:1px solid #0d2030;border-top:none;border-radius:0 0 8px 8px;margin-bottom:18px;overflow:hidden}
        .fc-item{padding:14px 16px;border-bottom:1px solid #0a1520;cursor:pointer;transition:background .2s;display:block;text-decoration:none}
        .fc-item:hover{background:#0a1520}
        .fc-item:last-child{border-bottom:none}
        .fc-item-icon{width:42px;height:42px;background:#0a1520;border:1px solid #0d2030;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
        .fc-subfolder{padding:8px 16px;border-bottom:1px solid #0a1520;display:flex;flex-wrap:wrap;gap:8px;background:#060c12}
        .fc-sf-tag{display:flex;align-items:center;gap:4px;color:#4a7a94;font-size:12px}
        .fc-back{display:inline-flex;align-items:center;gap:6px;color:#4a7a94;font-size:13px;margin-bottom:16px;cursor:pointer;background:none;border:none;padding:0}
        .fc-back:hover{color:#00b4d8}
        .fc-thread{padding:13px 16px;border-bottom:1px solid #0a1520;cursor:pointer;transition:background .2s;text-decoration:none;display:block}
        .fc-thread:hover{background:#0a1520}
        .fc-thread:last-child{border-bottom:none}
        .fc-tier{font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px;flex-shrink:0}
      `}</style>

      <div className="fc">
        <Navbar />
        <div className="fc-inner">

          {/* Breadcrumb */}
          <div className="fc-bread">
            <a href="/">Home</a> › {activeSubCat ? <><span style={{ cursor: "pointer" }} onClick={() => setActiveSubCat(null)}>{cat.title}</span> › {activeSubCat}</> : cat.title}
          </div>

          {activeSubCat ? (
            // ── Sub-category thread list ──
            <>
              <button className="fc-back" onClick={() => setActiveSubCat(null)}>
                ← Back to {cat.title}
              </button>

              <div className="fc-hdr">
                <span className="fc-badge">{activeSubCat}</span>
              </div>
              <div className="fc-label">THREADS</div>
              <div className="fc-body">
                {threads.map((t) => (
                  <a key={t.id} href={`/thread/${t.id}`} className="fc-thread">
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ width: 40, height: 40, background: "#0a1520", border: "1px solid #0d2030", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                        {t.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                          {t.tier && (
                            <span className="fc-tier" style={{ background: t.tier === "TIER 1" ? "#22c55e" : "#a855f7", color: "#fff" }}>{t.tier}</span>
                          )}
                          <span style={{ fontWeight: 700, fontSize: 13.5, color: "#e4e4e7" }}>{t.title}</span>
                        </div>
                        <div style={{ fontSize: 12, color: "#4a7a94" }}>
                          by <span style={{ color: "#00b4d8" }}>{t.author}</span> · {t.time} · {t.replies} replies · {t.views.toLocaleString()} views
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </>
          ) : (
            // ── Main category sections ──
            cat.sections.map((section, si) => (
              <div key={si} style={{ marginBottom: 18 }}>
                <div className="fc-hdr">
                  <span className="fc-badge">{section.name}</span>
                </div>
                <div className="fc-label">FORUM</div>
                <div className="fc-body">
                  {section.items.map((item, ii) => (
                    <div key={ii}>
                      <Link href={item.href} className="fc-item">
                        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                          <div className="fc-item-icon">{item.icon}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 13.5, color: "#e4e4e7", marginBottom: 3 }}>{item.title}</div>
                            {item.desc && <div style={{ fontSize: 12, color: "#4a7a94", lineHeight: 1.5 }}>{item.desc}</div>}
                          </div>
                        </div>
                      </Link>
                      {item.subfolders && item.subfolders.length > 0 && (
                        <div className="fc-subfolder">
                          {item.subfolders.map((sf, sfi) => (
                            <span key={sfi} className="fc-sf-tag">📁 {sf}{sfi < item.subfolders!.length - 1 && ","}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}

        </div>
        <Footer />
      </div>
    </>
  );
}