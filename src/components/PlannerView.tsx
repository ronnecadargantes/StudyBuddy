import {
  AlertTriangle,
  CheckSquare,
  Plus,
  Search,
  Square,
  Trash2,
} from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { Course, StudyTask, TaskPriority, TaskType } from '../types/study';
import { formatShortDate, getTodayISO } from '../utils/spacedRepetition';

type StatusFilter = 'all' | 'upcoming' | 'overdue' | 'completed';

interface PlannerViewProps {
  courses: Course[];
  tasks: StudyTask[];
  onToggleTask: (taskId: string) => void;
  onAddTask: (task: Omit<StudyTask, 'id'>) => void;
  onDeleteTask: (taskId: string) => void;
}

export function PlannerView({
  courses,
  tasks,
  onToggleTask,
  onAddTask,
  onDeleteTask,
}: PlannerViewProps) {
  const today = getTodayISO();
  const courseMap = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses]);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // New task form
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '');
  const [type, setType] = useState<TaskType>('Assignment');
  const [dueDate, setDueDate] = useState(today);
  const [estimatedMinutes, setEstimatedMinutes] = useState(45);
  const [priority, setPriority] = useState<TaskPriority>('Normal');

  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tasks
      .filter((t) => (courseFilter === 'all' ? true : t.courseId === courseFilter))
      .filter((t) => {
        if (statusFilter === 'upcoming') return !t.completed && t.dueDate >= today;
        if (statusFilter === 'overdue') return !t.completed && t.dueDate < today;
        if (statusFilter === 'completed') return t.completed;
        return true;
      })
      .filter((t) => !q || t.title.toLowerCase().includes(q))
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return a.dueDate.localeCompare(b.dueDate);
      });
  }, [tasks, courseFilter, statusFilter, searchQuery, today]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddTask({
      title: title.trim(),
      courseId: courseId || courses[0]?.id || '',
      type,
      dueDate,
      estimatedMinutes: Math.max(5, Number(estimatedMinutes) || 30),
      priority,
      completed: false,
    });
    setTitle('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg">
            {(
              [
                { id: 'all' as StatusFilter, label: 'All' },
                { id: 'upcoming' as StatusFilter, label: 'Upcoming' },
                { id: 'overdue' as StatusFilter, label: 'Overdue' },
                { id: 'completed' as StatusFilter, label: 'Completed' },
              ]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  statusFilter === tab.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            aria-label="Filter planner by course"
            className="h-9 px-3 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-600"
          >
            <option value="all">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code}
              </option>
            ))}
          </select>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter deliverables..."
              aria-label="Filter deliverables"
              className="h-9 pl-9 pr-3 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm((s) => !s)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Deliverable</span>
        </button>
      </div>

      {/* Add Deliverable Drawer */}
      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4"
        >
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Schedule Assignment or Exam
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <label
                htmlFor="planner-title"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
              >
                Deliverable Title
              </label>
              <input
                id="planner-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Organic Chemistry Exam 2 Review"
                className="w-full h-10 px-3 text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
            </div>

            <div>
              <label
                htmlFor="planner-course"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
              >
                Course
              </label>
              <select
                id="planner-course"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="planner-type"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
              >
                Type
              </label>
              <select
                id="planner-type"
                value={type}
                onChange={(e) => setType(e.target.value as TaskType)}
                className="w-full h-10 px-3 text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
              >
                <option value="Assignment">Assignment</option>
                <option value="Exam">Exam</option>
                <option value="Lab">Lab</option>
                <option value="Reading">Reading</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="planner-due"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
              >
                Due Date
              </label>
              <input
                id="planner-due"
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-10 px-3 text-sm font-mono bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label
                  htmlFor="planner-mins"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
                >
                  Est. Min
                </label>
                <input
                  id="planner-mins"
                  type="number"
                  min={5}
                  step={5}
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                  className="w-full h-10 px-2.5 text-sm font-mono tabular-nums bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
                />
              </div>
              <div>
                <label
                  htmlFor="planner-priority"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
                >
                  Priority
                </label>
                <select
                  id="planner-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full h-10 px-2 text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
                >
                  <option value="High">High</option>
                  <option value="Normal">Normal</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 transition-colors"
            >
              Save Deliverable
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Deliverables Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400">
                <th className="py-3 pl-5 pr-3 w-10">Done</th>
                <th className="py-3 px-3">Deliverable</th>
                <th className="py-3 px-3 whitespace-nowrap">Course</th>
                <th className="py-3 px-3 whitespace-nowrap">Type</th>
                <th className="py-3 px-3 whitespace-nowrap">Priority</th>
                <th className="py-3 px-3 text-right whitespace-nowrap">Due Date</th>
                <th className="py-3 px-3 text-right whitespace-nowrap">Effort</th>
                <th className="py-3 pl-3 pr-5 text-right w-12">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-12 text-center text-sm text-slate-500 dark:text-slate-400"
                  >
                    No deliverables match this filter.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const course = courseMap.get(task.courseId);
                  const isOverdue = !task.completed && task.dueDate < today;

                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 pl-5 pr-3">
                        <button
                          type="button"
                          onClick={() => onToggleTask(task.id)}
                          aria-label={`Toggle completion for ${task.title}`}
                          className="text-slate-400 hover:text-sky-700 dark:hover:text-sky-400 transition-colors"
                        >
                          {task.completed ? (
                            <CheckSquare className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Square className="w-4.5 h-4.5" />
                          )}
                        </button>
                      </td>

                      <td className="py-3 px-3 font-medium">
                        <span
                          className={
                            task.completed
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-900 dark:text-slate-100'
                          }
                        >
                          {task.title}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-xs font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {course ? course.code : 'General'}
                      </td>

                      <td className="py-3 px-3 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {task.type}
                      </td>

                      <td className="py-3 px-3 text-xs whitespace-nowrap">
                        {task.priority === 'High' ? (
                          <span className="inline-flex items-center gap-1 font-medium text-rose-700 dark:text-rose-400">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>High</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 dark:text-slate-400">
                            {task.priority}
                          </span>
                        )}
                      </td>

                      <td
                        className={`py-3 px-3 text-right font-mono tabular-nums text-xs whitespace-nowrap ${
                          isOverdue
                            ? 'text-rose-700 dark:text-rose-400 font-semibold'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {isOverdue ? `Overdue · ${formatShortDate(task.dueDate)}` : formatShortDate(task.dueDate)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {task.estimatedMinutes}m
                      </td>

                      <td className="py-3 pl-3 pr-5 text-right">
                        <button
                          type="button"
                          onClick={() => onDeleteTask(task.id)}
                          aria-label={`Delete ${task.title}`}
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
