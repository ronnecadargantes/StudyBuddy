import {
  BookOpen,
  CalendarCheck,
  FileText,
  GraduationCap,
  Layers,
  Menu,
  Moon,
  Pause,
  Play,
  Sun,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { CoursesView } from './components/CoursesView';
import { FlashcardsView } from './components/FlashcardsView';
import { NotesView } from './components/NotesView';
import { PlannerView } from './components/PlannerView';
import { TodayView } from './components/TodayView';
import { TIMER_PRESETS } from './data/seedData';
import { useStudyStore } from './hooks/useStudyStore';
import { StudyTab, TimerPreset } from './types/study';
import { getTodayISO, isCardDue, playStudyChime } from './utils/spacedRepetition';

const THEME_STORAGE_KEY = 'folio_theme_mode';

const NAV_ITEMS: { id: StudyTab; label: string; icon: typeof BookOpen }[] = [
  { id: 'today', label: 'Today', icon: BookOpen },
  { id: 'flashcards', label: 'Flashcards', icon: Layers },
  { id: 'notes', label: 'Notes', icon: FileText },
  { id: 'planner', label: 'Planner', icon: CalendarCheck },
  { id: 'courses', label: 'Courses', icon: GraduationCap },
];

const TAB_TITLES: Record<StudyTab, string> = {
  today: "Today's Study Desk",
  flashcards: 'Spaced Repetition & Flashcards',
  notes: 'Structured Course Notes',
  planner: 'Assignment & Exam Planner',
  courses: 'Courses & Grade Calculator',
};

export function App() {
  const store = useStudyStore();
  const [activeTab, setActiveTab] = useState<StudyTab>('today');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeStudyDeckId, setActiveStudyDeckId] = useState<string | null>(null);

  // Dark / Light mode
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
    } catch {
      // Ignore storage errors
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
    } catch {
      // Ignore storage errors
    }
  }, [isDark]);

  // Persistent Focus Timer state
  const [timerPreset, setTimerPreset] = useState<TimerPreset>(TIMER_PRESETS[0]);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(TIMER_PRESETS[0].minutes * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timerCourseId, setTimerCourseId] = useState<string>(store.courses[0]?.id ?? '');
  const [sessionLabel, setSessionLabel] = useState<string>('Focused Study Block');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [timerToast, setTimerToast] = useState<string | null>(null);

  // Keep selected timerCourseId valid if courses change
  useEffect(() => {
    if (store.courses.length > 0 && !store.courses.some((c) => c.id === timerCourseId)) {
      setTimerCourseId(store.courses[0].id);
    }
  }, [store.courses, timerCourseId]);

  // Countdown tick
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = window.setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          setIsTimerRunning(false);
          if (soundEnabled) playStudyChime();

          if (!timerPreset.isBreak) {
            store.logFocusSession({
              courseId: timerCourseId || store.courses[0]?.id || '',
              minutes: timerPreset.minutes,
              label: sessionLabel.trim() || timerPreset.label,
            });
            setTimerToast(`Logged ${timerPreset.minutes} min study session.`);
          } else {
            setTimerToast('Break complete. Ready for next focus block.');
          }
          return timerPreset.minutes * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTimerRunning, timerPreset, timerCourseId, sessionLabel, soundEnabled]);

  // Tab title live timer indicator when running
  useEffect(() => {
    if (!isTimerRunning) {
      document.title = 'Folio — Student Study Workspace';
      return;
    }
    const m = String(Math.floor(secondsRemaining / 60)).padStart(2, '0');
    const s = String(secondsRemaining % 60).padStart(2, '0');
    document.title = `${m}:${s} · Folio`;
  }, [isTimerRunning, secondsRemaining]);

  useEffect(() => {
    if (!timerToast) return;
    const t = window.setTimeout(() => setTimerToast(null), 5000);
    return () => window.clearTimeout(t);
  }, [timerToast]);

  const handleSelectPreset = (preset: TimerPreset) => {
    setIsTimerRunning(false);
    setTimerPreset(preset);
    setSecondsRemaining(preset.minutes * 60);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setSecondsRemaining(timerPreset.minutes * 60);
  };

  const handleLogManualComplete = () => {
    const elapsedSeconds = timerPreset.minutes * 60 - secondsRemaining;
    const loggedMins = Math.max(1, Math.round(elapsedSeconds / 60));
    if (!timerPreset.isBreak) {
      store.logFocusSession({
        courseId: timerCourseId || store.courses[0]?.id || '',
        minutes: loggedMins,
        label: sessionLabel.trim() || timerPreset.label,
      });
      setTimerToast(`Logged ${loggedMins} min study session.`);
    }
    setIsTimerRunning(false);
    setSecondsRemaining(timerPreset.minutes * 60);
  };

  const handleStartDeckFromToday = (deckId: string) => {
    setActiveStudyDeckId(deckId);
    setActiveTab('flashcards');
  };

  const todayISO = getTodayISO();
  const dueCardsCount = store.decks.reduce(
    (sum, d) => sum + d.cards.filter((c) => isCardDue(c, todayISO)).length,
    0
  );
  const pendingTasksCount = store.tasks.filter((t) => !t.completed).length;

  const timerMins = String(Math.floor(secondsRemaining / 60)).padStart(2, '0');
  const timerSecs = String(secondsRemaining % 60).padStart(2, '0');
  const isMidSession = isTimerRunning || secondsRemaining !== timerPreset.minutes * 60;

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="h-16 px-6 flex items-center border-b border-slate-200 dark:border-slate-800">
          <a
            href="#today"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('today');
            }}
            className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 whitespace-nowrap shrink-0"
          >
            Folio
          </a>
        </div>

        <nav aria-label="Primary workspace navigation" className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            const metaCount =
              item.id === 'flashcards'
                ? dueCardsCount
                : item.id === 'planner'
                ? pendingTasksCount
                : null;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </span>
                {metaCount !== null && metaCount > 0 && (
                  <span className="font-mono tabular-nums text-xs text-slate-500 dark:text-slate-400">
                    {metaCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Mini persistent timer control in sidebar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{timerPreset.isBreak ? 'Break Timer' : 'Focus Timer'}</span>
            <span className="font-mono tabular-nums font-medium text-slate-800 dark:text-slate-200">
              {timerMins}:{timerSecs}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsTimerRunning((r) => !r)}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            {isTimerRunning ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause Session</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>{isMidSession ? 'Resume Session' : 'Start Focus'}</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Slide-over Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-64 max-w-[80vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-10">
            <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
              <span className="font-display text-xl font-bold text-slate-900 dark:text-slate-50">
                Folio
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-4 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      active
                        ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Shell */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Workspace Top Bar */}
        <header className="h-16 px-4 sm:px-8 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>

            <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-50 truncate">
              {TAB_TITLES[activeTab]}
            </h1>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden sm:inline text-xs font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
              {todayFormatted}
            </span>

            <button
              type="button"
              onClick={() => setIsDark((d) => !d)}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => setIsTimerRunning((r) => !r)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white transition-colors whitespace-nowrap shrink-0 font-mono tabular-nums"
            >
              {isTimerRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>{timerMins}:{timerSecs}</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Start Focus</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Session completion notification banner */}
        {timerToast && (
          <div
            role="status"
            className="mx-4 sm:mx-8 mt-4 px-4 py-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-800 dark:text-emerald-200 flex items-center justify-between"
          >
            <span>{timerToast}</span>
            <button
              type="button"
              onClick={() => setTimerToast(null)}
              className="text-emerald-700 dark:text-emerald-300 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Active View Viewport */}
        <main className="flex-1 p-4 sm:p-8 max-w-[1280px] w-full mx-auto">
          {activeTab === 'today' && (
            <TodayView
              courses={store.courses}
              tasks={store.tasks}
              decks={store.decks}
              sessions={store.sessions}
              onToggleTask={store.toggleTask}
              onAddQuickTask={store.addTask}
              onNavigateTab={setActiveTab}
              onStartDeckStudy={handleStartDeckFromToday}
              timerCourseId={timerCourseId}
              onSelectTimerCourse={setTimerCourseId}
              timerPreset={timerPreset}
              onSelectTimerPreset={handleSelectPreset}
              secondsRemaining={secondsRemaining}
              isTimerRunning={isTimerRunning}
              onToggleTimerRun={() => setIsTimerRunning((r) => !r)}
              onResetTimer={handleResetTimer}
              onLogTimerComplete={handleLogManualComplete}
              sessionLabel={sessionLabel}
              onChangeSessionLabel={setSessionLabel}
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled((s) => !s)}
            />
          )}

          {activeTab === 'flashcards' && (
            <FlashcardsView
              courses={store.courses}
              decks={store.decks}
              activeStudyDeckId={activeStudyDeckId}
              onClearActiveStudyDeck={() => setActiveStudyDeckId(null)}
              onAddDeck={store.addDeck}
              onDeleteDeck={store.deleteDeck}
              onAddCard={store.addCardToDeck}
              onUpdateCard={store.updateCardInDeck}
              onDeleteCard={store.deleteCardFromDeck}
              onRateCard={store.rateFlashcard}
            />
          )}

          {activeTab === 'notes' && (
            <NotesView
              courses={store.courses}
              notes={store.notes}
              onCreateNote={store.createNote}
              onUpdateNote={store.updateNote}
              onDeleteNote={store.deleteNote}
            />
          )}

          {activeTab === 'planner' && (
            <PlannerView
              courses={store.courses}
              tasks={store.tasks}
              onToggleTask={store.toggleTask}
              onAddTask={store.addTask}
              onDeleteTask={store.deleteTask}
            />
          )}

          {activeTab === 'courses' && (
            <CoursesView
              courses={store.courses}
              onAddCourse={store.addCourse}
              onDeleteCourse={store.deleteCourse}
              onAddGradeItem={store.addGradeItem}
              onUpdateGradeItem={store.updateGradeItem}
              onDeleteGradeItem={store.deleteGradeItem}
              onResetDemoData={store.resetToDemoData}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
