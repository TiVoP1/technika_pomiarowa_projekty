import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="grid min-h-[50vh] place-items-center text-center">
      <div>
        <div className="font-serif text-7xl text-ink-700">404</div>
        <h1 className="mt-2 font-serif text-2xl text-ink-50">Tutaj nic nie ma</h1>
        <p className="mt-2 text-sm text-ink-400">Wróć do listy projektów.</p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-xl bg-accent px-4 py-2 text-sm font-medium text-ink-950 hover:bg-accent-soft focus-ring"
        >
          Strona główna
        </Link>
      </div>
    </div>
  );
}
