import AnnouncementPageClient from "@/components/AnnouncementPageClient";

export default async function Page({
  params,
}: {
  params: Promise<{ subcategory: string }>;
}) {
  const { subcategory } = await params;
  return <AnnouncementPageClient subcategory={subcategory} />;
}