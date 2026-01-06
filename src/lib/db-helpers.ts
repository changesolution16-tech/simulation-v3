import sql from './db';

function checkDb() {
  if (!sql) {
    throw new Error('Database not configured. Please set DATABASE_URL environment variable.');
  }
}

export async function getUserByEmail(email: string) {
  checkDb();
  const [user] = await sql`
    SELECT
      id,
      email,
      password_hash,
      full_name,
      username,
      role,
      institution,
      department,
      position,
      is_active,
      account_locked_until,
      failed_login_attempts,
      password_last_changed,
      last_login_at,
      progress
    FROM profiles
    WHERE email = ${email}
    LIMIT 1
  `;
  return user;
}

export async function getUserById(id: string) {
  const [user] = await sql`
    SELECT
      id,
      email,
      full_name,
      username,
      role,
      institution,
      department,
      position,
      is_active,
      account_locked_until,
      failed_login_attempts,
      password_last_changed,
      last_login_at,
      progress
    FROM profiles
    WHERE id = ${id}
    LIMIT 1
  `;
  return user;
}

export async function updateLastLogin(userId: string) {
  await sql`
    UPDATE profiles
    SET
      last_login_at = NOW(),
      failed_login_attempts = 0,
      account_locked_until = NULL
    WHERE id = ${userId}
  `;
}

export async function incrementFailedLogins(userId: string) {
  await sql`
    UPDATE profiles
    SET
      failed_login_attempts = failed_login_attempts + 1,
      account_locked_until = CASE
        WHEN failed_login_attempts >= 5 THEN NOW() + INTERVAL '15 minutes'
        ELSE account_locked_until
      END
    WHERE id = ${userId}
  `;
}

export async function getSimulationsByCategory(categoryId?: string) {
  if (categoryId) {
    return await sql`
      SELECT
        s.*,
        c.name as category_name,
        c.color as category_color,
        COUNT(DISTINCT si.id) as total_attempts,
        COUNT(DISTINCT si.user_id) as unique_users
      FROM simulations s
      LEFT JOIN simulation_categories c ON c.id = s.category_id
      LEFT JOIN simulation_instances si ON si.simulation_id = s.id
      WHERE s.category_id = ${categoryId} AND s.is_published = true
      GROUP BY s.id, c.name, c.color
      ORDER BY s.created_at DESC
    `;
  }

  return await sql`
    SELECT
      s.*,
      c.name as category_name,
      c.color as category_color,
      COUNT(DISTINCT si.id) as total_attempts,
      COUNT(DISTINCT si.user_id) as unique_users
    FROM simulations s
    LEFT JOIN simulation_categories c ON c.id = s.category_id
    LEFT JOIN simulation_instances si ON si.simulation_id = s.id
    WHERE s.is_published = true
    GROUP BY s.id, c.name, c.color
    ORDER BY s.created_at DESC
  `;
}

export async function getSimulationById(simulationId: string) {
  const [simulation] = await sql`
    SELECT * FROM simulations
    WHERE id = ${simulationId}
    LIMIT 1
  `;
  return simulation;
}

export async function getScenariosBySimulation(simulationId: string) {
  return await sql`
    SELECT
      s.*,
      json_agg(
        json_build_object(
          'id', so.id,
          'text', so.option_text,
          'nextScenarioId', so.next_scenario_id,
          'skillImpact', so.skill_impacts,
          'competencyImpacts', so.competency_impacts,
          'feedback', json_build_object(
            'beginner', so.feedback_beginner,
            'intermediate', so.feedback_intermediate,
            'advanced', so.feedback_advanced
          ),
          'feedbackVideos', json_build_object(
            'beginner', so.feedback_video_url_beginner,
            'intermediate', so.feedback_video_url_intermediate,
            'advanced', so.feedback_video_url_advanced
          ),
          'transitionVideoUrl', so.transition_video_url
        ) ORDER BY so.option_order
      ) as options
    FROM scenarios s
    LEFT JOIN scenario_options so ON so.scenario_id = s.id
    WHERE s.simulation_id = ${simulationId}
    GROUP BY s.id
    ORDER BY s.created_at
  `;
}

export async function createSimulationInstance(data: {
  simulationId: string;
  userId: string;
  difficulty?: string;
  assignmentId?: string;
}) {
  const [instance] = await sql`
    INSERT INTO simulation_instances (
      simulation_id,
      user_id,
      difficulty,
      assignment_id,
      started_at,
      status
    ) VALUES (
      ${data.simulationId},
      ${data.userId},
      ${data.difficulty || 'beginner'},
      ${data.assignmentId || null},
      NOW(),
      'in_progress'
    )
    RETURNING *
  `;
  return instance;
}

export async function updateSimulationInstance(instanceId: string, data: {
  status?: string;
  completedAt?: Date;
  currentScenarioId?: string;
  stagesCompleted?: number;
  currentStage?: number;
}) {
  const [instance] = await sql`
    UPDATE simulation_instances
    SET
      status = COALESCE(${data.status || null}, status),
      completed_at = COALESCE(${data.completedAt || null}, completed_at),
      current_scenario_id = COALESCE(${data.currentScenarioId || null}, current_scenario_id),
      stages_completed = COALESCE(${data.stagesCompleted || null}, stages_completed),
      current_stage = COALESCE(${data.currentStage || null}, current_stage),
      updated_at = NOW()
    WHERE id = ${instanceId}
    RETURNING *
  `;
  return instance;
}

export async function saveLearnerResponse(data: {
  instanceId: string;
  scenarioId: string;
  optionId: string;
  responseTime?: number;
}) {
  const [response] = await sql`
    INSERT INTO learner_responses (
      instance_id,
      scenario_id,
      selected_option_id,
      response_time_seconds,
      responded_at
    ) VALUES (
      ${data.instanceId},
      ${data.scenarioId},
      ${data.optionId},
      ${data.responseTime || null},
      NOW()
    )
    RETURNING *
  `;
  return response;
}

export async function getCategories() {
  return await sql`
    SELECT * FROM simulation_categories
    WHERE is_active = true
    ORDER BY display_order, name
  `;
}

export async function getCompetencies() {
  return await sql`
    SELECT * FROM competencies
    ORDER BY name
  `;
}
