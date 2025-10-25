import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AppProvider, useAppState } from './useAppState';
import { ReactNode } from 'react';

// Wrapper component for testing
const wrapper = ({ children }: { children: ReactNode }) => (
  <AppProvider>{children}</AppProvider>
);

describe('useAppState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Students Management', () => {
    it('should add a new student', () => {
      const { result } = renderHook(() => useAppState(), { wrapper });

      act(() => {
        result.current.dispatch({
          type: 'ADD_STUDENT',
          student: {
            name: 'John Doe',
            grade: '5th',
          },
        });
      });

      expect(result.current.state.students).toHaveLength(1);
      expect(result.current.state.students[0].name).toBe('John Doe');
      expect(result.current.state.students[0].grade).toBe('5th');
      expect(result.current.state.students[0].id).toBeTruthy();
    });

    it('should update a student', () => {
      const { result } = renderHook(() => useAppState(), { wrapper });

      act(() => {
        result.current.dispatch({
          type: 'ADD_STUDENT',
          student: {
            name: 'Jane Doe',
            grade: '3rd',
          },
        });
      });

      const studentId = result.current.state.students[0].id;

      act(() => {
        result.current.dispatch({
          type: 'UPDATE_STUDENT',
          id: studentId,
          updates: {
            name: 'Jane Smith',
            grade: '4th',
          },
        });
      });

      expect(result.current.state.students[0].name).toBe('Jane Smith');
      expect(result.current.state.students[0].grade).toBe('4th');
    });

    it('should delete a student', () => {
      const { result } = renderHook(() => useAppState(), { wrapper });

      act(() => {
        result.current.dispatch({
          type: 'ADD_STUDENT',
          student: { name: 'Test Student' },
        });
      });

      const studentId = result.current.state.students[0].id;

      act(() => {
        result.current.dispatch({
          type: 'DELETE_STUDENT',
          id: studentId,
        });
      });

      expect(result.current.state.students).toHaveLength(0);
    });
  });

  describe('Subjects Management', () => {
    it('should add a new subject', () => {
      const { result } = renderHook(() => useAppState(), { wrapper });

      act(() => {
        result.current.dispatch({
          type: 'ADD_SUBJECT',
          subject: {
            name: 'Mathematics',
            category: 'Core',
            color: '#ff0000',
          },
        });
      });

      expect(result.current.state.subjects).toHaveLength(1);
      expect(result.current.state.subjects[0].name).toBe('Mathematics');
      expect(result.current.state.subjects[0].category).toBe('Core');
      expect(result.current.state.subjects[0].color).toBe('#ff0000');
    });

    it('should update a subject', () => {
      const { result } = renderHook(() => useAppState(), { wrapper });

      act(() => {
        result.current.dispatch({
          type: 'ADD_SUBJECT',
          subject: {
            name: 'Science',
            category: 'Core',
          },
        });
      });

      const subjectId = result.current.state.subjects[0].id;

      act(() => {
        result.current.dispatch({
          type: 'UPDATE_SUBJECT',
          id: subjectId,
          updates: {
            name: 'Biology',
            category: 'Non-Core',
            color: '#00ff00',
          },
        });
      });

      expect(result.current.state.subjects[0].name).toBe('Biology');
      expect(result.current.state.subjects[0].category).toBe('Non-Core');
      expect(result.current.state.subjects[0].color).toBe('#00ff00');
    });

    it('should delete a subject', () => {
      const { result } = renderHook(() => useAppState(), { wrapper });

      act(() => {
        result.current.dispatch({
          type: 'ADD_SUBJECT',
          subject: { name: 'Art', category: 'Non-Core' },
        });
      });

      const subjectId = result.current.state.subjects[0].id;

      act(() => {
        result.current.dispatch({
          type: 'DELETE_SUBJECT',
          id: subjectId,
        });
      });

      expect(result.current.state.subjects).toHaveLength(0);
    });
  });

  describe('Time Entries Management', () => {
    it('should add a new time entry', () => {
      const { result } = renderHook(() => useAppState(), { wrapper });

      const testDate = new Date('2025-01-15');

      act(() => {
        result.current.dispatch({
          type: 'ADD_TIME_ENTRY',
          entry: {
            studentId: 'student-1',
            subjectId: 'subject-1',
            date: testDate,
            duration: 60,
            location: 'Home',
            notes: 'Test notes',
          },
        });
      });

      expect(result.current.state.timeEntries).toHaveLength(1);
      expect(result.current.state.timeEntries[0].studentId).toBe('student-1');
      expect(result.current.state.timeEntries[0].duration).toBe(60);
      expect(result.current.state.timeEntries[0].location).toBe('Home');
      expect(result.current.state.timeEntries[0].notes).toBe('Test notes');
    });

    it('should update a time entry', () => {
      const { result } = renderHook(() => useAppState(), { wrapper });

      act(() => {
        result.current.dispatch({
          type: 'ADD_TIME_ENTRY',
          entry: {
            studentId: 'student-1',
            subjectId: 'subject-1',
            date: new Date('2025-01-15'),
            duration: 30,
            location: 'Home',
          },
        });
      });

      const entryId = result.current.state.timeEntries[0].id;

      act(() => {
        result.current.dispatch({
          type: 'UPDATE_TIME_ENTRY',
          id: entryId,
          updates: {
            duration: 90,
            location: 'Away',
            notes: 'Updated notes',
          },
        });
      });

      expect(result.current.state.timeEntries[0].duration).toBe(90);
      expect(result.current.state.timeEntries[0].location).toBe('Away');
      expect(result.current.state.timeEntries[0].notes).toBe('Updated notes');
    });

    it('should delete a time entry', () => {
      const { result } = renderHook(() => useAppState(), { wrapper });

      act(() => {
        result.current.dispatch({
          type: 'ADD_TIME_ENTRY',
          entry: {
            studentId: 'student-1',
            subjectId: 'subject-1',
            date: new Date('2025-01-15'),
            duration: 45,
            location: 'Home',
          },
        });
      });

      const entryId = result.current.state.timeEntries[0].id;

      act(() => {
        result.current.dispatch({
          type: 'DELETE_TIME_ENTRY',
          id: entryId,
        });
      });

      expect(result.current.state.timeEntries).toHaveLength(0);
    });

    it('should handle tags on time entries', () => {
      const { result } = renderHook(() => useAppState(), { wrapper });

      act(() => {
        result.current.dispatch({
          type: 'ADD_TIME_ENTRY',
          entry: {
            studentId: 'student-1',
            subjectId: 'subject-1',
            date: new Date('2025-01-15'),
            duration: 60,
            location: 'Home',
            tags: ['Recurring', 'Project'],
          },
        });
      });

      expect(result.current.state.timeEntries[0].tags).toEqual(['Recurring', 'Project']);
    });
  });

  describe('State Persistence', () => {
    it('should persist state to localStorage', () => {
      const { result } = renderHook(() => useAppState(), { wrapper });

      act(() => {
        result.current.dispatch({
          type: 'ADD_STUDENT',
          student: { name: 'Persistent Student' },
        });
      });

      const saved = localStorage.getItem('homeschool-tracker-data');
      expect(saved).toBeTruthy();

      const parsed = JSON.parse(saved!);
      expect(parsed.students).toHaveLength(1);
      expect(parsed.students[0].name).toBe('Persistent Student');
    });

    it('should load persisted state on mount', () => {
      // Set up initial state in localStorage
      const initialState = {
        students: [
          {
            id: 'student-1',
            name: 'Loaded Student',
            createdAt: new Date().toISOString(),
          },
        ],
        subjects: [],
        timeEntries: [],
      };

      localStorage.setItem('homeschool-tracker-data', JSON.stringify(initialState));

      const { result } = renderHook(() => useAppState(), { wrapper });

      expect(result.current.state.students).toHaveLength(1);
      expect(result.current.state.students[0].name).toBe('Loaded Student');
    });
  });
});
