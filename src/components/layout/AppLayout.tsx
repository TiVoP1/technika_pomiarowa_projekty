import { Link, NavLink, Outlet, ScrollRestoration } from "react-router-dom";
import { cn } from "@/lib/cn";

const NAV: readonly { to: string; label: string; short: string }[] = [
  { to: "/projekt-iii", label: "Schematy zastępcze", short: "III" },
  { to: "/projekt-vi", label: "Symulator A/C", short: "VI" },
  { to: "/projekt-vii", label: "Oscyloskop", short: "VII" },
  { to: "/projekt-viii", label: "Błędy pomiaru", short: "VIII" },
  { to: "/projekt-x", label: "Analiza widmowa", short: "X" },
  { to: "/projekt-xi", label: "Karta dźwiękowa", short: "XI" },
];

export function AppLayout() {
  return (
    <div className="min-h-full">
      <ScrollRestoration />
      <header className="sticky top-0 z-30 border-b border-white/5 bg-ink-950/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-3">
          <Link
            to="/"
            className="group flex items-center gap-3 focus-ring rounded-md py-1"
          >
            <span className="relative grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-glow shadow-ring">
              <span className="absolute inset-0 rounded-lg bg-accent/30 blur-md opacity-60 transition-opacity group-hover:opacity-100" />
              <svg
                viewBox="0 0 24 24"
                className="relative h-4 w-4 text-ink-950"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 14 Q6 4 10 14 T18 14 T22 14" />
              </svg>
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-[0.7rem] uppercase tracking-[0.18em] text-ink-400">
                Technika Pomiarowa
              </span>
              <span className="font-serif text-base text-ink-50">
                Tomasz Płonka
              </span>
            </span>
          </Link>

          <nav className="ml-auto hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "rounded-lg px-3 py-1.5 text-sm transition-colors focus-ring",
                    isActive
                      ? "bg-white/10 text-ink-50"
                      : "text-ink-300 hover:bg-white/5 hover:text-ink-100",
                  )
                }
              >
                <span className="font-mono text-[0.7rem] text-ink-400 mr-1.5">
                  {item.short}
                </span>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10 animate-fade-in">
        <Outlet />
      </main>

      <footer className="border-t border-white/5 py-8 text-center text-xs text-ink-400">
        <div className="mx-auto max-w-7xl px-6">
          Projekty z przedmiotu Układy elektroniczne i technika pomiarowa.
          Autor: Tomasz Płonka.
        </div>
      </footer>
    </div>
  );
}
