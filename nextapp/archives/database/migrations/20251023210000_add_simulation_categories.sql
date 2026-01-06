/*
  # Add Simulation Categories

  1. New Tables
    - `simulation_categories`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text)
      - `icon` (text) - lucide icon name
      - `color` (text) - hex color for UI theming
      - `display_order` (integer) - for sorting categories
      - `is_active` (boolean) - to hide/show categories
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Changes
    - Add `category_id` to scenarios table
    - Create index on scenarios.category_id for performance

  3. Security
    - Enable RLS on `simulation_categories` table
    - Add policy for authenticated users to read categories
    - Add policy for admins to manage categories
*/

-- Create simulation_categories table
CREATE TABLE IF NOT EXISTS simulation_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  icon text DEFAULT 'Folder',
  color text DEFAULT '#3B82F6',
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add category_id to scenarios table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN category_id uuid REFERENCES simulation_categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_scenarios_category_id ON scenarios(category_id);

-- Enable RLS
ALTER TABLE simulation_categories ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read categories
CREATE POLICY "Authenticated users can read active categories"
  ON simulation_categories
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Allow admins to manage categories
CREATE POLICY "Admins can insert categories"
  ON simulation_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update categories"
  ON simulation_categories
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete categories"
  ON simulation_categories
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert default categories based on existing topics
INSERT INTO simulation_categories (name, description, icon, color, display_order) VALUES
  ('Communication', 'Learn to communicate clearly and effectively in various professional situations', 'MessageSquare', '#3B82F6', 1),
  ('Teamwork', 'Develop skills to work effectively in team environments and collaborative projects', 'Users', '#10B981', 2),
  ('Conflict Resolution', 'Master techniques to address and resolve workplace conflicts professionally', 'HeartHandshake', '#F59E0B', 3),
  ('Critical Thinking', 'Enhance your ability to analyze situations and make sound decisions', 'BrainCircuit', '#8B5CF6', 4),
  ('Goal Setting', 'Learn to set and achieve meaningful professional and personal goals', 'Target', '#EF4444', 5),
  ('Leadership', 'Develop the confidence and skills to lead teams and initiatives effectively', 'BarChart4', '#EC4899', 6),
  ('Covey Leadership', 'Master Stephen Covey''s 13 behaviors of high-trust leaders', 'Crown', '#F97316', 7)
ON CONFLICT (name) DO NOTHING;
