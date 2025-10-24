export interface Student {
  id: string;
  name: string;
  grade?: string;
  requirements?: {
    totalHours?: number;
    coreHours?: number;
    nonCoreHours?: number;
    homeHours?: number;
    awayHours?: number;
  };
  subjectCurriculum?: {
    [subjectId: string]: {
      curriculum?: string;
      cost?: string;
      notes?: string;
    }
  };
  createdAt: Date;
}

export interface Subject {
  id: string;
  name: string;
  color?: string;
  category: 'Core' | 'Non-Core';
  createdAt: Date;
}

export interface TimeEntry {
  id: string;
  studentId: string;
  subjectId: string;
  date: Date;
  startTime?: Date;
  endTime?: Date;
  duration: number; // in minutes
  location: 'Home' | 'Away';
  notes?: string;
  createdAt: Date;
}

export interface AppState {
  students: Student[];
  subjects: Subject[];
  timeEntries: TimeEntry[];
}