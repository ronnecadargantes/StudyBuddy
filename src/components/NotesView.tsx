import { Download, FileText, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Course, NoteMode, StudyNote } from '../types/study';

interface NotesViewProps {
  courses: Course[];
  notes: StudyNote[];
  onCreateNote: (courseId: string) => string;
  onUpdateNote: (noteId: string, patch: Partial<StudyNote>) => void;
  onDeleteNote: (noteId: string) => void;
}

export function NotesView({
  courses,
  notes,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
}: NotesViewProps) {
  const courseMap = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses]);

  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(notes[0]?.id ?? null);
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');

  const filteredNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return notes
      .filter((n) => (courseFilter === 'all' ? true : n.courseId === courseFilter))
      .filter(
        (n) =>
          !q ||
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.cues.toLowerCase().includes(q)
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [notes, courseFilter, searchQuery]);

  const activeNote = useMemo(
    () => notes.find((n) => n.id === selectedNoteId) ?? filteredNotes[0] ?? null,
    [notes, selectedNoteId, filteredNotes]
  );

  const handleCreate = () => {
    const targetCourse = courseFilter !== 'all' ? courseFilter : courses[0]?.id ?? '';
    const newId = onCreateNote(targetCourse);
    setSelectedNoteId(newId);
  };

  const handleExportMarkdown = (note: StudyNote) => {
    const course = courseMap.get(note.courseId);
    const lines = [
      `# ${note.title}`,
      course ? `Course: ${course.code} — ${course.name}` : '',
      `Format: ${note.mode === 'cornell' ? 'Cornell Notes' : 'Outline'}`,
      '',
    ];

    if (note.mode === 'cornell' && note.cues.trim()) {
      lines.push('## Cues & Questions', note.cues, '');
    }

    lines.push('## Notes', note.content, '');

    if (note.mode === 'cornell' && note.summary.trim()) {
      lines.push('## Summary', note.summary, '');
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'study-note'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const wordCount = activeNote
    ? `${activeNote.cues} ${activeNote.content} ${activeNote.summary}`
        .trim()
        .split(/\s+/)
        .filter(Boolean).length
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Pane: Notes Directory */}
      <aside className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Course Notebook
          </h2>
          <button
            type="button"
            onClick={handleCreate}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Note</span>
          </button>
        </div>

        <div className="space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              aria-label="Search study notes"
              className="w-full h-9 pl-9 pr-3 text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600"
            />
          </div>

          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            aria-label="Filter notes by course"
            className="w-full h-9 px-3 text-xs font-medium bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-600"
          >
            <option value="all">All Courses ({notes.length})</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-[540px] overflow-y-auto">
          {filteredNotes.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400">
              No matching notes found.
            </div>
          ) : (
            filteredNotes.map((note) => {
              const course = courseMap.get(note.courseId);
              const isSelected = activeNote?.id === note.id;
              const dateLabel = new Date(note.updatedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              });

              return (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => setSelectedNoteId(note.id)}
                  className={`w-full text-left py-3 px-2.5 rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-sky-50 dark:bg-sky-950/40'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {note.title || 'Untitled Note'}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums truncate">
                    {course ? `${course.code} · ` : ''}
                    {note.mode === 'cornell' ? 'Cornell' : 'Outline'} · {dateLabel}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Right Pane: Structured Note Editor */}
      <section className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        {!activeNote ? (
          <div className="py-20 text-center space-y-3">
            <FileText className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Select a note from the notebook or create a new study page.
            </p>
            <button
              type="button"
              onClick={handleCreate}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-sky-700 hover:bg-sky-800 text-white transition-colors"
            >
              Create Note
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Note Meta Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={activeNote.courseId}
                  onChange={(e) => onUpdateNote(activeNote.id, { courseId: e.target.value })}
                  aria-label="Note course"
                  className="h-9 px-3 text-xs font-medium bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-600"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </option>
                  ))}
                </select>

                {/* Format mode toggle */}
                <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  {(
                    [
                      { id: 'cornell' as NoteMode, label: 'Cornell' },
                      { id: 'standard' as NoteMode, label: 'Outline' },
                    ]
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => onUpdateNote(activeNote.id, { mode: m.id })}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                        activeNote.mode === m.id
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono tabular-nums text-slate-400 dark:text-slate-500 mr-1">
                  {wordCount} words
                </span>
                <button
                  type="button"
                  onClick={() => handleExportMarkdown(activeNote)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export .md</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteNote(activeNote.id);
                    setSelectedNoteId(null);
                  }}
                  aria-label="Delete note"
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Note Title */}
            <input
              type="text"
              value={activeNote.title}
              onChange={(e) => onUpdateNote(activeNote.id, { title: e.target.value })}
              placeholder="Lecture or topic title..."
              aria-label="Note title"
              className="w-full font-display text-2xl font-semibold text-slate-900 dark:text-slate-50 bg-transparent border-0 focus:outline-none placeholder:text-slate-400"
            />

            {/* Cornell 3-zone layout or Standard single-pane */}
            {activeNote.mode === 'cornell' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-4">
                    <label
                      htmlFor="note-cues"
                      className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5"
                    >
                      Cues & Key Questions
                    </label>
                    <textarea
                      id="note-cues"
                      rows={14}
                      value={activeNote.cues}
                      onChange={(e) => onUpdateNote(activeNote.id, { cues: e.target.value })}
                      placeholder="Write recall questions, keywords, or formulas to test yourself later..."
                      className="w-full p-3.5 text-sm leading-relaxed bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600 resize-y"
                    />
                  </div>

                  <div className="md:col-span-8">
                    <label
                      htmlFor="note-body"
                      className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5"
                    >
                      Detailed Lecture Notes
                    </label>
                    <textarea
                      id="note-body"
                      rows={14}
                      value={activeNote.content}
                      onChange={(e) => onUpdateNote(activeNote.id, { content: e.target.value })}
                      placeholder="Capture definitions, mechanisms, proofs, and lecture examples..."
                      className="w-full p-3.5 text-sm leading-relaxed bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600 resize-y"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="note-summary"
                    className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5"
                  >
                    Synthesized Summary
                  </label>
                  <textarea
                    id="note-summary"
                    rows={3}
                    value={activeNote.summary}
                    onChange={(e) => onUpdateNote(activeNote.id, { summary: e.target.value })}
                    placeholder="Distill the core takeaway of this page in 1–2 sentences..."
                    className="w-full p-3.5 text-sm leading-relaxed bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600 resize-y"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label
                  htmlFor="note-standard-body"
                  className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5"
                >
                  Study Outline
                </label>
                <textarea
                  id="note-standard-body"
                  rows={18}
                  value={activeNote.content}
                  onChange={(e) => onUpdateNote(activeNote.id, { content: e.target.value })}
                  placeholder="Write structured study notes..."
                  className="w-full p-4 text-sm leading-relaxed bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600 resize-y"
                />
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
