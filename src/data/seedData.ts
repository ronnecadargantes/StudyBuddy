import {
  Course,
  FlashcardDeck,
  FocusSession,
  StudyNote,
  StudyTask,
  TimerPreset,
} from '../types/study';
import { addDaysISO, getTodayISO } from '../utils/spacedRepetition';

export const TIMER_PRESETS: TimerPreset[] = [
  { id: 'pomodoro', label: '25m Focus', minutes: 25, isBreak: false },
  { id: 'deep', label: '50m Deep Work', minutes: 50, isBreak: false },
  { id: 'short-break', label: '5m Break', minutes: 5, isBreak: true },
  { id: 'long-break', label: '15m Reset', minutes: 15, isBreak: true },
];

export function createSeedData(): {
  courses: Course[];
  tasks: StudyTask[];
  decks: FlashcardDeck[];
  notes: StudyNote[];
  sessions: FocusSession[];
} {
  const today = getTodayISO();

  const courses: Course[] = [
    {
      id: 'c-neuro',
      code: 'NEURO 204',
      name: 'Cellular Neurobiology',
      instructor: 'Prof. Elena Vance',
      credits: 4,
      schedule: 'Mon / Wed / Fri · 10:00 AM',
      accentColor: 'sky',
      gradeItems: [
        { id: 'g-1', title: 'Lab Report 1: Patch Clamp', weight: 15, score: 94 },
        { id: 'g-2', title: 'Midterm Examination', weight: 30, score: 89 },
        { id: 'g-3', title: 'Synaptic Mechanisms Quiz', weight: 15, score: 92 },
        { id: 'g-4', title: 'Final Cumulative Exam', weight: 40, score: null },
      ],
    },
    {
      id: 'c-math',
      code: 'MATH 240',
      name: 'Linear Algebra & Eigenvalues',
      instructor: 'Dr. Marcus Chen',
      credits: 4,
      schedule: 'Tue / Thu · 1:30 PM',
      accentColor: 'emerald',
      gradeItems: [
        { id: 'g-5', title: 'Problem Sets 1–5', weight: 25, score: 96 },
        { id: 'g-6', title: 'Midterm 1: Vector Spaces', weight: 25, score: 87 },
        { id: 'g-7', title: 'Midterm 2: Orthogonality', weight: 25, score: null },
        { id: 'g-8', title: 'Final Exam', weight: 25, score: null },
      ],
    },
    {
      id: 'c-hist',
      code: 'HIST 312',
      name: 'Modern European Thought',
      instructor: 'Prof. Claire Beaumont',
      credits: 3,
      schedule: 'Tue / Thu · 10:30 AM',
      accentColor: 'amber',
      gradeItems: [
        { id: 'g-9', title: 'Primary Source Essay', weight: 30, score: 91 },
        { id: 'g-10', title: 'Seminar Participation', weight: 20, score: 95 },
        { id: 'g-11', title: 'Historiography Research Paper', weight: 50, score: null },
      ],
    },
    {
      id: 'c-chem',
      code: 'CHEM 215',
      name: 'Organic Structure & Reactivity',
      instructor: 'Dr. Arjun Patel',
      credits: 4,
      schedule: 'Mon / Wed · 2:00 PM',
      accentColor: 'violet',
      gradeItems: [
        { id: 'g-12', title: 'Spectroscopy Lab Practical', weight: 20, score: 88 },
        { id: 'g-13', title: 'Exam 1: Stereochemistry', weight: 25, score: 84 },
        { id: 'g-14', title: 'Exam 2: Carbonyl Reactions', weight: 25, score: null },
        { id: 'g-15', title: 'ACS Final Exam', weight: 30, score: null },
      ],
    },
  ];

  const tasks: StudyTask[] = [
    {
      id: 't-1',
      title: 'Complete Problem Set 6: Diagonalization & SVD',
      courseId: 'c-math',
      type: 'Assignment',
      dueDate: today,
      estimatedMinutes: 60,
      priority: 'High',
      completed: false,
      notes: 'Focus on Gram-Schmidt proof in Question 4.',
    },
    {
      id: 't-2',
      title: 'Annotate Hodgkin-Huxley Action Potential Paper',
      courseId: 'c-neuro',
      type: 'Reading',
      dueDate: addDaysISO(today, 1),
      estimatedMinutes: 45,
      priority: 'Normal',
      completed: false,
    },
    {
      id: 't-3',
      title: 'Midterm 2: Orthogonality & Spectral Theorem',
      courseId: 'c-math',
      type: 'Exam',
      dueDate: addDaysISO(today, 3),
      estimatedMinutes: 120,
      priority: 'High',
      completed: false,
    },
    {
      id: 't-4',
      title: 'Draft Outline for Enlightenment Historiography Paper',
      courseId: 'c-hist',
      type: 'Assignment',
      dueDate: addDaysISO(today, 4),
      estimatedMinutes: 75,
      priority: 'Normal',
      completed: false,
    },
    {
      id: 't-5',
      title: 'Recrystallization & Melting Point Lab Write-up',
      courseId: 'c-chem',
      type: 'Lab',
      dueDate: addDaysISO(today, -1),
      estimatedMinutes: 40,
      priority: 'High',
      completed: false,
    },
    {
      id: 't-6',
      title: 'Review SN1 vs SN2 Reaction Mechanisms',
      courseId: 'c-chem',
      type: 'Reading',
      dueDate: today,
      estimatedMinutes: 30,
      priority: 'Low',
      completed: true,
    },
  ];

  const decks: FlashcardDeck[] = [
    {
      id: 'd-neuro',
      title: 'Ion Channels & Action Potentials',
      courseId: 'c-neuro',
      description: 'Membrane biophysics, Nernst equilibrium, and synaptic vesicle release.',
      cards: [
        {
          id: 'fc-1',
          front: 'What drives the rapid depolarization phase of a neuronal action potential?',
          back: 'Voltage-gated Na+ channels open rapidly once threshold (-55 mV) is reached, allowing Na+ influx down its electrochemical gradient toward +60 mV.',
          hint: 'Threshold is ~ -55 mV',
          intervalDays: 0,
          easeFactor: 2.5,
          repetitions: 0,
          dueDate: today,
        },
        {
          id: 'fc-2',
          front: 'What is the role of the Goldman-Hodgkin-Katz (GHK) equation compared to Nernst?',
          back: 'Nernst calculates the equilibrium potential for a single ion, whereas GHK computes resting membrane potential across multiple permeable ions weighted by their relative permeabilities (P_K, P_Na, P_Cl).',
          hint: 'Multiple ions + permeability weights',
          intervalDays: 1,
          easeFactor: 2.5,
          repetitions: 1,
          dueDate: today,
        },
        {
          id: 'fc-3',
          front: 'Which Ca2+-sensing protein on synaptic vesicles triggers SNARE-mediated fusion?',
          back: 'Synaptotagmin binds Ca2+ entering through voltage-gated calcium channels and catalyzes rapid vesicle exocytosis.',
          hint: 'Starts with Synapto-',
          intervalDays: 0,
          easeFactor: 2.5,
          repetitions: 0,
          dueDate: today,
        },
        {
          id: 'fc-4',
          front: 'What prevents an action potential from propagating backward along an axon?',
          back: 'The absolute refractory period caused by the inactivation gate (ball-and-chain) of voltage-gated Na+ channels immediately behind the depolarizing wavefront.',
          intervalDays: 4,
          easeFactor: 2.6,
          repetitions: 2,
          dueDate: addDaysISO(today, 2),
        },
      ],
    },
    {
      id: 'd-math',
      title: 'Eigenvalues & Spectral Theorem',
      courseId: 'c-math',
      description: 'Core theorems on symmetric matrices, orthogonal bases, and SVD.',
      cards: [
        {
          id: 'fc-5',
          front: 'State the Real Spectral Theorem for an n x n symmetric matrix A.',
          back: 'Every real symmetric matrix has n real eigenvalues and can be orthogonally diagonalized as A = Q D Q^T, where Q has orthonormal eigenvectors.',
          hint: 'Think A = Q D Q^T',
          intervalDays: 0,
          easeFactor: 2.5,
          repetitions: 0,
          dueDate: today,
        },
        {
          id: 'fc-6',
          front: 'What is the geometric meaning of the determinant of a square matrix?',
          back: 'It is the signed scaling factor by which the linear transformation multiplies area (in R^2) or volume (in R^3); zero determinant means collapse into lower dimension.',
          intervalDays: 0,
          easeFactor: 2.5,
          repetitions: 0,
          dueDate: today,
        },
        {
          id: 'fc-7',
          front: 'How are the singular values of A related to A^T A?',
          back: 'The nonzero singular values sigma_i of A are the square roots of the nonzero eigenvalues of the symmetric positive semidefinite matrix A^T A.',
          intervalDays: 3,
          easeFactor: 2.5,
          repetitions: 2,
          dueDate: addDaysISO(today, 3),
        },
      ],
    },
    {
      id: 'd-chem',
      title: 'Organic Functional Groups & Reagents',
      courseId: 'c-chem',
      description: 'Key stereochemistry rules, nucleophilic substitution, and carbonyl reagents.',
      cards: [
        {
          id: 'fc-8',
          front: 'Why do polar aprotic solvents (DMSO, acetone) accelerate SN2 reactions?',
          back: 'They solvate cations well without hydrogen-bonding to the nucleophile, leaving the anion "naked" and far more reactive.',
          hint: 'Contrast with protic solvents like H2O or EtOH',
          intervalDays: 0,
          easeFactor: 2.5,
          repetitions: 0,
          dueDate: today,
        },
        {
          id: 'fc-9',
          front: 'Compare NaBH4 vs. LiAlH4 selectivity in carbonyl reductions.',
          back: 'NaBH4 is milder and reduces only aldehydes and ketones. LiAlH4 is a strong hydride donor that reduces aldehydes, ketones, esters, and carboxylic acids.',
          intervalDays: 0,
          easeFactor: 2.5,
          repetitions: 0,
          dueDate: today,
        },
      ],
    },
  ];

  const notes: StudyNote[] = [
    {
      id: 'n-1',
      title: 'Lecture 14: Synaptic Plasticity & LTP',
      courseId: 'c-neuro',
      mode: 'cornell',
      cues:
        'Why is NMDA receptor a "coincidence detector"?\n\nWhat relieves the Mg2+ block?\n\nAMPA insertion mechanism?\n\nEarly vs Late LTP?',
      content:
        'Long-Term Potentiation (LTP) in hippocampal CA1 pyramidal neurons requires simultaneous presynaptic glutamate release AND postsynaptic depolarization.\n\n1. Coincidence Detection\n- Glutamate binds both AMPA and NMDA receptors.\n- At resting potential (-70 mV), NMDA pore is occluded by extracellular Mg2+.\n- Strong AMPA-mediated Na+ influx depolarizes the spine, electrostatically expelling Mg2+.\n\n2. Calcium Second Messenger Cascade\n- Ca2+ enters through unblocked NMDA channels.\n- Activates CaMKII -> phosphorylates existing AMPA receptors and drives exocytosis of new AMPA receptors to the postsynaptic density.\n\n3. Late-Phase LTP (>3 hours)\n- Requires CREB transcription and new protein synthesis for structural spine enlargement.',
      summary:
        'NMDA receptors convert simultaneous pre- and postsynaptic activity into a Ca2+ signal that upregulates AMPA receptors, strengthening the synapse.',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'n-2',
      title: 'Gram-Schmidt & QR Factorization',
      courseId: 'c-math',
      mode: 'cornell',
      cues:
        'Formula for orthogonal projection?\n\nWhy factor A = QR?\n\nLeast squares normal equation shortcut?',
      content:
        'Given linearly independent vectors {a1, a2, ..., an}, Gram-Schmidt iteratively subtracts projections onto previously constructed orthogonal vectors:\n\n  q_k_raw = a_k - sum_{j=1}^{k-1} (q_j^T a_k) q_j\n  q_k = q_k_raw / ||q_k_raw||\n\nMatrix Form: A = Q R\n- Q has orthonormal columns (Q^T Q = I).\n- R is upper triangular with positive diagonal entries.\n\nApplication to Least Squares (Ax ≈ b):\nInstead of solving ill-conditioned A^T A x = A^T b, substitute A = QR:\n  R x_hat = Q^T b\nSolved cleanly via back-substitution.',
      summary:
        'QR decomposition turns any full-column-rank matrix into an orthonormal basis Q and upper-triangular R, making least-squares numerically stable.',
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'n-3',
      title: 'Kant: What Is Enlightenment? (1784) Reading Notes',
      courseId: 'c-hist',
      mode: 'standard',
      cues: '',
      content:
        'Core Thesis: "Sapere aude!" — Have courage to use your own understanding without guidance from another.\n\nKey Distinction: Public vs. Private Use of Reason\n- Public use: Reason exercised as a scholar addressing the reading public at large (must always be free).\n- Private use: Reason exercised within an institutional civic post (e.g., an officer obeying orders, a clergyman teaching church doctrine) — may be restricted for civic order.\n\nHistorical Context:\nWritten during the reign of Frederick the Great of Prussia; argues gradual intellectual reform rather than sudden political revolution.',
      summary: '',
      updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
  ];

  const sessions: FocusSession[] = [
    { id: 's-1', courseId: 'c-neuro', minutes: 50, date: addDaysISO(today, -6), label: 'Action Potential Biophysics' },
    { id: 's-2', courseId: 'c-math', minutes: 75, date: addDaysISO(today, -5), label: 'Problem Set 5' },
    { id: 's-3', courseId: 'c-hist', minutes: 45, date: addDaysISO(today, -4), label: 'Kant Primary Source' },
    { id: 's-4', courseId: 'c-chem', minutes: 50, date: addDaysISO(today, -3), label: 'Stereochemistry Drill' },
    { id: 's-5', courseId: 'c-neuro', minutes: 60, date: addDaysISO(today, -2), label: 'Synaptic Plasticity Notes' },
    { id: 's-6', courseId: 'c-math', minutes: 90, date: addDaysISO(today, -1), label: 'Eigenvalue Practice' },
    { id: 's-7', courseId: 'c-neuro', minutes: 25, date: today, label: 'Morning Recall Session' },
  ];

  return { courses, tasks, decks, notes, sessions };
}
