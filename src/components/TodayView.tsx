import { AlertTriangle, ArrowRight, CheckSquare, Plus, Square } from 'lucide-react';
import { FormEvent, useState } from 'react';
import {
  Course,
  FlashcardDeck,
  FocusSession,
  StudyTab,
  StudyTask,
  TimerPreset,
} from '../types/study';
import {
  addDaysISO,
  calculateCumulativeGPA,
  formatShortDate,
  getTodayISO,
  isCardDue,
} from '../utils/spacedRepetition';
import { FocusTimerCard } from './FocusTimerCard';

interface TodayViewProps {
  courses: Course[];
  tasks: StudyTask[];
  decks: FlashcardDeck[];
  sessions: FocusSession[];
  onToggleTask: (taskId: string) => void;
  onAddQuickTask: (task: Omit<StudyTask, 'id'>) => void;
  onNavigateTab: (tab: StudyTab) => void;
  onStartDeckStudy: (deckId: string) => void;
  // Timer props
  timerCourseId: string;
  onSelectTimerCourse: (id: string) => void;
  timerPreset: TimerPreset;
  onSelectTimerPreset: (preset: TimerPreset) => void;
  secondsRemaining: number;
  isTimerRunning: boolean;
  onToggleTimerRun: () => void;
  onResetTimer: () => void;
  onLogTimerComplete: () => void;
  sessionLabel: string;
  onChangeSessionLabel: (label: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export function TodayView({
  courses,
  tasks,
  decks,
  sessions,
  onToggleTask,
  onAddQuickTask,
  onNavigateTab,
  onStartDeckStudy,
  timerCourseId,
  onSelectTimerCourse,
  timerPreset,
  onSelectTimerPreset,
  secondsRemaining,
  isTimerRunning,
  onToggleTimerRun,
  onResetTimer,
  onLogTimerComplete,
  sessionLabel,
  onChangeSessionLabel,
  soundEnabled,
  onToggleSound,
}: TodayViewProps) {
  const today = getTodayISO();
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCourseId, setQuickCourseId] = useState(courses[0]?.id ?? '');

  const courseMap = new Map(courses.map((c) => [c.id, c]));

  const todayMinutes = sessions
    .filter((s) => s.date === today)
    .reduce((sum, s) => sum + s.minutes, 0);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const iso = addDaysISO(today, i - 6);
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(y, (m || 1) - 1, d || 1);
    const dayLabel = dt.toLocaleDateString('en-US', { weekday: 'short' });
    const total = sessions
      .filter((s) => s.date === iso)
      .reduce((sum, s) => sum + s.minutes, 0);
    return { iso, dayLabel, total };
  });

  const maxDayMinutes = Math.max(60, ...last7Days.map((d) => d.total));
  const weeklyMinutes = last7Days.reduce((sum, d) => sum + d.total, 0);

  const totalDueCards = decks.reduce(
    (sum, deck) => sum + deck.cards.filter((c) => isCardDue(c, today)).length,
    0
  );
  const decksWithDue = decks.filter((d) => d.cards.some((c) => isCardDue(c, today)));

  const pendingTasks = tasks
    .filter((t) => !t.completed)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const overdueCount = pendingTasks.filter((t) => t.dueDate < today).length;

  const gpa = calculateCumulativeGPA(courses);
  const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);

  const handleQuickAdd = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = quickTitle.trim();
    if (!trimmed) return;
    onAddQuickTask({
      title: trimmed,
      courseId: quickCourseId || courses[0]?.id || '',
      type: 'Assignment',
      dueDate: today,
      estimatedMinutes: 30,
      priority: 'Normal',
      completed: false,
    });
    setQuickTitle('');
  };

  return (
    <div className="space-y-6">
      {/* 4-Column Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Focus Today
          </div>
          <div className="mt-2 font-mono tabular-nums text-2xl font-semibold text-slate-900 dark:text-slate-50">
            {todayMinutes} min
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {(weeklyMinutes / 60).toFixed(1)} hrs logged this week
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Active Recall Queue
          </div>
          <div className="mt-2 font-mono tabular-nums text-2xl font-semibold text-slate-900 dark:text-slate-50">
            {totalDueCards} {totalDueCards === 1 ? 'card' : 'cards'}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            Across {decksWithDue.length} {decksWithDue.length === 1 ? 'deck' : 'decks'} due today
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Pending Deliverables
          </div>
          <div className="mt-2 font-mono tabular-nums text-2xl font-semibold text-slate-900 dark:text-slate-50">
            {pendingTasks.length} {pendingTasks.length === 1 ? 'task' : 'tasks'}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {overdueCount > 0 ? (
              <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-400 font-medium tabular-nums">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{overdueCount} overdue</span>
              </span>
            ) : (
              <span>All deadlines on track</span>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Projected Term GPA
          </div>
          <div className="mt-2 font-mono tabular-nums text-2xl font-semibold text-slate-900 dark:text-slate-50">
            {gpa !== null ? gpa.toFixed(2) : '—'}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {courses.length} courses · {totalCredits} credits
          </div>
        </div>
      </div>

      {/* Main 2-Column Study Desk */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: Focus Timer + Weekly Chart */}
        <div className="xl:col-span-6 space-y-6">
          <FocusTimerCard
            courses={courses}
            selectedCourseId={timerCourseId}
            onSelectCourse={onSelectTimerCourse}
            preset={timerPreset}
            onSelectPreset={onSelectTimerPreset}
            secondsRemaining={secondsRemaining}
            isRunning={isTimerRunning}
            onToggleRun={onToggleTimerRun}
            onReset={onResetTimer}
            onLogComplete={onLogTimerComplete}
            sessionLabel={sessionLabel}
            onChangeLabel={onChangeSessionLabel}
            soundEnabled={soundEnabled}
            onToggleSound={onToggleSound}
          />

          {/* Weekly Study Distribution */}
          <section
            aria-label="Weekly Study Hours"
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6"
          >
            <div className="flex items-baseline justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Weekly Study Log
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Daily focus minutes over the past 7 days
                </p>
              </div>
              <div className="font-mono tabular-nums text-sm font-medium text-slate-700 dark:text-slate-300">
                {weeklyMinutes} min total
              </div>
            </div>

            <div className="mt-6 grid grid-cols-7 gap-2.5 items-end h-40">
              {last7Days.map((day) => {
                const heightPct = Math.max(4, Math.round((day.total / maxDayMinutes) * 100));
                const isToday = day.iso === today;
                return (
                  <div key={day.iso} className="flex flex-col items-center h-full justify-end gap-2">
                    <span className="font-mono tabular-nums text-[11px] text-slate-500 dark:text-slate-400">
                      {day.total > 0 ? `${day.total}m` : '0'}
                    </span>
                    <div className="w-full max-w-9 flex-1 flex items-end bg-slate-100 dark:bg-slate-800/70 rounded-md overflow-hidden">
                      <div
                        className={`w-full rounded-t-md transition-all duration-300 ${
                          isToday
                            ? 'bg-sky-700 dark:bg-sky-500'
                            : 'bg-slate-400 dark:bg-slate-600'
                        }`}
                        style={{ height: day.total > 0 ? `${heightPct}%` : '2px' }}
                        title={`${day.dayLabel}: ${day.total} minutes`}
                      />
                    </div>
                    <span
                      className={`text-xs ${
                        isToday
                          ? 'font-semibold text-sky-700 dark:text-sky-400'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {day.dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right Column: Priority Queue + Flashcard Review Queue */}
        <div className="xl:col-span-6 space-y-6">
          {/* Priority Tasks */}
          <section
            aria-label="Priority Assignments and Tasks"
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6"
          >
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Upcoming Deadlines
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Sorted by nearest due date
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('planner')}
                className="inline-flex items-center gap-1 text-xs font-medium text-sky-700 dark:text-sky-400 hover:underline whitespace-nowrap shrink-0"
              >
                <span>Open Planner</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick-add form */}
            <form onSubmit={handleQuickAdd} className="mt-4 flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                placeholder="Quick add assignment or reading..."
                aria-label="Quick add study task"
                className="flex-1 h-10 px-3 text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
              {courses.length > 0 && (
                <select
                  value={quickCourseId}
                  onChange={(e) => setQuickCourseId(e.target.value)}
                  aria-label="Task course"
                  className="h-10 px-2.5 text-xs font-medium bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-600"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code}
                    </option>
                  ))}
                </select>
              )}
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 h-10 px-4 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>

            {/* Task rows */}
            <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
              {pendingTasks.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  All scheduled tasks are complete. Add a new deliverable above to plan ahead.
                </div>
              ) : (
                pendingTasks.slice(0, 6).map((task) => {
                  const course = courseMap.get(task.courseId);
                  const isOverdue = task.dueDate < today;
                  const isDueToday = task.dueDate === today;

                  return (
                    <div
                      key={task.id}
                      className="py-3.5 flex items-start gap-3 group"
                    >
                      <button
                        type="button"
                        onClick={() => onToggleTask(task.id)}
                        aria-label={`Mark "${task.title}" complete`}
                        className="mt-0.5 text-slate-400 hover:text-sky-700 dark:hover:text-sky-400 transition-colors shrink-0"
                      >
                        {task.completed ? (
                          <CheckSquare className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-snug">
                          {task.title}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                          {course && <span className="font-medium text-slate-700 dark:text-slate-300">{course.code}</span>}
                          {course && <span aria-hidden="true">·</span>}
                          <span>{task.type}</span>
                          <span aria-hidden="true">·</span>
                          <span
                            className={`font-mono tabular-nums ${
                              isOverdue
                                ? 'text-rose-700 dark:text-rose-400 font-medium'
                                : isDueToday
                                ? 'text-amber-700 dark:text-amber-400 font-medium'
                                : ''
                            }`}
                          >
                            {isOverdue
                              ? `Overdue (${formatShortDate(task.dueDate)})`
                              : isDueToday
                              ? 'Due Today'
                              : `Due ${formatShortDate(task.dueDate)}`}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">{task.estimatedMinutes} min</span>
                          {task.priority === 'High' && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-rose-700 dark:text-rose-400 font-medium">
                                High Priority
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Flashcard Review Launchpad */}
          <section
            aria-label="Flashcards Due for Review"
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6"
          >
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Spaced Repetition Due
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Decks scheduled for active recall today
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('flashcards')}
                className="inline-flex items-center gap-1 text-xs font-medium text-sky-700 dark:text-sky-400 hover:underline whitespace-nowrap shrink-0"
              >
                <span>All Decks</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-2 divide-y divide-slate-200 dark:divide-slate-800">
              {decks.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  No flashcard decks created yet.
                </div>
              ) : (
                decks.map((deck) => {
                  const course = courseMap.get(deck.courseId);
                  const dueCount = deck.cards.filter((c) => isCardDue(c, today)).length;
                  return (
                    <div
                      key={deck.id}
                      className="py-3.5 flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {deck.title}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                          {course ? `${course.code} · ` : ''}
                          {dueCount} due · {deck.cards.length} total cards
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onStartDeckStudy(deck.id)}
                        disabled={deck.cards.length === 0}
                        className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors whitespace-nowrap shrink-0"
                      >
                        {dueCount > 0 ? `Review ${dueCount}` : 'Practice'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
