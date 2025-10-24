import React, { useState } from 'react';
import { useAppState } from '../hooks/useAppState';
import { Subject } from '../types';

const PRESET_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
];

const SubjectsManager: React.FC = () => {
  const { state, dispatch } = useAppState();
  const [showForm, setShowForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({ name: '', color: PRESET_COLORS[0], category: 'Core' as 'Core' | 'Non-Core' });
  const [assignedStudents, setAssignedStudents] = useState<Set<string>>(new Set());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    let subjectId: string;

    if (editingSubject) {
      dispatch({
        type: 'UPDATE_SUBJECT',
        id: editingSubject.id,
        updates: formData
      });
      subjectId = editingSubject.id;
      setEditingSubject(null);
    } else {
      // For new subjects, we need to generate an ID first
      // We'll dispatch the action and use the generated ID
      const tempId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      dispatch({
        type: 'ADD_SUBJECT',
        subject: formData
      });
      // The subject will be added with a generated ID by the reducer
      // We need to get the most recent subject
      subjectId = tempId; // This will be handled below
    }

    // Update assigned students' subjectCurriculum
    if (assignedStudents.size > 0) {
      // For new subjects, we need to wait for the state to update
      // Use setTimeout to ensure the subject is added first
      setTimeout(() => {
        const actualSubjectId = editingSubject ? subjectId : state.subjects[state.subjects.length - 1]?.id;
        if (actualSubjectId) {
          assignedStudents.forEach(studentId => {
            const student = state.students.find(s => s.id === studentId);
            if (student) {
              const updatedCurriculum = {
                ...student.subjectCurriculum,
                [actualSubjectId]: student.subjectCurriculum?.[actualSubjectId] || {}
              };
              dispatch({
                type: 'UPDATE_STUDENT',
                id: studentId,
                updates: { subjectCurriculum: updatedCurriculum }
              });
            }
          });
        }
      }, 0);
    }

    setFormData({ name: '', color: PRESET_COLORS[0], category: 'Core' });
    setAssignedStudents(new Set());
    setShowForm(false);
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({ name: subject.name, color: subject.color || PRESET_COLORS[0], category: subject.category });

    // Load which students have this subject assigned
    const studentsWithSubject = state.students.filter(student =>
      student.subjectCurriculum && student.subjectCurriculum[subject.id]
    ).map(student => student.id);
    setAssignedStudents(new Set(studentsWithSubject));

    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this subject? All time entries for this subject will also be deleted.')) {
      dispatch({ type: 'DELETE_SUBJECT', id });
    }
  };

  const resetForm = () => {
    setFormData({ name: '', color: PRESET_COLORS[0], category: 'Core' });
    setAssignedStudents(new Set());
    setEditingSubject(null);
    setShowForm(false);
  };

  const toggleStudentAssignment = (studentId: string) => {
    setAssignedStudents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Subjects</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowForm(true)}
        >
          Add Subject
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '20px', padding: '15px', background: 'var(--bg-tertiary)', borderRadius: '4px' }}>
          <h3>{editingSubject ? 'Edit Subject' : 'Add New Subject'}</h3>
          <div className="grid grid-2">
            <div className="form-group">
              <label>Subject Name</label>
              <input
                type="text"
                className="form-control"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Math, Science, Reading"
                required
              />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select
                className="form-control"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as 'Core' | 'Non-Core' })}
              >
                <option value="Core">Core</option>
                <option value="Non-Core">Non-Core</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Color</label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '5px' }}>
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  style={{
                    width: '30px',
                    height: '30px',
                    backgroundColor: color,
                    border: formData.color === color ? '3px solid #333' : '1px solid #ccc',
                    borderRadius: '50%',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Student Assignment Section */}
          {state.students.length > 0 && (
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
              <h4 style={{ marginBottom: '15px', color: 'var(--text-primary)', fontSize: '16px' }}>
                Assign to Students (Optional)
              </h4>
              <p className="text-muted" style={{ fontSize: '13px', marginBottom: '15px' }}>
                Select students to automatically assign this subject to their curriculum.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                {state.students.map((student) => (
                  <label
                    key={student.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px',
                      background: assignedStudents.has(student.id) ? 'var(--hover-bg)' : 'transparent',
                      border: `1px solid ${assignedStudents.has(student.id) ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={assignedStudents.has(student.id)}
                      onChange={() => toggleStudentAssignment(student.id)}
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
            </div>
          )}

          <div style={{ marginTop: '20px' }}>
            <button type="submit" className="btn btn-primary mr-2">
              {editingSubject ? 'Update' : 'Add'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {state.subjects.length === 0 ? (
        <p className="text-muted text-center">No subjects added yet. Click "Add Subject" to get started.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Category</th>
              <th>Color</th>
              <th>Added</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {state.subjects.map((subject) => (
              <tr key={subject.id}>
                <td>{subject.name}</td>
                <td>
                  <span className={(subject.category || 'Core') === 'Core' ? 'badge badge-primary' : 'badge badge-info'}>
                    {subject.category || 'Core'}
                  </span>
                </td>
                <td>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: subject.color,
                    borderRadius: '50%',
                    border: '1px solid #ccc'
                  }} />
                </td>
                <td>{subject.createdAt.toLocaleDateString()}</td>
                <td>
                  <button 
                    className="btn btn-secondary mr-2" 
                    onClick={() => handleEdit(subject)}
                    style={{ fontSize: '12px', padding: '5px 10px' }}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn btn-danger" 
                    onClick={() => handleDelete(subject.id)}
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

export default SubjectsManager;