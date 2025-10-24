import React, { useState } from 'react';
import { useAppState } from '../hooks/useAppState';
import { Child } from '../types';

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

const ChildrenManager: React.FC = () => {
  const { state, dispatch } = useAppState();
  const [showForm, setShowForm] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
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

    let childData: any = {
      ...formData,
      subjectCurriculum: Object.keys(subjectCurriculum).length > 0 ? subjectCurriculum : undefined
    };

    // For new children, inherit requirements from existing children if available
    if (!editingChild && state.children.length > 0) {
      const existingChild = state.children[0];
      if (existingChild.requirements) {
        childData.requirements = { ...existingChild.requirements };
      }
    }

    if (editingChild) {
      dispatch({
        type: 'UPDATE_CHILD',
        id: editingChild.id,
        updates: childData
      });
      setEditingChild(null);
    } else {
      dispatch({
        type: 'ADD_CHILD',
        child: childData
      });
    }

    setFormData({ name: '', grade: '' });
    setSubjectCurriculum({});
    setShowForm(false);
  };

  const handleEdit = (child: Child) => {
    setEditingChild(child);
    setFormData({ name: child.name, grade: child.grade || '' });
    setSubjectCurriculum(child.subjectCurriculum || {});
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this child? All their time entries will also be deleted.')) {
      dispatch({ type: 'DELETE_CHILD', id });
    }
  };

  const resetForm = () => {
    setFormData({ name: '', grade: '' });
    setSubjectCurriculum({});
    setEditingChild(null);
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
        <h2>Children</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowForm(true)}
        >
          Add Child
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '20px', padding: '15px', background: 'var(--bg-tertiary)', borderRadius: '4px' }}>
          <h3>{editingChild ? 'Edit Child' : 'Add New Child'}</h3>
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
                        <span style={{
                          padding: '2px 6px',
                          backgroundColor: subject.category === 'Core' ? '#007bff' : '#6c757d',
                          color: 'white',
                          borderRadius: '3px',
                          fontSize: '10px',
                          fontWeight: '600'
                        }}>
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
              {editingChild ? 'Update' : 'Add'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {state.children.length === 0 ? (
        <p className="text-muted text-center">No children added yet. Click "Add Child" to get started.</p>
      ) : (
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
            {state.children.map((child) => {
              const assignedCount = child.subjectCurriculum ? Object.keys(child.subjectCurriculum).length : 0;

              return (
                <tr key={child.id}>
                  <td>{child.name}</td>
                  <td>{child.grade || '-'}</td>
                  <td>
                    {assignedCount > 0 ? (
                      <span style={{
                        padding: '2px 8px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {assignedCount} {assignedCount === 1 ? 'subject' : 'subjects'}
                      </span>
                    ) : (
                      <span className="text-muted">None</span>
                    )}
                  </td>
                  <td>{child.createdAt.toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn btn-secondary mr-2"
                      onClick={() => handleEdit(child)}
                      style={{ fontSize: '12px', padding: '5px 10px' }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(child.id)}
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
      )}
    </div>
  );
};

export default ChildrenManager;