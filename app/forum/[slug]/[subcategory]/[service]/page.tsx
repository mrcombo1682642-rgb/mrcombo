import SubcategoryPageClient from "@/components/SubcategoryPageClient";

export default async function Page({
  params,
}: {
  params: Promise<{
    slug: string;
    subcategory: string;
    service: string;
  }>;
}) {
  const { slug, service } = await params;

  return (
    <SubcategoryPageClient
      slug={slug}
      subcategory={service}
    />
  );
}