import {
  cleanTranscript,
  MAX_VOICE_SECONDS,
  trimSilence,
  VOICE_SAMPLE_RATE,
} from "@/lib/whiteboard/voice-question";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SpeechReply, SpeechRequest } from "./speech-worker";

export type VoiceStatus = "idle" | "starting" | "listening" | "finishing";

export interface SpokenWords {
  /** Why there are no words, when something failed. */
  errorCode: string | null;
  /** True when the tab was hidden, which turns the microphone off. */
  leftTab: boolean;
  transcript: string;
}

interface VoiceSession {
  id: number;
  leftTab: boolean;
  recorder: MediaRecorder | null;
  stream: MediaStream | null;
  timer?: number;
}

function errorName(error: unknown): string {
  return error instanceof Error ? error.name : "unknown";
}

function closeMicrophone(session: VoiceSession): void {
  window.clearInterval(session.timer);
  session.stream?.getTracks().forEach((track) => track.stop());
}

/** The recording as the one-channel samples the speech model expects. */
async function readSamples(recording: Blob): Promise<Float32Array> {
  const decoder = new OfflineAudioContext(1, 1, VOICE_SAMPLE_RATE);
  const audio = await decoder.decodeAudioData(await recording.arrayBuffer());
  return audio.getChannelData(0);
}

/**
 * Speech to text on this device, so it works the same in every browser and the
 * recording goes nowhere. The microphone is on only between `start` and `stop`;
 * hiding the tab, losing `enabled` or leaving the tool turns it off at once.
 */
export function useVoiceInput({
  enabled,
  onSpoken,
}: {
  enabled: boolean;
  onSpoken: (words: SpokenWords) => void;
}) {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [seconds, setSeconds] = useState(0);
  /** Percent of the speech model fetched so far; null once it is ready. */
  const [download, setDownload] = useState<number | null>(0);
  const sessionRef = useRef<VoiceSession | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const nextIdRef = useRef(1);
  const onSpokenRef = useRef(onSpoken);

  useEffect(() => {
    onSpokenRef.current = onSpoken;
  }, [onSpoken]);

  /** Ends the session once. Without words, whatever was said is dropped. */
  const settle = useCallback(
    (words: Omit<SpokenWords, "leftTab"> | null): void => {
      const session = sessionRef.current;
      if (!session) return;
      sessionRef.current = null;
      closeMicrophone(session);
      if (session.recorder) {
        session.recorder.onstop = null;
        if (session.recorder.state !== "inactive") session.recorder.stop();
      }
      setStatus("idle");
      if (words) onSpokenRef.current({ ...words, leftTab: session.leftTab });
    },
    [],
  );

  const fail = useCallback(
    (errorCode: string): void => settle({ errorCode, transcript: "" }),
    [settle],
  );

  const cancel = useCallback((): void => settle(null), [settle]);

  const stopWorker = useCallback((): void => {
    workerRef.current?.terminate();
    workerRef.current = null;
    setDownload(0);
  }, []);

  const getWorker = useCallback((): Worker => {
    if (workerRef.current) return workerRef.current;
    const worker = new Worker(new URL("./speech-worker.ts", import.meta.url), {
      type: "module",
    });
    // A failed download cannot be retried in the same worker.
    const handleLoadFailure = (): void => {
      stopWorker();
      fail("model");
    };
    worker.onerror = handleLoadFailure;
    worker.onmessage = ({ data }: MessageEvent<SpeechReply>) => {
      if (data.type === "progress") setDownload(data.percent);
      else if (data.type === "ready") setDownload(null);
      else if (data.type === "load-failed") handleLoadFailure();
      else if (data.id !== sessionRef.current?.id) return;
      else if (data.type === "failed") fail("transcribe");
      else {
        settle({ errorCode: null, transcript: cleanTranscript(data.text) });
      }
    };
    workerRef.current = worker;
    return worker;
  }, [fail, settle, stopWorker]);

  /** Turns the microphone off and keeps what was said. */
  const stop = useCallback((): void => {
    const recorder = sessionRef.current?.recorder;
    if (recorder?.state === "recording") recorder.stop();
  }, []);

  const record = useCallback(
    async (session: VoiceSession): Promise<void> => {
      const isCurrent = (): boolean => sessionRef.current === session;
      try {
        session.stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        if (!isCurrent()) return closeMicrophone(session);

        const recorder = new MediaRecorder(session.stream);
        const pieces: Blob[] = [];
        session.recorder = recorder;
        recorder.ondataavailable = ({ data }) => pieces.push(data);
        recorder.onstop = async () => {
          closeMicrophone(session);
          setStatus("finishing");
          try {
            const samples = trimSilence(
              await readSamples(new Blob(pieces, { type: recorder.mimeType })),
            );
            if (!isCurrent()) return;
            if (samples.length === 0) {
              settle({ errorCode: null, transcript: "" });
              return;
            }
            const request: SpeechRequest = {
              id: session.id,
              language: navigator.language,
              samples,
              type: "transcribe",
            };
            getWorker().postMessage(request);
          } catch (error) {
            if (isCurrent()) fail(errorName(error));
          }
        };
        recorder.start();
        setSeconds(0);
        setStatus("listening");
        let elapsed = 0;
        session.timer = window.setInterval(() => {
          elapsed += 1;
          setSeconds(elapsed);
          if (elapsed >= MAX_VOICE_SECONDS) stop();
        }, 1_000);
      } catch (error) {
        if (isCurrent()) fail(errorName(error));
        else closeMicrophone(session);
      }
    },
    [fail, getWorker, settle, stop],
  );

  const start = useCallback((): void => {
    if (!enabled || sessionRef.current) return;
    const session: VoiceSession = {
      id: nextIdRef.current++,
      leftTab: false,
      recorder: null,
      stream: null,
    };
    sessionRef.current = session;
    setStatus("starting");
    if (
      !navigator.mediaDevices ||
      typeof MediaRecorder === "undefined" ||
      typeof WebAssembly === "undefined"
    ) {
      fail("unsupported");
      return;
    }
    // Fetch the model while the teacher speaks.
    const request: SpeechRequest = { type: "load" };
    getWorker().postMessage(request);
    void record(session);
  }, [enabled, fail, getWorker, record]);

  useEffect(() => {
    if (!enabled) return;
    const handleVisibility = (): void => {
      const session = sessionRef.current;
      if (!document.hidden || !session) return;
      if (!session.recorder) cancel();
      else if (session.recorder.state === "recording") {
        session.leftTab = true;
        stop();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      cancel();
      stopWorker();
    };
  }, [cancel, enabled, stop, stopWorker]);

  return { cancel, download, seconds, start, status, stop };
}
