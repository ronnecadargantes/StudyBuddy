import { Course, Flashcard, RecallRating } from '../types/study';

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysISO(baseISO: string, days: number): string {
  const [y, m, d] = baseISO.split('-').map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  date.setDate(date.getDate() + days);
  const ny = date.getFullYear();
  const nm = String(date.getMonth() + 1).padStart(2, '0');
  const nd = String(date.getDate()).padStart(2, '0');
  return `${ny}-${nm}-${nd}`;
}

export function formatShortDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function isCardDue(card: Flashcard, todayISO: string = getTodayISO()): boolean {
  return card.dueDate <= todayISO;
}

export function previewIntervalLabel(card: Flashcard, rating: RecallRating): string {
  if (rating === 1) return '< 1 min';
  const next = computeNextSchedule(card, rating);
  if (next.intervalDays === 1) return '1 day';
  return `${next.intervalDays} days`;
}

export function computeNextSchedule(
  card: Flashcard,
  rating: RecallRating,
  todayISO: string = getTodayISO()
): Pick<Flashcard, 'intervalDays' | 'easeFactor' | 'repetitions' | 'dueDate' | 'lastReviewed'> {
  let { intervalDays, easeFactor, repetitions } = card;

  if (rating === 1) {
    // Again: reset streak, re-show immediately in current session
    repetitions = 0;
    intervalDays = 0;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
    return {
      intervalDays,
      easeFactor,
      repetitions,
      dueDate: todayISO,
      lastReviewed: todayISO,
    };
  }

  if (repetitions === 0) {
    intervalDays = rating === 4 ? 4 : rating === 3 ? 1 : 1;
  } else if (repetitions === 1) {
    intervalDays = rating === 4 ? 7 : rating === 3 ? 4 : 2;
  } else {
    const multiplier = rating === 2 ? 1.2 : rating === 4 ? easeFactor * 1.3 : easeFactor;
    intervalDays = Math.max(1, Math.round(intervalDays * multiplier));
  }

  repetitions += 1;
  const q = rating === 2 ? 3 : rating === 3 ? 4 : 5;
  easeFactor = Math.max(1.3, +(easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))).toFixed(2));

  return {
    intervalDays,
    easeFactor,
    repetitions,
    dueDate: addDaysISO(todayISO, intervalDays),
    lastReviewed: todayISO,
  };
}

export function calculateCourseWeightedGrade(course: Course): {
  percentage: number | null;
  gradedWeight: number;
  letter: string;
  gpaPoints: number | null;
} {
  const graded = course.gradeItems.filter((item) => item.score !== null && item.weight > 0);
  if (graded.length === 0) {
    return { percentage: null, gradedWeight: 0, letter: 'N/A', gpaPoints: null };
  }

  const totalWeight = graded.reduce((sum, item) => sum + item.weight, 0);
  const weightedSum = graded.reduce((sum, item) => sum + (item.score ?? 0) * item.weight, 0);
  const percentage = +(weightedSum / totalWeight).toFixed(1);

  const { letter, points } = percentageToLetterAndGpa(percentage);
  return { percentage, gradedWeight: totalWeight, letter, gpaPoints: points };
}

export function percentageToLetterAndGpa(pct: number): { letter: string; points: number } {
  if (pct >= 93) return { letter: 'A', points: 4.0 };
  if (pct >= 90) return { letter: 'A-', points: 3.7 };
  if (pct >= 87) return { letter: 'B+', points: 3.3 };
  if (pct >= 83) return { letter: 'B', points: 3.0 };
  if (pct >= 80) return { letter: 'B-', points: 2.7 };
  if (pct >= 77) return { letter: 'C+', points: 2.3 };
  if (pct >= 73) return { letter: 'C', points: 2.0 };
  if (pct >= 70) return { letter: 'C-', points: 1.7 };
  if (pct >= 67) return { letter: 'D+', points: 1.3 };
  if (pct >= 60) return { letter: 'D', points: 1.0 };
  return { letter: 'F', points: 0.0 };
}

export function calculateCumulativeGPA(courses: Course[]): number | null {
  let totalCredits = 0;
  let totalPoints = 0;
  for (const course of courses) {
    const { gpaPoints } = calculateCourseWeightedGrade(course);
    if (gpaPoints !== null && course.credits > 0) {
      totalCredits += course.credits;
      totalPoints += gpaPoints * course.credits;
    }
  }
  if (totalCredits === 0) return null;
  return +(totalPoints / totalCredits).toFixed(2);
}

export function playStudyChime(): void {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 gentle triad
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);

      gain.gain.setValueAtTime(0.001, now + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.12, now + idx * 0.14 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 0.85);
    });
  } catch {
    // Audio playback gracefully ignored if blocked
  }
}
