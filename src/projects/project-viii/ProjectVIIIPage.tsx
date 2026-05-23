import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { NumberField, SelectField } from "@/components/ui/Field";
import { Stat } from "@/components/ui/Stat";
import { Prose } from "@/components/ui/Prose";
import { formatSI } from "@/lib/format";
import {
  computeError,
  PRESETS,
  type QuantityPreset,
  type SpecAccuracy,
} from "@/projects/project-viii/errors";
import { ErrorBars } from "@/projects/project-viii/ErrorBars";

interface State {
  presetId: string;
  rangeIdx: number;
  reading: number;
  customSpec: SpecAccuracy;
  useCustom: boolean;
}

const INITIAL: State = {
  presetId: PRESETS[0]?.id ?? "",
  rangeIdx: 2,
  reading: 5.2735,
  customSpec: {
    percentReading: 0.05,
    percentRange: 0.01,
    digits: 5,
    resolution: 1e-4,
  },
  useCustom: false,
};

export function ProjectVIIIPage() {
  const [state, setState] = useState<State>(INITIAL);

  const fallback = PRESETS[0];
  if (!fallback) {
    throw new Error("No measurement presets configured");
  }
  const preset: QuantityPreset =
    PRESETS.find((p) => p.id === state.presetId) ?? fallback;
  const rangeDef = preset.ranges[state.rangeIdx] ?? preset.ranges[0];
  if (!rangeDef) {
    throw new Error("No range available");
  }

  const spec = useMemo<SpecAccuracy>(
    () =>
      state.useCustom
        ? state.customSpec
        : { ...rangeDef.spec, resolution: rangeDef.resolution },
    [state.useCustom, state.customSpec, rangeDef],
  );
  const range = rangeDef.range;

  const breakdown = useMemo(
    () => computeError(state.reading, range, spec),
    [state.reading, range, spec],
  );

  const inRange = Math.abs(state.reading) <= range * 1.001;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Projekt VIII"
        title="Wyznaczanie błędów pomiaru z katalogu"
        lead="Producent multimetru podaje dokładność w postaci ± a procent odczytu plus b cyfr lub plus c procent zakresu. Wystarczy znać odczyt, zakres oraz tę specyfikację żeby wyznaczyć błąd graniczny i przedział ufności."
      />

      <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
        <div className="space-y-4">
          <Card title="Mierzona wielkość i zakres" eyebrow="Wybór">
            <div className="space-y-3">
              <SelectField
                label="Funkcja i przyrząd"
                value={state.presetId}
                onValueChange={(v) => {
                  setState((s) => ({ ...s, presetId: v, rangeIdx: 0 }));
                }}
                options={PRESETS.map((p) => ({ value: p.id, label: p.label }))}
              />
              <SelectField
                label="Zakres pomiarowy"
                value={state.rangeIdx.toString()}
                onValueChange={(v) => {
                  setState((s) => ({ ...s, rangeIdx: Number(v) }));
                }}
                options={preset.ranges.map((r, i) => ({
                  value: i.toString(),
                  label: r.label,
                }))}
              />
              <NumberField
                label={`Odczyt z wyświetlacza (${preset.unit})`}
                unit={preset.unit}
                value={state.reading}
                step={rangeDef.resolution}
                onValueChange={(reading) => {
                  setState((s) => ({ ...s, reading }));
                }}
              />
              {!inRange && (
                <p className="rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-xs text-warn">
                  Uwaga: odczyt przekracza zakres. Przyrząd pokaże stan
                  przepełnienia (OL).
                </p>
              )}
            </div>
          </Card>

          <Card
            title="Specyfikacja"
            eyebrow={state.useCustom ? "Własna" : "Z presetu"}
            action={
              <label className="flex cursor-pointer items-center gap-2 text-xs text-ink-300">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-white/20 bg-ink-900 text-accent focus-ring"
                  checked={state.useCustom}
                  onChange={(e) => {
                    setState((s) => ({ ...s, useCustom: e.target.checked }));
                  }}
                />
                Wpisz ręcznie
              </label>
            }
          >
            <div className="space-y-3">
              <SpecRow label="a (% odczytu)" value={spec.percentReading} />
              <SpecRow label="c (% zakresu)" value={spec.percentRange} />
              <SpecRow label="b (digits)" value={spec.digits} integer />
              <SpecRow
                label="1 digit"
                value={spec.resolution}
                unit={preset.unit}
                isResolution
              />
              {state.useCustom && (
                <div className="space-y-3 border-t border-white/5 pt-3">
                  <NumberField
                    label="a (% odczytu)"
                    value={state.customSpec.percentReading}
                    step={0.001}
                    onValueChange={(percentReading) => {
                      setState((s) => ({
                        ...s,
                        customSpec: { ...s.customSpec, percentReading },
                      }));
                    }}
                  />
                  <NumberField
                    label="c (% zakresu)"
                    value={state.customSpec.percentRange}
                    step={0.001}
                    onValueChange={(percentRange) => {
                      setState((s) => ({
                        ...s,
                        customSpec: { ...s.customSpec, percentRange },
                      }));
                    }}
                  />
                  <NumberField
                    label="b (digits)"
                    value={state.customSpec.digits}
                    step={1}
                    onValueChange={(digits) => {
                      setState((s) => ({
                        ...s,
                        customSpec: { ...s.customSpec, digits },
                      }));
                    }}
                  />
                  <NumberField
                    label="Wartość 1 digit"
                    unit={preset.unit}
                    value={state.customSpec.resolution}
                    step={rangeDef.resolution}
                    onValueChange={(resolution) => {
                      setState((s) => ({
                        ...s,
                        customSpec: { ...s.customSpec, resolution },
                      }));
                    }}
                  />
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card
            title="Wynik z błędem granicznym"
            eyebrow="Ostateczna postać"
            description="Przedział ufności wyznaczony jako ± maksymalny błąd. Pasek kolorów u góry pokazuje udział poszczególnych składników: niebieski to procent odczytu, zielony procent zakresu, czerwony cyfry."
          >
            <ErrorBars breakdown={breakdown} unit={preset.unit} />

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat
                label="Błąd graniczny ± Δ"
                value={formatSI(breakdown.absoluteError, preset.unit, 3)}
                emphasis="accent"
              />
              <Stat
                label="Błąd względny δ"
                value={`${(breakdown.relativeError * 100).toPrecision(3)} %`}
                hint="Δ / |odczyt|"
                emphasis={breakdown.relativeError > 0.05 ? "warn" : "ok"}
              />
              <Stat
                label="Niepewność standardowa u"
                value={formatSI(breakdown.standardUncertainty, preset.unit, 3)}
                hint="Typ B, rozkład prostokątny"
              />
              <Stat
                label="Niepewność rozszerzona U (k=2)"
                value={formatSI(breakdown.expandedUncertaintyK2, preset.unit, 3)}
                hint="ok 95% poziomu ufności"
              />
            </div>

            <div className="mt-6 rounded-xl border border-white/5 bg-ink-900/40 p-4">
              <div className="eyebrow mb-2">Notacja końcowa</div>
              <div className="font-mono text-lg text-ink-50">
                X = ({breakdown.reading.toPrecision(6)} ± {breakdown.absoluteError.toPrecision(3)}) {preset.unit}
              </div>
              <div className="mt-1 font-mono text-xs text-ink-400">
                w przedziale [{breakdown.intervalLow.toPrecision(6)}; {breakdown.intervalHigh.toPrecision(6)}] {preset.unit}
              </div>
            </div>
          </Card>

          <Card title="Z czego składa się błąd" eyebrow="Rozkład">
            <div className="grid gap-3 sm:grid-cols-3">
              <ComponentRow
                color="#7aa2ff"
                label="a% odczytu"
                value={breakdown.termReading}
                total={breakdown.absoluteError}
                unit={preset.unit}
                formula={`${spec.percentReading} % · ${state.reading.toPrecision(4)}`}
              />
              <ComponentRow
                color="#4fd1a4"
                label="c% zakresu"
                value={breakdown.termRange}
                total={breakdown.absoluteError}
                unit={preset.unit}
                formula={`${spec.percentRange} % · ${range}`}
              />
              <ComponentRow
                color="#ef5d6a"
                label="b digits"
                value={breakdown.termDigits}
                total={breakdown.absoluteError}
                unit={preset.unit}
                formula={`${spec.digits} · ${formatSI(spec.resolution, preset.unit)}`}
              />
            </div>
          </Card>

          <Card title="Skąd te wzory" eyebrow="Wyjaśnienie">
            <Prose>
              <p>
                Dokładność multimetru cyfrowego producent zapisuje zwykle jako
                <code> ± (a % odczytu + b digits) </code> albo
                <code> ± (a % odczytu + c % zakresu) </code>. Pierwszy
                składnik rośnie razem z odczytem, drugi jest stały dla danego
                zakresu. Dlatego pomiary blisko zakresu są lepsze niż na samym
                dole zakresu. Stąd zasada żeby ustawiać najmniejszy zakres
                jaki nie spowoduje przepełnienia.
              </p>
              <p>
                Składnik <strong>digits</strong> to po prostu kilka jednostek
                najmłodszej wyświetlanej cyfry. Jeśli przyrząd ma rozdzielczość
                jednego mikrowolta a producent podaje plus pięć cyfr, to wkład
                z tej składowej wynosi pięć mikrowoltów niezależnie od tego co
                pokazuje wyświetlacz.
              </p>
              <h3>Od błędu granicznego do niepewności</h3>
              <p>
                Norma GUM przyjmuje że jeżeli wiemy tylko że wartość mieści się
                w przedziale ±Δ to rozkład najlepiej opisać jako prostokątny.
                Wówczas niepewność standardowa wynosi
                <code> u = Δ / √3 </code>. Rozszerzona niepewność z
                współczynnikiem rozszerzenia k = 2 daje przedział o poziomie
                ufności około 95 procent.
              </p>
              <h3>Po co to wszystko</h3>
              <p>
                Bez błędu pomiar to tylko liczba bez kontekstu. Z błędem
                można sensownie porównywać wyniki, sprawdzać czy mieszczą się
                w specyfikacji wyrobu i decydować czy dwa pomiary różnią się
                istotnie czy nie. To podstawa pracy w laboratorium pomiarowym.
              </p>
            </Prose>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SpecRow({
  label,
  value,
  unit,
  integer,
  isResolution,
}: {
  label: string;
  value: number;
  unit?: string;
  integer?: boolean;
  isResolution?: boolean;
}) {
  let display: string;
  if (integer === true) {
    display = value.toString();
  } else if (isResolution === true) {
    display = formatSI(value, unit ?? "");
  } else {
    display = value.toString();
  }
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/5 bg-ink-900/40 px-3 py-2 font-mono text-sm">
      <span className="text-ink-400">{label}</span>
      <span className="text-ink-50">{display}</span>
    </div>
  );
}

function ComponentRow({
  color,
  label,
  value,
  total,
  unit,
  formula,
}: {
  color: string;
  label: string;
  value: number;
  total: number;
  unit: string;
  formula: string;
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="rounded-xl border border-white/5 bg-ink-900/40 p-4">
      <div className="mb-2 flex items-center gap-2">
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ background: color }}
        />
        <span className="eyebrow">{label}</span>
      </div>
      <div className="font-mono text-lg text-ink-50">
        {formatSI(value, unit, 3)}
      </div>
      <div className="mt-1 text-xs text-ink-400">{formula}</div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <div className="mt-1 text-right font-mono text-[0.7rem] text-ink-400">
        {pct.toFixed(1)} %
      </div>
    </div>
  );
}
