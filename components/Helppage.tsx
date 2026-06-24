"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "@/components/Footbar";

const HELP_SECTIONS = [
  {
    title: "Forum Rules",
    icon: "📜",
    items: [
      { label: "General Rules", desc: "Core rules that apply to all sections of the forum." },
      { label: "Shoutbox Rules", desc: "Rules for using the live chat / shoutbox." },
      { label: "Marketplace Rules", desc: "Rules for buying and selling in the marketplace." },
      { label: "Terms Of Service", desc: "Full terms of service for using MRCombo." },
    ],
  },
  {
    title: "General Documents",
    icon: "📁",
    items: [
      { label: "UserGroups", desc: "Learn about different member ranks and their permissions." },
      { label: "Awards", desc: "How to earn awards and badges on the forum." },
      { label: "Credits", desc: "How the credits system works." },
      { label: "Statistics", desc: "Forum stats and activity information." },
      { label: "FAQ", desc: "Frequently asked questions and answers." },
      { label: "Ban List", desc: "List of banned users and reasons." },
      { label: "Advertise", desc: "How to advertise your service on MRCombo." },
    ],
  },
  {
    title: "Digital Millennium Copyright Act",
    icon: "⚖️",
    items: [
      { label: "DMCA Policy", desc: "Our DMCA takedown policy and how to submit a request." },
    ],
  },
];

export default function HelpPage() {
  const router = useRouter();
  const [open, setOpen] = useState<Record<number, boolean>>({ 0: true, 1: true, 2: true });

  return (
    <div style={{ minHeight: "100vh", background: "#050a0f", color: "#e7e7e7", fontFamily: "sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px 60px" }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: 13, color: "#9a9ca3", marginBottom: 20, display: "flex", gap: 6 }}>
          <span onClick={() => router.push("/")} style={{ color: "#00b4d8", cursor: "pointer" }}>Home</span>
          <span>›</span>
          <span>Help</span>
        </div>

        {HELP_SECTIONS.map((section, idx) => (
          <div key={idx} style={{ marginBottom: 16 }}>
            {/* Section Header */}
            <div
              onClick={() => setOpen(prev => ({ ...prev, [idx]: !prev[idx] }))}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "14px 18px", background: "#0a1520", border: "1px solid #1a2535",
                borderRadius: open[idx] ? "10px 10px 0 0" : 10, cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 700, color: "#e7e7e7" }}>
                {section.icon} {section.title}
              </span>
              <span style={{ fontSize: 18, color: "#9a9ca3", transition: "transform 0.2s", display: "block", transform: open[idx] ? "rotate(180deg)" : "none" }}>
                ▾
              </span>
            </div>

            {/* Section Items */}
            {open[idx] && (
              <div style={{ border: "1px solid #1a2535", borderTop: "none", borderRadius: "0 0 10px 10px", overflow: "hidden" }}>
                {section.items.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "13px 18px",
                      background: i % 2 === 0 ? "#081018" : "#0a1520",
                      borderBottom: i < section.items.length - 1 ? "1px solid #1a2535" : "none",
                      cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#0f1f30"}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "#081018" : "#0a1520"}
                  >
                    <div>
                      <div style={{ fontSize: 14, color: "#00b4d8", fontWeight: 600 }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: "#9a9ca3", marginTop: 3 }}>{item.desc}</div>
                    </div>
                    <span style={{ color: "#9a9ca3", fontSize: 16 }}>›</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <Footer />
    </div>
  );
}