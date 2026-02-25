"use client";

import { useMemo, useState } from "react";

import {
  CREDITS_OPTIONAL_LINE,
  CREDITS_PRIMARY_LINE,
  CREDITS_SECONDARY_LINE,
} from "@/lib/credits";
import { useOSStore } from "@/store/useOSStore";

type TerminalLine = {
  id: string;
  kind: "input" | "output" | "error";
  text: string;
};

const makeLineId = () =>
  `line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const WELCOME_LINES = [
  "PurpleOS Terminal v1.0",
  'Type "help" to list commands.',
];

export default function TerminalApp() {
  const [command, setCommand] = useState("");
  const [lines, setLines] = useState<TerminalLine[]>(() =>
    WELCOME_LINES.map((text) => ({
      id: makeLineId(),
      kind: "output",
      text,
    }))
  );

  const showNoAiLine = useOSStore((state) => state.settings.showNoAiLine);
  const pushNotification = useOSStore((state) => state.pushNotification);
  const raiseError = useOSStore((state) => state.raiseError);
  const playClickSoft = useOSStore((state) => state.playClickSoft);

  const prompt = useMemo(() => "purpleos@desktop:~$", []);

  const pushLine = (kind: TerminalLine["kind"], text: string) => {
    setLines((current) => [...current, { id: makeLineId(), kind, text }]);
  };

  const runCommand = (rawCommand: string) => {
    const nextCommand = rawCommand.trim();
    pushLine("input", `${prompt} ${nextCommand}`);

    if (!nextCommand) {
      return;
    }

    if (nextCommand === "help") {
      pushLine("output", "Commands: help, about, clear, notify");
      return;
    }

    if (nextCommand === "about") {
      pushLine("output", CREDITS_PRIMARY_LINE);
      pushLine("output", CREDITS_SECONDARY_LINE);
      if (showNoAiLine) {
        pushLine("output", CREDITS_OPTIONAL_LINE);
      }
      return;
    }

    if (nextCommand === "notify") {
      pushNotification("Terminal", "Notification issued from Terminal.", {
        appId: "terminal",
      });
      pushLine("output", "Notification sent.");
      return;
    }

    if (nextCommand === "clear") {
      setLines([]);
      return;
    }

    pushLine("error", `Unknown command: ${nextCommand}`);
    raiseError(`Terminal command not found: ${nextCommand}`);
  };

  return (
    <div className="flex h-full min-h-0 flex-col rounded-2xl border border-white/10 bg-black/35">
      <div className="border-b border-white/10 px-3 py-2 font-mono text-xs text-violet-200/70">
        {prompt}
      </div>

      <div className="flex-1 space-y-1 overflow-auto p-3 font-mono text-sm">
        {lines.map((line) => (
          <p
            key={line.id}
            className={
              line.kind === "error"
                ? "text-rose-200/90"
                : line.kind === "input"
                  ? "text-violet-100"
                  : "text-violet-200/85"
            }
          >
            {line.text}
          </p>
        ))}
      </div>

      <form
        className="border-t border-white/10 p-3"
        onSubmit={(event) => {
          event.preventDefault();
          playClickSoft();
          runCommand(command);
          setCommand("");
        }}
      >
        <label className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/6 px-3 py-2">
          <span className="font-mono text-xs text-violet-300/80">$</span>
          <input
            value={command}
            onChange={(event) => setCommand(event.target.value)}
            placeholder='Try: about'
            className="w-full bg-transparent font-mono text-sm text-violet-50 outline-none placeholder:text-violet-300/45"
          />
        </label>
      </form>
    </div>
  );
}
