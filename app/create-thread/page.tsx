import { Suspense } from "react";
import CreateThreadPage from "@/components/CreateThreadPage";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateThreadPage />
    </Suspense>
  );
}