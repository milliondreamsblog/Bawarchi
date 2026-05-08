"use client";

import React, { useState, useRef, useEffect } from "react";

interface MenuItem {
  _id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  calories?: number;
  image?: string;
  available?: boolean;
}

interface CartAction {
  itemId: string;
  name: string;
  qty: number;
  action: string;
  item: MenuItem;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  suggestedItems?: MenuItem[];
  cartActions?: CartAction[];
}

interface MenuAIChatProps {
  restaurantId: string;
  onAddToCart: (item: MenuItem, qty?: number) => void;
}

const QUICK_PROMPTS = [
  "What do you recommend?",
  "Show me vegetarian options",
  "Best combo under ₹300",
  "Low calorie meal ideas",
];

export default function MenuAIChat({ restaurantId, onAddToCart }: MenuAIChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage: ChatMessage = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          restaurantId,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const actions: CartAction[] = data.cartActions || [];

        // Auto-add cart actions immediately
        if (actions.length > 0) {
          actions.forEach((a) => {
            if (a.item) onAddToCart(a.item, a.qty);
          });
        }

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.message,
            suggestedItems: data.suggestedItems || [],
            cartActions: actions,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, I'm having trouble right now. Please try again.",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "An error occurred. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (item: MenuItem) => {
    onAddToCart(item);
    setAddedItems((prev) => new Set(prev).add(item._id));
    setTimeout(() => {
      setAddedItems((prev) => {
        const next = new Set(prev);
        next.delete(item._id);
        return next;
      });
    }, 1500);
  };

  return (
    <>
      {/* Floating AI Chat Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-[60] w-14 h-14 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform duration-200"
        aria-label="AI Food Assistant"
        title="Chat with AI Waiter"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 z-[60] w-[min(380px,calc(100vw-2rem))] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{ maxHeight: "70vh" }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-sm">AI Waiter</p>
                <p className="text-xs text-purple-200">Ask me anything about the menu</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-700">
                    Hi! I&apos;m your AI waiter. I know everything on the menu and can help you find the perfect meal. What are you in the mood for?
                  </p>
                </div>
                <div className="space-y-2">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      className="w-full text-left text-sm bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 px-3 py-2 rounded-lg transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col gap-2 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-purple-600 text-white rounded-br-sm"
                      : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>

                {/* Cart action confirmation */}
                {msg.cartActions && msg.cartActions.length > 0 && (
                  <div className="w-full mt-1.5">
                    <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 flex flex-wrap gap-1.5">
                      <span className="text-xs font-semibold text-green-700 w-full mb-0.5">
                        ✓ Added to cart:
                      </span>
                      {msg.cartActions.map((a, i) => (
                        <span key={i} className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">
                          {a.qty > 1 ? `${a.qty}× ` : ""}{a.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested items from AI */}
                {msg.suggestedItems && msg.suggestedItems.length > 0 && (
                  <div className="w-full space-y-2 mt-1">
                    {msg.suggestedItems.map((item) => (
                      <div
                        key={item._id}
                        className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 flex items-center justify-between gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">{item.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-green-600 font-semibold text-sm">₹{item.price}</span>
                            {item.calories && (
                              <span className="text-gray-400 text-xs">{item.calories} kcal</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddToCart(item)}
                          className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                            addedItems.has(item._id)
                              ? "bg-green-100 text-green-700"
                              : "bg-purple-600 text-white hover:bg-purple-700"
                          }`}
                        >
                          {addedItems.has(item._id) ? "Added!" : "+ Add"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-start">
                <div className="bg-white rounded-xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about the menu..."
                className="flex-1 bg-gray-100 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-300 transition-all"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="w-9 h-9 bg-purple-600 text-white rounded-xl flex items-center justify-center hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
