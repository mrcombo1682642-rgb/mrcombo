 import MarketplacePageClient from "@/components/MarketplacePageClient";

export default async function Page({
  params,
}: {
  params: Promise<{ subcategory: string }>;
}) {
  const { subcategory } = await params;
  return <MarketplacePageClient subcategory={subcategory} />;
}