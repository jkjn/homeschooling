import React, { useState, useMemo } from 'react';
import { useAppState } from '../hooks/useAppState';

const Reports: React.FC = () => {
  const { state } = useAppState();
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('week');
  const [selectedSchoolYear, setSelectedSchoolYear] = useState<number>(() => {
    // Default to current school year
    const now = new Date();
    return now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Get all available school years from the data
  const availableSchoolYears = useMemo(() => {
    if (state.timeEntries.length === 0) return [];

    const years = new Set<number>();
    state.timeEntries.forEach(entry => {
      const entryDate = new Date(entry.date);
      const entryYear = entryDate.getFullYear();
      const entryMonth = entryDate.getMonth();

      // School year starts in July (month 6)
      const schoolYear = entryMonth >= 6 ? entryYear : entryYear - 1;
      years.add(schoolYear);
    });

    return Array.from(years).sort((a, b) => b - a); // Sort descending (most recent first)
  }, [state.timeEntries]);

  const getDateFilter = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (dateRange) {
      case 'today':
        return (date: Date) => date >= today;
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return (date: Date) => date >= weekAgo;
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return (date: Date) => date >= monthAgo;
      case 'schoolYearToDate':
        // School year starts July 1
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0-indexed, so July is 6
        const schoolYearStart = currentMonth >= 6
          ? new Date(currentYear, 6, 1) // July 1 of this year
          : new Date(currentYear - 1, 6, 1); // July 1 of last year
        return (date: Date) => date >= schoolYearStart && date <= today;
      case 'schoolYear':
        // Full school year (July 1 to June 30) for selected year
        const syStart = new Date(selectedSchoolYear, 6, 1); // July 1 of selected year
        syStart.setHours(0, 0, 0, 0); // Start of day
        const syEnd = new Date(selectedSchoolYear + 1, 6, 1); // July 1 of next year
        syEnd.setHours(0, 0, 0, 0); // Start of day
        return (date: Date) => {
          const entryDate = new Date(date);
          entryDate.setHours(0, 0, 0, 0); // Normalize to start of day for comparison
          return entryDate >= syStart && entryDate < syEnd;
        };
      case 'all':
      default:
        return () => true;
    }
  };

  const filteredEntries = useMemo(() => {
    const dateFilter = getDateFilter();
    return state.timeEntries.filter(entry => {
      const matchesStudent = selectedStudent === 'all' || entry.studentId === selectedStudent;
      const matchesDate = dateFilter(entry.date);
      return matchesStudent && matchesDate;
    });
  }, [state.timeEntries, selectedStudent, dateRange, selectedSchoolYear]);

  const summaryByStudent = useMemo(() => {
    const summary: Record<string, {
      totalMinutes: number;
      subjects: Record<string, number>;
      coreMinutes: number;
      nonCoreMinutes: number;
      homeMinutes: number;
      awayMinutes: number;
      entryCount: number;
    }> = {};

    filteredEntries.forEach(entry => {
      if (!summary[entry.studentId]) {
        summary[entry.studentId] = {
          totalMinutes: 0,
          subjects: {},
          coreMinutes: 0,
          nonCoreMinutes: 0,
          homeMinutes: 0,
          awayMinutes: 0,
          entryCount: 0
        };
      }

      const subject = state.subjects.find(s => s.id === entry.subjectId);
      const category = subject?.category || 'Core';
      const location = entry.location || 'Home';

      summary[entry.studentId].totalMinutes += entry.duration;
      summary[entry.studentId].entryCount += 1;

      // Track by category
      if (category === 'Core') {
        summary[entry.studentId].coreMinutes += entry.duration;
      } else {
        summary[entry.studentId].nonCoreMinutes += entry.duration;
      }

      // Track by location
      if (location === 'Home') {
        summary[entry.studentId].homeMinutes += entry.duration;
      } else {
        summary[entry.studentId].awayMinutes += entry.duration;
      }

      if (!summary[entry.studentId].subjects[entry.subjectId]) {
        summary[entry.studentId].subjects[entry.subjectId] = 0;
      }
      summary[entry.studentId].subjects[entry.subjectId] += entry.duration;
    });

    return summary;
  }, [filteredEntries, state.subjects]);

  const summaryBySubject = useMemo(() => {
    const summary: Record<string, number> = {};
    
    filteredEntries.forEach(entry => {
      if (!summary[entry.subjectId]) {
        summary[entry.subjectId] = 0;
      }
      summary[entry.subjectId] += entry.duration;
    });
    
    return summary;
  }, [filteredEntries]);

  const getStudentName = (studentId: string) => {
    const student = state.students.find(c => c.id === studentId);
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

  const formatHoursDecimal = (minutes: number) => {
    return (minutes / 60).toFixed(1);
  };

  const getStudentRequirements = (studentId: string) => {
    const student = state.students.find(c => c.id === studentId);
    return student?.requirements;
  };

  const totalMinutes = filteredEntries.reduce((sum, entry) => sum + entry.duration, 0);

  const getDateRangeLabel = () => {
    switch (dateRange) {
      case 'today': return 'Today';
      case 'week': return 'Last 7 Days';
      case 'month': return 'Last 30 Days';
      case 'schoolYearToDate': return 'School Year to Date';
      case 'schoolYear': return `School Year (${selectedSchoolYear}-${selectedSchoolYear + 1})`;
      case 'all': return 'All Time';
      default: return '';
    }
  };

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const getEntriesForDate = (date: Date) => {
    return state.timeEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate.toDateString() === date.toDateString() &&
        (selectedStudent === 'all' || entry.studentId === selectedStudent);
    });
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day);
    setSelectedDate(clickedDate);
  };

  const changeMonth = (direction: number) => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + direction, 1));
  };

  const selectedDateEntries = useMemo(() => {
    if (!selectedDate) return [];
    return getEntriesForDate(selectedDate);
  }, [selectedDate, state.timeEntries, selectedStudent]);

  return (
    <div>
      <div className="card">
        <h2>Reports & Summary</h2>
        
        <div className={`grid ${dateRange === 'schoolYear' ? 'grid-3' : 'grid-2'}`} style={{ marginBottom: '20px' }}>
          <div className="form-group">
            <label>Filter by Student</label>
            <select
              className="form-control"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
            >
              <option value="all">All Students</option>
              {state.students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Time Period</label>
            <select
              className="form-control"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="schoolYearToDate">School Year to Date</option>
              <option value="schoolYear">School Year</option>
              <option value="all">All Time</option>
            </select>
          </div>

          {dateRange === 'schoolYear' && (
            <div className="form-group">
              <label>Select School Year</label>
              <select
                className="form-control"
                value={selectedSchoolYear}
                onChange={(e) => setSelectedSchoolYear(Number(e.target.value))}
              >
                {availableSchoolYears.length > 0 ? (
                  availableSchoolYears.map((year) => (
                    <option key={year} value={year}>
                      {year}-{year + 1}
                    </option>
                  ))
                ) : (
                  <option value="">No data available</option>
                )}
              </select>
            </div>
          )}
        </div>

        <div style={{ padding: '15px', background: 'var(--bg-tertiary)', borderRadius: '4px', marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '10px', color: 'var(--text-primary)' }}>
            Summary for {getDateRangeLabel()}
            {selectedStudent !== 'all' && ` - ${getStudentName(selectedStudent)}`}
          </h3>
          <p style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
            Total Time: {formatDuration(totalMinutes)}
          </p>
          <p style={{ color: 'var(--text-muted)' }}>
            {filteredEntries.length} time {filteredEntries.length === 1 ? 'entry' : 'entries'}
          </p>
        </div>

        {/* Calendar Toggle */}
        <div style={{ marginTop: '20px' }}>
          <button
            className={`btn ${showCalendar ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowCalendar(!showCalendar)}
          >
            📅 {showCalendar ? 'Hide' : 'Show'} Calendar View
          </button>
        </div>
      </div>

      {/* Calendar View */}
      {showCalendar && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>Calendar View</h3>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button className="btn btn-secondary" onClick={() => changeMonth(-1)}>
                ‹ Prev
              </button>
              <h4 style={{ margin: 0, minWidth: '150px', textAlign: 'center' }}>
                {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h4>
              <button className="btn btn-secondary" onClick={() => changeMonth(1)}>
                Next ›
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '5px',
            marginBottom: '20px'
          }}>
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} style={{
                padding: '10px',
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: '12px',
                color: 'var(--text-secondary)'
              }}>
                {day}
              </div>
            ))}

            {/* Empty cells for days before month starts */}
            {Array.from({ length: getFirstDayOfMonth(calendarDate) }).map((_, index) => (
              <div key={`empty-${index}`} />
            ))}

            {/* Calendar days */}
            {Array.from({ length: getDaysInMonth(calendarDate) }).map((_, index) => {
              const day = index + 1;
              const currentDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day);
              const entriesForDay = getEntriesForDate(currentDate);
              const isSelected = selectedDate?.toDateString() === currentDate.toDateString();
              const isToday = currentDate.toDateString() === new Date().toDateString();

              return (
                <div
                  key={day}
                  onClick={() => handleDateClick(day)}
                  style={{
                    padding: '10px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                    background: isSelected
                      ? 'var(--accent-primary)'
                      : entriesForDay.length > 0
                      ? 'var(--hover-bg)'
                      : 'var(--bg-secondary)',
                    color: isSelected ? 'white' : 'var(--text-primary)',
                    fontWeight: isToday ? 'bold' : 'normal',
                    position: 'relative',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div>{day}</div>
                  {entriesForDay.length > 0 && (
                    <div style={{
                      fontSize: '10px',
                      marginTop: '2px',
                      color: isSelected ? 'white' : 'var(--accent-success)'
                    }}>
                      {entriesForDay.length} {entriesForDay.length === 1 ? 'entry' : 'entries'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected Date Details */}
          {selectedDate && selectedDateEntries.length > 0 && (
            <div style={{
              padding: '15px',
              background: 'var(--bg-tertiary)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <h4 style={{ marginBottom: '15px' }}>
                Entries for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selectedDateEntries.map(entry => {
                  const student = state.students.find(s => s.id === entry.studentId);
                  const subject = state.subjects.find(s => s.id === entry.subjectId);

                  return (
                    <div
                      key={entry.id}
                      style={{
                        padding: '12px',
                        background: 'var(--bg-secondary)',
                        borderRadius: '8px',
                        borderLeft: `4px solid ${subject?.color || '#ccc'}`
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <div>
                          <strong style={{ color: 'var(--text-primary)' }}>
                            {student?.name} - {subject?.name}
                          </strong>
                          {entry.isRecurring && (
                            <span className="badge badge-pink" style={{ marginLeft: '8px' }}>
                              🔁 Recurring
                            </span>
                          )}
                        </div>
                        <span className="badge badge-success">
                          {formatDuration(entry.duration)}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        <span className="badge badge-info" style={{ marginRight: '5px' }}>
                          {entry.location || 'Home'}
                        </span>
                        {entry.notes && <span>{entry.notes}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {selectedDate && selectedDateEntries.length === 0 && (
            <div style={{
              padding: '15px',
              background: 'var(--bg-tertiary)',
              borderRadius: '8px',
              textAlign: 'center',
              color: 'var(--text-muted)'
            }}>
              No entries for {selectedDate.toLocaleDateString()}
            </div>
          )}
        </div>
      )}

      {Object.keys(summaryByStudent).length > 0 && (
        <div className="grid grid-2">
          {Object.entries(summaryByStudent).map(([studentId, stats]) => {
            const student = state.students.find(s => s.id === studentId);
            if (!student) return null;

            return (
              <div key={studentId} className="card">
                <div style={{ borderLeft: '4px solid var(--accent-primary)', paddingLeft: '15px', marginBottom: '15px' }}>
                  <h3 style={{ marginBottom: '5px', color: 'var(--text-primary)' }}>
                    {student.name}
                  </h3>
                  {student.grade && (
                    <p className="text-muted" style={{ fontSize: '14px', margin: 0 }}>
                      Grade: {student.grade}
                    </p>
                  )}
                </div>

                {/* Progress Tracking Section */}
                {(() => {
                  const requirements = getStudentRequirements(studentId);
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
                      color: 'var(--accent-primary)'
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
                      color: 'var(--accent-secondary)'
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
                      color: 'var(--accent-warning)'
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
                      color: 'var(--accent-success)'
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
                      color: 'var(--accent-info)'
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
                {getStudentRequirements(studentId) && (
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
                      borderLeft: '4px solid var(--accent-secondary)'
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
                      borderLeft: '4px solid var(--accent-warning)'
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
                      borderLeft: '4px solid var(--accent-success)'
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
                      borderLeft: '4px solid var(--accent-info)'
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

                {/* Hours by Subject */}
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
              </div>
            );
          })}
        </div>
      )}

      {Object.keys(summaryBySubject).length > 0 && (
        <div className="card">
          <h3>Time by Subject</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
            {Object.entries(summaryBySubject)
              .sort(([,a], [,b]) => b - a)
              .map(([subjectId, minutes]) => {
                const percentage = totalMinutes > 0 ? (minutes / totalMinutes) * 100 : 0;
                return (
                  <div
                    key={subjectId}
                    style={{
                      padding: '15px',
                      backgroundColor: getSubjectColor(subjectId),
                      color: 'white',
                      borderRadius: '8px',
                      minWidth: '150px',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                      {getSubjectName(subjectId)}
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                      {formatDuration(minutes)}
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.9 }}>
                      {percentage.toFixed(1)}% of total
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {filteredEntries.length === 0 && (
        <div className="card">
          <p className="text-muted text-center">
            No time entries found for the selected filters. Try adjusting your selection or add some time entries.
          </p>
        </div>
      )}
    </div>
  );
};

export default Reports;