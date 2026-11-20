export type StudyTab = 'today' | 'flashcards' | 'notes' | 'planner' | 'courses';

export interface GradeItem {
  id: string;
  title: string;
  weight: number; // Percentage weight e.g. 25
  score: number | null; // Earned percentage 0-100, null if ungraded
}

export interface Course {
  id: string;
  code: string;
  name: string;
  instructor: string;
  credits: number;
  schedule: string;
  accentColor: 'sky' | 'emerald' | 'amber' | 'violet' | 'rose';
  gradeItems: GradeItem[];
}

export type TaskType = 'Assignment' | 'Exam' | 'Lab' | 'Reading';
export type TaskPriority = 'High' | 'Normal' | 'Low';

export interface StudyTask {
  id: string;
  title: string;
  courseId: string;
  type: TaskType;
  dueDate: string; // YYYY-MM-DD
  estimatedMinutes: number;
  priority: TaskPriority;
  completed: boolean;
  notes?: string;
}

export type RecallRating = 1 | 2 | 3 | 4; // 1: Again, 2: Hard, 3: Good, 4: Easy

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  hint?: string;
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  dueDate: string; // YYYY-MM-DD
  lastReviewed?: string;
}

export interface FlashcardDeck {
  id: string;
  title: string;
  courseId: string;
  description: string;
  cards: Flashcard[];
}

export type NoteMode = 'standard' | 'cornell';

export interface StudyNote {
  id: string;
  title: string;
  courseId: string;
  mode: NoteMode;
  cues: string; // Cornell left column
  content: string; // Main notes body
  summary: string; // Cornell bottom summary
  updatedAt: string; // ISO string
}

export interface FocusSession {
  id: string;
  courseId: string;
  minutes: number;
  date: string; // YYYY-MM-DD
  label: string;
}

export interface TimerPreset {
  id: string;
  label: string;
  minutes: number;
  isBreak: boolean;
}
