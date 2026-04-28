import { useEffect, useMemo, useRef, useState } from "react";
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
} from "lucide-react";

type StatusKind = "live" | "connecting" | "failed";

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
};

const CELL = 14;
const GAP = 1;

const PINK = "#E5B9B9";
const PINK_DARK = "#D49A9A";
const CREAM = "#FDFCF5";
const INK = "#0A0A0A";

const APPS: AppData[] = [
  {
    id: "ig",
    handle: "@hithasetty",
    app: "INSTAGRAM",
    color: PINK,
    baseScore: 85,
    origin: { x: 4, y: 6 },
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
  },
  {
    id: "x",
    handle: "@hitha.codes",
    app: "X / TWITTER",
    color: "#C9D1D9",
    baseScore: 60,
    origin: { x: 22, y: 4 },
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
  },
  {
    id: "tt",
    handle: "@hitha.tt",
    app: "TIKTOK",
    color: "#E8D5A8",
    baseScore: 110,
    origin: { x: 36, y: 9 },
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
  },
  {
    id: "yt",
    handle: "@hitha.yt",
    app: "YOUTUBE",
    color: "#D4A5A5",
    baseScore: 45,
    origin: { x: 56, y: 5 },
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

function Blob({
  app,
  score,
  onClick,
  showBubble,
}: {
  app: AppData;
  score: number;
  onClick: () => void;
  showBubble: boolean;
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

  return (
    <>
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

      {/* label */}
      <div
        className="absolute pointer-events-none flex items-center gap-1.5"
        style={{ left: labelLeft, top: labelTop }}
      >
        <div
          className="rounded-full"
          style={{
            width: 12,
            height: 12,
            background: app.color,
            border: "1.5px solid #1a1a1a",
          }}
        />
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

      {/* Message bubble */}
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
                  {app.likes.toLocaleString()}
                </span>
              </div>
              <div className="w-px h-3 bg-black/15" />
              <div className="flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5" style={{ color: INK }} />
                <span
                  className="text-[11px] font-semibold tracking-wider"
                  style={{ fontFamily: "ui-monospace, monospace", color: INK }}
                >
                  {app.comments.toLocaleString()}
                </span>
              </div>
            </div>
            {/* tail */}
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

function StatusIndicator({ status }: { status: StatusKind }) {
  const dot =
    status === "live" ? "#22C55E" : status === "connecting" ? "#3B82F6" : "#EF4444";
  const label =
    status === "live" ? "LIVE" : status === "connecting" ? "SYNC" : "FAIL";
  return (
    <div className="flex items-center gap-2">
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
          border: "1px solid rgba(255,255,255,0.25)",
        }}
      >
        <motion.div
          className="rounded-full"
          style={{ width: 8, height: 8, background: dot }}
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}

function BottomNav({
  active,
  setActive,
}: {
  active: string;
  setActive: (a: string) => void;
}) {
  const items = [
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
}: {
  app: AppData | null;
  onClose: () => void;
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
            {/* handle */}
            <div className="pt-3 pb-1 flex justify-center">
              <div
                className="rounded-full"
                style={{ width: 38, height: 4, background: "rgba(0,0,0,0.18)" }}
              />
            </div>

            {/* header */}
            <div className="px-5 pt-3 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="rounded-sm"
                  style={{ width: 10, height: 10, background: app.color }}
                />
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
                  {app.posts.map((p, i) => (
                    <motion.div
                      key={p.title}
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

export function Pulse() {
  const [engagementScore, setEngagementScore] = useState(85);
  const [activeBlobId, setActiveBlobId] = useState<string | null>(null);
  const [drawerAppId, setDrawerAppId] = useState<string | null>(null);
  const [activeNav, setActiveNav] = useState("home");
  const [status, setStatus] = useState<StatusKind>("live");
  const scrollRef = useRef<HTMLDivElement>(null);

  // simulate engagement growth ticker
  useEffect(() => {
    const t = setInterval(() => {
      setEngagementScore((s) => {
        const next = s + (Math.random() > 0.5 ? 5 : 0);
        return next > 160 ? 70 : next;
      });
    }, 2400);
    return () => clearInterval(t);
  }, []);

  // status cycle for demo
  useEffect(() => {
    const cycle: StatusKind[] = ["live", "live", "live", "connecting", "live"];
    let i = 0;
    const t = setInterval(() => {
      i = (i + 1) % cycle.length;
      setStatus(cycle[i]);
    }, 4500);
    return () => clearInterval(t);
  }, []);

  const closeAll = () => {
    setActiveBlobId(null);
    setDrawerAppId(null);
  };

  const handleBlobClick = (appId: string) => {
    setActiveBlobId(appId);
    setDrawerAppId(appId);
  };

  const drawerApp = APPS.find((a) => a.id === drawerAppId) ?? null;

  // canvas needs to be wider than mobile screen for horizontal scroll
  const CANVAS_WIDTH = 1100;
  const CANVAS_HEIGHT = 560;

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{ background: INK }}
    >
      <div
        className="relative overflow-hidden"
        style={{
          width: 390,
          height: 844,
          background: INK,
        }}
      >
        {/* Header */}
        <div className="relative z-10 px-6 pt-12 pb-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <div
                className="text-[10px] tracking-[0.25em] text-white/40 mb-1"
                style={{ fontFamily: "ui-monospace, monospace" }}
              >
                PULSE / 04.28
              </div>
            </div>
            <StatusIndicator status={status} />
          </div>

          <h1
            className="text-white text-[40px] leading-[1.05] tracking-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 500 }}
          >
            Hitha <em style={{ fontStyle: "italic", fontWeight: 400 }}>Returns.</em>
          </h1>
          <p
            className="text-white/55 text-[13px] mt-2 leading-snug lowercase"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            engagement is pretty better than yesterday.
          </p>

          {/* engagement ticker */}
          <div className="flex items-center gap-2 mt-3">
            <div
              className="text-[9px] tracking-[0.2em] text-white/40"
              style={{ fontFamily: "ui-monospace, monospace" }}
            >
              SCORE
            </div>
            <div
              className="text-[11px] tracking-wider text-white"
              style={{ fontFamily: "ui-monospace, monospace" }}
            >
              {engagementScore.toString().padStart(3, "0")}
            </div>
            <div className="flex-1 h-px bg-white/10 mx-1" />
            <div
              className="text-[9px] tracking-[0.2em] text-white/40"
              style={{ fontFamily: "ui-monospace, monospace" }}
            >
              +{Math.floor((engagementScore - 60) / 5)} CELLS
            </div>
          </div>
        </div>

        {/* Cream canvas — horizontally scrollable */}
        <div
          ref={scrollRef}
          className="absolute left-0 right-0 overflow-x-auto overflow-y-hidden"
          style={{
            top: 220,
            bottom: 0,
            scrollbarWidth: "none",
          }}
          onClick={closeAll}
        >
          <div
            className="relative"
            style={{
              width: CANVAS_WIDTH,
              minHeight: CANVAS_HEIGHT,
              height: "100%",
              background: CREAM,
              borderTopLeftRadius: 60,
              backgroundImage:
                "radial-gradient(circle, rgba(0,0,0,0.13) 1px, transparent 1px)",
              backgroundSize: `${CELL + GAP}px ${CELL + GAP}px`,
              backgroundPosition: "0 0",
            }}
          >
            {/* corner spec marks */}
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
              const localScore =
                app.id === "ig" ? engagementScore : app.baseScore;
              return (
                <Blob
                  key={app.id}
                  app={app}
                  score={localScore}
                  onClick={() => handleBlobClick(app.id)}
                  showBubble={activeBlobId === app.id}
                />
              );
            })}
          </div>
        </div>

        {/* Drawer */}
        <Drawer app={drawerApp} onClose={closeAll} />

        {/* Bottom Nav (always visible, floats above drawer) */}
        <BottomNav active={activeNav} setActive={setActiveNav} />
      </div>
    </div>
  );
}

export default Pulse;
