import SubcategoryPageClient from "@/components/SubcategoryPageClient";

export default async function Page({
  params,
}: {
  params: Promise<{
    slug: string;
    subcategory: string;
  }>;
}) {
  const { slug, subcategory } = await params;

  return (
    <SubcategoryPageClient
      slug={slug}
      subcategory={subcategory}
    />
  );
}