"use client";

import { useCallback, useRef, useState } from "react";

export type AudioRecorderStatus =
  | "idle"
  | "recording"
  | "stopped"
  | "permission-denied"
  | "unsupported"
  | "error";

interface UseAudioRecorderResult {
  status: AudioRecorderStatus;
  start: () => void;
  stop: () => void;
  reset: () => void;
  audioBlob: Blob | null;
  mimeType: string | null;
  errorMessage: string | null;
}

const PREFERRED_MIME_TYPE = "audio/webm;codecs=opus";
const FALLBACK_MIME_TYPE = "audio/mp4";

function resolveSupportedMimeType(): string | null {
  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) return null;
  if (MediaRecorder.isTypeSupported(PREFERRED_MIME_TYPE)) return PREFERRED_MIME_TYPE;
  if (MediaRecorder.isTypeSupported(FALLBACK_MIME_TYPE)) return FALLBACK_MIME_TYPE;
  return null;
}

/**
 * Microphone recorder hook backed by MediaRecorder. Re-recordable by design: after
 * stop(), calling start() again (or reset() then start()) begins a brand new take,
 * discarding the previous blob. The student may record/preview/re-record freely
 * until the attempt is submitted — there is no one-shot lock at this layer.
 */
export function useAudioRecorder(): UseAudioRecorderResult {
  const [status, setStatus] = useState<AudioRecorderStatus>("idle");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const isStartingRef = useRef(false);
  const isRecordingRef = useRef(false);
  const stopRequestedRef = useRef(false);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(() => {
    if (isStartingRef.current || isRecordingRef.current) return;

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
      return;
    }

    const resolvedMimeType = resolveSupportedMimeType();
    if (!resolvedMimeType || typeof MediaRecorder === "undefined") {
      setStatus("unsupported");
      return;
    }

    stopRequestedRef.current = false;
    isStartingRef.current = true;

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        // stop()/reset() may have raced ahead while the permission prompt was pending.
        if (stopRequestedRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          isStartingRef.current = false;
          return;
        }

        streamRef.current = stream;
        chunksRef.current = [];

        const recorder = new MediaRecorder(stream, { mimeType: resolvedMimeType });
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event: BlobEvent) => {
          if (event.data.size > 0) chunksRef.current.push(event.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: resolvedMimeType });
          setAudioBlob(blob);
          setMimeType(resolvedMimeType);
          setStatus("stopped");
          isRecordingRef.current = false;
          cleanupStream();
        };

        recorder.onerror = () => {
          setStatus("error");
          setErrorMessage("Une erreur est survenue pendant l'enregistrement audio.");
          isRecordingRef.current = false;
          cleanupStream();
        };

        recorder.start();
        setAudioBlob(null);
        setMimeType(resolvedMimeType);
        setStatus("recording");
        isRecordingRef.current = true;
        isStartingRef.current = false;
      })
      .catch(() => {
        isStartingRef.current = false;
        setStatus("permission-denied");
        setErrorMessage(
          "Accès au microphone refusé. Veuillez autoriser l'accès au microphone dans les paramètres de votre navigateur pour continuer."
        );
      });
  }, [cleanupStream]);

  const stop = useCallback(() => {
    stopRequestedRef.current = true;

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    } else {
      // start() never produced an active recorder (e.g. still awaiting the
      // permission prompt) — nothing to stop, just release any open stream.
      cleanupStream();
    }
  }, [cleanupStream]);

  const reset = useCallback(() => {
    stopRequestedRef.current = true;
    isRecordingRef.current = false;
    isStartingRef.current = false;
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    cleanupStream();
    setAudioBlob(null);
    setMimeType(null);
    setErrorMessage(null);
    setStatus("idle");
  }, [cleanupStream]);

  return { status, start, stop, reset, audioBlob, mimeType, errorMessage };
}
