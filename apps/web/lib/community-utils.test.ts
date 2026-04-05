import { describe, it, expect } from "vitest";
import {
  buildCommentTree,
  updateCommentInTree,
  removeCommentFromTree,
  addReplyToTree,
  buildCountMap,
  resolveAuthorName,
} from "./community-utils";

// Simple test type matching TreeComment constraints
interface TestComment {
  id: string;
  parent_id?: string | null;
  replies: TestComment[];
  text?: string;
}

function makeComment(
  id: string,
  parent_id: string | null = null,
  text = ""
): TestComment {
  return { id, parent_id, replies: [], text };
}

describe("buildCommentTree", () => {
  it("returns flat comments as roots when no parent_id", () => {
    const flat = [makeComment("a"), makeComment("b"), makeComment("c")];
    const tree = buildCommentTree(flat);
    expect(tree).toHaveLength(3);
    expect(tree.map((c) => c.id)).toEqual(["a", "b", "c"]);
  });

  it("nests children under their parent", () => {
    const flat = [
      makeComment("root1"),
      makeComment("child1", "root1"),
      makeComment("child2", "root1"),
    ];
    const tree = buildCommentTree(flat);
    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe("root1");
    expect(tree[0].replies).toHaveLength(2);
    expect(tree[0].replies.map((r) => r.id)).toEqual(["child1", "child2"]);
  });

  it("handles deeply nested comments", () => {
    const flat = [
      makeComment("root"),
      makeComment("child", "root"),
      makeComment("grandchild", "child"),
    ];
    const tree = buildCommentTree(flat);
    expect(tree).toHaveLength(1);
    expect(tree[0].replies[0].replies[0].id).toBe("grandchild");
  });

  it("treats orphaned comments (parent_id to non-existent) as roots", () => {
    const flat = [
      makeComment("a"),
      makeComment("orphan", "deleted-parent"),
    ];
    const tree = buildCommentTree(flat);
    expect(tree).toHaveLength(2);
    expect(tree.map((c) => c.id)).toEqual(["a", "orphan"]);
  });

  it("returns empty array for empty input", () => {
    expect(buildCommentTree([])).toEqual([]);
  });
});

describe("updateCommentInTree", () => {
  it("updates a root-level comment", () => {
    const tree: TestComment[] = [
      makeComment("a", null, "old"),
      makeComment("b"),
    ];
    const result = updateCommentInTree(tree, "a", (c) => ({
      ...c,
      text: "new",
    }));
    expect(result[0].text).toBe("new");
    expect(result[1].text).toBe("");
  });

  it("updates a nested reply", () => {
    const tree: TestComment[] = [
      {
        id: "root",
        parent_id: null,
        replies: [{ id: "child", parent_id: "root", replies: [], text: "old" }],
        text: "root-text",
      },
    ];
    const result = updateCommentInTree(tree, "child", (c) => ({
      ...c,
      text: "updated",
    }));
    expect(result[0].replies[0].text).toBe("updated");
    expect(result[0].text).toBe("root-text");
  });

  it("returns tree unchanged if id not found", () => {
    const tree = [makeComment("a")];
    const result = updateCommentInTree(tree, "nonexistent", (c) => ({
      ...c,
      text: "x",
    }));
    expect(result).toEqual(tree);
  });
});

describe("removeCommentFromTree", () => {
  it("removes a root-level comment", () => {
    const tree = [makeComment("a"), makeComment("b"), makeComment("c")];
    const result = removeCommentFromTree(tree, "b");
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.id)).toEqual(["a", "c"]);
  });

  it("removes a nested comment", () => {
    const tree: TestComment[] = [
      {
        id: "root",
        parent_id: null,
        replies: [
          { id: "keep", parent_id: "root", replies: [] },
          { id: "remove", parent_id: "root", replies: [] },
        ],
      },
    ];
    const result = removeCommentFromTree(tree, "remove");
    expect(result[0].replies).toHaveLength(1);
    expect(result[0].replies[0].id).toBe("keep");
  });

  it("returns tree unchanged if id not found", () => {
    const tree = [makeComment("a")];
    const result = removeCommentFromTree(tree, "nonexistent");
    expect(result).toEqual(tree);
  });

  it("handles empty tree", () => {
    expect(removeCommentFromTree([], "x")).toEqual([]);
  });
});

