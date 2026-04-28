import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Eye,
  Share2,
  House,
  BarChart3,
  Clock,
  UserCog,
  X,
  TrendingUp,
  TrendingDown,
  Settings2,
  Bell,
  Link2,
  Shield,
  ChevronRight,
  Instagram,
  Twitter,
  Youtube,
  Music2,
  Plus,
  ArrowRight,
  ArrowLeft,
  Check,
} from "lucide-react";

type StatusKind = "live" | "connecting" | "failed";
type NavKey = "home" | "analytics" | "recent" | "profile";

type LivePost = {
  id: string;
  title: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  when: string;
};

type LivePlatform = {
  platform: "instagram" | "tiktok" | "x" | "youtube";
  handle: string;
  total_score: number;
  new_activity_flag: boolean;
  stats: {
    reach: number;
    engagement_rate: number;
    growth: number;
    followers: number;
  };
  posts: LivePost[];
};

type PulseResponse = {
  status: "ok";
  fetched_at: string;
  source: string;
  platforms: LivePlatform[];
};

const PLATFORM_TO_APP_ID: Record<string, string> = {
  instagram: "ig",
  tiktok: "tt",
  x: "x",
  youtube: "yt",
};

// Map fetched data into a lookup keyed by frontend app id.
function indexByAppId(data: PulseResponse | null): Record<string, LivePlatform> {
  if (!data) return {};
  const out: Record<string, LivePlatform> = {};
  for (const p of data.platforms) {
    const appId = PLATFORM_TO_APP_ID[p.platform];
    if (appId) out[appId] = p;
  }
  return out;
}

// API_URL — relative path so it works through the workspace proxy in dev.
// In production a full origin can be substituted via env.
const PULSE_API_URL = "/api/pulse";
const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes per spec
const BLINK_DURATION_MS = 1600;

function usePulseData() {
  const [data, setData] = useState<PulseResponse | null>(null);
  const [status, setStatus] = useState<StatusKind>("connecting");
  const [blinkSet, setBlinkSet] = useState<Set<string>>(new Set());
  const prevScoresRef = useRef<Record<string, number>>({});
  const blinkTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const refresh = useCallback(async () => {
    setStatus("connecting");
    try {
      const res = await fetch(PULSE_API_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: PulseResponse = await res.json();
      // Compare scores per platform; trigger blink for any that grew.
      const newBlinks = new Set<string>();
      for (const p of json.platforms) {
        const appId = PLATFORM_TO_APP_ID[p.platform];
        if (!appId) continue;
        const prev = prevScoresRef.current[appId];
        if (prev !== undefined && p.total_score > prev) {
          newBlinks.add(appId);
        }
        prevScoresRef.current[appId] = p.total_score;
      }
      if (newBlinks.size > 0) {
        setBlinkSet((cur) => {
          const next = new Set(cur);
          newBlinks.forEach((id) => next.add(id));
          return next;
        });
        newBlinks.forEach((id) => {
          if (blinkTimers.current[id]) clearTimeout(blinkTimers.current[id]);
          blinkTimers.current[id] = setTimeout(() => {
            setBlinkSet((cur) => {
              const next = new Set(cur);
              next.delete(id);
              return next;
            });
          }, BLINK_DURATION_MS);
        });
      }
      setData(json);
      setStatus("live");
    } catch (err) {
      console.warn("[pulse] fetch failed:", err);
      setStatus("failed");
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      clearInterval(t);
      Object.values(blinkTimers.current).forEach((id) => clearTimeout(id));
    };
  }, [refresh]);

  return { data, status, blinkSet, refresh };
}

type AppData = {
  id: string;
  handle: string;
  app: string;
  color: string;
  baseScore: number;
  origin: { x: number; y: number };
  shape: Array<[number, number]>;
  likes: number;
  comments: number;
  posts: Array<{
    title: string;
    views: number;
    shares: number;
    when: string;
    tone: string;
  }>;
  reach: number;
  engagementRate: number;
  growth: number;
  followers: number;
  spark: number[];
  ageGroups: Array<{ label: string; value: number }>;
  regions: Array<{ label: string; value: number }>;
};

const CELL = 14;
const GAP = 1;

const PINK = "#E5B9B9";
const CREAM = "#FDFCF5";
const INK = "#0A0A0A";

const ICONS: Record<string, typeof Instagram> = {
  ig: Instagram,
  x: Twitter,
  tt: Music2,
  yt: Youtube,
};

const APPS: AppData[] = [
  {
    id: "ig",
    handle: "@hithasetty",
    app: "INSTAGRAM",
    color: PINK,
    baseScore: 85,
    origin: { x: 4, y: 4 },
    shape: [
      [0, 0], [1, 0], [2, 0], [3, 0],
      [0, 1], [1, 1], [2, 1], [3, 1], [4, 1],
      [-1, 2], [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2],
      [0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3],
      [1, 4], [2, 4], [3, 4], [4, 4],
      [2, 5], [3, 5],
    ],
    likes: 1428,
    comments: 312,
    posts: [
      { title: "Reel — studio teardown", views: 24102, shares: 412, when: "2h ago", tone: "#E5B9B9" },
      { title: "Carousel — 6 frames", views: 11203, shares: 188, when: "9h ago", tone: "#D49A9A" },
      { title: "Story — behind the desk", views: 6201, shares: 71, when: "1d ago", tone: "#F0D6D6" },
      { title: "Post — moodboard 04", views: 8044, shares: 122, when: "2d ago", tone: "#E5B9B9" },
    ],
    reach: 184320,
    engagementRate: 7.4,
    growth: 12.3,
    followers: 24180,
    spark: [12, 18, 14, 22, 19, 28, 34],
    ageGroups: [
      { label: "18-24", value: 38 },
      { label: "25-34", value: 41 },
      { label: "35-44", value: 14 },
      { label: "45+", value: 7 },
    ],
    regions: [
      { label: "IN — Bengaluru", value: 28 },
      { label: "US — NYC", value: 19 },
      { label: "UK — London", value: 11 },
    ],
  },
  {
    id: "tt",
    handle: "@hitha.tt",
    app: "TIKTOK",
    color: "#E8D5A8",
    baseScore: 110,
    origin: { x: 38, y: 4 },
    shape: [
      [0, 0], [1, 0], [2, 0], [3, 0], [4, 0],
      [-1, 1], [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1],
      [-1, 2], [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2],
      [0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3],
      [1, 4], [2, 4], [3, 4], [4, 4],
      [2, 5], [3, 5],
      [2, 6], [3, 6],
    ],
    likes: 4823,
    comments: 921,
    posts: [
      { title: "Clip — workspace tour 02", views: 184022, shares: 4012, when: "1h ago", tone: "#E8D5A8" },
      { title: "Duet — with @studio.k", views: 92041, shares: 1820, when: "6h ago", tone: "#D4BC85" },
      { title: "POV — first commit", views: 41203, shares: 803, when: "1d ago", tone: "#E8D5A8" },
      { title: "Stitch — keyboard ASMR", views: 28104, shares: 502, when: "2d ago", tone: "#F0E2BC" },
    ],
    reach: 642100,
    engagementRate: 11.2,
    growth: 28.6,
    followers: 51200,
    spark: [10, 14, 22, 18, 30, 38, 44],
    ageGroups: [
      { label: "18-24", value: 58 },
      { label: "25-34", value: 28 },
      { label: "35-44", value: 10 },
      { label: "45+", value: 4 },
    ],
    regions: [
      { label: "US — LA", value: 24 },
      { label: "IN — Mumbai", value: 22 },
      { label: "BR — São Paulo", value: 14 },
    ],
  },
  {
    id: "x",
    handle: "@hitha.codes",
    app: "X / TWITTER",
    color: "#C9D1D9",
    baseScore: 60,
    origin: { x: 24, y: 22 },
    shape: [
      [0, 0], [1, 0], [2, 0],
      [-1, 1], [0, 1], [1, 1], [2, 1], [3, 1],
      [0, 2], [1, 2], [2, 2], [3, 2],
      [1, 3], [2, 3],
      [1, 4], [2, 4], [3, 4],
    ],
    likes: 642,
    comments: 84,
    posts: [
      { title: "Thread — design systems", views: 18204, shares: 302, when: "3h ago", tone: "#C9D1D9" },
      { title: "Quote — taste vs craft", views: 9412, shares: 145, when: "11h ago", tone: "#A8B2BC" },
      { title: "Reply — to @figma", views: 2204, shares: 12, when: "1d ago", tone: "#C9D1D9" },
    ],
    reach: 92140,
    engagementRate: 4.1,
    growth: -2.8,
    followers: 8420,
    spark: [22, 18, 16, 14, 18, 12, 14],
    ageGroups: [
      { label: "18-24", value: 18 },
      { label: "25-34", value: 52 },
      { label: "35-44", value: 22 },
      { label: "45+", value: 8 },
    ],
    regions: [
      { label: "US — SF", value: 34 },
      { label: "IN — Bengaluru", value: 21 },
      { label: "DE — Berlin", value: 9 },
    ],
  },
  {
    id: "yt",
    handle: "@hitha.yt",
    app: "YOUTUBE",
    color: "#D4A5A5",
    baseScore: 45,
    origin: { x: 60, y: 22 },
    shape: [
      [0, 0], [1, 0], [2, 0],
      [0, 1], [1, 1], [2, 1], [3, 1],
      [0, 2], [1, 2], [2, 2], [3, 2],
      [1, 3], [2, 3], [3, 3],
    ],
    likes: 312,
    comments: 41,
    posts: [
      { title: "Vlog — april in SF", views: 14203, shares: 220, when: "5h ago", tone: "#D4A5A5" },
      { title: "Short — 60s of code", views: 6402, shares: 88, when: "2d ago", tone: "#B98989" },
    ],
    reach: 34210,
    engagementRate: 3.2,
    growth: 4.1,
    followers: 2840,
    spark: [4, 6, 5, 8, 7, 9, 11],
    ageGroups: [
      { label: "18-24", value: 22 },
      { label: "25-34", value: 44 },
      { label: "35-44", value: 24 },
      { label: "45+", value: 10 },
    ],
    regions: [
      { label: "US — NYC", value: 31 },
      { label: "CA — Toronto", value: 18 },
      { label: "IN — Delhi", value: 12 },
    ],
  },
];

function growShape(base: Array<[number, number]>, score: number): Array<[number, number]> {
  const extra = Math.max(0, Math.floor((score - 60) / 5));
  const present = new Set(base.map(([x, y]) => `${x},${y}`));
  const cells: Array<[number, number]> = [...base];

  let added = 0;
  let radius = 1;
  while (added < extra && radius < 14) {
    const candidates: Array<[number, number]> = [];
    for (const [x, y] of cells) {
      const neighbors: Array<[number, number]> = [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1],
      ];
      for (const n of neighbors) {
        const key = `${n[0]},${n[1]}`;
        if (!present.has(key)) {
          present.add(key);
          candidates.push(n);
        }
      }
    }
    candidates.sort((a, b) => {
      const da = Math.abs(a[0]) + Math.abs(a[1]);
      const db = Math.abs(b[0]) + Math.abs(b[1]);
      return da - db;
    });
    for (const c of candidates) {
      if (added >= extra) break;
      cells.push(c);
      added++;
    }
    radius++;
  }
  return cells;
}

