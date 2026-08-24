import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * The Web Speech API has no official TS lib entry (`lib.dom.d.ts` doesn't
 * carry it) and ships under a vendor-prefixed name in Chromium. This is the
 * narrow slice of the real interface the hook actually touches — kept local
 * so the rest of the file stays fully typed without pulling in a dependency
 * for a handful of fields.
 */
interface SpeechRecognitionResultLike {
  0: { transcript: string };
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

interface UseSpeechRecognitionResult {
  /** False in browsers without any `SpeechRecognition` global (Firefox, most headless runners). */
  supported: boolean;
  listening: boolean;
  start(): void;
  stop(): void;
}

/**
 * Thin wrapper around the (non-standard) Web Speech API, tuned for one-shot
 * dictation into a form field: `uz-UZ`, interim results off (only the final
 * transcript fires `onResult`), continuous off (recognition stops itself
 * after the first pause, no explicit `stop()` required from the caller).
 */
export function useSpeechRecognition(onResult: (text: string) => void): UseSpeechRecognitionResult {
  const [supported] = useState(() => getSpeechRecognitionCtor() !== null);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = 'uz-UZ';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) onResultRef.current(transcript);
    };
    recognition.onerror = () => {
      setListening(false);
    };
    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  return { supported, listening, start, stop };
}
