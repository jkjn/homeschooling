import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AppState, Student, Subject, TimeEntry } from '../types';
import { loadState, saveState, generateId } from '../utils/storage';

type AppAction =
  | { type: 'ADD_STUDENT'; student: Omit<Student, 'id' | 'createdAt'> }
  | { type: 'UPDATE_STUDENT'; id: string; updates: Partial<Student> }
  | { type: 'DELETE_STUDENT'; id: string }
  | { type: 'ADD_SUBJECT'; subject: Omit<Subject, 'id' | 'createdAt'> }
  | { type: 'UPDATE_SUBJECT'; id: string; updates: Partial<Subject> }
  | { type: 'DELETE_SUBJECT'; id: string }
  | { type: 'ADD_TIME_ENTRY'; entry: Omit<TimeEntry, 'id' | 'createdAt'> }
  | { type: 'UPDATE_TIME_ENTRY'; id: string; updates: Partial<TimeEntry> }
  | { type: 'DELETE_TIME_ENTRY'; id: string };

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'ADD_STUDENT':
      return {
        ...state,
        students: [...state.students, {
          ...action.student,
          id: generateId(),
          createdAt: new Date()
        }]
      };
    case 'UPDATE_STUDENT':
      return {
        ...state,
        students: state.students.map(student =>
          student.id === action.id ? { ...student, ...action.updates } : student
        )
      };
    case 'DELETE_STUDENT':
      return {
        ...state,
        students: state.students.filter(student => student.id !== action.id),
        timeEntries: state.timeEntries.filter(entry => entry.studentId !== action.id)
      };
    case 'ADD_SUBJECT':
      return {
        ...state,
        subjects: [...state.subjects, {
          ...action.subject,
          id: generateId(),
          createdAt: new Date()
        }]
      };
    case 'UPDATE_SUBJECT':
      return {
        ...state,
        subjects: state.subjects.map(subject =>
          subject.id === action.id ? { ...subject, ...action.updates } : subject
        )
      };
    case 'DELETE_SUBJECT':
      return {
        ...state,
        subjects: state.subjects.filter(subject => subject.id !== action.id),
        timeEntries: state.timeEntries.filter(entry => entry.subjectId !== action.id)
      };
    case 'ADD_TIME_ENTRY':
      return {
        ...state,
        timeEntries: [...state.timeEntries, {
          ...action.entry,
          id: generateId(),
          createdAt: new Date()
        }]
      };
    case 'UPDATE_TIME_ENTRY':
      return {
        ...state,
        timeEntries: state.timeEntries.map(entry =>
          entry.id === action.id ? { ...entry, ...action.updates } : entry
        )
      };
    case 'DELETE_TIME_ENTRY':
      return {
        ...state,
        timeEntries: state.timeEntries.filter(entry => entry.id !== action.id)
      };
    default:
      return state;
  }
};

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppState = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  return context;
};