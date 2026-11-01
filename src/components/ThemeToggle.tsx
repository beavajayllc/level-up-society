"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

const themeEvent = "lus-theme-change";

function subscribe(onChange: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key !== "lus-theme") return;
    document.documentElement.dataset.theme = event.newValue === "dark" ? "dark" : "light";
    onChange();
  }
  window.addEventListener(themeEvent, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(themeEvent, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function getTheme() {
  return document.documentElement.dataset.theme === "dark";
}

function getServerTheme() {
  return false;
}

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, getTheme, getServerTheme);

  function toggleTheme() {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      window.localStorage.setItem("lus-theme", next);
    } catch {
      // The selection still works for the current page when storage is unavailable.
    }
    window.dispatchEvent(new Event(themeEvent));
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-silver/15 text-silver transition-colors hover:bg-silver/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chrome"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
