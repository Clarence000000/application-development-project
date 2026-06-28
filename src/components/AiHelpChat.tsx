"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

const introMessage =
  "Hi, I am the MyPerakuan AI Assistant. I can help you choose a form, understand application status, explain missing document requests, and guide you around the portal.";

export default function AiHelpChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro",
      role: "assistant",
      text: introMessage,
    },
  ]);
  const [isSending, setIsSending] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(100);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const [markerPositions, setMarkerPositions] = useState<Record<string, number>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const userMessages = messages.filter((message) => message.role === "user");

  const getMessageScrollTarget = useCallback((messageId: string) => {
    const container = scrollRef.current;
    const messageElement = document.getElementById(`ai-chat-message-${messageId}`);

    if (!container || !messageElement) {
      return null;
    }

    const maxScroll = container.scrollHeight - container.clientHeight;

    return Math.min(maxScroll, Math.max(0, messageElement.offsetTop - 16));
  }, []);

  const updateMarkerPositions = useCallback(() => {
    const userMessageList = messages.filter((message) => message.role === "user");
    const lastIndex = userMessageList.length - 1;
    const nextPositions = userMessageList.reduce<Record<string, number>>(
      (positions, message) => {
        const index = userMessageList.findIndex((item) => item.id === message.id);
        positions[message.id] = lastIndex <= 0 ? 100 : (index / lastIndex) * 100;
        return positions;
      },
      {},
    );

    setMarkerPositions(nextPositions);
  }, [messages]);

  const updateScrollState = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const scrollableHeight = container.scrollHeight - container.clientHeight;
    const progress =
      scrollableHeight > 0
        ? (container.scrollTop / scrollableHeight) * 100
        : 100;
    const distanceFromBottom =
      container.scrollHeight - container.clientHeight - container.scrollTop;

    setScrollProgress(Math.min(100, Math.max(0, progress)));
    setShowJumpToLatest(distanceFromBottom > 80);
  }, []);

  const scrollToLatest = useCallback(() => {
    window.requestAnimationFrame(() => {
      const container = scrollRef.current;
      if (!container) return;

      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
      window.setTimeout(updateScrollState, 250);
      window.setTimeout(updateMarkerPositions, 250);
    });
  }, [updateMarkerPositions, updateScrollState]);

  function scrollToProgress(event: React.MouseEvent<HTMLDivElement>) {
    const container = scrollRef.current;
    if (!container) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const progress = (event.clientY - rect.top) / rect.height;
    const maxScroll = container.scrollHeight - container.clientHeight;

    container.scrollTo({
      top: maxScroll * Math.min(1, Math.max(0, progress)),
      behavior: "smooth",
    });
  }

  function scrollToMessage(messageId: string) {
    const container = scrollRef.current;
    const target = getMessageScrollTarget(messageId);

    if (!container || target === null) {
      return;
    }

    container.scrollTo({
      top: target,
      behavior: "smooth",
    });
    setScrollProgress(markerPositions[messageId] ?? 100);
  }

  useEffect(() => {
    if (!isOpen) return;

    scrollToLatest();
    window.setTimeout(updateMarkerPositions, 100);
  }, [isOpen, messages, scrollToLatest, updateMarkerPositions]);

  async function sendMessage(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const message = input.trim();
    if (!message || isSending) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: message,
    };
    const conversation = messages
      .filter((item) => item.id !== "intro")
      .slice(-8)
      .map((item) => ({
        role: item.role,
        text: item.text,
      }));

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task: "chatbot",
          message,
          conversation,
        }),
      });
      const data = (await response.json().catch(() => null)) as {
        text?: string;
        error?: string;
      } | null;

      if (!response.ok || !data?.text) {
        throw new Error(data?.error || "AI assistant could not respond.");
      }

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: data.text,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text:
            error instanceof Error
              ? error.message
              : "AI assistant could not respond right now.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <>
      {isOpen && (
        <section className="fixed bottom-24 right-4 z-[70] flex h-[min(620px,calc(100vh-7rem))] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-lg border border-outline-variant bg-white shadow-2xl md:bottom-24 md:right-6">
          <header className="flex items-center justify-between border-b border-outline-variant bg-primary px-4 py-3 text-white">
            <div className="flex min-w-0 items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">
                support_agent
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-bold">AI Assistant</h2>
                <p className="text-[10px] font-medium text-white/80">
                  MyPerakuan help
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close AI assistant"
              className="material-symbols-outlined rounded-full p-1 text-[20px] transition hover:bg-white/15"
              onClick={() => setIsOpen(false)}
            >
              close
            </button>
          </header>

          <div className="relative min-h-0 flex-1 bg-surface-container-low">
            <div
              ref={scrollRef}
              className="scrollbar-hidden h-full space-y-3 overflow-y-auto scroll-smooth px-3 py-4 pr-6"
              onScroll={updateScrollState}
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  id={`ai-chat-message-${message.id}`}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[86%] rounded-lg px-3 py-2 text-sm leading-5 ${
                      message.role === "user"
                        ? "bg-primary text-white"
                        : "border border-outline-variant bg-white text-on-surface"
                    }`}
                  >
                    <FormattedChatText text={message.text} />
                  </div>
                </div>
              ))}

              {isSending && (
                <div className="flex justify-start">
                  <div className="rounded-lg border border-outline-variant bg-white px-3 py-2 text-xs font-semibold text-on-surface-variant">
                    Thinking...
                  </div>
                </div>
              )}
            </div>

            <div
              className="absolute bottom-3 right-2 top-3 w-3 cursor-pointer rounded-full"
              onClick={scrollToProgress}
              aria-label="Chat context navigation"
            >
              <div
                className="absolute bottom-0 right-1 top-0 w-1 rounded-full bg-outline-variant/55"
                aria-hidden="true"
              />
              <div
                className="absolute right-1 top-0 w-1 rounded-full bg-primary transition-[height] duration-200"
                style={{ height: `${scrollProgress}%` }}
                aria-hidden="true"
              />
              {userMessages.map((message) => {
                return (
                  <button
                    key={message.id}
                    type="button"
                    className="group absolute right-0 h-3 w-3 -translate-y-1/2 rounded-full border border-white bg-primary shadow-sm transition hover:scale-125"
                    style={{ top: `${markerPositions[message.id] ?? 100}%` }}
                    aria-label={`Jump to previous input: ${message.text}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      scrollToMessage(message.id);
                    }}
                  >
                    <span className="pointer-events-none absolute right-5 top-1/2 hidden w-56 -translate-y-1/2 rounded-lg border border-outline-variant bg-inverse-surface px-3 py-2 text-left text-[11px] font-semibold leading-4 text-inverse-on-surface shadow-xl group-hover:block">
                      {message.text}
                    </span>
                  </button>
                );
              })}
            </div>

            {showJumpToLatest && (
              <button
                type="button"
                className="absolute bottom-3 right-5 flex items-center gap-1 rounded-full border border-outline-variant bg-white px-3 py-1.5 text-[11px] font-bold text-primary shadow-lg transition hover:bg-surface-container-low"
                onClick={scrollToLatest}
              >
                <span className="material-symbols-outlined text-[15px]">
                  keyboard_arrow_down
                </span>
                Latest
              </button>
            )}
          </div>

          <form
            className="border-t border-outline-variant bg-white p-3"
            onSubmit={sendMessage}
          >
            <div className="flex items-end gap-2">
              <textarea
                className="max-h-28 min-h-10 flex-1 resize-none rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Ask about forms, status, or missing documents"
                rows={1}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <button
                type="submit"
                aria-label="Send message"
                disabled={!input.trim() || isSending}
                className="material-symbols-outlined flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-[20px] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                send
              </button>
            </div>
          </form>
        </section>
      )}

      <button
        type="button"
        aria-label="Open AI help assistant"
        aria-expanded={isOpen}
        className="fixed bottom-20 right-4 z-[69] flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-xl transition hover:scale-105 hover:opacity-95 md:bottom-6 md:right-6"
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="material-symbols-outlined text-[26px]">
          {isOpen ? "close" : "support_agent"}
        </span>
      </button>
    </>
  );
}

