import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet,
  ActivityIndicator, FlatList, Linking,
} from "react-native";
import { supabase } from "../lib/supabase";
import { colors, spacing, radius, fonts } from "../theme";
import type { KnowledgeCategory, KnowledgeArticle } from "@fitos/shared";
import { KNOWLEDGE_CATEGORIES } from "@fitos/shared";

// ── Category colors ──

const CATEGORY_COLORS: Record<KnowledgeCategory, string> = {
  nutricion: colors.success,
  rutina: colors.cyan,
  lesion: colors.error,
  tecnica: colors.orange,
  suplementacion: colors.violet,
  general: colors.muted,
};

type ScreenView = "list" | "detail";

export default function KnowledgeScreen() {
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [view, setView] = useState<ScreenView>("list");
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<KnowledgeCategory | "all">("all");

  // ── Load articles ──
  const loadArticles = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: rel } = await supabase
      .from("trainer_clients")
      .select("trainer_id")
      .eq("client_id", user.id)
      .eq("status", "active")
      .single();

    if (!rel) { setLoading(false); return; }

    const { data, error } = await supabase
      .from("knowledge_articles")
      .select("id, trainer_id, title, content, category, image_url, video_url, is_published, view_count, source_ticket_id, created_at, updated_at")
      .eq("trainer_id", rel.trainer_id)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[KnowledgeScreen] Error loading articles:", error);
    }

    setArticles((data as KnowledgeArticle[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  // ── Select article ──
  const handleSelectArticle = useCallback((articleId: string) => {
    setSelectedArticleId(articleId);
    setView("detail");
    // Fire-and-forget view increment
    supabase.rpc("increment_article_view", { article_id: articleId }).then(({ error }) => {
      if (error) console.error("[KnowledgeScreen] Error incrementing view:", error); // No bloqueante
    });
  }, []);

  // ── Filtering ──
  const filteredArticles = articles.filter((a) => {
    if (filterCategory !== "all" && a.category !== filterCategory) return false;
    if (searchQuery.length >= 2) {
      const q = searchQuery.toLowerCase();
      return a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q);
    }
    return true;
  });

  // ── Helpers ──
  const selectedArticle = articles.find((a) => a.id === selectedArticleId);

  const timeAgo = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "ahora";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  // ── Loading ──
  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.cyan} />
      </View>
    );
  }

  // ── DETAIL VIEW ──
  if (view === "detail" && selectedArticle) {
    return (
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => { setView("list"); setSelectedArticleId(null); }} style={s.backBtn}>
            <Text style={s.backText}>{"\u2190"} Volver</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={s.content} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={s.articleCard}>
            {/* Meta */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <View style={[s.badge, { backgroundColor: `${CATEGORY_COLORS[selectedArticle.category]}20` }]}>
                <Text style={[s.badgeText, { color: CATEGORY_COLORS[selectedArticle.category] }]}>
                  {KNOWLEDGE_CATEGORIES.find((c) => c.value === selectedArticle.category)?.label}
                </Text>
              </View>
              <Text style={s.timeText}>{timeAgo(selectedArticle.created_at)}</Text>
              <Text style={s.timeText}>{"\u00B7"}</Text>
              <Text style={s.timeText}>{selectedArticle.view_count} vistas</Text>
            </View>

            {/* Title */}
            <Text style={s.articleTitle}>{selectedArticle.title}</Text>

            {/* Video link */}
            {selectedArticle.video_url && (
              <TouchableOpacity
                style={s.videoLink}
                onPress={() => Linking.openURL(selectedArticle.video_url!)}
              >
                <Text style={s.videoLinkText}>{"\u25B6"} Ver video</Text>
              </TouchableOpacity>
            )}

            {/* Content */}
            <Text style={s.articleContent}>{selectedArticle.content}</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── LIST VIEW ──
  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Conocimiento</Text>
          <Text style={s.subtitle}>Art{"\u00ED"}culos y gu{"\u00ED"}as de tu entrenador</Text>
        </View>
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.sm }}>
        <TextInput
          style={s.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar art\u00EDculos..."
          placeholderTextColor={colors.dimmed}
        />
      </View>

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.md, gap: 8, paddingBottom: spacing.sm }}
      >
        <TouchableOpacity
          style={[s.filterChip, filterCategory === "all" && s.filterChipActive]}
          onPress={() => setFilterCategory("all")}
        >
          <Text style={[s.filterChipText, filterCategory === "all" && s.filterChipTextActive]}>
            Todos
          </Text>
        </TouchableOpacity>
        {KNOWLEDGE_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.value}
            style={[s.filterChip, filterCategory === cat.value && s.filterChipActive]}
            onPress={() => setFilterCategory(cat.value)}
          >
            <Text style={[s.filterChipText, filterCategory === cat.value && s.filterChipTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Articles */}
      {filteredArticles.length === 0 ? (
        <View style={s.emptyContainer}>
          <Text style={s.emptyText}>
            {searchQuery
              ? "No hay art\u00EDculos que coincidan"
              : "Tu entrenador a\u00FAn no ha publicado art\u00EDculos"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredArticles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.md }}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.articleListCard} onPress={() => handleSelectArticle(item.id)}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <View style={[s.badge, { backgroundColor: `${CATEGORY_COLORS[item.category]}20` }]}>
                  <Text style={[s.badgeText, { color: CATEGORY_COLORS[item.category] }]}>
                    {KNOWLEDGE_CATEGORIES.find((c) => c.value === item.category)?.label}
                  </Text>
                </View>
                {item.video_url && (
                  <View style={[s.badge, { backgroundColor: `${colors.cyan}20` }]}>
                    <Text style={[s.badgeText, { color: colors.cyan }]}>Video</Text>
                  </View>
                )}
              </View>
              <Text style={s.listTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={s.listContent} numberOfLines={3}>{item.content}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }}>
                <Text style={s.timeText}>{timeAgo(item.created_at)}</Text>
                <Text style={s.timeText}>{"\u00B7"}</Text>
                <Text style={s.timeText}>{item.view_count} vistas</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

