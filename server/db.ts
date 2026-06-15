/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';
import { db } from '../src/db/index.ts';
import { 
  users, 
  subjects, 
  materials, 
  learningHistory, 
  summaries, 
  explanations, 
  mindmaps, 
  flashcards, 
  quizzes, 
  quizResults, 
  tutorChats 
} from '../src/db/schema.ts';
import { eq, and, desc, sql, lte } from 'drizzle-orm';
import { 
  UserProfile, 
  Subject, 
  LearningMaterial, 
  LearningHistory, 
  ActivityType,
  AISummary, 
  AIExplanation, 
  ExplanationDifficulty,
  AIMindMap, 
  MindMapNode,
  Flashcard, 
  FlashcardDifficulty,
  Quiz, 
  QuizQuestion,
  QuizResult, 
  TutorChat,
  Achievement
} from '../src/types';

// Security: Native hashing function
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_studymind_salt').digest('hex');
}

// Initial achievements list
export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_upload', title: 'Curator Initiate', description: 'Upload your first learning material', icon: 'FileUp', xpReward: 50, reqType: 'upload', reqCount: 1 },
  { id: 'first_summary', title: 'The Synthesizer', description: 'Generate your first AI summary guide', icon: 'FileText', xpReward: 50, reqType: 'summary', reqCount: 1 },
  { id: 'quiz_master', title: 'Quiz Whiz', description: 'Score 100% on any practice quiz', icon: 'Award', xpReward: 100, reqType: 'quiz_perfect', reqCount: 1 },
  { id: 'streak_7', title: 'Stellar Scholar', description: 'Reach a 7-day active learning streak', icon: 'Zap', xpReward: 150, reqType: 'streak', reqCount: 7 },
  { id: 'srs_expert', title: 'Spaced Memory Master', description: 'Review 10 flashcards successfully', icon: 'BrainCircuit', xpReward: 120, reqType: 'flashcards_reviewed', reqCount: 10 },
  { id: 'tutor_scholar', title: 'Socratic Thinker', description: 'Initiate an AI tutor interactive lesson session', icon: 'MessageSquare', xpReward: 80, reqType: 'tutor_chats', reqCount: 1 }
];

