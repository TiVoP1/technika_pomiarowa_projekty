import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { NumberField, SelectField } from "@/components/ui/Field";
import { Stat } from "@/components/ui/Stat";
import { Prose } from "@/components/ui/Prose";
import { formatSI } from "@/lib/format";
import { BodePlot } from "@/projects/project-iii/BodePlot";
import { PhasorView } from "@/projects/project-iii/Phasor";
import {
  bode,
  equivalents,
  impedance,
  magnitudePhase,
  type ElementKind,
  type RealCapacitor,
  type RealElement,
  type RealInductor,
  type RealResistor,
} from "@/projects/project-iii/circuits";

interface State {
  kind: ElementKind;
  frequency: number;
  resistor: RealResistor;
  inductor: RealInductor;
  capacitor: RealCapacitor;
}

const INITIAL: State = {
  kind: "capacitor",
  frequency: 10_000,
  resistor: { kind: "resistor", r: 1_000, l: 5e-9, c: 0.4e-12 },
  inductor: { kind: "inductor", l: 100e-6, rs: 0.6, c: 5e-12 },
  capacitor: { kind: "capacitor", c: 100e-9, esr: 0.04, esl: 2e-9 },
};

export function ProjectIIIPage() {
  const [state, setState] = useState<State>(INITIAL);
  const element = pickElement(state);
  const omega = 2 * Math.PI * state.frequency;
  const z = useMemo(() => impedance(element, omega), [element, omega]);
  const eq = useMemo(() => equivalents(z, omega), [z, omega]);
  const { mag, phaseDeg } = magnitudePhase(z);
  const points = useMemo(() => bode(element, 1, 1e9, 600), [element]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Projekt III"
        title="Schematy zastępcze elementów biernych"
        lead="Rzeczywisty rezystor, cewka i kondensator nie są tym, czym się je rysuje na schemacie. Każdy z nich zawiera resztę dwóch pozostałych. Tutaj wpisujesz wartości pasożytnicze i sprawdzasz jak wygląda impedancja przy zadanej częstotliwości oraz w całym pasmie."
      />

      <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
        <Card title="Parametry elementu" eyebrow="Wejście">
          <div className="space-y-4">
            <SelectField
              label="Rodzaj elementu"
              value={state.kind}
              onValueChange={(v) => {
                setState((s) => ({ ...s, kind: v }));
              }}
              options={[
                { value: "resistor", label: "Rezystor (R z pasożytami L i C)" },
                { value: "inductor", label: "Cewka (L z Rs i Cp)" },
                { value: "capacitor", label: "Kondensator (C z ESR i ESL)" },
              ]}
            />
            <NumberField
              label="Częstotliwość pomiaru"
              value={state.frequency}
              unit="Hz"
              min={0.1}
              step={1}
              onValueChange={(v) => {
                setState((s) => ({ ...s, frequency: v }));
              }}
              hint="Wartość przy której wyliczamy schemat zastępczy."
            />

            {state.kind === "resistor" && (
              <ResistorInputs
                value={state.resistor}
                onChange={(r) => {
                  setState((s) => ({ ...s, resistor: r }));
                }}
              />
            )}
            {state.kind === "inductor" && (
              <InductorInputs
                value={state.inductor}
                onChange={(l) => {
                  setState((s) => ({ ...s, inductor: l }));
                }}
              />
            )}
            {state.kind === "capacitor" && (
              <CapacitorInputs
                value={state.capacitor}
                onChange={(c) => {
                  setState((s) => ({ ...s, capacitor: c }));
                }}
              />
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card
            title="Impedancja przy zadanej częstotliwości"
            eyebrow={`f = ${formatSI(state.frequency, "Hz")}`}
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="|Z|" value={formatSI(mag, "Ω")} emphasis="accent" />
              <Stat
                label="Faza ∠Z"
                value={phaseDeg.toFixed(2)}
                unit="°"
                emphasis={Math.abs(phaseDeg) < 1 ? "ok" : "neutral"}
              />
              <Stat
                label="Re Z (Rs)"
                value={formatSI(eq.rs, "Ω")}
                hint="Szeregowa część rzeczywista"
              />
              <Stat
                label="Im Z (Xs)"
                value={formatSI(eq.xs, "Ω")}
                hint={eq.xs >= 0 ? "Reaktancja indukcyjna" : "Reaktancja pojemnościowa"}
                emphasis={eq.xs >= 0 ? "neutral" : "neutral"}
              />
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
              <div className="grid gap-3 sm:grid-cols-2">
                <ModelBlock
                  title="Model szeregowy"
                  rows={[
                    ["Rs", formatSI(eq.rs, "Ω")],
                    [eq.xs >= 0 ? "Ls" : "Cs",
                      eq.xs >= 0
                        ? formatSI(eq.equivL ?? 0, "H")
                        : formatSI(eq.equivC ?? 0, "F"),
                    ],
                  ]}
                />
                <ModelBlock
                  title="Model równoległy"
                  rows={[
                    ["Rp", formatSI(eq.rp, "Ω")],
                    [
                      eq.xp >= 0 ? "Lp" : "Cp",
                      eq.xp >= 0
                        ? formatSI(eq.equivLpar ?? 0, "H")
                        : formatSI(eq.equivCpar ?? 0, "F"),
                    ],
                  ]}
                />
                <Stat
                  label="Dobroć Q"
                  value={Number.isFinite(eq.q) ? eq.q.toFixed(3) : "∞"}
                  hint="Q = |Xs|/Rs"
                  emphasis="accent"
                />
                <Stat
                  label="Współczynnik strat D"
                  value={Number.isFinite(eq.d) ? eq.d.toFixed(4) : "—"}
                  hint="D = tan δ = 1/Q"
                />
              </div>
              <div className="min-h-[260px]">
                <PhasorView z={z} />
              </div>
            </div>
          </Card>

          <Card
            title="Charakterystyka częstotliwościowa"
            eyebrow="Bode"
            description="Linia niebieska to moduł impedancji w skali dB. Linia zielona to faza w stopniach. Pomarańczowa kreska zaznacza częstotliwość pomiaru."
          >
            <BodePlot points={points} markerFreq={state.frequency} />
          </Card>

          <Card title="O co tu chodzi" eyebrow="Wyjaśnienie">
            <Prose>
              <p>
                Rzeczywisty kondensator <strong>nie jest</strong> czystą
                pojemnością. Ma rezystancję wyprowadzeń i strat dielektryka
                <code>ESR</code> oraz indukcyjność doprowadzeń
                <code>ESL</code>. Powyżej pewnej częstotliwości to ESL bierze
                górę i kondensator zaczyna zachowywać się jak cewka. Punkt w
                którym to się dzieje to częstotliwość rezonansowa własna SRF.
              </p>
              <p>
                Z kolei cewka ma rezystancję drutu nawojowego oraz pojemność
                między zwojami. Powyżej SRF zachowuje się pojemnościowo. Dlatego
                producent zawsze podaje przedział użyteczny.
              </p>
              <p>
                Schemat szeregowy i równoległy są równoważne tylko w jednym
                punkcie częstotliwościowym. To dlatego po pomiarze impedancji
                trzeba wiedzieć w jakim modelu pracujesz, bo z tych samych
                liczb można wyprowadzić dwie różne pary wartości.
              </p>
              <p>Wzory konwersji są proste:</p>
              <ul>
                <li>
                  <code>Rp = Rs (1 + Q²)</code>
                </li>
                <li>
                  <code>Xp = Xs (1 + 1/Q²)</code>
                </li>
                <li>
                  Dla bardzo dobrego elementu (Q duże) szeregowa i równoległa
                  reaktancja są praktycznie równe.
                </li>
                <li>
                  Dla stratnego elementu (Q małe) różnice są spore i ślepe
                  użycie złego modelu daje błąd kilkudziesięciu procent.
                </li>
              </ul>
              <h3>Jak czytać wykres Bode</h3>
              <p>
                Daleko od rezonansu kondensator opada z nachyleniem 20 dB na
                dekadę, faza siedzi w okolicy minus dziewięćdziesięciu stopni.
                Cewka rośnie z tym samym nachyleniem ale z dodatnią fazą.
                Rezystor ma poziomą charakterystykę i fazę zerową. Skok fazy w
                okolicy SRF to właśnie moment przejścia między dwoma
                charakterami impedancji.
              </p>
            </Prose>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ResistorInputs({
  value,
  onChange,
}: {
  value: RealResistor;
  onChange: (v: RealResistor) => void;
}) {
  return (
    <>
      <NumberField
        label="R nominalne"
        value={value.r}
        unit="Ω"
        onValueChange={(r) => {
          onChange({ ...value, r });
        }}
      />
      <NumberField
        label="L pasożytnicze (doprowadzenia)"
        value={value.l}
        unit="H"
        step={1e-9}
        onValueChange={(l) => {
          onChange({ ...value, l });
        }}
        hint="Typowo kilka nH dla SMD."
      />
      <NumberField
        label="C pasożytnicze (równolegle)"
        value={value.c}
        unit="F"
        step={1e-13}
        onValueChange={(c) => {
          onChange({ ...value, c });
        }}
        hint="Typowo ułamek pF."
      />
    </>
  );
}

function InductorInputs({
  value,
  onChange,
}: {
  value: RealInductor;
  onChange: (v: RealInductor) => void;
}) {
  return (
    <>
      <NumberField
        label="L nominalne"
        value={value.l}
        unit="H"
        step={1e-6}
        onValueChange={(l) => {
          onChange({ ...value, l });
        }}
      />
      <NumberField
        label="Rs (rezystancja uzwojenia)"
        value={value.rs}
        unit="Ω"
        step={0.01}
        onValueChange={(rs) => {
          onChange({ ...value, rs });
        }}
      />
      <NumberField
        label="Cp (między zwojami)"
        value={value.c}
        unit="F"
        step={1e-12}
        onValueChange={(c) => {
          onChange({ ...value, c });
        }}
        hint="Decyduje o SRF cewki."
      />
    </>
  );
}

function CapacitorInputs({
  value,
  onChange,
}: {
  value: RealCapacitor;
  onChange: (v: RealCapacitor) => void;
}) {
  return (
    <>
      <NumberField
        label="C nominalne"
        value={value.c}
        unit="F"
        step={1e-9}
        onValueChange={(c) => {
          onChange({ ...value, c });
        }}
      />
      <NumberField
        label="ESR (zastępcza rezystancja szeregowa)"
        value={value.esr}
        unit="Ω"
        step={0.001}
        onValueChange={(esr) => {
          onChange({ ...value, esr });
        }}
      />
      <NumberField
        label="ESL (zastępcza indukcyjność szeregowa)"
        value={value.esl}
        unit="H"
        step={1e-10}
        onValueChange={(esl) => {
          onChange({ ...value, esl });
        }}
        hint="Decyduje o SRF kondensatora."
      />
    </>
  );
}

function ModelBlock({
  title,
  rows,
}: {
  title: string;
  rows: readonly (readonly [string, string])[];
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-ink-900/40 p-4">
      <div className="eyebrow mb-3">{title}</div>
      <ul className="space-y-2">
        {rows.map(([k, v]) => (
          <li key={k} className="flex items-center justify-between font-mono text-sm">
            <span className="text-ink-400">{k}</span>
            <span className="text-ink-50">{v}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function pickElement(state: State): RealElement {
  switch (state.kind) {
    case "resistor":
      return state.resistor;
    case "inductor":
      return state.inductor;
    case "capacitor":
      return state.capacitor;
  }
}
