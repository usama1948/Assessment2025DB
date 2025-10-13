// services/apiService.ts
// FIX: Import User type for auth functions.
import type { School, TimssResult, PisaResult, PirlsResult, NationalTestResult, AssessmentTestResult, UnifiedTestResult, LiteracyNumeracyResult, AloResult, User } from '../types';

const API_BASE_URL = 'https://assessment-server-d9ab.onrender.com/api';

// This interface defines the structure of the response from the new reports endpoint.
export interface AllReportData {
  schools: School[];
  timssResults: TimssResult[];
  pisaResults: PisaResult[];
  pirlsResults: PirlsResult[];
  nationalTestResults: NationalTestResult[];
  assessmentTestResults: AssessmentTestResult[];
  unifiedTestResults: UnifiedTestResult[];
  literacyNumeracyResults: LiteracyNumeracyResult[];
  aloResults: AloResult[];
}

// FIX: Define payload for changePassword function.
interface ChangePasswordPayload {
    userId: number;
    currentPassword: string;
    newPassword: string;
}


async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'فشل في تحليل استجابة الخطأ' }));
    throw new Error(errorData.message || `فشلت الشبكة: ${response.statusText}`);
  }
  // Handle 204 No Content for DELETE requests
  if (response.status === 204) {
    return null as T;
  }
  return response.json();
}

export async function getAll<T>(resource: string): Promise<T[]> {
  const response = await fetch(`${API_BASE_URL}/${resource}`);
  return handleResponse<T[]>(response);
}

// New function to get all report data from the dedicated endpoint.
export async function getReportData(): Promise<AllReportData> {
  const response = await fetch(`${API_BASE_URL}/reports/all-data`);
  return handleResponse<AllReportData>(response);
}

// FIX: Add login function to handle authentication.
export async function login(credentials: {username: string, password: string}): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
    });
    return handleResponse<User>(response);
}

// FIX: Add changePassword function for profile page.
export async function changePassword(payload: ChangePasswordPayload): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/users/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return handleResponse<{ message: string }>(response);
}

export async function add<T, U>(resource: string, item: U): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/${resource}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  return handleResponse<T>(response);
}

export async function addMultiple<U>(resource: string, items: U[]): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/${resource}/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(items),
  });
  return handleResponse<{ message: string }>(response);
}

export async function update<T>(resource: string, id: number, item: T): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/${resource}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  return handleResponse<T>(response);
}

export async function remove(resource: string, id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/${resource}/${id}`, {
    method: 'DELETE',
  });
  await handleResponse<void>(response);
}