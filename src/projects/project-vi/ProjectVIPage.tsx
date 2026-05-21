import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { NumberField, SelectField, SliderField } from "@/components/ui/Field";
import { Stat } from "@/components/ui/Stat";
import { Prose } from "@/components/ui/Prose";
import { formatSI } from "@/lib/format";
import {
  WAVEFORM_LABEL,
  type WaveformKind,
  type WaveformSpec,
} from "@/lib/signals";
import { SarScene } from "@/projects/project-vi/SarScene";
import { QuantPlot } from "@/projects/project-vi/QuantPlot";
import {
  codeToBits,
  idealSNRdB,
  lsb,
  sarConvert,
} from "@/projects/project-vi/sar";

export function ProjectVIPage() {
  const [vref, setVref] = useState(5);
  const [bits, setBits] = useState(8);
  const [inputVoltage, setInputVoltage] = useState(3.27);
  const [sampleRate, setSampleRate] = useState(2000);
  const [waveform, setWaveform] = useState<WaveformKind>("sine");
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(-1);

  const result = useMemo(
    () => sarConvert(inputVoltage, vref, bits),
    [inputVoltage, vref, bits],
  );

  // Animate the SAR step counter
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let lastTick = performance.now();
    let s = -1;
    const tick = (now: number) => {
      if (now - lastTick > 700) {
        s = s + 1;
        if (s >= bits) {
          setStep(bits - 1);
          setRunning(false);
          return;
        }
        setStep(s);
        lastTick = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
    };
  }, [running, bits]);

  const startConversion = useCallback(() => {
    setStep(-1);
    setRunning(true);
  }, []);
  const showFinal = useCallback(() => {
    setRunning(false);
    setStep(bits - 1);
  }, [bits]);

  const spec: WaveformSpec = {
    kind: waveform,
    frequency: 50,
    amplitude: vref * 0.45,
    phase: 0,
    dcOffset: 0,
    duty: 0.5,
  };

  const snr = idealSNRdB(bits);
  const lsbV = lsb(vref, bits);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Projekt VI"
        title="Symulator przetwornika A/C z sukcesywną aproksymacją"
        lead="Najczęściej stosowana topologia przetwornika analogowo cyfrowego. Bity są ustalane od najstarszego do najmłodszego przez porównywanie wyjścia wewnętrznego DAC z wejściem. Tutaj widać każdy krok pojedynczo."
      />

      <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
        <Card title="Parametry przetwornika" eyebrow="Ustawienia">
          <div className="space-y-4">
            <SliderField
              label="Rozdzielczość"
              value={bits}
              min={3}
              max={12}
              step={1}
              unit="bit"
              onValueChange={(v) => {
                setBits(Math.round(v));
                setStep(-1);
              }}
            />
            <NumberField
              label="Napięcie odniesienia Vref"
              value={vref}
              unit="V"
              step={0.1}
              onValueChange={(v) => {
                setVref(Math.max(0.1, v));
              }}
            />
            <NumberField
              label="Napięcie wejściowe (jedna konwersja)"
              value={inputVoltage}
              unit="V"
              step={0.01}
              min={0}
              max={vref}
              onValueChange={(v) => {
                setInputVoltage(Math.max(0, Math.min(vref, v)));
                setStep(-1);
              }}
            />
            <div className="flex gap-2">
              <Button onClick={startConversion} variant="primary" fullWidth>
                Krok po kroku
              </Button>
              <Button onClick={showFinal} variant="secondary">
                Wynik
              </Button>
            </div>

            <div className="border-t border-white/5 pt-4">
              <div className="eyebrow mb-2">Sygnał testowy</div>
              <div className="space-y-3">
                <SelectField
                  label="Kształt"
                  value={waveform}
                  onValueChange={setWaveform}
                  options={(["sine", "triangle", "sawtooth", "square"] as const).map(
                    (k) => ({ value: k, label: WAVEFORM_LABEL[k] }),
                  )}
                />
                <SliderField
                  label="Częstotliwość próbkowania"
                  value={sampleRate}
                  min={100}
                  max={20_000}
                  step={50}
                  unit="Hz"
                  format={(n) => formatSI(n).trim()}
                  onValueChange={setSampleRate}
                />
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card
            title="Konwersja w czasie rzeczywistym"
            eyebrow={`Krok ${Math.max(0, step) + 1}/${bits}`}
            description="Trzy kolumny to wejście, aktualnie próbowany poziom DAC oraz aktualny poziom wyjściowy DAC. Z tyłu sześciany pokazują rejestr SAR, od dołu LSB."
          >
            <div className="h-[420px] overflow-hidden rounded-xl border border-white/5 bg-ink-950">
              <SarScene
                vref={vref}
                bits={bits}
                inputVoltage={inputVoltage}
                result={result}
                currentStep={step}
              />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat
                label="Kod wyjściowy"
                value={result.code}
                hint={codeToBits(result.code, bits)}
                emphasis="accent"
              />
              <Stat
                label="Napięcie DAC"
                value={`${result.dacOut.toFixed(4)} V`}
                hint={`Vin = ${inputVoltage.toFixed(4)} V`}
              />
              <Stat
                label="Błąd"
                value={`${(result.error * 1000).toFixed(2)} mV`}
                emphasis={Math.abs(result.error) < lsbV / 2 + 1e-9 ? "ok" : "warn"}
                hint={`max ±${(lsbV / 2 * 1000).toFixed(2)} mV (½ LSB)`}
              />
              <Stat label="LSB" value={`${(lsbV * 1000).toFixed(2)} mV`} />
            </div>
          </Card>

          <Card
            title="Cały sygnał po przetworzeniu"
            eyebrow="Próbkowanie i kwantyzacja"
            description="Niebieska linia to ciągły sygnał z generatora. Żółte schody to wartość zapamiętywana co takt. Czerwona linia poniżej to chwilowy błąd kwantyzacji, mieści się w przedziale ±½ LSB."
          >
            <QuantPlot
              spec={spec}
              vref={vref}
              bits={bits}
              sampleRate={sampleRate}
              durationSec={0.04}
            />

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Stat
                label="Liczba poziomów"
                value={(1 << bits).toString()}
                hint={`= 2^${bits}`}
              />
              <Stat
                label="Idealne SNR (sinus FS)"
                value={`${snr.toFixed(2)} dB`}
                hint="6.02·N + 1.76"
                emphasis="accent"
              />
              <Stat
                label="Próbek na sekundę"
                value={formatSI(sampleRate, "Sa/s")}
              />
            </div>
          </Card>

          <Card title="Jak to działa" eyebrow="Wyjaśnienie">
            <Prose>
              <p>
                Przetwornik SAR działa jak gra w zgadywanie z połówkowymi
                podziałami. W pierwszym kroku zakładamy że bit MSB jest jedynką
                i sprawdzamy czy wewnętrzny DAC daje już za dużo. Jeśli wyjście
                DAC przekroczyło napięcie wejściowe, ten bit kasujemy. Jeśli
                nie, zostawiamy go i przechodzimy do następnego, mniej znaczącego.
              </p>
              <p>
                Po N krokach mamy pełne słowo kodowe. Konwersja jest szybka
                bo zawsze trwa dokładnie N taktów zegara. Wadą jest to że
                potrzebny jest stabilny układ próbkująco pamiętający, w
                przeciwnym razie sygnał zmieniłby się w trakcie zgadywania.
              </p>
              <h3>Skąd ten błąd ±½ LSB</h3>
              <p>
                Przetwornik nie zna napięć pomiędzy poziomami. Najlepsze co
                może zrobić to wybrać najbliższy poziom. Stąd maksymalny błąd
                statyczny to połowa odległości między poziomami, czyli
                <code> LSB/2 </code>. Dla 8 bitów i Vref = 5 V to około 9,8 mV.
                Dla 12 bitów już tylko 0,6 mV.
              </p>
              <h3>SNR i rozdzielczość</h3>
              <p>
                Dla idealnego przetwornika i pełnoskalowego sinusa stosunek
                sygnału do szumu kwantyzacji wynosi w przybliżeniu
                <code> 6,02·N + 1,76 dB </code>. Każdy dodatkowy bit to około
                6 dB poprawy. Stąd w praktyce zamiast „rozdzielczość 16 bit”
                producent podaje ENOB, czyli efektywną liczbę bitów, która
                uwzględnia też zakłócenia rzeczywiste a nie tylko kwantyzację.
              </p>
            </Prose>
          </Card>
        </div>
      </div>
    </div>
  );
}
