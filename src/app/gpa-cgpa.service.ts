import { Injectable } from '@angular/core';

export type UolGrade = 'A' | 'A-' | 'B+' | 'B' | 'C+' | 'C' | 'D+' | 'D' | 'F';

export interface Course {
  name?: string;
  creditHours: number;
  grade: UolGrade;
}

export interface SemesterSummary {
  name: string;
  gpa: number;
  creditHours: number;
}

// Strict UOL grade points mapping
const GRADE_POINTS: Record<UolGrade, number> = {
  A: 4.0,
  'A-': 3.75,
  'B+': 3.5,
  B: 3.0,
  'C+': 2.5,
  C: 2.0,
  'D+': 1.5,
  D: 1.0,
  F: 0.0,
};

@Injectable({
  providedIn: 'root',
})
export class GpaCgpaService {
  /**
   * GPA = Σ (Credit Hours × Grade Points) / Total Credit Hours
   */
  calculateGpa(courses: Course[]): { gpa: number; totalCreditHours: number } {
    const validCourses = courses.filter(
      (c) =>
        c &&
        Number.isFinite(c.creditHours) &&
        c.creditHours > 0 &&
        GRADE_POINTS[c.grade as UolGrade] !== undefined,
    );

    const totalCreditHours = validCourses.reduce(
      (sum, c) => sum + c.creditHours,
      0,
    );

    if (totalCreditHours <= 0 || !Number.isFinite(totalCreditHours)) {
      return { gpa: 0, totalCreditHours: 0 };
    }

    const totalPoints = validCourses.reduce((sum, c) => {
      const gradePoints = GRADE_POINTS[c.grade as UolGrade] ?? 0;
      return sum + c.creditHours * gradePoints;
    }, 0);

    const rawGpa = totalPoints / totalCreditHours;
    const gpa = Number.isFinite(rawGpa) ? this.roundToTwo(rawGpa) : 0;

    return { gpa, totalCreditHours };
  }

  /**
   * Weighted CGPA = Σ (semesterGpa × semesterCreditHours) / Σ (semesterCreditHours)
   * Uses weighted credit hours across all semesters, not simple average.
   */
  calculateCgpa(
    semesters: SemesterSummary[],
  ): { cgpa: number | null; totalCreditHours: number } {
    const validSemesters = semesters.filter(
      (s) =>
        s &&
        Number.isFinite(s.gpa) &&
        s.gpa >= 0 &&
        s.gpa <= 4 &&
        Number.isFinite(s.creditHours) &&
        s.creditHours > 0,
    );

    if (validSemesters.length === 0) {
      return { cgpa: null, totalCreditHours: 0 };
    }

    const totalCreditHours = validSemesters.reduce(
      (sum, s) => sum + s.creditHours,
      0,
    );

    if (totalCreditHours <= 0 || !Number.isFinite(totalCreditHours)) {
      return { cgpa: null, totalCreditHours: 0 };
    }

    const totalWeightedPoints = validSemesters.reduce(
      (sum, s) => sum + s.gpa * s.creditHours,
      0,
    );

    const rawCgpa = totalWeightedPoints / totalCreditHours;
    const cgpa = Number.isFinite(rawCgpa) ? this.roundToTwo(rawCgpa) : 0;

    return { cgpa, totalCreditHours };
  }

  getGradeOptions(): UolGrade[] {
    return ['A', 'A-', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'];
  }

  getAllowedCreditHours(): number[] {
    return [1, 2, 3, 4];
  }

  private roundToTwo(value: number): number {
    return Math.round(value * 100) / 100;
  }
}


