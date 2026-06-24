"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footbar";

export default function TOSPage() {
  const sections = [
    {
      title: "Terms",
      content: `By accessing this website, you agree to be bound by these Terms of Service and agree that you are responsible for compliance with any applicable local laws. If you do not agree with any of these terms, you are prohibited from using or accessing this site.`,
    },
    {
      title: "Use License",
      content: `Permission is granted to temporarily download one copy of the materials on MRCombo's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not: modify or copy the materials; use the materials for any commercial purpose; attempt to decompile or reverse engineer any software contained on the website; remove any copyright or other proprietary notations from the materials; or transfer the materials to another person or mirror the materials on any other server.`,
    },
    {
      title: "Disclaimer",
      content: `The materials on MRCombo's website are provided on an 'as is' basis. MRCombo makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.`,
    },
    {
      title: "Limitations",
      content: `In no event shall MRCombo or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on MRCombo's website, even if MRCombo or a MRCombo authorized representative has been notified orally or in writing of the possibility of such damage.`,
    },
    {
      title: "Accuracy of Materials",
      content: `The materials appearing on MRCombo's website could include technical, typographical, or photographic errors. MRCombo does not warrant that any of the materials on its website are accurate, complete or current. MRCombo may make changes to the materials contained on its website at any time without notice. However MRCombo does not make any commitment to update the materials.`,
    },
    {
      title: "Links",
      content: `MRCombo has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by MRCombo of the site. Use of any such linked website is at the user's own risk.`,
    },
    {
      title: "Modifications",
      content: `MRCombo may revise these terms of service for its website at any time without notice. By using this website you are agreeing to be bound by the then current version of these Terms of Service.`,
    },
    {
      title: "Not Allowed",
      content: null,
      list: [
        "Sharing or distributing malware, viruses, or harmful code",
        "Spamming, flooding, or abusing the forum system",
        "Posting illegal content or content that violates copyright laws",
        "Harassing, threatening, or abusing other members",
        "Creating multiple accounts to bypass bans or restrictions",
        "Advertising or promoting services without permission",
        "Attempting to hack, exploit, or disrupt the platform",
        "Posting personal information of other users without consent",
      ],
    },
    {
      title: "Governing Law",
      content: `These terms and conditions are governed by and construed in accordance with the laws and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.`,
    },
    {
      title: "Abuse & DMCA",
      content: `If you believe that your intellectual property rights have been violated, or if you wish to report abuse, please contact us at: `,
      email: "admin@mrcombo.cc",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#050a0f", color: "#c8dde8", fontFamily: "sans-serif" }}>
      <Navbar />

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 16px 64px" }}>
        {/* Breadcrumb */}
        <div style={{ fontSize: 13, color: "#6a8a9a", marginBottom: 24 }}>
          <a href="/" style={{ color: "#6a8a9a", textDecoration: "none" }}>Home</a>
          <span style={{ margin: "0 6px" }}>›</span>
          <span style={{ color: "#c8dde8" }}>Terms of Service</span>
        </div>

        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #0a1520, #0d1f2d)",
          border: "1px solid #1a3a4a",
          borderRadius: 10,
          padding: "28px 32px",
          marginBottom: 28,
        }}>
          <h1 style={{ margin: 0, fontSize: 26, color: "#e0f0ff", fontWeight: 700 }}>
            Terms of Service
          </h1>
          <p style={{ margin: "10px 0 0", color: "#6a8a9a", fontSize: 14 }}>
            Last updated: January 2025 — Please read these terms carefully before using MRCombo.
          </p>
        </div>

        {/* Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {sections.map((section, i) => (
            <div key={i} style={{
              background: "#0a1520",
              border: "1px solid #1a3a4a",
              borderRadius: 8,
              padding: "22px 28px",
            }}>
              <h2 style={{
                margin: "0 0 12px",
                fontSize: 16,
                color: "#00b4d8",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}>
                <span style={{
                  background: "#00b4d820",
                  border: "1px solid #00b4d840",
                  borderRadius: 4,
                  padding: "2px 10px",
                  fontSize: 13,
                  color: "#00b4d8",
                }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {section.title}
              </h2>

              {section.content && (
                <p style={{ margin: 0, color: "#9ab8c8", fontSize: 14, lineHeight: 1.8 }}>
                  {section.content}
                  {section.email && (
                    <a href={`mailto:${section.email}`} style={{ color: "#00b4d8", textDecoration: "none" }}>
                      {section.email}
                    </a>
                  )}
                </p>
              )}

              {section.list && (
                <ul style={{ margin: 0, paddingLeft: 20, color: "#9ab8c8", fontSize: 14, lineHeight: 2 }}>
                  {section.list.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}