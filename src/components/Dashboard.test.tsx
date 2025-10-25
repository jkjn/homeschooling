import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Dashboard from './Dashboard';
import { AppProvider } from '../hooks/useAppState';

// Wrapper for testing with AppProvider
const renderWithProvider = (component: React.ReactElement) => {
  return render(<AppProvider>{component}</AppProvider>);
};

describe('Dashboard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should render dashboard title and description', () => {
    renderWithProvider(<Dashboard />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/Dashboard - School Year/);
    expect(screen.getByText(/Overview of learning hours from July 1 to today/i)).toBeInTheDocument();
  });

  it('should show welcome message when no students exist', () => {
    renderWithProvider(<Dashboard />);

    expect(screen.getByText(/Welcome! Get started by adding students and subjects/i)).toBeInTheDocument();
  });

  it('should show "no entries" message when students exist but no time entries', () => {
    // Pre-populate localStorage with a student but no time entries
    const initialState = {
      students: [
        {
          id: 'student-1',
          name: 'John Doe',
          createdAt: new Date().toISOString(),
        },
      ],
      subjects: [],
      timeEntries: [],
    };

    localStorage.setItem('homeschool-tracker-data', JSON.stringify(initialState));

    renderWithProvider(<Dashboard />);

    expect(screen.getByText(/No time entries logged for the current school year yet/i)).toBeInTheDocument();
  });

  it('should display student cards when data exists', () => {
    const now = new Date();
    const initialState = {
      students: [
        {
          id: 'student-1',
          name: 'Alice Smith',
          grade: '5th',
          createdAt: now.toISOString(),
        },
      ],
      subjects: [
        {
          id: 'subject-1',
          name: 'Math',
          category: 'Core',
          createdAt: now.toISOString(),
        },
      ],
      timeEntries: [
        {
          id: 'entry-1',
          studentId: 'student-1',
          subjectId: 'subject-1',
          date: now.toISOString(),
          duration: 60,
          location: 'Home',
          createdAt: now.toISOString(),
        },
      ],
    };

    localStorage.setItem('homeschool-tracker-data', JSON.stringify(initialState));

    renderWithProvider(<Dashboard />);

    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Grade: 5th')).toBeInTheDocument();
  });

  it('should calculate and display hours correctly', () => {
    const now = new Date();
    const initialState = {
      students: [
        {
          id: 'student-1',
          name: 'Bob Jones',
          createdAt: now.toISOString(),
        },
      ],
      subjects: [
        {
          id: 'subject-1',
          name: 'Science',
          category: 'Core',
          color: '#ff0000',
          createdAt: now.toISOString(),
        },
      ],
      timeEntries: [
        {
          id: 'entry-1',
          studentId: 'student-1',
          subjectId: 'subject-1',
          date: now.toISOString(),
          duration: 120, // 2 hours
          location: 'Home',
          createdAt: now.toISOString(),
        },
      ],
    };

    localStorage.setItem('homeschool-tracker-data', JSON.stringify(initialState));

    renderWithProvider(<Dashboard />);

    // Should display hours
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    expect(screen.getByText('Science')).toBeInTheDocument();

    // Check for hours display (2.0 hours from 120 minutes)
    const hoursElements = screen.getAllByText(/2\.0/);
    expect(hoursElements.length).toBeGreaterThan(0);
  });

  it('should display core and non-core hours separately', () => {
    const now = new Date();
    const initialState = {
      students: [
        {
          id: 'student-1',
          name: 'Charlie Brown',
          createdAt: now.toISOString(),
        },
      ],
      subjects: [
        {
          id: 'subject-1',
          name: 'Math',
          category: 'Core',
          createdAt: now.toISOString(),
        },
        {
          id: 'subject-2',
          name: 'Art',
          category: 'Non-Core',
          createdAt: now.toISOString(),
        },
      ],
      timeEntries: [
        {
          id: 'entry-1',
          studentId: 'student-1',
          subjectId: 'subject-1',
          date: now.toISOString(),
          duration: 60,
          location: 'Home',
          createdAt: now.toISOString(),
        },
        {
          id: 'entry-2',
          studentId: 'student-1',
          subjectId: 'subject-2',
          date: now.toISOString(),
          duration: 30,
          location: 'Home',
          createdAt: now.toISOString(),
        },
      ],
    };

    localStorage.setItem('homeschool-tracker-data', JSON.stringify(initialState));

    renderWithProvider(<Dashboard />);

    expect(screen.getByText('Charlie Brown')).toBeInTheDocument();
    expect(screen.getByText('Hours by Category')).toBeInTheDocument();
    expect(screen.getByText('Core')).toBeInTheDocument();
    expect(screen.getByText('Non-Core')).toBeInTheDocument();
  });

  it('should display home and away hours separately', () => {
    const now = new Date();
    const initialState = {
      students: [
        {
          id: 'student-1',
          name: 'Diana Prince',
          createdAt: now.toISOString(),
        },
      ],
      subjects: [
        {
          id: 'subject-1',
          name: 'English',
          category: 'Core',
          createdAt: now.toISOString(),
        },
      ],
      timeEntries: [
        {
          id: 'entry-1',
          studentId: 'student-1',
          subjectId: 'subject-1',
          date: now.toISOString(),
          duration: 90,
          location: 'Home',
          createdAt: now.toISOString(),
        },
        {
          id: 'entry-2',
          studentId: 'student-1',
          subjectId: 'subject-1',
          date: now.toISOString(),
          duration: 60,
          location: 'Away',
          createdAt: now.toISOString(),
        },
      ],
    };

    localStorage.setItem('homeschool-tracker-data', JSON.stringify(initialState));

    renderWithProvider(<Dashboard />);

    expect(screen.getByText('Diana Prince')).toBeInTheDocument();
    expect(screen.getByText('Hours by Location')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Away')).toBeInTheDocument();
  });
});
