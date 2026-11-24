import { useEffect, useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';

// Microphone for the situation box and Quick Help (SPEC 10.6a). Uses the Web Speech API where
// the browser has it and renders nothing otherwise. In Chrome, speech is processed by Google's
// servers; /about-demo says so (spec-issues G11).

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult:
    | ((e: {
        results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
      }) => void)
    | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

type Ctor = new () => SpeechRecognitionLike;

function getRecognition(): Ctor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: Ctor; webkitSpeechRecognition?: Ctor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function VoiceInputButton({ onText }: { onText: (text: string) => void }) {
  const [listening, setListening] = useState(false);
  const rec = useRef<SpeechRecognitionLike | null>(null);
  const Recognition = getRecognition();

  useEffect(() => () => rec.current?.stop(), []);
  if (!Recognition) return null;

  const toggle = () => {
    if (listening) {
      rec.current?.stop();
      return;
    }
    const r = new Recognition();
    r.lang = 'en-AU';
    r.continuous = true;
    r.interimResults = false;
    r.onresult = (e) => {
      const last = e.results[e.results.length - 1];
      if (last?.isFinal && last[0]) onText(last[0].transcript.trim());
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    rec.current = r;
    r.start();
    setListening(true);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={listening}
      className="inline-flex h-tap w-tap items-center justify-center rounded border-2 border-plum-500 bg-surface text-plum-700 hover:bg-plum-100"
    >
      {listening ? (
        <Square size={20} strokeWidth={1.5} aria-hidden="true" />
      ) : (
        <Mic size={20} strokeWidth={1.5} aria-hidden="true" />
      )}
      <span className="sr-only">{listening ? 'Stop listening' : 'Speak instead of typing'}</span>
    </button>
  );
}
