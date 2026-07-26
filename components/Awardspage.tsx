"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footbar";

interface Award {
  id: string;
  category: string;
  name: string;
  description: string;
  icon: string;
  icon_color: string;
  image_url: string | null;
  sort_order: number;
}

const TABS = [
  { key: "standard", label: "Standard" },
  { key: "upgrades", label: "Upgrades" },
  { key: "requirement_based", label: "Requirement Based" },
  { key: "special", label: "Special" },
];

export default function AwardsPage() {
  const [activeTab, setActiveTab] = useState("standard");
  const [awards, setAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAwards(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  async function loadAwards(category: string) {
    setLoading(true);
    // Public RPC — no auth required, works for guests too
    const { data, error } = await supabase.rpc("get_awards_by_category", { cat: category });
    if (!error && data) setAwards(data as Award[]);
    setLoading(false);
  }

  return (
    <div className="awards-page">
      <Navbar />
      <div className="awards-shell">
        <div className="awards-breadcrumb">
          <Link href="/">Home</Link> <span>›</span> Awards
        </div>

        <div className="awards-card">
          <div className="awards-tabbar">
            {TABS.map((t) => (
              <button
                key={t.key}
                className={`awards-tab ${activeTab === t.key ? "active" : ""}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="awards-subtitle">
            Being active in the forum, gives you opportunity to win valuable awards!
          </div>

          <div className="awards-grid">
            {loading ? (
              <div className="awards-empty">Loading…</div>
            ) : awards.length === 0 ? (
              <div className="awards-empty">No awards in this category yet.</div>
            ) : (
              awards.map((award) => (
                <div key={award.id} className="award-row">
                  <div
                    className="award-icon"
                    style={{
                      background: `${award.icon_color}1a`,
                      border: `1px solid ${award.icon_color}44`,
                      color: award.icon_color,
                    }}
                  >
                    {award.image_url ? (
                      <img src={award.image_url} alt={award.name} />
                    ) : (
                      award.icon
                    )}
                  </div>
                  <div className="award-info">
                    <div className="award-name">{award.name}</div>
                    <div className="award-desc">{award.description}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <Footer />

      <style>{`
        .awards-page {
          min-height: 100vh;
          background: #050a0f;
          display: flex;
          flex-direction: column;
        }
        .awards-shell {
          flex: 1;
          max-width: 900px;
          width: 100%;
          margin: 0 auto;
          padding: 100px 16px 60px;
        }
        .awards-breadcrumb {
          font-size: 13px;
          color: #4a7a94;
          margin-bottom: 16px;
        }
        .awards-breadcrumb a {
          color: #4a7a94;
          text-decoration: none;
        }
        .awards-breadcrumb a:hover {
          color: #00b4d8;
        }
        .awards-card {
          background: #0a1520;
          border: 1px solid #1a2535;
          border-radius: 10px;
          overflow: hidden;
        }
        .awards-tabbar {
          display: flex;
          flex-wrap: wrap;
          gap: 2px;
          background: #6c63ff;
          padding: 0;
        }
        .awards-tab {
          flex: 1;
          min-width: 120px;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.7);
          font-size: 13px;
          font-weight: 700;
          padding: 12px 10px;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .awards-tab:hover {
          background: rgba(255, 255, 255, 0.08);
        }
        .awards-tab.active {
          background: #5850e6;
          color: #fff;
        }
        .awards-subtitle {
          text-align: center;
          color: #9ab0bf;
          font-size: 13px;
          padding: 16px 20px;
          border-bottom: 1px solid #1a2535;
        }
        .awards-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1px;
          background: #1a2535;
        }
        @media (max-width: 640px) {
          .awards-grid {
            grid-template-columns: 1fr;
          }
        }
        .award-row {
          background: #0a1520;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          transition: background 0.15s ease;
        }
        .award-row:hover {
          background: #0d1c28;
        }
        .award-icon {
          width: 42px;
          height: 42px;
          border-radius: 8px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          overflow: hidden;
        }
        .award-icon img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .award-info {
          min-width: 0;
        }
        .award-name {
          color: #e7e7e7;
          font-weight: 700;
          font-size: 13.5px;
        }
        .award-desc {
          color: #6a8a9a;
          font-size: 12px;
          margin-top: 2px;
        }
        .awards-empty {
          grid-column: 1 / -1;
          text-align: center;
          color: #4a7a94;
          padding: 50px 20px;
          font-size: 13.5px;
        }
      `}</style>
    </div>
  );
}