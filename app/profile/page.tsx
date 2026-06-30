"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function Page() {
  useEffect(() => {
    async function redirect() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        window.location.href = "/login";
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", data.user.id)
        .single();

      if (profile?.username) {
        window.location.href = `/profile/${profile.username}`;
      } else {
        window.location.href = "/login";
      }
    }
    redirect();
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#050a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#4a7a94" }}>
      Loading your profile...
    </div>
  );
}