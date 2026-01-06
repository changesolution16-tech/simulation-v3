/*
  # Add Admin Update Profiles Policy

  1. Changes
    - Add policy to allow admin users to update any profile
    - Admins need this permission to manage users through the admin panel
    
  2. Security
    - Only users with role 'admin' can update other users' profiles
    - Regular users can still only update their own profile
*/

-- Add policy for admins to update any profile
CREATE POLICY "Admins can update any profile"
  ON profiles
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