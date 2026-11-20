import { useEffect, useState } from 'react';
import { createSeedData } from '../data/seedData';
import {
  Course,
  Flashcard,
  FlashcardDeck,
  FocusSession,
  GradeItem,
  RecallRating,
  StudyNote,
  StudyTask,
} from '../types/study';
import { computeNextSchedule, getTodayISO } from '../utils/spacedRepetition';

const STORAGE_KEY = 'folio_study_workspace_v1';

interface StoredState {
  courses: Course[];
  tasks: StudyTask[];
  decks: FlashcardDeck[];
  notes: StudyNote[];
  sessions: FocusSession[];
}

function loadInitialState(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredState>;
      if (
        Array.isArray(parsed.courses) &&
        Array.isArray(parsed.tasks) &&
        Array.isArray(parsed.decks) &&
        Array.isArray(parsed.notes) &&
        Array.isArray(parsed.sessions)
      ) {
        return {
          courses: parsed.courses,
          tasks: parsed.tasks,
          decks: parsed.decks,
          notes: parsed.notes,
          sessions: parsed.sessions,
        };
      }
    }
  } catch {
    // Fall back to seed data
  }
  return createSeedData();
}

export function useStudyStore() {
  const [state, setState] = useState<StoredState>(loadInitialState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors
    }
  }, [state]);

  const toggleTask = (taskId: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      ),
    }));
  };

  const addTask = (task: Omit<StudyTask, 'id'>) => {
    const newTask: StudyTask = {
      ...task,
      id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    setState((prev) => ({
      ...prev,
      tasks: [newTask, ...prev.tasks],
    }));
  };

  const deleteTask = (taskId: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== taskId),
    }));
  };

  const updateTask = (taskId: string, patch: Partial<StudyTask>) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t)),
    }));
  };

  const addDeck = (deck: { title: string; courseId: string; description: string }) => {
    const newDeck: FlashcardDeck = {
      id: `d-${Date.now()}`,
      title: deck.title,
      courseId: deck.courseId,
      description: deck.description,
      cards: [],
    };
    setState((prev) => ({
      ...prev,
      decks: [newDeck, ...prev.decks],
    }));
    return newDeck.id;
  };

  const deleteDeck = (deckId: string) => {
    setState((prev) => ({
      ...prev,
      decks: prev.decks.filter((d) => d.id !== deckId),
    }));
  };

  const addCardToDeck = (
    deckId: string,
    card: { front: string; back: string; hint?: string }
  ) => {
    const newCard: Flashcard = {
      id: `fc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      front: card.front,
      back: card.back,
      hint: card.hint?.trim() || undefined,
      intervalDays: 0,
      easeFactor: 2.5,
      repetitions: 0,
      dueDate: getTodayISO(),
    };
    setState((prev) => ({
      ...prev,
      decks: prev.decks.map((d) =>
        d.id === deckId ? { ...d, cards: [...d.cards, newCard] } : d
      ),
    }));
  };

  const updateCardInDeck = (
    deckId: string,
    cardId: string,
    patch: { front: string; back: string; hint?: string }
  ) => {
    setState((prev) => ({
      ...prev,
      decks: prev.decks.map((d) =>
        d.id === deckId
          ? {
              ...d,
              cards: d.cards.map((c) =>
                c.id === cardId
                  ? { ...c, front: patch.front, back: patch.back, hint: patch.hint }
                  : c
              ),
            }
          : d
      ),
    }));
  };

  const deleteCardFromDeck = (deckId: string, cardId: string) => {
    setState((prev) => ({
      ...prev,
      decks: prev.decks.map((d) =>
        d.id === deckId
          ? { ...d, cards: d.cards.filter((c) => c.id !== cardId) }
          : d
      ),
    }));
  };

  const rateFlashcard = (deckId: string, cardId: string, rating: RecallRating) => {
    setState((prev) => ({
      ...prev,
      decks: prev.decks.map((d) =>
        d.id === deckId
          ? {
              ...d,
              cards: d.cards.map((c) =>
                c.id === cardId ? { ...c, ...computeNextSchedule(c, rating) } : c
              ),
            }
          : d
      ),
    }));
  };

  const createNote = (courseId: string) => {
    const newNote: StudyNote = {
      id: `n-${Date.now()}`,
      title: 'Untitled Study Note',
      courseId,
      mode: 'cornell',
      cues: '',
      content: '',
      summary: '',
      updatedAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      notes: [newNote, ...prev.notes],
    }));
    return newNote.id;
  };

  const updateNote = (noteId: string, patch: Partial<StudyNote>) => {
    setState((prev) => ({
      ...prev,
      notes: prev.notes.map((n) =>
        n.id === noteId
          ? { ...n, ...patch, updatedAt: new Date().toISOString() }
          : n
      ),
    }));
  };

  const deleteNote = (noteId: string) => {
    setState((prev) => ({
      ...prev,
      notes: prev.notes.filter((n) => n.id !== noteId),
    }));
  };

  const addCourse = (course: Omit<Course, 'id' | 'gradeItems'>) => {
    const newCourse: Course = {
      ...course,
      id: `c-${Date.now()}`,
      gradeItems: [],
    };
    setState((prev) => ({
      ...prev,
      courses: [...prev.courses, newCourse],
    }));
    return newCourse.id;
  };

  const deleteCourse = (courseId: string) => {
    setState((prev) => ({
      ...prev,
      courses: prev.courses.filter((c) => c.id !== courseId),
    }));
  };

  const addGradeItem = (courseId: string, item: Omit<GradeItem, 'id'>) => {
    const newItem: GradeItem = {
      ...item,
      id: `g-${Date.now()}`,
    };
    setState((prev) => ({
      ...prev,
      courses: prev.courses.map((c) =>
        c.id === courseId ? { ...c, gradeItems: [...c.gradeItems, newItem] } : c
      ),
    }));
  };

  const updateGradeItem = (
    courseId: string,
    itemId: string,
    patch: Partial<GradeItem>
  ) => {
    setState((prev) => ({
      ...prev,
      courses: prev.courses.map((c) =>
        c.id === courseId
          ? {
              ...c,
              gradeItems: c.gradeItems.map((g) =>
                g.id === itemId ? { ...g, ...patch } : g
              ),
            }
          : c
      ),
    }));
  };

  const deleteGradeItem = (courseId: string, itemId: string) => {
    setState((prev) => ({
      ...prev,
      courses: prev.courses.map((c) =>
        c.id === courseId
          ? {
              ...c,
              gradeItems: c.gradeItems.filter((g) => g.id !== itemId),
            }
          : c
      ),
    }));
  };

  const logFocusSession = (session: Omit<FocusSession, 'id' | 'date'>) => {
    const newSession: FocusSession = {
      ...session,
      id: `s-${Date.now()}`,
      date: getTodayISO(),
    };
    setState((prev) => ({
      ...prev,
      sessions: [...prev.sessions, newSession],
    }));
  };

  const resetToDemoData = () => {
    const fresh = createSeedData();
    setState(fresh);
  };

  return {
    ...state,
    toggleTask,
    addTask,
    deleteTask,
    updateTask,
    addDeck,
    deleteDeck,
    addCardToDeck,
    updateCardInDeck,
    deleteCardFromDeck,
    rateFlashcard,
    createNote,
    updateNote,
    deleteNote,
    addCourse,
    deleteCourse,
    addGradeItem,
    updateGradeItem,
    deleteGradeItem,
    logFocusSession,
    resetToDemoData,
  };
}
