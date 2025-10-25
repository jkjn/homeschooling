import React, { useState } from 'react';
import { useAppState } from '../hooks/useAppState';
import { Student } from '../types';

const Settings: React.FC = () => {
  const { state, dispatch } = useAppState();
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [requirements, setRequirements] = useState({
    totalHours: '',
    coreHours: '',
    nonCoreHours: '',
    homeHours: '',
    awayHours: ''
  });
  const [globalRequirements, setGlobalRequirements] = useState({
    totalHours: '',
    coreHours: '',
    nonCoreHours: '',
    homeHours: '',
    awayHours: ''
  });

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setRequirements({
      totalHours: student.requirements?.totalHours?.toString() || '',
      coreHours: student.requirements?.coreHours?.toString() || '',
      nonCoreHours: student.requirements?.nonCoreHours?.toString() || '',
      homeHours: student.requirements?.homeHours?.toString() || '',
      awayHours: student.requirements?.awayHours?.toString() || ''
    });
  };

  const handleSave = () => {
    if (!editingStudent) return;

    dispatch({
      type: 'UPDATE_STUDENT',
      id: editingStudent.id,
      updates: {
        requirements: {
          totalHours: requirements.totalHours ? parseInt(requirements.totalHours) : undefined,
          coreHours: requirements.coreHours ? parseInt(requirements.coreHours) : undefined,
          nonCoreHours: requirements.nonCoreHours ? parseInt(requirements.nonCoreHours) : undefined,
          homeHours: requirements.homeHours ? parseInt(requirements.homeHours) : undefined,
          awayHours: requirements.awayHours ? parseInt(requirements.awayHours) : undefined
        }
      }
    });

    setEditingStudent(null);
    setRequirements({
      totalHours: '',
      coreHours: '',
      nonCoreHours: '',
      homeHours: '',
      awayHours: ''
    });
  };

  const handleCancel = () => {
    setEditingStudent(null);
    setRequirements({
      totalHours: '',
      coreHours: '',
      nonCoreHours: '',
      homeHours: '',
      awayHours: ''
    });
  };

  const handleApplyGlobalRequirements = () => {
    if (state.students.length === 0) return;

    const reqObj = {
      totalHours: globalRequirements.totalHours ? parseInt(globalRequirements.totalHours) : undefined,
      coreHours: globalRequirements.coreHours ? parseInt(globalRequirements.coreHours) : undefined,
      nonCoreHours: globalRequirements.nonCoreHours ? parseInt(globalRequirements.nonCoreHours) : undefined,
      homeHours: globalRequirements.homeHours ? parseInt(globalRequirements.homeHours) : undefined,
      awayHours: globalRequirements.awayHours ? parseInt(globalRequirements.awayHours) : undefined
    };

    // Apply to all students
    state.students.forEach(student => {
      dispatch({
        type: 'UPDATE_STUDENT',
        id: student.id,
        updates: {
          requirements: reqObj
        }
      });
    });

    // Reset form
    setGlobalRequirements({
      totalHours: '',
      coreHours: '',
      nonCoreHours: '',
      homeHours: '',
      awayHours: ''
    });
  };

  return (
    <div>
      <div className="card">
        <h2>Settings</h2>
        <p className="text-muted">Configure annual requirements for each student</p>
      </div>

      {/* Global Requirements Section */}
      <div className="card">
        <h3>Global Requirements</h3>
        <p className="text-muted" style={{ marginBottom: '20px' }}>
          Set requirements once and apply to all students at the same time.
        </p>

        {state.students.length === 0 ? (
          <p className="text-muted text-center">
            No students added yet. Add students first to set requirements.
          </p>
        ) : (
          <>
            <div className="grid grid-2">
              <div className="form-group">
                <label>Total Hours Required</label>
                <input
                  type="number"
                  className="form-control"
                  value={globalRequirements.totalHours}
                  onChange={(e) => setGlobalRequirements({ ...globalRequirements, totalHours: e.target.value })}
                  placeholder="e.g., 1000"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Core Hours Required</label>
                <input
                  type="number"
                  className="form-control"
                  value={globalRequirements.coreHours}
                  onChange={(e) => setGlobalRequirements({ ...globalRequirements, coreHours: e.target.value })}
                  placeholder="e.g., 600"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Non-Core Hours Required</label>
                <input
                  type="number"
                  className="form-control"
                  value={globalRequirements.nonCoreHours}
                  onChange={(e) => setGlobalRequirements({ ...globalRequirements, nonCoreHours: e.target.value })}
                  placeholder="e.g., 400"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Home Hours Required</label>
                <input
                  type="number"
                  className="form-control"
                  value={globalRequirements.homeHours}
                  onChange={(e) => setGlobalRequirements({ ...globalRequirements, homeHours: e.target.value })}
                  placeholder="e.g., 450"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Away Hours Required</label>
                <input
                  type="number"
                  className="form-control"
                  value={globalRequirements.awayHours}
                  onChange={(e) => setGlobalRequirements({ ...globalRequirements, awayHours: e.target.value })}
                  placeholder="e.g., 100"
                  min="0"
                />
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <button
                className="btn btn-primary"
                onClick={handleApplyGlobalRequirements}
              >
                Apply to All Students
              </button>
            </div>
          </>
        )}
      </div>

      <div className="card">
        <h3>Individual Student Requirements</h3>
        <p className="text-muted" style={{ marginBottom: '20px' }}>
          Override global requirements or customize requirements for specific students.
        </p>

        {state.students.length === 0 ? (
          <p className="text-muted text-center">
            No students added yet. Add students first to configure their requirements.
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Grade</th>
                <th>Total Hours</th>
                <th>Core Hours</th>
                <th>Non-Core Hours</th>
                <th>Home Hours</th>
                <th>Away Hours</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.students.map((student) => (
                <tr key={student.id}>
                  <td>{student.name}</td>
                  <td>{student.grade || '-'}</td>
                  <td>{student.requirements?.totalHours || '-'}</td>
                  <td>{student.requirements?.coreHours || '-'}</td>
                  <td>{student.requirements?.nonCoreHours || '-'}</td>
                  <td>{student.requirements?.homeHours || '-'}</td>
                  <td>{student.requirements?.awayHours || '-'}</td>
                  <td>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleEdit(student)}
                      style={{ fontSize: '12px', padding: '5px 10px' }}
                    >
                      Edit Requirements
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editingStudent && (
        <div className="card">
          <h3>Set Requirements for {editingStudent.name}</h3>
          <p className="text-muted" style={{ marginBottom: '20px' }}>
            Enter the required hours for the school year. Leave blank if no requirement.
          </p>

          <div className="grid grid-2">
            <div className="form-group">
              <label>Total Hours Required</label>
              <input
                type="number"
                className="form-control"
                value={requirements.totalHours}
                onChange={(e) => setRequirements({ ...requirements, totalHours: e.target.value })}
                placeholder="e.g., 1000"
                min="0"
              />
              <p className="text-muted" style={{ fontSize: '12px', marginTop: '5px' }}>
                Total hours to complete for the school year
              </p>
            </div>

            <div className="form-group">
              <label>Core Hours Required</label>
              <input
                type="number"
                className="form-control"
                value={requirements.coreHours}
                onChange={(e) => setRequirements({ ...requirements, coreHours: e.target.value })}
                placeholder="e.g., 600"
                min="0"
              />
              <p className="text-muted" style={{ fontSize: '12px', marginTop: '5px' }}>
                Required hours in core subjects
              </p>
            </div>

            <div className="form-group">
              <label>Non-Core Hours Required</label>
              <input
                type="number"
                className="form-control"
                value={requirements.nonCoreHours}
                onChange={(e) => setRequirements({ ...requirements, nonCoreHours: e.target.value })}
                placeholder="e.g., 400"
                min="0"
              />
              <p className="text-muted" style={{ fontSize: '12px', marginTop: '5px' }}>
                Required hours in non-core subjects
              </p>
            </div>

            <div className="form-group">
              <label>Home Hours Required</label>
              <input
                type="number"
                className="form-control"
                value={requirements.homeHours}
                onChange={(e) => setRequirements({ ...requirements, homeHours: e.target.value })}
                placeholder="e.g., 450"
                min="0"
              />
              <p className="text-muted" style={{ fontSize: '12px', marginTop: '5px' }}>
                Required hours completed at home
              </p>
            </div>

            <div className="form-group">
              <label>Away Hours Required</label>
              <input
                type="number"
                className="form-control"
                value={requirements.awayHours}
                onChange={(e) => setRequirements({ ...requirements, awayHours: e.target.value })}
                placeholder="e.g., 100"
                min="0"
              />
              <p className="text-muted" style={{ fontSize: '12px', marginTop: '5px' }}>
                Required hours completed away from home
              </p>
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <button className="btn btn-primary mr-2" onClick={handleSave}>
              Save Requirements
            </button>
            <button className="btn btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
