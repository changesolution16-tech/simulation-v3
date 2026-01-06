// Moodle integration utilities
export const moodleConfig = {
  componentName: 'mod_softskills',
  version: '2025050600',
  requires: '2023042400', // Moodle 4.2
  maturity: 'MATURITY_STABLE',
  dependencies: ['mod_lti']
};

export interface MoodleGrade {
  rawgrade: number;
  feedback?: string;
  timemodified: number;
}

export interface MoodleUser {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
}

export interface MoodleContext {
  instanceid: number;
  courseid: number;
  userid: number;
}

// Initialize Moodle integration
export const initMoodle = (context: MoodleContext) => {
  // Store Moodle context for later use
  window.M = window.M || {};
  window.M.mod_softskills = {
    context,
    // Add other Moodle-specific initialization
  };
};

// Submit grade back to Moodle gradebook
export const submitGrade = async (grade: MoodleGrade) => {
  const context = window.M?.mod_softskills?.context;
  if (!context) throw new Error('Moodle context not initialized');

  try {
    const response = await fetch('/mod/softskills/grade.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contextid: context.instanceid,
        userid: context.userid,
        ...grade
      })
    });

    if (!response.ok) throw new Error('Failed to submit grade');
    
    return await response.json();
  } catch (error) {
    console.error('Error submitting grade:', error);
    throw error;
  }
};

// Get user's previous attempts
export const getPreviousAttempts = async () => {
  const context = window.M?.mod_softskills?.context;
  if (!context) throw new Error('Moodle context not initialized');

  try {
    const response = await fetch(`/mod/softskills/attempts.php?contextid=${context.instanceid}&userid=${context.userid}`);
    if (!response.ok) throw new Error('Failed to fetch attempts');
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching attempts:', error);
    throw error;
  }
};

// Save attempt data
export const saveAttempt = async (data: any) => {
  const context = window.M?.mod_softskills?.context;
  if (!context) throw new Error('Moodle context not initialized');

  try {
    const response = await fetch('/mod/softskills/attempt.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contextid: context.instanceid,
        userid: context.userid,
        data
      })
    });

    if (!response.ok) throw new Error('Failed to save attempt');
    
    return await response.json();
  } catch (error) {
    console.error('Error saving attempt:', error);
    throw error;
  }
};