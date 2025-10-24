import React, { useState } from 'react';
import { useAppState } from '../hooks/useAppState';
import { TimeEntry } from '../types';

const TimeTracker: React.FC = () => {
  const { state, dispatch } = useAppState();
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [keepFormOpen, setKeepFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    studentId: '',
    subjectId: '',
    date: new Date().toISOString().split('T')[0],
    duration: '',
    location: 'Home' as 'Home' | 'Away',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId || !formData.subjectId || !formData.duration) return;

    const entryData = {
      studentId: formData.studentId,
      subjectId: formData.subjectId,
      date: new Date(formData.date),
      duration: parseInt(formData.duration),
      location: formData.location,
      notes: formData.notes || undefined
    };

    if (editingEntry) {
      dispatch({
        type: 'UPDATE_TIME_ENTRY',
        id: editingEntry.id,
        updates: entryData
      });
      setEditingEntry(null);
      setKeepFormOpen(false);
    } else {
      dispatch({
        type: 'ADD_TIME_ENTRY',
        entry: entryData
      });
    }

    if (editingEntry || !keepFormOpen) {
      // Full reset when editing or not keeping form open
      setFormData({
        studentId: '',
        subjectId: '',
        date: new Date().toISOString().split('T')[0],
        duration: '',
        location: 'Home',
        notes: ''
      });
      setShowForm(false);
    } else {
      // Keep student and date, clear other fields
      setFormData({
        ...formData,
        subjectId: '',
        duration: '',
        location: 'Home',
        notes: ''
      });
    }
  };

  const handleEdit = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setFormData({
      studentId: entry.studentId,
      subjectId: entry.subjectId,
      date: entry.date.toISOString().split('T')[0],
      duration: entry.duration.toString(),
      location: entry.location,
      notes: entry.notes || ''
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
      studentId: '',
      subjectId: '',
      date: new Date().toISOString().split('T')[0],
      duration: '',
      location: 'Home',
      notes: ''
    });
    setEditingEntry(null);
    setKeepFormOpen(false);
    setShowForm(false);
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

  const sortedEntries = [...state.timeEntries].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const canAddEntry = state.students.length > 0 && state.subjects.length > 0;

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Time Tracking</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowForm(true)}
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
          <div className="grid grid-2">
            <div className="form-group">
              <label>Student</label>
              <select
                className="form-control"
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                required
              >
                <option value="">Select a student</option>
                {state.students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </select>
            </div>
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
          {!editingEntry && (
            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontWeight: 'normal' }}>
                <input
                  type="checkbox"
                  checked={keepFormOpen}
                  onChange={(e) => setKeepFormOpen(e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                Log another subject for this student and date
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

      {sortedEntries.length === 0 ? (
        <p className="text-muted text-center">No time entries logged yet. {canAddEntry ? 'Click "Log Time" to get started.' : ''}</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Student</th>
              <th>Subject</th>
              <th>Duration</th>
              <th>Location</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedEntries.map((entry) => (
              <tr key={entry.id}>
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
                    {getSubjectName(entry.subjectId)}
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
      )}
    </div>
  );
};

export default TimeTracker;