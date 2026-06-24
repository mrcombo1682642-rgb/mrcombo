 import GamingPageClient from "@/components/GamingPageClient";

export default async function Page({
  params,
}: {
  params: Promise<{ subcategory: string }>;
}) {
  const { subcategory } = await params;
  return <GamingPageClient subcategory={subcategory} />;
}
