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
      timeEntries: parsed.timeEntries.map((entry: any) => ({
        ...entry,
        // Migrate old "childId" to "studentId"
        studentId: entry.studentId || entry.childId,
        date: new Date(entry.date),
        startTime: entry.startTime ? new Date(entry.startTime) : undefined,
        endTime: entry.endTime ? new Date(entry.endTime) : undefined,
        location: entry.location || 'Home', // Default to Home for existing entries
        createdAt: new Date(entry.createdAt)
      }))
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