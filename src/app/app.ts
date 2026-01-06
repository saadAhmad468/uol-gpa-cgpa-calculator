import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';
import { GpaCgpaService, Course, SemesterSummary } from './gpa-cgpa.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly gpaService = inject(GpaCgpaService);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);

  readonly appTitle = signal('UOL GPA & CGPA Calculator');
  readonly gradeOptions = this.gpaService.getGradeOptions();
  readonly creditHourOptions = this.gpaService.getAllowedCreditHours();

  gpaForm: FormGroup;
  semestersForm: FormGroup;

  currentGpa = 0;
  currentTotalCreditHours = 0;

  currentCgpa: number | null = null;
  currentTotalCgpaCredits = 0;

  // UI animation flags
  isGpaPulsing = false;
  isCgpaPulsing = false;

  constructor() {
    this.gpaForm = this.fb.group({
      courses: this.fb.array([]),
    });

    this.semestersForm = this.fb.group({
      semesters: this.fb.array([]),
    });

    this.addCourse();
    this.addSemester();

    this.setupSeo();
  }

  ngOnInit(): void {
    this.gpaForm.valueChanges.subscribe(() => this.recalculateGpa());
    this.semestersForm.valueChanges.subscribe(() => this.recalculateCgpa());

    this.recalculateGpa();
    this.recalculateCgpa();
  }

  private setupSeo(): void {
    const title = 'UOL GPA & CGPA Calculator | University of Lahore';
    const description =
      'Calculate GPA and CGPA according to University of Lahore (UOL) grading policy. Free, accurate, and student-friendly GPA calculator.';
    const keywords =
      'UOL GPA Calculator, UOL CGPA Calculator, University of Lahore GPA, GPA Calculator Pakistan';
    const url = 'https://your-netlify-domain.example.com';

    this.titleService.setTitle(title);

    this.metaService.updateTag({ name: 'description', content: description });
    this.metaService.updateTag({ name: 'keywords', content: keywords });
    this.metaService.updateTag({ property: 'og:title', content: title });
    this.metaService.updateTag({
      property: 'og:description',
      content: description,
    });
    this.metaService.updateTag({ property: 'og:type', content: 'website' });
    this.metaService.updateTag({ property: 'og:url', content: url });
  }

  // GPA: courses
  get courses(): FormArray {
    return this.gpaForm.get('courses') as FormArray;
  }

  addCourse(): void {
    const group = this.fb.group({
      name: [''],
      creditHours: [
        3,
        [Validators.required, Validators.min(1), Validators.max(4)],
      ],
      grade: ['A', Validators.required],
    });

    this.courses.push(group);
  }

  removeCourse(index: number): void {
    if (this.courses.length > 1) {
      this.courses.removeAt(index);
    } else {
      this.courses.at(0).reset({ name: '', creditHours: 3, grade: 'A' });
    }
    this.recalculateGpa();
  }

  resetCourses(): void {
    while (this.courses.length > 1) {
      this.courses.removeAt(0);
    }
    if (this.courses.length === 0) {
      this.addCourse();
    } else {
      this.courses.at(0).reset({ name: '', creditHours: 3, grade: 'A' });
    }
    this.recalculateGpa();
  }

  // CGPA: semesters
  get semesters(): FormArray {
    return this.semestersForm.get('semesters') as FormArray;
  }

  addSemester(): void {
    const index = this.semesters.length + 1;
    const group = this.fb.group({
      name: [`Semester ${index}`, [Validators.required, Validators.maxLength(50)]],
      gpa: [
        null,
        [Validators.required, Validators.min(0), Validators.max(4)],
      ],
      creditHours: [
        null,
        [Validators.required, Validators.min(1)],
      ],
    });

    this.semesters.push(group);
  }

  removeSemester(index: number): void {
    if (this.semesters.length > 1) {
      this.semesters.removeAt(index);
    } else {
      this.semesters.at(0).reset({
        name: 'Semester 1',
        gpa: null,
        creditHours: null,
      });
    }
    this.recalculateCgpa();
  }

  resetSemesters(): void {
    while (this.semesters.length > 1) {
      this.semesters.removeAt(0);
    }
    if (this.semesters.length === 0) {
      this.addSemester();
    } else {
      this.semesters.at(0).reset({
        name: 'Semester 1',
        gpa: null,
        creditHours: null,
      });
    }
    this.recalculateCgpa();
  }

  private recalculateGpa(): void {
    const rawCourses: Course[] = (this.courses.value || []).map((c: any) => ({
      name: c?.name ?? '',
      creditHours: Number(c?.creditHours) || 0,
      grade: c?.grade,
    }));

    const result = this.gpaService.calculateGpa(rawCourses);
    this.currentGpa = result.gpa;
    this.currentTotalCreditHours = result.totalCreditHours;

    if (this.currentTotalCreditHours > 0) {
      this.triggerGpaPulse();
    }
  }

  private recalculateCgpa(): void {
    const rawSemesters: SemesterSummary[] = (this.semesters.value || []).map(
      (s: any) => ({
        name: s?.name ?? '',
        gpa: Number(s?.gpa),
        creditHours: Number(s?.creditHours),
      }),
    );

    const result = this.gpaService.calculateCgpa(rawSemesters);
    this.currentCgpa = result.cgpa;
    this.currentTotalCgpaCredits = result.totalCreditHours;

    if (this.currentCgpa !== null) {
      this.triggerCgpaPulse();
    }
  }

  private triggerGpaPulse(): void {
    this.isGpaPulsing = false;
    // Use a timeout to restart the animation class
    setTimeout(() => {
      this.isGpaPulsing = true;
      setTimeout(() => (this.isGpaPulsing = false), 220);
    });
  }

  private triggerCgpaPulse(): void {
    this.isCgpaPulsing = false;
    setTimeout(() => {
      this.isCgpaPulsing = true;
      setTimeout(() => (this.isCgpaPulsing = false), 220);
    });
  }

  trackByIndex(index: number): number {
    return index;
  }
}
