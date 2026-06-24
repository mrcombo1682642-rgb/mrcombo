"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footbar";
import { supabase } from "@/lib/supabase";

type Vouch = {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  description: string;
  price: number;
  image_url: string | null;
  recommended: boolean;
  active: boolean;
  created_at: string;
};

const CRYPTO_OPTIONS = [
  { name: "USDT (TRC20)", symbol: "USDT", color: "#26a17b", icon: "₮" },
  { name: "Bitcoin", symbol: "BTC", color: "#f7931a", icon: "₿" },
  { name: "Litecoin", symbol: "LTC", color: "#345d9d", icon: "Ł" },
  { name: "Ethereum", symbol: "ETH", color: "#627eea", icon: "Ξ" },
];

const CATEGORIES = ["Marketplace", "Services", "Cracking", "Leaks", "Other"];

export default function VouchesPage() {
  const router = useRouter();
  const [vouches, setVouches] = useState<Vouch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [filter, setFilter] = useState<"all" | "recommended">("all");

  // Buy modal
  const [buyModal, setBuyModal] = useState<Vouch | null>(null);
  const [selectedCrypto, setSelectedCrypto] = useState<string | null>(null);
  const [txid, setTxid] = useState("");
  const [buyerUsername, setBuyerUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [copied, setCopied] = useState(false);

  // Admin create modal
  const [createModal, setCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Marketplace");
  const [newSubcategory, setNewSubcategory] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newRecommended, setNewRecommended] = useState(false);
  const [creating, setCreating] = useState(false);

  const addresses: Record<string, string> = {
    USDT: process.env.NEXT_PUBLIC_CRYPTO_USDT || "",
    BTC: process.env.NEXT_PUBLIC_CRYPTO_BTC || "",
    LTC: process.env.NEXT_PUBLIC_CRYPTO_LTC || "",
    ETH: process.env.NEXT_PUBLIC_CRYPTO_ETH || "",
  };

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (uid) {
        setUser(userData.user);
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, username")
          .eq("id", uid)
          .single();
        if (profile?.role === "admin") setIsAdmin(true);
        if (profile?.username) setBuyerUsername(profile.username);
      }
    }
    init();
    loadVouches();
  }, []);

  async function loadVouches() {
    setLoading(true);
    const { data, error } = await supabase
      .from("vouches")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false });
    if (!error) setVouches(data || []);
    setLoading(false);
  }

  async function handleCreate() {
    if (!newTitle.trim() || !newDesc.trim() || !newPrice) return;
    setCreating(true);
    const { error } = await supabase.from("vouches").insert({
      title: newTitle.trim(),
      category: newCategory,
      subcategory: newSubcategory.trim(),
      description: newDesc.trim(),
      price: parseFloat(newPrice),
      image_url: newImageUrl.trim() || null,
      recommended: newRecommended,
      active: true,
      user_id: user?.id,
    });
    setCreating(false);
    if (!error) {
      setCreateModal(false);
      setNewTitle(""); setNewCategory("Marketplace");
      setNewSubcategory(""); setNewDesc("");
      setNewPrice(""); setNewImageUrl("");
      setNewRecommended(false);
      loadVouches();
    }
  }

  async function handleBuy() {
    if (!txid.trim() || !buyerUsername.trim() || !selectedCrypto || !buyModal) return;
    setSubmitting(true);
    const { error } = await supabase.from("vouch_purchases").insert({
      vouch_id: buyModal.id,
      buyer_id: user?.id || null,
      buyer_username: buyerUsername.trim(),
      crypto_type: selectedCrypto,
      txid: txid.trim(),
      amount: buyModal.price,
      status: "pending",
    });
    setSubmitting(false);
    if (!error) {
      setSubmitStatus("success");
      setTxid("");
    } else {
      setSubmitStatus("error");
    }
  }

  const filtered = filter === "recommended"
    ? vouches.filter(v => v.recommended)
    : vouches;

  return (
    <div style={{ minHeight: "100vh", background: "#050a0f", color: "#e7e7e7", fontFamily: "Inter, sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 16px 60px" }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: 13, color: "#9a9ca3", marginBottom: 16, display: "flex", gap: 6 }}>
          <span onClick={() => router.push("/")} style={{ color: "#00b4d8", cursor: "pointer" }}>Home</span>
          <span>›</span>
          <span>Vouches</span>
        </div>

        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #0d1f2d, #0a1520)",
          border: "1px solid #1a2535", borderRadius: 12,
          padding: "24px 28px", marginBottom: 24,
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16,
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#e7e7e7" }}>
              🏆 Vouches Marketplace
            </h1>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "#9a9ca3" }}>
              Browse verified vouch packages — pay crypto, get verified instantly
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setCreateModal(true)}
              style={{
                background: "linear-gradient(135deg, #6c63ff, #a855f7)",
                border: "none", borderRadius: 8, padding: "10px 20px",
                color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              ✚ Create Vouch Listing
            </button>
          )}
        </div>

        {/* Warning */}
        <div style={{ background: "#f59e0b11", border: "1px solid #f59e0b44", borderRadius: 8, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#f59e0b", display: "flex", gap: 10 }}>
          <span>⚠️</span>
          <span>Vouches are verified by admin. Payment activates within 24 hours. Always use middleman for large trades.</span>
        </div>

        {/* Filter */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {(["all", "recommended"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "8px 20px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600,
              background: filter === f ? "#00b4d8" : "#0a1520",
              color: filter === f ? "#fff" : "#9a9ca3",
              border: `1px solid ${filter === f ? "#00b4d8" : "#1a2535"}`,
            }}>
              {f === "all" ? "All Vouches" : "⭐ Recommended"}
            </button>
          ))}
        </div>

        {/* Vouches Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#4a7a94" }}>Loading vouches...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#4a7a94" }}>No vouches available yet.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16, marginBottom: 24 }}>
            {filtered.map(v => (
              <div key={v.id} style={{
                background: "#0a1520", border: `1px solid ${v.recommended ? "#22c55e44" : "#1a2535"}`,
                borderRadius: 12, overflow: "hidden",
                transition: "transform 0.2s, border-color 0.2s",
              }}
                onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}
              >
                {/* Image */}
                {v.image_url && (
                  <div style={{ height: 160, overflow: "hidden", position: "relative" }}>
                    <img src={v.image_url} alt={v.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{
                      position: "absolute", inset: 0,
                      background: "linear-gradient(to bottom, transparent 50%, #0a1520 100%)",
                    }} />
                  </div>
                )}

                {!v.image_url && (
                  <div style={{
                    height: 100, background: "linear-gradient(135deg, #1a0840, #0d1f2d)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40,
                  }}>🏆</div>
                )}

                <div style={{ padding: "16px 18px" }}>
                  {/* Badges */}
                  <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, padding: "2px 8px", background: "#6c63ff22", color: "#6c63ff", borderRadius: 4, fontWeight: 700 }}>
                      {v.category}
                    </span>
                    {v.subcategory && (
                      <span style={{ fontSize: 11, padding: "2px 8px", background: "#0d2030", color: "#9a9ca3", borderRadius: 4 }}>
                        {v.subcategory}
                      </span>
                    )}
                    {v.recommended && (
                      <span style={{ fontSize: 11, padding: "2px 8px", background: "#22c55e22", color: "#22c55e", borderRadius: 4, fontWeight: 700 }}>
                        ★ RECOMMENDED
                      </span>
                    )}
                  </div>

                  <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 700, color: "#e7e7e7" }}>{v.title}</h3>
                  <p style={{ margin: "0 0 16px", fontSize: 13, color: "#9a9ca3", lineHeight: 1.6 }}>{v.description}</p>

                  {/* Price + Buy */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <span style={{ fontSize: 22, fontWeight: 800, color: "#00b4d8" }}>${v.price}</span>
                      <span style={{ fontSize: 12, color: "#4a7a94", marginLeft: 4 }}>USD</span>
                    </div>
                    <button
                      onClick={() => {
                        if (!user) { router.push("/login"); return; }
                        setBuyModal(v);
                        setSelectedCrypto(null);
                        setTxid("");
                        setSubmitStatus("idle");
                      }}
                      style={{
                        background: "linear-gradient(135deg, #00b4d8, #0077a8)",
                        border: "none", borderRadius: 8,
                        padding: "10px 20px", color: "#fff",
                        fontSize: 13, fontWeight: 700, cursor: "pointer",
                      }}
                    >
                      Buy Now →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── BUY MODAL ── */}
      {buyModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 500,
          background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        }} onClick={() => { setBuyModal(null); setSubmitStatus("idle"); }}>
          <div style={{
            background: "#0a1520", border: "1px solid #1a2535",
            borderRadius: 14, width: "100%", maxWidth: 500,
            maxHeight: "90vh", overflowY: "auto",
          }} onClick={e => e.stopPropagation()}>

            {/* Modal Header */}
            <div style={{
              background: "linear-gradient(135deg, #00b4d8, #0077a8)",
              padding: "16px 20px", borderRadius: "14px 14px 0 0",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>Purchase Vouch</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>{buyModal.title}</div>
              </div>
              <button onClick={() => setBuyModal(null)} style={{
                background: "rgba(255,255,255,0.15)", border: "none",
                borderRadius: 6, width: 30, height: 30, color: "#fff",
                fontSize: 16, cursor: "pointer",
              }}>✕</button>
            </div>

            <div style={{ padding: "20px" }}>
              {submitStatus === "success" ? (
                <div style={{ textAlign: "center", padding: "30px 0" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#22c55e", marginBottom: 8 }}>Payment Submitted!</div>
                  <div style={{ fontSize: 13, color: "#9a9ca3" }}>Admin will verify and activate your vouch within 24 hours.</div>
                  <button onClick={() => setBuyModal(null)} style={{
                    marginTop: 20, background: "#00b4d8", border: "none",
                    borderRadius: 8, padding: "10px 24px", color: "#fff",
                    fontSize: 14, fontWeight: 700, cursor: "pointer",
                  }}>Close</button>
                </div>
              ) : (
                <>
                  {/* Price summary */}
                  <div style={{
                    background: "#050a0f", border: "1px solid #1a2535",
                    borderRadius: 8, padding: "14px 16px", marginBottom: 20,
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <span style={{ fontSize: 13, color: "#9a9ca3" }}>Total Amount</span>
                    <span style={{ fontSize: 22, fontWeight: 800, color: "#00b4d8" }}>${buyModal.price} USD</span>
                  </div>

                  {/* Crypto select */}
                  <div style={{ fontSize: 12, color: "#4a7a94", fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>SELECT PAYMENT METHOD</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                    {CRYPTO_OPTIONS.map(c => (
                      <div key={c.symbol} onClick={() => setSelectedCrypto(c.symbol)} style={{
                        background: selectedCrypto === c.symbol ? `${c.color}20` : "#050a0f",
                        border: `1px solid ${selectedCrypto === c.symbol ? c.color : "#1a2535"}`,
                        borderRadius: 8, padding: "12px 14px", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 8,
                      }}>
                        <span style={{ fontSize: 20, color: c.color }}>{c.icon}</span>
                        <div>
                          <div style={{ fontSize: 13, color: "#c8dde8", fontWeight: 600 }}>{c.symbol}</div>
                          <div style={{ fontSize: 11, color: "#6a8a9a" }}>{c.name}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Address */}
                  {selectedCrypto && (
                    <div style={{ background: "#050a0f", border: "1px solid #1a2535", borderRadius: 8, padding: "14px 16px", marginBottom: 16 }}>
                      <div style={{ fontSize: 12, color: "#4a7a94", marginBottom: 8 }}>Send ${buyModal.price} worth of {selectedCrypto} to:</div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <code style={{ flex: 1, fontSize: 12, color: "#00b4d8", wordBreak: "break-all", background: "#0a1520", padding: "8px 12px", borderRadius: 6, border: "1px solid #1a2535" }}>
                          {addresses[selectedCrypto]}
                        </code>
                        <button onClick={() => { navigator.clipboard.writeText(addresses[selectedCrypto]); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{
                          background: copied ? "#22c55e" : "#00b4d8", border: "none",
                          borderRadius: 6, padding: "8px 12px", color: "#fff",
                          fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0,
                        }}>
                          {copied ? "✓" : "Copy"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Form */}
                  <div style={{ fontSize: 12, color: "#4a7a94", fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>YOUR DETAILS</div>
                  <input
                    placeholder="Your forum username"
                    value={buyerUsername}
                    onChange={e => setBuyerUsername(e.target.value)}
                    style={{ width: "100%", background: "#050a0f", border: "1px solid #1a2535", borderRadius: 6, padding: "10px 14px", color: "#c8dde8", fontSize: 13, outline: "none", marginBottom: 10, boxSizing: "border-box" as const }}
                  />
                  <input
                    placeholder="Transaction ID (TxID) after payment"
                    value={txid}
                    onChange={e => setTxid(e.target.value)}
                    style={{ width: "100%", background: "#050a0f", border: "1px solid #1a2535", borderRadius: 6, padding: "10px 14px", color: "#c8dde8", fontSize: 13, outline: "none", marginBottom: 16, boxSizing: "border-box" as const }}
                  />

                  {submitStatus === "error" && (
                    <div style={{ fontSize: 12, color: "#ef4444", marginBottom: 10 }}>
                      Please fill all fields and select crypto.
                    </div>
                  )}

                  <button onClick={handleBuy} disabled={submitting || !txid.trim() || !selectedCrypto} style={{
                    width: "100%", background: "linear-gradient(135deg, #00b4d8, #0077a8)",
                    border: "none", borderRadius: 8, padding: "12px 0",
                    color: "#fff", fontSize: 14, fontWeight: 700,
                    cursor: submitting ? "not-allowed" : "pointer",
                    opacity: submitting || !txid.trim() || !selectedCrypto ? 0.5 : 1,
                  }}>
                    {submitting ? "Submitting..." : "Confirm Purchase"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE MODAL (Admin) ── */}
      {createModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 500,
          background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        }} onClick={() => setCreateModal(false)}>
          <div style={{
            background: "#0a1520", border: "1px solid #6c63ff44",
            borderRadius: 14, width: "100%", maxWidth: 540,
            maxHeight: "90vh", overflowY: "auto",
          }} onClick={e => e.stopPropagation()}>

            <div style={{
              background: "linear-gradient(135deg, #6c63ff, #a855f7)",
              padding: "16px 20px", borderRadius: "14px 14px 0 0",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>✚ Create Vouch Listing</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>Admin Panel</div>
              </div>
              <button onClick={() => setCreateModal(false)} style={{
                background: "rgba(255,255,255,0.15)", border: "none",
                borderRadius: 6, width: 30, height: 30, color: "#fff",
                fontSize: 16, cursor: "pointer",
              }}>✕</button>
            </div>

            <div style={{ padding: "20px" }}>

              {/* Image Preview */}
              {newImageUrl && (
                <div style={{ marginBottom: 16, borderRadius: 8, overflow: "hidden", height: 140, position: "relative" }}>
                  <img src={newImageUrl} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 50%, #0a1520 100%)" }} />
                  <div style={{ position: "absolute", bottom: 8, left: 12, fontSize: 11, color: "rgba(255,255,255,0.7)" }}>Image Preview</div>
                </div>
              )}

              {/* Fields */}
              {[
                { label: "TITLE", val: newTitle, set: setNewTitle, placeholder: "e.g. Netflix Premium x10 Accounts" },
                { label: "IMAGE URL (optional)", val: newImageUrl, set: setNewImageUrl, placeholder: "https://..." },
                { label: "SUBCATEGORY", val: newSubcategory, set: setNewSubcategory, placeholder: "e.g. Streaming, Gaming..." },
              ].map(f => (
                <div key={f.label} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: "#4a7a94", fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>{f.label}</div>
                  <input
                    value={f.val}
                    onChange={e => f.set(e.target.value)}
                    placeholder={f.placeholder}
                    style={{ width: "100%", background: "#050a0f", border: "1px solid #1a2535", borderRadius: 6, padding: "10px 14px", color: "#c8dde8", fontSize: 13, outline: "none", boxSizing: "border-box" as const }}
                  />
                </div>
              ))}

              {/* Category */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: "#4a7a94", fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>CATEGORY</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {CATEGORIES.map(c => (
                    <button key={c} onClick={() => setNewCategory(c)} style={{
                      padding: "7px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none",
                      background: newCategory === c ? "#6c63ff" : "#050a0f",
                      color: newCategory === c ? "#fff" : "#9a9ca3",
                    }}>{c}</button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: "#4a7a94", fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>PRICE (USD)</div>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#00b4d8", fontWeight: 700 }}>$</span>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={e => setNewPrice(e.target.value)}
                    placeholder="0.00"
                    style={{ width: "100%", background: "#050a0f", border: "1px solid #1a2535", borderRadius: 6, padding: "10px 14px 10px 28px", color: "#c8dde8", fontSize: 13, outline: "none", boxSizing: "border-box" as const }}
                  />
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: "#4a7a94", fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>DESCRIPTION</div>
                <textarea
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Describe what the buyer gets..."
                  rows={4}
                  style={{ width: "100%", background: "#050a0f", border: "1px solid #1a2535", borderRadius: 6, padding: "10px 14px", color: "#c8dde8", fontSize: 13, outline: "none", resize: "vertical", fontFamily: "Inter, sans-serif", boxSizing: "border-box" as const }}
                />
              </div>

              {/* Recommended toggle */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <div onClick={() => setNewRecommended(v => !v)} style={{
                  width: 18, height: 18, borderRadius: 4,
                  border: `1.5px solid ${newRecommended ? "#22c55e" : "#4a7a94"}`,
                  background: newRecommended ? "#22c55e" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", flexShrink: 0,
                }}>
                  {newRecommended && <span style={{ color: "#fff", fontSize: 12 }}>✓</span>}
                </div>
                <span style={{ fontSize: 13, color: "#c8dde8" }}>Mark as Recommended ⭐</span>
              </div>

              <button onClick={handleCreate} disabled={creating || !newTitle.trim() || !newDesc.trim() || !newPrice} style={{
                width: "100%", background: "linear-gradient(135deg, #6c63ff, #a855f7)",
                border: "none", borderRadius: 8, padding: "12px 0",
                color: "#fff", fontSize: 14, fontWeight: 700,
                cursor: creating ? "not-allowed" : "pointer",
                opacity: creating || !newTitle.trim() || !newDesc.trim() || !newPrice ? 0.5 : 1,
              }}>
                {creating ? "Creating..." : "✚ Create Listing"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}