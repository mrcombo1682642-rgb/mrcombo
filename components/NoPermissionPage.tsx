"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footbar";

export default function NoPermissionPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#050a0f", color: "#c8dde8", fontFamily: "sans-serif" }}>
      <Navbar />

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "80px 16px 64px" }}>
        {/* Main Card */}
        <div style={{
          background: "#0a1520",
          border: "1px solid #1a3a4a",
          borderRadius: 12,
          padding: "48px 40px",
          textAlign: "center",
        }}>
          {/* Lock Icon */}
          <div style={{
            width: 72,
            height: 72,
            background: "linear-gradient(135deg, #00b4d820, #00b4d810)",
            border: "2px solid #00b4d840",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00b4d8" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <h1 style={{ margin: "0 0 12px", fontSize: 26, color: "#e0f0ff", fontWeight: 700 }}>
            Access Denied
          </h1>
          <p style={{ margin: "0 0 32px", color: "#6a8a9a", fontSize: 15, lineHeight: 1.7 }}>
            You don't have permission to view this page. This area is restricted to members with the required access level.
          </p>

          {/* Options */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
            <div style={{
              background: "#0d1f2d",
              border: "1px solid #1a3a4a",
              borderRadius: 8,
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: 14,
              textAlign: "left",
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "#00b4d815", border: "1px solid #00b4d830",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00b4d8" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 14, color: "#c8dde8", fontWeight: 600 }}>Already a member?</div>
                <div style={{ fontSize: 13, color: "#6a8a9a" }}>Log in to your account to access this content</div>
              </div>
            </div>

            <div style={{
              background: "#0d1f2d",
              border: "1px solid #1a3a4a",
              borderRadius: 8,
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: 14,
              textAlign: "left",
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "#00b4d815", border: "1px solid #00b4d830",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00b4d8" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 14, color: "#c8dde8", fontWeight: 600 }}>Need an upgrade?</div>
                <div style={{ fontSize: 13, color: "#6a8a9a" }}>This content may require a VIP or premium membership</div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/" style={{
              background: "transparent",
              border: "1px solid #1a3a4a",
              borderRadius: 6,
              padding: "10px 24px",
              color: "#9ab8c8",
              textDecoration: "none",
              fontSize: 14,
              cursor: "pointer",
            }}>
              ← Back to Home
            </a>
            <a href="/upgrade" style={{
              background: "linear-gradient(135deg, #00b4d8, #0077a8)",
              border: "none",
              borderRadius: 6,
              padding: "10px 24px",
              color: "#fff",
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}>
              Upgrade Account
            </a>
          </div>
        </div>

        {/* Info box */}
        <div style={{
          marginTop: 20,
          background: "#0a1520",
          border: "1px solid #1a3a4a",
          borderRadius: 8,
          padding: "16px 20px",
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6a8a9a" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p style={{ margin: 0, fontSize: 13, color: "#6a8a9a", lineHeight: 1.7 }}>
            If you believe this is an error or you should have access to this page, please contact support or post in the Support & Bugs section.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}