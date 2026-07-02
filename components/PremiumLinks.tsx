"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type PremiumLink = {
  id: string;
  title: string;
  description: string | null;
  url: string;
  icon: string | null;
  image_url: string | null;
  badge_text: string | null;
  cta_text: string | null;
  theme: string | null;
  priority: number | null;
};

const THEMES: Record<
  string,
  { bg: string; glow: string; badgeBg: string; badgeColor: string; btnBg: string; btnColor: string }
> = {
  gold: {
    bg: "linear-gradient(135deg,#3a2c00 0%,#5c4400 40%,#3a2c00 100%)",
    glow: "rgba(255,201,71,0.45)",
    badgeBg: "linear-gradient(90deg,#ffd76a,#ffb238)",
    badgeColor: "#241900",
    btnBg: "linear-gradient(90deg,#ffd76a,#ffb238)",
    btnColor: "#241900",
  },
  purple: {
    bg: "linear-gradient(135deg,#241033 0%,#3d1a5c 40%,#241033 100%)",
    glow: "rgba(190,110,255,0.45)",
    badgeBg: "linear-gradient(90deg,#c084fc,#8b5cf6)",
    badgeColor: "#1a0630",
    btnBg: "linear-gradient(90deg,#c084fc,#8b5cf6)",
    btnColor: "#1a0630",
  },
  emerald: {
    bg: "linear-gradient(135deg,#052e1f 0%,#0a4f34 40%,#052e1f 100%)",
    glow: "rgba(52,211,153,0.45)",
    badgeBg: "linear-gradient(90deg,#6ee7b7,#10b981)",
    badgeColor: "#022c1b",
    btnBg: "linear-gradient(90deg,#6ee7b7,#10b981)",
    btnColor: "#022c1b",
  },
  ruby: {
    bg: "linear-gradient(135deg,#330a10 0%,#5c111c 40%,#330a10 100%)",
    glow: "rgba(255,90,110,0.45)",
    badgeBg: "linear-gradient(90deg,#ff8fa3,#ff3b57)",
    badgeColor: "#2e0007",
    btnBg: "linear-gradient(90deg,#ff8fa3,#ff3b57)",
    btnColor: "#2e0007",
  },
  diamond: {
    bg: "linear-gradient(135deg,#031b2e 0%,#0a3a5c 40%,#031b2e 100%)",
    glow: "rgba(96,190,255,0.45)",
    badgeBg: "linear-gradient(90deg,#7dd3fc,#38bdf8)",
    badgeColor: "#021627",
    btnBg: "linear-gradient(90deg,#7dd3fc,#38bdf8)",
    btnColor: "#021627",
  },
};

