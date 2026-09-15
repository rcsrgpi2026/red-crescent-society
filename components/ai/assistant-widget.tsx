"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  X,
  Send,
  SendHorizontal,
  ArrowUp,
  Sparkles,
  RotateCcw,
  Copy,
  Check,
  ChevronRight,
  ExternalLink,
  PhoneCall,
  HeartHandshake,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { useAssistant } from "./assistant-context";
import { AssistantBotIcon } from "./assistant-bot-icon";
import type { AssistantAction, AssistantResponse } from "@/lib/ai/types";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: AssistantAction[];
  timestamp: string;
}

const INITIAL_SUGGESTIONS = [
  { label: "🩸 রক্তের আবেদন করব কীভাবে?", query: "রক্তের আবেদন কীভাবে করব?" },
  { label: "🚨 কয়টা active blood request আছে?", query: "আজকের সক্রিয় রক্তের আবেদন কয়টা?" },
  { label: "🤝 Volunteer হওয়ার নিয়ম কী?", query: "স্বেচ্ছাসেবক হওয়ার যোগ্যতা ও নিয়ম কী?" },
  { label: "❤️ রক্তদানের যোগ্যতা ও শর্ত", query: "রক্তদানের শর্ত ও যোগ্যতা কী?" },
  { label: "📞 জরুরি রক্তের হটলাইন কত?", query: "জরুরি রক্তের হটলাইন নম্বর কত?" },
];

