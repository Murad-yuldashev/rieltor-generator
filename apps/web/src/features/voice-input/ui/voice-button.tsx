import { cn } from '@/shared/lib/cn';
import { Icon } from '@/shared/ui/icon';
import { useSpeechRecognition } from '../model/use-speech-recognition';

interface Props {
  onResult: (text: string) => void;
  className?: string;
}

/**
 * Dictation trigger for a text field, meant to sit inside/beside an
 * `<input>`/`<textarea>`. Renders nothing when the browser has no
 * `SpeechRecognition` global (Firefox, most headless test runners) — callers
 * don't need their own feature check, an absent button is always safe.
 */
export function VoiceButton({ onResult, className }: Props) {
  const { supported, listening, start, stop } = useSpeechRecognition(onResult);

  if (!supported) return null;

  return (
    <button
      type="button"
      aria-pressed={listening}
      aria-label="Ovozli kiritish"
      onClick={() => (listening ? stop() : start())}
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors',
        listening
          ? 'animate-pulse bg-brand-rose/15 text-brand-rose'
          : 'text-ink-3 hover:bg-surface hover:text-accent',
        className,
      )}
    >
      <Icon name="mic" className="h-[17px] w-[17px]" />
    </button>
  );
}
