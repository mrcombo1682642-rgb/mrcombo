 import PremiumPageClient from "@/components/PremiumPageClient";

export default async function Page({
  params,
}: {
  params: Promise<{ subcategory: string }>;
}) {
  const { subcategory } = await params;
  return <PremiumPageClient subcategory={subcategory} />;
}
