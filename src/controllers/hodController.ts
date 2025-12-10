import { Response } from 'express';
import { AuthRequest } from '../types';
import supabase from '../config/database';
import { AppError } from '../middleware/errorHandler';

export const getMyDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const { data, error } = await supabase
      .from('departments')
      .select(`
        *,
        subjects:subjects(count)
      `)
      .eq('hod_id', userId)
      .single();

    if (error || !data) {
      throw new AppError('Department not found', 404);
    }

    res.json({
      success: true,
      department: data
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const getDepartmentSubjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const { data: department } = await supabase
      .from('departments')
      .select('id')
      .eq('hod_id', userId)
      .single();

    if (!department) {
      throw new AppError('Department not found', 404);
    }

    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('department_id', department.id)
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
    const userId = req.user?.id;
    const { name, code, description } = req.body;

    const { data: department } = await supabase
      .from('departments')
      .select('id')
      .eq('hod_id', userId)
      .single();

    if (!department) {
      throw new AppError('Department not found', 404);
    }

    const { data, error } = await supabase
      .from('subjects')
      .insert({
        name,
        code,
        description,
        department_id: department.id
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new AppError('Subject with this code already exists', 409);
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
    const userId = req.user?.id;
    const { name, code, description } = req.body;

    const { data: department } = await supabase
      .from('departments')
      .select('id')
      .eq('hod_id', userId)
      .single();

    if (!department) {
      throw new AppError('Access denied', 403);
    }

    const updates: any = {};
    if (name) updates.name = name;
    if (code) updates.code = code;
    if (description !== undefined) updates.description = description;

    const { data, error } = await supabase
      .from('subjects')
      .update(updates)
      .eq('id', id)
      .eq('department_id', department.id)
      .select()
      .single();

    if (error) throw new AppError('Failed to update subject', 500);

    res.json({
      success: true,
      message: 'Subject updated successfully',
      subject: data
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const getDepartmentTeachers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const { data: department } = await supabase
      .from('departments')
      .select('id')
      .eq('hod_id', userId)
      .single();

    if (!department) {
      throw new AppError('Department not found', 404);
    }

    const { data, error } = await supabase
      .from('teachers')
      .select(`
        *,
        user:users!teachers_user_id_fkey(id, first_name, last_name, email, phone)
      `)
      .eq('department_id', department.id);

    if (error) throw new AppError('Failed to fetch teachers', 500);

    res.json({
      success: true,
      count: data.length,
      teachers: data
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

export const getDepartmentMaterials = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const { data: department } = await supabase
      .from('departments')
      .select('id')
      .eq('hod_id', userId)
      .single();

    if (!department) {
      throw new AppError('Department not found', 404);
    }

    const { data, error } = await supabase
      .from('learning_materials')
      .select(`
        *,
        subject:subjects!inner(id, name, code, department_id),
        class:classes(id, name),
        uploaded_by_user:users!learning_materials_uploaded_by_fkey(id, first_name, last_name)
      `)
      .eq('subject.department_id', department.id)
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

export const approveMaterial = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const { data, error } = await supabase
      .from('learning_materials')
      .update({
        is_approved: true,
        approved_by: userId
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new AppError('Failed to approve material', 500);

    res.json({
      success: true,
      message: 'Material approved successfully',
      material: data
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};
