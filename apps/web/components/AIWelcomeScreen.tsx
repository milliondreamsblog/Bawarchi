"use client";

import React, { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";

interface AIWelcomeScreenProps {
  restaurantName: string;
  tableLabel?: string;
  onShowMenu: () => void;
  onStartChat: (initialMessage: string) => void;
}

type QuickAction =
  | { label: string; kind: "menu" }
  | { label: string; kind: "chat"; prompt: string };

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Recommend something", kind: "chat", prompt: "What do you recommend?" },
  { label: "Vegetarian options", kind: "chat", prompt: "Show me vegetarian options" },
  { label: "Best under ₹300", kind: "chat", prompt: "Best combo under ₹300" },
  { label: "Show full menu", kind: "menu" },
];

export default function AIWelcomeScreen({
  restaurantName,
  tableLabel,
  onShowMenu,
  onStartChat,
}: AIWelcomeScreenProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    onStartChat(text);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-[#324F7B] flex flex-col overflow-y-auto">
      {/* Subtle dot pattern (matches hero) */}
      <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_1px_1px,_white_1px,_transparent_0)] [background-size:24px_24px] pointer-events-none" />

      {/* Top bar */}
      <div className="relative flex items-center justify-between px-5 pt-5">
        <div className="text-[10px] tracking-[0.25em] text-white/50 uppercase">
          Powered by Bawarchie
        </div>
        <button
          onClick={onShowMenu}
          className="text-white/70 hover:text-white text-xs tracking-[0.2em] uppercase font-medium transition-colors"
        >
          Skip to menu →
        </button>
      </div>

      {/* Centered content */}
      <div className="relative flex-1 flex flex-col justify-center max-w-2xl w-full mx-auto px-5 sm:px-8 py-10">
        <div className="flex items-center gap-2 text-xs tracking-[0.25em] uppercase text-[#86A6DE] mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          AI Waiter
        </div>

        <h1 className="text-3xl sm:text-5xl font-serif italic text-white tracking-tight leading-tight mb-3">
          Welcome to {restaurantName}
        </h1>
        {tableLabel && (
          <p className="text-[#86A6DE] text-sm mb-5 tracking-wide">
            Seated at {tableLabel}
          </p>
        )}
        <p className="text-white/75 text-base sm:text-lg mb-10 max-w-lg leading-relaxed">
          Tell me what you&apos;re craving and I&apos;ll pick the best dishes from the menu — or jump straight to browsing.
        </p>

        {/* Input — ChatGPT-style */}
        <form onSubmit={handleSubmit} className="relative mb-5">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. something light and spicy under ₹400"
            className="w-full bg-white/10 backdrop-blur-sm border border-white/15 text-white placeholder:text-white/40 rounded-2xl pl-5 pr-14 py-4 text-base outline-none focus:bg-white/15 focus:border-[#86A6DE] focus:ring-2 focus:ring-[#86A6DE]/30 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            aria-label="Ask AI waiter"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#86A6DE] text-[#324F7B] rounded-xl flex items-center justify-center hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>

        {/* Quick-action chips */}
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => {
            const isMenu = action.kind === "menu";
            return (
              <button
                key={action.label}
                onClick={() =>
                  isMenu ? onShowMenu() : onStartChat(action.prompt)
                }
                className={`text-sm font-medium px-4 py-2 rounded-full border transition-all ${
                  isMenu
                    ? "bg-[#86A6DE] text-[#324F7B] border-[#86A6DE] hover:bg-white"
                    : "bg-transparent text-white border-white/20 hover:border-[#86A6DE] hover:bg-white/5"
                }`}
              >
                {action.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footnote */}
      <div className="relative px-5 pb-6 text-center">
        <p className="text-[10px] text-white/40 tracking-[0.2em] uppercase">
          Anonymous — no sign-in required
        </p>
      </div>
    </div>
  );
}
