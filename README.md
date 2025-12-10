# School Management System - Backend API

Complete backend API for a comprehensive school management system built with Node.js, Express, TypeScript, and Supabase.

## Features

- JWT-based authentication with role-based access control
- Six user roles: Admin, Headmaster, HOD, Teacher, Parent, Student
- Complete CRUD operations for all entities
- Learning materials management
- Assignment submission and grading system
- Attendance tracking
- Announcement system
- Grade management
- Secure password handling with bcrypt

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Security**: Helmet, CORS, Rate Limiting

## Installation

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

The `.env` file is already configured with your Supabase credentials.

### 3. Set Up Database

Run the SQL schema in your Supabase SQL Editor:

```bash
# Open backend/schema.sql and execute it in Supabase SQL Editor
```

This will create:
- All database tables
- Indexes for performance
- Triggers for automatic timestamp updates
- Views for common queries
- Functions for calculations
- Sample data (optional)
- Default admin user

### 4. Run Development Server

```bash
npm run dev
```

The server will start on `http://localhost:4003`

### 5. Build for Production

```bash
npm run build
npm start
```

## Default Admin Credentials

After running the schema, you can log in with:
- **Email**: `admin@school.com`
- **Password**: `Admin@123`

**IMPORTANT**: Change this password after first login!

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/login` | User login | No |
| POST | `/register` | Register new user (Admin only) | Yes |
| GET | `/me` | Get current user | Yes |
| PUT | `/profile` | Update user profile | Yes |
| PUT | `/change-password` | Change password | Yes |

### Admin (`/api/admin`)

All endpoints require Admin role.

**User Management**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | Get all users |
| GET | `/users/:id` | Get user by ID |
| POST | `/users` | Create new user |
| PUT | `/users/:id` | Update user |
| DELETE | `/users/:id` | Delete user |
| PUT | `/users/:id/activate` | Activate user account |
| PUT | `/users/:id/deactivate` | Deactivate user account |

**School Info**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/school` | Get school information |
| PUT | `/school` | Update school information |

**Department Management**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/departments` | Get all departments |
| POST | `/departments` | Create department |
| PUT | `/departments/:id` | Update department |
| DELETE | `/departments/:id` | Delete department |

**Class Management**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/classes` | Get all classes |
| POST | `/classes` | Create class |
| PUT | `/classes/:id` | Update class |
| DELETE | `/classes/:id` | Delete class |

### Teacher (`/api/teacher`)

All endpoints require Teacher role.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/classes` | Get my classes |
| GET | `/classes/:classId/students` | Get students in class |
| POST | `/materials` | Upload learning material |
| GET | `/materials` | Get my materials |
| PUT | `/materials/:id` | Update material |
| DELETE | `/materials/:id` | Delete material |
| POST | `/assignments` | Create assignment |
| GET | `/assignments` | Get my assignments |
| PUT | `/assignments/:id` | Update assignment |
| DELETE | `/assignments/:id` | Delete assignment |
| GET | `/assignments/:assignmentId/submissions` | Get submissions |
| PUT | `/submissions/:id/grade` | Grade submission |
| POST | `/attendance` | Mark attendance |
| GET | `/attendance/class/:classId` | Get class attendance |
| POST | `/announcements` | Create announcement |

### Student (`/api/student`)

All endpoints require Student role.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Get student dashboard |
| GET | `/subjects` | Get my subjects |
| GET | `/subjects/:subjectId/materials` | Get subject materials |
| GET | `/assignments` | Get my assignments |
| GET | `/assignments/:assignmentId` | Get assignment details |
| POST | `/assignments/:assignmentId/submit` | Submit assignment |
| GET | `/grades` | Get my grades |
| GET | `/attendance` | Get my attendance |
| GET | `/announcements` | Get announcements |

### Parent (`/api/parent`)

All endpoints require Parent role.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/children` | Get my children |
| GET | `/children/:studentId/performance` | Get child's grades |
| GET | `/children/:studentId/assignments` | Get child's assignments |
| GET | `/children/:studentId/attendance` | Get child's attendance |

### HOD (`/api/hod`)

