import { Check, Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { TIMER_PRESETS } from '../data/seedData';
import { Course, TimerPreset } from '../types/study';

interface FocusTimerCardProps {
  courses: Course[];
  selectedCourseId: string;
  onSelectCourse: (id: string) => void;
  preset: TimerPreset;
  onSelectPreset: (preset: TimerPreset) => void;
  secondsRemaining: number;
  isRunning: boolean;
  onToggleRun: () => void;
  onReset: () => void;
  onLogComplete: () => void;
  sessionLabel: string;
  onChangeLabel: (label: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export function FocusTimerCard({
  courses,
  selectedCourseId,
  onSelectCourse,
  preset,
  onSelectPreset,
  secondsRemaining,
  isRunning,
  onToggleRun,
  onReset,
  onLogComplete,
  sessionLabel,
  onChangeLabel,
  soundEnabled,
  onToggleSound,
}: FocusTimerCardProps) {
  const totalSeconds = preset.minutes * 60;
  const elapsedSeconds = Math.max(0, totalSeconds - secondsRemaining);
  const progressPct = totalSeconds > 0 ? Math.min(100, (elapsedSeconds / totalSeconds) * 100) : 0;

  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <section
      aria-label="Study Focus Timer"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Focus Session Timer
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {preset.isBreak ? 'Recovery interval' : 'Timed study block · Logged to weekly hours'}
          </p>
        </div>

        <button
          type="button"
          onClick={onToggleSound}
          aria-label={soundEnabled ? 'Mute completion chime' : 'Enable completion chime'}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span>{soundEnabled ? 'Chime On' : 'Chime Off'}</span>
        </button>
      </div>

      {/* Mode segmented presets */}
      <div
        role="group"
        aria-label="Timer duration presets"
        className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg"
      >
        {TIMER_PRESETS.map((item) => {
          const active = item.id === preset.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectPreset(item)}
              className={`px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Main countdown readout */}
      <div className="my-6 flex flex-col items-center text-center">
        <div
          className="font-mono tabular-nums text-5xl sm:text-6xl font-semibold tracking-tight text-slate-900 dark:text-slate-50"
          aria-live="off"
        >
          {formattedTime}
        </div>

        <div className="w-full max-w-sm mt-4 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              preset.isBreak ? 'bg-emerald-600 dark:bg-emerald-500' : 'bg-sky-700 dark:bg-sky-500'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Course + topic association */}
      {!preset.isBreak && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <div>
            <label
              htmlFor="timer-course-select"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
            >
              Course
            </label>
            <select
              id="timer-course-select"
              value={selectedCourseId}
              onChange={(e) => onSelectCourse(e.target.value)}
              className="w-full h-10 px-3 text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="timer-topic-input"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
            >
              Session Goal
            </label>
            <input
              id="timer-topic-input"
              type="text"
              value={sessionLabel}
              onChange={(e) => onChangeLabel(e.target.value)}
              placeholder="e.g. Chapter 4 practice problems"
              className="w-full h-10 px-3 text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600"
            />
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onToggleRun}
          className="inline-flex items-center justify-center gap-2 min-w-36 px-5 py-2.5 text-sm font-semibold rounded-lg bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white transition-colors whitespace-nowrap shrink-0"
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>{elapsedSeconds > 0 ? 'Resume' : 'Start Timer'}</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset</span>
        </button>

        {!preset.isBreak && elapsedSeconds >= 60 && (
          <button
            type="button"
            onClick={onLogComplete}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-lg border border-emerald-600/30 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors whitespace-nowrap shrink-0"
          >
            <Check className="w-4 h-4" />
            <span>Log {Math.max(1, Math.round(elapsedSeconds / 60))}m</span>
          </button>
        )}
      </div>
    </section>
  );
}
