import { Request } from 'express';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'headmaster' | 'hod' | 'teacher' | 'parent' | 'student';
  first_name: string;
  last_name: string;
  phone?: string;
  profile_image?: string;
  is_active: boolean;
}

export interface AuthRequest extends Request {
  user?: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterUserRequest {
  email: string;
  password: string;
  role: User['role'];
  first_name: string;
  last_name: string;
  phone?: string;
  department_id?: string;
  subject_id?: string;
  // Student-specific fields
  class_id?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  // Parent-specific fields
  relationship?: string;
  occupation?: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: User['role'];
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  hod_id?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  department_id?: string;
  description?: string;
}

export interface Class {
  id: string;
  name: string;
  level: string;
  class_teacher_id?: string;
  capacity: number;
}

export interface Student {
  id: string;
  user_id: string;
  student_number: string;
  class_id?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  enrollment_date: string;
}

export interface Teacher {
  id: string;
  user_id: string;
  employee_number: string;
  department_id?: string;
  qualification?: string;
  hire_date: string;
}

export interface Assignment {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  subject_id: string;
  class_id: string;
  teacher_id: string;
  due_date: string;
  total_marks: number;
  attachment_url?: string;
  is_published: boolean;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  submission_text?: string;
  file_url?: string;
  submitted_at: string;
  marks_obtained?: number;
  feedback?: string;
  graded_by?: string;
  graded_at?: string;
  status: 'submitted' | 'graded' | 'late' | 'resubmit';
}

export interface LearningMaterial {
  id: string;
  title: string;
  description?: string;
  material_type: 'note' | 'video' | 'pdf' | 'doc' | 'ppt' | 'image' | 'link' | 'other';
  file_url?: string;
  file_size?: number;
  subject_id: string;
  class_id: string;
  uploaded_by: string;
  is_approved: boolean;
  approved_by?: string;
}

export interface Attendance {
  id: string;
  student_id: string;
  class_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  marked_by: string;
  notes?: string;
}

export interface Grade {
  id: string;
  student_id: string;
  subject_id: string;
  class_id: string;
  term: string;
  assessment_type: string;
  marks_obtained: number;
  total_marks: number;
  percentage: number;
  grade?: string;
  comments?: string;
  recorded_by: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  posted_by: string;
  target_audience: 'all' | 'students' | 'teachers' | 'parents' | 'specific_class';
  class_id?: string;
  is_urgent: boolean;
  expires_at?: string;
}
