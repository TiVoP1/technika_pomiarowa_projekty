import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { NumberField, SelectField, SliderField } from "@/components/ui/Field";
import { Prose } from "@/components/ui/Prose";
import { Stat } from "@/components/ui/Stat";
import { formatSI } from "@/lib/format";
import {
  WAVEFORM_LABEL,
  type WaveformKind,
  type WaveformSpec,
} from "@/lib/signals";
import { ScopeScreen } from "@/projects/project-vii/ScopeScreen";
import {
  acquire,
  computeStats,
  type ScopeChannel,
  type TriggerSlope,
  type TriggerSettings,
} from "@/projects/project-vii/scope";

const T_DIV_OPTIONS: readonly { label: string; value: number }[] = [
  { label: "1 ms", value: 1e-3 },
  { label: "500 µs", value: 500e-6 },
  { label: "200 µs", value: 200e-6 },
  { label: "100 µs", value: 100e-6 },
  { label: "50 µs", value: 50e-6 },
  { label: "20 µs", value: 20e-6 },
  { label: "10 µs", value: 10e-6 },
  { label: "5 µs", value: 5e-6 },
  { label: "2 µs", value: 2e-6 },
];

const V_DIV_OPTIONS: readonly { label: string; value: number }[] = [
  { label: "5 V", value: 5 },
  { label: "2 V", value: 2 },
  { label: "1 V", value: 1 },
  { label: "500 mV", value: 0.5 },
  { label: "200 mV", value: 0.2 },
  { label: "100 mV", value: 0.1 },
  { label: "50 mV", value: 0.05 },
];

export function ProjectVIIPage() {
  const [chA, setChA] = useState<ScopeChannel>({
    id: "A",
    enabled: true,
    vDiv: 1,
    offset: 0,
    color: "#7aa2ff",
    noise: 0.005,
    spec: {
      kind: "sine",
      frequency: 1000,
      amplitude: 2,
      phase: 0,
      dcOffset: 0,
      duty: 0.5,
    },
  });
  const [chB, setChB] = useState<ScopeChannel>({
    id: "B",
    enabled: true,
    vDiv: 1,
    offset: -2.5,
    color: "#4fd1a4",
    noise: 0.005,
    spec: {
      kind: "square",
      frequency: 500,
      amplitude: 1.5,
      phase: 0,
      dcOffset: 0,
      duty: 0.5,
    },
  });
  const [tDiv, setTDiv] = useState(200e-6);
  const [running, setRunning] = useState(true);
  const [trigger, setTrigger] = useState<TriggerSettings>({
    source: "A",
    level: 0,
    slope: "rising",
    auto: true,
  });

  const channels = useMemo(() => [chA, chB] as const, [chA, chB]);
  const sampleRate = useMemo(() => Math.max(50e3, 50 / tDiv), [tDiv]);
  const frameStartRef = useRef(0);
  const [frame, setFrame] = useState(() =>
    acquire(
      { tDiv, sampleRate, channels: [chA, chB], trigger },
      0,
    ),
  );

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const tick = () => {
      frameStartRef.current += 1 / 60;
      const f = acquire(
        { tDiv, sampleRate, channels: [chA, chB], trigger },
        frameStartRef.current,
      );
      setFrame(f);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
    };
  }, [running, tDiv, sampleRate, chA, chB, trigger]);

  const acquireSingle = useCallback(() => {
    frameStartRef.current += tDiv * 12;
    const f = acquire(
      { tDiv, sampleRate, channels: [chA, chB], trigger },
      frameStartRef.current,
    );
    setFrame(f);
  }, [tDiv, sampleRate, chA, chB, trigger]);

  const statsA = useMemo(
    () =>
      chA.enabled && frame.data[0]
        ? computeStats(frame.data[0], frame.duration)
        : null,
    [frame, chA.enabled],
  );
  const statsB = useMemo(
    () =>
      chB.enabled && frame.data[1]
        ? computeStats(frame.data[1], frame.duration)
        : null,
    [frame, chB.enabled],
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Projekt VII"
        title="Wirtualny oscyloskop cyfrowy"
        lead="Wszystko co trzeba żeby pokazać sygnał na ekranie. Dwa kanały, wybierana podstawa czasu, ustawiane czułości, wyzwalanie zboczem oraz automatyczne pomiary amplitudy, częstotliwości i wartości skutecznej."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card padded={false} className="overflow-hidden">
            <div className="p-1">
              <ScopeScreen
                frame={frame}
                channels={channels}
                trigger={trigger}
                tDiv={tDiv}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 bg-ink-900/40 px-4 py-3">
              <div className="flex items-center gap-2">
                <Button
                  variant={running ? "danger" : "primary"}
                  onClick={() => {
                    setRunning((r) => !r);
                  }}
                >
                  {running ? "Stop" : "Run"}
                </Button>
                <Button variant="secondary" onClick={acquireSingle} disabled={running}>
                  Single
                </Button>
              </div>
              <div className="flex items-center gap-3 text-xs text-ink-400">
                <span className="font-mono">
                  fs = {formatSI(sampleRate, "Sa/s")}
                </span>
                <span className="font-mono">
                  N = {frame.samplesPerCh}
                </span>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <ChannelStats title="Kanał A" color="#7aa2ff" stats={statsA} />
            <ChannelStats title="Kanał B" color="#4fd1a4" stats={statsB} />
          </div>

          <Card title="Jak czytać ekran" eyebrow="Pomoc">
            <Prose>
              <p>
                Ekran jest podzielony na dziesięć pionowych i osiem poziomych
                podziałek. Wartości <strong>V/dz</strong> oraz
                <strong> czas/dz</strong> mówią ile wolt lub sekund przypada
                na jedną podziałkę. Przy V/dz = 1 V sygnał o amplitudzie
                szczytowej 2 V zajmie cztery podziałki od góry do dołu.
              </p>
              <p>
                Wyzwalanie zatrzymuje obraz na ekranie. Bez niego sygnał
                pływałby w lewo i w prawo. Oscyloskop czeka aż napięcie w
                wybranym kanale przekroczy zadany poziom w wybranym kierunku
                i dopiero wtedy zaczyna rysować. W trybie auto, jeśli
                wyzwolenie się nie znajdzie, ekran rysuje się i tak.
              </p>
              <p>
                Wartość średnia, międzyszczytowa i skuteczna są wyliczane z
                całego okna na ekranie. Częstotliwość jest mierzona przez
                wykrywanie przejść przez zero. Im więcej okresów w oknie tym
                pomiar dokładniejszy.
              </p>
            </Prose>
          </Card>
        </div>

        <div className="space-y-4">
          <ChannelPanel channel={chA} onChange={setChA} title="Kanał A" />
          <ChannelPanel channel={chB} onChange={setChB} title="Kanał B" />

          <Card title="Podstawa czasu" eyebrow="Time base">
            <SelectField
              label="Czas / dz"
              value={tDiv.toString()}
              options={T_DIV_OPTIONS.map((o) => ({
                value: o.value.toString(),
                label: o.label,
              }))}
              onValueChange={(v) => {
                setTDiv(Number(v));
              }}
            />
          </Card>

        </div>
      </div>
    </div>
  );
}

