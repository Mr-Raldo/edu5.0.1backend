import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthRequest, LoginRequest, RegisterUserRequest } from '../types';
import supabase from '../config/database';
import { generateToken } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginRequest = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.is_active) {
      throw new AppError('Your account is not active. Please contact the administrator.', 403);
    }

    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    const token = generateToken(user);

    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, error: error.message });
    } else {
      res.status(500).json({ success: false, error: 'Login failed' });
    }
  }
};

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'admin') {
      throw new AppError('Only administrators can register new users', 403);
    }

    const { email, password, role, first_name, last_name, phone, department_id, class_id, date_of_birth, gender, address, relationship, occupation }: RegisterUserRequest = req.body;

    if (!email || !password || !role || !first_name || !last_name) {
      throw new AppError('Required fields: email, password, role, first_name, last_name', 400);
    }

    const validRoles = ['admin', 'headmaster', 'hod', 'teacher', 'parent', 'student'];
    if (!validRoles.includes(role)) {
      throw new AppError('Invalid role', 400);
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: newUser, error } = await supabase
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
      .select()
      .single();

    if (error) {
      throw new AppError('Failed to create user', 500);
    }

    // If role is teacher, create an entry in the teachers table
    if (role === 'teacher') {
      // Generate employee number: TCH + timestamp
      const employeeNumber = `TCH${Date.now()}`;

      const { error: teacherError } = await supabase
        .from('teachers')
        .insert({
          user_id: newUser.id,
          employee_number: employeeNumber,
          department_id: department_id || null,
          hire_date: new Date().toISOString().split('T')[0]
        });

      if (teacherError) {
        // Rollback user creation if teacher entry fails
        await supabase.from('users').delete().eq('id', newUser.id);
        throw new AppError('Failed to create teacher profile', 500);
      }
    }

    // If role is student, create an entry in the students table
    let studentData = null;
    if (role === 'student') {
      // Generate student number: STU + timestamp
      const studentNumber = `STU${Date.now()}`;

      const { data: student, error: studentError } = await supabase
        .from('students')
        .insert({
          user_id: newUser.id,
          student_number: studentNumber,
          class_id: class_id || null,
          date_of_birth: date_of_birth || null,
          gender: gender || null,
          address: address || null,
          enrollment_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

      if (studentError) {
        // Rollback user creation if student entry fails
        await supabase.from('users').delete().eq('id', newUser.id);
        throw new AppError('Failed to create student profile', 500);
      }
      studentData = student;
    }

    // If role is parent, create an entry in the parents table
    let parentData = null;
    if (role === 'parent') {
      const { data: parent, error: parentError } = await supabase
        .from('parents')
        .insert({
          user_id: newUser.id,
          relationship: relationship || null,
          occupation: occupation || null
        })
        .select()
        .single();

      if (parentError) {
        // Rollback user creation if parent entry fails
        await supabase.from('users').delete().eq('id', newUser.id);
        throw new AppError('Failed to create parent profile', 500);
      }
      parentData = parent;
    }

    const { password_hash, ...userWithoutPassword } = newUser;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: userWithoutPassword,
      student_id: studentData?.id || null,
      parent_id: parentData?.id || null
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, error: error.message });
    } else {
      res.status(500).json({ success: false, error: 'Registration failed' });
    }
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const { password_hash, ...userWithoutPassword } = req.user as any;

    res.json({
      success: true,
      user: userWithoutPassword
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to get user data' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const { first_name, last_name, phone, profile_image } = req.body;

    const updates: any = {};
    if (first_name) updates.first_name = first_name;
    if (last_name) updates.last_name = last_name;
    if (phone) updates.phone = phone;
    if (profile_image) updates.profile_image = profile_image;

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) {
      throw new AppError('Failed to update profile', 500);
    }

    const { password_hash, ...userWithoutPassword } = data;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: userWithoutPassword
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, error: error.message });
    } else {
      res.status(500).json({ success: false, error: 'Update failed' });
    }
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      throw new AppError('Current password and new password are required', 400);
    }

    if (new_password.length < 6) {
      throw new AppError('New password must be at least 6 characters long', 400);
    }

    const { data: user } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', req.user.id)
      .single();

    const isPasswordValid = await bcrypt.compare(current_password, user!.password_hash);

    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);

    const { error } = await supabase
      .from('users')
      .update({ password_hash: hashedPassword })
      .eq('id', req.user.id);

    if (error) {
      throw new AppError('Failed to change password', 500);
    }

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, error: error.message });
    } else {
      res.status(500).json({ success: false, error: 'Password change failed' });
    }
  }
};
