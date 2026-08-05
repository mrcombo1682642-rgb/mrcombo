// File location in your project: app/messages/page.tsx

import { Suspense } from "react";
import MessagesClient from "@/components/MessagesClient"; // adjust path to wherever you place MessagesClient.tsx

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-400">Loading…</div>}>
      <MessagesClient />
    </Suspense>
  );
}