import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import Image from "next/image";
import { ContactForm } from "./components/ContactForm";

// ── Supabase anon client for public pages (no cookies needed) ──
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
  bio: string | null;
  slug: string;
  accent_color: string | null;
}

interface PublicPost {
  id: string;
  title: string | null;
  slug: string | null;
  content: string;
  image_url: string | null;
  meta_description: string | null;
  created_at: string;
}

// ── Metadata ──
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const supabase = getPublicSupabase();
  const { data: trainer } = await supabase
    .from("profiles")
    .select("full_name, business_name, specialty, bio, slug")
    .eq("slug", slug)
    .eq("role", "trainer")
    .single();

  if (!trainer) return { title: "Entrenador no encontrado" };

  const name = trainer.business_name ?? trainer.full_name ?? "Entrenador";
  const description = trainer.bio
    ? trainer.bio.slice(0, 155)
    : `Entrena con ${name}${trainer.specialty ? ` - ${trainer.specialty}` : ""}`;

  return {
    title: `${name} | Kuvox`,
    description,
    openGraph: {
      title: `${name} | Kuvox`,
      description,
      type: "profile",
    },
  };
}

export default async function TrainerLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = getPublicSupabase();

  // Fetch trainer profile first (needed for subsequent queries)
  const { data: trainerData, error: profileErr } = await supabase
    .from("profiles")
    .select("user_id, full_name, business_name, specialty, bio, slug, accent_color")
    .eq("slug", slug)
    .eq("role", "trainer")
    .single();

  if (profileErr || !trainerData) {
    notFound();
  }

  const trainer = trainerData as TrainerProfile;
  const accentColor = trainer.accent_color ?? "#00E5FF";

  // Fetch community + posts (community_id depends on trainer)
  const { data: community } = await supabase
    .from("communities")
    .select("id")
    .eq("coach_id", trainer.user_id)
    .single();

  let posts: PublicPost[] = [];
  if (community) {
    const { data: trainerPosts } = await supabase
      .from("community_posts")
      .select("id, title, slug, content, image_url, meta_description, created_at")
      .eq("community_id", community.id)
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(20);
    posts = (trainerPosts ?? []) as PublicPost[];
  }

  const displayName = trainer.business_name ?? trainer.full_name ?? "Entrenador";
  const initials = (trainer.full_name ?? "E")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      {/* ── Hero Section ── */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${accentColor}, transparent 70%)`,
          }}
        />

        <div className="relative mx-auto max-w-3xl px-4 pb-12 pt-16 sm:px-6 sm:pt-24">
          {/* Avatar */}
          <div className="flex justify-center">
            <div
              className="flex h-24 w-24 items-center justify-center rounded-full text-3xl font-black"
              style={{
                backgroundColor: `${accentColor}20`,
                color: accentColor,
                boxShadow: `0 0 40px ${accentColor}15`,
              }}
            >
              {initials}
            </div>
          </div>

          {/* Name & Specialty */}
          <div className="mt-6 text-center">
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              {displayName}
            </h1>
            {trainer.specialty && (
              <p
                className="mt-2 text-sm font-semibold uppercase tracking-[0.15em]"
                style={{ color: accentColor }}
              >
                {trainer.specialty}
              </p>
            )}
            {trainer.business_name && trainer.full_name && trainer.business_name !== trainer.full_name && (
              <p className="mt-1 text-sm text-[#8B8BA3]">{trainer.full_name}</p>
            )}
          </div>

          {/* Bio */}
          {trainer.bio && (
            <p className="mx-auto mt-6 max-w-xl text-center text-[15px] leading-relaxed text-[#8B8BA3]">
              {trainer.bio}
            </p>
          )}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <div className="space-y-10">
          {/* ── Public Articles ── */}
          {posts.length > 0 && (
            <section>
              <h2 className="mb-6 text-xs font-bold uppercase tracking-[0.3em] text-[#5A5A72]">
                Articulos
              </h2>
              <div className="space-y-4">
                {posts.map((post) => {
                  const postHref = post.slug
                    ? `/t/${slug}/${post.slug}`
                    : null;
                  const excerpt = post.meta_description
                    ?? post.content.slice(0, 120) + (post.content.length > 120 ? "..." : "");
                  const dateStr = new Date(post.created_at).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });

                  const Card = (
                    <div className="group rounded-2xl border border-white/[0.06] bg-[#12121A] p-5 transition-colors hover:border-white/[0.12]">
                      <div className="flex gap-4">
                        {post.image_url && (
                          <div className="hidden sm:block">
                            <Image
                              src={post.image_url}
                              alt=""
                              width={80}
                              height={80}
                              className="h-20 w-20 rounded-xl object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold text-white group-hover:text-[#00E5FF] transition-colors line-clamp-2">
                            {post.title ?? "Sin titulo"}
                          </h3>
                          <p className="mt-1.5 text-sm text-[#8B8BA3] line-clamp-2">{excerpt}</p>
                          <p className="mt-2 text-xs text-[#5A5A72]">{dateStr}</p>
                        </div>
                      </div>
                    </div>
                  );

                  return postHref ? (
                    <Link key={post.id} href={postHref} className="block">
                      {Card}
                    </Link>
                  ) : (
                    <div key={post.id}>{Card}</div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Contact Form ── */}
          <section>
            <h2 className="mb-6 text-xs font-bold uppercase tracking-[0.3em] text-[#5A5A72]">
              Contacto
            </h2>
            <ContactForm
              trainerId={trainer.user_id}
              trainerName={trainer.full_name ?? displayName}
              accentColor={accentColor}
            />
          </section>
        </div>
      </div>

      {/* ── Powered by badge ── */}
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
