# Scenario Creation Guide

## Overview
The scenario creation feature has been fully implemented and fixed. You can now create training simulation scenarios through an intuitive, step-by-step interface.

## How to Create a Scenario

### Step 1: Access the Admin Dashboard
1. Log in as an admin user
2. Navigate to the "Scenarios" tab in the Admin Dashboard
3. Click the "Add Scenario" button

### Step 2: Fill in Basic Information
In the modal that appears, you'll need to provide:

- **Scenario Title** (Required): A clear, descriptive title for your scenario
  - Example: "Handling a Difficult Conversation"

- **Description** (Required): A detailed description of the situation and context
  - This sets the scene for the learner
  - Should explain what's happening and what the learner needs to address

- **Topic** (Required): Select from available soft skill topics
  - Communication
  - Teamwork & Collaboration
  - Conflict Resolution
  - Critical Thinking
  - Goal Setting
  - Leadership Skills
  - Covey Leadership Principles

- **Difficulty** (Required): Choose the appropriate level
  - Beginner: For those new to the skill
  - Intermediate: For learners with some experience
  - Advanced: For experienced learners

- **Video Prompt** (Optional): Text prompt for generating a video narration
  - Describe what the AI presenter should say
  - This will be used with Synthesia for video generation
  - Example: "You're about to meet with a team member who has been consistently missing deadlines..."

- **End Scenario Checkbox**: Mark this if the scenario shows final results
  - End scenarios display a summary of the learner's performance
  - Typically used as the conclusion of a learning path

### Step 3: Add Response Options
After clicking "Next: Add Options", you'll configure the learner's choices:

Each scenario needs at least 2 options (maximum 5). For each option:

- **Option Text** (Required): The choice text that learners will see
  - Example: "Address the issue directly with the team member"

- **Beginner Feedback** (Required): Feedback for beginner-level learners
  - This is shown after they select this option
  - Should explain why this choice is good or what to improve

- **Intermediate/Advanced Feedback** (Optional): More sophisticated feedback
  - If left empty, the beginner feedback will be used
  - Provides deeper insights for more experienced learners

- **Skill Impact**: Points awarded or deducted for this choice
  - Positive numbers (e.g., +10) increase the skill level
  - Negative numbers (e.g., -5) decrease the skill level
  - Zero (0) for neutral choices

### Step 4: Save and Create
Click "Create Scenario" to save your work. The system will:
- Validate all required fields
- Create the scenario in the database
- Create all associated response options
- Show a success message
- Automatically reload the scenario list

## After Creation

### Using the Flow Builder
After creating scenarios, you can:
1. Go to the Flow Builder (Admin Dashboard → Flow Builder tab)
2. Visually connect scenarios to create branching paths
3. Drag and drop scenario nodes to arrange them
4. Click the connection icon on any option to link it to another scenario
5. Create complex decision trees for learners

### Publishing Scenarios
Scenarios are created in "draft" status. To publish:
1. Use the Flow Builder to set the scenario status to "published"
2. Only published scenarios are visible to learners
3. You can also set scenarios to "review" or "archived"

## Best Practices

### Writing Good Scenarios
- **Be Specific**: Provide enough context for learners to make informed decisions
- **Make It Realistic**: Base scenarios on real workplace situations
- **Clear Options**: Each option should be distinct and meaningful
- **Constructive Feedback**: Help learners understand why choices matter
- **Progressive Difficulty**: Adjust complexity based on the difficulty level

### Skill Impact Guidelines
- Major positive choice: +10 to +15 points
- Minor positive choice: +5 to +10 points
- Neutral choice: 0 points
- Minor negative choice: -5 to -10 points
- Major negative choice: -10 to -15 points

### Video Prompts
When writing video prompts for Synthesia:
- Use natural, conversational language
- Keep it concise (1-2 paragraphs)
- Include the key information learners need
- Specify the tone (professional, encouraging, serious, etc.)

## Troubleshooting

### Button Doesn't Work
The "Add Scenario" button now properly opens a modal. If it doesn't:
- Check your browser console for errors
- Verify you're logged in as an admin
- Ensure Supabase connection is working

### Validation Errors
The system validates:
- All required fields must be filled
- At least 2 options must be provided
- Each option needs at least beginner-level feedback

### Database Connection Issues
If you see errors about Supabase:
- Verify your .env file has correct credentials
- Check the browser console for specific error messages
- Contact your system administrator

## Technical Details

### Database Structure
Scenarios are stored across two tables:
- `scenarios`: Core scenario information
- `scenario_options`: Response choices with feedback and skill impacts
- `scenario_branches`: Connections between scenarios (managed by Flow Builder)

### Integration Points
- **Video Manager**: Links video content to scenarios
- **Flow Builder**: Creates branching learning paths
- **Analytics**: Tracks learner choices and paths
- **Topics**: Organizes scenarios by soft skill category
