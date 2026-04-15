import { useState, useCallback, useRef } from 'react';
import { habitAPI } from '../api';
import toast from 'react-hot-toast';

const TRANSCRIPT_TTL = 4000; // ms before transcript disappears

// Fuzzy match: finds the habit whose name best matches the spoken text
function findHabit(habits, spokenName) {
  const q = spokenName.toLowerCase().trim();
  // 1. Exact match
  let match = habits.find(h => h.name.toLowerCase() === q);
  if (match) return match;
  // 2. Contains match
  match = habits.find(h => h.name.toLowerCase().includes(q));
  if (match) return match;
  // 3. All words of the spoken name appear in the habit name
  const words = q.split(/\s+/).filter(w => w.length > 2);
  if (words.length > 0) {
    match = habits.find(h => words.every(w => h.name.toLowerCase().includes(w)));
    if (match) return match;
  }
  // 4. Any significant word matches
  match = habits.find(h => words.some(w => h.name.toLowerCase().includes(w)));
  return match || null;
}

export function VoiceMicButton({ habits, onRefresh, onShowStats }) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState(''); // 'success' | 'error' | ''
  const [supported] = useState(
    () => 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  );
  const transcriptTimer = useRef(null);

  const showTranscript = (text, statusType) => {
    setTranscript(text);
    setStatus(statusType);
    clearTimeout(transcriptTimer.current);
    transcriptTimer.current = setTimeout(() => {
      setTranscript('');
      setStatus('');
    }, TRANSCRIPT_TTL);
  };

  const processCommand = useCallback(async (text) => {
    const lower = text.toLowerCase().trim();

    // ── 1. COMPLETE [habit name] ──────────────────────────
    const completeMatch = lower.match(/^(?:complete|mark|check|done)[:\s]+(.+)/);
    if (completeMatch) {
      const spoken = completeMatch[1].trim();
      const habit = findHabit(habits, spoken);
      if (habit) {
        try {
          await habitAPI.complete(habit._id);
          toast.success(`✅ "${habit.name}" marked complete!`);
          showTranscript(`Completed: ${habit.name}`, 'success');
          if (onRefresh) onRefresh();
        } catch (err) {
          const msg = err.response?.data?.error || 'Could not complete habit';
          toast.error(msg);
          showTranscript(msg, 'error');
        }
      } else {
        toast.error(`Habit not found: "${spoken}"`);
        showTranscript(`No match for: "${spoken}"`, 'error');
      }
      return;
    }

    // ── 2. ADD HABIT [name] ───────────────────────────────
    const addMatch = lower.match(/^(?:add|create|new) (?:habit[:\s]+|a habit[:\s]+)?(.+)/);
    if (addMatch) {
      const spokenName = addMatch[1]
        .replace(/^(called|named|titled)\s+/i, '')
        .trim();
      const capitalized = spokenName.charAt(0).toUpperCase() + spokenName.slice(1);
      try {
        await habitAPI.create({ name: capitalized, category: 'other', frequency: 'daily' });
        toast.success(`🌱 Habit "${capitalized}" created!`);
        showTranscript(`Added: ${capitalized}`, 'success');
        if (onRefresh) onRefresh();
      } catch (err) {
        toast.error('Could not create habit');
        showTranscript('Failed to add habit', 'error');
      }
      return;
    }

    // ── 3. SHOW STATS / ACHIEVEMENTS ─────────────────────
    if (/(?:show|open|my)\s+(?:stats|badges|achievements|progress)/.test(lower)) {
      if (onShowStats) onShowStats();
      showTranscript('Opening achievements…', 'success');
      return;
    }

    // ── Unrecognised ──────────────────────────────────────
    showTranscript(`"${text}"`, 'error');
    toast(`Command not recognised. Try: "complete [habit]", "add [habit]"`, { icon: '🎤' });
  }, [habits, onRefresh, onShowStats]);

  const startListening = useCallback(() => {
    if (!supported || listening) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;
    recognition.continuous = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = (e) => {
      setListening(false);
      if (e.error !== 'no-speech') toast.error(`Mic error: ${e.error}`);
    };
    recognition.onresult = (e) => {
      // Try all alternatives for best match
      const best = Array.from(e.results[0]).map(r => r.transcript.trim()).join(' | ');
      const text = e.results[0][0].transcript.trim();
      setTranscript(`🎤 "${text}"`);
      processCommand(text);
    };

    recognition.start();
  }, [supported, listening, processCommand]);

  if (!supported) return null;

  const statusColor = status === 'success'
    ? 'var(--accent-1)'
    : status === 'error'
    ? '#ef4444'
    : 'var(--text-primary)';

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {/* Transcript bubble */}
      {transcript && (
        <div
          className="glass-panel px-4 py-2.5 animate-fade-in-up"
          style={{
            maxWidth: '260px',
            wordBreak: 'break-word',
            whiteSpace: 'normal',
            lineHeight: '1.4',
            fontSize: '0.8rem',
            color: statusColor,
            borderColor: status === 'success'
              ? 'rgba(139,92,246,0.4)'
              : status === 'error'
              ? 'rgba(239,68,68,0.4)'
              : 'var(--glass-border)',
          }}
        >
          {transcript}
        </div>
      )}

      {/* Listening hint */}
      {listening && (
        <div className="glass-panel px-3 py-1.5" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
          Say: "complete [habit]" or "add [habit]"
        </div>
      )}

      {/* Mic button */}
      <button
        onClick={startListening}
        disabled={listening}
        className={`w-14 h-14 rounded-full shadow-xl transition-all flex items-center justify-center text-xl ${
          listening
            ? 'bg-red-500 shadow-red-500/40 scale-110 animate-pulse cursor-default'
            : 'glass-button shadow-purple-500/30 hover:scale-105'
        }`}
        title={listening ? 'Listening…' : 'Voice Command (click to speak)'}
        aria-label="Voice command"
      >
        {listening ? '🔴' : '🎤'}
      </button>
    </div>
  );
}
