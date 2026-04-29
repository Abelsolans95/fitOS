import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import Image from "next/image";

// ── Supabase anon client for public pages ──
function getPublicSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

interface TrainerProfile {
  user_id: string;
  full_name: string | null;
  business_name: string | null;
  specialty: string | null;
  slug: string;
  accent_color: string | null;
}

interface PublicPost {
  id: string;
  community_id: string;
  title: string | null;
  slug: string | null;
  content: string;
  image_url: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string | null;
}

// ── Metadata ──
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string; post_slug: string }> }
): Promise<Metadata> {
  const { slug, post_slug } = await params;
  const supabase = getPublicSupabase();

  const { data: trainer } = await supabase
    .from("profiles")
    .select("user_id, full_name, business_name, slug")
    .eq("slug", slug)
    .eq("role", "trainer")
    .single();

  if (!trainer) return { title: "No encontrado" };

  // Get community for this trainer
  const { data: community } = await supabase
    .from("communities")
    .select("id")
    .eq("coach_id", trainer.user_id)
    .single();

  if (!community) return { title: "No encontrado" };

  const { data: post } = await supabase
    .from("community_posts")
    .select("title, meta_description, content, image_url")
    .eq("community_id", community.id)
    .eq("slug", post_slug)
    .eq("is_public", true)
    .single();

  if (!post) return { title: "No encontrado" };

  const authorName = trainer.business_name ?? trainer.full_name ?? "Entrenador";
  const title = post.title ?? "Articulo";
  const description = post.meta_description ?? post.content.slice(0, 155);

  return {
    title: `${title} | ${authorName}`,
    description,
    openGraph: {
      title: `${title} | ${authorName}`,
      description,
      type: "article",
      ...(post.image_url ? { images: [{ url: post.image_url }] } : {}),
    },
  };
}

export default async function PublicArticlePage({
  params,
}: {
  params: Promise<{ slug: string; post_slug: string }>;
}) {
  const { slug, post_slug } = await params;
  const supabase = getPublicSupabase();

  // Fetch trainer profile
  const { data: trainer, error: trainerError } = await supabase
    .from("profiles")
    .select("user_id, full_name, business_name, specialty, slug, accent_color")
    .eq("slug", slug)
    .eq("role", "trainer")
    .single();

  if (trainerError || !trainer) {
    notFound();
  }

  const trainerData = trainer as TrainerProfile;
  const accentColor = trainerData.accent_color ?? "#00E5FF";

  // Get community for this trainer
  const { data: community } = await supabase
    .from("communities")
    .select("id")
    .eq("coach_id", trainerData.user_id)
    .single();

  if (!community) {
    notFound();
  }

  // Fetch the specific post + other posts in parallel
  const [postRes, otherPostsRes] = await Promise.all([
    supabase
      .from("community_posts")
      .select("id, community_id, title, slug, content, image_url, meta_description, created_at, updated_at")
      .eq("community_id", community.id)
      .eq("slug", post_slug)
      .eq("is_public", true)
      .single(),
    supabase
      .from("community_posts")
      .select("id, title, slug, content, meta_description, created_at")
      .eq("community_id", community.id)
      .eq("is_public", true)
      .neq("slug", post_slug)
      .order("created_at", { ascending: false })
      .limit(4),
  ]);

  if (postRes.error || !postRes.data) {
    notFound();
  }

  const post = postRes.data as PublicPost;
  const otherPosts = (otherPostsRes.data ?? []) as PublicPost[];
  const displayName = trainerData.business_name ?? trainerData.full_name ?? "Entrenador";

  const dateStr = new Date(post.created_at).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Schema markup
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title ?? "Articulo",
    description: post.meta_description ?? post.content.slice(0, 155),
    datePublished: post.created_at,
    dateModified: post.updated_at ?? post.created_at,
    author: {
      "@type": "Person",
      name: trainerData.full_name ?? displayName,
    },
    publisher: {
      "@type": "Organization",
      name: "Kuvox",
    },
    ...(post.image_url ? { image: post.image_url } : {}),
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema).replace(/</g, "\\u003c") }}
      />

      {/* ── Header / Back nav ── */}
      <div className="border-b border-white/[0.04]">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4 sm:px-6">
          <Link
            href={`/t/${slug}`}
            className="flex items-center gap-2 text-sm text-[#8B8BA3] transition-colors hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            {displayName}
          </Link>
        </div>
      </div>

      {/* ── Article ── */}
      <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        {/* Title */}
        <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">
          {post.title ?? "Sin titulo"}
        </h1>

        {/* Author / Date */}
        <div className="mt-4 flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
            style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
          >
            {(trainerData.full_name ?? "E").charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{displayName}</p>
            <p className="text-xs text-[#5A5A72]">{dateStr}</p>
          </div>
        </div>

        {/* Hero image */}
        {post.image_url && (
          <div className="relative mt-8 aspect-video overflow-hidden rounded-2xl border border-white/10">
            <Image
              src={post.image_url}
              alt={post.title ?? "Imagen del articulo"}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 700px"
            />
          </div>
        )}

        {/* Content */}
        <div className="mt-8 whitespace-pre-wrap text-[15px] leading-relaxed text-[#C4C4D4]">
          {post.content}
        </div>

        {/* ── CTA ── */}
        <div
          className="mt-12 rounded-2xl border p-6 text-center sm:p-8"
          style={{
            borderColor: `${accentColor}20`,
            background: `${accentColor}08`,
          }}
        >
          <h2 className="text-lg font-bold text-white">
            Quieres entrenar con {displayName}?
          </h2>
          <p className="mt-2 text-sm text-[#8B8BA3]">
            Contacta directamente y empieza tu transformacion
          </p>
          <Link
            href={`/t/${slug}#contacto`}
            className="mt-4 inline-block rounded-xl px-6 py-2.5 text-sm font-bold transition-all"
            style={{ backgroundColor: accentColor, color: "#0A0A0F" }}
          >
            Contactar
          </Link>
        </div>
      </article>

      {/* ── More articles ── */}
      {otherPosts.length > 0 && (
        <section className="border-t border-white/[0.04] py-12">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="mb-6 text-xs font-bold uppercase tracking-[0.3em] text-[#5A5A72]">
              Mas articulos de {displayName}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {otherPosts.map((p) => {
                const excerpt = p.meta_description ?? p.content.slice(0, 100) + (p.content.length > 100 ? "..." : "");
                const pDate = new Date(p.created_at).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "short",
                });
                const href = p.slug ? `/t/${slug}/${p.slug}` : null;

                const Card = (
                  <div className="group rounded-2xl border border-white/10 bg-[#12121A] p-4 transition-colors hover:border-white/[0.12]">
                    <h3 className="text-sm font-bold text-white group-hover:text-[#00E5FF] transition-colors line-clamp-2">
                      {p.title ?? "Sin titulo"}
                    </h3>
                    <p className="mt-1.5 text-xs text-[#8B8BA3] line-clamp-2">{excerpt}</p>
                    <p className="mt-2 text-[10px] text-[#5A5A72]">{pDate}</p>
                  </div>
                );

                return href ? (
                  <Link key={p.id} href={href} className="block">
                    {Card}
                  </Link>
                ) : (
                  <div key={p.id}>{Card}</div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.04] py-8 text-center">
        <a
          href="https://kuvox.io"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-[#5A5A72] transition-colors hover:text-[#8B8BA3]"
        >
          Powered by
          <span className="font-bold text-[#00E5FF]">Kuvox</span>
        </a>
      </footer>
    </div>
  );
}
