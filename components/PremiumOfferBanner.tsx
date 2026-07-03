"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type PremiumLink = {
  id: string;
  title: string;
  url: string;
  icon: string;
  created_at: string;
};

export default function PremiumOfferBanner({ context }: { context: "home" | "thread" }) {
  const [links, setLinks] = useState<PremiumLink[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(0);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) { setLoading(false); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const premiumRoles = ["vip", "vip+", "lifetime", "admin", "moderator"];
      if (!profile || !premiumRoles.includes(profile.role)) {
        setLoading(false);
        return;
      }
      setIsPremium(true);

      const col = context === "home" ? "show_on_home" : "show_on_thread";
      const { data } = await supabase
        .from("premium_links")
        .select("id, title, url, icon, created_at")
        .eq(col, true)
        .order("created_at", { ascending: false });

      setLinks(data || []);
      setLoading(false);
    }
    load();
  }, [context]);

  // Auto-rotate carousel every 5s if multiple offers
  useEffect(() => {
    if (links.length <= 1) return;
    const t = setInterval(() => setActive(a => (a + 1) % links.length), 5000);
    return () => clearInterval(t);
  }, [links.length]);

  if (loading || !isPremium || links.length === 0) return null;

  const link = links[active];

  return (
    <div style={{ marginBottom: 16 }}>
      <style>{`
        @keyframes premOfferShine {
          0% { transform: translateX(-120%) skewX(-20deg); }
          100% { transform: translateX(220%) skewX(-20deg); }
        }
        @keyframes premOfferBorder {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes premOfferPulse {
          0%, 100% { opacity: .55; }
          50% { opacity: 1; }
        }
        .prem-offer-wrap{
          position: relative;
          border-radius: 14px;
          padding: 2px;
          background: linear-gradient(90deg, #f0a500, #e91e8c, #6c63ff, #00b4d8, #f0a500);
          background-size: 300% 100%;
          animation: premOfferBorder 6s linear infinite;
        }
        .prem-offer-card{
          position: relative;
          overflow: hidden;
          border-radius: 12px;
          background: linear-gradient(135deg, #0a0f1a 0%, #0d1424 55%, #120a22 100%);
          padding: 16px 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          text-decoration: none;
          cursor: pointer;
        }
        .prem-offer-shine{
          position: absolute; top: 0; left: 0; width: 45%; height: 100%;
          background: linear-gradient(100deg, transparent, rgba(255,255,255,0.12), transparent);
          animation: premOfferShine 3.2s ease-in-out infinite;
          pointer-events: none;
        }
        .prem-offer-badge{
          display: inline-flex; align-items: center; gap: 5px;
          background: linear-gradient(135deg, #f0a500, #e91e8c);
          color: #fff; font-size: 10px; font-weight: 800; letter-spacing: 1.2px;
          padding: 3px 9px; border-radius: 20px; text-transform: uppercase;
          box-shadow: 0 2px 10px rgba(240,165,0,0.35);
        }
        .prem-offer-dot-live{
          width: 6px; height: 6px; border-radius: 50%; background: #fff;
          animation: premOfferPulse 1.4s ease-in-out infinite;
        }
        .prem-offer-icon{
          width: 52px; height: 52px; flex-shrink: 0; border-radius: 12px;
          background: linear-gradient(135deg, rgba(240,165,0,0.18), rgba(108,99,255,0.18));
          border: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: center; font-size: 26px;
        }
        .prem-offer-cta{
          flex-shrink: 0; display: flex; align-items: center; gap: 6px;
          background: linear-gradient(135deg, #6c63ff, #00b4d8);
          color: #fff; font-size: 12.5px; font-weight: 700;
          padding: 9px 16px; border-radius: 8px; white-space: nowrap;
          transition: transform .15s, box-shadow .15s;
        }
        .prem-offer-card:hover .prem-offer-cta{
          transform: translateX(2px);
          box-shadow: 0 4px 16px rgba(0,180,216,0.4);
        }
        .prem-offer-dots{
          display: flex; gap: 5px; justify-content: center; margin-top: 8px;
        }
        .prem-offer-dot{
          width: 6px; height: 6px; border-radius: 50%; background: #1a2535;
          cursor: pointer; transition: all .2s;
        }
        .prem-offer-dot.on{
          width: 18px; border-radius: 4px;
          background: linear-gradient(90deg, #f0a500, #e91e8c);
        }
      `}</style>

      <div className="prem-offer-wrap">
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="prem-offer-card"
        >
          <div className="prem-offer-shine" />
          <div className="prem-offer-icon">{link.icon || "🎁"}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="prem-offer-badge">
              <span className="prem-offer-dot-live" />
              Premium Exclusive
            </div>
            <div style={{
              color: "#f5f8fa", fontWeight: 700, fontSize: 14.5, marginTop: 6,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {link.title}
            </div>
          </div>
          <div className="prem-offer-cta">
            Visit <span style={{ fontSize: 14 }}>→</span>
          </div>
        </a>
      </div>

      {links.length > 1 && (
        <div className="prem-offer-dots">
          {links.map((_, i) => (
            <span
              key={i}
              className={`prem-offer-dot ${i === active ? "on" : ""}`}
              onClick={() => setActive(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}