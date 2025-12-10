import { Response } from 'express';
import { AuthRequest } from '../types';
import supabase from '../config/database';
import { AppError } from '../middleware/errorHandler';
import bcrypt from 'bcryptjs';

// =====================================================
// USER MANAGEMENT
// =====================================================

export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role } = req.query;

    let query = supabase
      .from('users')
      .select('id, email, role, first_name, last_name, phone, profile_image, is_active, created_at, last_login')
      .order('created_at', { ascending: false });

    if (role) {
      query = query.eq('role', role);
    }

    const { data, error } = await query;

    if (error) throw new AppError('Failed to fetch users', 500);

    res.json({
      success: true,
      count: data.length,
      users: data
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('users')
      .select('id, email, role, first_name, last_name, phone, profile_image, is_active, created_at, last_login')
      .eq('id', id)
      .single();

    if (error || !data) throw new AppError('User not found', 404);

    res.json({
      success: true,
      user: data
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, role, first_name, last_name, phone } = req.body;

    if (!email || !password || !role || !first_name || !last_name) {
      throw new AppError('Required fields missing', 400);
    }

    const validRoles = ['admin', 'headmaster', 'hod', 'teacher', 'parent', 'student'];
    if (!validRoles.includes(role)) {
      throw new AppError('Invalid role', 400);
    }

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      throw new AppError('User with this email already exists', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash: hashedPassword,
        role,
        first_name,
        last_name,
        phone,
        is_active: true
      })
      .select('id, email, role, first_name, last_name, phone, is_active')
      .single();

    if (error) throw new AppError('Failed to create user', 500);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: data
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { email, role, first_name, last_name, phone, is_active } = req.body;

    const updates: any = {};
    if (email) updates.email = email.toLowerCase();
    if (role) updates.role = role;
    if (first_name) updates.first_name = first_name;
    if (last_name) updates.last_name = last_name;
    if (phone !== undefined) updates.phone = phone;
    if (is_active !== undefined) updates.is_active = is_active;

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select('id, email, role, first_name, last_name, phone, is_active')
      .single();

    if (error) throw new AppError('Failed to update user', 500);

    res.json({
      success: true,
      message: 'User updated successfully',
      user: data
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (id === req.user?.id) {
      throw new AppError('Cannot delete your own account', 400);
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw new AppError('Failed to delete user', 500);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const activateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('users')
      .update({ is_active: true })
      .eq('id', id)
      .select('id, email, first_name, last_name, is_active')
      .single();

    if (error) throw new AppError('Failed to activate user', 500);

    res.json({
      success: true,
      message: 'User activated successfully',
      user: data
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const deactivateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (id === req.user?.id) {
      throw new AppError('Cannot deactivate your own account', 400);
    }

    const { data, error } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', id)
      .select('id, email, first_name, last_name, is_active')
      .single();

    if (error) throw new AppError('Failed to deactivate user', 500);

    res.json({
      success: true,
      message: 'User deactivated successfully',
      user: data
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

// =====================================================
// SCHOOL INFO MANAGEMENT
// =====================================================

export const getSchoolInfo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('school_info')
      .select('*')
      .limit(1)
      .single();

    if (error) throw new AppError('Failed to fetch school info', 500);

    res.json({
      success: true,
      school: data
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const updateSchoolInfo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      school_name,
      school_logo,
      address,
      phone,
      email,
      website,
      current_term,
      term_start_date,
      term_end_date
    } = req.body;

    const { data: existing } = await supabase
      .from('school_info')
      .select('id')
      .limit(1)
      .single();

    const updates: any = {};
    if (school_name) updates.school_name = school_name;
    if (school_logo) updates.school_logo = school_logo;
    if (address) updates.address = address;
    if (phone) updates.phone = phone;
    if (email) updates.email = email;
    if (website) updates.website = website;
    if (current_term) updates.current_term = current_term;
    if (term_start_date) updates.term_start_date = term_start_date;
    if (term_end_date) updates.term_end_date = term_end_date;

    const { data, error } = await supabase
      .from('school_info')
      .update(updates)
      .eq('id', existing!.id)
      .select()
      .single();

    if (error) throw new AppError('Failed to update school info', 500);

    res.json({
      success: true,
      message: 'School information updated successfully',
      school: data
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

// =====================================================
// DEPARTMENT MANAGEMENT
// =====================================================

export const getAllDepartments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('departments')
      .select(`
        *,
        hod:users!departments_hod_id_fkey(id, first_name, last_name, email)
      `)
      .order('name');

    if (error) throw new AppError('Failed to fetch departments', 500);

    res.json({
      success: true,
      count: data.length,
      departments: data
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const createDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, hod_id } = req.body;

    if (!name) {
      throw new AppError('Department name is required', 400);
    }

    const { data, error } = await supabase
      .from('departments')
      .insert({ name, description, hod_id })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new AppError('Department with this name already exists', 409);
      }
      throw new AppError('Failed to create department', 500);
    }

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      department: data
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const updateDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, hod_id } = req.body;

    const updates: any = {};
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (hod_id !== undefined) updates.hod_id = hod_id;

    const { data, error } = await supabase
      .from('departments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new AppError('Failed to update department', 500);

    res.json({
      success: true,
      message: 'Department updated successfully',
      department: data
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const deleteDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', id);

    if (error) throw new AppError('Failed to delete department', 500);

    res.json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

// =====================================================
// SUBJECT MANAGEMENT
// =====================================================

export const getAllSubjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('subjects')
      .select(`
        *,
        department:departments(id, name)
      `)
      .order('name');

    if (error) throw new AppError('Failed to fetch subjects', 500);

    res.json({
      success: true,
      count: data.length,
      subjects: data
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const createSubject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, code, department_id, description } = req.body;

    if (!name || !code) {
      throw new AppError('Name and code are required', 400);
    }

    const { data, error } = await supabase
      .from('subjects')
      .insert({
        name,
        code,
        department_id,
        description
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new AppError('Subject code already exists', 409);
      }
      throw new AppError('Failed to create subject', 500);
    }

    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      subject: data
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const updateSubject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, code, department_id, description } = req.body;

    const updates: any = {};
    if (name) updates.name = name;
    if (code) updates.code = code;
    if (department_id) updates.department_id = department_id;
    if (description !== undefined) updates.description = description;

    const { data, error } = await supabase
      .from('subjects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new AppError('Subject code already exists', 409);
      }
      throw new AppError('Failed to update subject', 500);
    }

    res.json({
      success: true,
      message: 'Subject updated successfully',
      subject: data
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const deleteSubject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id);

    if (error) throw new AppError('Failed to delete subject', 500);

    res.json({
      success: true,
      message: 'Subject deleted successfully'
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

// =====================================================
// CLASS MANAGEMENT
// =====================================================

export const getAllClasses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        class_teacher:users!classes_class_teacher_id_fkey(id, first_name, last_name, email),
        academic_level:academic_levels(id, name, display_order)
      `)
      .order('name');

    if (error) throw new AppError('Failed to fetch classes', 500);

    res.json({
      success: true,
      count: data.length,
      classes: data
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const createClass = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, level, class_teacher_id, capacity, academic_level_id } = req.body;

    if (!name) {
      throw new AppError('Class name is required', 400);
    }

    if (!academic_level_id) {
      throw new AppError('Academic level is required', 400);
    }

    const { data, error } = await supabase
      .from('classes')
      .insert({
        name,
        level: level || '',
        class_teacher_id,
        capacity: capacity || 40,
        academic_level_id
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new AppError('Class with this name already exists', 409);
      }
      throw new AppError('Failed to create class', 500);
    }

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      class: data
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const updateClass = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, level, class_teacher_id, capacity, academic_level_id } = req.body;

    const updates: any = {};
    if (name) updates.name = name;
    if (level) updates.level = level;
    if (class_teacher_id !== undefined) updates.class_teacher_id = class_teacher_id;
    if (capacity) updates.capacity = capacity;
    if (academic_level_id !== undefined) updates.academic_level_id = academic_level_id;

    const { data, error } = await supabase
      .from('classes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new AppError('Failed to update class', 500);

    res.json({
      success: true,
      message: 'Class updated successfully',
      class: data
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const deleteClass = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id);

    if (error) throw new AppError('Failed to delete class', 500);

    res.json({
      success: true,
      message: 'Class deleted successfully'
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

// =====================================================
// TEACHER-SUBJECT-CLASS ASSIGNMENT
// =====================================================

/**
 * Assign a teacher to teach a subject in a class
 * POST /api/admin/assign-teacher-subject
 */
export const assignTeacherToSubject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { teacher_id, subject_id, class_id } = req.body;

    if (!teacher_id || !subject_id || !class_id) {
      throw new AppError('teacher_id, subject_id, and class_id are required', 400);
    }

    // Verify teacher exists and has teacher role
    const { data: teacher, error: teacherError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', teacher_id)
      .eq('role', 'teacher')
      .single();

    if (teacherError || !teacher) {
      throw new AppError('Teacher not found or user is not a teacher', 404);
    }

    // Verify subject exists
    const { data: subject, error: subjectError } = await supabase
      .from('subjects')
      .select('id')
      .eq('id', subject_id)
      .single();

    if (subjectError || !subject) {
      throw new AppError('Subject not found', 404);
    }

    // Verify class exists
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id')
      .eq('id', class_id)
      .single();

    if (classError || !classData) {
      throw new AppError('Class not found', 404);
    }

    // Check if this assignment already exists
    const { data: existing } = await supabase
      .from('class_subjects')
      .select('id')
      .eq('class_id', class_id)
      .eq('subject_id', subject_id)
      .eq('teacher_id', teacher_id)
      .maybeSingle();

    if (existing) {
      throw new AppError('This teacher is already assigned to teach this subject in this class', 409);
    }

    // Create the assignment
    const { data, error } = await supabase
      .from('class_subjects')
      .insert({
        class_id,
        subject_id,
        teacher_id
      })
      .select(`
        id,
        class:classes(id, name, level),
        subject:subjects(id, name, code),
        teacher:users!class_subjects_teacher_id_fkey(id, first_name, last_name, email)
      `)
      .single();

    if (error) {
      console.error('Error assigning teacher:', error);
      throw new AppError('Failed to assign teacher to subject', 500);
    }

    res.status(201).json({
      success: true,
      message: 'Teacher assigned to subject successfully',
      assignment: data
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

/**
 * Get all subject-teacher assignments for a class
 * GET /api/admin/classes/:classId/subjects
 */
export const getClassSubjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classId } = req.params;

    const { data, error } = await supabase
      .from('class_subjects')
      .select(`
        id,
        subject:subjects(id, name, code, department:departments(name)),
        teacher:users!class_subjects_teacher_id_fkey(id, first_name, last_name, email)
      `)
      .eq('class_id', classId);

    if (error) throw new AppError('Failed to fetch class subjects', 500);

    res.json({
      success: true,
      count: data.length,
      subjects: data
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

/**
 * Remove teacher assignment from a subject in a class
 * DELETE /api/admin/class-subjects/:id
 */
export const removeTeacherAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('class_subjects')
      .delete()
      .eq('id', id);

    if (error) throw new AppError('Failed to remove teacher assignment', 500);

    res.json({
      success: true,
      message: 'Teacher assignment removed successfully'
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

// =====================================================
// PARENT-STUDENT LINKING
// =====================================================

export const linkParentToStudents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { parent_id, student_ids } = req.body;

    if (!parent_id || !student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
      throw new AppError('parent_id and student_ids array are required', 400);
    }

    // Verify parent exists
    const { data: parent, error: parentError } = await supabase
      .from('parents')
      .select('id')
      .eq('id', parent_id)
      .single();

    if (parentError || !parent) {
      throw new AppError('Parent not found', 404);
    }

    // Create student_parents records for each student
    const studentParentRecords = student_ids.map(student_id => ({
      parent_id,
      student_id
    }));

    const { data, error } = await supabase
      .from('student_parents')
      .insert(studentParentRecords)
      .select();

    if (error) {
      // Handle duplicate entries gracefully
      if (error.code === '23505') {
        throw new AppError('One or more students are already linked to this parent', 409);
      }
      throw new AppError('Failed to link parent to students', 500);
    }

    res.status(201).json({
      success: true,
      message: 'Parent linked to students successfully',
      data
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const unlinkParentFromStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { parent_id, student_id } = req.body;

    if (!parent_id || !student_id) {
      throw new AppError('parent_id and student_id are required', 400);
    }

    const { error } = await supabase
      .from('student_parents')
      .delete()
      .eq('parent_id', parent_id)
      .eq('student_id', student_id);

    if (error) throw new AppError('Failed to unlink parent from student', 500);

    res.json({
      success: true,
      message: 'Parent unlinked from student successfully'
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

// =====================================================
// ACADEMIC LEVELS MANAGEMENT
// =====================================================

export const getAllAcademicLevels = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('academic_levels')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw new AppError('Failed to fetch academic levels', 500);

    res.json({
      success: true,
      count: data.length,
      academicLevels: data
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const createAcademicLevel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, display_order } = req.body;

    if (!name) {
      throw new AppError('Name is required', 400);
    }

    const { data, error } = await supabase
      .from('academic_levels')
      .insert({
        name,
        description,
        display_order: display_order || 0
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new AppError('Academic level with this name already exists', 409);
      }
      throw new AppError('Failed to create academic level', 500);
    }

    res.status(201).json({
      success: true,
      message: 'Academic level created successfully',
      academicLevel: data
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const updateAcademicLevel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, display_order } = req.body;

    const updates: any = {};
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (display_order !== undefined) updates.display_order = display_order;

    const { data, error } = await supabase
      .from('academic_levels')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new AppError('Failed to update academic level', 500);

    res.json({
      success: true,
      message: 'Academic level updated successfully',
      academicLevel: data
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const deleteAcademicLevel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('academic_levels')
      .delete()
      .eq('id', id);

    if (error) throw new AppError('Failed to delete academic level', 500);

    res.json({
      success: true,
      message: 'Academic level deleted successfully'
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const getAcademicLevelSubjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('subject_academic_levels')
      .select(`
        id,
        is_required,
        subject:subjects(
          id,
          name,
          code,
          description,
          department:departments(id, name)
        )
      `)
      .eq('academic_level_id', id);

    if (error) throw new AppError('Failed to fetch subjects for academic level', 500);

    res.json({
      success: true,
      count: data.length,
      subjects: data
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const assignSubjectToAcademicLevel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { academic_level_id, subject_id, is_required } = req.body;

    if (!academic_level_id || !subject_id) {
      throw new AppError('academic_level_id and subject_id are required', 400);
    }

    const { data, error } = await supabase
      .from('subject_academic_levels')
      .insert({
        academic_level_id,
        subject_id,
        is_required: is_required !== undefined ? is_required : true
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new AppError('Subject already assigned to this academic level', 409);
      }
      throw new AppError('Failed to assign subject to academic level', 500);
    }

    res.status(201).json({
      success: true,
      message: 'Subject assigned to academic level successfully',
      data
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const removeSubjectFromAcademicLevel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('subject_academic_levels')
      .delete()
      .eq('id', id);

    if (error) throw new AppError('Failed to remove subject from academic level', 500);

    res.json({
      success: true,
      message: 'Subject removed from academic level successfully'
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

// =====================================================
// TEACHER MANAGEMENT
// =====================================================

export const getAllTeachers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Query teachers table and join with users and departments
    const { data, error } = await supabase
      .from('teachers')
      .select(`
        id,
        user_id,
        employee_number,
        department_id,
        qualification,
        hire_date,
        created_at,
        updated_at,
        user:users!teachers_user_id_fkey(
          id,
          email,
          first_name,
          last_name,
          phone,
          profile_image
        ),
        department:departments(id, name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw new AppError('Failed to fetch teachers', 500);

    // Transform data to flatten user fields
    const teachers = data.map((teacher: any) => ({
      id: teacher.user?.id || teacher.id,
      email: teacher.user?.email,
      first_name: teacher.user?.first_name,
      last_name: teacher.user?.last_name,
      phone: teacher.user?.phone,
      profile_image: teacher.user?.profile_image,
      employee_number: teacher.employee_number,
      department_id: teacher.department_id,
      department: teacher.department,
      qualification: teacher.qualification,
      hire_date: teacher.hire_date,
      created_at: teacher.created_at,
      updated_at: teacher.updated_at
    }));

    res.json({
      success: true,
      count: teachers.length,
      data: teachers
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const getTeacherById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('teachers')
      .select(`
        *,
        user:users!teachers_user_id_fkey(id, email, first_name, last_name, phone, profile_image),
        department:departments(id, name)
      `)
      .eq('user_id', id)
      .single();

    if (error || !data) throw new AppError('Teacher not found', 404);

    res.json({
      success: true,
      data: {
        id: data.user?.id,
        email: data.user?.email,
        first_name: data.user?.first_name,
        last_name: data.user?.last_name,
        phone: data.user?.phone,
        profile_image: data.user?.profile_image,
        employee_number: data.employee_number,
        department_id: data.department_id,
        department: data.department,
        qualification: data.qualification,
        hire_date: data.hire_date
      }
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

// =====================================================
// STUDENT MANAGEMENT
// =====================================================

export const getAllStudents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        classes(id, name, academic_level_id, academic_levels(id, name)),
        users(id, first_name, last_name, email, phone, profile_image, created_at)
      `)
      .order('enrollment_date', { ascending: false });

    if (error) {
      console.error('Error fetching students:', error);
      throw new AppError('Failed to fetch students', 500);
    }

    // Flatten the data for easier frontend consumption
    const students = data.map((student: any) => ({
      id: student.id,
      user_id: student.user_id,
      student_number: student.student_number,
      first_name: student.users?.first_name,
      last_name: student.users?.last_name,
      email: student.users?.email,
      phone: student.users?.phone,
      profile_picture: student.users?.profile_image,
      date_of_birth: student.date_of_birth,
      gender: student.gender,
      address: student.address,
      enrollment_date: student.enrollment_date,
      class_id: student.classes?.id,
      class_name: student.classes?.name,
      academic_level: student.classes?.academic_levels?.name,
      created_at: student.users?.created_at
    }));

    res.json({
      success: true,
      count: students.length,
      students
    });
  } catch (error: any) {
    console.error('Error in getAllStudents:', error);
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};
