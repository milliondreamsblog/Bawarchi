/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import Button from "@/components/Button";
import ItemCard from "@/components/ItemCard";

export default function ChatPage() {
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<any>(null);
    const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!query.trim()) return;

        setLoading(true);
        setMessages((prev) => [...prev, { role: "user", content: query }]);

        try {
            const res = await fetch("/api/ai/recommend", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userQuery: query }),
            });

            const data = await res.json();

            if (data.success) {
                setResponse(data);
                setMessages((prev) => [
                    ...prev,
                    {
                        role: "assistant",
                        content: data.message || "Here are my recommendations",
                    },
                ]);
            } else {
                setMessages((prev) => [
                    ...prev,
                    {
                        role: "assistant",
                        content: "Sorry, I couldn't process your request. Please try again.",
                    },
                ]);
            }
        } catch (error) {
            console.error("AI request error:", error);
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "An error occurred. Please try again.",
                },
            ]);
        } finally {
            setLoading(false);
            setQuery("");
        }
    };

    return (
        <div className="min-h-screen">
            {/* Header */}
            <div className="gradient-bg text-white py-6 px-4 mb-6">
                <div className="container">
                    <h1 className="text-white">AI Food Assistant</h1>
                    <p className="opacity-90">Ask me for meal recommendations!</p>
                </div>
            </div>

            <div className="container max-w-4xl">
                {/* Chat Messages */}
                <div className="mb-6 space-y-4">
                    {messages.length === 0 && (
                        <div className="card text-center">
                            <h3 className="text-secondary mb-3">Try asking:</h3>
                            <div className="grid gap-2">
                                <button
                                    onClick={() => setQuery("Give me a 400 calorie meal")}
                                    className="btn btn-outline"
                                >
                                    &quot;Give me a 400 calorie meal&quot;
                                </button>
                                <button
                                    onClick={() => setQuery("Best combo under ₹200")}
                                    className="btn btn-outline"
                                >
                                    &ldquo;Best combo under ₹200&ldquo;
                                </button>
                                <button
                                    onClick={() => setQuery("I want vegetarian food")}
                                    className="btn btn-outline"
                                >
                                    &quot;I want vegetarian food&quot;
                                </button>
                            </div>
                        </div>
                    )}

                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`card ${msg.role === "user" ? "bg-blue-50 ml-12" : "bg-gray-50 mr-12"
                                }`}
                        >
                            <p className="font-semibold mb-1">
                                {msg.role === "user" ? "You" : "AI Assistant"}
                            </p>
                            <p>{msg.content}</p>
                        </div>
                    ))}
                </div>

                {/* Recommendations */}
                {response?.recommendations && response.recommendations.length > 0 && (
                    <div className="mb-6">
                        <h3 className="mb-4">Recommended Items</h3>
                        <div className="grid grid-2">
                            {response.recommendations.map((item: any) => (
                                <ItemCard key={item._id} item={item} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Input Form */}
                <div className="card sticky bottom-4">
                    <form onSubmit={handleSubmit} className="flex gap-3">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Ask for meal recommendations..."
                            className="input flex-1"
                            disabled={loading}
                        />
                        <Button type="submit" variant="primary" disabled={loading}>
                            {loading ? "..." : "Ask"}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
