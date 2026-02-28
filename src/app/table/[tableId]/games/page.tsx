"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Lock, RotateCcw, Trophy, Calculator } from "lucide-react";
import { useCustomer } from "@/lib/CustomerContext";
import { formatCurrency, cn } from "@/lib/utils";
import type { TriviaQuestion } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Spin Wheel data — must match server SEGMENTS order
// ---------------------------------------------------------------------------

const WHEEL_SEGMENTS = [
  { label: "5% OFF",    line1: "5%",     line2: "OFF",     color: "#F59E0B", textColor: "#fff" },
  { label: "10% OFF",   line1: "10%",    line2: "OFF",     color: "#EF4444", textColor: "#fff" },
  { label: "15% OFF",   line1: "15%",    line2: "OFF",     color: "#10B981", textColor: "#fff" },
  { label: "Free Dessert", line1: "Free",line2: "Dessert", color: "#8B5CF6", textColor: "#fff" },
  { label: "Free Drink",line1: "Free",   line2: "Drink",   color: "#3B82F6", textColor: "#fff" },
  { label: "Better Luck", line1: "Better", line2: "Luck",  color: "#6B7280", textColor: "#fff" },
];

// SVG helpers
const CX = 150, CY = 150, R = 130, LABEL_R = R * 0.63;
const SEG_DEG = 360 / WHEEL_SEGMENTS.length; // 60°

function toRad(deg: number) { return (deg * Math.PI) / 180; }
function polarPt(angle: number, r = R) {
  return { x: CX + r * Math.cos(toRad(angle)), y: CY + r * Math.sin(toRad(angle)) };
}

// Segment i is centered at (i * 60 - 90)° in SVG coords (top = -90°)
function segPath(i: number) {
  const start = i * SEG_DEG - 90 - SEG_DEG / 2; // e.g. -120° for i=0
  const end   = start + SEG_DEG;
  const s = polarPt(start);
  const e = polarPt(end);
  return `M ${CX} ${CY} L ${s.x} ${s.y} A ${R} ${R} 0 0 1 ${e.x} ${e.y} Z`;
}

// ---------------------------------------------------------------------------
// Spin Wheel component
// ---------------------------------------------------------------------------

interface SpinWheelProps {
  sessionId:      string;
  restaurantSlug: string;
  gamePlayUsed:   boolean;
  onWin:          (prize: string, discountPct: number) => void;
}

