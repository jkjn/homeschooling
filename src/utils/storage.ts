import { AppState } from '../types';

const STORAGE_KEY = 'homeschool-tracker-data';

export const defaultState: AppState = {
  students: [],
  subjects: [],
  timeEntries: []
};

export const loadState = (): AppState => {
  try {
    const serializedState = localStorage.getItem(STORAGE_KEY);
    if (serializedState === null) {
      return defaultState;
    }
    const parsed = JSON.parse(serializedState);

    // Migrate old "children" field to "students"
    const studentsData = parsed.students || parsed.children || [];

    // Convert date strings back to Date objects and migrate old data
    return {
      students: studentsData.map((student: any) => ({
        ...student,
        createdAt: new Date(student.createdAt)
      })),
      subjects: parsed.subjects.map((subject: any) => ({
        ...subject,
        category: subject.category || 'Core', // Default to Core for existing subjects
        createdAt: new Date(subject.createdAt)
      })),
      timeEntries: parsed.timeEntries.map((entry: any) => {
        // Parse the date correctly - if it's a date-only string, parse as local date
        let entryDate: Date;
        const dateStr = entry.date;
        if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          // Date-only format (YYYY-MM-DD) - parse as local date
          entryDate = parseLocalDate(dateStr);
        } else {
          // ISO string with time - parse normally
          entryDate = new Date(dateStr);
        }

        return {
          ...entry,
          // Migrate old "childId" to "studentId"
          studentId: entry.studentId || entry.childId,
          date: entryDate,
          startTime: entry.startTime ? new Date(entry.startTime) : undefined,
          endTime: entry.endTime ? new Date(entry.endTime) : undefined,
          location: entry.location || 'Home', // Default to Home for existing entries
          createdAt: new Date(entry.createdAt)
        };
      })
    };
  } catch (err) {
    console.error('Error loading state from localStorage:', err);
    return defaultState;
  }
};

export const saveState = (state: AppState): void => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serializedState);
  } catch (err) {
    console.error('Error saving state to localStorage:', err);
  }
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Parse date string (YYYY-MM-DD) as local date, not UTC
export const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
};