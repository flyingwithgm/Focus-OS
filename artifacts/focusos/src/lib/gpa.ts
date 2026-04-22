import { Semester } from './types';

export const SCALES = {
  UG: {
    name: 'UG (Ghana) - 4.0',
    grades: {
      'A': { points: 4.0, min: 80, max: 100 },
      'B+': { points: 3.5, min: 75, max: 79 },
      'B': { points: 3.0, min: 70, max: 74 },
      'C+': { points: 2.5, min: 65, max: 69 },
      'C': { points: 2.0, min: 60, max: 64 },
      'D+': { points: 1.5, min: 55, max: 59 },
      'D': { points: 1.0, min: 50, max: 54 },
      'E': { points: 0.5, min: 45, max: 49 },
      'F': { points: 0.0, min: 0, max: 44 }
    }
  },
  KNUST: {
    name: 'KNUST (Ghana) - 100%',
    grades: {
      'A': { points: 4.0, min: 70, max: 100 },
      'B': { points: 3.0, min: 60, max: 69 },
      'C': { points: 2.0, min: 50, max: 59 },
      'D': { points: 1.0, min: 45, max: 49 },
      'F': { points: 0.0, min: 0, max: 44 }
    },
    isPercentage: true
  },
  US: {
    name: 'US/Canada - 4.0',
    grades: {
      'A+': { points: 4.0, min: 97, max: 100 },
      'A': { points: 4.0, min: 93, max: 96 },
      'A-': { points: 3.7, min: 90, max: 92 },
      'B+': { points: 3.3, min: 87, max: 89 },
      'B': { points: 3.0, min: 83, max: 86 },
      'B-': { points: 2.7, min: 80, max: 82 },
      'C+': { points: 2.3, min: 77, max: 79 },
      'C': { points: 2.0, min: 73, max: 76 },
      'C-': { points: 1.7, min: 70, max: 72 },
      'D+': { points: 1.3, min: 67, max: 69 },
      'D': { points: 1.0, min: 65, max: 66 },
      'F': { points: 0.0, min: 0, max: 64 }
    }
  },
  UK: {
    name: 'UK Classifications - 4.0',
    grades: {
      'First': { points: 4.0, min: 70, max: 100 },
      'Upper Second (2:1)': { points: 3.3, min: 60, max: 69 },
      'Lower Second (2:2)': { points: 2.7, min: 50, max: 59 },
      'Third': { points: 2.0, min: 40, max: 49 },
      'Fail': { points: 0.0, min: 0, max: 39 }
    }
  }
};

type GradeDef = { points: number; min: number; max: number };

export function scoreToGrade(score: number, scaleKey: string): string {
  const scale = SCALES[scaleKey as keyof typeof SCALES] || SCALES['UG'];
  for (const [grade, def] of Object.entries(scale.grades) as [string, GradeDef][]) {
    if (score >= def.min && score <= def.max) return grade;
  }
  return '';
}

export function calculateSemesterGPA(semester: Semester, scaleKey: string = 'UG') {
  const scale = SCALES[scaleKey as keyof typeof SCALES] || SCALES['UG'];
  let totalPoints = 0;
  let totalCredits = 0;

  for (const course of semester.courses) {
    if (!course.grade) continue;
    
    const gradeDef = (scale.grades as Record<string, GradeDef>)[course.grade];
    if (gradeDef) {
      totalPoints += gradeDef.points * course.credits;
      totalCredits += course.credits;
    }
  }

  if (totalCredits === 0) return 0;
  return totalPoints / totalCredits;
}

export function calculateCumulativeGPA(semesters: Semester[], scaleKey: string = 'UG', baselineGpa: number = 0, baselineCredits: number = 0) {
  const scale = SCALES[scaleKey as keyof typeof SCALES] || SCALES['UG'];
  let totalPoints = baselineGpa * baselineCredits;
  let totalCredits = baselineCredits;

  for (const sem of semesters) {
    for (const course of sem.courses) {
      if (!course.grade) continue;
      
      const gradeDef = (scale.grades as Record<string, GradeDef>)[course.grade];
      if (gradeDef) {
        totalPoints += gradeDef.points * course.credits;
        totalCredits += course.credits;
      }
    }
  }

  if (totalCredits === 0) return 0;
  return totalPoints / totalCredits;
}
