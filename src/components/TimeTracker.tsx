import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppState } from '../hooks/useAppState';
import { TimeEntry } from '../types';
import { parseLocalDate } from '../utils/storage';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Calculate how many entries will be created
const calculateEntryCount = (
  startDate: string,
  pattern: 'none' | 'daily-weekdays' | 'weekly',
  repeatMode: 'weeks' | 'until-date',
  weeks: string,
  endDate: string
): number => {
  if (pattern === 'none') return 0;

  const start = new Date(startDate);
  let end: Date;

  if (repeatMode === 'weeks') {
    const numWeeks = parseInt(weeks) || 4;
    if (pattern === 'daily-weekdays') {
      return numWeeks * 5; // Approximate
    } else {
      return numWeeks;
    }
  } else {
    if (!endDate) return 0;
    end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (pattern === 'daily-weekdays') {
      // Approximate weekdays
      return Math.floor(diffDays / 7) * 5;
    } else {
      // Weekly
      return Math.ceil(diffDays / 7);
    }
  }
};

const generateRecurringEntries = (
  startDate: Date,
  pattern: 'daily-weekdays' | 'weekly',
  weeklyDay: number,
  weeks: number | null,
  endDate: Date | null,
  baseEntry: any
) => {
  const entries = [];
  const seriesId = Date.now().toString(36) + Math.random().toString(36).substr(2);

  if (pattern === 'daily-weekdays') {
    // Generate weekday entries
    let currentDate = new Date(startDate);
    let weeksProcessed = 0;

    while (true) {
      // Check stop conditions
      if (weeks !== null && weeksProcessed >= weeks) break;
      if (endDate !== null && currentDate > endDate) break;

      const dayOfWeek = currentDate.getDay();
      // Monday (1) through Friday (5)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        entries.push({
          ...baseEntry,
          date: new Date(currentDate),
          isRecurring: true,
          recurringPattern: pattern,
          recurringSeriesId: seriesId
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);

      // Count weeks (every Sunday marks a new week)
      if (dayOfWeek === 0 && entries.length > 0) {
        weeksProcessed++;
      }
    }
  } else if (pattern === 'weekly') {
    // Generate weekly entries on specific day
    let currentDate = new Date(startDate);

    // Adjust to the first occurrence of the target day
    while (currentDate.getDay() !== weeklyDay) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    let count = 0;
    while (true) {
      // Check stop conditions
      if (weeks !== null && count >= weeks) break;
      if (endDate !== null && currentDate > endDate) break;

      entries.push({
        ...baseEntry,
        date: new Date(currentDate),
        isRecurring: true,
        recurringPattern: pattern,
        recurringDay: weeklyDay,
        recurringSeriesId: seriesId
      });

      currentDate.setDate(currentDate.getDate() + 7);
      count++;
    }
  }

  return entries;
};

// Get the current school year label (e.g., "2024-2025")
const getCurrentSchoolYear = (): string => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  // School year starts July 1 (month 6)
  return currentMonth >= 6
    ? `${currentYear}-${currentYear + 1}`
    : `${currentYear - 1}-${currentYear}`;
};

// Get school year start and end dates from label (e.g., "2024-2025" -> { start: Date, end: Date })
const getSchoolYearDates = (schoolYearLabel: string): { start: Date; end: Date } => {
  const [startYear] = schoolYearLabel.split('-').map(Number);
  return {
    start: new Date(startYear, 6, 1), // July 1
    end: new Date(startYear + 1, 5, 30, 23, 59, 59) // June 30
  };
};

