import { Response } from 'express';
import { AuthRequest } from '../types';
import supabase from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

// =====================================================
// CLASS & SUBJECT MANAGEMENT
// =====================================================

export const getMyClasses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user?.id;

    const { data, error } = await supabase
      .from('class_subjects')
      .select(`
        id,
        class:classes(id, name, level, capacity),
        subject:subjects(id, name, code)
      `)
      .eq('teacher_id', teacherId);

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

export const getClassStudents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classId } = req.params;

    const { data, error } = await supabase
      .from('students')
      .select(`
        id,
        student_number,
        user:users!students_user_id_fkey(id, first_name, last_name, email, phone, profile_image),
        date_of_birth,
        gender,
        enrollment_date
      `)
      .eq('class_id', classId)
      .order('user.last_name');

    if (error) throw new AppError('Failed to fetch students', 500);

    res.json({
      success: true,
      count: data.length,
      students: data
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

// =====================================================
// LEARNING MATERIALS
// =====================================================

export const uploadMaterial = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user?.id;
    const {
      title,
      description,
      material_type,
      file_url,
      file_size,
      subject_id,
      class_id
    } = req.body;

    console.log('📚 Uploading learning material:', {
      teacherId,
      title,
      material_type,
      subject_id,
      class_id,
      file_url: file_url?.substring(0, 50) + '...',
      file_size
    });

    // class_id is optional for subject-wide resources
    if (!title || !material_type || !subject_id) {
      throw new AppError('Required fields: title, material_type, subject_id', 400);
    }

    const insertData = {
      title,
      description,
      material_type,
      file_url,
      file_size,
      subject_id,
      class_id: class_id || null,
      uploaded_by: teacherId,
      is_approved: true
    };

    console.log('📤 Inserting material into database:', insertData);

    const { data, error } = await supabase
      .from('learning_materials')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error uploading material:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw new AppError(`Failed to upload material: ${error.message}`, 500);
    }

    console.log('✅ Material uploaded successfully:', data.id);

    res.status(201).json({
      success: true,
      message: 'Material uploaded successfully',
      material: data
    });
  } catch (error: any) {
    console.error('❌ Error in uploadMaterial:', error);
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const getMyMaterials = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user?.id;

    const { data, error } = await supabase
      .from('learning_materials')
      .select(`
        *,
        subject:subjects(id, name, code),
        class:classes(id, name, level)
      `)
      .eq('uploaded_by', teacherId)
      .order('created_at', { ascending: false });

    if (error) throw new AppError('Failed to fetch materials', 500);

    res.json({
      success: true,
      count: data.length,
      materials: data
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const updateMaterial = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const teacherId = req.user?.id;
    const { title, description, material_type, file_url, file_size } = req.body;

    const updates: any = {};
    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (material_type) updates.material_type = material_type;
    if (file_url) updates.file_url = file_url;
    if (file_size) updates.file_size = file_size;

    const { data, error } = await supabase
      .from('learning_materials')
      .update(updates)
      .eq('id', id)
      .eq('uploaded_by', teacherId)
      .select()
      .single();

    if (error) throw new AppError('Failed to update material', 500);

    res.json({
      success: true,
      message: 'Material updated successfully',
      material: data
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const deleteMaterial = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const teacherId = req.user?.id;

    const { error } = await supabase
      .from('learning_materials')
      .delete()
      .eq('id', id)
      .eq('uploaded_by', teacherId);

    if (error) throw new AppError('Failed to delete material', 500);

    res.json({
      success: true,
      message: 'Material deleted successfully'
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

// =====================================================
// ASSIGNMENTS
// =====================================================

export const createAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user?.id;
    const {
      title,
      description,
      instructions,
      subject_id,
      class_id,
      due_date,
      total_marks,
      attachment_url,
      is_published
    } = req.body;

    if (!title || !subject_id || !class_id || !due_date) {
      throw new AppError('Required fields: title, subject_id, class_id, due_date', 400);
    }

    const { data, error } = await supabase
      .from('assignments')
      .insert({
        title,
        description,
        instructions,
        subject_id,
        class_id,
        teacher_id: teacherId,
        due_date,
        total_marks: total_marks || 100,
        attachment_url,
        is_published: is_published || false
      })
      .select()
      .single();

    if (error) throw new AppError('Failed to create assignment', 500);

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      assignment: data
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const getMyAssignments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user?.id;

    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        subject:subjects(id, name, code),
        class:classes(id, name, level)
      `)
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (error) throw new AppError('Failed to fetch assignments', 500);

    res.json({
      success: true,
      count: data.length,
      assignments: data
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const updateAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const teacherId = req.user?.id;
    const {
      title,
      description,
      instructions,
      due_date,
      total_marks,
      attachment_url,
      is_published
    } = req.body;

    const updates: any = {};
    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (instructions !== undefined) updates.instructions = instructions;
    if (due_date) updates.due_date = due_date;
    if (total_marks) updates.total_marks = total_marks;
    if (attachment_url !== undefined) updates.attachment_url = attachment_url;
    if (is_published !== undefined) updates.is_published = is_published;

    const { data, error } = await supabase
      .from('assignments')
      .update(updates)
      .eq('id', id)
      .eq('teacher_id', teacherId)
      .select()
      .single();

    if (error) throw new AppError('Failed to update assignment', 500);

    res.json({
      success: true,
      message: 'Assignment updated successfully',
      assignment: data
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const deleteAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const teacherId = req.user?.id;

    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', id)
      .eq('teacher_id', teacherId);

    if (error) throw new AppError('Failed to delete assignment', 500);

    res.json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const getAssignmentSubmissions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { assignmentId } = req.params;

    const { data, error } = await supabase
      .from('assignment_submissions')
      .select(`
        *,
        student:students!assignment_submissions_student_id_fkey(
          id,
          student_number,
          user:users!students_user_id_fkey(id, first_name, last_name, email)
        )
      `)
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false });

    if (error) throw new AppError('Failed to fetch submissions', 500);

    res.json({
      success: true,
      count: data.length,
      submissions: data
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const gradeSubmission = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const teacherId = req.user?.id;
    const { marks_obtained, feedback } = req.body;

    if (marks_obtained === undefined) {
      throw new AppError('Marks obtained is required', 400);
    }

    const { data, error } = await supabase
      .from('assignment_submissions')
      .update({
        marks_obtained,
        feedback,
        status: 'graded',
        graded_by: teacherId,
        graded_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new AppError('Failed to grade submission', 500);

    res.json({
      success: true,
      message: 'Submission graded successfully',
      submission: data
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

// =====================================================
// ATTENDANCE
// =====================================================

export const markAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user?.id;
    const { student_id, class_id, date, status, notes } = req.body;

    if (!student_id || !class_id || !date || !status) {
      throw new AppError('Required fields: student_id, class_id, date, status', 400);
    }

    const { data, error } = await supabase
      .from('attendance')
      .upsert({
        student_id,
        class_id,
        date,
        status,
        notes,
        marked_by: teacherId
      }, { onConflict: 'student_id,date' })
      .select()
      .single();

    if (error) throw new AppError('Failed to mark attendance', 500);

    res.json({
      success: true,
      message: 'Attendance marked successfully',
      attendance: data
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const getClassAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classId } = req.params;
    const { date } = req.query;

    let query = supabase
      .from('attendance')
      .select(`
        *,
        student:students!attendance_student_id_fkey(
          id,
          student_number,
          user:users!students_user_id_fkey(id, first_name, last_name)
        )
      `)
      .eq('class_id', classId);

    if (date) {
      query = query.eq('date', date);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) throw new AppError('Failed to fetch attendance', 500);

    res.json({
      success: true,
      count: data.length,
      attendance: data
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

// =====================================================
// ANNOUNCEMENTS
// =====================================================

export const createAnnouncement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user?.id;
    const { title, content, target_audience, class_id, is_urgent, expires_at } = req.body;

    if (!title || !content || !target_audience) {
      throw new AppError('Required fields: title, content, target_audience', 400);
    }

    const { data, error } = await supabase
      .from('announcements')
      .insert({
        title,
        content,
        posted_by: teacherId,
        target_audience,
        class_id,
        is_urgent: is_urgent || false,
        expires_at
      })
      .select()
      .single();

    if (error) throw new AppError('Failed to create announcement', 500);

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      announcement: data
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

// =====================================================
// SYLLABI
// =====================================================

export const createSyllabus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user?.id;
    const { subject_id, class_id, name, title, description, file_url, file_size, file_size_mb, academic_year, term, status } = req.body;

    console.log('📝 Creating syllabus with data:', {
      teacherId,
      subject_id,
      class_id,
      name,
      title,
      file_url: file_url?.substring(0, 50) + '...',
      file_size_mb,
      academic_year,
      status
    });

    // Support both 'name' and 'title' field names for flexibility
    const syllabusTitle = title || name;

    // Convert file_size_mb to bytes if provided, otherwise use file_size
    const fileSize = file_size_mb ? Math.round(file_size_mb * 1024 * 1024) : file_size;

    if (!subject_id || !syllabusTitle || !file_url) {
      throw new AppError('Required fields: subject_id, name/title, file_url', 400);
    }

    const insertData = {
      subject_id,
      class_id: class_id || null,
      title: syllabusTitle,
      description,
      file_url,
      file_size: fileSize,
      academic_year,
      term,
      uploaded_by: teacherId,
      status: status || 'published'
    };

    console.log('📤 Inserting into database:', insertData);

    const { data, error } = await supabase
      .from('syllabi')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error creating syllabus:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw new AppError(`Failed to create syllabus: ${error.message}`, 500);
    }

    console.log('✅ Syllabus created successfully:', data.id);

    res.status(201).json({
      success: true,
      message: 'Syllabus created successfully',
      syllabus: data
    });
  } catch (error: any) {
    console.error('❌ Error in createSyllabus:', error);
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const getMySyllabi = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user?.id;

    const { data, error } = await supabase
      .from('syllabi')
      .select(`
        *,
        subject:subjects(id, name, code),
        class:classes(id, name, level)
      `)
      .eq('uploaded_by', teacherId)
      .order('created_at', { ascending: false });

    if (error) throw new AppError('Failed to fetch syllabi', 500);

    res.json({
      success: true,
      count: data.length,
      syllabi: data
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const updateSyllabus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const teacherId = req.user?.id;
    const updates = req.body;

    const { data, error } = await supabase
      .from('syllabi')
      .update(updates)
      .eq('id', id)
      .eq('uploaded_by', teacherId)
      .select()
      .single();

    if (error) throw new AppError('Failed to update syllabus', 500);

    res.json({
      success: true,
      message: 'Syllabus updated successfully',
      syllabus: data
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const deleteSyllabus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const teacherId = req.user?.id;

    const { error } = await supabase
      .from('syllabi')
      .delete()
      .eq('id', id)
      .eq('uploaded_by', teacherId);

    if (error) throw new AppError('Failed to delete syllabus', 500);

    res.json({
      success: true,
      message: 'Syllabus deleted successfully'
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

// =====================================================
// FILE UPLOAD TO SUPABASE STORAGE
// =====================================================

/**
 * Upload a file to Supabase Storage
 * POST /api/teacher/upload-file
 */
export const uploadFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const file = req.file;
    const { bucket, folder } = req.body;

    console.log('📤 File upload request received:', {
      hasFile: !!file,
      bucket,
      folder,
      fileName: file?.originalname,
      fileSize: file?.size,
      mimeType: file?.mimetype
    });

    if (!file) {
      throw new AppError('No file uploaded', 400);
    }

    if (!bucket) {
      throw new AppError('Bucket name is required', 400);
    }

    // Generate unique filename
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${folder ? folder + '/' : ''}${uuidv4()}.${fileExt}`;

    console.log('📁 Uploading to Supabase Storage:', {
      bucket,
      fileName,
      size: file.size,
      contentType: file.mimetype
    });

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error('❌ Supabase storage error:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      throw new AppError(`Failed to upload file: ${error.message}`, 500);
    }

    console.log('✅ File uploaded successfully:', data);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    console.log('🔗 Public URL generated:', urlData.publicUrl);

    res.json({
      success: true,
      message: 'File uploaded successfully',
      publicUrl: urlData.publicUrl,
      path: fileName,
    });
  } catch (error: any) {
    console.error('❌ Upload error:', {
      message: error.message,
      statusCode: error.statusCode,
      stack: error.stack
    });
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to upload file'
    });
  }
};

// =====================================================
// GET ASSIGNED SUBJECTS
// =====================================================

/**
 * Get all subjects assigned to the teacher
 * Teachers can only VIEW subjects assigned to them by admin
 * GET /api/teacher/subjects
 */
export const getMySubjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user?.id;

    // Get unique subjects from class_subjects where teacher is assigned
    const { data, error } = await supabase
      .from('class_subjects')
      .select(`
        subject_id,
        subject:subjects(
          id,
          name,
          code,
          description,
          department:departments(id, name)
        )
      `)
      .eq('teacher_id', teacherId);

    if (error) throw new AppError('Failed to fetch assigned subjects', 500);

    // Extract unique subjects (same subject can be in multiple classes)
    const subjectsMap = new Map();
    data.forEach((item: any) => {
      if (item.subject && !subjectsMap.has(item.subject.id)) {
        subjectsMap.set(item.subject.id, item.subject);
      }
    });

    const subjects = Array.from(subjectsMap.values());

    res.json({
      success: true,
      count: subjects.length,
      subjects
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};
