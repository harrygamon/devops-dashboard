"use client";
import React, { useRef, useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamed, setStreamed] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setStreaming(true);
    setStreamed("");
    const res = await fetch("/api/ai", {
      method: "POST",
      body: JSON.stringify({ prompt: input }),
      headers: { "Content-Type": "application/json" },
    });
    if (res.headers.get("content-type")?.includes("text/event-stream")) {
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let aiMsg = "";
      while (reader) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        chunk.split("\n").forEach((line) => {
          if (line.startsWith("data: ")) {
            try {
              const { content } = JSON.parse(line.replace("data: ", ""));
              aiMsg += content;
              setStreamed(aiMsg);
            } catch {}
          }
        });
      }
      setMessages((prev) => [...prev, { role: "assistant", content: aiMsg }]);
      setStreamed("");
    } else {
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer || "(no reply)" }]);
    }
    setLoading(false);
    setStreaming(false);
    setTimeout(() => {
      if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }, 100);
  };

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">AI Assistant</h1>
        <div className="bg-white rounded-lg shadow p-6 flex flex-col h-[600px]">
          <div className="flex-1 overflow-y-auto mb-4" ref={chatRef}>
            {messages.length === 0 && (
              <div className="text-gray-400 text-center mt-20">Ask the AI assistant for help with logs, CI/CD errors, or Docker issues.</div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`mb-2 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`px-4 py-2 rounded-lg max-w-[80%] whitespace-pre-wrap ${msg.role === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {streaming && (
              <div className="mb-2 flex justify-start">
                <div className="px-4 py-2 rounded-lg max-w-[80%] bg-gray-200 text-gray-800">
                  <span>{streamed}</span>
                  <span className="animate-pulse">|</span>
                </div>
              </div>
            )}
          </div>
          <form onSubmit={sendMessage} className="flex gap-2 mt-auto">
            <input
              type="text"
              className="flex-1 border rounded px-3 py-2"
              placeholder="Type your question..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
              autoFocus
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
              disabled={loading || !input.trim()}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
