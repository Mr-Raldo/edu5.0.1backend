-- =====================================================
-- ACADEMIC STRUCTURE MIGRATION
-- =====================================================
-- This migration implements the academic structure:
-- Academic Levels -> Classes -> Students
-- Academic Levels -> Subjects (many-to-many)
-- Teachers assigned to Subject + Class
-- =====================================================

-- 1. Create Academic Levels Table
CREATE TABLE IF NOT EXISTS academic_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE, -- e.g., "Form 1", "Form 2", "Form 3", "Form 4"
    description TEXT,
    display_order INT DEFAULT 0, -- For sorting (Form 1 = 1, Form 2 = 2, etc.)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_academic_levels_name ON academic_levels(name);
CREATE INDEX idx_academic_levels_order ON academic_levels(display_order);

-- 2. Create Subject-Academic Level Assignment Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS subject_academic_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    academic_level_id UUID REFERENCES academic_levels(id) ON DELETE CASCADE,
    is_required BOOLEAN DEFAULT TRUE, -- Is this subject required or optional?
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(subject_id, academic_level_id)
);

CREATE INDEX idx_subject_academic_levels_subject ON subject_academic_levels(subject_id);
CREATE INDEX idx_subject_academic_levels_level ON subject_academic_levels(academic_level_id);

-- 3. Add academic_level_id to classes table
-- First, check if the column doesn't exist to avoid errors
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'classes' AND column_name = 'academic_level_id'
    ) THEN
        ALTER TABLE classes ADD COLUMN academic_level_id UUID REFERENCES academic_levels(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_classes_academic_level ON classes(academic_level_id);

-- 4. Create trigger for updated_at on academic_levels
CREATE TRIGGER update_academic_levels_updated_at
BEFORE UPDATE ON academic_levels
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 5. Insert sample academic levels
INSERT INTO academic_levels (name, description, display_order) VALUES
('Form 1', 'First year of secondary education', 1),
('Form 2', 'Second year of secondary education', 2),
('Form 3', 'Third year of secondary education', 3),
('Form 4', 'Fourth year of secondary education', 4)
ON CONFLICT (name) DO NOTHING;

-- 6. Enable RLS on new tables
ALTER TABLE academic_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_academic_levels ENABLE ROW LEVEL SECURITY;

-- 7. Create a view for classes with academic level info
CREATE OR REPLACE VIEW class_full_details AS
SELECT
    c.id,
    c.name,
    c.level,
    c.capacity,
    c.academic_level_id,
    al.name as academic_level_name,
    al.display_order as academic_level_order,
    u.first_name || ' ' || u.last_name as class_teacher_name,
    u.email as teacher_email,
    COUNT(DISTINCT s.id) as student_count
FROM classes c
LEFT JOIN academic_levels al ON c.academic_level_id = al.id
LEFT JOIN users u ON c.class_teacher_id = u.id
LEFT JOIN students s ON s.class_id = c.id
GROUP BY c.id, c.name, c.level, c.capacity, c.academic_level_id, al.name, al.display_order, u.first_name, u.last_name, u.email;

-- 8. Create function to get all subjects for an academic level
CREATE OR REPLACE FUNCTION get_academic_level_subjects(level_uuid UUID)
RETURNS TABLE (
    subject_id UUID,
    subject_name VARCHAR,
    subject_code VARCHAR,
    department_name VARCHAR,
    is_required BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        sub.id,
        sub.name,
        sub.code,
        d.name,
        sal.is_required
    FROM subject_academic_levels sal
    JOIN subjects sub ON sub.id = sal.subject_id
    LEFT JOIN departments d ON d.id = sub.department_id
    WHERE sal.academic_level_id = level_uuid
    ORDER BY sub.name;
END;
$$ LANGUAGE plpgsql;

-- 9. Create function to get student's subjects (from their class's academic level)
CREATE OR REPLACE FUNCTION get_student_subjects_from_level(student_uuid UUID)
RETURNS TABLE (
    subject_id UUID,
    subject_name VARCHAR,
    subject_code VARCHAR,
    department_name VARCHAR,
    is_required BOOLEAN,
    teacher_name VARCHAR,
    class_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        sub.id,
        sub.name,
        sub.code,
        d.name,
        sal.is_required,
        u.first_name || ' ' || u.last_name as teacher_name,
        c.name as class_name
    FROM students st
    JOIN classes c ON st.class_id = c.id
    JOIN subject_academic_levels sal ON sal.academic_level_id = c.academic_level_id
    JOIN subjects sub ON sub.id = sal.subject_id
    LEFT JOIN departments d ON d.id = sub.department_id
    LEFT JOIN class_subjects cs ON cs.class_id = c.id AND cs.subject_id = sub.id
    LEFT JOIN users u ON u.id = cs.teacher_id
    WHERE st.id = student_uuid
    ORDER BY sub.name;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Next steps:
-- 1. Run this migration in your Supabase SQL Editor
-- 2. Update existing classes to have academic_level_id
-- 3. Assign subjects to academic levels via subject_academic_levels
-- =====================================================
