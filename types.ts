export const REGIONS = ["North Amman", "South Amman", "Zarqa", "Irbid"] as const;
export const GENDERS = ["بنين", "بنات", "مختلط"] as const;
export const BUILDING_TYPES = ["ملك", "مستأجرة"] as const;

export interface School {
  id: number;
  schoolNameAr: string;
  schoolNameEn: string;
  schoolId: string;
  nationalId: string;
  region: typeof REGIONS[number];
  principalName: string;
  principalEmail: string;
  principalPhone: string;
  highestGrade: string;
  lowestGrade: string;
  schoolGender: typeof GENDERS[number];
  buildingType: typeof BUILDING_TYPES[number];
  isCamp: boolean;
  dateAdded: string;
}

// TIMSS Test Types
export const TIMSS_SUBJECTS = ["الرياضيات", "العلوم"] as const;
export const TIMSS_GRADES = ["الرابع", "الثامن"] as const;

export interface TimssResult {
    id: number;
    schoolNationalId: string;
    year: number;
    subject: typeof TIMSS_SUBJECTS[number];
    score: number;
    grade: typeof TIMSS_GRADES[number];
    dateAdded: string;
}

// PISA Test Types
export const PISA_SUBJECTS = ["الرياضيات", "العلوم", "القرائية"] as const;

export interface PisaResult {
    id: number;
    schoolNationalId: string;
    year: number;
    subject: typeof PISA_SUBJECTS[number];
    score: number;
    dateAdded: string;
}

// PIRLS Test Types
export const PIRLS_SUBJECTS = ["القرائية"] as const;

export interface PirlsResult {
    id: number;
    schoolNationalId: string;
    year: number;
    subject: typeof PIRLS_SUBJECTS[number]; // Always "القرائية"
    score: number;
    dateAdded: string;
}

// National Test Types
export const NATIONAL_TEST_SUBJECTS = ["اللغة العربية", "الرياضيات", "اللغة الإنجليزية", "العلوم"] as const;
export const NATIONAL_TEST_GRADES = ["الرابع", "الثامن", "العاشر"] as const;

export interface NationalTestResult {
    id: number;
    schoolNationalId: string;
    year: number;
    subject: typeof NATIONAL_TEST_SUBJECTS[number];
    score: number;
    grade: typeof NATIONAL_TEST_GRADES[number];
    dateAdded: string;
}

// Assessment Test Types
export const ASSESSMENT_TEST_SUBJECTS = ["اللغة العربية", "الرياضيات"] as const;

export interface AssessmentTestResult {
    id: number;
    schoolNationalId: string;
    year: number;
    subject: typeof ASSESSMENT_TEST_SUBJECTS[number];
    score: number;
    dateAdded: string;
}

// Unified Test Types
export const UNIFIED_TEST_SUBJECTS = ["الرياضيات", "اللغة العربية", "اللغة الانجليزية", "العلوم", "الفيزياء", "الكيمياء", "الاحياء", "علوم الارض"] as const;
export const UNIFIED_TEST_GRADES = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس", "السابع", "الثامن", "التاسع", "العاشر"] as const;
export const UNIFIED_TEST_SEMESTERS = ["الأول", "الثاني"] as const;

export interface UnifiedTestResult {
    id: number;
    schoolNationalId: string;
    year: number;
    subject: typeof UNIFIED_TEST_SUBJECTS[number];
    score: number;
    grade: typeof UNIFIED_TEST_GRADES[number];
    semester: typeof UNIFIED_TEST_SEMESTERS[number];
    dateAdded: string;
}

// Literacy and Numeracy Test Types
export const LITERACY_NUMERACY_SUBJECTS = ["متوسط القراءة الادائية", "متوسط القراءة الاستيعابية", "متوسط الرياضيات"] as const;
export const LITERACY_NUMERACY_GRADES = ["الثالث", "السابع"] as const;

export interface LiteracyNumeracyResult {
    id: number;
    schoolNationalId: string;
    year: number;
    subject: typeof LITERACY_NUMERACY_SUBJECTS[number];
    score: number;
    grade: typeof LITERACY_NUMERACY_GRADES[number];
    dateAdded: string;
}

// Regional Test (ALO) Types
export const ALO_SUBJECTS = ["اللغة العربية", "الرياضيات"] as const;
export const ALO_GRADES = ["الرابع", "الخامس", "الثامن", "التاسع"] as const;

export interface AloResult {
    id: number;
    schoolNationalId: string;
    year: number;
    subject: typeof ALO_SUBJECTS[number];
    grade: typeof ALO_GRADES[number];
    score: number; // المتوسط الحسابي
    participationRate: number; // نسبة المتقدم
    achievedRate: number; // نسبة المنجز
    partiallyAchievedRate: number; // نسبة المنجز جزئيا
    notAchievedRate: number; // نسبة عدم الإنجاز
    dateAdded: string;
}

// User Management Type
export interface ManagedUser {
  id: number;
  username: string; // For manager, this is schoolNationalId
  role: 'manager' | 'supervisor' | 'admin';
  password?: string;
  dateAdded: string;
}

// FIX: Add User session type to be shared across modules.
// User Session Type
export interface User {
  id: number;
  username: string;
  role: 'admin' | 'manager' | 'supervisor';
  schoolId?: string; // For managers
  isNew?: boolean; // To identify a new manager who needs to add their school
}


// Generic Test Result type for TestManager component
export type TestResult = TimssResult | PisaResult | PirlsResult | NationalTestResult | AssessmentTestResult | UnifiedTestResult | LiteracyNumeracyResult | AloResult;