All endpoints require HOD role.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/department` | Get my department |
| GET | `/department/subjects` | Get department subjects |
| POST | `/subjects` | Create subject |
| PUT | `/subjects/:id` | Update subject |
| GET | `/department/teachers` | Get department teachers |
| GET | `/department/materials` | Get department materials |
| PUT | `/materials/:id/approve` | Approve material |

### Headmaster (`/api/headmaster`)

All endpoints require Headmaster role.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Get school dashboard |
| GET | `/departments` | Get all departments |
| GET | `/teachers/performance` | Get teacher performance |
| GET | `/students/performance` | Get student performance |
| GET | `/classes` | Get all classes |
| GET | `/school` | Get school information |

## Request/Response Examples

### Login

**Request:**
```json
POST /api/auth/login
{
  "email": "admin@school.com",
  "password": "Admin@123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@school.com",
    "role": "admin",
    "first_name": "System",
    "last_name": "Administrator",
    "is_active": true
  }
}
```

### Create User (Admin)

**Request:**
```json
POST /api/admin/users
Headers: {
  "Authorization": "Bearer YOUR_TOKEN"
}
{
  "email": "teacher@school.com",
  "password": "Teacher123",
  "role": "teacher",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890"
}
```

### Upload Material (Teacher)

**Request:**
```json
POST /api/teacher/materials
Headers: {
  "Authorization": "Bearer YOUR_TOKEN"
}
{
  "title": "Introduction to Algebra",
  "description": "Basic algebra concepts",
  "material_type": "pdf",
  "file_url": "https://storage.example.com/algebra.pdf",
  "file_size": 1024000,
  "subject_id": "subject-uuid",
  "class_id": "class-uuid"
}
```

### Submit Assignment (Student)

**Request:**
```json
POST /api/student/assignments/:assignmentId/submit
Headers: {
  "Authorization": "Bearer YOUR_TOKEN"
}
{
  "submission_text": "My assignment solution...",
  "file_url": "https://storage.example.com/my-submission.pdf"
}
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `500`: Internal Server Error

## Role-Based Access Control

| Role | Description |
|------|-------------|
| **Admin** | Full system control, manages users, school info, departments, classes |
| **Headmaster** | View school-wide data, performance metrics, approve changes |
| **HOD** | Manage department subjects, teachers, and materials |
| **Teacher** | Manage classes, upload materials, create assignments, mark attendance |
| **Parent** | View child's performance, assignments, and attendance |
| **Student** | View subjects, materials, submit assignments, view grades |

## Database Schema

The database includes 20 tables:
1. users
2. school_info
3. departments
4. subjects
5. classes
6. class_subjects
7. students
8. parents
9. student_parents
10. teachers
11. learning_materials
12. assignments
13. assignment_submissions
14. attendance
15. grades
16. announcements
17. notifications
18. password_reset_tokens
19. audit_logs
20. file_uploads

See `schema.sql` for complete database structure.

## Security Features

- Password hashing with bcrypt (10 rounds)
- JWT token authentication (7-day expiration)
- Rate limiting (100 requests per 15 minutes)
- Helmet for HTTP security headers
- CORS enabled
- Role-based authorization middleware
- Input validation
- SQL injection protection via Supabase client

## Development

### Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── adminController.ts
│   │   ├── teacherController.ts
│   │   ├── studentController.ts
│   │   ├── parentController.ts
│   │   ├── hodController.ts
│   │   └── headmasterController.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   └── errorHandler.ts
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   ├── adminRoutes.ts
│   │   ├── teacherRoutes.ts
│   │   ├── studentRoutes.ts
│   │   ├── parentRoutes.ts
│   │   ├── hodRoutes.ts
│   │   └── headmasterRoutes.ts
│   ├── types/
│   │   └── index.ts
│   └── server.ts
├── .env
├── .gitignore
├── package.json
├── tsconfig.json
├── schema.sql
└── README.md
```

### Adding New Endpoints

1. Create controller function in appropriate controller file
2. Add route in corresponding routes file
3. Apply authentication and authorization middleware
4. Test the endpoint

## Testing

You can test the API using:
- Postman
- Thunder Client (VS Code extension)
- cURL
- Your frontend application

## Troubleshooting

### Connection Issues

- Verify Supabase URL and keys in `.env`
- Check if database tables are created
- Ensure port 4003 is not in use

### Authentication Errors

- Verify JWT_SECRET in `.env`
- Check token expiration
- Ensure user account is active

### Database Errors

- Run the schema.sql file in Supabase SQL Editor
- Check table permissions
- Verify foreign key relationships

## Support

For issues or questions, refer to:
- Supabase Documentation: https://supabase.com/docs
- Express Documentation: https://expressjs.com/
- TypeScript Documentation: https://www.typescriptlang.org/

## License

ISC
