"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import {
  BellRing,
  FolderOpen,
  Lock,
  NotebookPen,
  Settings2,
  TerminalSquare,
  Unlock,
  Volume2,
} from "lucide-react";

import { APP_REGISTRY, START_MENU_APPS, type AppId } from "@/lib/apps";
import { useOSStore } from "@/store/useOSStore";

const iconMap: Record<AppId, React.ComponentType<{ size?: number }>> = {
  settings: Settings2,
  soundboard: Volume2,
  explorer: FolderOpen,
  notepad: NotebookPen,
  terminal: TerminalSquare,
};

export default function StartMenu() {
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const startMenuOpen = useOSStore((state) => state.startMenuOpen);
  const reduceMotion = useOSStore((state) => state.settings.reduceMotion);
  const locked = useOSStore((state) => state.locked);
  const openApp = useOSStore((state) => state.openApp);
  const setStartMenuOpen = useOSStore((state) => state.setStartMenuOpen);
  const lockSystem = useOSStore((state) => state.lockSystem);
  const unlockSystem = useOSStore((state) => state.unlockSystem);
  const pushNotification = useOSStore((state) => state.pushNotification);
  const playClickSoft = useOSStore((state) => state.playClickSoft);

  const filteredApps = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return START_MENU_APPS;
    }

    return START_MENU_APPS.filter((appId) => {
      const app = APP_REGISTRY[appId];
      return (
        app.title.toLowerCase().includes(needle) ||
        app.description.toLowerCase().includes(needle)
      );
    });
  }, [query]);

  const launchApp = (appId: AppId) => {
    playClickSoft();
    openApp(appId);
  };

  useEffect(() => {
    if (!startMenuOpen) {
      return;
    }

    const timer = window.setTimeout(() => searchRef.current?.focus(), 30);
    return () => window.clearTimeout(timer);
  }, [startMenuOpen]);

  useEffect(() => {
    if (!startMenuOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setStartMenuOpen(false);
      }

      if (event.key === "Enter" && filteredApps.length) {
        event.preventDefault();
        playClickSoft();
        openApp(filteredApps[0]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredApps, openApp, playClickSoft, startMenuOpen, setStartMenuOpen]);

  return (
    <AnimatePresence>
      {startMenuOpen ? (
        <>
          <motion.button
            type="button"
            aria-label="Close start menu"
            className="absolute inset-0 z-[70] h-full w-full cursor-default bg-black/25"
            onClick={() => setStartMenuOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
          />
          <motion.aside
            initial={reduceMotion ? undefined : { opacity: 0, y: 16, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 12, scale: 0.99 }}
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: "easeOut" }}
            className="glass-panel absolute bottom-[84px] left-4 z-[80] w-[min(96vw,460px)] rounded-[22px] border border-white/15 p-4"
          >
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/12 to-white/6 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-violet-200/70">
                PurpleOS
              </p>
              <h2 className="mt-1 text-xl font-semibold text-white">Start Menu</h2>
              <p className="mt-1 text-sm text-violet-100/75">
                Launch apps and system actions from this panel.
              </p>
            </div>

            <div className="mt-3">
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search apps..."
                className="w-full rounded-xl border border-white/12 bg-black/30 px-3 py-2 text-sm text-violet-50 outline-none ring-violet-300/40 transition focus:ring-2"
              />
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2">
              {filteredApps.length ? (
                filteredApps.map((appId) => {
                  const app = APP_REGISTRY[appId];
                  const Icon = iconMap[appId];

                  return (
                    <button
                      key={appId}
                      type="button"
                      className="group flex items-center justify-between rounded-xl border border-white/10 bg-white/6 px-3 py-2.5 text-left transition hover:border-violet-200/35 hover:bg-white/14"
                      onClick={() => launchApp(appId)}
                    >
                      <span className="flex items-center gap-2">
                        <span className="rounded-lg border border-white/10 bg-white/10 p-1.5 text-violet-100">
                          <Icon size={14} />
                        </span>
                        <span>
                          <span className="block text-sm font-semibold text-violet-50">
                            {app.title}
                          </span>
                          <span className="block text-xs text-violet-100/65">
                            {app.description}
                          </span>
                        </span>
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-4 text-sm text-violet-200/75">
                  No app matched &quot;{query}&quot;.
                </div>
              )}
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-sm font-medium text-violet-100 transition hover:bg-white/16"
                onClick={() => {
                  playClickSoft();
                  pushNotification("PurpleOS", "Start menu quick notify.");
                }}
              >
                <BellRing size={14} />
                Notify
              </button>

              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-sm font-medium text-violet-100 transition hover:bg-white/16"
                onClick={() => {
                  playClickSoft();
                  if (locked) {
                    unlockSystem();
                  } else {
                    lockSystem();
                  }
                }}
              >
                {locked ? <Unlock size={14} /> : <Lock size={14} />}
                {locked ? "Unlock" : "Lock"}
              </button>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
