"use client";

import { useMemo } from "react";

import { AnimatePresence, motion } from "framer-motion";

import ExplorerApp from "@/apps/ExplorerApp";
import NotepadApp from "@/apps/NotepadApp";
import SettingsApp from "@/apps/SettingsApp";
import SoundboardApp from "@/apps/SoundboardApp";
import TerminalApp from "@/apps/TerminalApp";
import { TASKBAR_RESERVED_PX } from "@/lib/layout";
import type { AppId } from "@/lib/apps";
import { useOSStore } from "@/store/useOSStore";

import WindowShell from "./WindowShell";

type WindowAppProps = {
  windowId: string;
};

const appComponentMap: Record<AppId, React.ComponentType<WindowAppProps>> = {
  settings: SettingsApp,
  soundboard: SoundboardApp,
  explorer: ExplorerApp,
  notepad: NotepadApp,
  terminal: TerminalApp,
};

export default function WindowManager() {
  const windows = useOSStore((state) => state.windows);
  const reduceMotion = useOSStore((state) => state.settings.reduceMotion);
  const snapPreviewZone = useOSStore((state) => state.snapPreviewZone);
  const orderedWindows = useMemo(
    () => [...windows].sort((left, right) => left.z - right.z),
    [windows]
  );

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-30"
      style={{ bottom: `${TASKBAR_RESERVED_PX}px` }}
    >
      <AnimatePresence>
        {snapPreviewZone ? (
          <motion.div
            key={snapPreviewZone}
            className={`pointer-events-none absolute top-0 rounded-2xl border border-violet-200/40 bg-violet-500/12 ${
              snapPreviewZone === "left"
                ? "left-0 w-1/2"
                : snapPreviewZone === "right"
                  ? "right-0 w-1/2"
                  : "left-0 right-0"
            }`}
            style={{ bottom: 0 }}
            initial={reduceMotion ? undefined : { opacity: 0.2 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.14, ease: "easeOut" }}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence mode="popLayout">
        {orderedWindows
          .filter((windowData) => !windowData.minimized)
          .map((windowData) => {
            const AppComponent = appComponentMap[windowData.appId];

            return (
              <motion.div
                key={windowData.id}
                className="pointer-events-auto"
                initial={
                  reduceMotion
                    ? undefined
                    : { opacity: 0, scale: 0.982, y: 10, filter: "blur(5px)" }
                }
                animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                exit={
                  reduceMotion
                    ? undefined
                    : { opacity: 0, scale: 0.9, y: 120, filter: "blur(4px)" }
                }
                transition={{ duration: reduceMotion ? 0 : 0.22, ease: "easeOut" }}
              >
                <WindowShell windowData={windowData}>
                  <AppComponent windowId={windowData.id} />
                </WindowShell>
              </motion.div>
            );
          })}
      </AnimatePresence>
    </div>
  );
}
