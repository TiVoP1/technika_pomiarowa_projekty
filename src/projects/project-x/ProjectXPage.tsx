import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { NumberField, SelectField, SliderField } from "@/components/ui/Field";
import { Stat } from "@/components/ui/Stat";
import { Prose } from "@/components/ui/Prose";
import { WINDOW_LABELS, type WindowKind } from "@/lib/fft";
import type { WaveformSpec } from "@/lib/signals";
import { computeSpectrum } from "@/projects/project-x/spectrum";
import { TimePlot } from "@/projects/project-x/TimePlot";
import { SpectrumPlot } from "@/projects/project-x/SpectrumPlot";

const FFT_SIZES = [256, 512, 1024, 2048, 4096];

interface Tone {
  id: number;
  enabled: boolean;
  frequency: number;
  amplitude: number;
  phase: number;
}

const INITIAL_TONES: Tone[] = [
  { id: 1, enabled: true, frequency: 1000, amplitude: 1, phase: 0 },
  { id: 2, enabled: true, frequency: 1750, amplitude: 0.5, phase: 0 },
  { id: 3, enabled: false, frequency: 3300, amplitude: 0.3, phase: 0 },
];

export function ProjectXPage() {
  const [sampleRate, setSampleRate] = useState(8000);
  const [fftSize, setFftSize] = useState(1024);
  const [window, setWindow] = useState<WindowKind>("hann");
  const [scale, setScale] = useState<"linear" | "db">("db");
  const [tones, setTones] = useState<Tone[]>(INITIAL_TONES);

  const signals = useMemo<WaveformSpec[]>(
    () =>
      tones
        .filter((t) => t.enabled)
        .map((t) => ({
          kind: "sine" as const,
          frequency: t.frequency,
          amplitude: t.amplitude,
          phase: t.phase,
          dcOffset: 0,
          duty: 0.5,
        })),
    [tones],
  );

  const spectrum = useMemo(
    () => computeSpectrum({ signals, sampleRate, fftSize, window }),
    [signals, sampleRate, fftSize, window],
  );

  const expected = useMemo(
    () =>
      tones
        .filter((t) => t.enabled)
        .map((t) => ({
          f: t.frequency,
          label: `${t.frequency.toFixed(0)} Hz`,
        })),
    [tones],
  );

  const binWidth = sampleRate / fftSize;
  const nyquist = sampleRate / 2;
  const aliasedTones = tones.filter((t) => t.enabled && t.frequency >= nyquist);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Projekt X"
        title="Analiza widmowa: aliasing i przeciek"
        lead="Generujesz dowolną kombinację sinusoid, ustawiasz częstotliwość próbkowania oraz długość okna obserwacji. Widmo liczone jest przez FFT i nakładamy na sygnał wybraną funkcję okna. Łatwo wywołać oba kanoniczne błędy analizy widmowej."
      />

      <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
        <div className="space-y-4">
          <Card title="Akwizycja" eyebrow="Próbkowanie i FFT">
            <div className="space-y-4">
              <NumberField
                label="Częstotliwość próbkowania fs"
                value={sampleRate}
                unit="Hz"
                step={100}
                onValueChange={(v) => {
                  setSampleRate(Math.max(100, v));
                }}
                hint={`Częstotliwość Nyquista = ${nyquist.toFixed(0)} Hz`}
              />
              <SelectField
                label="Długość okna N"
                value={fftSize.toString()}
                options={FFT_SIZES.map((n) => ({
                  value: n.toString(),
                  label: `${n} próbek`,
                }))}
                onValueChange={(v) => {
                  setFftSize(Number(v));
                }}
              />
              <Stat
                label="Rozdzielczość Δf = fs / N"
                value={`${binWidth.toFixed(2)} Hz`}
                hint={`czas obserwacji T = ${(fftSize / sampleRate * 1000).toFixed(2)} ms`}
              />
              <SelectField
                label="Funkcja okna"
                value={window}
                onValueChange={setWindow}
                options={(["rect", "hann", "hamming", "blackman", "flattop"] as const).map(
                  (k) => ({ value: k, label: WINDOW_LABELS[k] }),
                )}
              />
              <SelectField
                label="Skala widma"
                value={scale}
                onValueChange={(v) => {
                  setScale(v);
                }}
                options={[
                  { value: "linear", label: "Liniowa (amplituda)" },
                  { value: "db", label: "Logarytmiczna (dB)" },
                ]}
              />
            </div>
          </Card>

          <Card title="Składowe sinusoidalne" eyebrow="Sygnał testowy">
            <div className="space-y-3">
              {tones.map((tone, i) => (
                <ToneRow
                  key={tone.id}
                  tone={tone}
                  onChange={(next) => {
                    setTones((arr) => arr.map((t, j) => (i === j ? next : t)));
                  }}
                />
              ))}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setTones((arr) => [
                      ...arr,
                      {
                        id: Date.now(),
                        enabled: true,
                        frequency: 1500,
                        amplitude: 0.4,
                        phase: 0,
                      },
                    ]);
                  }}
                >
                  Dodaj składową
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setTones(INITIAL_TONES);
                  }}
                >
                  Resetuj
                </Button>
              </div>
            </div>
          </Card>

          {aliasedTones.length > 0 && (
            <Card title="Aliasing" eyebrow="Uwaga">
              <p className="text-sm text-warn">
                {aliasedTones.length} składow{aliasedTones.length === 1 ? "a" : "e"} ma
                częstotliwość większą lub równą fs/2. W widmie zobaczysz je
                złożone do pasma podstawowego.
              </p>
              <ul className="mt-2 space-y-1 font-mono text-xs text-ink-200">
                {aliasedTones.map((t) => (
                  <li key={t.id}>
                    {t.frequency} Hz → {aliasFold(t.frequency, sampleRate).toFixed(2)} Hz
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card
            title="Sygnał w dziedzinie czasu"
            eyebrow={`${fftSize} próbek przy fs = ${sampleRate} Hz`}
            description="Niebieska linia to ciągły sygnał, kropki to próbki podawane do FFT. Żółta przerywana linia to obwiednia okna czasowego."
          >
            <TimePlot
              ideal={spectrum.timeIdeal}
              sampled={spectrum.timeSampled}
              sampleRate={sampleRate}
              windowKind={window}
              showWindow
            />
          </Card>

          <Card
            title="Widmo amplitudowe"
            eyebrow={`FFT • okno ${WINDOW_LABELS[window]}`}
            description="Niebieska linia to wynik FFT. Pomarańczowe kreski pionowe wskazują gdzie powinny być prążki dla idealnej analizy, po uwzględnieniu aliasingu."
          >
            <SpectrumPlot
              freq={spectrum.freq}
              mag={spectrum.mag}
              sampleRate={sampleRate}
              expectedLines={expected}
              scale={scale}
            />

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Stat label="Δf (rozdzielczość)" value={`${binWidth.toFixed(2)} Hz`} />
              <Stat
                label="Nyquist"
                value={`${nyquist.toFixed(0)} Hz`}
                emphasis={aliasedTones.length > 0 ? "warn" : "neutral"}
              />
              <Stat label="N (długość okna)" value={fftSize.toString()} />
            </div>
          </Card>

          <Card title="Co tu właściwie widać" eyebrow="Wyjaśnienie">
            <Prose>
              <h3>Aliasing</h3>
              <p>
                Jeśli próbkujesz sygnał o częstotliwości większej niż połowa
                częstotliwości próbkowania, w widmie pojawi się on w innym
                miejscu niż powinien. Sygnał o częstotliwości f i sygnał o
                częstotliwości fs minus f dają takie same próbki, więc analizator
                nie ma jak ich rozróżnić. Dlatego w prawdziwym przyrządzie
                stosuje się filtr antyaliasingowy przed przetwornikiem.
              </p>
              <p>
                W tej aplikacji możesz to wywołać ustawiając tonyc o
                częstotliwości większej niż fs/2. Pomarańczowa kreska
                pokazuje gdzie ta składowa zostanie odbita do pasma
                podstawowego.
              </p>
              <h3>Przeciek widmowy</h3>
              <p>
                FFT zakłada że obserwowany odcinek sygnału powtarza się w
                nieskończoność. Jeśli sygnał nie zawiera całkowitej liczby
                okresów w oknie obserwacji, na styku okresów pojawia się
                nieciągłość. W dziedzinie częstotliwości daje to rozmycie
                prążka i pojawienie się sąsiednich listków bocznych. Zjawisko
                nazywamy przeciekiem widmowym.
              </p>
              <p>
                Funkcja okna to mnożenie sygnału przez gładką obwiednię która
                wygasza końce do zera. Dzięki temu nieciągłość znika a listki
                boczne maleją. Płacisz za to poszerzeniem prążka głównego.
                Każde okno to inny kompromis:
              </p>
              <ul>
                <li>
                  <strong>Prostokątne</strong> najwęższy prążek główny ale
                  ogromne listki boczne.
                </li>
                <li>
                  <strong>Hanna</strong> klasyczny wybór, dobre tłumienie
                  listków, umiarkowane poszerzenie.
                </li>
                <li>
                  <strong>Hamminga</strong> jak Hanna, trochę inny kompromis.
                </li>
                <li>
                  <strong>Blackmana</strong> bardzo dobre tłumienie listków,
                  szerszy prążek główny.
                </li>
                <li>
                  <strong>Flat-top</strong> najszerszy prążek główny, za to
                  bardzo płaska wierzchołek, więc dobrze nadaje się do
                  precyzyjnego pomiaru amplitudy.
                </li>
              </ul>
              <h3>Twierdzenie o próbkowaniu</h3>
              <p>
                Mówiąc krótko, częstotliwość próbkowania musi być większa niż
                podwojona maksymalna częstotliwość obecna w sygnale. To jest
                twierdzenie Nyquista-Shannona. W praktyce stosuje się
                zapas, na przykład fs co najmniej 2,5 razy większa od pasma
                użytecznego, żeby zostawić miejsce na realny filtr
                antyaliasingowy.
              </p>
            </Prose>
          </Card>
        </div>
      </div>
    </div>
  );
}

function aliasFold(f: number, fs: number): number {
  const r = ((f % fs) + fs) % fs;
  return r <= fs / 2 ? r : fs - r;
}

function ToneRow({
  tone,
  onChange,
}: {
  tone: Tone;
  onChange: (next: Tone) => void;
}) {
  return (
    <div className="space-y-2 rounded-xl border border-white/5 bg-ink-900/30 p-3">
      <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-200">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-white/20 bg-ink-900 text-accent focus-ring"
          checked={tone.enabled}
          onChange={(e) => {
            onChange({ ...tone, enabled: e.target.checked });
          }}
        />
        <span className="font-mono text-xs text-ink-400">
          składowa #{tone.id}
        </span>
        <span className="ml-auto font-mono text-sm text-ink-100">
          {tone.frequency} Hz
        </span>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <NumberField
          label="f"
          unit="Hz"
          value={tone.frequency}
          onValueChange={(frequency) => {
            onChange({ ...tone, frequency });
          }}
        />
        <NumberField
          label="A"
          value={tone.amplitude}
          step={0.05}
          onValueChange={(amplitude) => {
            onChange({ ...tone, amplitude });
          }}
        />
      </div>
      <SliderField
        label="Faza"
        value={tone.phase}
        min={-Math.PI}
        max={Math.PI}
        step={0.05}
        format={(n) => `${(n * 180 / Math.PI).toFixed(0)}°`}
        onValueChange={(phase) => {
          onChange({ ...tone, phase });
        }}
      />
    </div>
  );
}
