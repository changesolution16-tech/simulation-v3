/*
  # Create simulation_categories table

  1. New Tables
    - `simulation_categories`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `description` (text, optional)
      - `icon` (text, stores Lucide icon name)
      - `color` (text, stores hex color code)
      - `display_order` (integer, for sorting)
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `simulation_categories` table
    - Add policy for authenticated users to read categories
    - Add policy for admins to manage categories

  3. Indexes
    - Index on display_order for sorting
    - Index on is_active for filtering
*/

CREATE TABLE IF NOT EXISTS simulation_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text DEFAULT 'Folder',
  color text DEFAULT '#3B82F6',
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE simulation_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active categories"
  ON simulation_categories FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can view all categories"
  ON simulation_categories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert categories"
  ON simulation_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update categories"
  ON simulation_categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete categories"
  ON simulation_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_simulation_categories_display_order
  ON simulation_categories(display_order);

CREATE INDEX IF NOT EXISTS idx_simulation_categories_is_active
  ON simulation_categories(is_active);

ALTER TABLE simulations ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES simulation_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_simulations_category_id
  ON simulations(category_id);
