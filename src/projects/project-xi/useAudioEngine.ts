import { useCallback, useEffect, useRef, useState } from "react";

export type SourceMode = "off" | "microphone" | "internal";
export type Wave = "sine" | "square" | "triangle" | "sawtooth";

export interface GeneratorSettings {
  enabled: boolean;
  wave: Wave;
  frequency: number;
  amplitude: number; // 0..1
}

export interface AudioEngineState {
  context: AudioContext | null;
  analyser: AnalyserNode | null;
  sampleRate: number;
  sourceMode: SourceMode;
  error: string | null;
}

export interface UseAudioEngine {
  state: AudioEngineState;
  start: (mode: SourceMode) => Promise<void>;
  stop: () => Promise<void>;
  setGenerator: (gen: GeneratorSettings) => void;
  setFftSize: (size: number) => void;
}

/**
 * Web Audio engine wrapper. Routes either a microphone input or an internal
 * oscillator into a single AnalyserNode. The generator is always wired but
 * its output goes to destination only when enabled.
 */
export function useAudioEngine(): UseAudioEngine {
  const [state, setState] = useState<AudioEngineState>({
    context: null,
    analyser: null,
    sampleRate: 0,
    sourceMode: "off",
    error: null,
  });
  const contextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const outGainRef = useRef<GainNode | null>(null);

  const stop = useCallback(async () => {
    if (oscRef.current) {
      try {
        oscRef.current.stop();
      } catch {
        // already stopped
      }
      oscRef.current.disconnect();
      oscRef.current = null;
    }
    if (micRef.current) {
      micRef.current.disconnect();
      micRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => {
        t.stop();
      });
      micStreamRef.current = null;
    }
    if (gainRef.current) {
      gainRef.current.disconnect();
      gainRef.current = null;
    }
    if (outGainRef.current) {
      outGainRef.current.disconnect();
      outGainRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    if (contextRef.current) {
      await contextRef.current.close();
      contextRef.current = null;
    }
    setState({
      context: null,
      analyser: null,
      sampleRate: 0,
      sourceMode: "off",
      error: null,
    });
  }, []);

  const start = useCallback(async (mode: SourceMode) => {
    await stop();
    if (mode === "off") return;
    try {
      const Ctor = window.AudioContext;
      const ctx = new Ctor();
      contextRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0.4;
      analyserRef.current = analyser;

      if (mode === "microphone") {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        });
        micStreamRef.current = stream;
        const src = ctx.createMediaStreamSource(stream);
        src.connect(analyser);
        micRef.current = src;
      } else {
        // internal: silent path, the user wires the generator separately
      }

      setState({
        context: ctx,
        analyser,
        sampleRate: ctx.sampleRate,
        sourceMode: mode,
        error: null,
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        error: err instanceof Error ? err.message : "Nie udało się uruchomić audio",
      }));
    }
  }, [stop]);

  const setGenerator = useCallback((gen: GeneratorSettings) => {
    const ctx = contextRef.current;
    const analyser = analyserRef.current;
    if (!ctx || !analyser) return;

    if (!gen.enabled) {
      if (oscRef.current) {
        try {
          oscRef.current.stop();
        } catch {
          // ignore
        }
        oscRef.current.disconnect();
        oscRef.current = null;
      }
      if (gainRef.current) {
        gainRef.current.disconnect();
        gainRef.current = null;
      }
      if (outGainRef.current) {
        outGainRef.current.disconnect();
        outGainRef.current = null;
      }
      return;
    }

    if (!oscRef.current) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const outGain = ctx.createGain();
      gain.gain.value = gen.amplitude;
      outGain.gain.value = gen.amplitude;
      osc.type = gen.wave;
      osc.frequency.value = gen.frequency;
      // analyser path
      osc.connect(gain).connect(analyser);
      // speakers path
      osc.connect(outGain).connect(ctx.destination);
      osc.start();
      oscRef.current = osc;
      gainRef.current = gain;
      outGainRef.current = outGain;
    } else {
      oscRef.current.type = gen.wave;
      oscRef.current.frequency.setTargetAtTime(gen.frequency, ctx.currentTime, 0.01);
      if (gainRef.current) {
        gainRef.current.gain.setTargetAtTime(gen.amplitude, ctx.currentTime, 0.01);
      }
      if (outGainRef.current) {
        outGainRef.current.gain.setTargetAtTime(gen.amplitude, ctx.currentTime, 0.01);
      }
    }
  }, []);

  const setFftSize = useCallback((size: number) => {
    if (analyserRef.current) {
      analyserRef.current.fftSize = size;
    }
  }, []);

  useEffect(() => {
    return () => {
      void stop();
    };
  }, [stop]);

  return { state, start, stop, setGenerator, setFftSize };
}

