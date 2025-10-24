import React, { useMemo } from 'react';
import { useAppState } from '../hooks/useAppState';

const Dashboard: React.FC = () => {
  const { state } = useAppState();

  // Get current school year start date (July 1)
  const schoolYearStart = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    return currentMonth >= 6
      ? new Date(currentYear, 6, 1) // July 1 of this year
      : new Date(currentYear - 1, 6, 1); // July 1 of last year
  }, []);

  const schoolYearLabel = useMemo(() => {
    const startYear = schoolYearStart.getFullYear();
    return `${startYear}-${startYear + 1}`;
  }, [schoolYearStart]);

  // Filter entries for current school year
  const schoolYearEntries = useMemo(() => {
    const today = new Date();
    return state.timeEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= schoolYearStart && entryDate <= today;
    });
  }, [state.timeEntries, schoolYearStart]);

  // Calculate stats by child
  const childStats = useMemo(() => {
    const stats: Record<string, {
      totalMinutes: number;
      subjects: Record<string, number>;
      entryCount: number;
      coreMinutes: number;
      nonCoreMinutes: number;
      homeMinutes: number;
      awayMinutes: number;
    }> = {};

    schoolYearEntries.forEach(entry => {
      if (!stats[entry.childId]) {
        stats[entry.childId] = {
          totalMinutes: 0,
          subjects: {},
          entryCount: 0,
          coreMinutes: 0,
          nonCoreMinutes: 0,
          homeMinutes: 0,
          awayMinutes: 0
        };
      }

      const subject = state.subjects.find(s => s.id === entry.subjectId);
      const category = subject?.category || 'Core';
      const location = entry.location || 'Home';

      stats[entry.childId].totalMinutes += entry.duration;
      stats[entry.childId].entryCount += 1;

      // Track by category
      if (category === 'Core') {
        stats[entry.childId].coreMinutes += entry.duration;
      } else {
        stats[entry.childId].nonCoreMinutes += entry.duration;
      }

      // Track by location
      if (location === 'Home') {
        stats[entry.childId].homeMinutes += entry.duration;
      } else {
        stats[entry.childId].awayMinutes += entry.duration;
      }

      if (!stats[entry.childId].subjects[entry.subjectId]) {
        stats[entry.childId].subjects[entry.subjectId] = 0;
      }
      stats[entry.childId].subjects[entry.subjectId] += entry.duration;
    });

    return stats;
  }, [schoolYearEntries, state.subjects]);

  const totalMinutes = useMemo(() => {
    return schoolYearEntries.reduce((sum, entry) => sum + entry.duration, 0);
  }, [schoolYearEntries]);

  const getChildName = (childId: string) => {
    const child = state.children.find(c => c.id === childId);
    return child?.name || 'Unknown Child';
  };

  const getChildRequirements = (childId: string) => {
    const child = state.children.find(c => c.id === childId);
    return child?.requirements;
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

  const formatHoursDecimal = (minutes: number) => {
    return (minutes / 60).toFixed(1);
  };

  const hasData = state.children.length > 0 && schoolYearEntries.length > 0;

  return (
    <div>
      <div className="card">
        <h2>Dashboard - School Year {schoolYearLabel}</h2>
        <p className="text-muted">Overview of learning hours from July 1 to today</p>
      </div>

      {!hasData && (
        <div className="card">
          {state.children.length === 0 ? (
            <p className="text-muted text-center">
              Welcome! Get started by adding children and subjects, then log some time entries.
            </p>
          ) : (
            <p className="text-muted text-center">
              No time entries logged for the current school year yet. Start tracking to see your progress here!
            </p>
          )}
        </div>
      )}

      {hasData && (
        <>
          {/* Child Cards */}
          <div className="grid grid-2">
            {state.children.map((child) => {
              const stats = childStats[child.id];
              const hasStats = stats && stats.totalMinutes > 0;

              return (
                <div key={child.id} className="card">
                  <div style={{ borderLeft: '4px solid #007bff', paddingLeft: '15px', marginBottom: '15px' }}>
                    <h3 style={{ marginBottom: '5px', color: 'var(--text-primary)' }}>
                      {child.name}
                    </h3>
                    {child.grade && (
                      <p className="text-muted" style={{ fontSize: '14px', margin: 0 }}>
                        Grade: {child.grade}
                      </p>
                    )}
                  </div>

                  {!hasStats ? (
                    <p className="text-muted" style={{ textAlign: 'center', padding: '20px' }}>
                      No hours logged yet
                    </p>
                  ) : (
                    <>
                      {/* Progress Tracking Section */}
                      {(() => {
                        const requirements = getChildRequirements(child.id);
                        const hasRequirements = requirements && (
                          requirements.totalHours ||
                          requirements.coreHours ||
                          requirements.nonCoreHours ||
                          requirements.homeHours ||
                          requirements.awayHours
                        );

                        if (!hasRequirements) return null;

                        const progressItems = [];

                        if (requirements.totalHours) {
                          const actual = stats.totalMinutes / 60;
                          const required = requirements.totalHours;
                          const percentage = Math.min((actual / required) * 100, 100);
                          progressItems.push({
                            label: 'Total Hours',
                            actual,
                            required,
                            percentage,
                            color: '#007bff'
                          });
                        }

                        if (requirements.coreHours) {
                          const actual = stats.coreMinutes / 60;
                          const required = requirements.coreHours;
                          const percentage = Math.min((actual / required) * 100, 100);
                          progressItems.push({
                            label: 'Core Hours',
                            actual,
                            required,
                            percentage,
                            color: '#007bff'
                          });
                        }

                        if (requirements.nonCoreHours) {
                          const actual = stats.nonCoreMinutes / 60;
                          const required = requirements.nonCoreHours;
                          const percentage = Math.min((actual / required) * 100, 100);
                          progressItems.push({
                            label: 'Non-Core Hours',
                            actual,
                            required,
                            percentage,
                            color: '#6c757d'
                          });
                        }

                        if (requirements.homeHours) {
                          const actual = stats.homeMinutes / 60;
                          const required = requirements.homeHours;
                          const percentage = Math.min((actual / required) * 100, 100);
                          progressItems.push({
                            label: 'Home Hours',
                            actual,
                            required,
                            percentage,
                            color: '#28a745'
                          });
                        }

                        if (requirements.awayHours) {
                          const actual = stats.awayMinutes / 60;
                          const required = requirements.awayHours;
                          const percentage = Math.min((actual / required) * 100, 100);
                          progressItems.push({
                            label: 'Away Hours',
                            actual,
                            required,
                            percentage,
                            color: '#17a2b8'
                          });
                        }

                        return (
                          <div style={{ marginBottom: '20px' }}>
                            <h4 style={{ fontSize: '14px', marginBottom: '15px', color: 'var(--text-secondary)' }}>
                              Progress Toward Requirements
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              {progressItems.map((item) => (
                                <div key={item.label}>
                                  <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginBottom: '5px',
                                    fontSize: '12px'
                                  }}>
                                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                      {item.label}
                                    </span>
                                    <span style={{ color: 'var(--text-secondary)' }}>
                                      {item.actual.toFixed(1)} / {item.required} hrs
                                      <span style={{ marginLeft: '8px', fontWeight: '600' }}>
                                        {item.percentage.toFixed(0)}%
                                      </span>
                                    </span>
                                  </div>
                                  <div style={{
                                    width: '100%',
                                    height: '8px',
                                    backgroundColor: 'var(--bg-tertiary)',
                                    borderRadius: '4px',
                                    overflow: 'hidden'
                                  }}>
                                    <div
                                      style={{
                                        width: `${item.percentage}%`,
                                        height: '100%',
                                        backgroundColor: item.color,
                                        transition: 'width 0.3s ease'
                                      }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Divider */}
                      {getChildRequirements(child.id) && (
                        <div style={{
                          borderTop: '1px solid var(--border-color)',
                          marginBottom: '20px'
                        }} />
                      )}

                      {/* Core vs Non-Core Hours */}
                      <div style={{ marginBottom: '20px' }}>
                        <h4 style={{ fontSize: '14px', marginBottom: '10px', color: 'var(--text-secondary)' }}>
                          Hours by Category
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div style={{
                            padding: '12px',
                            background: 'var(--bg-tertiary)',
                            borderRadius: '8px',
                            borderLeft: '4px solid #007bff'
                          }}>
                            <p className="text-muted" style={{ fontSize: '11px', marginBottom: '4px' }}>
                              Core
                            </p>
                            <p style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
                              {formatHoursDecimal(stats.coreMinutes)}
                            </p>
                            <p className="text-muted" style={{ fontSize: '10px', marginTop: '2px' }}>
                              hours
                            </p>
                          </div>
                          <div style={{
                            padding: '12px',
                            background: 'var(--bg-tertiary)',
                            borderRadius: '8px',
                            borderLeft: '4px solid #6c757d'
                          }}>
                            <p className="text-muted" style={{ fontSize: '11px', marginBottom: '4px' }}>
                              Non-Core
                            </p>
                            <p style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
                              {formatHoursDecimal(stats.nonCoreMinutes)}
                            </p>
                            <p className="text-muted" style={{ fontSize: '10px', marginTop: '2px' }}>
                              hours
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Home vs Away Hours */}
                      <div style={{ marginBottom: '20px' }}>
                        <h4 style={{ fontSize: '14px', marginBottom: '10px', color: 'var(--text-secondary)' }}>
                          Hours by Location
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div style={{
                            padding: '12px',
                            background: 'var(--bg-tertiary)',
                            borderRadius: '8px',
                            borderLeft: '4px solid #28a745'
                          }}>
                            <p className="text-muted" style={{ fontSize: '11px', marginBottom: '4px' }}>
                              Home
                            </p>
                            <p style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
                              {formatHoursDecimal(stats.homeMinutes)}
                            </p>
                            <p className="text-muted" style={{ fontSize: '10px', marginTop: '2px' }}>
                              hours
                            </p>
                          </div>
                          <div style={{
                            padding: '12px',
                            background: 'var(--bg-tertiary)',
                            borderRadius: '8px',
                            borderLeft: '4px solid #17a2b8'
                          }}>
                            <p className="text-muted" style={{ fontSize: '11px', marginBottom: '4px' }}>
                              Away
                            </p>
                            <p style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
                              {formatHoursDecimal(stats.awayMinutes)}
                            </p>
                            <p className="text-muted" style={{ fontSize: '10px', marginTop: '2px' }}>
                              hours
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 style={{ fontSize: '14px', marginBottom: '10px', color: 'var(--text-secondary)' }}>
                          Hours by Subject
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {Object.entries(stats.subjects)
                            .sort(([, a], [, b]) => b - a)
                            .map(([subjectId, minutes]) => {
                              const percentage = (minutes / stats.totalMinutes) * 100;
                              const color = getSubjectColor(subjectId);

                              return (
                                <div key={subjectId}>
                                  <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginBottom: '4px',
                                    fontSize: '13px'
                                  }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <div
                                        style={{
                                          width: '10px',
                                          height: '10px',
                                          backgroundColor: color,
                                          borderRadius: '50%'
                                        }}
                                      />
                                      {getSubjectName(subjectId)}
                                    </span>
                                    <span style={{ fontWeight: '600' }}>
                                      {formatHoursDecimal(minutes)} hrs
                                    </span>
                                  </div>
                                  <div style={{
                                    width: '100%',
                                    height: '6px',
                                    backgroundColor: 'var(--bg-tertiary)',
                                    borderRadius: '3px',
                                    overflow: 'hidden'
                                  }}>
                                    <div
                                      style={{
                                        width: `${percentage}%`,
                                        height: '100%',
                                        backgroundColor: color,
                                        transition: 'width 0.3s ease'
                                      }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