export function AssistantWidget() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { isOpen, setIsOpen, initialQuery } = useAssistant();
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome",
      role: "assistant",
      content:
        "স্বাগতম! আমি যুব রেড ক্রিসেন্ট আরজিপিআই (RCY RGPI)-এর ওয়েবসাইট সহকারী। রক্ত সহায়তা, স্বেচ্ছাসেবক আবেদন, নোটিশ বা যেকোনো সেবা সম্পর্কে জানতে প্রশ্ন করতে পারেন।",
      timestamp: "এখন",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setLastFailedMessage(null);

    // Build history (last 6 turns)
    const historyPayload = messages.slice(-6).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          history: historyPayload,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.response) {
        throw new Error(data?.response?.message || data?.error || "Failed to get response");
      }

      const assistantResp: AssistantResponse = data.response;
      const assistantMessage: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: assistantResp.message,
        actions: assistantResp.actions,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setLastFailedMessage(query);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content:
          err.message ||
          "দুঃখিত, এই মুহূর্তে উত্তর প্রক্রিয়াকরণে সমস্যা হচ্ছে। অনুগ্রহ করে নিচে দেওয়া 'পুনরায় চেষ্টা করুন' বাটনে চাপুন।",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (action: AssistantAction) => {
    if (!action.target) return;

    if (action.type === "navigate") {
      router.push(action.target);
      // On mobile screens, collapse after navigation
      if (window.innerWidth < 640) {
        setIsOpen(false);
      }
    } else if (action.type === "external_link") {
      window.open(action.target, "_blank", "noopener,noreferrer");
    } else if (action.type === "contact") {
      window.location.href = action.target.startsWith("tel:")
        ? action.target
        : `tel:${action.target}`;
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    if (confirm("কথোপকথন মুছে ফেলতে চান?")) {
      setMessages([
        {
          id: "welcome-reset",
          role: "assistant",
          content: "কথোপকথন রিসেট করা হয়েছে। যেকোনো তথ্যের জন্য পুনরায় প্রশ্ন করতে পারেন।",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      setLastFailedMessage(null);
    }
  };

  useEffect(() => {
    if (isOpen && initialQuery) {
      handleSendMessage(initialQuery);
    }
  }, [isOpen, initialQuery]);

  if (!mounted) return null;

  return (
    <>
      {/* Floating Modal Window */}
      {isOpen && (
        <div
          id="rcy-ai-assistant-modal"
          role="dialog"
          aria-modal="true"
          aria-label="RCY AI Website Assistant Window"
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[100] flex w-[94vw] sm:w-[420px] max-h-[86vh] h-[580px] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-md shadow-2xl shadow-slate-900/15 animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-4 py-3 text-white">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-600 text-white shadow-md shadow-red-600/40">
                <AssistantBotIcon className="h-5.5 w-5.5" primaryColor="#ffffff" wireColor="#fecdd3" eyeColor="#dc2626" />
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight tracking-tight text-white flex items-center gap-1.5">
                  RCY AI Assistant
                  <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/30">
                    Live
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">Rajshahi Govt. Polytechnic Institute</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClearHistory}
                title="কথোপকথন পরিষ্কার করুন"
                aria-label="Clear chat history"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700/60 hover:text-white transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="বন্ধ করুন"
                aria-label="Close assistant"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700/60 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm scroll-smooth bg-slate-50/40">
            {messages.map((m) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 leading-relaxed ${
                      isUser
                        ? "bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white rounded-tr-xs shadow-sm shadow-red-600/20 font-normal"
                        : "bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs shadow-xs"
                    }`}
                  >
                    {/* Render message with line breaks */}
                    <div className="whitespace-pre-wrap break-words text-[13.5px] leading-relaxed">
                      {m.content}
                    </div>

                    {/* Action Buttons inside message */}
                    {m.actions && m.actions.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-2">
                        {m.actions.map((act, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleActionClick(act)}
                            className="group inline-flex items-center gap-1.5 rounded-xl border border-red-200/90 bg-red-50/50 hover:bg-red-600 hover:border-red-600 px-3 py-1.5 text-xs font-semibold text-red-700 hover:text-white shadow-2xs hover:shadow-sm transition-all duration-150 active:scale-95"
                          >
                            <span>{act.label}</span>
                            <span className="flex h-4 w-4 items-center justify-center rounded-md bg-red-100/80 text-red-600 group-hover:bg-white/20 group-hover:text-white transition-colors">
                              {act.type === "navigate" ? (
                                <ChevronRight className="h-3 w-3 stroke-[2.5]" />
                              ) : act.type === "external_link" ? (
                                <ExternalLink className="h-3 w-3" />
                              ) : (
                                <PhoneCall className="h-3 w-3" />
                              )}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Message Meta Info */}
                  <div className="mt-1 flex items-center gap-2 px-1 text-[10px] text-slate-400">
                    <span>{m.timestamp}</span>
                    {!isUser && (
                      <button
                        type="button"
                        onClick={() => handleCopy(m.id, m.content)}
                        className="hover:text-slate-600 flex items-center gap-0.5 transition-colors"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600 font-medium">কপি হয়েছে</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>কপি</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Retry Button if last message failed */}
            {lastFailedMessage && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => handleSendMessage(lastFailedMessage)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100 transition shadow-sm"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  পুনরায় চেষ্টা করুন
                </button>
              </div>
            )}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-center gap-2.5 text-slate-500 bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs px-4 py-3 max-w-[75%] shadow-xs">
                <div className="flex space-x-1.5">
                  <div className="h-2 w-2 bg-red-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="h-2 w-2 bg-red-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="h-2 w-2 bg-red-600 rounded-full animate-bounce" />
                </div>
                <span className="text-xs text-slate-500 font-medium">তথ্য অনুসন্ধান করা হচ্ছে...</span>
              </div>
            )}

            {/* Initial Suggestion Chips */}
            {messages.length <= 2 && !isLoading && (
              <div className="pt-2">
                <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-red-600" />
                  কুইক প্রশ্ন সাজেশন্স:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {INITIAL_SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSendMessage(s.query)}
                      className="rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 text-xs text-slate-700 hover:border-red-400 hover:text-red-600 hover:bg-red-50/40 transition-all active:scale-95 shadow-2xs"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="border-t border-slate-100 bg-white px-3.5 py-3 shadow-xs">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative flex items-center rounded-2xl border border-slate-200/90 bg-slate-50/80 shadow-2xs focus-within:border-red-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-red-500/10 transition-all duration-200"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="রক্ত, ভলান্টিয়ার বা সেবা সম্পর্কে লিখুন..."
                disabled={isLoading}
                maxLength={1000}
                className="w-full bg-transparent pl-3.5 pr-12 py-2.5 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
                className="absolute right-1.5 flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-xs transition-all duration-200 hover:scale-105 hover:shadow-red-500/25 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 disabled:shadow-none shrink-0"
              >
                <ArrowUp className="h-4 w-4 stroke-[2.5]" />
              </button>
            </form>
            <div className="mt-1.5 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
              <span>RCY লাইভ ডাটা ও রুলস দ্বারা ভেরিফায়েড</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
