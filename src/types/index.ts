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
  tags?: string[]; // Custom tags for categorizing entries
  isRecurring?: boolean;
  recurringPattern?: 'none' | 'daily-weekdays' | 'weekly';
  recurringDay?: number; // 0-6 for Sunday-Saturday (only for weekly)
  recurringSeriesId?: string; // Groups recurring entries together
  recurringEndDate?: Date; // End date for recurring entries
  createdAt: Date;
}

export interface AppState {
  students: Student[];
  subjects: Subject[];
  timeEntries: TimeEntry[];
}