export const DB = {
  // USER METHODS
  async getUserByEmail(email: string): Promise<any | null> {
    const results = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return results[0] || null;
  },

  async getUserByUid(uid: string): Promise<UserProfile | null> {
    const results = await db.select().from(users).where(eq(users.uid, uid));
    if (results.length === 0) return null;
    const { passwordHash, unlockedAchievements, ...safeProfile } = results[0];
    return {
      ...safeProfile,
      unlockedAchievements: unlockedAchievements ? unlockedAchievements.split(',') : []
    } as UserProfile;
  },

  async getAllUsers(): Promise<UserProfile[]> {
    const results = await db.select().from(users);
    return results.map(({ passwordHash, unlockedAchievements, ...safeProfile }) => ({
      ...safeProfile,
      unlockedAchievements: unlockedAchievements ? unlockedAchievements.split(',') : []
    } as UserProfile));
  },

  async createUser(fullName: string, email: string, passwordHash: string, role: 'student' | 'admin' = 'student'): Promise<UserProfile> {
    const emailKey = email.toLowerCase();
    const existing = await this.getUserByEmail(emailKey);
    if (existing) {
      throw new Error('User already exists');
    }

    const uid = 'usr_' + Math.random().toString(36).substr(2, 9);
    const joinDate = new Date().toISOString();
    const profilePhoto = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(fullName)}`;

    const newUser = {
      uid,
      fullName,
      email: emailKey,
      passwordHash,
      profilePhoto,
      level: 1,
      xp: 0,
      learningStreak: 1,
      lastActiveDate: new Date().toISOString().substring(0, 10),
      joinDate,
      role,
      brainModel: 'gemini-3.5-flash',
      brainPersona: 'Socratic Mentor',
      brainLanguage: 'Bahasa Indonesia',
      brainCreativity: 1.0,
      brainCustomRules: '',
      unlockedAchievements: ''
    };

    await db.insert(users).values(newUser);

    // Auto seed default subjects for new users
    const defaultSubject: Subject = {
      id: 'sub_' + Math.random().toString(36).substr(2, 9),
      userId: uid,
      name: 'General Studies',
      icon: 'GraduationCap',
      color: '#2563EB',
      description: 'Primary workspace for broad study concepts, research notes, and general reviews.',
      createdAt: new Date().toISOString()
    };
    await db.insert(subjects).values(defaultSubject);

    return {
      uid,
      fullName,
      email: emailKey,
      profilePhoto,
      level: 1,
      xp: 0,
      learningStreak: 1,
      lastActiveDate: newUser.lastActiveDate,
      joinDate,
      role,
      brainModel: 'gemini-3.5-flash',
      brainPersona: 'Socratic Mentor',
      brainLanguage: 'Bahasa Indonesia',
      brainCreativity: 1.0,
      brainCustomRules: '',
      unlockedAchievements: []
    };
  },

  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const results = await db.select().from(users).where(eq(users.uid, uid));
    if (results.length === 0) {
      throw new Error('User profile not found');
    }

    const cleanedUpdates: any = { ...updates };
    if (updates.unlockedAchievements) {
      cleanedUpdates.unlockedAchievements = updates.unlockedAchievements.join(',');
    }

    await db.update(users).set(cleanedUpdates).where(eq(users.uid, uid));

    const updated = await this.getUserByUid(uid);
    if (!updated) {
      throw new Error('Failed to retrieve updated profile');
    }
    return updated;
  },

  async deleteUser(uid: string): Promise<boolean> {
    const results = await db.select().from(users).where(eq(users.uid, uid));
    if (results.length === 0) return false;

    await db.delete(users).where(eq(users.uid, uid));
    return true;
  },

  async addXP(uid: string, amount: number): Promise<{ xp: number; level: number; unlocked: Achievement[] }> {
    const profile = await this.getUserByUid(uid);
    if (!profile) throw new Error('User not found');

    const currentXP = profile.xp + amount;
    const currentLevel = Math.floor(currentXP / 100) + 1;
    
    let achievementsToUnlock: Achievement[] = [];
    const unlockedList = [...profile.unlockedAchievements];

    // Read statistics to evaluate achievements
    const [matList, sumList] = await Promise.all([
      db.select().from(materials).where(eq(materials.userId, uid)),
      db.select().from(summaries).where(eq(summaries.userId, uid))
    ]);
    
    const totalUploads = matList.length;
    const totalSummaries = sumList.length;
    const streakCount = profile.learningStreak || 1;

    // Check first upload
    if (totalUploads >= 1 && !unlockedList.includes('first_upload')) {
      unlockedList.push('first_upload');
      achievementsToUnlock.push(INITIAL_ACHIEVEMENTS.find(a => a.id === 'first_upload')!);
    }
    // Check first summary
    if (totalSummaries >= 1 && !unlockedList.includes('first_summary')) {
      unlockedList.push('first_summary');
      achievementsToUnlock.push(INITIAL_ACHIEVEMENTS.find(a => a.id === 'first_summary')!);
    }
    // Check active streak
    if (streakCount >= 7 && !unlockedList.includes('streak_7')) {
      unlockedList.push('streak_7');
      achievementsToUnlock.push(INITIAL_ACHIEVEMENTS.find(a => a.id === 'streak_7')!);
    }

    await db.update(users).set({
      xp: currentXP,
      level: currentLevel,
      unlockedAchievements: unlockedList.join(',')
    }).where(eq(users.uid, uid));

    return { xp: currentXP, level: currentLevel, unlocked: achievementsToUnlock };
  },

  async updateStreak(uid: string): Promise<number> {
    const results = await db.select().from(users).where(eq(users.uid, uid));
    if (results.length === 0) return 1;

    const userObj = results[0];
    const todayStr = new Date().toISOString().substring(0, 10);
    const lastActive = userObj.lastActiveDate;
    let currentStreak = userObj.learningStreak || 1;

    if (lastActive) {
      if (lastActive === todayStr) {
        // Already active today
      } else {
        const lastDate = new Date(lastActive);
        const todayDate = new Date(todayStr);
        const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          currentStreak += 1;
        } else if (diffDays > 1) {
          currentStreak = 1;
        }
      }
    }

    await db.update(users).set({
      lastActiveDate: todayStr,
      learningStreak: currentStreak
    }).where(eq(users.uid, uid));

    return currentStreak;
  },

  // SUBJECT METHODS
  async getSubjects(userId: string): Promise<Subject[]> {
    const results = await db.select().from(subjects).where(eq(subjects.userId, userId));
    return results as Subject[];
  },

  async createSubject(userId: string, name: string, icon: string, color: string, description: string): Promise<Subject> {
    const id = 'sub_' + Math.random().toString(36).substr(2, 9);
    const newSub: Subject = {
      id,
      userId,
      name,
      icon,
      color,
      description,
      createdAt: new Date().toISOString()
    };
    await db.insert(subjects).values(newSub);
    return newSub;
  },

  // MATERIALS STORAGE
  async getMaterials(userId: string): Promise<LearningMaterial[]> {
    const results = await db.select().from(materials).where(eq(materials.userId, userId));
    return results as LearningMaterial[];
  },

  async createMaterial(userId: string, material: Omit<LearningMaterial, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isFavorite' | 'isArchived'>): Promise<LearningMaterial> {
    const id = 'mat_' + Math.random().toString(36).substr(2, 9);
    const newMaterial: LearningMaterial = {
      ...material,
      id,
      userId,
      isFavorite: false,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await db.insert(materials).values(newMaterial);

    await this.addHistory(userId, id, 'Upload', `Uploaded ${material.title}`);
    await this.addXP(userId, 10);

    return newMaterial;
  },

  async updateMaterial(id: string, updates: Partial<LearningMaterial>): Promise<LearningMaterial> {
    const results = await db.select().from(materials).where(eq(materials.id, id));
    if (results.length === 0) throw new Error('Material not found');

    const cleanUpdates = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await db.update(materials).set(cleanUpdates).where(eq(materials.id, id));
    const reFetched = await db.select().from(materials).where(eq(materials.id, id));
    return reFetched[0] as LearningMaterial;
  },

  async deleteMaterial(id: string): Promise<boolean> {
    const results = await db.select().from(materials).where(eq(materials.id, id));
    if (results.length === 0) return false;

    await db.delete(materials).where(eq(materials.id, id));
    return true;
  },

  // LEARNING HISTORY
  async getLearningHistory(userId: string): Promise<LearningHistory[]> {
    const results = await db.select().from(learningHistory).where(eq(learningHistory.userId, userId)).orderBy(desc(learningHistory.createdAt));
    return results.map(row => ({
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    })) as LearningHistory[];
  },

  async addHistory(userId: string, materialId: string, activityType: ActivityType, activityTitle: string, metadata?: any): Promise<LearningHistory> {
    const id = 'hist_' + Math.random().toString(36).substr(2, 9);
    const newHist = {
      id,
      userId,
      materialId,
      activityType,
      activityTitle,
      metadata: metadata ? JSON.stringify(metadata) : null,
      createdAt: new Date().toISOString()
    };
    await db.insert(learningHistory).values(newHist);
    return {
      ...newHist,
      metadata
    } as any;
  },

  // AI SUMMARIES
  async getSummaries(userId: string, materialId: string): Promise<AISummary[]> {
    const results = await db.select().from(summaries).where(and(eq(summaries.userId, userId), eq(summaries.materialId, materialId)));
    return results as AISummary[];
  },

  async createSummary(userId: string, materialId: string, type: 'short' | 'medium' | 'detailed', content: string): Promise<AISummary> {
    const id = 'sum_' + Math.random().toString(36).substr(2, 9);
    await db.delete(summaries).where(and(
      eq(summaries.userId, userId),
      eq(summaries.materialId, materialId),
      eq(summaries.type, type)
    ));

    const newSummary = {
      id,
      userId,
      materialId,
      type,
      content,
      createdAt: new Date().toISOString()
    };
    await db.insert(summaries).values(newSummary);

    await this.addHistory(userId, materialId, 'Summary', `Generated ${type} summary`);
    await this.addXP(userId, 10);

    return newSummary;
  },

  // AI EXPLANATIONS
  async getExplanations(userId: string, materialId: string): Promise<AIExplanation[]> {
    const results = await db.select().from(explanations).where(and(eq(explanations.userId, userId), eq(explanations.materialId, materialId)));
    return results as AIExplanation[];
  },

  async createExplanation(userId: string, materialId: string, difficulty: ExplanationDifficulty, content: string): Promise<AIExplanation> {
    const id = 'exp_' + Math.random().toString(36).substr(2, 9);
    await db.delete(explanations).where(and(
      eq(explanations.userId, userId),
      eq(explanations.materialId, materialId),
      eq(explanations.difficulty, difficulty)
    ));

    const newExplanation = {
      id,
      userId,
      materialId,
      difficulty,
      content,
      createdAt: new Date().toISOString()
    };
    await db.insert(explanations).values(newExplanation);

    await this.addHistory(userId, materialId, 'Explanation', `Generated explanations in ${difficulty} mode`);
    await this.addXP(userId, 10);

    return newExplanation;
  },

  // AI MIND MAPS
  async getMindMaps(userId: string, materialId: string): Promise<AIMindMap[]> {
    const results = await db.select().from(mindmaps).where(and(eq(mindmaps.userId, userId), eq(mindmaps.materialId, materialId)));
    return results.map(row => ({
      ...row,
      jsonData: JSON.parse(row.jsonData)
    })) as AIMindMap[];
  },

  async createMindMap(userId: string, materialId: string, jsonData: { root: MindMapNode }): Promise<AIMindMap> {
    const id = 'mm_' + Math.random().toString(36).substr(2, 9);
    await db.delete(mindmaps).where(and(eq(mindmaps.userId, userId), eq(mindmaps.materialId, materialId)));

    const newMindMap = {
      id,
      userId,
      materialId,
      jsonData: JSON.stringify(jsonData),
      createdAt: new Date().toISOString()
    };
    await db.insert(mindmaps).values(newMindMap);

    await this.addHistory(userId, materialId, 'MindMap', `Created interactive mind-map blueprint`);
    await this.addXP(userId, 15);

    return {
      ...newMindMap,
      jsonData
    } as any;
  },

  // AI FLASHCARDS & SRS ENTRIES
  async getFlashcards(userId: string, materialId: string): Promise<Flashcard[]> {
    const results = await db.select().from(flashcards).where(and(eq(flashcards.userId, userId), eq(flashcards.materialId, materialId)));
    return results as Flashcard[];
  },

  async getAllFlashcardsDue(userId: string): Promise<Flashcard[]> {
    const todayStr = new Date().toISOString().substring(0, 10);
    const results = await db.select().from(flashcards).where(and(eq(flashcards.userId, userId), lte(flashcards.nextReviewDate, todayStr)));
    return results as Flashcard[];
  },

  async getFlashcardStats(userId: string): Promise<{ totalCards: number; averageRetention: number; dueToday: number }> {
    const results = await db.select().from(flashcards).where(eq(flashcards.userId, userId));
    const count = results.length;
    const sumScore = results.reduce((sum, f) => sum + (f.memoryScore || 80), 0);
    const due = await this.getAllFlashcardsDue(userId);
    return {
      totalCards: count,
      averageRetention: count > 0 ? Math.round(sumScore / count) : 85,
      dueToday: due.length
    };
  },

  async createFlashcards(userId: string, materialId: string, cards: Omit<Flashcard, 'id' | 'userId' | 'materialId' | 'isFavorite' | 'reviewCount' | 'memoryScore' | 'easeFactor' | 'intervalDays' | 'nextReviewDate' | 'createdAt'>[]): Promise<Flashcard[]> {
    await db.delete(flashcards).where(and(eq(flashcards.userId, userId), eq(flashcards.materialId, materialId)));

    const insertCards: any[] = cards.map(c => ({
      ...c,
      id: 'fc_' + Math.random().toString(36).substr(2, 9),
      userId,
      materialId,
      isFavorite: false,
      reviewCount: 0,
      memoryScore: 100,
      easeFactor: 2.5,
      intervalDays: 1,
      nextReviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
      createdAt: new Date().toISOString()
    }));

    if (insertCards.length > 0) {
      await db.insert(flashcards).values(insertCards);
    }

    await this.addHistory(userId, materialId, 'Flashcard', `Sourced ${insertCards.length} srs learning flashcards`);
    await this.addXP(userId, 20);

    return insertCards as Flashcard[];
  },

  async updateFlashcardSRS(id: string, memoryScore: number, difficulty: FlashcardDifficulty): Promise<Flashcard> {
    const results = await db.select().from(flashcards).where(eq(flashcards.id, id));
    if (results.length === 0) throw new Error('Flashcard not found');

    const fc = results[0];
    const newReviewCount = fc.reviewCount + 1;
    
    let nextIntervalDays = 1;
    if (difficulty === 'easy') {
      if (fc.intervalDays === 1) nextIntervalDays = 3;
      else if (fc.intervalDays === 3) nextIntervalDays = 7;
      else if (fc.intervalDays === 7) nextIntervalDays = 14;
      else if (fc.intervalDays === 14) nextIntervalDays = 30;
      else if (fc.intervalDays === 30) nextIntervalDays = 60;
      else nextIntervalDays = 90;
    } else if (difficulty === 'medium') {
      nextIntervalDays = fc.intervalDays > 1 ? fc.intervalDays : 3;
    } else {
      nextIntervalDays = 1;
    }

    const nextReviewDate = new Date(Date.now() + nextIntervalDays * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);

    const updates = {
      reviewCount: newReviewCount,
      memoryScore,
      intervalDays: nextIntervalDays,
      nextReviewDate
    };

    await db.update(flashcards).set(updates).where(eq(flashcards.id, id));
    
    const reFetched = await db.select().from(flashcards).where(eq(flashcards.id, id));
    await this.addXP(fc.userId, 5);

    return reFetched[0] as Flashcard;
  },

  async toggleFlashcardFavorite(id: string): Promise<Flashcard> {
    const results = await db.select().from(flashcards).where(eq(flashcards.id, id));
    if (results.length === 0) throw new Error('Flashcard not found');

    await db.update(flashcards).set({ isFavorite: !results[0].isFavorite }).where(eq(flashcards.id, id));
    
    const reFetched = await db.select().from(flashcards).where(eq(flashcards.id, id));
    return reFetched[0] as Flashcard;
  },

  // PRACTICE QUIZZES & RESULTS
  async getQuizForMaterial(userId: string, materialId: string): Promise<Quiz | null> {
    const results = await db.select().from(quizzes).where(and(eq(quizzes.userId, userId), eq(quizzes.materialId, materialId)));
    if (results.length === 0) return null;
    return {
      ...results[0],
      questions: JSON.parse(results[0].questions)
    } as unknown as Quiz;
  },

  async getQuizById(quizId: string): Promise<Quiz | null> {
    const results = await db.select().from(quizzes).where(eq(quizzes.id, quizId));
    if (results.length === 0) return null;
    return {
      ...results[0],
      questions: JSON.parse(results[0].questions)
    } as unknown as Quiz;
  },

  async createQuiz(userId: string, materialId: string, title: string, questions: QuizQuestion[]): Promise<Quiz> {
    await db.delete(quizzes).where(and(eq(quizzes.userId, userId), eq(quizzes.materialId, materialId)));
    
    const id = 'qz_' + Math.random().toString(36).substr(2, 9);
    const newQuiz = {
      id,
      userId,
      materialId,
      title,
      questions: JSON.stringify(questions),
      createdAt: new Date().toISOString()
    };
    await db.insert(quizzes).values(newQuiz);

    return {
      ...newQuiz,
      questions
    } as unknown as Quiz;
  },

  async getQuizResults(userId: string): Promise<QuizResult[]> {
    const results = await db.select().from(quizResults).where(eq(quizResults.userId, userId));
    return results.map(row => ({
      ...row,
      wrongAnswersReview: JSON.parse(row.wrongAnswersReview)
    })) as unknown as QuizResult[];
  },

  async saveQuizResult(userId: string, quizId: string, score: number, totalQuestions: number, correctAnswersCount: number, wrongAnswersReview: any[]): Promise<QuizResult> {
    const id = 'qres_' + Math.random().toString(36).substr(2, 9);
    
    const newResult = {
      id,
      userId,
      quizId,
      score,
      totalQuestions,
      correctAnswersCount,
      wrongAnswersReview: JSON.stringify(wrongAnswersReview),
      completedAt: new Date().toISOString()
    };
    await db.insert(quizResults).values(newResult);

    const quizRecordResult = await db.select().from(quizzes).where(eq(quizzes.id, quizId));
    const materialId = quizRecordResult[0] ? quizRecordResult[0].materialId : '';
    const quizTitle = quizRecordResult[0] ? quizRecordResult[0].title : 'Practice Quiz';
    
    await this.addHistory(userId, materialId, 'Quiz', `Completed Quiz "${quizTitle}" with score ${score}%`, { score });
    await this.addXP(userId, 30);

    if (score === 100) {
      await this.addXP(userId, 50);
    }

    return {
      ...newResult,
      wrongAnswersReview
    } as any;
  },

  // AI TUTOR CHATS
  async getTutorChats(userId: string, materialId: string): Promise<TutorChat> {
    const results = await db.select().from(tutorChats).where(and(eq(tutorChats.userId, userId), eq(tutorChats.materialId, materialId)));
    if (results.length > 0) {
      return {
        ...results[0],
        conversation: JSON.parse(results[0].conversation)
      } as unknown as TutorChat;
    }

    const id = 'tc_' + Math.random().toString(36).substr(2, 9);
    const initialTutorChat = {
      id,
      userId,
      materialId,
      conversation: JSON.stringify([
        {
          id: 'init_msg',
          sender: 'tutor',
          text: 'Hello! I am your AI Socratic Study Partner. Ask me any hard-to-understand questions, prompt me to generate review examples, or ask me to explain parts of your uploaded study material!',
          timestamp: new Date().toISOString()
        }
      ]),
      createdAt: new Date().toISOString()
    };
    await db.insert(tutorChats).values(initialTutorChat);

    return {
      ...initialTutorChat,
      conversation: JSON.parse(initialTutorChat.conversation)
    } as unknown as TutorChat;
  },

  async addTutorChatMessage(userId: string, materialId: string, sender: 'user' | 'tutor', text: string): Promise<TutorChat> {
    const results = await db.select().from(tutorChats).where(and(eq(tutorChats.userId, userId), eq(tutorChats.materialId, materialId)));
    
    let currentConversation: any[] = [];
    let recordId = '';

    if (results.length === 0) {
      recordId = 'tc_' + Math.random().toString(36).substr(2, 9);
      currentConversation = [];
    } else {
      recordId = results[0].id;
      currentConversation = JSON.parse(results[0].conversation);
    }

    const newMessage = {
      id: 'msg_' + Math.random().toString(36).substr(2, 9),
      sender,
      text,
      timestamp: new Date().toISOString()
    };

    currentConversation.push(newMessage);

    if (results.length === 0) {
      await db.insert(tutorChats).values({
        id: recordId,
        userId,
        materialId,
        conversation: JSON.stringify(currentConversation),
        createdAt: new Date().toISOString()
      });
    } else {
      await db.update(tutorChats).set({
        conversation: JSON.stringify(currentConversation)
      }).where(eq(tutorChats.id, recordId));
    }

    if (sender === 'user' && currentConversation.filter(m => m.sender === 'user').length === 1) {
      await this.addHistory(userId, materialId, 'TutorChat', 'Consulted with AI tutor');
      await this.addXP(userId, 10);
    }

    return {
      id: recordId,
      userId,
      materialId,
      conversation: currentConversation,
      createdAt: results[0] ? results[0].createdAt : new Date().toISOString()
    } as unknown as TutorChat;
  },

  // ADMIN ANALYTICS & STATS
  async getSystemAnalytics() {
    const [userProfiles, mats, histories, results] = await Promise.all([
      db.select().from(users),
      db.select().from(materials),
      db.select().from(learningHistory),
      db.select().from(quizResults)
    ]);

    const totalXP = userProfiles.reduce((sum, u) => sum + (u.xp || 0), 0);

    return {
      totalUsers: userProfiles.length,
      totalMaterials: mats.length,
      totalInteractions: histories.length,
      totalQuizzesRun: results.length,
      totalLevelSum: userProfiles.reduce((sum, u) => sum + (u.level || 1), 0),
      averageXP: userProfiles.length > 0 ? Math.round(totalXP / userProfiles.length) : 0,
      materialsByType: {
        pdf: mats.filter(m => m.type === 'pdf').length,
        docx: mats.filter(m => m.type === 'docx').length,
        pptx: mats.filter(m => m.type === 'pptx').length,
        notes: mats.filter(m => m.type === 'markdown' || m.type === 'note' || m.type === 'txt').length,
        links: mats.filter(m => m.type === 'link').length,
      },
      recentUserRegistrations: userProfiles.map(u => ({
        fullName: u.fullName,
        email: u.email,
        level: u.level,
        joinDate: u.joinDate
      })).slice(-8)
    };
  }
};

// Seed databases if empty async worker on load
export async function initDB() {
  try {
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length === 0) {
      const adminId = 'admin_demo_id';
      
      // Seed default admin in PostgreSQL
      await db.insert(users).values({
        uid: adminId,
        fullName: 'Munggiz Scholar',
        email: 'akang.munggiz.07@gmail.com',
        passwordHash: hashPassword('admin123'),
        profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
        level: 5,
        xp: 450,
        learningStreak: 4,
        joinDate: new Date('2026-06-01T12:00:00Z').toISOString(),
        role: 'admin',
        unlockedAchievements: 'first_upload'
      });

      // Seed default subjects for Admin
      await db.insert(subjects).values([
        {
          id: 'sub_1',
          userId: adminId,
          name: 'Computer Science & AI',
          icon: 'Cpu',
          color: '#2563EB',
          description: 'Study of algorithms, neural networks, machine systems, and large language structures.',
          createdAt: new Date('2026-06-01T12:00:00Z').toISOString()
        },
        {
          id: 'sub_2',
          userId: adminId,
          name: 'Digital Marketing strategy',
          icon: 'Megaphone',
          color: '#22C55E',
          description: 'Analyzing user acquisitions, performance campaigns, viral hooks, and SEO frameworks.',
          createdAt: new Date('2026-06-01T12:00:00Z').toISOString()
        }
      ]);

      // Seed default material notes
      await db.insert(materials).values([
        {
          id: 'mat_1',
          userId: adminId,
          subjectId: 'sub_1',
          title: 'Deep Neural Networks Overview',
          description: 'A study notes file on feed-forward multi-layer perceptrons, SGD backprop, and activation mechanisms.',
          type: 'markdown',
          content: `# Introduction to Deep Neural Networks\n\nDeep neural networks (DNNs) are artificial neural networks with multiple layers between the input and output layers. They find the correct mathematical manipulation to turn the input into the output, whether it is a linear relationship or a non-linear relationship.\n\n## Network Structure\n\n1. **Input Layer**: Receives the raw features (e.g. pixels of an image or word tokens).\n2. **Hidden Layers**: Perform non-linear transformations using activation functions like ReLU (Rectified Linear Unit), Sigmoid, or Tanh.\n3. **Output Layer**: Produces the final prediction (e.g., classification probabilities).\n\n## Backpropagation and Optimization\n\nBackpropagation is the primary algorithm used to train deep models. It calculates the gradient of the loss function with respect to the weights using the chain rule, propagating errors backward layer-by-layer. Optimization techniques such as Stochastic Gradient Descent (SGD) or Adam are then applied to update weights to minimize loss values over epochs.`,
          size: '1.2 KB',
          isFavorite: true,
          isArchived: false,
          createdAt: new Date('2026-06-01T12:05:00Z').toISOString(),
          updatedAt: new Date('2026-06-01T12:05:00Z').toISOString()
        }
      ]);

      // Seed default Learning History
      await db.insert(learningHistory).values([
        {
          id: 'hist_1',
          userId: adminId,
          materialId: 'mat_1',
          activityType: 'Upload',
          activityTitle: 'Uploaded Deep Neural Networks Overview',
          createdAt: new Date('2026-06-01T12:05:00Z').toISOString()
        },
        {
          id: 'hist_2',
          userId: adminId,
          materialId: 'mat_1',
          activityType: 'Summary',
          activityTitle: 'Generated Short Summary guide',
          createdAt: new Date('2026-06-01T12:10:00Z').toISOString()
        }
      ]);

      // Seed default summaries
      await db.insert(summaries).values([
        {
          id: 'sum_1',
          userId: adminId,
          materialId: 'mat_1',
          type: 'short',
          content: `**Short Summary:** Deep Neural Networks (DNNs) consist of input, output, and multiple hidden layers that capture complex non-linear structures. They are optimized by backpropagating gradients of a loss function via the chain rule, updating system parameters with algorithms like Adam or SGD.`,
          createdAt: new Date('2026-06-01T12:10:00Z').toISOString()
        }
      ]);
    }
  } catch (err) {
    console.warn('DB seeding warning:', err);
  }
}

// Fire seeding asynchronously
initDB();
