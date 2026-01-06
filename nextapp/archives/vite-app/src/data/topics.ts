import { SoftSkillTopic } from '../types';
import { MessageSquare, Users, HeartHandshake, BrainCircuit, Target, BarChart4, Crown } from 'lucide-react';

export const TOPICS: SoftSkillTopic[] = [
  {
    id: 'communication',
    title: 'Effective Communication',
    description: 'Learn to communicate clearly and effectively in various professional situations',
    icon: 'MessageSquare',
    availableDifficulties: ['beginner', 'intermediate', 'advanced']
  },
  {
    id: 'teamwork',
    title: 'Teamwork & Collaboration',
    description: 'Develop skills to work effectively in team environments and collaborative projects',
    icon: 'Users',
    availableDifficulties: ['beginner', 'intermediate', 'advanced']
  },
  {
    id: 'conflict-resolution',
    title: 'Conflict Resolution',
    description: 'Master techniques to address and resolve workplace conflicts professionally',
    icon: 'HeartHandshake',
    availableDifficulties: ['beginner', 'intermediate', 'advanced']
  },
  {
    id: 'critical-thinking',
    title: 'Critical Thinking',
    description: 'Enhance your ability to analyze situations and make sound decisions',
    icon: 'BrainCircuit',
    availableDifficulties: ['intermediate', 'advanced']
  },
  {
    id: 'goal-setting',
    title: 'Goal Setting',
    description: 'Learn to set and achieve meaningful professional and personal goals',
    icon: 'Target',
    availableDifficulties: ['beginner', 'intermediate']
  },
  {
    id: 'leadership',
    title: 'Leadership Skills',
    description: 'Develop the confidence and skills to lead teams and initiatives effectively',
    icon: 'BarChart4',
    availableDifficulties: ['intermediate', 'advanced']
  },
  {
    id: 'covey-leadership',
    title: 'Covey Leadership Principles',
    description: 'Master Stephen Covey\'s 13 behaviors of high-trust leaders',
    icon: 'Crown',
    availableDifficulties: ['intermediate', 'advanced']
  }
];

// Helper function to get icon component by name
export const getTopicIcon = (iconName: string) => {
  const icons = {
    MessageSquare,
    Users,
    HeartHandshake,
    BrainCircuit,
    Target,
    BarChart4,
    Crown
  };
  
  return icons[iconName as keyof typeof icons] || MessageSquare;
};