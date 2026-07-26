"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DailyLimitBadge() {
  const [usage, setUsage] = useState<{ used: number; limit_count: number; is_unlimited: boolean } | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("get_daily_post_usage");
      if (!cancelled && !error && data && data[0]) {
        setUsage(data[0]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!usage || usage.is_unlimited) return null;

  const remaining = Math.max(0, usage.limit_count - usage.used);
  const isLow = remaining <= 3;

  return (
    <div className={`daily-limit-badge ${isLow ? "low" : ""}`}>
      <span className="daily-limit-icon">{isLow ? "⚠️" : "📝"}</span>
      <span>
        {remaining} / {usage.limit_count} posts left today
      </span>

      <style jsx>{`
        .daily-limit-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 999px;
          padding: 5px 12px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.65);
        }
        .daily-limit-badge.low {
          background: rgba(239, 68, 68, 0.08);
          border-color: rgba(239, 68, 68, 0.25);
          color: #ff8080;
        }
        .daily-limit-icon {
          font-size: 12px;
        }
      `}</style>
    </div>
  );
}