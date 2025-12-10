import { Response } from 'express';
import { AuthRequest } from '../types';
import supabase from '../config/database';
import { AppError } from '../middleware/errorHandler';

export const getSchoolDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data: studentsCount } = await supabase
      .from('students')
      .select('id', { count: 'exact', head: true });

    const { data: teachersCount } = await supabase
      .from('teachers')
      .select('id', { count: 'exact', head: true });

    const { data: classesCount } = await supabase
      .from('classes')
      .select('id', { count: 'exact', head: true });

    const { data: departmentsCount } = await supabase
      .from('departments')
      .select('id', { count: 'exact', head: true });

    const { data: recentAnnouncements } = await supabase
      .from('announcements')
      .select(`
        *,
        posted_by_user:users!announcements_posted_by_fkey(first_name, last_name)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    res.json({
      success: true,
      dashboard: {
        statistics: {
          totalStudents: studentsCount,
          totalTeachers: teachersCount,
          totalClasses: classesCount,
          totalDepartments: departmentsCount
        },
        recentAnnouncements: recentAnnouncements || []
      }
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const getAllDepartments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('departments')
      .select(`
        *,
        hod:users!departments_hod_id_fkey(id, first_name, last_name, email),
        subjects:subjects(count),
        teachers:teachers(count)
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

export const getTeacherPerformance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data: teachers, error } = await supabase
      .from('teachers')
      .select(`
        id,
        employee_number,
        user:users!teachers_user_id_fkey(id, first_name, last_name, email),
        department:departments(name)
      `);

    if (error) throw new AppError('Failed to fetch teacher data', 500);

    const teacherPerformance = await Promise.all(
      teachers.map(async (teacher: any) => {
        const userId = Array.isArray(teacher.user) ? teacher.user[0]?.id : teacher.user?.id;

        const { count: materialsCount } = await supabase
          .from('learning_materials')
          .select('id', { count: 'exact', head: true })
          .eq('uploaded_by', userId);

        const { count: assignmentsCount } = await supabase
          .from('assignments')
          .select('id', { count: 'exact', head: true })
          .eq('teacher_id', userId);

        return {
          ...teacher,
          materialsUploaded: materialsCount || 0,
          assignmentsCreated: assignmentsCount || 0
        };
      })
    );

    res.json({
      success: true,
      count: teacherPerformance.length,
      teachers: teacherPerformance
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const getStudentPerformance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classId } = req.query;

    let query = supabase
      .from('students')
      .select(`
        id,
        student_number,
        user:users!students_user_id_fkey(id, first_name, last_name, email),
        class:classes(id, name, level)
      `);

    if (classId) {
      query = query.eq('class_id', classId);
    }

    const { data: students, error } = await query;

    if (error) throw new AppError('Failed to fetch student data', 500);

    const studentPerformance = await Promise.all(
      students.map(async (student) => {
        const { data: grades } = await supabase
          .from('grades')
          .select('percentage')
          .eq('student_id', student.id);

        const averageGrade = grades && grades.length > 0
          ? (grades.reduce((sum, g) => sum + (g.percentage || 0), 0) / grades.length).toFixed(2)
          : 0;

        const { data: attendance } = await supabase
          .from('attendance')
          .select('status')
          .eq('student_id', student.id);

        const totalDays = attendance?.length || 0;
        const presentDays = attendance?.filter(a => ['present', 'late'].includes(a.status)).length || 0;
        const attendancePercentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0;

        return {
          ...student,
          averageGrade,
          attendancePercentage
        };
      })
    );

    res.json({
      success: true,
      count: studentPerformance.length,
      students: studentPerformance
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const getAllClasses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        class_teacher:users!classes_class_teacher_id_fkey(id, first_name, last_name, email)
      `)
      .order('name');

    if (error) throw new AppError('Failed to fetch classes', 500);

    const classesWithStats = await Promise.all(
      data.map(async (classItem) => {
        const { count: studentsCount } = await supabase
          .from('students')
          .select('id', { count: 'exact', head: true })
          .eq('class_id', classItem.id);

        return {
          ...classItem,
          studentsCount: studentsCount || 0
        };
      })
    );

    res.json({
      success: true,
      count: classesWithStats.length,
      classes: classesWithStats
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

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
