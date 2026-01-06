import { Scenario } from '../types';

// Updated scenarios with theoretical frameworks
export const SCENARIOS: Scenario[] = [
  // Communication - Beginner
  {
    id: 'comm-beg-1',
    title: 'Team Meeting Participation',
    description: "You're in a team meeting and have an idea that contradicts what your manager just proposed. How do you handle this situation?",
    topicId: 'communication',
    difficulty: 'beginner',
    options: [
      {
        id: 'comm-beg-1-opt1',
        text: 'Stay silent to avoid conflict with your manager',
        feedback: {
          beginner: 'According to Psychological Safety theory (Edmondson, 1999), staying silent can harm team innovation and learning. Research shows that teams perform better when members feel safe to express diverse viewpoints.',
          intermediate: 'The Spiral of Silence theory (Noelle-Neumann, 1974) explains how self-censorship can lead to diminished team perspectives and reduced organizational learning.',
          advanced: 'Organizational Learning theory (Argyris & Schön, 1978) emphasizes that challenging assumptions and expressing different viewpoints is crucial for double-loop learning and organizational growth.'
        },
        nextScenarioId: 'comm-beg-2',
        skillImpact: {
          communication: -5,
          confidence: -5
        },
        learningRecommendations: {
          resources: [
            {
              title: 'The Fearless Organization',
              type: 'book',
              description: 'Amy Edmondson\'s research on psychological safety and speaking up'
            },
            {
              title: 'Voice and Silence in Organizations',
              type: 'article',
              url: 'https://hbr.org/2019/06/why-employees-dont-speak-up',
              description: 'Research on employee voice and organizational silence'
            }
          ],
          practiceExercises: [
            'Use the "GROW" model (Goals, Reality, Options, Way Forward) to structure your contributions',
            'Practice the "Situation-Behavior-Impact" feedback model',
            'Apply the "DESC" script (Describe, Express, Specify, Consequences) for assertive communication'
          ],
          nextSteps: [
            'Study Crucial Conversations methodology',
            'Learn about Cognitive Behavioral techniques for confidence',
            'Practice the "SCARF" model for influence (Status, Certainty, Autonomy, Relatedness, Fairness)'
          ]
        }
      },
      {
        id: 'comm-beg-1-opt2',
        text: 'Wait for an appropriate moment and respectfully present your alternative view',
        feedback: {
          beginner: 'Excellent! This shows emotional intelligence and professional maturity. You\'re demonstrating respect while still contributing valuable insights.',
          intermediate: 'Your approach aligns with Situational Leadership Theory, showing awareness of context and timing.',
          advanced: 'This reflects key principles from Dialogue Theory and the concept of "Advocacy with Inquiry" from organizational learning research.'
        },
        nextScenarioId: 'comm-beg-2',
        skillImpact: {
          communication: 15,
          emotional_intelligence: 10,
          professionalism: 5
        },
        learningRecommendations: {
          resources: [
            {
              title: 'Crucial Conversations',
              type: 'book',
              description: 'Tools for talking when stakes are high'
            },
            {
              title: 'The Art of Timing in Leadership',
              type: 'article',
              url: 'https://hbr.org/2020/01/the-art-of-timing-in-leadership',
              description: 'Understanding when and how to present challenging ideas'
            }
          ],
          practiceExercises: [
            'Practice the "What, Why, How" framework for presenting ideas',
            'Use the "Situation-Behavior-Impact" feedback model',
            'Role-play difficult conversations'
          ],
          nextSteps: [
            'Study influence techniques',
            'Learn about organizational dynamics',
            'Develop executive presence'
          ]
        }
      },
      {
        id: 'comm-beg-1-opt3',
        text: 'Immediately challenge your manager\'s proposal in front of the team',
        feedback: {
          beginner: 'While it\'s important to share different perspectives, this approach may create unnecessary tension and conflict.',
          intermediate: 'Consider how this impacts team dynamics and your professional relationships.',
          advanced: 'This approach contradicts principles of effective organizational communication and stakeholder management.'
        },
        nextScenarioId: 'comm-beg-2',
        skillImpact: {
          communication: -10,
          professionalism: -10,
          teamwork: -5
        },
        learningRecommendations: {
          resources: [
            {
              title: 'Emotional Intelligence 2.0',
              type: 'book',
              description: 'Developing emotional intelligence in professional settings'
            },
            {
              title: 'The Art of Disagreeing Agreeably',
              type: 'video',
              url: 'https://www.mindtools.com/pages/article/respectful-disagreement.htm',
              description: 'Learn to disagree professionally'
            }
          ],
          practiceExercises: [
            'Study different communication styles',
            'Practice constructive feedback techniques',
            'Learn about conflict resolution'
          ],
          nextSteps: [
            'Develop emotional intelligence',
            'Study professional communication',
            'Learn stakeholder management'
          ]
        }
      }
    ],
    isEndScenario: false,
    videoPrompt: "I'm in a team meeting and have an idea that contradicts my manager's proposal. How should I handle this situation professionally?",
    timerEnabled: true,
    timerVisible: true,
    timerDisplayLocation: 'all',
    timerType: 'count_up'
  },
  // Level 2: One-on-one discussion with Alex
  {
    id: 'comm-beg-2',
    title: 'One-on-One Discussion',
    description: "After the team meeting, Alex approaches you privately to discuss their concerns about workload distribution. They seem frustrated and overwhelmed. How do you handle this one-on-one conversation?",
    topicId: 'communication',
    difficulty: 'beginner',
    options: [
      {
        id: 'comm-beg-2-opt1',
        text: 'Listen actively and empathize with their situation, then work together to find solutions',
        feedback: {
          beginner: 'Excellent use of active listening and empathy! This approach helps build trust and understanding.',
          intermediate: 'Your response demonstrates emotional intelligence and conflict resolution skills.',
          advanced: 'This aligns with Relationship Management theory and shows strong interpersonal leadership.'
        },
        nextScenarioId: 'comm-beg-3',
        skillImpact: {
          communication: 10,
          empathy: 15,
          problem_solving: 5
        },
        learningRecommendations: {
          resources: [
            {
              title: 'Active Listening in the Workplace',
              type: 'course',
              url: 'https://www.coursera.org/learn/active-listening',
              description: 'Master the art of active listening'
            },
            {
              title: 'Crucial Conversations',
              type: 'book',
              description: 'Tools for talking when stakes are high'
            }
          ],
          practiceExercises: [
            'Practice reflective listening techniques',
            'Use the GROW coaching model',
            'Apply empathy mapping'
          ],
          nextSteps: [
            'Study conflict resolution methods',
            'Learn about emotional intelligence',
            'Develop coaching skills'
          ]
        }
      },
      {
        id: 'comm-beg-2-opt2',
        text: 'Tell them to discuss their concerns with their direct supervisor',
        feedback: {
          beginner: 'While following the chain of command is important, this response misses an opportunity to show support and build trust.',
          intermediate: 'Consider how this impacts psychological safety and team relationships.',
          advanced: 'This approach may reinforce organizational silos and hinder collaborative problem-solving.'
        },
        nextScenarioId: 'comm-beg-3',
        skillImpact: {
          communication: -5,
          empathy: -10,
          teamwork: -5
        },
        learningRecommendations: {
          resources: [
            {
              title: 'Building Trust in Teams',
              type: 'course',
              url: 'https://www.linkedin.com/learning/building-trust',
              description: 'Learn to create psychological safety'
            },
            {
              title: 'The Power of Empathy',
              type: 'video',
              url: 'https://www.ted.com/talks/empathy',
              description: 'Understanding empathy in leadership'
            }
          ],
          practiceExercises: [
            'Practice active listening',
            'Study emotional intelligence',
            'Learn about team dynamics'
          ],
          nextSteps: [
            'Develop interpersonal skills',
            'Study conflict resolution',
            'Learn about organizational behavior'
          ]
        }
      },
      {
        id: 'comm-beg-2-opt3',
        text: 'Share your own experiences with workload challenges and brainstorm solutions together',
        feedback: {
          beginner: 'Good approach! Sharing experiences can build rapport and create a collaborative atmosphere.',
          intermediate: 'This demonstrates emotional intelligence and creates psychological safety.',
          advanced: 'Your response shows understanding of social learning theory and peer support principles.'
        },
        nextScenarioId: 'comm-beg-3',
        skillImpact: {
          communication: 10,
          empathy: 10,
          relationship_building: 15
        },
        learningRecommendations: {
          resources: [
            {
              title: 'The Power of Vulnerability',
              type: 'book',
              description: 'Understanding authentic leadership'
            },
            {
              title: 'Collaborative Problem Solving',
              type: 'course',
              url: 'https://www.coursera.org/learn/collaborative-problem-solving',
              description: 'Learn effective collaboration techniques'
            }
          ],
          practiceExercises: [
            'Practice storytelling for impact',
            'Use solution-focused coaching techniques',
            'Apply appreciative inquiry methods'
          ],
          nextSteps: [
            'Study peer coaching',
            'Learn facilitation skills',
            'Develop mentoring abilities'
          ]
        }
      }
    ],
    isEndScenario: false,
    videoPrompt: "Alex has approached you privately about workload concerns. How do you handle this one-on-one conversation?",
    timerEnabled: true,
    timerVisible: true,
    timerDisplayLocation: 'all',
    timerType: 'count_up'
  },
  // Level 3: Team Resolution Meeting
  {
    id: 'comm-beg-3',
    title: 'Team Resolution Meeting',
    description: "You've organized a team meeting to address the workload distribution concerns. How do you facilitate this discussion to ensure a positive outcome?",
    topicId: 'communication',
    difficulty: 'beginner',
    options: [
      {
        id: 'comm-beg-3-opt1',
        text: 'Start with clear objectives, encourage open dialogue, and guide the team toward collaborative solutions',
        feedback: {
          beginner: 'Great facilitation approach! You\'re creating a safe space for open discussion while maintaining focus.',
          intermediate: 'This demonstrates strong group dynamics management and facilitation skills.',
          advanced: 'Your approach aligns with Team Learning theory and collaborative problem-solving frameworks.'
        },
        nextScenarioId: null,
        skillImpact: {
          communication: 15,
          leadership: 10,
          team_management: 10
        },
        learningRecommendations: {
          resources: [
            {
              title: 'Facilitating Group Discussions',
              type: 'course',
              url: 'https://www.linkedin.com/learning/facilitating-discussions',
              description: 'Learn effective facilitation techniques'
            },
            {
              title: 'The Art of Facilitation',
              type: 'book',
              description: 'Guide to leading effective meetings'
            }
          ],
          practiceExercises: [
            'Practice meeting facilitation techniques',
            'Use decision-making frameworks',
            'Apply conflict resolution methods'
          ],
          nextSteps: [
            'Study group dynamics',
            'Learn about change management',
            'Develop strategic planning skills'
          ]
        }
      },
      {
        id: 'comm-beg-3-opt2',
        text: 'Present your pre-determined solution and ask for feedback',
        feedback: {
          beginner: 'While having a solution is helpful, this approach limits team involvement and ownership.',
          intermediate: 'Consider how this impacts team engagement and commitment to solutions.',
          advanced: 'This contradicts principles of participative leadership and collaborative problem-solving.'
        },
        nextScenarioId: null,
        skillImpact: {
          communication: -5,
          leadership: -10,
          team_engagement: -10
        },
        learningRecommendations: {
          resources: [
            {
              title: 'Participative Leadership',
              type: 'course',
              url: 'https://www.coursera.org/learn/participative-leadership',
              description: 'Learn collaborative leadership approaches'
            },
            {
              title: 'Leading Teams',
              type: 'book',
              description: 'Effective team leadership strategies'
            }
          ],
          practiceExercises: [
            'Study facilitation techniques',
            'Practice collaborative decision-making',
            'Learn about team dynamics'
          ],
          nextSteps: [
            'Develop inclusive leadership skills',
            'Study change management',
            'Learn about organizational behavior'
          ]
        }
      },
      {
        id: 'comm-beg-3-opt3',
        text: 'Use a structured problem-solving framework and involve everyone in generating solutions',
        feedback: {
          beginner: 'Excellent approach! Using a framework helps ensure thorough problem-solving while involving all team members.',
          intermediate: 'This demonstrates understanding of group decision-making and facilitation techniques.',
          advanced: 'Your approach aligns with Design Thinking and participative leadership principles.'
        },
        nextScenarioId: null,
        skillImpact: {
          communication: 15,
          problem_solving: 15,
          team_leadership: 10
        },
        learningRecommendations: {
          resources: [
            {
              title: 'Problem-Solving Frameworks',
              type: 'course',
              url: 'https://www.coursera.org/learn/problem-solving-frameworks',
              description: 'Master structured problem-solving approaches'
            },
            {
              title: 'Facilitating Design Thinking',
              type: 'book',
              description: 'Guide to collaborative problem-solving'
            }
          ],
          practiceExercises: [
            'Practice different problem-solving frameworks',
            'Use group facilitation techniques',
            'Apply decision-making tools'
          ],
          nextSteps: [
            'Study design thinking',
            'Learn about systems thinking',
            'Develop strategic planning skills'
          ]
        }
      }
    ],
    isEndScenario: true,
    videoPrompt: "You're facilitating a team meeting to address workload concerns. How do you ensure a productive discussion?",
    timerEnabled: true,
    timerVisible: true,
    timerDisplayLocation: 'all',
    timerType: 'count_up'
  }
];