const TimeTracker: React.FC = () => {
  const { state, dispatch } = useAppState();
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [keepFormOpen, setKeepFormOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [showTagManagement, setShowTagManagement] = useState(false);
  const [tagManagementMode, setTagManagementMode] = useState<'add' | 'replace' | 'remove'>('add');
  const [bulkTagInput, setBulkTagInput] = useState('');
  const masterCheckboxRef = useRef<HTMLInputElement>(null);
  const [filters, setFilters] = useState({
    schoolYear: getCurrentSchoolYear(),
    student: 'all',
    subject: 'all',
    location: 'all',
    dateFrom: '',
    dateTo: '',
    searchTags: '',
    searchNotes: ''
  });
  const [formData, setFormData] = useState({
    subjectId: '',
    date: new Date().toISOString().split('T')[0],
    duration: '',
    location: 'Home' as 'Home' | 'Away',
    notes: '',
    tags: '',
    recurringPattern: 'none' as 'none' | 'daily-weekdays' | 'weekly',
    recurringDay: 0,
    recurringWeeks: '4',
    repeatMode: 'weeks' as 'weeks' | 'until-date',
    recurringEndDate: ''
  });

  // Calculate available school years from the data
  const availableSchoolYears = useMemo(() => {
    if (state.timeEntries.length === 0) {
      return [getCurrentSchoolYear()];
    }

    const years = new Set<string>();

    state.timeEntries.forEach(entry => {
      const entryDate = new Date(entry.date);
      const entryYear = entryDate.getFullYear();
      const entryMonth = entryDate.getMonth();

      // Determine which school year this entry belongs to
      const schoolYearLabel = entryMonth >= 6
        ? `${entryYear}-${entryYear + 1}`
        : `${entryYear - 1}-${entryYear}`;

      years.add(schoolYearLabel);
    });

    // Always include current school year
    years.add(getCurrentSchoolYear());

    // Sort in descending order (most recent first)
    return Array.from(years).sort((a, b) => {
      const [yearA] = a.split('-').map(Number);
      const [yearB] = b.split('-').map(Number);
      return yearB - yearA;
    });
  }, [state.timeEntries]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudents.size === 0 || !formData.subjectId || !formData.duration) return;

    // Parse tags from comma-separated string
    const parsedTags = formData.tags
      ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      : [];

    const baseEntryData = {
      subjectId: formData.subjectId,
      duration: parseInt(formData.duration),
      location: formData.location,
      notes: formData.notes || undefined,
      tags: parsedTags.length > 0 ? parsedTags : undefined
    };

    if (editingEntry) {
      // When editing, update single entry (no recurring, single student)
      dispatch({
        type: 'UPDATE_TIME_ENTRY',
        id: editingEntry.id,
        updates: {
          ...baseEntryData,
          studentId: Array.from(selectedStudents)[0], // Use the first (and only) selected student
          date: parseLocalDate(formData.date)
        }
      });
      setEditingEntry(null);
      setKeepFormOpen(false);
    } else {
      // Creating new entry/entries for each selected student
      selectedStudents.forEach(studentId => {
        const studentEntryData = {
          ...baseEntryData,
          studentId
        };

        if (formData.recurringPattern === 'none') {
          // Single entry for this student
          dispatch({
            type: 'ADD_TIME_ENTRY',
            entry: {
              ...studentEntryData,
              date: parseLocalDate(formData.date)
            }
          });
        } else {
          // Add "Recurring" tag to recurring entries
          const recurringTags = [...(studentEntryData.tags || [])];
          if (!recurringTags.includes('Recurring')) {
            recurringTags.push('Recurring');
          }
          const recurringEntryData = {
            ...studentEntryData,
            tags: recurringTags.length > 0 ? recurringTags : undefined
          };
          // Generate recurring entries for this student
          const startDate = parseLocalDate(formData.date);
          const weeks = formData.repeatMode === 'weeks' ? (parseInt(formData.recurringWeeks) || 4) : null;
          const endDate = formData.repeatMode === 'until-date' && formData.recurringEndDate
            ? parseLocalDate(formData.recurringEndDate)
            : null;
          const entries = generateRecurringEntries(
            startDate,
            formData.recurringPattern,
            formData.recurringDay,
            weeks,
            endDate,
            recurringEntryData
          );

          // Dispatch all recurring entries for this student
          entries.forEach(entry => {
            dispatch({
              type: 'ADD_TIME_ENTRY',
              entry
            });
          });
        }
      });
    }

    if (editingEntry || !keepFormOpen) {
      // Full reset when editing or not keeping form open
      setFormData({
        subjectId: '',
        date: new Date().toISOString().split('T')[0],
        duration: '',
        location: 'Home',
        notes: '',
        tags: '',
        recurringPattern: 'none',
        recurringDay: 0,
        recurringWeeks: '4',
        repeatMode: 'weeks',
        recurringEndDate: ''
      });
      setSelectedStudents(new Set());
      setShowForm(false);
    } else {
      // Keep students and date, clear other fields
      setFormData({
        ...formData,
        subjectId: '',
        duration: '',
        location: 'Home',
        notes: '',
        tags: '',
        recurringPattern: 'none',
        recurringDay: 0,
        recurringWeeks: '4',
        repeatMode: 'weeks',
        recurringEndDate: ''
      });
    }
  };

  const handleEdit = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setSelectedStudents(new Set([entry.studentId]));
    setFormData({
      subjectId: entry.subjectId,
      date: entry.date.toISOString().split('T')[0],
      duration: entry.duration.toString(),
      location: entry.location,
      notes: entry.notes || '',
      tags: entry.tags ? entry.tags.join(', ') : '',
      recurringPattern: 'none',
      recurringDay: 0,
      recurringWeeks: '4',
      repeatMode: 'weeks',
      recurringEndDate: ''
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this time entry?')) {
      dispatch({ type: 'DELETE_TIME_ENTRY', id });
    }
  };

  const resetForm = () => {
    setFormData({
      subjectId: '',
      date: new Date().toISOString().split('T')[0],
      duration: '',
      location: 'Home',
      notes: '',
      tags: '',
      recurringPattern: 'none',
      recurringDay: 0,
      recurringWeeks: '4',
      repeatMode: 'weeks',
      recurringEndDate: ''
    });
    setSelectedStudents(new Set());
    setEditingEntry(null);
    setKeepFormOpen(false);
    setShowForm(false);
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const handleLogTimeClick = () => {
    // Pre-select the filtered student if filtering by a specific student
    if (filters.student !== 'all') {
      setSelectedStudents(new Set([filters.student]));
    }

    // Pre-fill form with filtered values
    setFormData(prev => ({
      ...prev,
      subjectId: filters.subject !== 'all' ? filters.subject : prev.subjectId,
      location: filters.location !== 'all' ? filters.location as 'Home' | 'Away' : prev.location
    }));

    setShowForm(true);
  };

  const toggleEntrySelection = (entryId: string) => {
    setSelectedEntries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedEntries.size === sortedEntries.length) {
      setSelectedEntries(new Set());
    } else {
      setSelectedEntries(new Set(sortedEntries.map(entry => entry.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedEntries.size === 0) return;

    const confirmMessage = `Are you sure you want to delete ${selectedEntries.size} time ${selectedEntries.size === 1 ? 'entry' : 'entries'}?`;
    if (window.confirm(confirmMessage)) {
      selectedEntries.forEach(id => {
        dispatch({ type: 'DELETE_TIME_ENTRY', id });
      });
      setSelectedEntries(new Set());
    }
  };

  const handleBulkTagEdit = () => {
    if (selectedEntries.size === 0) return;

    // Parse the input tags
    const inputTags = bulkTagInput
      ? bulkTagInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      : [];

    selectedEntries.forEach(id => {
      const entry = state.timeEntries.find(e => e.id === id);
      if (entry) {
        const existingTags = entry.tags || [];
        let updatedTags: string[] | undefined;

        if (tagManagementMode === 'add') {
          // Add new tags, merge with existing, avoid duplicates
          updatedTags = [...new Set([...existingTags, ...inputTags])];
        } else if (tagManagementMode === 'replace') {
          // Replace all tags with new tags
          updatedTags = inputTags;
        } else if (tagManagementMode === 'remove') {
          // Remove specified tags from existing tags
          updatedTags = existingTags.filter(tag => !inputTags.includes(tag));
        }

        dispatch({
          type: 'UPDATE_TIME_ENTRY',
          id,
          updates: {
            tags: updatedTags && updatedTags.length > 0 ? updatedTags : undefined
          }
        });
      }
    });

    setSelectedEntries(new Set());
    setShowTagManagement(false);
    setBulkTagInput('');
    setTagManagementMode('add');
  };

  const getStudentName = (studentId: string) => {
    const student = state.students.find(s => s.id === studentId);
    return student?.name || 'Unknown Student';
  };

  const getSubjectName = (subjectId: string) => {
    const subject = state.subjects.find(s => s.id === subjectId);
    return subject?.name || 'Unknown Subject';
  };

  const getSubjectColor = (subjectId: string) => {
    const subject = state.subjects.find(s => s.id === subjectId);
    return subject?.color || '#ccc';
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Apply filters
  const filteredEntries = state.timeEntries.filter(entry => {
    // School year filter
    const { start: schoolYearStart, end: schoolYearEnd } = getSchoolYearDates(filters.schoolYear);
    const entryDate = new Date(entry.date);
    if (entryDate < schoolYearStart || entryDate > schoolYearEnd) {
      return false;
    }

    // Student filter
    if (filters.student !== 'all' && entry.studentId !== filters.student) {
      return false;
    }

    // Subject filter
    if (filters.subject !== 'all' && entry.subjectId !== filters.subject) {
      return false;
    }

    // Location filter
    if (filters.location !== 'all' && entry.location !== filters.location) {
      return false;
    }

    // Date range filter
    if (filters.dateFrom) {
      const entryDate = new Date(entry.date);
      const fromDate = parseLocalDate(filters.dateFrom);
      if (entryDate < fromDate) return false;
    }
    if (filters.dateTo) {
      const entryDate = new Date(entry.date);
      const toDate = parseLocalDate(filters.dateTo);
      if (entryDate > toDate) return false;
    }

    // Tags search filter
    if (filters.searchTags) {
      const searchLower = filters.searchTags.toLowerCase();
      if (!entry.tags || entry.tags.length === 0) return false;
      const hasMatchingTag = entry.tags.some(tag => tag.toLowerCase().includes(searchLower));
      if (!hasMatchingTag) return false;
    }

    // Notes search filter
    if (filters.searchNotes && entry.notes) {
      const searchLower = filters.searchNotes.toLowerCase();
      const notesLower = entry.notes.toLowerCase();
      if (!notesLower.includes(searchLower)) return false;
    } else if (filters.searchNotes && !entry.notes) {
      return false;
    }

    return true;
  });

  const sortedEntries = [...filteredEntries].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Update master checkbox indeterminate state
  useEffect(() => {
    if (masterCheckboxRef.current) {
      const isIndeterminate = selectedEntries.size > 0 && selectedEntries.size < sortedEntries.length;
      masterCheckboxRef.current.indeterminate = isIndeterminate;
    }
  }, [selectedEntries.size, sortedEntries.length]);

  const canAddEntry = state.students.length > 0 && state.subjects.length > 0;

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ marginBottom: '10px' }}>Time Tracking</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600' }}>
              School Year:
            </label>
            <select
              className="form-control"
              value={filters.schoolYear}
              onChange={(e) => setFilters({ ...filters, schoolYear: e.target.value })}
              style={{ width: 'auto', padding: '6px 12px', fontSize: '14px' }}
            >
              {availableSchoolYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleLogTimeClick}
          disabled={!canAddEntry}
          title={!canAddEntry ? 'Add students and subjects first' : ''}
        >
          Log Time
        </button>
      </div>

      {!canAddEntry && (
        <div style={{ padding: '15px', background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', borderRadius: '4px', marginBottom: '20px' }}>
          <p className="text-muted mb-2">
            <strong>Getting Started:</strong> You need to add at least one student and one subject before you can start tracking time.
          </p>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '20px', padding: '15px', background: 'var(--bg-tertiary)', borderRadius: '4px' }}>
          <h3>{editingEntry ? 'Edit Time Entry' : 'Log New Time Entry'}</h3>

          {/* Student Selection */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label>
              {editingEntry ? 'Student' : 'Students (select one or more)'}
              {!editingEntry && <span style={{ color: 'var(--accent-primary)', marginLeft: '5px' }}>*</span>}
            </label>
            {editingEntry && selectedStudents.size > 0 && (
              <div style={{ marginTop: '5px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                {getStudentName(Array.from(selectedStudents)[0])}
              </div>
            )}
            {!editingEntry && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '10px',
                marginTop: '10px'
              }}>
                {state.students.map((student) => (
                  <label
                    key={student.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px',
                      background: selectedStudents.has(student.id) ? 'var(--hover-bg)' : 'var(--bg-secondary)',
                      border: `1px solid ${selectedStudents.has(student.id) ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedStudents.has(student.id)}
                      onChange={() => toggleStudentSelection(student.id)}
                      style={{ marginRight: '8px' }}
                    />
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>
                        {student.name}
                      </div>
                      {student.grade && (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Grade: {student.grade}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label>Subject</label>
              <select
                className="form-control"
                value={formData.subjectId}
                onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                required
              >
                <option value="">Select a subject</option>
                {state.subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                className="form-control"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Duration (minutes)</label>
              <input
                type="number"
                className="form-control"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="e.g., 60"
                min="1"
                required
              />
            </div>
            <div className="form-group">
              <label>Location</label>
              <select
                className="form-control"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value as 'Home' | 'Away' })}
              >
                <option value="Home">Home</option>
                <option value="Away">Away</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Notes (optional)</label>
            <textarea
              className="form-control"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="What did you work on?"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Tags (optional)</label>
            <input
              type="text"
              className="form-control"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="e.g., Project, Exam Prep, Field Trip (comma-separated)"
            />
            <p className="text-muted" style={{ fontSize: '12px', marginTop: '5px' }}>
              Add custom tags to categorize this entry. Separate tags with commas.
              {!editingEntry && formData.recurringPattern !== 'none' && ' Recurring entries will automatically be tagged with "Recurring".'}
            </p>
          </div>

          {/* Recurring Options */}
          {!editingEntry && (
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
              <h4 style={{ marginBottom: '15px', color: 'var(--text-primary)', fontSize: '16px' }}>
                Recurring Entry (Optional)
              </h4>
              <div className="grid grid-2">
                <div className="form-group">
                  <label>Repeat Pattern</label>
                  <select
                    className="form-control"
                    value={formData.recurringPattern}
                    onChange={(e) => setFormData({ ...formData, recurringPattern: e.target.value as any })}
                  >
                    <option value="none">None (Single Entry)</option>
                    <option value="daily-weekdays">Daily (Weekdays Only)</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>

                {formData.recurringPattern === 'weekly' && (
                  <div className="form-group">
                    <label>Day of Week</label>
                    <select
                      className="form-control"
                      value={formData.recurringDay}
                      onChange={(e) => setFormData({ ...formData, recurringDay: parseInt(e.target.value) })}
                    >
                      {DAYS_OF_WEEK.map((day, index) => (
                        <option key={index} value={index}>{day}</option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.recurringPattern !== 'none' && (
                  <>
                    <div className="form-group">
                      <label>Repeat Mode</label>
                      <select
                        className="form-control"
                        value={formData.repeatMode}
                        onChange={(e) => setFormData({ ...formData, repeatMode: e.target.value as 'weeks' | 'until-date' })}
                      >
                        <option value="weeks">For Number of Weeks</option>
                        <option value="until-date">Until Date</option>
                      </select>
                    </div>

                    {formData.repeatMode === 'weeks' ? (
                      <div className="form-group">
                        <label>Number of Weeks</label>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.recurringWeeks}
                          onChange={(e) => setFormData({ ...formData, recurringWeeks: e.target.value })}
                          placeholder="e.g., 4"
                          min="1"
                          max="52"
                        />
                      </div>
                    ) : (
                      <div className="form-group">
                        <label>End Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={formData.recurringEndDate}
                          onChange={(e) => setFormData({ ...formData, recurringEndDate: e.target.value })}
                          min={formData.date}
                          required
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              {formData.recurringPattern !== 'none' && (
                <div style={{
                  padding: '10px',
                  background: 'var(--hover-bg)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  marginTop: '10px'
                }}>
                  <p style={{ fontSize: '13px', margin: 0, color: 'var(--text-secondary)' }}>
                    <strong>ℹ️ Recurring entries:</strong> {formData.recurringPattern === 'daily-weekdays'
                      ? 'Will be created for Monday through Friday only'
                      : `Will be created every ${DAYS_OF_WEEK[formData.recurringDay]}`
                    }
                    {formData.repeatMode === 'weeks'
                      ? `, for ${formData.recurringWeeks} weeks.`
                      : formData.recurringEndDate
                        ? ` until ${new Date(formData.recurringEndDate).toLocaleDateString()}.`
                        : '.'
                    }
                    {' '}
                    {(() => {
                      const count = calculateEntryCount(
                        formData.date,
                        formData.recurringPattern as 'daily-weekdays' | 'weekly',
                        formData.repeatMode,
                        formData.recurringWeeks,
                        formData.recurringEndDate
                      );
                      const totalCount = count * selectedStudents.size;
                      return totalCount > 0 ? `(~${count} entries per student, ${totalCount} total for ${selectedStudents.size} student${selectedStudents.size !== 1 ? 's' : ''})` : '';
                    })()}
                  </p>
                </div>
              )}
            </div>
          )}

          {!editingEntry && (
            <div className="form-group" style={{ marginBottom: '15px', marginTop: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontWeight: 'normal' }}>
                <input
                  type="checkbox"
                  checked={keepFormOpen}
                  onChange={(e) => setKeepFormOpen(e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                Log another subject for these students and date
              </label>
            </div>
          )}
          <div>
            <button type="submit" className="btn btn-primary mr-2">
              {editingEntry ? 'Update' : 'Log Time'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {state.timeEntries.length > 0 && (
        <div style={{ marginBottom: '15px', padding: '10px', background: 'var(--bg-tertiary)', borderRadius: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
              Showing <strong>{sortedEntries.length}</strong> of <strong>{state.timeEntries.length}</strong> entries
              {sortedEntries.length !== state.timeEntries.length && ' (filtered)'}
              {selectedEntries.size > 0 && (
                <span style={{ marginLeft: '10px', color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                  • {selectedEntries.size} selected
                </span>
              )}
            </p>

            {selectedEntries.size > 0 && (
              <div style={{ display: 'flex', gap: '8px' }}>
                {!showTagManagement ? (
                  <>
                    <button
                      className="btn btn-primary"
                      onClick={() => setShowTagManagement(true)}
                      style={{ fontSize: '13px', padding: '6px 12px' }}
                    >
                      Manage Tags
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={handleBulkDelete}
                      style={{ fontSize: '13px', padding: '6px 12px' }}
                    >
                      Delete Selected
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setSelectedEntries(new Set())}
                      style={{ fontSize: '13px', padding: '6px 12px' }}
                    >
                      Clear Selection
                    </button>
                  </>
                ) : (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select
                      className="form-control"
                      value={tagManagementMode}
                      onChange={(e) => setTagManagementMode(e.target.value as 'add' | 'replace' | 'remove')}
                      style={{ fontSize: '13px', padding: '6px 10px', width: 'auto' }}
                    >
                      <option value="add">Add Tags</option>
                      <option value="replace">Replace Tags</option>
                      <option value="remove">Remove Tags</option>
                    </select>
                    <input
                      type="text"
                      className="form-control"
                      value={bulkTagInput}
                      onChange={(e) => setBulkTagInput(e.target.value)}
                      placeholder={
                        tagManagementMode === 'add' ? 'e.g., Review, Important' :
                        tagManagementMode === 'replace' ? 'e.g., New Tag' :
                        'e.g., Old Tag, Outdated'
                      }
                      style={{ fontSize: '13px', padding: '6px 10px', width: '250px' }}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={handleBulkTagEdit}
                      style={{ fontSize: '13px', padding: '6px 12px' }}
                    >
                      Apply
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowTagManagement(false);
                        setBulkTagInput('');
                        setTagManagementMode('add');
                      }}
                      style={{ fontSize: '13px', padding: '6px 12px' }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {sortedEntries.length === 0 ? (
        <p className="text-muted text-center">
          {state.timeEntries.length === 0
            ? `No time entries logged yet. ${canAddEntry ? 'Click "Log Time" to get started.' : ''}`
            : 'No entries match the current filters. Try adjusting your filters.'
          }
        </p>
      ) : (
        <div className="table-wrapper">
          <table className="table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>
                <input
                  ref={masterCheckboxRef}
                  type="checkbox"
                  checked={selectedEntries.size === sortedEntries.length && sortedEntries.length > 0}
                  onChange={toggleSelectAll}
                  style={{ cursor: 'pointer' }}
                />
              </th>
              <th>Date</th>
              <th>Student</th>
              <th>Subject</th>
              <th>Duration</th>
              <th>Location</th>
              <th>Tags</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
            <tr style={{ background: 'var(--bg-tertiary)' }}>
              <th style={{ padding: '8px', width: '40px' }}>
                {/* Empty cell for checkbox column */}
              </th>
              <th style={{ padding: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <input
                    type="date"
                    className="form-control"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    placeholder="From"
                    style={{ fontSize: '12px', padding: '4px 8px' }}
                  />
                  <input
                    type="date"
                    className="form-control"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    placeholder="To"
                    style={{ fontSize: '12px', padding: '4px 8px' }}
                  />
                </div>
              </th>
              <th style={{ padding: '8px' }}>
                <select
                  className="form-control"
                  value={filters.student}
                  onChange={(e) => setFilters({ ...filters, student: e.target.value })}
                  style={{ fontSize: '12px', padding: '4px 8px' }}
                >
                  <option value="all">All Students</option>
                  {state.students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                    </option>
                  ))}
                </select>
              </th>
              <th style={{ padding: '8px' }}>
                <select
                  className="form-control"
                  value={filters.subject}
                  onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
                  style={{ fontSize: '12px', padding: '4px 8px' }}
                >
                  <option value="all">All Subjects</option>
                  {state.subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </th>
              <th style={{ padding: '8px' }}>
                {/* No filter for duration */}
              </th>
              <th style={{ padding: '8px' }}>
                <select
                  className="form-control"
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  style={{ fontSize: '12px', padding: '4px 8px' }}
                >
                  <option value="all">All Locations</option>
                  <option value="Home">Home</option>
                  <option value="Away">Away</option>
                </select>
              </th>
              <th style={{ padding: '8px' }}>
                <input
                  type="text"
                  className="form-control"
                  value={filters.searchTags}
                  onChange={(e) => setFilters({ ...filters, searchTags: e.target.value })}
                  placeholder="Search tags..."
                  style={{ fontSize: '12px', padding: '4px 8px' }}
                />
              </th>
              <th style={{ padding: '8px' }}>
                <input
                  type="text"
                  className="form-control"
                  value={filters.searchNotes}
                  onChange={(e) => setFilters({ ...filters, searchNotes: e.target.value })}
                  placeholder="Search notes..."
                  style={{ fontSize: '12px', padding: '4px 8px' }}
                />
              </th>
              <th style={{ padding: '8px' }}>
                {(filters.student !== 'all' || filters.subject !== 'all' || filters.location !== 'all' ||
                  filters.dateFrom || filters.dateTo || filters.searchTags || filters.searchNotes) && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => setFilters({ schoolYear: filters.schoolYear, student: 'all', subject: 'all', location: 'all', dateFrom: '', dateTo: '', searchTags: '', searchNotes: '' })}
                    style={{ fontSize: '11px', padding: '4px 8px', whiteSpace: 'nowrap' }}
                  >
                    Clear
                  </button>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedEntries.map((entry) => (
              <tr key={entry.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedEntries.has(entry.id)}
                    onChange={() => toggleEntrySelection(entry.id)}
                    style={{ cursor: 'pointer' }}
                  />
                </td>
                <td>{entry.date.toLocaleDateString()}</td>
                <td>{getStudentName(entry.studentId)}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        backgroundColor: getSubjectColor(entry.subjectId),
                        borderRadius: '50%'
                      }}
                    />
                    <span>{getSubjectName(entry.subjectId)}</span>
                  </div>
                </td>
                <td>{formatDuration(entry.duration)}</td>
                <td>
                  <span style={{
                    padding: '2px 8px',
                    backgroundColor: (entry.location || 'Home') === 'Home' ? '#28a745' : '#17a2b8',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {entry.location || 'Home'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {entry.tags && entry.tags.length > 0 ? (
                      entry.tags.map((tag, index) => (
                        <span
                          key={index}
                          className={tag === 'Recurring' ? 'badge badge-pink' : 'badge badge-info'}
                          style={{ fontSize: '11px' }}
                        >
                          {tag === 'Recurring' && '🔁 '}
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>-</span>
                    )}
                  </div>
                </td>
                <td style={{ maxWidth: '200px', wordWrap: 'break-word' }}>
                  {entry.notes || '-'}
                </td>
                <td>
                  <button 
                    className="btn btn-secondary mr-2" 
                    onClick={() => handleEdit(entry)}
                    style={{ fontSize: '12px', padding: '5px 10px' }}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn btn-danger" 
                    onClick={() => handleDelete(entry.id)}
                    style={{ fontSize: '12px', padding: '5px 10px' }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
};

export default TimeTracker;