describe("addReplyToTree", () => {
  it("adds a reply to a root comment", () => {
    const tree = [makeComment("root")];
    const reply = makeComment("reply", "root");
    const result = addReplyToTree(tree, "root", reply);
    expect(result[0].replies).toHaveLength(1);
    expect(result[0].replies[0].id).toBe("reply");
  });

  it("adds a reply to a nested comment", () => {
    const tree: TestComment[] = [
      {
        id: "root",
        parent_id: null,
        replies: [{ id: "child", parent_id: "root", replies: [] }],
      },
    ];
    const reply = makeComment("grandchild", "child");
    const result = addReplyToTree(tree, "child", reply);
    expect(result[0].replies[0].replies).toHaveLength(1);
    expect(result[0].replies[0].replies[0].id).toBe("grandchild");
  });

  it("appends to existing replies without overwriting", () => {
    const tree: TestComment[] = [
      {
        id: "root",
        parent_id: null,
        replies: [{ id: "existing", parent_id: "root", replies: [] }],
      },
    ];
    const reply = makeComment("new", "root");
    const result = addReplyToTree(tree, "root", reply);
    expect(result[0].replies).toHaveLength(2);
    expect(result[0].replies[0].id).toBe("existing");
    expect(result[0].replies[1].id).toBe("new");
  });

  it("returns tree unchanged if parentId not found", () => {
    const tree = [makeComment("a")];
    const reply = makeComment("r", "nonexistent");
    const result = addReplyToTree(tree, "nonexistent", reply);
    // parent not found, no change
    expect(result[0].replies).toHaveLength(0);
  });
});

describe("buildCountMap", () => {
  it("counts items grouped by key", () => {
    const items = [
      { post_id: "p1" },
      { post_id: "p1" },
      { post_id: "p2" },
      { post_id: "p1" },
    ];
    const map = buildCountMap(items, (i) => i.post_id);
    expect(map.get("p1")).toBe(3);
    expect(map.get("p2")).toBe(1);
  });

  it("returns empty map for empty input", () => {
    const map = buildCountMap([], (i: { id: string }) => i.id);
    expect(map.size).toBe(0);
  });

  it("handles single item", () => {
    const map = buildCountMap([{ k: "x" }], (i) => i.k);
    expect(map.get("x")).toBe(1);
  });
});

describe("resolveAuthorName", () => {
  it("returns full_name for a client profile", () => {
    const profile = { role: "client", full_name: "Juan", business_name: null };
    expect(resolveAuthorName(profile)).toBe("Juan");
  });

  it("returns business_name for a trainer profile", () => {
    const profile = {
      role: "trainer",
      business_name: "FitGym Pro",
      full_name: "Carlos",
    };
    expect(resolveAuthorName(profile)).toBe("FitGym Pro");
  });

  it("falls back to full_name for trainer without business_name", () => {
    const profile = { role: "trainer", business_name: null, full_name: "Carlos" };
    expect(resolveAuthorName(profile)).toBe("Carlos");
  });

  it("returns 'Coach' for trainer with no names", () => {
    const profile = { role: "trainer", business_name: null, full_name: null };
    expect(resolveAuthorName(profile)).toBe("Coach");
  });

  it("returns default fallback for undefined profile", () => {
    expect(resolveAuthorName(undefined)).toBe("Cliente");
  });

  it("returns custom fallback for undefined profile", () => {
    expect(resolveAuthorName(undefined, "Anon")).toBe("Anon");
  });

  it("returns fallback for client profile with no full_name", () => {
    const profile = { role: "client", full_name: null };
    expect(resolveAuthorName(profile)).toBe("Cliente");
  });
});
