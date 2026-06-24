"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footbar";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

const PLANS = [
  {
    name: "VIP",
    price: "$9.99",
    period: "/ month",
    color: "#00b4d8",
    badge: "POPULAR",
    features: [
      "Access to all VIP sections",
      "Priority support",
      "Exclusive releases",
      "VIP badge on profile",
      "Access to HQ Lounge",
      "Early access to new features",
    ],
  },
  {
    name: "VIP+",
    price: "$19.99",
    period: "/ month",
    color: "#a855f7",
    badge: "BEST VALUE",
    features: [
      "Everything in VIP",
      "Access to Premium section",
      "Private marketplace",
      "VIP+ badge on profile",
      "Discord VIP+ role",
      "Monthly credits bonus",
      "Ad-free experience",
    ],
  },
  {
    name: "Lifetime VIP",
    price: "$49.99",
    period: "one time",
    color: "#f59e0b",
    badge: "LIFETIME",
    features: [
      "Everything in VIP+",
      "Lifetime access — pay once",
      "Exclusive lifetime badge",
      "Priority DMs with staff",
      "Lifetime credits bonus",
      "Never pay again",
    ],
  },
];

const CRYPTO_OPTIONS = [
  { name: "USDT (TRC20)", symbol: "USDT", color: "#26a17b", icon: "₮" },
  { name: "Bitcoin", symbol: "BTC", color: "#f7931a", icon: "₿" },
  { name: "Litecoin", symbol: "LTC", color: "#345d9d", icon: "Ł" },
  { name: "Ethereum", symbol: "ETH", color: "#627eea", icon: "Ξ" },
];

