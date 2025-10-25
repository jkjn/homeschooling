import { describe, it, expect, beforeEach } from 'vitest';
import { generateId, parseLocalDate, loadState, saveState, defaultState } from './storage';

describe('storage utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('generateId', () => {
    it('should generate a unique ID', () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });

    it('should generate a string ID', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
    });
  });

  describe('parseLocalDate', () => {
    it('should parse YYYY-MM-DD format as local date', () => {
      const dateString = '2025-01-15';
      const result = parseLocalDate(dateString);

      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(0); // January is 0
      expect(result.getDate()).toBe(15);
    });

    it('should handle different months correctly', () => {
      const dateString = '2025-12-25';
      const result = parseLocalDate(dateString);

      expect(result.getMonth()).toBe(11); // December is 11
      expect(result.getDate()).toBe(25);
    });

    it('should parse dates without timezone offset', () => {
      const dateString = '2025-06-15';
      const result = parseLocalDate(dateString);

      // The date should be at midnight local time, not UTC
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
    });
  });

  describe('loadState', () => {
    it('should return default state when localStorage is empty', () => {
      const state = loadState();

      expect(state).toEqual(defaultState);
      expect(state.students).toEqual([]);
      expect(state.subjects).toEqual([]);
      expect(state.timeEntries).toEqual([]);
    });

    it('should load and parse saved state from localStorage', () => {
      const testState = {
        students: [
          {
            id: 'test-student-1',
            name: 'John Doe',
            grade: '5th',
            createdAt: new Date('2025-01-01').toISOString(),
          },
        ],
        subjects: [
          {
            id: 'test-subject-1',
            name: 'Math',
            category: 'Core' as const,
            createdAt: new Date('2025-01-01').toISOString(),
          },
        ],
        timeEntries: [
          {
            id: 'test-entry-1',
            studentId: 'test-student-1',
            subjectId: 'test-subject-1',
            date: '2025-01-15',
            duration: 60,
            location: 'Home' as const,
            createdAt: new Date('2025-01-15').toISOString(),
          },
        ],
      };

      localStorage.setItem('homeschool-tracker-data', JSON.stringify(testState));

      const state = loadState();

      expect(state.students).toHaveLength(1);
      expect(state.students[0].name).toBe('John Doe');
      expect(state.students[0].createdAt).toBeInstanceOf(Date);

      expect(state.subjects).toHaveLength(1);
      expect(state.subjects[0].name).toBe('Math');
      expect(state.subjects[0].category).toBe('Core');

      expect(state.timeEntries).toHaveLength(1);
      expect(state.timeEntries[0].duration).toBe(60);
      expect(state.timeEntries[0].date).toBeInstanceOf(Date);
    });

    it('should migrate old "children" field to "students"', () => {
      const oldState = {
        children: [
          {
            id: 'old-child-1',
            name: 'Jane Doe',
            createdAt: new Date('2025-01-01').toISOString(),
          },
        ],
        subjects: [],
        timeEntries: [],
      };

      localStorage.setItem('homeschool-tracker-data', JSON.stringify(oldState));

      const state = loadState();

      expect(state.students).toHaveLength(1);
      expect(state.students[0].name).toBe('Jane Doe');
    });

    it('should migrate old "childId" to "studentId" in time entries', () => {
      const oldState = {
        students: [],
        subjects: [],
        timeEntries: [
          {
            id: 'old-entry-1',
            childId: 'old-child-1',
            subjectId: 'subject-1',
            date: '2025-01-15',
            duration: 30,
            createdAt: new Date('2025-01-15').toISOString(),
          },
        ],
      };

      localStorage.setItem('homeschool-tracker-data', JSON.stringify(oldState));

      const state = loadState();

      expect(state.timeEntries[0].studentId).toBe('old-child-1');
    });

    it('should default location to "Home" for entries without location', () => {
      const oldState = {
        students: [],
        subjects: [],
        timeEntries: [
          {
            id: 'entry-1',
            studentId: 'student-1',
            subjectId: 'subject-1',
            date: '2025-01-15',
            duration: 45,
            createdAt: new Date('2025-01-15').toISOString(),
          },
        ],
      };

      localStorage.setItem('homeschool-tracker-data', JSON.stringify(oldState));

      const state = loadState();

      expect(state.timeEntries[0].location).toBe('Home');
    });

    it('should handle invalid JSON gracefully', () => {
      localStorage.setItem('homeschool-tracker-data', 'invalid json');

      const state = loadState();

      expect(state).toEqual(defaultState);
    });
  });

  describe('saveState', () => {
    it('should save state to localStorage', () => {
      const testState = {
        students: [
          {
            id: 'student-1',
            name: 'Alice',
            createdAt: new Date('2025-01-01'),
          },
        ],
        subjects: [
          {
            id: 'subject-1',
            name: 'Science',
            category: 'Core' as const,
            createdAt: new Date('2025-01-01'),
          },
        ],
        timeEntries: [],
      };

      saveState(testState);

      const saved = localStorage.getItem('homeschool-tracker-data');
      expect(saved).toBeTruthy();

      const parsed = JSON.parse(saved!);
      expect(parsed.students).toHaveLength(1);
      expect(parsed.students[0].name).toBe('Alice');
      expect(parsed.subjects[0].name).toBe('Science');
    });

    it('should serialize dates correctly', () => {
      const now = new Date('2025-01-15T12:00:00Z');
      const testState = {
        students: [
          {
            id: 'student-1',
            name: 'Bob',
            createdAt: now,
          },
        ],
        subjects: [],
        timeEntries: [],
      };

      saveState(testState);

      const saved = localStorage.getItem('homeschool-tracker-data');
      const parsed = JSON.parse(saved!);

      expect(typeof parsed.students[0].createdAt).toBe('string');
      expect(new Date(parsed.students[0].createdAt).getTime()).toBe(now.getTime());
    });
  });
});
