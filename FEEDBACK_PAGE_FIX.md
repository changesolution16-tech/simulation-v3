# Feedback Page Fix - Instances API

## Issues Fixed

### 1. Missing `/api/instances` Route (404 Error)
**Problem**: The feedback page was trying to query `/api/instances?simulation_id=...&learner_id=...&status=in_progress` but the route didn't exist, causing a 404 error.

**Solution**: Created `/src/app/api/instances/route.ts` with:
- GET endpoint supporting query parameters:
  - `simulation_id` - Filter by simulation
  - `learner_id` - Filter by user
  - `status` - Filter by instance status (in_progress, completed, etc.)
  - `assignment_id` - Filter by assignment
- POST endpoint for creating new simulation instances
- Proper authorization checks (users can only see their own instances unless admin)

### 2. Missing Scenario Filtering in Responses API
**Problem**: The feedback page queries `/api/instances/[id]/responses?scenario_id=...` but the route wasn't filtering by scenario_id.

**Solution**: Updated `/src/app/api/instances/[id]/responses/route.ts` to:
- Accept `scenario_id` as a query parameter
- Filter responses by scenario when provided
- Return additional fields needed by the feedback page (`option_id`, `time_to_decision_seconds`)

## Files Created
- `/src/app/api/instances/route.ts` - New instances collection endpoint

## Files Modified
- `/src/app/api/instances/[id]/responses/route.ts` - Added scenario filtering

## API Endpoints

### GET /api/instances
Query parameters:
- `simulation_id` (optional) - Filter by simulation UUID
- `learner_id` (optional) - Filter by user UUID
- `status` (optional) - Filter by status (in_progress, completed, abandoned)
- `assignment_id` (optional) - Filter by training assignment UUID

Returns: Array of simulation instances with simulation and user details

### POST /api/instances
Creates a new simulation instance or returns existing in-progress instance.

Body:
```json
{
  "simulation_id": "uuid",
  "assignment_id": "uuid (optional)",
  "difficulty_level": "beginner|intermediate|advanced",
  "selected_topic": "string (optional)"
}
```

### GET /api/instances/[id]/responses?scenario_id=xxx
Now supports filtering responses by scenario_id for getting learner's answer to specific scenario.

## Testing

The feedback page should now:
1. Successfully find the user's in-progress simulation instance
2. Retrieve the learner's response for the current scenario
3. Display the feedback video and content
4. No longer show "Feedback not available" error

## Database Connection
All routes use the centralized database connection from `@/lib/db` ensuring proper SSL/TLS encryption and connection pooling for AWS RDS.
