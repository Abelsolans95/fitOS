import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kuvox.io";

  // Fetch public trainer profiles and public posts in parallel
  const [trainersRes, postsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("slug, updated_at")
      .eq("role", "trainer")
      .not("slug", "is", null)
      .limit(1000),
    supabase
      .from("community_posts")
      .select("slug, updated_at, community_id")
      .eq("is_public", true)
      .not("slug", "is", null)
      .limit(5000),
  ]);

  const trainers = trainersRes.data ?? [];
  const posts = postsRes.data ?? [];

  // For posts we need to map community_id -> trainer slug
  // Get all communities for the trainers
  const communityIds = [...new Set(posts.map((p) => p.community_id))];
  let communityToSlug: Map<string, string> = new Map();

  if (communityIds.length > 0) {
    const { data: communities } = await supabase
      .from("communities")
      .select("id, coach_id")
      .in("id", communityIds);

    if (communities) {
      const coachIds = [...new Set(communities.map((c) => c.coach_id))];
      const { data: coachProfiles } = await supabase
        .from("profiles")
        .select("user_id, slug")
        .in("user_id", coachIds)
        .not("slug", "is", null);

      const coachSlugMap = new Map(
        (coachProfiles ?? []).map((p) => [p.user_id, p.slug as string])
      );

      for (const c of communities) {
        const slug = coachSlugMap.get(c.coach_id);
        if (slug) communityToSlug.set(c.id, slug);
      }
    }
  }

  const entries: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
  ];

  // Trainer landing pages
  for (const t of trainers) {
    entries.push({
      url: `${baseUrl}/t/${t.slug}`,
      lastModified: t.updated_at ? new Date(t.updated_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  // Public blog posts
  for (const p of posts) {
    const trainerSlug = communityToSlug.get(p.community_id);
    if (trainerSlug && p.slug) {
      entries.push({
        url: `${baseUrl}/t/${trainerSlug}/${p.slug}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }

  return entries;
}
