import { Plus, RotateCcw, Trash2 } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { Course, GradeItem } from '../types/study';
import {
  calculateCourseWeightedGrade,
  calculateCumulativeGPA,
} from '../utils/spacedRepetition';

interface CoursesViewProps {
  courses: Course[];
  onAddCourse: (course: Omit<Course, 'id' | 'gradeItems'>) => string;
  onDeleteCourse: (courseId: string) => void;
  onAddGradeItem: (courseId: string, item: Omit<GradeItem, 'id'>) => void;
  onUpdateGradeItem: (
    courseId: string,
    itemId: string,
    patch: Partial<GradeItem>
  ) => void;
  onDeleteGradeItem: (courseId: string, itemId: string) => void;
  onResetDemoData: () => void;
}

export function CoursesView({
  courses,
  onAddCourse,
  onDeleteCourse,
  onAddGradeItem,
  onUpdateGradeItem,
  onDeleteGradeItem,
  onResetDemoData,
}: CoursesViewProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(
    courses[0]?.id ?? null
  );
  const [showAddCourse, setShowAddCourse] = useState(false);

  // Add Course form
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [instructor, setInstructor] = useState('');
  const [credits, setCredits] = useState(3);
  const [schedule, setSchedule] = useState('');

  // Add Grade item form
  const [itemTitle, setItemTitle] = useState('');
  const [itemWeight, setItemWeight] = useState(20);
  const [itemScore, setItemScore] = useState('');

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === selectedCourseId) ?? courses[0] ?? null,
    [courses, selectedCourseId]
  );

  const cumulativeGPA = calculateCumulativeGPA(courses);
  const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);

  const handleCreateCourse = (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    const id = onAddCourse({
      code: code.trim().toUpperCase(),
      name: name.trim(),
      instructor: instructor.trim() || 'TBA',
      credits: Math.max(1, Number(credits) || 3),
      schedule: schedule.trim() || 'Schedule TBA',
      accentColor: 'sky',
    });
    setCode('');
    setName('');
    setInstructor('');
    setSchedule('');
    setShowAddCourse(false);
    setSelectedCourseId(id);
  };

  const handleAddGrade = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !itemTitle.trim()) return;
    const parsedScore = itemScore.trim() === '' ? null : Math.min(100, Math.max(0, Number(itemScore)));
    onAddGradeItem(selectedCourse.id, {
      title: itemTitle.trim(),
      weight: Math.max(1, Number(itemWeight) || 10),
      score: Number.isNaN(parsedScore) ? null : parsedScore,
    });
    setItemTitle('');
    setItemScore('');
  };

  return (
    <div className="space-y-6">
      {/* Top GPA Summary + Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
        <div className="flex flex-wrap items-baseline gap-6">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Cumulative Term GPA
            </div>
            <div className="mt-1 font-mono tabular-nums text-2xl font-semibold text-slate-900 dark:text-slate-50">
              {cumulativeGPA !== null ? cumulativeGPA.toFixed(2) : '—'}
            </div>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {courses.length} enrolled courses · {totalCredits} total credits
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onResetDemoData}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Sample Data</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddCourse((s) => !s)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Course</span>
          </button>
        </div>
      </div>

      {/* Add Course Drawer */}
      {showAddCourse && (
        <form
          onSubmit={handleCreateCourse}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4"
        >
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Enroll in Course
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label
                htmlFor="course-code"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
              >
                Course Code
              </label>
              <input
                id="course-code"
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. CS 301"
                className="w-full h-10 px-3 text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
            </div>

            <div className="lg:col-span-2">
              <label
                htmlFor="course-name"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
              >
                Course Title
              </label>
              <input
                id="course-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Algorithms & Complexity"
                className="w-full h-10 px-3 text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
            </div>

            <div>
              <label
                htmlFor="course-instructor"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
              >
                Instructor
              </label>
              <input
                id="course-instructor"
                type="text"
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                placeholder="Prof. Name"
                className="w-full h-10 px-3 text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label
                  htmlFor="course-credits"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
                >
                  Credits
                </label>
                <input
                  id="course-credits"
                  type="number"
                  min={1}
                  max={6}
                  value={credits}
                  onChange={(e) => setCredits(Number(e.target.value))}
                  className="w-full h-10 px-2.5 text-sm font-mono tabular-nums bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
                />
              </div>
              <div>
                <label
                  htmlFor="course-schedule"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
                >
                  Schedule
                </label>
                <input
                  id="course-schedule"
                  type="text"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  placeholder="MWF 11am"
                  className="w-full h-10 px-2.5 text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 transition-colors"
            >
              Add Course
            </button>
            <button
              type="button"
              onClick={() => setShowAddCourse(false)}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* 2-Column Split: Courses Directory + Syllabus Gradebook */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-200 dark:divide-slate-800">
          {courses.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No courses enrolled yet. Add your first course above.
            </div>
          ) : (
            courses.map((course) => {
              const grade = calculateCourseWeightedGrade(course);
              const isSelected = selectedCourse?.id === course.id;

              return (
                <div
                  key={course.id}
                  onClick={() => setSelectedCourseId(course.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setSelectedCourseId(course.id);
                  }}
                  className={`p-5 cursor-pointer transition-colors flex items-start justify-between gap-4 ${
                    isSelected
                      ? 'bg-sky-50/70 dark:bg-sky-950/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      {course.code} · {course.credits} credits
                    </div>
                    <h3 className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {course.name}
                    </h3>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {course.instructor} · {course.schedule}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono tabular-nums text-base font-semibold text-slate-900 dark:text-slate-100">
                      {grade.letter}
                    </div>
                    <div className="font-mono tabular-nums text-xs text-slate-500 dark:text-slate-400">
                      {grade.percentage !== null ? `${grade.percentage}%` : 'No grades'}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Selected Course Syllabus Gradebook */}
        <section className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
          {!selectedCourse ? (
            <div className="py-16 text-center text-sm text-slate-500 dark:text-slate-400">
              Select a course to view and simulate its syllabus grades.
            </div>
          ) : (
            (() => {
              const grade = calculateCourseWeightedGrade(selectedCourse);
              const totalSyllabusWeight = selectedCourse.gradeItems.reduce(
                (s, i) => s + i.weight,
                0
              );

              return (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        {selectedCourse.code} · Syllabus Grade Calculator
                      </div>
                      <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-50">
                        {selectedCourse.name}
                      </h2>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-mono tabular-nums text-2xl font-semibold text-slate-900 dark:text-slate-50">
                          {grade.percentage !== null ? `${grade.percentage}%` : '—'}{' '}
                          <span className="text-sky-700 dark:text-sky-400">{grade.letter}</span>
                        </div>
                        <div className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                          {grade.gradedWeight}% of {totalSyllabusWeight}% graded
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteCourse(selectedCourse.id)}
                        aria-label={`Delete ${selectedCourse.name}`}
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Grade Items Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400">
                          <th className="py-2.5 pr-3">Assessment</th>
                          <th className="py-2.5 px-3 text-right">Weight %</th>
                          <th className="py-2.5 px-3 text-right">Score %</th>
                          <th className="py-2.5 pl-3 text-right w-10">Remove</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                        {selectedCourse.gradeItems.length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="py-6 text-center text-xs text-slate-500 dark:text-slate-400"
                            >
                              No assessments added yet. Add exams or assignments below.
                            </td>
                          </tr>
                        ) : (
                          selectedCourse.gradeItems.map((item) => (
                            <tr key={item.id}>
                              <td className="py-2.5 pr-3 font-medium text-slate-900 dark:text-slate-100">
                                {item.title}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                                {item.weight}%
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  step={0.5}
                                  placeholder="—"
                                  aria-label={`Score for ${item.title}`}
                                  value={item.score ?? ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    onUpdateGradeItem(selectedCourse.id, item.id, {
                                      score:
                                        val === ''
                                          ? null
                                          : Math.min(100, Math.max(0, Number(val))),
                                    });
                                  }}
                                  className="w-20 h-8 px-2 text-right font-mono tabular-nums text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
                                />
                              </td>
                              <td className="py-2.5 pl-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => onDeleteGradeItem(selectedCourse.id, item.id)}
                                  aria-label={`Delete ${item.title}`}
                                  className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Add Assessment Row */}
                  <form
                    onSubmit={handleAddGrade}
                    className="pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
                  >
                    <div className="sm:col-span-6">
                      <label
                        htmlFor="grade-item-title"
                        className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
                      >
                        Add Syllabus Component
                      </label>
                      <input
                        id="grade-item-title"
                        type="text"
                        required
                        value={itemTitle}
                        onChange={(e) => setItemTitle(e.target.value)}
                        placeholder="e.g. Final Paper"
                        className="w-full h-9 px-3 text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label
                        htmlFor="grade-item-weight"
                        className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
                      >
                        Weight %
                      </label>
                      <input
                        id="grade-item-weight"
                        type="number"
                        min={1}
                        max={100}
                        value={itemWeight}
                        onChange={(e) => setItemWeight(Number(e.target.value))}
                        className="w-full h-9 px-2.5 text-sm font-mono tabular-nums bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label
                        htmlFor="grade-item-score"
                        className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
                      >
                        Score %
                      </label>
                      <input
                        id="grade-item-score"
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        placeholder="Optional"
                        value={itemScore}
                        onChange={(e) => setItemScore(e.target.value)}
                        className="w-full h-9 px-2.5 text-sm font-mono tabular-nums bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <button
                        type="submit"
                        className="w-full h-9 px-3 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </form>
                </>
              );
            })()
          )}
        </section>
      </div>
    </div>
  );
}
