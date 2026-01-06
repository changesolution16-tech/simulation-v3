/*
  # Add Branding Settings

  1. New Tables
    - `branding_settings`
      - `id` (uuid, primary key)
      - `logo_url` (text) - URL to uploaded company logo
      - `primary_color` (text) - Primary brand color (hex)
      - `secondary_color` (text) - Secondary brand color (hex)
      - `company_name` (text) - Company name for footer
      - `login_title` (text) - Custom title for login page
      - `login_subtitle` (text) - Custom subtitle for login page
      - `updated_at` (timestamptz)
      - `updated_by` (uuid, references auth.users)

  2. Security
    - Enable RLS on `branding_settings` table
    - Only admins can update branding settings
    - Everyone can read branding settings (needed for login page)

  3. Default Values
    - Insert default branding settings with new company info
*/

-- Create branding_settings table
CREATE TABLE IF NOT EXISTS branding_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url text,
  primary_color text DEFAULT '#2563eb',
  secondary_color text DEFAULT '#1e40af',
  company_name text DEFAULT '2025 Softskills Simulations - Change Solutions Limited',
  login_title text DEFAULT 'Soft Skills Simulation',
  login_subtitle text DEFAULT 'Sign in to access your personalized soft skills training',
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE branding_settings ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read branding settings (needed for login page)
CREATE POLICY "Anyone can view branding settings"
  ON branding_settings
  FOR SELECT
  USING (true);

-- Only admins can update branding settings
CREATE POLICY "Admins can update branding settings"
  ON branding_settings
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

-- Only admins can insert branding settings
CREATE POLICY "Admins can insert branding settings"
  ON branding_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create trigger to update updated_at
CREATE TRIGGER update_branding_settings_updated_at
  BEFORE UPDATE ON branding_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default branding settings
INSERT INTO branding_settings (company_name, login_title, login_subtitle)
VALUES (
  '2025 Softskills Simulations - Change Solutions Limited',
  'Soft Skills Simulation',
  'Sign in to access your personalized soft skills training'
)
ON CONFLICT DO NOTHING;

-- Add comment
COMMENT ON TABLE branding_settings IS 'Stores customizable branding settings including logo, colors, and company information';
