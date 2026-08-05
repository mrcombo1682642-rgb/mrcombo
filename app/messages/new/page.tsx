// File location in your project: app/messages/new/page.tsx
// This is the route your profile page's "💬 Message" button already
// links to: /messages/new?to=username
// It renders the exact same component as /messages — MessagesClient
// reads the ?to= param itself and opens/creates that conversation.

import { Suspense } from "react";
import MessagesClient from "@/components/MessagesClient"; // adjust path to wherever you place MessagesClient.tsx

export default function NewMessagePage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-400">Loading…</div>}>
      <MessagesClient />
    </Suspense>
  );
}