function AppLogo({ app, size = 18 }: { app: AppData; size?: number }) {
  const Icon = ICONS[app.id] ?? Instagram;
  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: size,
        height: size,
        background: app.color,
        borderRadius: Math.max(4, size / 4),
      }}
    >
      <Icon size={Math.round(size * 0.62)} strokeWidth={2} color={INK} />
    </div>
  );
}

function Blob({
  app,
  score,
  onClick,
  showBubble,
  blink = false,
  liveLikes,
  liveComments,
}: {
  app: AppData;
  score: number;
  onClick: () => void;
  showBubble: boolean;
  blink?: boolean;
  liveLikes?: number;
  liveComments?: number;
}) {
  const cells = useMemo(() => growShape(app.shape, score), [app, score]);

  const xs = cells.map((c) => c[0]);
  const ys = cells.map((c) => c[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const widthCells = maxX - minX + 1;
  const heightCells = maxY - minY + 1;
  const widthPx = widthCells * (CELL + GAP);
  const heightPx = heightCells * (CELL + GAP);

  const labelTop = (app.origin.y + maxY + 1) * (CELL + GAP) + 8;
  const labelLeft = (app.origin.x + minX) * (CELL + GAP);
  const blobLeft = (app.origin.x + minX) * (CELL + GAP);
  const blobTop = (app.origin.y + minY) * (CELL + GAP);

  const likes = liveLikes ?? app.likes;
  const comments = liveComments ?? app.comments;

  return (
    <>
      {/* blink ring — expanding outline around the territory border */}
      <AnimatePresence>
        {blink && (
          <motion.div
            key={`blink-${app.id}`}
            initial={{ opacity: 0.85, scale: 0.96 }}
            animate={{ opacity: 0, scale: 1.18 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            className="absolute pointer-events-none z-10"
            style={{
              left: blobLeft - 6,
              top: blobTop - 6,
              width: widthPx + 12,
              height: heightPx + 12,
              border: `2px solid ${app.color}`,
              borderRadius: 14,
              boxShadow: `0 0 22px ${app.color}`,
            }}
          />
        )}
      </AnimatePresence>

      <div
        className="absolute cursor-pointer"
        style={{ left: blobLeft, top: blobTop, width: widthPx, height: heightPx }}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        data-testid={`blob-${app.id}`}
      >
        {cells.map((c, i) => {
          const cx = (c[0] - minX) * (CELL + GAP);
          const cy = (c[1] - minY) * (CELL + GAP);
          const delay = ((i * 73) % 1000) / 1000;
          return (
            <motion.div
              key={`${c[0]},${c[1]}`}
              className="absolute"
              style={{
                left: cx,
                top: cy,
                width: CELL,
                height: CELL,
                background: app.color,
                borderRadius: 4,
              }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                ease: "easeInOut",
                delay,
              }}
            />
          );
        })}
      </div>

      {/* label with app logo */}
      <div
        className="absolute pointer-events-none flex items-center gap-1.5"
        style={{ left: labelLeft, top: labelTop }}
      >
        <AppLogo app={app} size={16} />
        <span
          className="text-[10px] tracking-wider"
          style={{
            color: "#1a1a1a",
            fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
            letterSpacing: "0.08em",
          }}
        >
          {app.handle}
        </span>
      </div>

      <AnimatePresence>
        {showBubble && (
          <motion.div
            key={`bubble-${app.id}`}
            initial={{ opacity: 0, scale: 0.4, y: 12 }}
            animate={{ opacity: 1, scale: [0.4, 1.12, 1], y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 8 }}
            transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
            className="absolute z-30 pointer-events-none"
            style={{
              left: blobLeft + widthPx / 2,
              top: blobTop - 14,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div
              className="bg-white px-3.5 py-2.5 flex items-center gap-3 shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
              style={{ borderRadius: 14 }}
            >
              <div className="flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5" style={{ color: INK }} fill={INK} />
                <span
                  className="text-[11px] font-semibold tracking-wider"
                  style={{ fontFamily: "ui-monospace, monospace", color: INK }}
                >
                  {likes.toLocaleString()}
                </span>
              </div>
              <div className="w-px h-3 bg-black/15" />
              <div className="flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5" style={{ color: INK }} />
                <span
                  className="text-[11px] font-semibold tracking-wider"
                  style={{ fontFamily: "ui-monospace, monospace", color: INK }}
                >
                  {comments.toLocaleString()}
                </span>
              </div>
            </div>
            <div
              className="absolute left-1/2 -translate-x-1/2"
              style={{
                bottom: -5,
                width: 10,
                height: 10,
                background: "white",
                transform: "translateX(-50%) rotate(45deg)",
                boxShadow: "2px 2px 4px rgba(0,0,0,0.05)",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function AddBlob({ origin, onClick }: { origin: { x: number; y: number }; onClick: () => void }) {
  // 5x5 grid square, soft pink tint, with a white plus in the center
  const SIZE = 5;
  const cells: Array<[number, number]> = [];
  for (let x = 0; x < SIZE; x++) {
    for (let y = 0; y < SIZE; y++) {
      cells.push([x, y]);
    }
  }
  const widthPx = SIZE * (CELL + GAP);
  const heightPx = SIZE * (CELL + GAP);
  const blobLeft = origin.x * (CELL + GAP);
  const blobTop = origin.y * (CELL + GAP);
  const labelLeft = blobLeft;
  const labelTop = blobTop + heightPx + 8;

  return (
    <>
      <motion.div
        className="absolute cursor-pointer"
        style={{ left: blobLeft, top: blobTop, width: widthPx, height: heightPx }}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        data-testid="blob-add"
      >
        {cells.map(([x, y], i) => {
          const cx = x * (CELL + GAP);
          const cy = y * (CELL + GAP);
          const delay = ((i * 53) % 1000) / 1000;
          return (
            <motion.div
              key={`${x}-${y}`}
              className="absolute"
              style={{
                left: cx,
                top: cy,
                width: CELL,
                height: CELL,
                background: "rgba(229,185,185,0.55)",
                border: "1px dashed rgba(0,0,0,0.18)",
                borderRadius: 4,
              }}
              animate={{ scale: [1, 1.04, 1] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay,
              }}
            />
          );
        })}
        {/* white plus mark in the center */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: 30,
            height: 30,
          }}
        >
          <div
            className="absolute"
            style={{
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: 24,
              height: 4,
              background: "white",
              borderRadius: 2,
              boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
            }}
          />
          <div
            className="absolute"
            style={{
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: 4,
              height: 24,
              background: "white",
              borderRadius: 2,
              boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
            }}
          />
        </div>
      </motion.div>

      <div
        className="absolute pointer-events-none flex items-center gap-1.5"
        style={{ left: labelLeft, top: labelTop }}
      >
        <div
          className="rounded-sm flex items-center justify-center"
          style={{ width: 16, height: 16, background: "rgba(0,0,0,0.06)", borderRadius: 4 }}
        >
          <Plus className="w-2.5 h-2.5" style={{ color: INK }} strokeWidth={2.4} />
        </div>
        <span
          className="text-[10px] tracking-wider"
          style={{
            color: "#1a1a1a",
            fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
            letterSpacing: "0.08em",
          }}
        >
          add channel
        </span>
      </div>
    </>
  );
}

function StatusIndicator({
  status,
  onClick,
}: {
  status: StatusKind;
  onClick?: () => void;
}) {
  const dot =
    status === "live" ? "#22C55E" : status === "connecting" ? "#3B82F6" : "#EF4444";
  const label =
    status === "live" ? "LIVE" : status === "connecting" ? "SYNC" : "FAIL";
  const pulseDuration = status === "connecting" ? 0.7 : 1.4;
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2"
      data-testid="status-indicator"
      title="Tap to re-sync"
    >
      <span
        className="text-[9px] tracking-[0.2em] text-white/60"
        style={{ fontFamily: "ui-monospace, monospace" }}
      >
        {label}
      </span>
      <div
        className="rounded-full flex items-center justify-center"
        style={{
          width: 28,
          height: 28,
          border: `1px solid ${
            status === "failed" ? "rgba(239,68,68,0.45)" : "rgba(255,255,255,0.25)"
          }`,
        }}
      >
        <motion.div
          key={status}
          className="rounded-full"
          style={{ width: 8, height: 8, background: dot }}
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: pulseDuration, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </button>
  );
}

function PageHeader({
  eyebrow,
  title,
  italic,
  subtitle,
  status,
  onStatusClick,
}: {
  eyebrow: string;
  title: string;
  italic?: string;
  subtitle: string;
  status: StatusKind;
  onStatusClick?: () => void;
}) {
  return (
    <div className="relative z-10 px-6 pt-12 pb-5">
      <div className="flex items-start justify-between mb-5">
        <div
          className="text-[10px] tracking-[0.25em] text-white/40"
          style={{ fontFamily: "ui-monospace, monospace" }}
        >
          {eyebrow}
        </div>
        <StatusIndicator status={status} onClick={onStatusClick} />
      </div>
      <h1
        className="text-white text-[40px] leading-[1.05] tracking-tight"
        style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 500 }}
      >
        {title}
        {italic && (
          <>
            {" "}
            <em style={{ fontStyle: "italic", fontWeight: 400 }}>{italic}</em>
          </>
        )}
      </h1>
      <p
        className="text-white/55 text-[13px] mt-2 leading-snug lowercase"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {subtitle}
      </p>
    </div>
  );
}

function BottomNav({
  active,
  setActive,
}: {
  active: NavKey;
  setActive: (a: NavKey) => void;
}) {
  const items: Array<{ id: NavKey; icon: typeof House }> = [
    { id: "home", icon: House },
    { id: "analytics", icon: BarChart3 },
    { id: "recent", icon: Clock },
    { id: "profile", icon: UserCog },
  ];
  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 z-40"
      style={{ bottom: 18 }}
    >
      <div
        className="flex items-center gap-1 px-2 py-2 rounded-full"
        style={{
          background: "rgba(20, 20, 20, 0.92)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
        }}
      >
        {items.map(({ id, icon: Icon }) => {
          const isActive = id === active;
          return (
            <button
              key={id}
              onClick={() => setActive(id)}
              className="rounded-full flex items-center justify-center transition-all"
              style={{
                width: 42,
                height: 42,
                background: isActive ? CREAM : "transparent",
                color: isActive ? INK : "rgba(255,255,255,0.55)",
              }}
              data-testid={`nav-${id}`}
            >
              <Icon className="w-4 h-4" strokeWidth={isActive ? 2.2 : 1.6} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Drawer({
  app,
  onClose,
  livePosts,
}: {
  app: AppData | null;
  onClose: () => void;
  livePosts?: LivePost[];
}) {
  return (
    <AnimatePresence>
      {app && (
        <motion.div
          key="drawer"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
          className="absolute left-0 right-0 bottom-0 z-50"
          style={{ height: "44%" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="w-full h-full overflow-hidden flex flex-col"
            style={{
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(28px)",
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              borderTop: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 -20px 60px rgba(0,0,0,0.3)",
            }}
          >
            <div className="pt-3 pb-1 flex justify-center">
              <div
                className="rounded-full"
                style={{ width: 38, height: 4, background: "rgba(0,0,0,0.18)" }}
              />
            </div>

            <div className="px-5 pt-3 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AppLogo app={app} size={16} />
                <span
                  className="text-[10px] font-semibold tracking-[0.18em]"
                  style={{ fontFamily: "ui-monospace, monospace", color: INK }}
                >
                  {app.app} <span className="opacity-40 mx-1">//</span>{" "}
                  <span className="opacity-70">{app.handle}</span>
                </span>
              </div>
              <button
                onClick={onClose}
                className="rounded-full flex items-center justify-center"
                style={{
                  width: 26,
                  height: 26,
                  background: "rgba(0,0,0,0.06)",
                  color: INK,
                }}
                data-testid="drawer-close"
              >
                <X className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            </div>

            <div className="px-5 pb-1">
              <div
                className="text-[9px] tracking-[0.22em] opacity-50"
                style={{ fontFamily: "ui-monospace, monospace", color: INK }}
              >
                SESSION_LOG <span className="opacity-50">//</span> RECENT_ASSETS
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
                className="flex-1 overflow-y-auto px-5 pt-2 pb-6"
              >
                <div className="flex flex-col gap-2.5">
                  {(livePosts && livePosts.length > 0
                    ? livePosts.map((lp, i) => ({
                        title: lp.title,
                        views: lp.views,
                        shares: lp.shares,
                        when: lp.when,
                        tone: app.posts[i % app.posts.length]?.tone ?? app.color,
                      }))
                    : app.posts
                  ).map((p, i) => (
                    <motion.div
                      key={`${p.title}-${i}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.3 }}
                      className="flex items-stretch gap-3 p-2.5"
                      style={{
                        background: "rgba(255,255,255,0.7)",
                        border: "1px solid rgba(0,0,0,0.05)",
                        borderRadius: 12,
                        boxShadow: "0 1px 0 rgba(0,0,0,0.02)",
                      }}
                    >
                      <div
                        className="flex-shrink-0"
                        style={{
                          width: 44,
                          height: 44,
                          background: p.tone,
                          borderRadius: 8,
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          className="absolute inset-0"
                          style={{
                            background:
                              "linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.35) 50%, transparent 60%)",
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div
                          className="text-[11px] font-semibold truncate"
                          style={{ color: INK, fontFamily: "ui-monospace, monospace" }}
                        >
                          {p.title}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" style={{ color: INK, opacity: 0.55 }} />
                            <span
                              className="text-[10px] tracking-wider"
                              style={{
                                color: INK,
                                opacity: 0.7,
                                fontFamily: "ui-monospace, monospace",
                              }}
                            >
                              {p.views.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Share2 className="w-3 h-3" style={{ color: INK, opacity: 0.55 }} />
                            <span
                              className="text-[10px] tracking-wider"
                              style={{
                                color: INK,
                                opacity: 0.7,
                                fontFamily: "ui-monospace, monospace",
                              }}
                            >
                              {p.shares.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div
                        className="text-[9px] tracking-[0.18em] self-start"
                        style={{
                          color: INK,
                          opacity: 0.45,
                          fontFamily: "ui-monospace, monospace",
                        }}
                      >
                        {p.when.toUpperCase()}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------- HOME ---------------- */

function HomePage({
  status,
  username,
  onAddChannel,
  liveByApp,
  blinkSet,
  onStatusClick,
}: {
  status: StatusKind;
  username: string;
  onAddChannel: () => void;
  liveByApp: Record<string, LivePlatform>;
  blinkSet: Set<string>;
  onStatusClick: () => void;
}) {
  const [activeBlobId, setActiveBlobId] = useState<string | null>(null);
  const [drawerAppId, setDrawerAppId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const closeAll = () => {
    setActiveBlobId(null);
    setDrawerAppId(null);
  };

  const handleBlobClick = (appId: string) => {
    setActiveBlobId(appId);
    setDrawerAppId(appId);
  };

  const drawerApp = APPS.find((a) => a.id === drawerAppId) ?? null;
  const CANVAS_WIDTH = 1100;
  const CANVAS_HEIGHT = 560;

  const firstName = username.replace(/^@/, "").split(/[._]/)[0] || "Hitha";
  const display = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  return (
    <>
      <PageHeader
        eyebrow="PULSE / 04.28"
        title={display}
        italic="Returns."
        subtitle="engagement is pretty better than yesterday."
        status={status}
        onStatusClick={onStatusClick}
      />

      <div
        ref={scrollRef}
        className="absolute left-0 right-0 overflow-x-auto overflow-y-hidden"
        style={{ top: 200, bottom: 0, scrollbarWidth: "none" }}
        onClick={closeAll}
      >
        <div
          className="relative"
          style={{
            width: CANVAS_WIDTH,
            minHeight: CANVAS_HEIGHT,
            height: "100%",
            background: CREAM,
            backgroundImage:
              "radial-gradient(circle, rgba(0,0,0,0.13) 1px, transparent 1px)",
            backgroundSize: `${CELL + GAP}px ${CELL + GAP}px`,
            backgroundPosition: "0 0",
          }}
        >
          <div
            className="absolute top-5 right-6 text-[8px] tracking-[0.3em]"
            style={{
              color: "rgba(0,0,0,0.35)",
              fontFamily: "ui-monospace, monospace",
            }}
          >
            GRID — 14PX // BLOB.HABITAT
          </div>

          {APPS.map((app) => {
            const live = liveByApp[app.id];
            return (
              <Blob
                key={app.id}
                app={app}
                score={app.baseScore}
                onClick={() => handleBlobClick(app.id)}
                showBubble={activeBlobId === app.id}
                blink={blinkSet.has(app.id)}
                liveLikes={live?.posts.reduce((s, p) => s + p.likes, 0)}
                liveComments={live?.posts.reduce((s, p) => s + p.comments, 0)}
              />
            );
          })}

          <AddBlob origin={{ x: 12, y: 24 }} onClick={onAddChannel} />
        </div>
      </div>

      <Drawer
        app={drawerApp}
        onClose={closeAll}
        livePosts={drawerApp ? liveByApp[drawerApp.id]?.posts : undefined}
      />
    </>
  );
}

/* ---------------- ANALYTICS ---------------- */

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 110;
  const h = 28;
  const step = w / (data.length - 1);
  const points = data
    .map((v, i) => `${i * step},${h - ((v - min) / range) * h}`)
    .join(" ");
  return (
    <svg width={w} height={h} className="block">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

function AnalyticsCard({ app }: { app: AppData }) {
  const positive = app.growth >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative overflow-hidden"
      style={{
        background: CREAM,
        borderRadius: 18,
        padding: 16,
        backgroundImage:
          "radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px)",
        backgroundSize: `${CELL + GAP}px ${CELL + GAP}px`,
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <AppLogo app={app} size={22} />
          <div>
            <div
              className="text-[10px] tracking-[0.18em] font-semibold"
              style={{ fontFamily: "ui-monospace, monospace", color: INK }}
            >
              {app.app}
            </div>
            <div
              className="text-[9px] tracking-wider opacity-55"
              style={{ fontFamily: "ui-monospace, monospace", color: INK }}
            >
              {app.handle}
            </div>
          </div>
        </div>
        <div
          className="flex items-center gap-1 px-2 py-1 rounded-full"
          style={{
            background: positive ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
          }}
        >
          {positive ? (
            <TrendingUp className="w-3 h-3" style={{ color: "#16A34A" }} />
          ) : (
            <TrendingDown className="w-3 h-3" style={{ color: "#DC2626" }} />
          )}
          <span
            className="text-[10px] font-semibold"
            style={{
              fontFamily: "ui-monospace, monospace",
              color: positive ? "#16A34A" : "#DC2626",
            }}
          >
            {positive ? "+" : ""}
            {app.growth.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="flex items-end justify-between mb-3 pb-3 border-b border-black/5">
        <div className="flex flex-col gap-2">
          <div>
            <div
              className="text-[8px] tracking-[0.22em] opacity-50"
              style={{ fontFamily: "ui-monospace, monospace", color: INK }}
            >
              REACH / 7D
            </div>
            <div
              className="text-[18px] font-semibold leading-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", color: INK }}
            >
              {app.reach >= 1000
                ? `${(app.reach / 1000).toFixed(1)}K`
                : app.reach.toLocaleString()}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div>
              <div
                className="text-[8px] tracking-[0.22em] opacity-50"
                style={{ fontFamily: "ui-monospace, monospace", color: INK }}
              >
                ENG / RATE
              </div>
              <div
                className="text-[12px] font-semibold"
                style={{ fontFamily: "ui-monospace, monospace", color: INK }}
              >
                {app.engagementRate}%
              </div>
            </div>
            <div>
              <div
                className="text-[8px] tracking-[0.22em] opacity-50"
                style={{ fontFamily: "ui-monospace, monospace", color: INK }}
              >
                FLWRS
              </div>
              <div
                className="text-[12px] font-semibold"
                style={{ fontFamily: "ui-monospace, monospace", color: INK }}
              >
                {app.followers >= 1000
                  ? `${(app.followers / 1000).toFixed(1)}K`
                  : app.followers}
              </div>
            </div>
          </div>
        </div>
        <Sparkline data={app.spark} color={INK} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div
            className="text-[8px] tracking-[0.22em] opacity-50 mb-1.5"
            style={{ fontFamily: "ui-monospace, monospace", color: INK }}
          >
            AGE / DIST
          </div>
          <div className="flex flex-col gap-1">
            {app.ageGroups.map((g) => (
              <div key={g.label} className="flex items-center gap-1.5">
                <span
                  className="text-[9px] w-9"
                  style={{ fontFamily: "ui-monospace, monospace", color: INK }}
                >
                  {g.label}
                </span>
                <div
                  className="flex-1 h-1.5 rounded-full overflow-hidden"
                  style={{ background: "rgba(0,0,0,0.08)" }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: app.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${g.value}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
                <span
                  className="text-[9px] w-7 text-right"
                  style={{ fontFamily: "ui-monospace, monospace", color: INK, opacity: 0.6 }}
                >
                  {g.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div
            className="text-[8px] tracking-[0.22em] opacity-50 mb-1.5"
            style={{ fontFamily: "ui-monospace, monospace", color: INK }}
          >
            TOP / GEO
          </div>
          <div className="flex flex-col gap-1.5">
            {app.regions.map((r) => (
              <div key={r.label} className="flex items-center justify-between">
                <span
                  className="text-[9px] truncate"
                  style={{ fontFamily: "ui-monospace, monospace", color: INK }}
                >
                  {r.label}
                </span>
                <span
                  className="text-[9px] font-semibold"
                  style={{ fontFamily: "ui-monospace, monospace", color: INK }}
                >
                  {r.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function AnalyticsPage({
  status,
  onStatusClick,
}: {
  status: StatusKind;
  onStatusClick?: () => void;
}) {
  return (
    <>
      <PageHeader
        eyebrow="ANALYTICS / APP_INDEX"
        title="Performance"
        italic="Index."
        subtitle="reach, demographics & geo per channel."
        status={status}
        onStatusClick={onStatusClick}
      />
      <div
        className="absolute left-0 right-0 overflow-y-auto"
        style={{ top: 200, bottom: 0, scrollbarWidth: "none" }}
      >
        <div
          className="relative pt-6 pb-32 px-5"
          style={{ background: INK, minHeight: "100%" }}
        >
          <div className="flex flex-col gap-3">
            {APPS.map((app) => (
              <AnalyticsCard key={app.id} app={app} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------------- RECENTS ---------------- */

function RecentsPage({
  status,
  onStatusClick,
}: {
  status: StatusKind;
  onStatusClick?: () => void;
}) {
  const allPosts = useMemo(() => {
    const items = APPS.flatMap((app) =>
      app.posts.map((p) => ({
        ...p,
        app: app.app,
        appId: app.id,
        handle: app.handle,
        color: app.color,
        likes: Math.floor(p.views * 0.06),
        comments: Math.floor(p.views * 0.01),
      })),
    );
    const order: Record<string, number> = { "1h ago": 1, "2h ago": 2, "3h ago": 3, "5h ago": 5, "6h ago": 6, "9h ago": 9, "11h ago": 11, "1d ago": 24, "2d ago": 48 };
    return items.sort((a, b) => (order[a.when] ?? 99) - (order[b.when] ?? 99));
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="RECENTS / SESSION_LOG"
        title="Recent"
        italic="Drops."
        subtitle="last upload performance, freshest first."
        status={status}
        onStatusClick={onStatusClick}
      />
      <div
        className="absolute left-0 right-0 overflow-y-auto"
        style={{ top: 200, bottom: 0, scrollbarWidth: "none" }}
      >
        <div
          className="relative pt-6 pb-32 px-5"
          style={{
            background: CREAM,
            minHeight: "100%",
            backgroundImage:
              "radial-gradient(circle, rgba(0,0,0,0.10) 1px, transparent 1px)",
            backgroundSize: `${CELL + GAP}px ${CELL + GAP}px`,
          }}
        >
          <div
            className="text-[8px] tracking-[0.3em] opacity-50 mb-4"
            style={{ fontFamily: "ui-monospace, monospace", color: INK }}
          >
            LIVE_FEED — {allPosts.length} ASSETS
          </div>

          <div className="flex flex-col gap-2.5">
            {allPosts.map((p, i) => {
              const Icon = ICONS[p.appId] ?? Instagram;
              return (
                <motion.div
                  key={`${p.appId}-${p.title}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  className="relative"
                  style={{
                    background: "white",
                    borderRadius: 14,
                    padding: 12,
                    border: "1px solid rgba(0,0,0,0.06)",
                    boxShadow: "0 2px 0 rgba(0,0,0,0.03)",
                    marginLeft: (i % 3) * 6,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="flex-shrink-0 relative overflow-hidden"
                      style={{
                        width: 56,
                        height: 56,
                        background: p.tone,
                        borderRadius: 10,
                      }}
                    >
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.35) 50%, transparent 60%)",
                        }}
                      />
                      <div className="absolute bottom-1 left-1">
                        <Icon className="w-3 h-3 text-white/90" strokeWidth={2.2} />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <AppLogo app={APPS.find((a) => a.id === p.appId)!} size={12} />
                        <span
                          className="text-[9px] tracking-[0.18em] opacity-55"
                          style={{ fontFamily: "ui-monospace, monospace", color: INK }}
                        >
                          {p.handle}
                        </span>
                        <div className="flex-1" />
                        <span
                          className="text-[9px] tracking-[0.18em] opacity-45"
                          style={{ fontFamily: "ui-monospace, monospace", color: INK }}
                        >
                          {p.when.toUpperCase()}
                        </span>
                      </div>
                      <div
                        className="text-[12px] font-semibold mb-2 truncate"
                        style={{ color: INK, fontFamily: "ui-monospace, monospace" }}
                      >
                        {p.title}
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { icon: Eye, val: p.views, label: "VIEWS" },
                          { icon: Heart, val: p.likes, label: "LIKES" },
                          { icon: MessageCircle, val: p.comments, label: "CMTS" },
                          { icon: Share2, val: p.shares, label: "SHRS" },
                        ].map(({ icon: Icon2, val, label }) => (
                          <div
                            key={label}
                            className="flex flex-col items-start"
                            style={{
                              background: "rgba(0,0,0,0.03)",
                              borderRadius: 6,
                              padding: "4px 6px",
                            }}
                          >
                            <div className="flex items-center gap-1 opacity-55 mb-0.5">
                              <Icon2 className="w-2.5 h-2.5" style={{ color: INK }} />
                              <span
                                className="text-[7px] tracking-[0.18em]"
                                style={{ fontFamily: "ui-monospace, monospace", color: INK }}
                              >
                                {label}
                              </span>
                            </div>
                            <span
                              className="text-[10px] font-semibold"
                              style={{ fontFamily: "ui-monospace, monospace", color: INK }}
                            >
                              {val >= 1000 ? `${(val / 1000).toFixed(1)}K` : val}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------------- PROFILE ---------------- */

function ProfilePage({
  status,
  username,
  onResetOnboarding,
  onStatusClick,
}: {
  status: StatusKind;
  username: string;
  onResetOnboarding: () => void;
  onStatusClick?: () => void;
}) {
  const totalFollowers = APPS.reduce((s, a) => s + a.followers, 0);
  const avgEng = (APPS.reduce((s, a) => s + a.engagementRate, 0) / APPS.length).toFixed(1);

  const settings = [
    { icon: Bell, label: "NOTIFICATIONS", meta: "ON", action: () => {} },
    { icon: Link2, label: "CONNECTED_ACCOUNTS", meta: `${APPS.length}`, action: () => {} },
    { icon: Shield, label: "PRIVACY", meta: "STANDARD", action: () => {} },
    { icon: Settings2, label: "REPLAY_ONBOARDING", meta: "", action: onResetOnboarding },
  ];

  const firstName = username.replace(/^@/, "").split(/[._]/)[0] || "Hitha";
  const display = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  return (
    <>
      <PageHeader
        eyebrow="PROFILE / OPERATOR"
        title={display}
        italic="Setty."
        subtitle="creator account & connected channels."
        status={status}
        onStatusClick={onStatusClick}
      />
      <div
        className="absolute left-0 right-0 overflow-y-auto"
        style={{ top: 200, bottom: 0, scrollbarWidth: "none" }}
      >
        <div
          className="relative pt-6 pb-32 px-5"
          style={{ background: INK, minHeight: "100%" }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="relative overflow-hidden mb-4"
            style={{
              background: CREAM,
              borderRadius: 22,
              padding: 18,
              backgroundImage:
                "radial-gradient(circle, rgba(0,0,0,0.10) 1px, transparent 1px)",
              backgroundSize: `${CELL + GAP}px ${CELL + GAP}px`,
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="relative flex-shrink-0"
                style={{ width: 72, height: 72 }}
              >
                {[
                  [1, 0], [2, 0], [3, 0],
                  [0, 1], [1, 1], [2, 1], [3, 1], [4, 1],
                  [0, 2], [1, 2], [2, 2], [3, 2], [4, 2],
                  [0, 3], [1, 3], [2, 3], [3, 3], [4, 3],
                  [1, 4], [2, 4], [3, 4],
                ].map(([x, y], i) => (
                  <motion.div
                    key={`${x}-${y}`}
                    className="absolute"
                    style={{
                      left: x * (CELL + GAP),
                      top: y * (CELL + GAP),
                      width: CELL,
                      height: CELL,
                      background: PINK,
                      borderRadius: 4,
                    }}
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{
                      duration: 1.6,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: ((i * 73) % 1000) / 1000,
                    }}
                  />
                ))}
              </div>

              <div className="flex-1 min-w-0 pt-1">
                <div
                  className="text-[8px] tracking-[0.25em] opacity-55 mb-1"
                  style={{ fontFamily: "ui-monospace, monospace", color: INK }}
                >
                  OPERATOR_ID — 0042
                </div>
                <div
                  className="text-[20px] leading-tight"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif", color: INK }}
                >
                  {display} Setty
                </div>
                <div
                  className="text-[10px] tracking-wider opacity-60 mt-0.5"
                  style={{ fontFamily: "ui-monospace, monospace", color: INK }}
                >
                  {username || "@hitha"} — creator
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-black/8">
              {[
                { label: "TOTAL_FLWRS", val: `${(totalFollowers / 1000).toFixed(1)}K` },
                { label: "CHANNELS", val: APPS.length.toString() },
                { label: "AVG_ENG", val: `${avgEng}%` },
              ].map((s) => (
                <div key={s.label}>
                  <div
                    className="text-[8px] tracking-[0.22em] opacity-50 mb-0.5"
                    style={{ fontFamily: "ui-monospace, monospace", color: INK }}
                  >
                    {s.label}
                  </div>
                  <div
                    className="text-[16px] font-semibold"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif", color: INK }}
                  >
                    {s.val}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <div
            className="text-[8px] tracking-[0.3em] text-white/40 mb-2 px-1"
            style={{ fontFamily: "ui-monospace, monospace" }}
          >
            CONNECTED // CHANNELS
          </div>
          <div className="flex flex-col gap-1.5 mb-5">
            {APPS.map((app, i) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.04, duration: 0.3 }}
                className="flex items-center gap-3 px-3 py-2.5"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 12,
                }}
              >
                <AppLogo app={app} size={20} />
                <div className="flex-1 min-w-0">
                  <div
                    className="text-[10px] tracking-[0.18em] font-semibold text-white"
                    style={{ fontFamily: "ui-monospace, monospace" }}
                  >
                    {app.app}
                  </div>
                  <div
                    className="text-[9px] tracking-wider text-white/50"
                    style={{ fontFamily: "ui-monospace, monospace" }}
                  >
                    {app.handle}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <motion.div
                    className="rounded-full"
                    style={{ width: 6, height: 6, background: "#22C55E" }}
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <span
                    className="text-[8px] tracking-[0.2em] text-white/55"
                    style={{ fontFamily: "ui-monospace, monospace" }}
                  >
                    SYNCED
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          <div
            className="text-[8px] tracking-[0.3em] text-white/40 mb-2 px-1"
            style={{ fontFamily: "ui-monospace, monospace" }}
          >
            SYSTEM // PREFERENCES
          </div>
          <div className="flex flex-col gap-1.5">
            {settings.map(({ icon: Icon, label, meta, action }, i) => (
              <motion.button
                key={label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.04, duration: 0.3 }}
                onClick={action}
                className="flex items-center gap-3 px-3 py-3 text-left"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 12,
                }}
              >
                <Icon className="w-3.5 h-3.5 text-white/70" strokeWidth={1.6} />
                <span
                  className="text-[10px] tracking-[0.2em] text-white/85 flex-1"
                  style={{ fontFamily: "ui-monospace, monospace" }}
                >
                  {label}
                </span>
                {meta && (
                  <span
                    className="text-[9px] tracking-[0.18em] text-white/50"
                    style={{ fontFamily: "ui-monospace, monospace" }}
                  >
                    {meta}
                  </span>
                )}
                <ChevronRight className="w-3.5 h-3.5 text-white/40" strokeWidth={1.6} />
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------------- ONBOARDING ---------------- */

function PulseLogo({ size = 96 }: { size?: number }) {
  // animated logo built from grid cells — abstract beating "P" / pulse mark
  const cells: Array<[number, number]> = [
    [0, 0], [1, 0], [2, 0],
    [0, 1], [3, 1],
    [0, 2], [1, 2], [2, 2],
    [0, 3],
    [0, 4],
  ];
  const cellSize = Math.floor(size / 6);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {cells.map(([x, y], i) => (
        <motion.div
          key={`${x}-${y}`}
          className="absolute"
          style={{
            left: x * (cellSize + 2),
            top: y * (cellSize + 2),
            width: cellSize,
            height: cellSize,
            background: PINK,
            borderRadius: Math.max(2, cellSize / 4),
          }}
          animate={{ scale: [1, 1.12, 1] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: ((i * 89) % 1000) / 1000,
          }}
        />
      ))}
    </div>
  );
}

function Onboarding({
  initialStep,
  initialUsername,
  initialConnected,
  onDone,
}: {
  initialStep: number;
  initialUsername: string;
  initialConnected: Set<string>;
  onDone: (username: string, connected: Set<string>) => void;
}) {
  const [step, setStep] = useState(initialStep);
  const [username, setUsername] = useState(initialUsername);
  const [connected, setConnected] = useState<Set<string>>(initialConnected);

  const toggle = (id: string) => {
    setConnected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const next = () => {
    if (step < 2) setStep(step + 1);
    else onDone(username || "@hitha", connected);
  };
  const back = () => setStep(Math.max(0, step - 1));

  const canContinue =
    step === 0 ? true : step === 1 ? username.trim().length >= 2 : true;

  return (
    <div className="absolute inset-0 z-50" style={{ background: INK }}>
      {/* progress dots */}
      <div className="absolute top-12 left-0 right-0 flex justify-center gap-1.5 z-10">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-full transition-all"
            style={{
              width: i === step ? 22 : 6,
              height: 6,
              background: i <= step ? PINK : "rgba(255,255,255,0.15)",
            }}
          />
        ))}
      </div>

      {/* back arrow (steps 1+) */}
      {step > 0 && (
        <button
          onClick={back}
          className="absolute top-10 left-6 z-10 rounded-full flex items-center justify-center"
          style={{
            width: 32,
            height: 32,
            background: "rgba(255,255,255,0.06)",
            color: "white",
          }}
          data-testid="onboarding-back"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.8} />
        </button>
      )}

      {/* skip (step 0 only) */}
      {step === 0 && (
        <button
          onClick={() => onDone("@hitha", new Set(APPS.map((a) => a.id)))}
          className="absolute top-10 right-6 z-10 text-[10px] tracking-[0.2em] text-white/45"
          style={{ fontFamily: "ui-monospace, monospace" }}
          data-testid="onboarding-skip"
        >
          SKIP
        </button>
      )}

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center"
          >
            <PulseLogo size={96} />
            <div
              className="text-[10px] tracking-[0.35em] text-white/45 mt-8 mb-3"
              style={{ fontFamily: "ui-monospace, monospace" }}
            >
              WELCOME TO
            </div>
            <h1
              className="text-white text-[56px] leading-none tracking-tight mb-4"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 500 }}
            >
              <em style={{ fontStyle: "italic", fontWeight: 400 }}>Pulse.</em>
            </h1>
            <p
              className="text-white/60 text-[14px] leading-snug lowercase max-w-[260px]"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              your creative pulse, every channel, in one quiet place.
            </p>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="username"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0 flex flex-col px-8 pt-32"
          >
            <div
              className="text-[10px] tracking-[0.3em] text-white/40 mb-3"
              style={{ fontFamily: "ui-monospace, monospace" }}
            >
              STEP 02 // IDENTITY
            </div>
            <h1
              className="text-white text-[34px] leading-[1.05] tracking-tight mb-2"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 500 }}
            >
              What should we{" "}
              <em style={{ fontStyle: "italic", fontWeight: 400 }}>call you?</em>
            </h1>
            <p
              className="text-white/55 text-[13px] mb-8 lowercase"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              this is how your operator profile will appear.
            </p>

            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 14,
              }}
            >
              <span
                className="text-[16px] text-white/40"
                style={{ fontFamily: "ui-monospace, monospace" }}
              >
                @
              </span>
              <input
                type="text"
                placeholder="yourhandle"
                value={username.replace(/^@/, "")}
                onChange={(e) => setUsername("@" + e.target.value.replace(/[^a-zA-Z0-9_.]/g, ""))}
                className="bg-transparent outline-none text-white text-[16px] flex-1"
                style={{ fontFamily: "ui-monospace, monospace" }}
                autoFocus
                data-testid="onboarding-username"
              />
            </div>

            <div
              className="text-[9px] tracking-[0.2em] text-white/35 mt-3"
              style={{ fontFamily: "ui-monospace, monospace" }}
            >
              MIN 2 CHARS // LETTERS, NUMBERS, _ .
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="connect"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0 flex flex-col px-8 pt-28"
          >
            <div
              className="text-[10px] tracking-[0.3em] text-white/40 mb-3"
              style={{ fontFamily: "ui-monospace, monospace" }}
            >
              STEP 03 // CHANNELS
            </div>
            <h1
              className="text-white text-[34px] leading-[1.05] tracking-tight mb-2"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 500 }}
            >
              Connect your{" "}
              <em style={{ fontStyle: "italic", fontWeight: 400 }}>channels.</em>
            </h1>
            <p
              className="text-white/55 text-[13px] mb-6 lowercase"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              pick what you publish on. you can change this later.
            </p>

            <div className="flex flex-col gap-2">
              {APPS.map((app) => {
                const isOn = connected.has(app.id);
                return (
                  <motion.button
                    key={app.id}
                    onClick={() => toggle(app.id)}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-3 px-3 py-3 text-left transition-all"
                    style={{
                      background: isOn
                        ? "rgba(229,185,185,0.12)"
                        : "rgba(255,255,255,0.04)",
                      border: `1px solid ${isOn ? PINK : "rgba(255,255,255,0.08)"}`,
                      borderRadius: 14,
                    }}
                    data-testid={`onboarding-toggle-${app.id}`}
                  >
                    <AppLogo app={app} size={26} />
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-[11px] tracking-[0.18em] font-semibold text-white"
                        style={{ fontFamily: "ui-monospace, monospace" }}
                      >
                        {app.app}
                      </div>
                      <div
                        className="text-[9px] tracking-wider text-white/50"
                        style={{ fontFamily: "ui-monospace, monospace" }}
                      >
                        {app.handle}
                      </div>
                    </div>
                    <div
                      className="rounded-full flex items-center justify-center transition-all"
                      style={{
                        width: 22,
                        height: 22,
                        background: isOn ? PINK : "transparent",
                        border: `1px solid ${isOn ? PINK : "rgba(255,255,255,0.25)"}`,
                      }}
                    >
                      {isOn && <Check className="w-3 h-3" strokeWidth={3} color={INK} />}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <div
              className="text-[9px] tracking-[0.2em] text-white/35 mt-4"
              style={{ fontFamily: "ui-monospace, monospace" }}
            >
              {connected.size} OF {APPS.length} CONNECTED
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA button */}
      <div className="absolute left-0 right-0 bottom-10 px-8">
        <motion.button
          onClick={next}
          disabled={!canContinue}
          whileTap={canContinue ? { scale: 0.97 } : undefined}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-full transition-all"
          style={{
            background: canContinue ? CREAM : "rgba(255,255,255,0.08)",
            color: canContinue ? INK : "rgba(255,255,255,0.3)",
          }}
          data-testid="onboarding-continue"
        >
          <span
            className="text-[12px] tracking-[0.22em] font-semibold"
            style={{ fontFamily: "ui-monospace, monospace" }}
          >
            {step === 0 ? "BEGIN" : step === 1 ? "CONTINUE" : "GET STARTED"}
          </span>
          <ArrowRight className="w-4 h-4" strokeWidth={2.2} />
        </motion.button>
      </div>
    </div>
  );
}

/* ---------------- ROOT ---------------- */

export function Pulse() {
  const [activeNav, setActiveNav] = useState<NavKey>("home");
  const [onboarded, setOnboarded] = useState(false);
  const [onboardStep, setOnboardStep] = useState(0);
  const [username, setUsername] = useState("@hitha");
  const [connected, setConnected] = useState<Set<string>>(new Set());

  const { data: liveData, status, blinkSet, refresh } = usePulseData();
  const liveByApp = useMemo(() => indexByAppId(liveData), [liveData]);

  const handleOnboardDone = (u: string, c: Set<string>) => {
    setUsername(u);
    setConnected(c);
    setOnboarded(true);
  };

  const replayOnboarding = () => {
    setOnboardStep(0);
    setOnboarded(false);
  };

  const openConnectStep = () => {
    setOnboardStep(2);
    setOnboarded(false);
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{ background: INK }}
    >
      <div
        className="relative overflow-hidden"
        style={{ width: 390, height: 844, background: INK }}
      >
        {!onboarded ? (
          <Onboarding
            initialStep={onboardStep}
            initialUsername={username}
            initialConnected={connected}
            onDone={handleOnboardDone}
          />
        ) : (
          <>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeNav}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0"
              >
                {activeNav === "home" && (
                  <HomePage
                    status={status}
                    username={username}
                    onAddChannel={openConnectStep}
                    liveByApp={liveByApp}
                    blinkSet={blinkSet}
                    onStatusClick={refresh}
                  />
                )}
                {activeNav === "analytics" && (
                  <AnalyticsPage status={status} onStatusClick={refresh} />
                )}
                {activeNav === "recent" && (
                  <RecentsPage status={status} onStatusClick={refresh} />
                )}
                {activeNav === "profile" && (
                  <ProfilePage
                    status={status}
                    username={username}
                    onResetOnboarding={replayOnboarding}
                    onStatusClick={refresh}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            <BottomNav active={activeNav} setActive={setActiveNav} />
          </>
        )}
      </div>
    </div>
  );
}

export default Pulse;
