import React, { useState } from 'react';
import { useAppState } from '../hooks/useAppState';
import { Student } from '../types';

const GRADE_OPTIONS = [
  'Preschool',
  'Kindergarten',
  '1st',
  '2nd',
  '3rd',
  '4th',
  '5th',
  '6th',
  '7th',
  '8th',
  '9th',
  '10th',
  '11th',
  '12th'
];

const StudentsManager: React.FC = () => {
  const { state, dispatch } = useAppState();
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({ name: '', grade: '' });
  const [subjectCurriculum, setSubjectCurriculum] = useState<{
    [subjectId: string]: {
      curriculum?: string;
      cost?: string;
      notes?: string;
    }
  }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    let studentData: any = {
      ...formData,
      subjectCurriculum: Object.keys(subjectCurriculum).length > 0 ? subjectCurriculum : undefined
    };

    // For new students, inherit requirements from existing students if available
    if (!editingStudent && state.students.length > 0) {
      const existingStudent = state.students[0];
      if (existingStudent.requirements) {
        studentData.requirements = { ...existingStudent.requirements };
      }
    }

    if (editingStudent) {
      dispatch({
        type: 'UPDATE_STUDENT',
        id: editingStudent.id,
        updates: studentData
      });
      setEditingStudent(null);
    } else {
      dispatch({
        type: 'ADD_STUDENT',
        student: studentData
      });
    }

    setFormData({ name: '', grade: '' });
    setSubjectCurriculum({});
    setShowForm(false);
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({ name: student.name, grade: student.grade || '' });
    setSubjectCurriculum(student.subjectCurriculum || {});
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this student? All their time entries will also be deleted.')) {
      dispatch({ type: 'DELETE_STUDENT', id });
    }
  };

  const resetForm = () => {
    setFormData({ name: '', grade: '' });
    setSubjectCurriculum({});
    setEditingStudent(null);
    setShowForm(false);
  };

  const handleSubjectCurriculumChange = (subjectId: string, field: 'curriculum' | 'cost' | 'notes', value: string) => {
    setSubjectCurriculum(prev => {
      const updated = { ...prev };
      if (!updated[subjectId]) {
        updated[subjectId] = {};
      }
      updated[subjectId][field] = value;

      // If all fields are empty, remove the subject entry
      if (!updated[subjectId].curriculum && !updated[subjectId].cost && !updated[subjectId].notes) {
        delete updated[subjectId];
      }

      return updated;
    });
  };

  const isSubjectAssigned = (subjectId: string) => {
    return subjectCurriculum[subjectId] !== undefined;
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Students</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          Add Student
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '20px', padding: '15px', background: 'var(--bg-tertiary)', borderRadius: '4px' }}>
          <h3>{editingStudent ? 'Edit Student' : 'Add New Student'}</h3>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              className="form-control"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Grade (optional)</label>
            <select
              className="form-control"
              value={formData.grade}
              onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
            >
              <option value="">Select a grade</option>
              {GRADE_OPTIONS.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Curriculum Section */}
          {state.subjects.length > 0 && (
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
              <h4 style={{ marginBottom: '15px', color: 'var(--text-primary)' }}>Subject Curriculum</h4>
              <p className="text-muted" style={{ fontSize: '13px', marginBottom: '15px' }}>
                Assign subjects and track curriculum information. Leave all fields empty to mark as N/A.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {state.subjects.map((subject) => {
                  const isAssigned = isSubjectAssigned(subject.id);
                  const curriculumData = subjectCurriculum[subject.id] || {};

                  return (
                    <div
                      key={subject.id}
                      style={{
                        padding: '15px',
                        background: isAssigned ? 'var(--bg-tertiary)' : 'transparent',
                        border: `1px solid ${isAssigned ? 'var(--border-color)' : 'var(--border-color-light)'}`,
                        borderRadius: '8px',
                        borderLeft: `4px solid ${subject.color || '#ccc'}`
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <div
                          style={{
                            width: '12px',
                            height: '12px',
                            backgroundColor: subject.color || '#ccc',
                            borderRadius: '50%'
                          }}
                        />
                        <h5 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
                          {subject.name}
                        </h5>
                        <span className={subject.category === 'Core' ? 'badge badge-primary' : 'badge badge-info'}>
                          {subject.category}
                        </span>
                      </div>

                      <div className="grid grid-3" style={{ gap: '10px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '12px' }}>Curriculum</label>
                          <input
                            type="text"
                            className="form-control"
                            value={curriculumData.curriculum || ''}
                            onChange={(e) => handleSubjectCurriculumChange(subject.id, 'curriculum', e.target.value)}
                            placeholder="e.g., Saxon Math 5/4"
                            style={{ fontSize: '13px' }}
                          />
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '12px' }}>Cost</label>
                          <input
                            type="text"
                            className="form-control"
                            value={curriculumData.cost || ''}
                            onChange={(e) => handleSubjectCurriculumChange(subject.id, 'cost', e.target.value)}
                            placeholder="e.g., $89.95"
                            style={{ fontSize: '13px' }}
                          />
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '12px' }}>Notes</label>
                          <input
                            type="text"
                            className="form-control"
                            value={curriculumData.notes || ''}
                            onChange={(e) => handleSubjectCurriculumChange(subject.id, 'notes', e.target.value)}
                            placeholder="Notes"
                            style={{ fontSize: '13px' }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ marginTop: '20px' }}>
            <button type="submit" className="btn btn-primary mr-2">
              {editingStudent ? 'Update' : 'Add'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {state.students.length === 0 ? (
        <p className="text-muted text-center">No students added yet. Click "Add Student" to get started.</p>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="desktop-only">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Grade</th>
                  <th>Curriculum Assigned</th>
                  <th>Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {state.students.map((student) => {
                  const assignedCount = student.subjectCurriculum ? Object.keys(student.subjectCurriculum).length : 0;

                  return (
                    <tr key={student.id}>
                      <td>{student.name}</td>
                      <td>{student.grade || '-'}</td>
                      <td>
                        {assignedCount > 0 ? (
                          <span className="badge badge-success">
                            {assignedCount} {assignedCount === 1 ? 'subject' : 'subjects'}
                          </span>
                        ) : (
                          <span className="text-muted">None</span>
                        )}
                      </td>
                      <td>{student.createdAt.toLocaleDateString()}</td>
                      <td>
                        <button
                          className="btn btn-secondary mr-2"
                          onClick={() => handleEdit(student)}
                          style={{ fontSize: '12px', padding: '5px 10px' }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDelete(student.id)}
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
            {state.students.map((student) => {
              const assignedCount = student.subjectCurriculum ? Object.keys(student.subjectCurriculum).length : 0;

              return (
                <div
                  key={student.id}
                  style={{
                    padding: '15px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ marginBottom: '12px' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: 'var(--text-primary)' }}>
                      {student.name}
                    </h3>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                      {student.grade && (
                        <span className="badge badge-info" style={{ fontSize: '12px' }}>
                          Grade: {student.grade}
                        </span>
                      )}
                      {assignedCount > 0 ? (
                        <span className="badge badge-success" style={{ fontSize: '12px' }}>
                          {assignedCount} {assignedCount === 1 ? 'subject' : 'subjects'}
                        </span>
                      ) : (
                        <span className="text-muted" style={{ fontSize: '12px' }}>No subjects assigned</span>
                      )}
                    </div>
                  </div>

                  <div style={{
                    fontSize: '13px',
                    color: 'var(--text-muted)',
                    marginBottom: '12px',
                    paddingBottom: '12px',
                    borderBottom: '1px solid var(--border-color)'
                  }}>
                    Added {student.createdAt.toLocaleDateString()}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleEdit(student)}
                      style={{ flex: 1, fontSize: '14px', padding: '8px 12px' }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(student.id)}
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

export default StudentsManager;