function ChannelPanel({
  channel,
  onChange,
  title,
}: {
  channel: ScopeChannel;
  onChange: (c: ScopeChannel) => void;
  title: string;
}) {
  const updateSpec = (patch: Partial<WaveformSpec>): void => {
    onChange({ ...channel, spec: { ...channel.spec, ...patch } });
  };
  return (
    <Card
      title={title}
      eyebrow={
        <span className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: channel.color }}
          />
          {channel.enabled ? "ON" : "OFF"}
        </span>
      }
      action={
        <Button
          size="sm"
          variant={channel.enabled ? "secondary" : "ghost"}
          onClick={() => {
            onChange({ ...channel, enabled: !channel.enabled });
          }}
        >
          {channel.enabled ? "Wyłącz" : "Włącz"}
        </Button>
      }
    >
      <div className="space-y-3">
        <SelectField
          label="Kształt sygnału"
          value={channel.spec.kind}
          options={(["sine", "square", "triangle", "sawtooth", "pulse"] as const).map(
            (k) => ({ value: k, label: WAVEFORM_LABEL[k] }),
          )}
          onValueChange={(v: WaveformKind) => {
            updateSpec({ kind: v });
          }}
        />
        <NumberField
          label="Częstotliwość"
          value={channel.spec.frequency}
          unit="Hz"
          step={10}
          onValueChange={(frequency) => {
            updateSpec({ frequency });
          }}
        />
        <NumberField
          label="Amplituda (peak)"
          value={channel.spec.amplitude}
          unit="V"
          step={0.1}
          onValueChange={(amplitude) => {
            updateSpec({ amplitude });
          }}
        />
        <NumberField
          label="DC offset"
          value={channel.spec.dcOffset}
          unit="V"
          step={0.1}
          onValueChange={(dcOffset) => {
            updateSpec({ dcOffset });
          }}
        />
        {channel.spec.kind === "pulse" && (
          <SliderField
            label="Wypełnienie"
            value={channel.spec.duty}
            min={0.05}
            max={0.95}
            step={0.01}
            format={(n) => `${(n * 100).toFixed(0)}%`}
            onValueChange={(duty) => {
              updateSpec({ duty });
            }}
          />
        )}
        <SelectField
          label="V / dz"
          value={channel.vDiv.toString()}
          options={V_DIV_OPTIONS.map((o) => ({
            value: o.value.toString(),
            label: o.label,
          }))}
          onValueChange={(v) => {
            onChange({ ...channel, vDiv: Number(v) });
          }}
        />
        <SliderField
          label="Position"
          value={channel.offset}
          min={-channel.vDiv * 4}
          max={channel.vDiv * 4}
          step={channel.vDiv / 10}
          unit="V"
          onValueChange={(offset) => {
            onChange({ ...channel, offset });
          }}
        />
      </div>
    </Card>
  );
}

function ChannelStats({
  title,
  color,
  stats,
}: {
  title: string;
  color: string;
  stats: ReturnType<typeof computeStats> | null;
}) {
  if (!stats) {
    return (
      <Card
        title={title}
        eyebrow={
          <span className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: color }}
            />
            Wyłączony
          </span>
        }
      >
        <p className="text-sm text-ink-400">Włącz kanał aby zobaczyć pomiary.</p>
      </Card>
    );
  }
  return (
    <Card
      title={title}
      eyebrow={
        <span className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: color }}
          />
          Pomiary
        </span>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Vpp" value={`${stats.vPp.toFixed(3)} V`} />
        <Stat label="Vmean" value={`${stats.vMean.toFixed(3)} V`} />
        <Stat label="Vrms" value={`${stats.vRms.toFixed(3)} V`} emphasis="accent" />
        <Stat
          label="Częstotliwość"
          value={stats.frequency !== null ? formatSI(stats.frequency, "Hz") : "—"}
          hint={stats.period !== null ? `T = ${formatSI(stats.period, "s")}` : undefined}
        />
      </div>
    </Card>
  );
}
