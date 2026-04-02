/**
 * Shared utilities for community comment tree manipulation.
 * Used by both trainer (useCommunityPage) and client (useClientCommunityPage).
 */

/** Minimal comment interface for tree operations */
interface TreeComment {
  id: string;
  parent_id?: string | null;
  replies?: TreeComment[];
}

/**
 * Recursively update a comment in a nested tree by ID.
 */
export function updateCommentInTree<T extends TreeComment>(
  comments: T[],
  commentId: string,
  updater: (c: T) => T
): T[] {
  return comments.map((c) => {
    if (c.id === commentId) return updater(c);
    if ((c.replies as T[] | undefined)?.length) {
      return { ...c, replies: updateCommentInTree(c.replies as T[], commentId, updater) };
    }
    return c;
  });
}

/**
 * Recursively remove a comment from a nested tree by ID.
 */
export function removeCommentFromTree<T extends TreeComment>(
  comments: T[],
  commentId: string
): T[] {
  return comments
    .filter((c) => c.id !== commentId)
    .map((c) => {
      if ((c.replies as T[] | undefined)?.length) {
        return { ...c, replies: removeCommentFromTree(c.replies as T[], commentId) };
      }
      return c;
    });
}

/**
 * Recursively add a reply to a parent comment in a nested tree.
 */
export function addReplyToTree<T extends TreeComment>(
  comments: T[],
  parentId: string,
  reply: T
): T[] {
  return comments.map((c) => {
    if (c.id === parentId) {
      return { ...c, replies: [...((c.replies as T[]) ?? []), reply] };
    }
    if ((c.replies as T[] | undefined)?.length) {
      return { ...c, replies: addReplyToTree(c.replies as T[], parentId, reply) };
    }
    return c;
  });
}

/**
 * Build a comment tree from a flat list using parent_id relationships.
 */
export function buildCommentTree<T extends TreeComment & { replies: T[] }>(
  flatComments: T[]
): T[] {
  const map = new Map<string, T>();
  flatComments.forEach((c) => map.set(c.id, c));

  const roots: T[] = [];
  flatComments.forEach((c) => {
    if (c.parent_id && map.has(c.parent_id)) {
      const parent = map.get(c.parent_id)!;
      parent.replies = [...parent.replies, c];
    } else {
      roots.push(c);
    }
  });
  return roots;
}

/**
 * Build a Map of counts from an array, grouped by a key field.
 * Avoids O(n*m) filtering when enriching posts with likes/comments.
 */
export function buildCountMap<T>(
  items: T[],
  keyFn: (item: T) => string
): Map<string, number> {
  const map = new Map<string, number>();
  for (const item of items) {
    const key = keyFn(item);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

/**
 * Resolve author display name from a profile.
 */
export function resolveAuthorName(
  profile: { role?: string; business_name?: string | null; full_name?: string | null } | undefined,
  fallbackClient = "Cliente"
): string {
  if (!profile) return fallbackClient;
  if (profile.role === "trainer") return profile.business_name ?? profile.full_name ?? "Coach";
  return profile.full_name ?? fallbackClient;
}
