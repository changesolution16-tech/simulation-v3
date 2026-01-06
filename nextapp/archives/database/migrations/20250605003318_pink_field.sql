/*
  # Add video support for scenarios

  1. New Tables
    - `scenario_videos`
      - `id` (uuid, primary key)
      - `scenario_id` (text)
      - `video_type` (text) - 'prompt' or 'feedback'
      - `video_url` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for video access
*/

CREATE TABLE IF NOT EXISTS scenario_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id text NOT NULL,
  video_type text NOT NULL CHECK (video_type IN ('prompt', 'feedback')),
  video_url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE scenario_videos ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read videos
CREATE POLICY "Users can read scenario videos"
  ON scenario_videos
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow admin users to manage videos
CREATE POLICY "Admins can manage scenario videos"
  ON scenario_videos
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_scenario_videos_updated_at
  BEFORE UPDATE ON scenario_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();