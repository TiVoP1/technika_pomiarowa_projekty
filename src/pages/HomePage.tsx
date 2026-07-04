import { Link } from "react-router-dom";
import { HomeHeroScene } from "@/pages/HomeHeroScene";

interface ProjectCard {
  to: string;
  numeral: string;
  title: string;
  tag: string;
  summary: string;
  highlights: readonly string[];
}

const PROJECTS: readonly ProjectCard[] = [
  {
    to: "/projekt-ii",
    numeral: "II",
    title: "Wartość skuteczna sygnałów",
    tag: "RMS, składowa stała",
    summary:
      "Obliczenia wartości skutecznej dla sinusoidy, piły, trójkąta, prostokąta i impulsu o dowolnym wypełnieniu. Wyprowadzenia krok po kroku oraz porównanie z miernikiem uśredniającym.",
    highlights: [
      "Wyprowadzenia analityczne",
      "Weryfikacja numeryczna",
      "True RMS vs prostownik",
    ],
  },
  {
    to: "/projekt-iii",
    numeral: "III",
    title: "Schematy zastępcze elementów biernych",
    tag: "Impedancja, admitancja",
    summary:
      "Przeliczanie modelu szeregowego na równoległy dla rzeczywistych elementów R, L oraz C. Pokazujemy też jak zmienia się impedancja w funkcji częstotliwości.",
    highlights: ["Model szeregowy ↔ równoległy", "Wykres Bode", "Diagram fazora"],
  },
  {
    to: "/projekt-vi",
    numeral: "VI",
    title: "Symulator przetwornika analogowo cyfrowego",
    tag: "SAR, kwantyzacja",
    summary:
      "Krok po kroku pokazujemy działanie przetwornika z sukcesywną aproksymacją. Sygnał próbkowany, porównywany z poziomami i konwertowany na słowo kodowe.",
    highlights: [
      "Sample and hold w 3D",
      "Drabina rezystorowa",
      "Błąd kwantyzacji",
    ],
  },
  {
    to: "/projekt-vii",
    numeral: "VII",
    title: "Wirtualny oscyloskop cyfrowy",
    tag: "Przyrząd pomiarowy",
    summary:
      "Klasyczna płyta czołowa oscyloskopu z dwoma kanałami, podstawą czasu, wyzwalaniem oraz automatycznymi pomiarami amplitudy, częstotliwości i wartości skutecznej.",
    highlights: ["Dwa kanały", "Wyzwalanie zboczem", "Pomiary automatyczne"],
  },
  {
    to: "/projekt-viii",
    numeral: "VIII",
    title: "Obliczanie błędów pomiarów",
    tag: "Specyfikacja przyrządu",
    summary:
      "Wprowadzasz odczyt, zakres oraz dokładność z karty katalogowej multimetru i otrzymujesz błąd graniczny, względny oraz przedział ufności wyniku.",
    highlights: ["Multimetr DC i AC", "Niepewność typu B", "Propagacja błędów"],
  },
  {
    to: "/projekt-x",
    numeral: "X",
    title: "Analiza widmowa: aliasing i przeciek",
    tag: "FFT, okna czasowe",
    summary:
      "Generujesz sygnał, ustawiasz częstotliwość próbkowania, długość okna i funkcję okna. Obserwujesz aliasing przy niedopróbkowaniu oraz przeciek przy niedopasowaniu okresu.",
    highlights: ["Aliasing na żywo", "Hann, Hamming, Blackman", "Skala dB"],
  },
  {
    to: "/projekt-xi",
    numeral: "XI",
    title: "Karta dźwiękowa jako przyrząd",
    tag: "Web Audio API",
    summary:
      "Karta dźwiękowa pełni funkcję wejścia pomiarowego oraz generatora. Akwizycja z mikrofonu, pomiary parametrów oraz generacja przebiegów na wyjście audio.",
    highlights: ["Akwizycja z mikrofonu", "Pomiar RMS i THD", "Generator funkcyjny"],
  },
];

export function HomePage() {
  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-ink-900/40">
        <div className="absolute inset-0 -z-0 opacity-80">
          <HomeHeroScene />
        </div>
        <div className="absolute inset-0 -z-0 bg-gradient-to-r from-ink-950/85 via-ink-950/40 to-transparent" />
        <div className="relative z-10 px-8 py-20 sm:px-12 sm:py-28">
          <div className="eyebrow mb-4">Technika Pomiarowa</div>
          <h1 className="max-w-3xl font-serif text-4xl font-semibold leading-[1.05] text-ink-50 sm:text-6xl">
            Tomasz Płonka
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-300 sm:text-lg">
            Projekty z karty zadań 2026 zrealizowane jako interaktywne narzędzia
            w przeglądarce.
          </p>
        </div>
      </section>

      <section>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PROJECTS.map((p, idx) => (
            <ProjectTile key={p.to} card={p} index={idx} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ProjectTile({
  card,
  index,
}: {
  card: ProjectCard;
  index: number;
}) {
  return (
    <Link
      to={card.to}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-ink-900/50 p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:bg-ink-800/60 focus-ring"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="mb-4 flex items-center justify-between">
        <span className="font-serif text-4xl text-ink-700 transition-colors group-hover:text-accent/50">
          {card.numeral}
        </span>
        <span className="eyebrow">{card.tag}</span>
      </div>
      <h3 className="font-serif text-lg font-semibold text-ink-50">{card.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-300">{card.summary}</p>
      <ul className="mt-4 flex flex-wrap gap-1.5">
        {card.highlights.map((h) => (
          <li
            key={h}
            className="rounded-full border border-white/5 bg-ink-800/60 px-2.5 py-0.5 text-[0.7rem] text-ink-300"
          >
            {h}
          </li>
        ))}
      </ul>
      <div className="mt-5 flex items-center gap-2 text-sm font-medium text-accent">
        Otwórz projekt
        <svg
          className="h-4 w-4 transition-transform group-hover:translate-x-1"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        >
          <path d="M3 8h10M9 4l4 4-4 4" />
        </svg>
      </div>
    </Link>
  );
}
