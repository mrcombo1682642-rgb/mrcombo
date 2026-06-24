"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footbar";

export default function ProfilePage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    setEmail(user.email || "");

    const { data } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();

    if (data) {
      setUsername(data.username);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050a0f",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Navbar />

      <div
        style={{
          flex: 1,
          paddingTop: 120,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 500,
            background: "#0a1520",
            border: "1px solid #0d2030",
            borderRadius: 12,
            padding: 30,
          }}
        >
          <h1
            style={{
              color: "#e0f0ff",
              marginBottom: 20,
            }}
          >
            My Profile
          </h1>

          <p style={{ color: "#c8dde8", marginBottom: 10 }}>
            Username: {username}
          </p>

          <p style={{ color: "#c8dde8", marginBottom: 25 }}>
            Email: {email}
          </p>

          <button
            onClick={logout}
            style={{
              background: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "10px 20px",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}