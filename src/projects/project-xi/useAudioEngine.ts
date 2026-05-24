import { useCallback, useEffect, useRef, useState } from "react";

export type SourceMode = "off" | "microphone" | "internal";

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
  setFftSize: (size: number) => void;
}

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

  const stop = useCallback(async () => {
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
        error: err instanceof Error ? err.message : "Nie udalo sie uruchomic audio",
      }));
    }
  }, [stop]);

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

  return { state, start, stop, setFftSize };
}
