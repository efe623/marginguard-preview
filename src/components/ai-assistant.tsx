"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowUp, Bot, FileText, ReceiptText, Sparkles, X } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };

const starters = [
  { label: "Upcoming invoices", prompt: "Which invoices are due in the next 7 days?", icon: ReceiptText },
  { label: "Invoice report", prompt: "Generate a simple invoice report for me.", icon: FileText },
  { label: "Money leaks", prompt: "What money leaks can you see in my current UnitPulse data?", icon: Sparkles }
];

const welcome: Message = {
  role: "assistant",
  content: "Hi, I’m Pulse. I can explain your invoices, upcoming due dates, projects, costs, and profit in simple language."
};

export function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([welcome]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  async function ask(question: string) {
    const clean = question.trim();
    if (!clean || pending) return;
    const nextMessages = [...messages, { role: "user" as const, content: clean }].slice(-10);
    setMessages(nextMessages);
    setInput("");
    setPending(true);
    try {
      const response = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages })
      });
      const data = (await response.json()) as { reply?: string; error?: string };
      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.reply ?? data.error ?? "Pulse could not answer right now." }
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        { role: "assistant", content: "Pulse could not connect. Check your internet and try again." }
      ]);
    } finally {
      setPending(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(input);
  }

  return (
    <div className="pulse-assistant">
      {open ? (
        <section className="pulse-panel" aria-label="Pulse AI assistant">
          <header className="pulse-header">
            <div className="pulse-avatar pulse-avatar-small" aria-hidden="true"><Bot size={17} /></div>
            <div><strong>Pulse</strong><span>UnitPulse assistant</span></div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close assistant"><X size={18} /></button>
          </header>
          <div className="pulse-messages" aria-live="polite">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`pulse-message pulse-message-${message.role}`}>
                {message.content}
              </div>
            ))}
            {pending ? <div className="pulse-message pulse-message-assistant pulse-thinking"><i /><i /><i /></div> : null}
            <div ref={endRef} />
          </div>
          {messages.length === 1 ? (
            <div className="pulse-starters">
              {starters.map(({ label, prompt, icon: Icon }) => (
                <button key={label} type="button" onClick={() => void ask(prompt)}>
                  <Icon size={15} /><span>{label}</span>
                </button>
              ))}
            </div>
          ) : null}
          <form className="pulse-compose" onSubmit={submit}>
            <label className="sr-only" htmlFor="pulse-question">Ask Pulse</label>
            <input id="pulse-question" value={input} onChange={(event) => setInput(event.target.value)} maxLength={1500} placeholder="Ask about your business…" disabled={pending} />
            <button type="submit" disabled={pending || !input.trim()} aria-label="Send message"><ArrowUp size={18} /></button>
          </form>
          <p className="pulse-note">Read-only answers based on your UnitPulse data.</p>
        </section>
      ) : null}
      <button
        className="pulse-launcher"
        type="button"
        aria-label={open ? "Close Pulse assistant" : "Open Pulse assistant"}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="pulse-avatar" aria-hidden="true"><Bot size={24} /></span>
      </button>
    </div>
  );
}
