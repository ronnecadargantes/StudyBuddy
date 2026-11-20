import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  HelpCircle,
  Pencil,
  Plus,
  RotateCw,
  Trash2,
  XCircle,
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Course, Flashcard, FlashcardDeck, RecallRating } from '../types/study';
import {
  formatShortDate,
  getTodayISO,
  isCardDue,
  previewIntervalLabel,
} from '../utils/spacedRepetition';

type DeckSubMode = 'library' | 'study' | 'quiz' | 'edit';

interface FlashcardsViewProps {
  courses: Course[];
  decks: FlashcardDeck[];
  activeStudyDeckId: string | null;
  onClearActiveStudyDeck: () => void;
  onAddDeck: (deck: { title: string; courseId: string; description: string }) => string;
  onDeleteDeck: (deckId: string) => void;
  onAddCard: (deckId: string, card: { front: string; back: string; hint?: string }) => void;
  onUpdateCard: (
    deckId: string,
    cardId: string,
    patch: { front: string; back: string; hint?: string }
  ) => void;
  onDeleteCard: (deckId: string, cardId: string) => void;
  onRateCard: (deckId: string, cardId: string, rating: RecallRating) => void;
}

export function FlashcardsView({
  courses,
  decks,
  activeStudyDeckId,
  onClearActiveStudyDeck,
  onAddDeck,
  onDeleteDeck,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  onRateCard,
}: FlashcardsViewProps) {
  const today = getTodayISO();
  const courseMap = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses]);

  const [mode, setMode] = useState<DeckSubMode>('library');
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [courseFilter, setCourseFilter] = useState<string>('all');

  // New deck form
  const [showNewDeck, setShowNewDeck] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [newDeckCourse, setNewDeckCourse] = useState(courses[0]?.id ?? '');
  const [newDeckDesc, setNewDeckDesc] = useState('');

  // Study session state
  const [studyQueue, setStudyQueue] = useState<string[]>([]);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);

  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizCards, setQuizCards] = useState<Flashcard[]>([]);
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [quizCorrectCount, setQuizCorrectCount] = useState(0);

  // Card editor state
  const [cardFront, setCardFront] = useState('');
  const [cardBack, setCardBack] = useState('');
  const [cardHint, setCardHint] = useState('');
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  const selectedDeck = useMemo(
    () => decks.find((d) => d.id === selectedDeckId) ?? null,
    [decks, selectedDeckId]
  );

  // Launch directly if triggered from TodayView
  useEffect(() => {
    if (activeStudyDeckId) {
      const target = decks.find((d) => d.id === activeStudyDeckId);
      if (target) {
        startStudySession(target);
      }
      onClearActiveStudyDeck();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStudyDeckId]);

  const startStudySession = (deck: FlashcardDeck, forceAll = false) => {
    const dueIds = deck.cards.filter((c) => isCardDue(c, today)).map((c) => c.id);
    const queue = !forceAll && dueIds.length > 0 ? dueIds : deck.cards.map((c) => c.id);
    setSelectedDeckId(deck.id);
    setStudyQueue(queue);
    setIsFlipped(false);
    setShowHint(false);
    setReviewedCount(0);
    setSessionDone(queue.length === 0);
    setMode('study');
  };

  const buildQuizOptions = (target: Flashcard, allDeckCards: Flashcard[], allCardsPool: Flashcard[]) => {
    const distractorsPool = (allDeckCards.length >= 4 ? allDeckCards : allCardsPool)
      .filter((c) => c.id !== target.id && c.back !== target.back)
      .map((c) => c.back);

    const shuffledDistractors = [...distractorsPool].sort(() => Math.random() - 0.5).slice(0, 3);
    const opts = [target.back, ...shuffledDistractors].sort(() => Math.random() - 0.5);
    return opts;
  };

  const startQuizMode = (deck: FlashcardDeck) => {
    if (deck.cards.length === 0) return;
    const shuffled = [...deck.cards].sort(() => Math.random() - 0.5);
    const allCardsPool = decks.flatMap((d) => d.cards);
    setSelectedDeckId(deck.id);
    setQuizCards(shuffled);
    setQuizIndex(0);
    setQuizCorrectCount(0);
    setSelectedAnswer(null);
    setQuizOptions(buildQuizOptions(shuffled[0], deck.cards, allCardsPool));
    setMode('quiz');
  };

  const handleSelectQuizOption = (option: string) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(option);
    if (option === quizCards[quizIndex].back) {
      setQuizCorrectCount((c) => c + 1);
    }
  };

  const handleNextQuizQuestion = () => {
    const nextIdx = quizIndex + 1;
    if (nextIdx >= quizCards.length) {
      setQuizIndex(nextIdx);
      return;
    }
    const allCardsPool = decks.flatMap((d) => d.cards);
    setQuizIndex(nextIdx);
    setSelectedAnswer(null);
    setQuizOptions(
      buildQuizOptions(quizCards[nextIdx], selectedDeck?.cards ?? quizCards, allCardsPool)
    );
  };

  const currentStudyCard = useMemo(() => {
    if (!selectedDeck || studyQueue.length === 0) return null;
    return selectedDeck.cards.find((c) => c.id === studyQueue[0]) ?? null;
  }, [selectedDeck, studyQueue]);

  const handleRate = (rating: RecallRating) => {
    if (!selectedDeck || !currentStudyCard) return;
    onRateCard(selectedDeck.id, currentStudyCard.id, rating);
    setReviewedCount((n) => n + 1);

    setStudyQueue((prev) => {
      const [, ...rest] = prev;
      // Rating 1 ("Again") puts card back into the session queue after a couple cards
      const nextQueue = rating === 1 ? [...rest, currentStudyCard.id] : rest;
      if (nextQueue.length === 0) {
        setSessionDone(true);
      }
      return nextQueue;
    });
    setIsFlipped(false);
    setShowHint(false);
  };

  // Keyboard shortcuts during active study
  useEffect(() => {
    if (mode !== 'study' || sessionDone || !currentStudyCard) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((f) => !f);
      } else if (isFlipped) {
        if (e.key === '1') handleRate(1);
        if (e.key === '2') handleRate(2);
        if (e.key === '3') handleRate(3);
        if (e.key === '4') handleRate(4);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, sessionDone, isFlipped, currentStudyCard]);

  const handleCreateDeck = (e: FormEvent) => {
    e.preventDefault();
    if (!newDeckTitle.trim()) return;
    const id = onAddDeck({
      title: newDeckTitle.trim(),
      courseId: newDeckCourse || courses[0]?.id || '',
      description: newDeckDesc.trim() || 'Active recall study deck',
    });
    setNewDeckTitle('');
    setNewDeckDesc('');
    setShowNewDeck(false);
    setSelectedDeckId(id);
    setMode('edit');
  };

  const handleSaveCard = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedDeck || !cardFront.trim() || !cardBack.trim()) return;
    if (editingCardId) {
      onUpdateCard(selectedDeck.id, editingCardId, {
        front: cardFront.trim(),
        back: cardBack.trim(),
        hint: cardHint.trim() || undefined,
      });
      setEditingCardId(null);
    } else {
      onAddCard(selectedDeck.id, {
        front: cardFront.trim(),
        back: cardBack.trim(),
        hint: cardHint.trim() || undefined,
      });
    }
    setCardFront('');
    setCardBack('');
    setCardHint('');
  };

  const startEditCard = (card: Flashcard) => {
    setEditingCardId(card.id);
    setCardFront(card.front);
    setCardBack(card.back);
    setCardHint(card.hint ?? '');
  };

  const filteredDecks = useMemo(() => {
    if (courseFilter === 'all') return decks;
    return decks.filter((d) => d.courseId === courseFilter);
  }, [decks, courseFilter]);

  // Sub-view: Active Study Mode
  if (mode === 'study' && selectedDeck) {
    const course = courseMap.get(selectedDeck.courseId);

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setMode('library')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Decks</span>
          </button>

          <div className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            {course ? `${course.code} · ` : ''}
            {selectedDeck.title} · {studyQueue.length} remaining
          </div>
        </div>

        {sessionDone || !currentStudyCard ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center space-y-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
              Review Session Complete
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto tabular-nums">
              You completed {reviewedCount} {reviewedCount === 1 ? 'card review' : 'card reviews'} in{' '}
              <span className="font-medium text-slate-800 dark:text-slate-200">{selectedDeck.title}</span>.
              Intervals have been updated for spaced repetition.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => startStudySession(selectedDeck, true)}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white transition-colors"
              >
                Practice All Cards Again
              </button>
              <button
                type="button"
                onClick={() => setMode('library')}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Return to Decks
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Flashcard Stage */}
            <div
              onClick={() => setIsFlipped((f) => !f)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setIsFlipped((f) => !f);
              }}
              aria-label={isFlipped ? 'Flashcard answer side, click to show prompt' : 'Flashcard prompt side, click to reveal answer'}
              className="cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 sm:p-12 min-h-80 flex flex-col justify-between transition-colors hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>{isFlipped ? 'Answer' : 'Prompt'}</span>
                <span className="font-mono tabular-nums">
                  Reps: {currentStudyCard.repetitions} · Interval: {currentStudyCard.intervalDays}d
                </span>
              </div>

              <div className="my-8 text-center">
                <p className="font-display text-xl sm:text-2xl font-medium text-slate-900 dark:text-slate-50 leading-relaxed text-balance">
                  {isFlipped ? currentStudyCard.back : currentStudyCard.front}
                </p>

                {!isFlipped && currentStudyCard.hint && showHint && (
                  <p className="mt-5 text-sm text-sky-700 dark:text-sky-400">
                    Hint: {currentStudyCard.hint}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                <span>Click card or press Space to flip</span>
                {!isFlipped && currentStudyCard.hint && !showHint && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowHint(true);
                    }}
                    className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-sky-700 dark:hover:text-sky-400 font-medium"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Show Hint</span>
                  </button>
                )}
              </div>
            </div>

            {/* Reveal or SM-2 Rating Controls */}
            {!isFlipped ? (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setIsFlipped(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-lg bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>Show Answer</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(
                  [
                    { rating: 1 as RecallRating, label: 'Again', key: '1', tone: 'border-rose-300 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-800 dark:text-rose-300' },
                    { rating: 2 as RecallRating, label: 'Hard', key: '2', tone: 'border-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/50 text-amber-800 dark:text-amber-300' },
                    { rating: 3 as RecallRating, label: 'Good', key: '3', tone: 'border-sky-300 dark:border-sky-800 hover:bg-sky-50 dark:hover:bg-sky-950/50 text-sky-800 dark:text-sky-300' },
                    { rating: 4 as RecallRating, label: 'Easy', key: '4', tone: 'border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300' },
                  ]
                ).map((btn) => (
                  <button
                    key={btn.rating}
                    type="button"
                    onClick={() => handleRate(btn.rating)}
                    className={`flex flex-col items-center justify-center py-3 px-4 rounded-lg border bg-white dark:bg-slate-900 transition-colors ${btn.tone}`}
                  >
                    <span className="text-sm font-semibold">
                      {btn.key}. {btn.label}
                    </span>
                    <span className="mt-0.5 text-xs font-mono tabular-nums opacity-80">
                      {previewIntervalLabel(currentStudyCard, btn.rating)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Sub-view: Self-Test Quiz Mode
  if (mode === 'quiz' && selectedDeck) {
    const isQuizComplete = quizIndex >= quizCards.length;
    const currentQ = quizCards[quizIndex];

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setMode('library')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Decks</span>
          </button>

          <div className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            Self-Test · {selectedDeck.title}
          </div>
        </div>

        {isQuizComplete ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center space-y-4">
            <CheckCircle2 className="w-10 h-10 text-sky-700 dark:text-sky-400 mx-auto" />
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
              Quiz Score: {quizCorrectCount} / {quizCards.length} (
              <span className="font-mono tabular-nums">
                {Math.round((quizCorrectCount / Math.max(1, quizCards.length)) * 100)}%
              </span>
              )
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Self-testing strengthens retrieval pathways ahead of exams.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => startQuizMode(selectedDeck)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-sky-700 hover:bg-sky-800 text-white transition-colors"
              >
                <RotateCw className="w-4 h-4" />
                <span>Retake Quiz</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('library')}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Return to Decks
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
              <span>
                Question {quizIndex + 1} of {quizCards.length}
              </span>
              <span>Score: {quizCorrectCount}</span>
            </div>

            <h3 className="font-display text-xl font-medium text-slate-900 dark:text-slate-50 leading-snug">
              {currentQ.front}
            </h3>

            <div className="space-y-2.5">
              {quizOptions.map((option, idx) => {
                const isSelected = selectedAnswer === option;
                const isCorrect = option === currentQ.back;
                const revealed = selectedAnswer !== null;

                let stateClass =
                  'border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 bg-slate-50/50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-100';
                if (revealed) {
                  if (isCorrect) {
                    stateClass =
                      'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200';
                  } else if (isSelected && !isCorrect) {
                    stateClass =
                      'border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200';
                  } else {
                    stateClass =
                      'border-slate-200 dark:border-slate-800 opacity-55 text-slate-600 dark:text-slate-400';
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={revealed}
                    onClick={() => handleSelectQuizOption(option)}
                    className={`w-full text-left p-4 rounded-lg border text-sm leading-relaxed transition-colors flex items-start justify-between gap-3 ${stateClass}`}
                  >
                    <span>{option}</span>
                    {revealed && isCorrect && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    )}
                    {revealed && isSelected && !isCorrect && (
                      <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {selectedAnswer !== null && (
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleNextQuizQuestion}
                  className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
                >
                  {quizIndex + 1 >= quizCards.length ? 'Finish Quiz' : 'Next Question'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Sub-view: Card Editor
  if (mode === 'edit' && selectedDeck) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                setEditingCardId(null);
                setCardFront('');
                setCardBack('');
                setCardHint('');
                setMode('library');
              }}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>All Decks</span>
            </button>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
              {selectedDeck.title}
            </h2>
          </div>

          <button
            type="button"
            disabled={selectedDeck.cards.length === 0}
            onClick={() => startStudySession(selectedDeck)}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-sky-700 hover:bg-sky-800 text-white disabled:opacity-40 transition-colors"
          >
            Study Deck
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Add / Edit card form */}
          <form
            onSubmit={handleSaveCard}
            className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4"
          >
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {editingCardId ? 'Edit Flashcard' : 'Add New Flashcard'}
            </h3>

            <div>
              <label
                htmlFor="card-front-input"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
              >
                Front (Question or Prompt)
              </label>
              <textarea
                id="card-front-input"
                rows={3}
                required
                value={cardFront}
                onChange={(e) => setCardFront(e.target.value)}
                placeholder="e.g. What enzyme catalyzes the rate-limiting step of glycolysis?"
                className="w-full p-3 text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
            </div>

            <div>
              <label
                htmlFor="card-back-input"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
              >
                Back (Answer or Explanation)
              </label>
              <textarea
                id="card-back-input"
                rows={4}
                required
                value={cardBack}
                onChange={(e) => setCardBack(e.target.value)}
                placeholder="e.g. Phosphofructokinase-1 (PFK-1), allosterically inhibited by ATP and citrate."
                className="w-full p-3 text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
            </div>

            <div>
              <label
                htmlFor="card-hint-input"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
              >
                Optional Hint
              </label>
              <input
                id="card-hint-input"
                type="text"
                value={cardHint}
                onChange={(e) => setCardHint(e.target.value)}
                placeholder="Short memory cue"
                className="w-full h-10 px-3 text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 transition-colors"
              >
                {editingCardId ? 'Update Card' : 'Add Card'}
              </button>
              {editingCardId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingCardId(null);
                    setCardFront('');
                    setCardBack('');
                    setCardHint('');
                  }}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {/* Cards list */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Cards in Deck
              </h3>
              <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                {selectedDeck.cards.length} total
              </span>
            </div>

            {selectedDeck.cards.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                No cards yet. Add your first prompt and answer on the left.
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {selectedDeck.cards.map((card) => (
                  <div key={card.id} className="py-4 flex items-start justify-between gap-4">
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {card.front}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {card.back}
                      </p>
                      <p className="text-xs font-mono tabular-nums text-slate-400 dark:text-slate-500">
                        Next review: {isCardDue(card, today) ? 'Due today' : formatShortDate(card.dueDate)} ·{' '}
                        {card.repetitions} reps
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditCard(card)}
                        aria-label="Edit card"
                        className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteCard(selectedDeck.id, card.id)}
                        aria-label="Delete card"
                        className="p-2 rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main Deck Library View
  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg">
          <button
            type="button"
            onClick={() => setCourseFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              courseFilter === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            All Courses
          </button>
          {courses.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCourseFilter(c.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                courseFilter === c.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {c.code}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowNewDeck((s) => !s)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Deck</span>
        </button>
      </div>

      {/* Create Deck Form */}
      {showNewDeck && (
        <form
          onSubmit={handleCreateDeck}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4"
        >
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Create Flashcard Deck
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="new-deck-title"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
              >
                Deck Title
              </label>
              <input
                id="new-deck-title"
                type="text"
                required
                value={newDeckTitle}
                onChange={(e) => setNewDeckTitle(e.target.value)}
                placeholder="e.g. Neurotransmitters & Receptors"
                className="w-full h-10 px-3 text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
            </div>

            <div>
              <label
                htmlFor="new-deck-course"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
              >
                Course
              </label>
              <select
                id="new-deck-course"
                value={newDeckCourse}
                onChange={(e) => setNewDeckCourse(e.target.value)}
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
                htmlFor="new-deck-desc"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
              >
                Topic Summary
              </label>
              <input
                id="new-deck-desc"
                type="text"
                value={newDeckDesc}
                onChange={(e) => setNewDeckDesc(e.target.value)}
                placeholder="Key chapters or exam focus"
                className="w-full h-10 px-3 text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 transition-colors"
            >
              Create Deck
            </button>
            <button
              type="button"
              onClick={() => setShowNewDeck(false)}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Deck Grid */}
      {filteredDecks.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            No flashcard decks match this filter yet.
          </p>
          <button
            type="button"
            onClick={() => setShowNewDeck(true)}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-sky-700 text-white hover:bg-sky-800 transition-colors"
          >
            Create First Deck
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredDecks.map((deck) => {
            const course = courseMap.get(deck.courseId);
            const dueCount = deck.cards.filter((c) => isCardDue(c, today)).length;
            const masteredCount = deck.cards.filter((c) => c.repetitions >= 2).length;

            return (
              <article
                key={deck.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between gap-5"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      {course ? `${course.code} · ` : ''}
                      <span
                        className={
                          dueCount > 0
                            ? 'text-sky-700 dark:text-sky-400 font-semibold'
                            : ''
                        }
                      >
                        {dueCount} due
                      </span>{' '}
                      · {deck.cards.length} cards
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteDeck(deck.id)}
                      aria-label={`Delete ${deck.title}`}
                      className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h3 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-50 leading-snug">
                    {deck.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                    {deck.description}
                  </p>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    <span>Mastered</span>
                    <span>
                      {masteredCount} / {deck.cards.length}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 dark:bg-emerald-500 transition-all"
                      style={{
                        width: `${
                          deck.cards.length > 0
                            ? Math.round((masteredCount / deck.cards.length) * 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>

                  <div className="pt-1 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={deck.cards.length === 0}
                      onClick={() => startStudySession(deck)}
                      className="flex-1 px-3.5 py-2 text-xs font-semibold rounded-lg bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white disabled:opacity-40 transition-colors whitespace-nowrap"
                    >
                      {dueCount > 0 ? `Study ${dueCount} Due` : 'Practice Deck'}
                    </button>
                    <button
                      type="button"
                      disabled={deck.cards.length === 0}
                      onClick={() => startQuizMode(deck)}
                      className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors whitespace-nowrap"
                    >
                      Quiz
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDeckId(deck.id);
                        setMode('edit');
                      }}
                      className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