export default function UpgradePage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedCrypto, setSelectedCrypto] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [username, setUsername] = useState("");
  const [txid, setTxid] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const addresses: Record<string, string> = {
    USDT: process.env.NEXT_PUBLIC_CRYPTO_USDT || "Contact admin for address",
    BTC: process.env.NEXT_PUBLIC_CRYPTO_BTC || "Contact admin for address",
    LTC: process.env.NEXT_PUBLIC_CRYPTO_LTC || "Contact admin for address",
    ETH: process.env.NEXT_PUBLIC_CRYPTO_ETH || "Contact admin for address",
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitPayment = async () => {
    if (!username.trim() || !txid.trim() || !selectedPlan || !selectedCrypto) {
      setSubmitStatus("error");
      return;
    }
    setSubmitting(true);
    setSubmitStatus("idle");

    const { error } = await supabase.from("payment_requests").insert({
      username: username.trim(),
      plan: selectedPlan,
      crypto_type: selectedCrypto,
      txid: txid.trim(),
      status: "pending",
    });

    setSubmitting(false);
    if (error) {
      setSubmitStatus("error");
    } else {
      setSubmitStatus("success");
      setUsername("");
      setTxid("");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#050a0f", color: "#c8dde8", fontFamily: "sans-serif" }}>
      <Navbar />

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 16px 64px" }}>
        {/* Breadcrumb */}
        <div style={{ fontSize: 13, color: "#6a8a9a", marginBottom: 24 }}>
          <a href="/" style={{ color: "#6a8a9a", textDecoration: "none" }}>Home</a>
          <span style={{ margin: "0 6px" }}>›</span>
          <span style={{ color: "#c8dde8" }}>Upgrade</span>
        </div>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 style={{ margin: "0 0 12px", fontSize: 30, color: "#e0f0ff", fontWeight: 700 }}>
            Upgrade Your Account
          </h1>
          <p style={{ margin: 0, color: "#6a8a9a", fontSize: 15 }}>
            Get access to exclusive content, features, and community perks
          </p>
        </div>

        {/* Plans */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 40 }}>
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              onClick={() => setSelectedPlan(plan.name)}
              style={{
                background: selectedPlan === plan.name ? `${plan.color}15` : "#0a1520",
                border: `1px solid ${selectedPlan === plan.name ? plan.color : "#1a3a4a"}`,
                borderRadius: 12,
                padding: "28px 24px",
                cursor: "pointer",
                transition: "all 0.2s",
                position: "relative",
              }}
            >
              {/* Badge */}
              <div style={{
                position: "absolute", top: -10, right: 16,
                background: plan.color,
                color: "#000",
                fontSize: 11,
                fontWeight: 700,
                padding: "3px 10px",
                borderRadius: 20,
              }}>
                {plan.badge}
              </div>

              <h2 style={{ margin: "0 0 4px", fontSize: 22, color: plan.color, fontWeight: 700 }}>{plan.name}</h2>
              <div style={{ marginBottom: 20 }}>
                <span style={{ fontSize: 32, fontWeight: 800, color: "#e0f0ff" }}>{plan.price}</span>
                <span style={{ fontSize: 14, color: "#6a8a9a", marginLeft: 4 }}>{plan.period}</span>
              </div>

              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {plan.features.map((f, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 14, color: "#9ab8c8" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={plan.color} strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              {selectedPlan === plan.name && (
                <div style={{
                  marginTop: 20,
                  padding: "8px 0",
                  textAlign: "center",
                  fontSize: 13,
                  color: plan.color,
                  borderTop: `1px solid ${plan.color}30`,
                }}>
                  ✓ Selected
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Payment Section */}
        {selectedPlan && (
          <div style={{
            background: "#0a1520",
            border: "1px solid #1a3a4a",
            borderRadius: 12,
            padding: "28px 24px",
            marginBottom: 24,
          }}>
            <h3 style={{ margin: "0 0 20px", fontSize: 18, color: "#e0f0ff" }}>
              Select Payment Method
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
              {CRYPTO_OPTIONS.map((crypto) => (
                <div
                  key={crypto.symbol}
                  onClick={() => setSelectedCrypto(crypto.symbol)}
                  style={{
                    background: selectedCrypto === crypto.symbol ? `${crypto.color}15` : "#0d1f2d",
                    border: `1px solid ${selectedCrypto === crypto.symbol ? crypto.color : "#1a3a4a"}`,
                    borderRadius: 8,
                    padding: "14px 16px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <span style={{ fontSize: 22, color: crypto.color }}>{crypto.icon}</span>
                  <div>
                    <div style={{ fontSize: 14, color: "#c8dde8", fontWeight: 600 }}>{crypto.symbol}</div>
                    <div style={{ fontSize: 12, color: "#6a8a9a" }}>{crypto.name}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Address box */}
            {selectedCrypto && (
              <div style={{
                background: "#050a0f",
                border: "1px solid #1a3a4a",
                borderRadius: 8,
                padding: "16px 20px",
              }}>
                <div style={{ fontSize: 13, color: "#6a8a9a", marginBottom: 8 }}>
                  Send payment to this {selectedCrypto} address:
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <code style={{
                    flex: 1,
                    fontSize: 13,
                    color: "#00b4d8",
                    wordBreak: "break-all",
                    background: "#0a1520",
                    padding: "10px 14px",
                    borderRadius: 6,
                    border: "1px solid #1a3a4a",
                  }}>
                    {addresses[selectedCrypto]}
                  </code>
                  <button
                    onClick={() => handleCopy(addresses[selectedCrypto])}
                    style={{
                      background: copied ? "#22c55e" : "#00b4d8",
                      border: "none",
                      borderRadius: 6,
                      padding: "10px 16px",
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>

                {/* Warning */}
                <div style={{
                  marginTop: 14,
                  padding: "12px 14px",
                  background: "#f59e0b10",
                  border: "1px solid #f59e0b30",
                  borderRadius: 6,
                  fontSize: 13,
                  color: "#f59e0b",
                  display: "flex",
                  gap: 8,
                }}>
                  <span>⚠️</span>
                  <span>After sending payment, fill the form below with your username and transaction ID. Activation within 24 hours.</span>
                </div>

                {/* Submission form */}
                <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid #1a3a4a" }}>
                  <div style={{ fontSize: 13, color: "#9ab8c8", marginBottom: 10, fontWeight: 600 }}>
                    Submit Your Payment
                  </div>
                  <input
                    type="text"
                    placeholder="Your forum username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{
                      width: "100%", background: "#0a1520", border: "1px solid #1a3a4a",
                      borderRadius: 6, padding: "10px 14px", color: "#c8dde8",
                      fontSize: 13, outline: "none", marginBottom: 10, boxSizing: "border-box",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Transaction ID (TxID)"
                    value={txid}
                    onChange={(e) => setTxid(e.target.value)}
                    style={{
                      width: "100%", background: "#0a1520", border: "1px solid #1a3a4a",
                      borderRadius: 6, padding: "10px 14px", color: "#c8dde8",
                      fontSize: 13, outline: "none", marginBottom: 12, boxSizing: "border-box",
                    }}
                  />
                  <button
                    onClick={handleSubmitPayment}
                    disabled={submitting}
                    style={{
                      width: "100%",
                      background: submitStatus === "success" ? "#22c55e" : "#00b4d8",
                      border: "none", borderRadius: 6, padding: "11px 0",
                      color: "#fff", fontSize: 14, fontWeight: 700,
                      cursor: submitting ? "not-allowed" : "pointer",
                      opacity: submitting ? 0.6 : 1,
                    }}
                  >
                    {submitting ? "Submitting..." : submitStatus === "success" ? "✓ Submitted! Awaiting approval" : "Submit Payment"}
                  </button>
                  {submitStatus === "error" && (
                    <div style={{ marginTop: 8, fontSize: 12, color: "#ef4444" }}>
                      Please fill both username and TxID, or check your connection.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info */}
        <div style={{
          background: "#0a1520",
          border: "1px solid #1a3a4a",
          borderRadius: 8,
          padding: "16px 20px",
          fontSize: 13,
          color: "#6a8a9a",
          lineHeight: 1.7,
        }}>
          <strong style={{ color: "#c8dde8" }}>How it works:</strong> Select a plan → Choose your crypto → Send the exact amount → Open a support ticket with your TxID. Your account will be upgraded within 24 hours.
        </div>
      </div>

      <Footer />
    </div>
  );
}