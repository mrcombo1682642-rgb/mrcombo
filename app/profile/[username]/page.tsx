import ProfilePageClient from "@/components/ProfilePageClient";

export default async function Page({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return <ProfilePageClient targetUsername={username} />;
}