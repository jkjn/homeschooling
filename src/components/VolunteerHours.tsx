import React, { useState, useEffect } from 'react';
import { useAppState } from '../hooks/useAppState';
import { TimeEntry } from '../types';

const VolunteerHours: React.FC = () => {
  const { state, dispatch } = useAppState();
  const [selectedStudent, setSelectedStudent] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('0');
  const [organization, setOrganization] = useState('');
  const [activity, setActivity] = useState('');
  const [notes, setNotes] = useState('');
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);

  // Ensure "Volunteer Hours" subject exists
  useEffect(() => {
    const volunteerSubject = state.subjects.find(s => s.name === 'Volunteer Hours');
    if (!volunteerSubject && state.subjects.length >= 0) {
      dispatch({
        type: 'ADD_SUBJECT',
        subject: {
          name: 'Volunteer Hours',
          color: '#8E44AD',
          category: 'Non-Core' as const
        }
      });
    }
  }, [state.subjects, dispatch]);

  // Filter volunteer hours entries (we'll use a special subject or category)
  const volunteerEntries = state.timeEntries.filter(entry => {
    const subject = state.subjects.find(s => s.id === entry.subjectId);
    return subject?.name === 'Volunteer Hours' || entry.notes?.toLowerCase().includes('volunteer');
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudent || !organization || !activity) return;

    // Find "Volunteer Hours" subject (should exist from useEffect)
    const volunteerSubject = state.subjects.find(s => s.name === 'Volunteer Hours');

    if (!volunteerSubject) {
      console.error('Volunteer Hours subject not found');
      return;
    }

    submitEntry(volunteerSubject.id);
  };

  const submitEntry = (subjectId: string) => {
    if (!subjectId) {
      console.error('No subject ID provided');
      return;
    }

    const totalMinutes = (parseFloat(hours) || 0) * 60 + (parseInt(minutes) || 0);
    const entryData = {
      studentId: selectedStudent,
      subjectId,
      date: new Date(date),
      duration: totalMinutes,
      location: 'Away' as const,
      notes: `${organization} - ${activity}${notes ? ': ' + notes : ''}`
    };

    if (editingEntry) {
      dispatch({
        type: 'UPDATE_TIME_ENTRY',
        id: editingEntry.id,
        updates: entryData
      });
      setEditingEntry(null);
    } else {
      dispatch({
        type: 'ADD_TIME_ENTRY',
        entry: entryData
      });
    }

    resetForm();
  };

  const resetForm = () => {
    setSelectedStudent('');
    setDate(new Date().toISOString().split('T')[0]);
    setHours('');
    setMinutes('0');
    setOrganization('');
    setActivity('');
    setNotes('');
    setEditingEntry(null);
  };

  const handleEdit = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setSelectedStudent(entry.studentId);
    setDate(entry.date.toISOString().split('T')[0]);

    // Convert duration (in minutes) to hours and minutes
    const totalHours = Math.floor(entry.duration / 60);
    const remainingMinutes = entry.duration % 60;
    setHours(totalHours.toString());
    setMinutes(remainingMinutes.toString());

    // Parse organization and activity from notes
    const noteParts = entry.notes?.split(' - ') || [];
    setOrganization(noteParts[0] || '');

    if (noteParts[1]) {
      const activityParts = noteParts[1].split(': ');
      setActivity(activityParts[0] || '');
      setNotes(activityParts[1] || '');
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this volunteer entry?')) {
      dispatch({ type: 'DELETE_TIME_ENTRY', id });
    }
  };

  // Calculate total volunteer hours per student
  const volunteerHoursByStudent = volunteerEntries.reduce((acc, entry) => {
    const total = entry.duration / 60; // Convert minutes to hours
    acc[entry.studentId] = (acc[entry.studentId] || 0) + total;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="card">
      <h2 style={{ marginBottom: '20px' }}>Volunteer Hours Tracker</h2>

      {/* Summary Cards */}
      {state.students.length > 0 && (
        <div className="grid grid-3" style={{ marginBottom: '30px' }}>
          {state.students.map((student) => {
            const totalHours = volunteerHoursByStudent[student.id] || 0;
            return (
              <div key={student.id} className="card" style={{ background: 'var(--bg-tertiary)' }}>
                <h4 style={{ marginBottom: '10px', color: 'var(--text-primary)' }}>{student.name}</h4>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--accent-volunteer)' }}>
                  {totalHours.toFixed(1)}
                </div>
                <div className="text-muted">volunteer hours</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Entry Form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '30px', padding: '20px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '20px' }}>{editingEntry ? 'Edit Volunteer Entry' : 'Log Volunteer Hours'}</h3>

        <div className="grid grid-2">
          <div className="form-group">
            <label>Student *</label>
            <select
              className="form-control"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              required
            >
              <option value="">Select Student</option>
              {state.students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Date *</label>
            <input
              type="date"
              className="form-control"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-2">
          <div className="form-group">
            <label>Organization *</label>
            <input
              type="text"
              className="form-control"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="e.g., Food Bank, Animal Shelter"
              required
            />
          </div>

          <div className="form-group">
            <label>Activity *</label>
            <input
              type="text"
              className="form-control"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              placeholder="e.g., Sorting donations, Walking dogs"
              required
            />
          </div>
        </div>

        <div className="grid grid-3">
          <div className="form-group">
            <label>Hours</label>
            <input
              type="number"
              className="form-control"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              min="0"
              max="24"
              step="0.5"
            />
          </div>

          <div className="form-group">
            <label>Minutes</label>
            <select
              className="form-control"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            >
              <option value="0">0</option>
              <option value="15">15</option>
              <option value="30">30</option>
              <option value="45">45</option>
            </select>
          </div>

          <div className="form-group">
            <label>Total</label>
            <div style={{
              padding: '8px 12px',
              background: 'var(--bg-primary)',
              borderRadius: '4px',
              fontWeight: 'bold',
              lineHeight: '38px'
            }}>
              {(parseFloat(hours) || 0) + (parseInt(minutes) || 0) / 60} hours
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>Additional Notes (optional)</label>
          <textarea
            className="form-control"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional details about the volunteer work..."
            rows={3}
          />
        </div>

        <div>
          <button type="submit" className="btn btn-primary mr-2">
            {editingEntry ? 'Update Entry' : 'Log Hours'}
          </button>
          {editingEntry && (
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Entries Table */}
      <h3 style={{ marginBottom: '15px' }}>Volunteer History</h3>
      {volunteerEntries.length === 0 ? (
        <p className="text-muted text-center">No volunteer hours logged yet.</p>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="desktop-only">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Student</th>
                  <th>Organization</th>
                  <th>Activity</th>
                  <th>Hours</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {volunteerEntries
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((entry) => {
                    const student = state.students.find(s => s.id === entry.studentId);
                    const noteParts = entry.notes?.split(' - ') || [];
                    const organization = noteParts[0] || '';
                    const activity = noteParts[1]?.split(':')[0] || '';
                    const totalHours = entry.duration / 60; // Convert minutes to hours

                    return (
                      <tr key={entry.id}>
                        <td>{new Date(entry.date).toLocaleDateString()}</td>
                        <td>{student?.name}</td>
                        <td>{organization}</td>
                        <td>{activity}</td>
                        <td style={{ fontWeight: 'bold' }}>{totalHours.toFixed(1)} hrs</td>
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
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="mobile-only-cards">
            {volunteerEntries
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((entry) => {
                const student = state.students.find(s => s.id === entry.studentId);
                const noteParts = entry.notes?.split(' - ') || [];
                const organization = noteParts[0] || '';
                const activity = noteParts[1]?.split(':')[0] || '';
                const totalHours = entry.duration / 60; // Convert minutes to hours

                return (
                  <div
                    key={entry.id}
                    style={{
                      padding: '15px',
                      background: 'var(--bg-tertiary)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      borderLeft: '4px solid var(--accent-volunteer)'
                    }}
                  >
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                        <div>
                          <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: 'var(--text-primary)' }}>
                            {organization}
                          </h4>
                          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
                            {activity}
                          </p>
                        </div>
                        <div style={{
                          fontSize: '18px',
                          fontWeight: 'bold',
                          color: 'var(--accent-volunteer)',
                          textAlign: 'right',
                          minWidth: '80px'
                        }}>
                          {totalHours.toFixed(1)} hrs
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '8px' }}>
                        <span className="badge badge-info" style={{ fontSize: '12px' }}>
                          {student?.name}
                        </span>
                        <span className="text-muted" style={{ fontSize: '12px' }}>
                          {new Date(entry.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div style={{
                      paddingTop: '12px',
                      borderTop: '1px solid var(--border-color)',
                      display: 'flex',
                      gap: '8px'
                    }}>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleEdit(entry)}
                        style={{ flex: 1, fontSize: '14px', padding: '8px 12px' }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(entry.id)}
                        style={{ flex: 1, fontSize: '14px', padding: '8px 12px' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
};

export default VolunteerHours;