export default function PremiumLinks({
  placement,
  threadId,
}: {
  placement: "home" | "thread";
  /** Sirf placement="thread" ke liye — current thread ka id.
   * Isse general (thread_id null) offers bhi milte hain aur
   * isi thread ke liye bane hue offers bhi (jinhe free user
   * reply karne ke baad dekh payega — yeh RLS khud handle karta
   * hai, yahan bas sahi rows maangna hai). */
  threadId?: string;
}) {
  const [links, setLinks] = useState<PremiumLink[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const column = placement === "home" ? "show_on_home" : "show_on_thread";
      let query = supabase
        .from("premium_links")
        .select(
          "id,title,description,url,icon,image_url,badge_text,cta_text,theme,priority,active,expires_at,thread_id"
        )
        .eq("active", true)
        .eq(column, true);

      if (placement === "thread" && threadId) {
        // Is thread ke general offers (thread_id null) + isi
        // thread ke liye khaas offers (thread_id = threadId) —
        // RLS baaki decide kar leta hai kaun dekh sakta hai.
        query = query.or(`thread_id.is.null,thread_id.eq.${threadId}`);
      } else if (placement === "home") {
        // Home page par sirf general (thread se attached na hon) offers
        query = query.is("thread_id", null);
      }

      const { data, error } = await query
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      // RLS khud hi free users ke liye empty array return karega —
      // isliye yahan koi extra "is user premium?" check lagane ki
      // zaroorat nahi, database khud filter kar deta hai.
      if (!cancelled) {
        if (!error && data) {
          const now = Date.now();
          const valid = data.filter(
            (l: any) => !l.expires_at || new Date(l.expires_at).getTime() > now
          );
          setLinks(valid as PremiumLink[]);
        }
        setLoaded(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [placement]);

  if (!loaded || links.length === 0) return null;

  return (
    <div className="premium-links-wrap">
      {links.map((link) => {
        const t = THEMES[link.theme || "gold"] || THEMES.gold;
        return (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="premium-card"
            style={
              {
                "--pcard-bg": t.bg,
                "--pcard-glow": t.glow,
                "--pcard-badge-bg": t.badgeBg,
                "--pcard-badge-color": t.badgeColor,
                "--pcard-btn-bg": t.btnBg,
                "--pcard-btn-color": t.btnColor,
              } as React.CSSProperties
            }
          >
            <span className="premium-card-shine" />
            <span className="premium-card-badge">
              {link.badge_text || "PREMIUM"}
            </span>

            <div className="premium-card-body">
              {link.image_url ? (
                <img src={link.image_url} alt="" className="premium-card-img" />
              ) : (
                <span className="premium-card-icon">{link.icon || "🎁"}</span>
              )}

              <div className="premium-card-text">
                <div className="premium-card-title">{link.title}</div>
                {link.description && (
                  <div className="premium-card-desc">{link.description}</div>
                )}
              </div>

              <span className="premium-card-btn">
                {link.cta_text || "Claim Offer"}
              </span>
            </div>
          </a>
        );
      })}

      <style jsx>{`
        .premium-links-wrap {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
          margin: 14px 0;
        }

        .premium-card {
          position: relative;
          display: block;
          border-radius: 14px;
          padding: 16px 18px;
          text-decoration: none;
          overflow: hidden;
          background: var(--pcard-bg);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.03) inset,
            0 8px 24px -8px var(--pcard-glow), 0 0 40px -12px var(--pcard-glow);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .premium-card:hover {
          transform: translateY(-2px) scale(1.01);
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.06) inset,
            0 12px 32px -6px var(--pcard-glow), 0 0 55px -10px var(--pcard-glow);
        }

        .premium-card-shine {
          position: absolute;
          top: 0;
          left: -60%;
          width: 45%;
          height: 100%;
          background: linear-gradient(
            120deg,
            transparent 0%,
            rgba(255, 255, 255, 0.18) 45%,
            transparent 100%
          );
          transform: skewX(-20deg);
          animation: premiumShine 3.2s ease-in-out infinite;
          pointer-events: none;
        }

        @keyframes premiumShine {
          0% {
            left: -60%;
          }
          55% {
            left: 130%;
          }
          100% {
            left: 130%;
          }
        }

        .premium-card-badge {
          position: absolute;
          top: 10px;
          right: -34px;
          transform: rotate(38deg);
          background: var(--pcard-badge-bg);
          color: var(--pcard-badge-color);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.06em;
          padding: 3px 40px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
        }

        .premium-card-body {
          position: relative;
          display: flex;
          align-items: center;
          gap: 14px;
          z-index: 1;
        }

        .premium-card-icon {
          font-size: 30px;
          line-height: 1;
          flex-shrink: 0;
        }

        .premium-card-img {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          object-fit: cover;
          flex-shrink: 0;
        }

        .premium-card-text {
          flex: 1;
          min-width: 0;
        }

        .premium-card-title {
          color: #fff;
          font-weight: 700;
          font-size: 15px;
          line-height: 1.25;
        }

        .premium-card-desc {
          color: rgba(255, 255, 255, 0.72);
          font-size: 12.5px;
          margin-top: 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .premium-card-btn {
          flex-shrink: 0;
          background: var(--pcard-btn-bg);
          color: var(--pcard-btn-color);
          font-size: 12.5px;
          font-weight: 800;
          padding: 8px 16px;
          border-radius: 999px;
          white-space: nowrap;
        }

        @media (max-width: 560px) {
          .premium-card-desc {
            display: none;
          }
          .premium-card-btn {
            padding: 7px 12px;
            font-size: 11.5px;
          }
        }
      `}</style>
    </div>
  );
}