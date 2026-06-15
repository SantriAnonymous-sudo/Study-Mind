/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// User level & XP configuration
export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  profilePhoto: string;
  level: number;
  xp: number;
  learningStreak: number;
  lastActiveDate?: string; // ISO string YYYY-MM-DD
  joinDate: string; // ISO string
  role: 'student' | 'admin';
  brainModel?: string;
  brainPersona?: string;
  brainLanguage?: string;
  brainCreativity?: number;
  brainCustomRules?: string;
  unlockedAchievements?: string[];
}

// Subject definition
export interface Subject {
  id: string;
  userId: string;
  name: string;
  icon: string; // lucide icon name
  color: string; // Hex color or Tailwind color class
  description: string;
  createdAt: string;
}

// Material types
export type MaterialType = 'pdf' | 'docx' | 'pptx' | 'txt' | 'markdown' | 'note' | 'link';

export interface LearningMaterial {
  id: string;
  userId: string;
  subjectId: string;
  title: string;
  description: string;
  fileUrl?: string;
  content: string; // Extracted or typed content of notes
  type: MaterialType;
  size: string; // human readable e.g., '142 KB'
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

// Learning History
export type ActivityType = 'Upload' | 'Summary' | 'Explanation' | 'MindMap' | 'Flashcard' | 'Quiz' | 'TutorChat';

export interface LearningHistory {
  id: string;
  userId: string;
  materialId: string;
  activityType: ActivityType;
  activityTitle: string;
  metadata?: any; // Score, topic, chat count, etc.
  createdAt: string;
}

// AI summary type
export type SummaryLength = 'short' | 'medium' | 'detailed';

export interface AISummary {
  id: string;
  userId: string;
  materialId: string;
  type: SummaryLength;
  content: string; // Markdown text
  createdAt: string;
}

// AI explanation mode
export type ExplanationDifficulty = 'child' | 'beginner' | 'intermediate' | 'advanced' | 'professional';

export interface AIExplanation {
  id: string;
  userId: string;
  materialId: string;
  difficulty: ExplanationDifficulty;
  content: string; // Markdown text
  createdAt: string;
}

// AI Mind-Map structures
export interface MindMapNode {
  id: string;
  label: string;
  description?: string;
  children?: MindMapNode[];
}

export interface AIMindMap {
  id: string;
  userId: string;
  materialId: string;
  jsonData: {
    root: MindMapNode;
  };
  imageUrl?: string;
  createdAt: string;
}

// Flashcards & Spaced Repetition (SRS)
export type FlashcardDifficulty = 'easy' | 'medium' | 'hard';

export interface Flashcard {
  id: string;
  userId: string;
  materialId: string;
  question: string;
  answer: string;
  difficulty: FlashcardDifficulty;
  isFavorite: boolean;
  
  // SRS parameters
  reviewCount: number;
  memoryScore: number; // 0-100 retention indicator
  easeFactor: number; // multiplier
  intervalDays: number; // 1, 3, 7, 14, 30, 60, 90 etc.
  nextReviewDate: string; // ISO string YYYY-MM-DD
  createdAt: string;
}

// Quizzes structures
export type QuizQuestionType = 'multiple-choice' | 'true-false' | 'essay';

export interface QuizQuestion {
  id: string;
  question: string;
  type: QuizQuestionType;
  options?: string[]; // MC options
  correctAnswer: string; // Option letter or 'True'/'False' or summary guidelines for essay grading
}

export interface Quiz {
  id: string;
  userId: string;
  materialId: string;
  title: string;
  questions: QuizQuestion[];
  createdAt: string;
}

export interface QuizResult {
  id: string;
  userId: string;
  quizId: string;
  score: number; // e.g. 80 meaning 80% or 8/10
  totalQuestions: number;
  correctAnswersCount: number;
  wrongAnswersReview: {
    questionId: string;
    questionText: string;
    selectedAnswer: string;
    correctAnswer: string;
    explanation: string;
  }[];
  completedAt: string;
}

// AI Tutor Session
export interface ChatMessage {
  id: string;
  sender: 'user' | 'tutor';
  text: string;
  timestamp: string;
}

export interface TutorChat {
  id: string;
  userId: string;
  materialId: string;
  conversation: ChatMessage[];
  createdAt: string;
}

// Global Achievement Definition
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  unlockedAt?: string; // ISO string if unlocked
  reqType: string;
  reqCount: number;
}

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_upload', title: 'Curator Initiate', description: 'Upload your first learning material', icon: 'FileUp', xpReward: 50, reqType: 'upload', reqCount: 1 },
  { id: 'first_summary', title: 'The Synthesizer', description: 'Generate your first AI summary guide', icon: 'FileText', xpReward: 50, reqType: 'summary', reqCount: 1 },
  { id: 'quiz_master', title: 'Quiz Whiz', description: 'Score 100% on any practice quiz', icon: 'Award', xpReward: 100, reqType: 'quiz_perfect', reqCount: 1 },
  { id: 'streak_7', title: 'Stellar Scholar', description: 'Reach a 7-day active learning streak', icon: 'Zap', xpReward: 150, reqType: 'streak', reqCount: 7 },
  { id: 'srs_expert', title: 'Spaced Memory Master', description: 'Review 10 flashcards successfully', icon: 'BrainCircuit', xpReward: 120, reqType: 'flashcards_reviewed', reqCount: 10 },
  { id: 'tutor_scholar', title: 'Socratic Thinker', description: 'Initiate an AI tutor interactive lesson session', icon: 'MessageSquare', xpReward: 80, reqType: 'tutor_chats', reqCount: 1 }
];
