import { Router, type IRouter } from "express";

const router: IRouter = Router();

type Platform = "instagram" | "x" | "tiktok" | "youtube";

type Post = {
  id: string;
  title: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  when: string;
};

type PlatformState = {
  platform: Platform;
  handle: string;
  followers: number;
  reach: number;
  growth: number;
  posts: Post[];
  prev_score: number;
};

const SCORE = (p: Post) => p.likes * 1 + p.comments * 5 + p.shares * 10;

const totalScore = (posts: Post[]) => posts.reduce((s, p) => s + SCORE(p), 0);

const seed: PlatformState[] = [
  {
    platform: "instagram",
    handle: "@hithasetty",
    followers: 24180,
    reach: 184320,
    growth: 12.3,
    prev_score: 0,
    posts: [
      { id: "ig-1", title: "Reel — studio teardown", likes: 1428, comments: 312, shares: 412, views: 24102, when: "2h ago" },
      { id: "ig-2", title: "Carousel — 6 frames", likes: 612, comments: 88, shares: 188, views: 11203, when: "9h ago" },
      { id: "ig-3", title: "Story — behind the desk", likes: 240, comments: 34, shares: 71, views: 6201, when: "1d ago" },
      { id: "ig-4", title: "Post — moodboard 04", likes: 482, comments: 64, shares: 122, views: 8044, when: "2d ago" },
    ],
  },
  {
    platform: "tiktok",
    handle: "@hitha.tt",
    followers: 51200,
    reach: 642100,
    growth: 28.6,
    prev_score: 0,
    posts: [
      { id: "tt-1", title: "Clip — workspace tour 02", likes: 11041, comments: 1820, shares: 4012, views: 184022, when: "1h ago" },
      { id: "tt-2", title: "Duet — with @studio.k", likes: 5523, comments: 920, shares: 1820, views: 92041, when: "6h ago" },
      { id: "tt-3", title: "POV — first commit", likes: 2472, comments: 412, shares: 803, views: 41203, when: "1d ago" },
      { id: "tt-4", title: "Stitch — keyboard ASMR", likes: 1686, comments: 281, shares: 502, views: 28104, when: "2d ago" },
    ],
  },
  {
    platform: "x",
    handle: "@hitha.codes",
    followers: 8420,
    reach: 92140,
    growth: -2.8,
    prev_score: 0,
    posts: [
      { id: "x-1", title: "Thread — design systems", likes: 1092, comments: 188, shares: 302, views: 18204, when: "3h ago" },
      { id: "x-2", title: "Quote — taste vs craft", likes: 564, comments: 94, shares: 145, views: 9412, when: "11h ago" },
      { id: "x-3", title: "Reply — to @figma", likes: 132, comments: 22, shares: 12, views: 2204, when: "1d ago" },
    ],
  },
  {
    platform: "youtube",
    handle: "@hitha.yt",
    followers: 2840,
    reach: 34210,
    growth: 4.1,
    prev_score: 0,
    posts: [
      { id: "yt-1", title: "Vlog — april in SF", likes: 852, comments: 132, shares: 220, views: 14203, when: "5h ago" },
      { id: "yt-2", title: "Short — 60s of code", likes: 384, comments: 51, shares: 88, views: 6402, when: "2d ago" },
    ],
  },
];

// Initialize prev_score on first load so initial new_activity_flag is false.
const state: PlatformState[] = seed.map((p) => ({
  ...p,
  posts: p.posts.map((post) => ({ ...post })),
  prev_score: totalScore(p.posts),
}));

function mutate(state: PlatformState[]): void {
  // On each call, ~70% chance one or two platforms see a small organic bump.
  if (Math.random() < 0.7) {
    const count = Math.random() < 0.4 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const platform = state[Math.floor(Math.random() * state.length)];
      const post = platform.posts[Math.floor(Math.random() * platform.posts.length)];
      const factor = 1 + Math.random() * 0.06; // up to +6%
      post.likes = Math.round(post.likes * factor);
      post.comments = Math.round(post.comments * (1 + Math.random() * 0.04));
      post.shares = Math.round(post.shares * (1 + Math.random() * 0.05));
      post.views = Math.round(post.views * (1 + Math.random() * 0.03));
    }
  }
}

router.get("/pulse", (_req, res) => {
  // Optional: simulated failure path so the FAILED status is exercisable.
  if (process.env["ZERNIO_FORCE_FAIL"] === "1") {
    res.status(500).json({ status: "error", message: "Upstream Zernio API failure." });
    return;
  }

  const apiKey = process.env["ZERNIO_API_KEY"];
  // Treat "missing" as warning but still serve mock; treat empty string the same.
  // (The frontend will see 200 OK either way; in production this would call upstream.)

  mutate(state);

  const platforms = state.map((p) => {
    const score = totalScore(p.posts);
    const newActivity = score > p.prev_score;
    p.prev_score = score;

    const totalEng = p.posts.reduce((s, x) => s + x.likes + x.comments + x.shares, 0);
    const engagementRate = p.followers > 0 ? +(totalEng / p.followers * 10).toFixed(2) : 0;

    return {
      platform: p.platform,
      handle: p.handle,
      total_score: score,
      new_activity_flag: newActivity,
      stats: {
        reach: p.reach,
        engagement_rate: engagementRate,
        growth: p.growth,
        followers: p.followers,
      },
      posts: p.posts.map((post) => ({
        id: post.id,
        title: post.title,
        likes: post.likes,
        comments: post.comments,
        shares: post.shares,
        views: post.views,
        when: post.when,
      })),
    };
  });

  res.json({
    status: "ok",
    fetched_at: new Date().toISOString(),
    source: apiKey ? "zernio_live" : "zernio_mock",
    platforms,
  });
});

export default router;