// ── Styles ──

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md,
    paddingTop: spacing.xl + 20, paddingBottom: spacing.md,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)",
  },
  backBtn: { marginRight: 12 },
  backText: { color: colors.cyan, fontSize: 14, fontFamily: fonts.semibold },
  title: { color: "#fff", fontSize: 20, fontFamily: fonts.extrabold, letterSpacing: -0.5 },
  subtitle: { color: colors.dimmed, fontSize: 12, fontFamily: fonts.medium, marginTop: 2 },
  content: { flex: 1, padding: spacing.md },

  // Search
  searchInput: {
    backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 14,
    fontFamily: fonts.regular, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
  },

  // Filter chips
  filterChip: {
    borderRadius: radius.md, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 12, paddingVertical: 6,
  },
  filterChipActive: {
    borderColor: `${colors.cyan}50`, backgroundColor: `${colors.cyan}15`,
  },
  filterChipText: { color: colors.dimmed, fontSize: 12, fontFamily: fonts.semibold },
  filterChipTextActive: { color: colors.cyan },

  // List card
  articleListCard: {
    backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)", padding: spacing.md, marginBottom: spacing.sm,
  },
  listTitle: { color: "#fff", fontSize: 14, fontFamily: fonts.bold },
  listContent: { color: colors.muted, fontSize: 12, fontFamily: fonts.regular, marginTop: 4, lineHeight: 18 },

  // Detail card
  articleCard: {
    backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)", padding: spacing.md,
  },
  articleTitle: { color: "#fff", fontSize: 18, fontFamily: fonts.extrabold, letterSpacing: -0.3, marginBottom: 16 },
  articleContent: { color: colors.muted, fontSize: 14, fontFamily: fonts.regular, lineHeight: 22 },

  // Video link
  videoLink: {
    borderRadius: radius.lg, borderWidth: 1, borderColor: `${colors.cyan}30`,
    backgroundColor: `${colors.cyan}10`, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    marginBottom: 16, alignSelf: "flex-start",
  },
  videoLinkText: { color: colors.cyan, fontSize: 14, fontFamily: fonts.semibold },

  // Badges
  badge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontFamily: fonts.bold },
  timeText: { color: colors.dimmed, fontSize: 10, fontFamily: fonts.regular },

  // Empty
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: spacing.xl },
  emptyText: { color: colors.dimmed, fontSize: 14, fontFamily: fonts.medium, textAlign: "center" },
});
