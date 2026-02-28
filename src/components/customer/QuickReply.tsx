"use client";

interface QuickReplyProps {
  replies:  string[];
  onSelect: (reply: string) => void;
  disabled?: boolean;
}

/**
 * Horizontally scrollable row of tappable quick-reply chips.
 * Displayed below the last AI message.
 */
export function QuickReply({ replies, onSelect, disabled = false }: QuickReplyProps) {
  if (replies.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-2 scrollbar-hide">
      {replies.map((reply) => (
        <button
          key={reply}
          onClick={() => !disabled && onSelect(reply)}
          disabled={disabled}
          className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-all ${
            disabled
              ? "border-cu-border bg-cu-bg text-cu-text/40 cursor-not-allowed"
              : "border-cu-accent/40 bg-cu-accent/8 text-cu-accent hover:bg-cu-accent/15 active:scale-95"
          }`}
        >
          {reply}
        </button>
      ))}
    </div>
  );
}
