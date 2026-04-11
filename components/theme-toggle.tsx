"use client";

import { useTheme } from "@/components/theme-provider";

type ThemeToggleProps = {
  className?: string;
};

const options: Array<{ id: "auto" | "light" | "dark"; label: string }> = [
  { id: "auto", label: "Auto" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

export default function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { mode, setMode } = useTheme();

  return (
    <div className={`site-theme-toggle inline-flex items-center gap-1 rounded-full p-1 ${className}`.trim()}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => setMode(option.id)}
          data-active={option.id === mode}
          className="site-theme-button rounded-full px-3 py-1.5 text-xs font-medium transition"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
