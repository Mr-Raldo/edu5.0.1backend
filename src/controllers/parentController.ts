import { Response } from 'express';
import { AuthRequest } from '../types';
import supabase from '../config/database';
import { AppError } from '../middleware/errorHandler';

export const getMyChildren = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const { data: parent } = await supabase
      .from('parents')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!parent) {
      throw new AppError('Parent profile not found', 404);
    }

    const { data, error } = await supabase
      .from('student_parents')
      .select(`
        student:students(
          id,
          student_number,
          user:users!students_user_id_fkey(id, first_name, last_name, email, profile_image),
          class:classes(id, name, level)
        )
      `)
      .eq('parent_id', parent.id);

    if (error) throw new AppError('Failed to fetch children', 500);

    res.json({
      success: true,
      count: data.length,
      children: data.map(d => d.student)
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const getChildPerformance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const userId = req.user?.id;

    const { data: parent } = await supabase
      .from('parents')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!parent) {
      throw new AppError('Parent profile not found', 404);
    }

    const { data: relationship } = await supabase
      .from('student_parents')
      .select('id')
      .eq('parent_id', parent.id)
      .eq('student_id', studentId)
      .single();

    if (!relationship) {
      throw new AppError('Access denied', 403);
    }

    const { data: grades } = await supabase
      .from('grades')
      .select(`
        *,
        subject:subjects(id, name, code)
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    res.json({
      success: true,
      grades: grades || []
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const getChildAssignments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const userId = req.user?.id;

    const { data: parent } = await supabase
      .from('parents')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!parent) {
      throw new AppError('Parent profile not found', 404);
    }

    const { data: relationship } = await supabase
      .from('student_parents')
      .select('id')
      .eq('parent_id', parent.id)
      .eq('student_id', studentId)
      .single();

    if (!relationship) {
      throw new AppError('Access denied', 403);
    }

    const { data: submissions } = await supabase
      .from('assignment_submissions')
      .select(`
        *,
        assignment:assignments(
          id,
          title,
          due_date,
          total_marks,
          subject:subjects(name)
        )
      `)
      .eq('student_id', studentId)
      .order('submitted_at', { ascending: false });

    res.json({
      success: true,
      count: submissions?.length || 0,
      submissions: submissions || []
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const getChildAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const userId = req.user?.id;

    const { data: parent } = await supabase
      .from('parents')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!parent) {
      throw new AppError('Parent profile not found', 404);
    }

    const { data: relationship } = await supabase
      .from('student_parents')
      .select('id')
      .eq('parent_id', parent.id)
      .eq('student_id', studentId)
      .single();

    if (!relationship) {
      throw new AppError('Access denied', 403);
    }

    const { data: attendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
      .order('date', { ascending: false })
      .limit(30);

    const totalDays = attendance?.length || 0;
    const presentDays = attendance?.filter(a => ['present', 'late'].includes(a.status)).length || 0;
    const percentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      attendance: {
        records: attendance || [],
        summary: {
          totalDays,
          presentDays,
          percentage
        }
      }
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};
