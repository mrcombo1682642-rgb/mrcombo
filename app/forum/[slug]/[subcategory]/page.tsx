import { createClient } from "@supabase/supabase-js";
import ServiceListPageClient from "@/components/ServiceListPageClient";
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

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data } = await supabase
    .from("forum_services")
    .select("id")
    .eq("category", slug)
    .eq("subcategory", subcategory)
    .limit(1);

  const hasServices = data && data.length > 0;

  if (hasServices) {
    return <ServiceListPageClient slug={slug} subcategory={subcategory} />;
  }

  return <SubcategoryPageClient slug={slug} subcategory={subcategory} />;
}