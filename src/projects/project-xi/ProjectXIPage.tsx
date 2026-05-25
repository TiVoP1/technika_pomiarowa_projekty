import { useCallback, useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { NumberField, SelectField, SliderField } from "@/components/ui/Field";
import { Stat } from "@/components/ui/Stat";
import { Prose } from "@/components/ui/Prose";
import { formatSI } from "@/lib/format";
import { snapshot, type AnalyzerSnapshot } from "@/projects/project-xi/analyzer";
import { ScopeView, SpectrumView } from "@/projects/project-xi/AnalyzerView";
import {
  useAudioEngine,
  type GeneratorSettings,
  type SourceMode,
  type Wave,
} from "@/projects/project-xi/useAudioEngine";

const FFT_OPTIONS = [1024, 2048, 4096, 8192, 16384];

export function ProjectXIPage() {
  const audio = useAudioEngine();
  const [fftSize, setFftSize] = useState(4096);
  const [generator, setGenerator] = useState<GeneratorSettings>({
    enabled: false,
    wave: "sine",
    frequency: 1000,
    amplitude: 0.15,
  });
  const [snap, setSnap] = useState<AnalyzerSnapshot | null>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    audio.setFftSize(fftSize);
  }, [fftSize, audio]);

  useEffect(() => {
    audio.setGenerator(generator);
  }, [generator, audio]);

  useEffect(() => {
    const a = audio.state.analyser;
    const sr = audio.state.sampleRate;
    if (!a || sr === 0) {
      setSnap(null);
      return;
    }
    const tick = () => {
      setSnap(snapshot(a, sr));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [audio.state.analyser, audio.state.sampleRate]);

  const handleStart = useCallback(
    async (mode: SourceMode) => {
      await audio.start(mode);
    },
    [audio],
  );

  const isRunning = audio.state.sourceMode !== "off";

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Projekt XI"
        title="Karta dźwiękowa jako przyrząd pomiarowy"
        lead="Karta dźwiękowa to gotowy przetwornik analogowo cyfrowy oraz generator. Przeglądarka udostępnia ją przez Web Audio API. Tutaj można nagrywać dźwięk z mikrofonu i mierzyć jego parametry, oraz generować przebiegi i odsłuchać je na głośnikach."
      />

      <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
        <div className="space-y-4">
          <Card title="Sterowanie" eyebrow="Audio">
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  variant={
                    audio.state.sourceMode === "microphone" ? "primary" : "secondary"
                  }
                  onClick={() => {
                    void handleStart("microphone");
                  }}
                  fullWidth
                >
                  Wejście: mikrofon
                </Button>
                <Button
                  variant={
                    audio.state.sourceMode === "internal" ? "primary" : "secondary"
                  }
                  onClick={() => {
                    void handleStart("internal");
                  }}
                  fullWidth
                >
                  Wejście: wewnętrzne
                </Button>
              </div>
              <Button
                variant="ghost"
                fullWidth
                onClick={() => {
                  void audio.stop();
                }}
                disabled={!isRunning}
              >
                Zatrzymaj
              </Button>
              {audio.state.error !== null && (
                <p className="rounded-lg border border-err/40 bg-err/10 px-3 py-2 text-xs text-err">
                  {audio.state.error}
                </p>
              )}
              {!isRunning && (
                <p className="text-xs text-ink-400 leading-relaxed">
                  Wybierz wejście. Mikrofon wymaga zgody przeglądarki. Wewnętrzne
                  źródło to wbudowany generator, sygnał trafia od razu do
                  analizatora oraz na głośniki.
                </p>
              )}

              {isRunning && (
                <div className="rounded-xl border border-white/5 bg-ink-900/40 p-3">
                  <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                    <div className="text-ink-400">fs karty</div>
                    <div className="text-right text-ink-100">
                      {formatSI(audio.state.sampleRate, "Hz")}
                    </div>
                    <div className="text-ink-400">FFT</div>
                    <div className="text-right text-ink-100">{fftSize}</div>
                    <div className="text-ink-400">Δf</div>
                    <div className="text-right text-ink-100">
                      {(audio.state.sampleRate / fftSize).toFixed(2)} Hz
                    </div>
                  </div>
                </div>
              )}

              <SelectField
                label="Długość FFT"
                value={fftSize.toString()}
                options={FFT_OPTIONS.map((n) => ({
                  value: n.toString(),
                  label: n.toString(),
                }))}
                onValueChange={(v) => {
                  setFftSize(Number(v));
                }}
              />
            </div>
          </Card>

          <Card title="Generator funkcyjny" eyebrow="Wyjście audio">
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-200">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-white/20 bg-ink-900 text-accent focus-ring"
                  checked={generator.enabled}
                  onChange={(e) => {
                    setGenerator((g) => ({ ...g, enabled: e.target.checked }));
                  }}
                  disabled={!isRunning}
                />
                Włącz generator (uwaga, grają głośniki)
              </label>
              <SelectField
                label="Kształt"
                value={generator.wave}
                onValueChange={(v: Wave) => {
                  setGenerator((g) => ({ ...g, wave: v }));
                }}
                options={[
                  { value: "sine", label: "Sinus" },
                  { value: "square", label: "Prostokąt" },
                  { value: "triangle", label: "Trójkąt" },
                  { value: "sawtooth", label: "Piła" },
                ]}
              />
              <NumberField
                label="Częstotliwość"
                value={generator.frequency}
                unit="Hz"
                step={10}
                min={20}
                max={20_000}
                onValueChange={(frequency) => {
                  setGenerator((g) => ({ ...g, frequency }));
                }}
              />
              <SliderField
                label="Amplituda"
                value={generator.amplitude}
                min={0}
                max={0.5}
                step={0.005}
                format={(n) => `${(n * 100).toFixed(0)} %`}
                onValueChange={(amplitude) => {
                  setGenerator((g) => ({ ...g, amplitude }));
                }}
              />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card
            title="Sygnał w czasie"
            eyebrow="Oscyloskop"
            description="Próbki pobierane wprost z analizatora karty. Pokazujemy znormalizowany przedział od minus jeden do jeden."
          >
            {snap ? (
              <ScopeView snap={snap} />
            ) : (
              <Placeholder text="Włącz wejście aby zobaczyć sygnał" />
            )}
          </Card>

          <Card
            title="Widmo amplitudowe"
            eyebrow="Analizator widma"
            description="Skala logarytmiczna w dBFS. Pomarańczowa kreska zaznacza wykrytą częstotliwość podstawową."
          >
            {snap ? (
              <SpectrumView snap={snap} />
            ) : (
              <Placeholder text="Włącz wejście aby zobaczyć widmo" />
            )}
          </Card>

          <Card
            title="Pomiary parametrów"
            eyebrow="Z bieżącego okna"
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat
                label="RMS"
                value={snap ? snap.rms.toFixed(4) : "—"}
                emphasis="accent"
                hint="próbki [−1, 1]"
              />
              <Stat
                label="Peak"
                value={snap ? snap.peak.toFixed(4) : "—"}
              />
              <Stat
                label="DC"
                value={snap ? snap.dcOffset.toExponential(2) : "—"}
                hint="składowa stała"
              />
              <Stat
                label="Crest factor"
                value={snap && snap.rms > 0 ? (snap.peak / snap.rms).toFixed(2) : "—"}
                hint="peak / rms"
              />
              <Stat
                label="Częstotliwość podstawowa"
                value={
                  snap?.fundamentalHz != null
                    ? `${snap.fundamentalHz.toFixed(1)} Hz`
                    : "—"
                }
                emphasis="ok"
              />
              <Stat
                label="THD (do 6. harmonicznej)"
                value={
                  snap?.thdPercent != null
                    ? `${snap.thdPercent.toFixed(2)} %`
                    : "—"
                }
                hint="szacunkowo, wymaga czystego tonu"
              />
              <Stat
                label="SNR pasma"
                value={
                  snap?.fundamentalHz != null && snap.thdPercent != null && snap.thdPercent > 0
                    ? `${(20 * Math.log10(100 / snap.thdPercent)).toFixed(1)} dB`
                    : "—"
                }
              />
              <Stat label="dBFS RMS" value={snap ? dbfs(snap.rms) : "—"} />
            </div>
          </Card>

          <Card title="Jak to działa" eyebrow="Wyjaśnienie">
            <Prose>
              <p>
                Web Audio API tworzy łańcuch węzłów audio. W tej aplikacji
                są to: wejście (mikrofon lub generator), AnalyserNode, oraz
                opcjonalnie wyjście na głośniki. Analyser to gotowy
                wyświetlacz, daje próbki w dziedzinie czasu oraz widmo w
                dziedzinie częstotliwości po wewnętrznym FFT.
              </p>
              <p>
                Karta dźwiękowa próbkuje sygnał z częstotliwością narzuconą
                przez system, najczęściej 44 100 lub 48 000 Hz. Pasmo
                użyteczne sięga połowy tej wartości, więc do około 20 kHz.
                Dynamika to nominalnie 16 bitów, choć w praktyce karty na
                pokładowe dają ENOB w okolicach 12 do 14 bitów.
              </p>
              <p>
                <strong>RMS</strong> liczymy z próbek w aktualnym oknie,
                <strong> peak </strong> to maksimum modułu w tym samym oknie.
                Stosunek peak do RMS to crest factor, dla czystego sinusa wynosi
                około 1,41. Dla mowy i muzyki jest dużo większy.
              </p>
              <p>
                <strong>THD</strong> czyli całkowite zniekształcenia
                harmoniczne to stosunek wartości skutecznej harmonicznych do
                wartości skutecznej tonu podstawowego. Liczymy do szóstej
                harmonicznej, bo wyżej ginie w szumie. Pomiar jest sensowny
                tylko gdy faktycznie podajesz czysty ton. Mówiąc do mikrofonu
                otrzymasz wartość zupełnie przypadkową.
              </p>
              <h3>Praktyczna uwaga</h3>
              <p>
                Karta dźwiękowa ma ograniczenia z których łatwo zapomnieć.
                Wejście jest filtrowane antyaliasingowo i sprzężone
                zmiennoprądowo, więc nie zmierzysz nią napięć stałych.
                Wyjście słuchawkowe ma niezerową impedancję wyjściową, więc
                generując sygnał na zewnętrzny układ trzeba pamiętać o
                obciążeniu. Ale jako tani generator i analizator do badań
                akustycznych sprawuje się bardzo dobrze.
              </p>
            </Prose>
          </Card>
        </div>
      </div>
    </div>
  );
}

function dbfs(rms: number): string {
  if (rms <= 0) return "−∞ dB";
  return `${(20 * Math.log10(rms)).toFixed(1)} dBFS`;
}

function Placeholder({ text }: { text: string }) {
  return (
    <div className="grid h-48 place-items-center rounded-xl border border-dashed border-white/10 bg-ink-950/40 text-sm text-ink-400">
      {text}
    </div>
  );
}
