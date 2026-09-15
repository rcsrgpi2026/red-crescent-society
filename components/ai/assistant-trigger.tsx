"use client";

import { Button } from "@/components/ui/button";
import { useAssistant } from "./assistant-context";
import { AssistantBotIcon } from "./assistant-bot-icon";
import { cn } from "@/lib/utils";

interface AssistantTriggerProps {
  className?: string;
}

export function AssistantTrigger({ className }: AssistantTriggerProps) {
  const { isOpen, toggleAssistant } = useAssistant();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleAssistant}
      aria-label="RCY AI Assistant"
      title="RCY AI Assistant (এআই সহকারী)"
      className={cn(
        "relative h-9.5 w-9.5 sm:h-10 sm:w-10 rounded-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/80 shadow-2xs transition-all duration-200 hover:scale-105 active:scale-95",
        isOpen && "bg-red-100 ring-2 ring-red-500/40 shadow-sm scale-105",
        className
      )}
    >
      <AssistantBotIcon
        className={cn(
          "h-6 w-6 sm:h-6.5 sm:w-6.5 transition-transform duration-200",
          isOpen ? "scale-110" : "group-hover:scale-105"
        )}
        primaryColor="#e11d48"
        wireColor="#94a3b8"
        eyeColor="#ffffff"
      />

      {/* Live AI status indicator dot */}
      <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-80" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
      </span>
    </Button>
  );
}
