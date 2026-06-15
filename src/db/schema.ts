import { pgTable, text, integer, boolean, doublePrecision, serial } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  passwordHash: text('password_hash'), // Nullable for SSO
  profilePhoto: text('profile_photo').notNull(),
  level: integer('level').default(1).notNull(),
  xp: integer('xp').default(0).notNull(),
  learningStreak: integer('learning_streak').default(1).notNull(),
  lastActiveDate: text('last_active_date'),
  joinDate: text('join_date').notNull(),
  role: text('role').default('student').notNull(),
  brainModel: text('brain_model').default('gemini-3.5-flash'),
  brainPersona: text('brain_persona').default('Socratic Mentor'),
  brainLanguage: text('brain_language').default('Bahasa Indonesia'),
  brainCreativity: doublePrecision('brain_creativity').default(1.0),
  brainCustomRules: text('brain_custom_rules'),
  unlockedAchievements: text('unlocked_achievements'), // Comma-separated or JSON list of IDs
});

export const subjects = pgTable('subjects', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
  color: text('color').notNull(),
  description: text('description').notNull(),
  createdAt: text('created_at').notNull(),
});

export const materials = pgTable('materials', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  subjectId: text('subject_id').references(() => subjects.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  fileUrl: text('file_url'),
  content: text('content').notNull(),
  type: text('type').notNull(),
  size: text('size').notNull(),
  isFavorite: boolean('is_favorite').default(false).notNull(),
  isArchived: boolean('is_archived').default(false).notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const learningHistory = pgTable('learning_history', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  materialId: text('material_id').references(() => materials.id, { onDelete: 'cascade' }).notNull(),
  activityType: text('activity_type').notNull(),
  activityTitle: text('activity_title').notNull(),
  metadata: text('metadata'), // Serialized JSON
  createdAt: text('created_at').notNull(),
});

export const summaries = pgTable('summaries', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  materialId: text('material_id').references(() => materials.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(),
  content: text('content').notNull(),
  createdAt: text('created_at').notNull(),
});

export const explanations = pgTable('explanations', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  materialId: text('material_id').references(() => materials.id, { onDelete: 'cascade' }).notNull(),
  difficulty: text('difficulty').notNull(),
  content: text('content').notNull(),
  createdAt: text('created_at').notNull(),
});

export const mindmaps = pgTable('mindmaps', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  materialId: text('material_id').references(() => materials.id, { onDelete: 'cascade' }).notNull(),
  jsonData: text('json_data').notNull(), // Serialized JSON
  createdAt: text('created_at').notNull(),
});

export const flashcards = pgTable('flashcards', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  materialId: text('material_id').references(() => materials.id, { onDelete: 'cascade' }).notNull(),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  difficulty: text('difficulty').default('medium').notNull(),
  isFavorite: boolean('is_favorite').default(false).notNull(),
  reviewCount: integer('review_count').default(0).notNull(),
  memoryScore: integer('memory_score').default(80).notNull(),
  easeFactor: doublePrecision('ease_factor').default(2.5).notNull(),
  intervalDays: integer('interval_days').default(1).notNull(),
  nextReviewDate: text('next_review_date').notNull(),
  createdAt: text('created_at').notNull(),
});

export const quizzes = pgTable('quizzes', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  materialId: text('material_id').references(() => materials.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  questions: text('questions').notNull(), // Serialized JSON array
  createdAt: text('created_at').notNull(),
});

export const quizResults = pgTable('quiz_results', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  quizId: text('quiz_id').references(() => quizzes.id, { onDelete: 'cascade' }).notNull(),
  score: integer('score').notNull(),
  totalQuestions: integer('total_questions').notNull(),
  correctAnswersCount: integer('correct_answers_count').notNull(),
  wrongAnswersReview: text('wrong_answers_review').notNull(), // Serialized JSON array
  completedAt: text('completed_at').notNull(),
});

export const tutorChats = pgTable('tutor_chats', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  materialId: text('material_id').references(() => materials.id, { onDelete: 'cascade' }).notNull(),
  conversation: text('conversation').notNull(), // Serialized JSON array of ChatMessage
  createdAt: text('created_at').notNull(),
});
