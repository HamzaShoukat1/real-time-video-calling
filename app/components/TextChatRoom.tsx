"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Socket } from "socket.io-client";

type ChatMessage = { id: string; text: string; mine: boolean };

export default function TextChatRoom({
  socket,
  roomId,
  onNext,
  onEnd,
}: {
  socket: Socket;
  roomId: string;
  onNext: () => void;
  onEnd: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const onMessage = ({ text, senderId }: { text: string; senderId: string }) => {
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), text, mine: senderId === socket.id },
      ]);
    };

    socket.on("chat-message", onMessage);
    return () => {
      socket.off("chat-message", onMessage);
    }
  }, [roomId, socket]);

  const sendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;

    socket.emit("chat-message", { roomId, text });
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), text, mine: true },
    ]);
    setDraft("");
  };

  return (
    <section className="flex h-[75vh] min-h-[420px] flex-col bg-zinc-950/80 text-white">
      <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div>
          <h2 className="font-semibold">Text chat</h2>
          <p className="text-xs text-zinc-400">Connected anonymously</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onNext}
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-950"
          >
            Next
          </button>
          <button
            type="button"
            onClick={onEnd}
            className="rounded-full border border-red-400/30 px-4 py-2 text-sm font-semibold text-red-300"
          >
            Leave
          </button>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-5" aria-live="polite">
        {messages.length === 0 && (
          <p className="text-center text-sm text-zinc-500">
            Say hello to start the conversation.
          </p>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.mine ? "justify-end" : "justify-start"}`}
          >
            <p
              className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2 text-sm ${
                message.mine
                  ? "bg-purple-600 text-white"
                  : "bg-zinc-800 text-zinc-100"
              }`}
            >
              {message.text}
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className="flex gap-2 border-t border-white/10 p-4">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={1000}
          placeholder="Write a message..."
          aria-label="Message"
          className="min-w-0 flex-1 rounded-full border border-white/10 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-purple-400"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="rounded-full bg-white px-5 py-3 text-sm font-bold text-zinc-950 disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </section>
  );
}