function FormattedChatText({ text }: { text: string }) {
  return (
    <div className="space-y-1">
      {text.split("\n").map((line, index) => {
        const trimmedLine = line.trim();
        const key = `${index}-${trimmedLine}`;

        if (!trimmedLine) {
          return <div key={key} className="h-1" />;
        }

        if (/^-{3,}$/.test(trimmedLine)) {
          return <hr key={key} className="my-2 border-outline-variant" />;
        }

        const headingMatch = trimmedLine.match(/^#{1,6}\s+(.+)$/);
        if (headingMatch) {
          return (
            <h3 key={key} className="pt-1 text-sm font-bold text-primary">
              {renderInlineFormatting(headingMatch[1])}
            </h3>
          );
        }

        if (isMarkdownTableSeparator(trimmedLine)) {
          return null;
        }

        if (isMarkdownTableRow(trimmedLine)) {
          const cells = parseMarkdownTableRow(trimmedLine);

          return (
            <div
              key={key}
              className="grid grid-cols-1 gap-1 rounded-md border border-outline-variant bg-surface-container-low p-2 text-xs sm:grid-cols-2"
            >
              {cells.map((cell, cellIndex) => (
                <div
                  key={`${key}-${cellIndex}`}
                  className={cellIndex === 0 ? "font-bold" : ""}
                >
                  {renderInlineFormatting(cell)}
                </div>
              ))}
            </div>
          );
        }

        const bulletMatch = trimmedLine.match(/^[-*]\s+(.+)$/);
        if (bulletMatch) {
          return (
            <p key={key} className="flex gap-2">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-current" />
              <span>{renderInlineFormatting(bulletMatch[1])}</span>
            </p>
          );
        }

        const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
        if (numberedMatch) {
          return (
            <p key={key} className="flex gap-2">
              <span className="shrink-0 font-bold">{numberedMatch[1]}.</span>
              <span>{renderInlineFormatting(numberedMatch[2])}</span>
            </p>
          );
        }

        return <p key={key}>{renderInlineFormatting(trimmedLine)}</p>;
      })}
    </div>
  );
}

function isMarkdownTableRow(line: string) {
  return line.includes("|") && parseMarkdownTableRow(line).length > 1;
}

function isMarkdownTableSeparator(line: string) {
  return /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?$/.test(line);
}

function parseMarkdownTableRow(line: string) {
  return line
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim())
    .filter(Boolean);
}

function renderInlineFormatting(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
    }

    return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
  });
}
