import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { NumberField, SelectField, SliderField } from "@/components/ui/Field";
import { Stat } from "@/components/ui/Stat";
import { Prose } from "@/components/ui/Prose";
import { WAVEFORM_LABEL, type WaveformKind, type WaveformSpec } from "@/lib/signals";
import { formatNumber } from "@/lib/format";
import {
  analyzeRms,
  numericRms,
  DERIVATIONS,
  DC_DECOMPOSITION,
  WAVEFORM_TABLE,
  SINE_FORM_FACTOR,
  type Derivation,
} from "@/projects/project-ii/rms";
import { WavePlot } from "@/projects/project-ii/WavePlot";

const KINDS: readonly WaveformKind[] = [
  "sine",
  "sawtooth",
  "triangle",
  "square",
  "pulse",
];

export function ProjectIIPage() {
  const [kind, setKind] = useState<WaveformKind>("sine");
  const [amplitude, setAmplitude] = useState(1);
  const [dcOffset, setDcOffset] = useState(0);
  const [duty, setDuty] = useState(0.25);

  const spec = useMemo<WaveformSpec>(
    () => ({
      kind,
      frequency: 1,
      amplitude,
      phase: 0,
      dcOffset,
      duty,
    }),
    [kind, amplitude, dcOffset, duty],
  );

  const analysis = useMemo(() => analyzeRms(spec), [spec]);
  const numeric = useMemo(() => numericRms(spec), [spec]);
  const derivation = DERIVATIONS[kind];

  const numericMatch = Math.abs(numeric - analysis.rmsTotal);
  const meterErr = analysis.avgMeterErrorPct;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Projekt II"
        title="Wartość skuteczna sygnałów o różnych kształtach"
        lead="Wybierasz kształt przebiegu, amplitudę, składową stałą i wypełnienie. Aplikacja liczy wartość skuteczną analitycznie z wyprowadzeniem krok po kroku oraz numerycznie z próbek, a przy okazji pokazuje o ile pomyli się miernik z prostownikiem wyskalowany dla sinusoidy."
      />

      <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
        <div className="space-y-4">
          <Card title="Sygnał" eyebrow="Parametry przebiegu">
            <div className="space-y-4">
              <SelectField
                label="Kształt przebiegu"
                value={kind}
                onValueChange={setKind}
                options={KINDS.map((k) => ({
                  value: k,
                  label: WAVEFORM_LABEL[k],
                }))}
              />
              <NumberField
                label="Amplituda A"
                value={amplitude}
                unit="V"
                step={0.1}
                onValueChange={(v) => {
                  setAmplitude(Math.max(0, v));
                }}
              />
              <NumberField
                label="Składowa stała D"
                value={dcOffset}
                unit="V"
                step={0.1}
                onValueChange={setDcOffset}
                hint="Przesunięcie całego przebiegu w górę lub w dół."
              />
              {kind === "pulse" && (
                <SliderField
                  label="Współczynnik wypełnienia d"
                  value={duty}
                  min={0.01}
                  max={0.99}
                  step={0.01}
                  format={(n) => `${(n * 100).toFixed(0)}%`}
                  onValueChange={setDuty}
                />
              )}
            </div>
          </Card>

          <Card title="Wyniki" eyebrow="Wartości charakterystyczne">
            <div className="grid gap-3 sm:grid-cols-2">
              <Stat
                label="X (RMS, analitycznie)"
                value={formatNumber(analysis.rmsTotal, 4)}
                unit="V"
                emphasis="accent"
              />
              <Stat
                label="X (RMS, numerycznie)"
                value={formatNumber(numeric, 4)}
                unit="V"
                hint={
                  numericMatch < 1e-3
                    ? "zgadza się z wynikiem analitycznym"
                    : `różnica ${formatNumber(numericMatch, 2)} V`
                }
              />
              <Stat
                label="X₀ (składowa stała)"
                value={formatNumber(analysis.mean, 4)}
                unit="V"
              />
              <Stat
                label="X_AC (RMS przemiennej)"
                value={formatNumber(analysis.rmsAC, 4)}
                unit="V"
                hint="√(X² − X₀²)"
              />
              <Stat
                label="Współczynnik szczytu"
                value={formatNumber(analysis.crest, 4)}
                hint="|x|max / X"
              />
              <Stat
                label="Współczynnik kształtu"
                value={formatNumber(analysis.form, 4)}
                hint="X / avg|x|"
              />
            </div>
          </Card>

          <Card title="Miernik z prostownikiem" eyebrow="True RMS kontra średnia">
            <p className="mb-3 text-sm leading-relaxed text-ink-300">
              Tani multimetr nie liczy wartości skutecznej. Prostuje sygnał,
              uśrednia go i mnoży przez k = π/(2√2) ≈ {SINE_FORM_FACTOR.toFixed(4)},
              czyli współczynnik kształtu sinusoidy. Dla każdego innego
              kształtu wskazanie jest błędne.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Stat
                label="True RMS"
                value={formatNumber(analysis.rmsTotal, 4)}
                unit="V"
                emphasis="ok"
              />
              <Stat
                label="Wskazanie z prostownika"
                value={formatNumber(analysis.avgMeterReading, 4)}
                unit="V"
                emphasis={Math.abs(meterErr) > 1 ? "warn" : "ok"}
                hint={
                  Math.abs(meterErr) < 0.05
                    ? "błąd pomijalny"
                    : `błąd ${meterErr > 0 ? "+" : ""}${formatNumber(meterErr, 3)}%`
                }
              />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card
            title="Przebieg x(t)"
            eyebrow={`${WAVEFORM_LABEL[kind]} • dwa okresy`}
            description="Żółta przerywana linia to składowa stała X₀ (wartość średnia). Zielone linie to poziom ±X — napięcie stałe o tej wartości wydzieliłoby na rezystorze tę samą moc co ten przebieg."
          >
            <WavePlot
              spec={spec}
              mode="signal"
              mean={analysis.mean}
              rmsTotal={analysis.rmsTotal}
            />
          </Card>

          <Card
            title="Kwadrat sygnału x²(t)"
            eyebrow="Skąd bierze się RMS"
            description="Wartość skuteczna to pierwiastek ze średniej tego wykresu. Niebieskie pole to energia oddawana w rezystorze, zielona linia to jej średni poziom, czyli X²."
          >
            <WavePlot
              spec={spec}
              mode="squared"
              mean={analysis.mean}
              rmsTotal={analysis.rmsTotal}
            />
          </Card>

          <Card
            title={`Wyprowadzenie: ${WAVEFORM_LABEL[kind].toLowerCase()}`}
            eyebrow="Krok po kroku"
          >
            <DerivationBlock derivation={derivation} />
          </Card>

          {(dcOffset !== 0 || kind === "pulse") && (
            <Card title="Składowa stała a wartość skuteczna" eyebrow="Rozkład ortogonalny">
              <DerivationBlock derivation={DC_DECOMPOSITION} />
            </Card>
          )}

          <Card
            title="Zestawienie przebiegów"
            eyebrow="Amplituda A, bez składowej stałej"
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="py-2 pr-4 font-medium text-ink-300">Przebieg</th>
                    <th className="py-2 pr-4 font-medium text-ink-300">RMS</th>
                    <th className="py-2 pr-4 font-medium text-ink-300">avg|x|</th>
                    <th className="py-2 pr-4 font-medium text-ink-300">Wsp. szczytu</th>
                    <th className="py-2 font-medium text-ink-300">Wsp. kształtu</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-xs text-ink-100">
                  {WAVEFORM_TABLE.map((row) => (
                    <tr
                      key={row.kind}
                      className={
                        row.kind === kind
                          ? "border-b border-white/5 bg-accent/10"
                          : "border-b border-white/5"
                      }
                    >
                      <td className="py-2 pr-4 font-sans text-sm text-ink-100">
                        {WAVEFORM_LABEL[row.kind]}
                      </td>
                      <td className="py-2 pr-4">{row.rms}</td>
                      <td className="py-2 pr-4">{row.avgRect}</td>
                      <td className="py-2 pr-4">{row.crest}</td>
                      <td className="py-2">{row.form}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Dlaczego to jest podstawowy problem pomiarowy" eyebrow="Wyjaśnienie">
            <Prose>
              <p>
                Wartość skuteczna (RMS) napięcia to taka wartość napięcia
                stałego, które w tym samym rezystorze wydzieliłoby tę samą moc
                średnią. Stąd definicja przez średnią kwadratu: moc chwilowa
                jest proporcjonalna do <code>x²(t)</code>, więc uśredniamy
                kwadrat, a na końcu wyciągamy pierwiastek.
              </p>
              <p>
                Problem pomiarowy polega na tym, że przyrząd wskazujący
                „wolty&rdquo; może mierzyć różne rzeczy: wartość szczytową, średnią
                wyprostowaną albo prawdziwą wartość skuteczną. Dopóki sygnał
                jest sinusoidą, wszystkie te metody da się przeskalować tak,
                żeby pokazywały to samo. Wystarczy jednak zmienić kształt
                przebiegu, a miernik uśredniający zacznie kłamać: dla
                prostokąta zawyży o około 11%, dla trójkąta zaniży o około 4%,
                a dla impulsów o małym wypełnieniu błąd sięga dziesiątek
                procent.
              </p>
              <p>
                Druga pułapka to składowa stała. Część mierników true RMS
                mierzy tylko składową przemienną (sprzężenie AC), więc przy
                sygnale z offsetem pokaże <code>X_AC</code>, a nie całkowitą
                wartość skuteczną. Pełny wynik trzeba wtedy złożyć samodzielnie
                z zależności <code>X = √(X₀² + X_AC²)</code>, którą
                wyprowadzamy powyżej.
              </p>
              <p>
                Wysoki współczynnik szczytu to trzecie ograniczenie. Impuls o
                wypełnieniu 1% ma współczynnik szczytu 10, a tor pomiarowy
                miernika ma skończony zakres liniowy. Producent podaje
                maksymalny współczynnik szczytu (typowo 3 do 5), powyżej
                którego nawet miernik true RMS przestaje mieścić szczyty
                sygnału i wynik jest zaniżony.
              </p>
            </Prose>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DerivationBlock({ derivation }: { derivation: Derivation }) {
  return (
    <div className="space-y-3">
      <p className="max-w-prose text-sm leading-relaxed text-ink-300">
        {derivation.intro}
      </p>
      <ol className="space-y-2">
        {derivation.steps.map((step, i) => (
          <li
            key={i}
            className="rounded-xl border border-white/5 bg-ink-900/40 p-3"
          >
            {step.text !== undefined && (
              <p className="mb-1.5 text-xs leading-relaxed text-ink-400">
                {step.text}
              </p>
            )}
            {step.formula !== undefined && (
              <p className="overflow-x-auto whitespace-nowrap font-mono text-sm text-accent-soft">
                {step.formula}
              </p>
            )}
          </li>
        ))}
      </ol>
      <p className="rounded-xl border border-ok/20 bg-ok/5 p-3 font-mono text-sm text-ok">
        {derivation.result}
      </p>
    </div>
  );
}