function SpinWheel({ sessionId, restaurantSlug, gamePlayUsed, onWin }: SpinWheelProps) {
  const [rotation,   setRotation]   = useState(0);
  const [spinning,   setSpinning]   = useState(false);
  const [result,     setResult]     = useState<{ prize: string; won: boolean } | null>(null);
  const [used,       setUsed]       = useState(gamePlayUsed);
  const [error,      setError]      = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleSpin = useCallback(async () => {
    if (spinning || used) return;
    setSpinning(true);
    setError(null);
    try {
      const res  = await fetch("/api/games/spin", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ sessionId, restaurantSlug }),
      });
      const data = await res.json() as { segmentIndex?: number; prize?: string; discountPct?: number; won?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Spin failed");

      const { segmentIndex = 0, prize = "", discountPct = 0, won = false } = data;

      // Rotate so segmentIndex is at the top pointer
      const prevBase   = rotation % 360;
      const needed     = ((segmentIndex * SEG_DEG) - prevBase + 360) % 360;
      const newRotation = rotation + 5 * 360 + needed;

      setRotation(newRotation);

      // Wait for animation to finish (4.2s)
      setTimeout(() => {
        setSpinning(false);
        setUsed(true);
        setResult({ prize, won });
        if (won) { setShowConfetti(true); onWin(prize, discountPct); }
      }, 4300);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSpinning(false);
    }
  }, [spinning, used, rotation, sessionId, restaurantSlug, onWin]);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Confetti */}
      {showConfetti && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
          <div className="animate-bounce text-6xl">🎉</div>
        </div>
      )}

      {/* Wheel + pointer */}
      <div className="relative">
        {/* Top pointer */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-3 z-10">
          <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[20px] border-l-transparent border-r-transparent border-t-cu-accent" />
        </div>

        <svg
          width="300"
          height="300"
          viewBox="0 0 300 300"
          className="drop-shadow-xl"
          style={{
            transform:  `rotate(${rotation}deg)`,
            transition: spinning ? "transform 4.2s cubic-bezier(0.17,0.67,0.12,0.99)" : "none",
          }}
        >
          {WHEEL_SEGMENTS.map((seg, i) => {
            const midAngle = i * SEG_DEG - 90;
            const lp       = polarPt(midAngle, LABEL_R);
            // Rotate text to be radial; flip bottom-half text to stay readable
            const isBottom  = midAngle > 0 && midAngle < 180;
            const textRot   = midAngle + 90 + (isBottom ? 180 : 0);

            return (
              <g key={seg.label}>
                <path d={segPath(i)} fill={seg.color} stroke="#fff" strokeWidth="2" />
                <text
                  transform={`translate(${lp.x},${lp.y}) rotate(${textRot})`}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={seg.textColor}
                  fontSize="13"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  <tspan x="0" dy="-7">{seg.line1}</tspan>
                  <tspan x="0" dy="16">{seg.line2}</tspan>
                </text>
              </g>
            );
          })}
          {/* Center circle */}
          <circle cx={CX} cy={CY} r="20" fill="#1C1917" stroke="#fff" strokeWidth="3" />
        </svg>
      </div>

      {/* Result */}
      {result && (
        <div className={cn(
          "w-full max-w-xs rounded-2xl p-4 text-center",
          result.won ? "bg-cu-green/10 border border-cu-green/30" : "bg-cu-text/5 border border-cu-border"
        )}>
          <p className="text-2xl mb-1">{result.won ? "🎊" : "😅"}</p>
          <p className="font-bold text-cu-text text-lg">{result.won ? `You won: ${result.prize}!` : "Better luck next time!"}</p>
          {result.won && <p className="text-sm text-cu-text/60 mt-1">Discount applied to your bill automatically.</p>}
        </div>
      )}

      {/* Spin button */}
      {!used && (
        <button
          onClick={handleSpin}
          disabled={spinning}
          className="rounded-full bg-cu-accent px-10 py-3 text-lg font-bold text-white shadow-lg active:scale-95 transition-transform disabled:opacity-60"
        >
          {spinning ? "Spinning…" : "SPIN!"}
        </button>
      )}
      {used && !result && (
        <p className="text-sm text-cu-text/50">Spin wheel already used this session.</p>
      )}

      {error && <p className="text-sm text-cu-red">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Food Trivia component
// ---------------------------------------------------------------------------

interface TriviaProps {
  sessionId:      string;
  restaurantSlug: string;
  onDiscount:     (pct: number) => void;
}

function FoodTrivia({ sessionId, restaurantSlug, onDiscount }: TriviaProps) {
  const [questions,    setQuestions]    = useState<TriviaQuestion[]>([]);
  const [current,      setCurrent]      = useState(0);
  const [score,        setScore]        = useState(0);
  const [selected,     setSelected]     = useState<number | null>(null);
  const [done,         setDone]         = useState(false);
  const [gameResult,   setGameResult]   = useState<{ won: boolean; score: number } | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [submitting,   setSubmitting]   = useState(false);

  useEffect(() => {
    fetch("/api/games/trivia?count=5")
      .then((r) => r.json())
      .then((d: { questions?: TriviaQuestion[] }) => { setQuestions(d.questions ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleAnswer = useCallback((idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    const q = questions[current];
    const correct = idx === q.correct;
    const newScore = correct ? score + 1 : score;

    setTimeout(async () => {
      if (current + 1 >= questions.length) {
        // Round over
        setDone(true);
        setSubmitting(true);
        try {
          const res  = await fetch("/api/games/trivia", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ sessionId, restaurantSlug, score: newScore }),
          });
          const data = await res.json() as { won?: boolean; score?: number };
          setGameResult({ won: !!data.won, score: newScore });
          if (data.won) onDiscount(0.05);
        } catch { /* ignore */ } finally {
          setSubmitting(false);
        }
      } else {
        setCurrent((c) => c + 1);
        setSelected(null);
        setScore(newScore);
      }
    }, 900);
  }, [selected, current, score, questions, sessionId, restaurantSlug, onDiscount]);

  const handleRestart = useCallback(() => {
    setLoading(true);
    setQuestions([]);
    setCurrent(0);
    setScore(0);
    setSelected(null);
    setDone(false);
    setGameResult(null);
    fetch("/api/games/trivia?count=5")
      .then((r) => r.json())
      .then((d: { questions?: TriviaQuestion[] }) => { setQuestions(d.questions ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-12 text-center text-cu-text/50 text-sm">Loading questions…</div>;

  if (done && gameResult) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <p className="text-5xl">{gameResult.won ? "🏆" : "📚"}</p>
        <p className="text-xl font-bold text-cu-text">
          {gameResult.score} / {questions.length} correct
        </p>
        <p className="text-cu-text/70">
          {gameResult.won
            ? "Excellent! 5% discount added to your bill!"
            : "Almost! Score 4/5 or better to win a discount."}
        </p>
        <button onClick={handleRestart} className="mt-2 flex items-center gap-2 rounded-xl bg-cu-accent/10 px-5 py-2.5 text-sm font-medium text-cu-accent">
          <RotateCcw className="h-4 w-4" /> Play Again
        </button>
      </div>
    );
  }

  const q = questions[current];
  if (!q) return null;

  return (
    <div className="flex flex-col gap-4">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-cu-text/50">
        <span>Question {current + 1} of {questions.length}</span>
        <span>Score: {score}</span>
      </div>
      <div className="h-1.5 rounded-full bg-cu-border overflow-hidden">
        <div className="h-full bg-cu-accent rounded-full transition-all" style={{ width: `${((current) / questions.length) * 100}%` }} />
      </div>

      {/* Question */}
      <p className="font-semibold text-cu-text text-base leading-snug">{q.question}</p>

      {/* Options */}
      <div className="grid grid-cols-1 gap-2.5">
        {q.options.map((opt, idx) => {
          let style = "border-cu-border bg-white text-cu-text";
          if (selected !== null) {
            if (idx === q.correct)        style = "border-cu-green bg-cu-green/10 text-cu-green font-semibold";
            else if (idx === selected)    style = "border-cu-red bg-cu-red/10 text-cu-red";
            else                          style = "border-cu-border bg-white/50 text-cu-text/40";
          }
          return (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              disabled={selected !== null || submitting}
              className={cn("rounded-xl border-2 px-4 py-3 text-sm text-left transition-all", style)}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Estimate the Bill component
// ---------------------------------------------------------------------------

interface OrderItem { name: string; quantity: number; unitPrice: number; }
interface EstimateProps {
  sessionId:      string;
  restaurantSlug: string;
  onDiscount:     (pct: number) => void;
}

function EstimateBill({ sessionId, restaurantSlug, onDiscount }: EstimateProps) {
  const [items,     setItems]     = useState<OrderItem[]>([]);
  const [total,     setTotal]     = useState(0);
  const [guess,     setGuess]     = useState("");
  const [revealed,  setRevealed]  = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/customer/orders?sessionId=${sessionId}&restaurant=${restaurantSlug}`)
      .then((r) => r.json())
      .then((data: { orders?: Array<{ items: Array<{ quantity: number; unitPrice: number; dish: { name: string } }>; total: number }> }) => {
        const allItems: OrderItem[] = [];
        let grandTotal = 0;
        (data.orders ?? []).forEach((o) => {
          grandTotal += o.total;
          o.items.forEach((i) => allItems.push({ name: i.dish.name, quantity: i.quantity, unitPrice: i.unitPrice }));
        });
        setItems(allItems);
        setTotal(grandTotal);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [sessionId, restaurantSlug]);

  const handleSubmit = useCallback(() => {
    const g = parseFloat(guess);
    if (isNaN(g) || g <= 0) return;
    const diff = Math.abs(g - total) / total;
    const won  = diff <= 0.10;
    setRevealed(true);
    setSubmitted(true);
    if (won) onDiscount(0.05);
  }, [guess, total, onDiscount]);

  if (loading) return <div className="py-12 text-center text-cu-text/50 text-sm">Loading your order…</div>;
  if (items.length === 0) return <div className="py-12 text-center text-cu-text/50 text-sm">No items ordered yet.</div>;

  const guessNum = parseFloat(guess);
  const diff     = submitted ? Math.abs(guessNum - total) / total : null;
  const won      = diff !== null && diff <= 0.10;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-cu-text/70">Can you guess your total? Get within 10% and win 5% off!</p>

      {/* Items (no prices) */}
      <div className="rounded-xl border border-cu-border bg-white divide-y divide-cu-border/50">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
            <span className="text-cu-text">{item.name}</span>
            <span className="text-cu-text/50 text-xs">×{item.quantity}</span>
          </div>
        ))}
      </div>

      {/* Guess input */}
      {!submitted ? (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cu-text/50">$</span>
            <input
              type="number"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border border-cu-border py-3 pl-7 pr-3 text-sm text-cu-text focus:border-cu-accent/50 focus:outline-none"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={!guess || isNaN(parseFloat(guess))}
            className="rounded-xl bg-cu-accent px-5 py-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            Guess!
          </button>
        </div>
      ) : (
        <div className={cn(
          "rounded-2xl p-4 text-center",
          won ? "bg-cu-green/10 border border-cu-green/30" : "bg-cu-text/5 border border-cu-border"
        )}>
          <p className="text-2xl mb-1">{won ? "🎯" : "📊"}</p>
          <p className="font-bold text-cu-text">Actual total: {formatCurrency(total)}</p>
          <p className="text-sm text-cu-text/60 mt-1">Your guess: {formatCurrency(guessNum)}</p>
          <p className="text-sm mt-2 font-medium">
            {won
              ? "Spot on! 5% discount added to your bill! 🎉"
              : `Off by ${((diff ?? 0) * 100).toFixed(1)}% — within 10% wins a discount.`}
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Games Page
// ---------------------------------------------------------------------------

export default function GamesPage() {
  const searchParams   = useSearchParams();
  const restaurantSlug = searchParams.get("restaurant") ?? "";
  const { sessionId }  = useCustomer();

  const [tab,          setTab]          = useState<"spin" | "trivia" | "estimate">("spin");
  const [hasOrders,    setHasOrders]    = useState(false);
  const [gamePlayUsed, setGamePlayUsed] = useState(false);
  const [discount,     setDiscount]     = useState<number | null>(null);
  const [checking,     setChecking]     = useState(true);

  // Check session status
  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/sessions?sessionId=${sessionId}`)
      .then((r) => r.json())
      .then((d: { hasOrders?: boolean; gamePlayUsed?: boolean; discount?: number | null }) => {
        setHasOrders(!!d.hasOrders);
        setGamePlayUsed(!!d.gamePlayUsed);
        setDiscount(d.discount ?? null);
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [sessionId]);

  const handleWin = useCallback((prize: string, pct: number) => {
    if (pct > 0) setDiscount(pct);
  }, []);

  const handleDiscount = useCallback((pct: number) => {
    setDiscount((prev) => (prev === null || pct > prev) ? pct : prev);
  }, []);

  if (checking) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-cu-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cu-accent border-t-transparent" />
      </div>
    );
  }

  // Locked state
  if (!hasOrders) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-cu-bg px-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-cu-accent/10">
          <Lock className="h-10 w-10 text-cu-accent" />
        </div>
        <div>
          <p className="font-display text-2xl font-bold text-cu-text">Games Locked</p>
          <p className="mt-2 text-cu-text/60 text-sm leading-relaxed">
            Place an order to unlock games and win discounts!
          </p>
        </div>
        <div className="flex gap-3 text-3xl">🎯 🎰 🧮</div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-cu-bg">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-cu-border bg-white/95 px-4 py-3 backdrop-blur-sm">
        <h1 className="font-display text-lg font-bold text-cu-text text-center">Games & Prizes</h1>
        {discount !== null && (
          <p className="text-center text-xs text-cu-green font-medium mt-0.5">
            🎉 {(discount * 100).toFixed(0)}% discount won — applied to your bill!
          </p>
        )}
      </header>

      {/* Tab bar */}
      <div className="flex border-b border-cu-border bg-white">
        {(["spin", "trivia", "estimate"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors",
              tab === t
                ? "border-b-2 border-cu-accent text-cu-accent"
                : "text-cu-text/50 hover:text-cu-text"
            )}
          >
            {t === "spin"     && "🎰 Spin"}
            {t === "trivia"   && "🧠 Trivia"}
            {t === "estimate" && "🧮 Estimate"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-5 pb-24">
        {tab === "spin" && sessionId && (
          <div className="flex flex-col items-center">
            <p className="mb-5 text-center text-sm text-cu-text/60">
              {gamePlayUsed ? "You've already used your spin." : "One spin per visit. Good luck!"}
            </p>
            <SpinWheel
              sessionId={sessionId}
              restaurantSlug={restaurantSlug}
              gamePlayUsed={gamePlayUsed}
              onWin={handleWin}
            />
          </div>
        )}

        {tab === "trivia" && sessionId && (
          <div>
            <div className="mb-4 flex items-center gap-2.5 rounded-xl bg-cu-accent/5 p-3">
              <Trophy className="h-5 w-5 shrink-0 text-cu-accent" />
              <p className="text-sm text-cu-text/70">
                Score <strong className="text-cu-text">4 out of 5</strong> to win a 5% discount!
              </p>
            </div>
            <FoodTrivia
              sessionId={sessionId}
              restaurantSlug={restaurantSlug}
              onDiscount={handleDiscount}
            />
          </div>
        )}

        {tab === "estimate" && sessionId && (
          <div>
            <div className="mb-4 flex items-center gap-2.5 rounded-xl bg-cu-accent/5 p-3">
              <Calculator className="h-5 w-5 shrink-0 text-cu-accent" />
              <p className="text-sm text-cu-text/70">
                Guess your bill within <strong className="text-cu-text">10%</strong> to win 5% off!
              </p>
            </div>
            <EstimateBill
              sessionId={sessionId}
              restaurantSlug={restaurantSlug}
              onDiscount={handleDiscount}
            />
          </div>
        )}
      </div>
    </div>
  );
}
