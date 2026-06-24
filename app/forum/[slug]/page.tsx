import ForumCategoryPage from "@/components/ForumCategoryPage";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return <ForumCategoryPage slug={slug} />;
}