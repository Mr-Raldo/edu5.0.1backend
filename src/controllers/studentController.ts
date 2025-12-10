import { Response } from 'express';
import { AuthRequest } from '../types';
import supabase from '../config/database';
import { AppError } from '../middleware/errorHandler';

// =====================================================
// STUDENT DASHBOARD & INFO
// =====================================================

export const getMyDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const { data: student, error: studentError } = await supabase
      .from('students')
      .select(`
        *,
        class:classes(
          id,
          name,
          level,
          class_teacher:users!classes_class_teacher_id_fkey(id, first_name, last_name, email)
        )
      `)
      .eq('user_id', userId)
      .single();

    if (studentError || !student) {
      throw new AppError('Student profile not found', 404);
    }

    const { data: subjects } = await supabase
      .from('class_subjects')
      .select(`
        subject:subjects(id, name, code),
        teacher:users!class_subjects_teacher_id_fkey(id, first_name, last_name)
      `)
      .eq('class_id', student.class_id);

    const { data: recentAssignments } = await supabase
      .from('assignments')
      .select('id, title, due_date, total_marks, subject:subjects(name)')
      .eq('class_id', student.class_id)
      .eq('is_published', true)
      .gte('due_date', new Date().toISOString())
      .order('due_date')
      .limit(5);

    const { data: announcements } = await supabase
      .from('announcements')
      .select('id, title, content, is_urgent, created_at')
      .or(`target_audience.eq.all,target_audience.eq.students,and(target_audience.eq.specific_class,class_id.eq.${student.class_id})`)
      .order('created_at', { ascending: false })
      .limit(5);

    res.json({
      success: true,
      dashboard: {
        student,
        subjects: subjects || [],
        recentAssignments: recentAssignments || [],
        announcements: announcements || []
      }
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

// =====================================================
// SUBJECTS & MATERIALS
// =====================================================

export const getMySubjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    console.log('📚 [getMySubjects] Fetching subjects for user:', userId);

    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('class_id')
      .eq('user_id', userId)
      .single();

    if (studentError || !student) {
      console.error('❌ [getMySubjects] Student not found:', studentError);
      throw new AppError('Student profile not found', 404);
    }

    console.log('👤 [getMySubjects] Student class_id:', student.class_id);

    const { data, error } = await supabase
      .from('class_subjects')
      .select(`
        id,
        subject:subjects(id, name, code, description, department:departments(name)),
        teacher:users!class_subjects_teacher_id_fkey(id, first_name, last_name, email)
      `)
      .eq('class_id', student.class_id);

    if (error) {
      console.error('❌ [getMySubjects] Error fetching subjects:', error);
      throw new AppError('Failed to fetch subjects', 500);
    }

    console.log(`✅ [getMySubjects] Found ${data?.length || 0} subjects`);

    res.json({
      success: true,
      count: data?.length || 0,
      subjects: data || []
    });
  } catch (error: any) {
    console.error('❌ [getMySubjects] Error:', error);
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const getSubjectMaterials = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { subjectId } = req.params;
    const userId = req.user?.id;

    const { data: student } = await supabase
      .from('students')
      .select('class_id')
      .eq('user_id', userId)
      .single();

    if (!student) {
      throw new AppError('Student profile not found', 404);
    }

    const { data, error } = await supabase
      .from('learning_materials')
      .select(`
        *,
        uploaded_by_user:users!learning_materials_uploaded_by_fkey(id, first_name, last_name)
      `)
      .eq('subject_id', subjectId)
      .eq('class_id', student.class_id)
      .eq('is_approved', true)
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

// =====================================================
// ASSIGNMENTS
// =====================================================

export const getMyAssignments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    console.log('📋 [getMyAssignments] Fetching assignments for user:', userId);

    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, class_id')
      .eq('user_id', userId)
      .single();

    if (studentError || !student) {
      console.error('❌ [getMyAssignments] Student not found:', studentError);
      throw new AppError('Student profile not found', 404);
    }

    console.log('👤 [getMyAssignments] Student class_id:', student.class_id);

    const { data: assignments, error } = await supabase
      .from('assignments')
      .select(`
        *,
        subject:subjects(id, name, code),
        teacher:users!assignments_teacher_id_fkey(id, first_name, last_name)
      `)
      .eq('class_id', student.class_id)
      .eq('is_published', true)
      .order('due_date', { ascending: false });

    if (error) {
      console.error('❌ [getMyAssignments] Error fetching assignments:', error);
      throw new AppError('Failed to fetch assignments', 500);
    }

    console.log(`✅ [getMyAssignments] Found ${assignments?.length || 0} assignments`);

    const assignmentIds = assignments?.map(a => a.id) || [];

    const { data: submissions } = await supabase
      .from('assignment_submissions')
      .select('assignment_id, status, marks_obtained, submitted_at')
      .eq('student_id', student.id)
      .in('assignment_id', assignmentIds);

    const submissionsMap = new Map(
      submissions?.map(s => [s.assignment_id, s]) || []
    );

    const assignmentsWithSubmissions = (assignments || []).map(assignment => ({
      ...assignment,
      submission: submissionsMap.get(assignment.id) || null
    }));

    res.json({
      success: true,
      count: assignmentsWithSubmissions.length,
      assignments: assignmentsWithSubmissions
    });
  } catch (error: any) {
    console.error('❌ [getMyAssignments] Error:', error);
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const getAssignmentDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { assignmentId } = req.params;
    const userId = req.user?.id;

    const { data: student } = await supabase
      .from('students')
      .select('id, class_id')
      .eq('user_id', userId)
      .single();

    if (!student) {
      throw new AppError('Student profile not found', 404);
    }

    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select(`
        *,
        subject:subjects(id, name, code),
        teacher:users!assignments_teacher_id_fkey(id, first_name, last_name, email)
      `)
      .eq('id', assignmentId)
      .eq('class_id', student.class_id)
      .single();

    if (assignmentError || !assignment) {
      throw new AppError('Assignment not found', 404);
    }

    const { data: submission } = await supabase
      .from('assignment_submissions')
      .select('*')
      .eq('assignment_id', assignmentId)
      .eq('student_id', student.id)
      .single();

    res.json({
      success: true,
      assignment: {
        ...assignment,
        submission: submission || null
      }
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const submitAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { assignmentId } = req.params;
    const userId = req.user?.id;
    const { submission_text, file_url } = req.body;

    const { data: student } = await supabase
      .from('students')
      .select('id, class_id')
      .eq('user_id', userId)
      .single();

    if (!student) {
      throw new AppError('Student profile not found', 404);
    }

    const { data: assignment } = await supabase
      .from('assignments')
      .select('due_date')
      .eq('id', assignmentId)
      .single();

    if (!assignment) {
      throw new AppError('Assignment not found', 404);
    }

    const isLate = new Date() > new Date(assignment.due_date);

    const { data, error } = await supabase
      .from('assignment_submissions')
      .upsert({
        assignment_id: assignmentId,
        student_id: student.id,
        submission_text,
        file_url,
        status: isLate ? 'late' : 'submitted',
        submitted_at: new Date().toISOString()
      }, { onConflict: 'assignment_id,student_id' })
      .select()
      .single();

    if (error) throw new AppError('Failed to submit assignment', 500);

    res.json({
      success: true,
      message: 'Assignment submitted successfully',
      submission: data
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

// =====================================================
// GRADES & PERFORMANCE
// =====================================================

export const getMyGrades = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!student) {
      throw new AppError('Student profile not found', 404);
    }

    const { data, error } = await supabase
      .from('grades')
      .select(`
        *,
        subject:subjects(id, name, code),
        recorded_by_user:users!grades_recorded_by_fkey(id, first_name, last_name)
      `)
      .eq('student_id', student.id)
      .order('created_at', { ascending: false });

    if (error) throw new AppError('Failed to fetch grades', 500);

    res.json({
      success: true,
      count: data.length,
      grades: data
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

// =====================================================
// ATTENDANCE
// =====================================================

export const getMyAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { start_date, end_date } = req.query;

    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!student) {
      throw new AppError('Student profile not found', 404);
    }

    let query = supabase
      .from('attendance')
      .select('*')
      .eq('student_id', student.id);

    if (start_date) {
      query = query.gte('date', start_date as string);
    }
    if (end_date) {
      query = query.lte('date', end_date as string);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) throw new AppError('Failed to fetch attendance', 500);

    const totalDays = data.length;
    const presentDays = data.filter(a => ['present', 'late'].includes(a.status)).length;
    const percentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      attendance: {
        records: data,
        summary: {
          totalDays,
          presentDays,
          absentDays: data.filter(a => a.status === 'absent').length,
          lateDays: data.filter(a => a.status === 'late').length,
          excusedDays: data.filter(a => a.status === 'excused').length,
          percentage
        }
      }
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

// =====================================================
// ANNOUNCEMENTS
// =====================================================

export const getAnnouncements = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const { data: student } = await supabase
      .from('students')
      .select('class_id')
      .eq('user_id', userId)
      .single();

    if (!student) {
      throw new AppError('Student profile not found', 404);
    }

    const { data, error } = await supabase
      .from('announcements')
      .select(`
        *,
        posted_by_user:users!announcements_posted_by_fkey(id, first_name, last_name)
      `)
      .or(`target_audience.eq.all,target_audience.eq.students,and(target_audience.eq.specific_class,class_id.eq.${student.class_id})`)
      .order('created_at', { ascending: false });

    if (error) throw new AppError('Failed to fetch announcements', 500);

    res.json({
      success: true,
      count: data.length,
      announcements: data
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

// =====================================================
// SYLLABI
// =====================================================

export const getMySyllabi = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { subject_id } = req.query;

    console.log('📄 [getMySyllabi] Fetching syllabi for user:', userId, 'subject_id:', subject_id);

    // Get student record
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, class_id')
      .eq('user_id', userId)
      .single();

    if (studentError || !student) {
      console.error('❌ [getMySyllabi] Student not found:', studentError);
      throw new AppError('Student profile not found', 404);
    }

    console.log('👤 [getMySyllabi] Student class_id:', student.class_id);

    // Get class subjects
    const { data: classSubjects } = await supabase
      .from('class_subjects')
      .select('subject_id')
      .eq('class_id', student.class_id);

    const subjectIds = classSubjects?.map(cs => cs.subject_id) || [];

    console.log(`📚 [getMySyllabi] Found ${subjectIds.length} subjects for class`);

    if (subjectIds.length === 0) {
      console.log('⚠️ [getMySyllabi] No subjects found for class');
      res.json({
        success: true,
        message: 'No subjects found for your class',
        syllabi: []
      });
      return;
    }

    // Build query for syllabi
    let query = supabase
      .from('syllabi')
      .select(`
        id,
        title,
        description,
        subject_id,
        subject:subjects(id, name, code),
        class_id,
        file_url,
        file_size,
        academic_year,
        term,
        status,
        uploaded_by,
        uploaded_by_user:users!syllabi_uploaded_by_fkey(id, first_name, last_name),
        created_at
      `)
      .in('subject_id', subjectIds)
      .eq('status', 'published')
      .order('created_at', { ascending: false});

    if (subject_id) {
      query = query.eq('subject_id', subject_id);
    }

    const { data: syllabi, error: syllabiError } = await query;

    if (syllabiError) {
      console.error('❌ [getMySyllabi] Error fetching syllabi:', syllabiError);
      throw new AppError('Failed to fetch syllabi', 500);
    }

    console.log(`✅ [getMySyllabi] Found ${syllabi?.length || 0} syllabi`);

    res.json({
      success: true,
      count: syllabi?.length || 0,
      syllabi: syllabi || []
    });
  } catch (error: any) {
    console.error('❌ [getMySyllabi] Error:', error);
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

// =====================================================
// PERFORMANCE SUMMARY
// =====================================================

export const getMyPerformance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    // Get student record
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (studentError || !student) {
      throw new AppError('Student profile not found', 404);
    }

    // Get all graded submissions
    const { data: submissions, error: submissionsError } = await supabase
      .from('assignment_submissions')
      .select(`
        id,
        assignment_id,
        assignment:assignments!inner(
          id,
          title,
          total_marks,
          subject_id,
          subject:subjects(id, name)
        ),
        marks_obtained,
        status,
        submitted_at
      `)
      .eq('student_id', student.id)
      .eq('status', 'graded');

    if (submissionsError) {
      throw new AppError('Failed to fetch performance data', 500);
    }

    // Calculate statistics
    const totalAssignments = submissions?.length || 0;
    const totalScore = submissions?.reduce((sum, s) => sum + (s.marks_obtained || 0), 0) || 0;
    const totalMaxScore = submissions?.reduce((sum, s) => {
      const assignment = Array.isArray(s.assignment) ? s.assignment[0] : s.assignment;
      return sum + (assignment?.total_marks || 0);
    }, 0) || 0;
    const averagePercentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;

    // Group by subject
    const bySubject = submissions?.reduce((acc: any, submission: any) => {
      const assignment = Array.isArray(submission.assignment) ? submission.assignment[0] : submission.assignment;
      const subject = Array.isArray(assignment?.subject) ? assignment.subject[0] : assignment?.subject;
      const subjectId = assignment?.subject_id;
      const subjectName = subject?.name;

      if (!acc[subjectId]) {
        acc[subjectId] = {
          subject_id: subjectId,
          subject_name: subjectName,
          assignments_count: 0,
          total_score: 0,
          total_max_score: 0
        };
      }

      acc[subjectId].assignments_count++;
      acc[subjectId].total_score += submission.marks_obtained || 0;
      acc[subjectId].total_max_score += assignment?.total_marks || 0;

      return acc;
    }, {});

    const subjectPerformance = Object.values(bySubject || {}).map((subject: any) => ({
      ...subject,
      average_percentage: subject.total_max_score > 0
        ? ((subject.total_score / subject.total_max_score) * 100).toFixed(2)
        : '0.00'
    }));

    res.json({
      success: true,
      performance: {
        total_assignments: totalAssignments,
        total_score: totalScore,
        total_max_score: totalMaxScore,
        average_percentage: averagePercentage.toFixed(2),
        by_subject: subjectPerformance
      }
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};
