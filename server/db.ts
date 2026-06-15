/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
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

// Dual-Engine Database configuration helper
const IS_POSTGRES_CONFIGURED = !!(process.env.SQL_HOST || process.env.POSTGRES_URL || process.env.DATABASE_URL);
let isPostgresOperational = IS_POSTGRES_CONFIGURED;

// Local JSON Storage Engine (Persistent & Serverless-compatible via /tmp)
let localStore: any = {
  users: [],
  subjects: [],
  materials: [],
  learningHistory: [],
  summaries: [],
  explanations: [],
  mindmaps: [],
  flashcards: [],
  quizzes: [],
  quizResults: [],
  tutorChats: []
};

const getLocalDbPath = () => {
  try {
    // Vercel has a completely read-only filesystem except for the /tmp folder
    if (process.env.VERCEL) {
      return '/tmp/studymind_db.json';
    }
    
    if (!fs.existsSync('/tmp')) {
      const dir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      return path.join(dir, 'studymind_db.json');
    } else {
      return '/tmp/studymind_db.json';
    }
  } catch (e) {
    return '/tmp/studymind_db.json';
  }
};

const localDbFile = getLocalDbPath();

function loadLocalStore() {
  try {
    if (fs.existsSync(localDbFile)) {
      const parsed = JSON.parse(fs.readFileSync(localDbFile, 'utf8'));
      localStore = { ...localStore, ...parsed };
    } else {
      // Seed default admin and metadata values immediately
      localStore.users = [{
        uid: 'admin_demo_id',
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
      }];
      localStore.subjects = [
        {
          id: 'sub_1',
          userId: 'admin_demo_id',
          name: 'Computer Science & AI',
          icon: 'Cpu',
          color: '#2563EB',
          description: 'Study of algorithms, neural networks, machine systems, and large language structures.',
          createdAt: new Date('2026-06-01T12:00:00Z').toISOString()
        },
        {
          id: 'sub_2',
          userId: 'admin_demo_id',
          name: 'Digital Marketing strategy',
          icon: 'Megaphone',
          color: '#22C55E',
          description: 'Analyzing user acquisitions, performance campaigns, viral hooks, and SEO frameworks.',
          createdAt: new Date('2026-06-01T12:00:00Z').toISOString()
        }
      ];
      localStore.materials = [
        {
          id: 'mat_1',
          userId: 'admin_demo_id',
          subjectId: 'sub_1',
          title: 'Deep Neural Networks Overview',
          description: 'A study notes file on feed-forward multi-layer perceptrons, SGD backprop, and activation mechanisms.',
          type: 'markdown',
          content: `# Introduction to Deep Neural Networks\n\nDeep neural networks (DNNs) are artificial neural networks with multiple layers between the input and output layers. They find the correct mathematical manipulation to turn the input into the output, whether it is a linear relationship or a non-linear relationship.\n\n## Network Structure\n\n1. Input Layer: Receives input\n2. Hidden Layers: Perform activations\n3. Output Layer: Predicts`,
          size: '1.2 KB',
          isFavorite: true,
          isArchived: false,
          createdAt: new Date('2026-06-01T12:05:00Z').toISOString(),
          updatedAt: new Date('2026-06-01T12:05:00Z').toISOString()
        }
      ];
      localStore.learningHistory = [
        {
          id: 'hist_1',
          userId: 'admin_demo_id',
          materialId: 'mat_1',
          activityType: 'Upload',
          activityTitle: 'Uploaded Deep Neural Networks Overview',
          createdAt: new Date('2026-06-01T12:05:00Z').toISOString()
        },
        {
          id: 'hist_2',
          userId: 'admin_demo_id',
          materialId: 'mat_1',
          activityType: 'Summary',
          activityTitle: 'Generated Short Summary guide',
          createdAt: new Date('2026-06-01T12:10:00Z').toISOString()
        }
      ];
      localStore.summaries = [
        {
          id: 'sum_1',
          userId: 'admin_demo_id',
          materialId: 'mat_1',
          type: 'short',
          content: `**Short Summary:** Deep Neural Networks (DNNs) consist of input, output, and multiple hidden layers that capture complex non-linear structures.`,
          createdAt: new Date('2026-06-01T12:10:00Z').toISOString()
        }
      ];
      saveLocalStore();
    }
  } catch (e) {
    console.error('Failed to load local store:', e);
  }
}

function saveLocalStore() {
  try {
    const parentDir = path.dirname(localDbFile);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(localDbFile, JSON.stringify(localStore, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save local store:', e);
  }
}

loadLocalStore();

export const DB = {
  // USER METHODS
  async getUserByEmail(email: string): Promise<any | null> {
    const emailKey = email.toLowerCase().trim();
    if (!isPostgresOperational) {
      return localStore.users.find((u: any) => u.email === emailKey) || null;
    }
    try {
      const results = await db.select().from(users).where(eq(users.email, emailKey));
      return results[0] || null;
    } catch (err) {
      console.warn('PostgreSQL database select failed, falling back to JSON persistence:', err);
      isPostgresOperational = false;
      return localStore.users.find((u: any) => u.email === emailKey) || null;
    }
  },

  async getUserByUid(uid: string): Promise<UserProfile | null> {
    if (!isPostgresOperational) {
      const user = localStore.users.find((u: any) => u.uid === uid);
      if (!user) return null;
      return {
        ...user,
        unlockedAchievements: typeof user.unlockedAchievements === 'string' ? 
          (user.unlockedAchievements ? user.unlockedAchievements.split(',') : []) : 
          (user.unlockedAchievements || [])
      } as UserProfile;
    }
    try {
      const results = await db.select().from(users).where(eq(users.uid, uid));
      if (results.length === 0) return null;
      const { passwordHash, unlockedAchievements, ...safeProfile } = results[0];
      return {
        ...safeProfile,
        unlockedAchievements: unlockedAchievements ? unlockedAchievements.split(',') : []
      } as UserProfile;
    } catch (err) {
      console.warn('PostgreSQL database select by UID failed, falling back to JSON persistence:', err);
      isPostgresOperational = false;
      const user = localStore.users.find((u: any) => u.uid === uid);
      if (!user) return null;
      return {
        ...user,
        unlockedAchievements: typeof user.unlockedAchievements === 'string' ? 
          (user.unlockedAchievements ? user.unlockedAchievements.split(',') : []) : 
          (user.unlockedAchievements || [])
      } as UserProfile;
    }
  },

  async getAllUsers(): Promise<UserProfile[]> {
    if (!isPostgresOperational) {
      return localStore.users.map((u: any) => ({
        ...u,
        unlockedAchievements: typeof u.unlockedAchievements === 'string' ? 
          (u.unlockedAchievements ? u.unlockedAchievements.split(',') : []) : 
          (u.unlockedAchievements || [])
      } as UserProfile));
    }
    try {
      const results = await db.select().from(users);
      return results.map(({ passwordHash, unlockedAchievements, ...safeProfile }) => ({
        ...safeProfile,
        unlockedAchievements: unlockedAchievements ? unlockedAchievements.split(',') : []
      } as UserProfile));
    } catch (err) {
      console.warn('PostgreSQL database load all users failed, falling back to JSON persistence:', err);
      isPostgresOperational = false;
      return localStore.users.map((u: any) => ({
        ...u,
        unlockedAchievements: typeof u.unlockedAchievements === 'string' ? 
          (u.unlockedAchievements ? u.unlockedAchievements.split(',') : []) : 
          (u.unlockedAchievements || [])
      } as UserProfile));
    }
  },

  async createUser(fullName: string, email: string, passwordHash: string, role: 'student' | 'admin' = 'student'): Promise<UserProfile> {
    const emailKey = email.toLowerCase().trim();
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

    if (isPostgresOperational) {
      try {
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
      } catch (err) {
        console.warn('PostgreSQL user insertion failed, rolling over to JSON layer:', err);
        isPostgresOperational = false;
      }
    }

    // Always keep Local JSON aligned as synchronous backup
    localStore.users.push(newUser);
    const defaultSubjectLocal = {
      id: 'sub_' + Math.random().toString(36).substr(2, 9),
      userId: uid,
      name: 'General Studies',
      icon: 'GraduationCap',
      color: '#2563EB',
      description: 'Primary workspace for broad study concepts, research notes, and general reviews.',
      createdAt: new Date().toISOString()
    };
    localStore.subjects.push(defaultSubjectLocal);
    saveLocalStore();

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
    const userIndex = localStore.users.findIndex((u: any) => u.uid === uid);
    if (userIndex === -1 && !isPostgresOperational) {
      throw new Error('User profile not found');
    }

    const cleanedUpdates: any = { ...updates };
    if (updates.unlockedAchievements) {
      cleanedUpdates.unlockedAchievements = updates.unlockedAchievements.join(',');
    }

    if (isPostgresOperational) {
      try {
        await db.update(users).set(cleanedUpdates).where(eq(users.uid, uid));
      } catch (err) {
        console.warn('PostgreSQL update user profile failed, falling back to JSON persistence:', err);
        isPostgresOperational = false;
      }
    }

    // Update JSON fallback
    if (userIndex !== -1) {
      localStore.users[userIndex] = {
        ...localStore.users[userIndex],
        ...cleanedUpdates
      };
      saveLocalStore();
    }

    const updated = await this.getUserByUid(uid);
    if (!updated) {
      throw new Error('Failed to retrieve updated profile');
    }
    return updated;
  },

  async deleteUser(uid: string): Promise<boolean> {
    const userIndex = localStore.users.findIndex((u: any) => u.uid === uid);
    let deleted = false;

    if (isPostgresOperational) {
      try {
        await db.delete(users).where(eq(users.uid, uid));
        deleted = true;
      } catch (err) {
        console.warn('PostgreSQL delete user failed, rolling over to JSON layer:', err);
        isPostgresOperational = false;
      }
    }

    if (userIndex !== -1) {
      localStore.users.splice(userIndex, 1);
      // Clean cascade dependencies
      localStore.subjects = localStore.subjects.filter((s: any) => s.userId !== uid);
      localStore.materials = localStore.materials.filter((m: any) => m.userId !== uid);
      saveLocalStore();
      deleted = true;
    }

    return deleted;
  },

  async addXP(uid: string, amount: number): Promise<{ xp: number; level: number; unlocked: Achievement[] }> {
    const profile = await this.getUserByUid(uid);
    if (!profile) throw new Error('User not found');

    const currentXP = profile.xp + amount;
    const currentLevel = Math.floor(currentXP / 100) + 1;
    
    let achievementsToUnlock: Achievement[] = [];
    const unlockedList = [...profile.unlockedAchievements];

    // Read statistics to evaluate achievements safely
    const totalUploads = localStore.materials.filter((m: any) => m.userId === uid).length;
    const totalSummaries = localStore.summaries.filter((s: any) => s.userId === uid).length;
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

    if (isPostgresOperational) {
      try {
        await db.update(users).set({
          xp: currentXP,
          level: currentLevel,
          unlockedAchievements: unlockedList.join(',')
        }).where(eq(users.uid, uid));
      } catch (err) {
        console.warn('PostgreSQL update XP failed, falling back to JSON persistence:', err);
        isPostgresOperational = false;
      }
    }

    // Keep memory aligned
    const uIdx = localStore.users.findIndex((u: any) => u.uid === uid);
    if (uIdx !== -1) {
      localStore.users[uIdx].xp = currentXP;
      localStore.users[uIdx].level = currentLevel;
      localStore.users[uIdx].unlockedAchievements = unlockedList.join(',');
      saveLocalStore();
    }

    return { xp: currentXP, level: currentLevel, unlocked: achievementsToUnlock };
  },

  async updateStreak(uid: string): Promise<number> {
    const profile = await this.getUserByUid(uid);
    if (!profile) return 1;

    const todayStr = new Date().toISOString().substring(0, 10);
    const lastActive = profile.lastActiveDate;
    let currentStreak = profile.learningStreak || 1;

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

    if (isPostgresOperational) {
      try {
        await db.update(users).set({
          lastActiveDate: todayStr,
          learningStreak: currentStreak
        }).where(eq(users.uid, uid));
      } catch (err) {
        console.warn('PostgreSQL update streak failed, falling back to JSON persistence:', err);
        isPostgresOperational = false;
      }
    }

    const uIdx = localStore.users.findIndex((u: any) => u.uid === uid);
    if (uIdx !== -1) {
      localStore.users[uIdx].lastActiveDate = todayStr;
      localStore.users[uIdx].learningStreak = currentStreak;
      saveLocalStore();
    }

    return currentStreak;
  },

  // SUBJECT METHODS
  async getSubjects(userId: string): Promise<Subject[]> {
    if (!isPostgresOperational) {
      return localStore.subjects.filter((s: any) => s.userId === userId);
    }
    try {
      const results = await db.select().from(subjects).where(eq(subjects.userId, userId));
      return results as Subject[];
    } catch (err) {
      console.warn('PostgreSQL get subjects failed, falling back to JSON persistence:', err);
      isPostgresOperational = false;
      return localStore.subjects.filter((s: any) => s.userId === userId);
    }
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

    if (isPostgresOperational) {
      try {
        await db.insert(subjects).values(newSub);
      } catch (err) {
        console.warn('PostgreSQL insertion failed for subject, writing to JSON tier:', err);
        isPostgresOperational = false;
      }
    }

    localStore.subjects.push(newSub);
    saveLocalStore();
    return newSub;
  },

  // MATERIALS STORAGE
  async getMaterials(userId: string): Promise<LearningMaterial[]> {
    if (!isPostgresOperational) {
      return localStore.materials.filter((m: any) => m.userId === userId);
    }
    try {
      const results = await db.select().from(materials).where(eq(materials.userId, userId));
      return results as LearningMaterial[];
    } catch (err) {
      console.warn('PostgreSQL query for materials failed, loading from JSON store:', err);
      isPostgresOperational = false;
      return localStore.materials.filter((m: any) => m.userId === userId);
    }
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

    if (isPostgresOperational) {
      try {
        await db.insert(materials).values(newMaterial);
      } catch (err) {
        console.warn('PostgreSQL write on material failed, pushing to local memory:', err);
        isPostgresOperational = false;
      }
    }

    localStore.materials.push(newMaterial);
    saveLocalStore();

    await this.addHistory(userId, id, 'Upload', `Uploaded ${material.title}`);
    await this.addXP(userId, 10);

    return newMaterial;
  },

  async updateMaterial(id: string, updates: Partial<LearningMaterial>): Promise<LearningMaterial> {
    const cleanUpdates = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    if (isPostgresOperational) {
      try {
        await db.update(materials).set(cleanUpdates).where(eq(materials.id, id));
        const reFetched = await db.select().from(materials).where(eq(materials.id, id));
        if (reFetched[0]) return reFetched[0] as LearningMaterial;
      } catch (err) {
        console.warn('PostgreSQL update material failed, updating local copy:', err);
        isPostgresOperational = false;
      }
    }

    const idx = localStore.materials.findIndex((m: any) => m.id === id);
    if (idx === -1) throw new Error('Material not found');
    localStore.materials[idx] = {
      ...localStore.materials[idx],
      ...cleanUpdates
    };
    saveLocalStore();
    return localStore.materials[idx];
  },

  async deleteMaterial(id: string): Promise<boolean> {
    let deleted = false;
    if (isPostgresOperational) {
      try {
        await db.delete(materials).where(eq(materials.id, id));
        deleted = true;
      } catch (err) {
        console.warn('PostgreSQL delete material failed, calling local clean:', err);
        isPostgresOperational = false;
      }
    }

    const idx = localStore.materials.findIndex((m: any) => m.id === id);
    if (idx !== -1) {
      localStore.materials.splice(idx, 1);
      // Clean child materials from JSON
      localStore.learningHistory = localStore.learningHistory.filter((h: any) => h.materialId !== id);
      localStore.summaries = localStore.summaries.filter((s: any) => s.materialId !== id);
      localStore.flashcards = localStore.flashcards.filter((f: any) => f.materialId !== id);
      localStore.quizzes = localStore.quizzes.filter((q: any) => q.materialId !== id);
      localStore.tutorChats = localStore.tutorChats.filter((t: any) => t.materialId !== id);
      saveLocalStore();
      deleted = true;
    }

    return deleted;
  },

  // LEARNING HISTORY
  async getLearningHistory(userId: string): Promise<LearningHistory[]> {
    if (!isPostgresOperational) {
      return localStore.learningHistory
        .filter((h: any) => h.userId === userId)
        .sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt))
        .map((row: any) => ({
          ...row,
          metadata: row.metadata ? JSON.parse(row.metadata) : undefined
        })) as LearningHistory[];
    }
    try {
      const results = await db.select().from(learningHistory).where(eq(learningHistory.userId, userId)).orderBy(desc(learningHistory.createdAt));
      return results.map(row => ({
        ...row,
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined
      })) as LearningHistory[];
    } catch (err) {
      console.warn('PostgreSQL history query failed, reverting to local data:', err);
      isPostgresOperational = false;
      return localStore.learningHistory
        .filter((h: any) => h.userId === userId)
        .sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt))
        .map((row: any) => ({
          ...row,
          metadata: row.metadata ? JSON.parse(row.metadata) : undefined
        })) as LearningHistory[];
    }
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

    if (isPostgresOperational) {
      try {
        await db.insert(learningHistory).values(newHist);
      } catch (err) {
        console.warn('PostgreSQL push history failed, writing to local JSON store:', err);
        isPostgresOperational = false;
      }
    }

    localStore.learningHistory.push(newHist);
    saveLocalStore();

    return {
      ...newHist,
      metadata
    } as any;
  },

  // AI SUMMARIES
  async getSummaries(userId: string, materialId: string): Promise<AISummary[]> {
    if (!isPostgresOperational) {
      return localStore.summaries.filter((s: any) => s.userId === userId && s.materialId === materialId) as AISummary[];
    }
    try {
      const results = await db.select().from(summaries).where(and(eq(summaries.userId, userId), eq(summaries.materialId, materialId)));
      return results as AISummary[];
    } catch (err) {
      console.warn('PostgreSQL select summaries failed, checking local files:', err);
      isPostgresOperational = false;
      return localStore.summaries.filter((s: any) => s.userId === userId && s.materialId === materialId) as AISummary[];
    }
  },

  async createSummary(userId: string, materialId: string, type: 'short' | 'medium' | 'detailed', content: string): Promise<AISummary> {
    const id = 'sum_' + Math.random().toString(36).substr(2, 9);
    const newSummary = {
      id,
      userId,
      materialId,
      type,
      content,
      createdAt: new Date().toISOString()
    };

    if (isPostgresOperational) {
      try {
        await db.delete(summaries).where(and(
          eq(summaries.userId, userId),
          eq(summaries.materialId, materialId),
          eq(summaries.type, type)
        ));
        await db.insert(summaries).values(newSummary);
      } catch (err) {
        console.warn('PostgreSQL write summary failed, falling back to JSON persistence:', err);
        isPostgresOperational = false;
      }
    }

    // Align JSON backup
    localStore.summaries = localStore.summaries.filter((s: any) => !(s.userId === userId && s.materialId === materialId && s.type === type));
    localStore.summaries.push(newSummary);
    saveLocalStore();

    await this.addHistory(userId, materialId, 'Summary', `Generated ${type} summary`);
    await this.addXP(userId, 10);

    return newSummary;
  },

  // AI EXPLANATIONS
  async getExplanations(userId: string, materialId: string): Promise<AIExplanation[]> {
    if (!isPostgresOperational) {
      return localStore.explanations.filter((e: any) => e.userId === userId && e.materialId === materialId) as AIExplanation[];
    }
    try {
      const results = await db.select().from(explanations).where(and(eq(explanations.userId, userId), eq(explanations.materialId, materialId)));
      return results as AIExplanation[];
    } catch (err) {
      console.warn('PostgreSQL load explanation failed, showing local results:', err);
      isPostgresOperational = false;
      return localStore.explanations.filter((e: any) => e.userId === userId && e.materialId === materialId) as AIExplanation[];
    }
  },

  async createExplanation(userId: string, materialId: string, difficulty: ExplanationDifficulty, content: string): Promise<AIExplanation> {
    const id = 'exp_' + Math.random().toString(36).substr(2, 9);
    const newExplanation = {
      id,
      userId,
      materialId,
      difficulty,
      content,
      createdAt: new Date().toISOString()
    };

    if (isPostgresOperational) {
      try {
        await db.delete(explanations).where(and(
          eq(explanations.userId, userId),
          eq(explanations.materialId, materialId),
          eq(explanations.difficulty, difficulty)
        ));
        await db.insert(explanations).values(newExplanation);
      } catch (err) {
        console.warn('PostgreSQL write explanation failed, writing to JSON:', err);
        isPostgresOperational = false;
      }
    }

    localStore.explanations = localStore.explanations.filter((e: any) => !(e.userId === userId && e.materialId === materialId && e.difficulty === difficulty));
    localStore.explanations.push(newExplanation);
    saveLocalStore();

    await this.addHistory(userId, materialId, 'Explanation', `Generated explanations in ${difficulty} mode`);
    await this.addXP(userId, 10);

    return newExplanation;
  },

  // AI MIND MAPS
  async getMindMaps(userId: string, materialId: string): Promise<AIMindMap[]> {
    if (!isPostgresOperational) {
      return localStore.mindmaps
        .filter((m: any) => m.userId === userId && m.materialId === materialId)
        .map((row: any) => ({
          ...row,
          jsonData: typeof row.jsonData === 'string' ? JSON.parse(row.jsonData) : row.jsonData
        })) as AIMindMap[];
    }
    try {
      const results = await db.select().from(mindmaps).where(and(eq(mindmaps.userId, userId), eq(mindmaps.materialId, materialId)));
      return results.map(row => ({
        ...row,
        jsonData: JSON.parse(row.jsonData)
      })) as AIMindMap[];
    } catch (err) {
      console.warn('PostgreSQL mindmaps loading failed, mapping local storage:', err);
      isPostgresOperational = false;
      return localStore.mindmaps
        .filter((m: any) => m.userId === userId && m.materialId === materialId)
        .map((row: any) => ({
          ...row,
          jsonData: typeof row.jsonData === 'string' ? JSON.parse(row.jsonData) : row.jsonData
        })) as AIMindMap[];
    }
  },

  async createMindMap(userId: string, materialId: string, jsonData: { root: MindMapNode }): Promise<AIMindMap> {
    const id = 'mm_' + Math.random().toString(36).substr(2, 9);
    const newMindMap = {
      id,
      userId,
      materialId,
      jsonData: JSON.stringify(jsonData),
      createdAt: new Date().toISOString()
    };

    if (isPostgresOperational) {
      try {
        await db.delete(mindmaps).where(and(eq(mindmaps.userId, userId), eq(mindmaps.materialId, materialId)));
        await db.insert(mindmaps).values(newMindMap);
      } catch (err) {
        console.warn('PostgreSQL save mind map failed, migrating to JSON:', err);
        isPostgresOperational = false;
      }
    }

    localStore.mindmaps = localStore.mindmaps.filter((m: any) => !(m.userId === userId && m.materialId === materialId));
    localStore.mindmaps.push(newMindMap);
    saveLocalStore();

    await this.addHistory(userId, materialId, 'MindMap', `Created interactive mind-map blueprint`);
    await this.addXP(userId, 15);

    return {
      ...newMindMap,
      jsonData
    } as any;
  },

  // AI FLASHCARDS & SRS ENTRIES
  async getFlashcards(userId: string, materialId: string): Promise<Flashcard[]> {
    if (!isPostgresOperational) {
      return localStore.flashcards.filter((f: any) => f.userId === userId && f.materialId === materialId) as Flashcard[];
    }
    try {
      const results = await db.select().from(flashcards).where(and(eq(flashcards.userId, userId), eq(flashcards.materialId, materialId)));
      return results as Flashcard[];
    } catch (err) {
      console.warn('PostgreSQL error loading flashcards, loading JSON fallback:', err);
      isPostgresOperational = false;
      return localStore.flashcards.filter((f: any) => f.userId === userId && f.materialId === materialId) as Flashcard[];
    }
  },

  async getAllFlashcardsDue(userId: string): Promise<Flashcard[]> {
    const todayStr = new Date().toISOString().substring(0, 10);
    if (!isPostgresOperational) {
      return localStore.flashcards.filter((f: any) => f.userId === userId && f.nextReviewDate <= todayStr) as Flashcard[];
    }
    try {
      const results = await db.select().from(flashcards).where(and(eq(flashcards.userId, userId), lte(flashcards.nextReviewDate, todayStr)));
      return results as Flashcard[];
    } catch (err) {
      console.warn('PostgreSQL load schedules cards aborted, loading JSON:', err);
      isPostgresOperational = false;
      return localStore.flashcards.filter((f: any) => f.userId === userId && f.nextReviewDate <= todayStr) as Flashcard[];
    }
  },

  async getFlashcardStats(userId: string): Promise<{ totalCards: number; averageRetention: number; dueToday: number }> {
    const results = await this.getFlashcards(userId, ''); // Fallback behavior for entire user profiles
    const allUserCards = localStore.flashcards.filter((f: any) => f.userId === userId);
    
    // Utilize high accuracy counting
    const activeCards = isPostgresOperational ? results : allUserCards;
    const count = activeCards.length;
    const sumScore = activeCards.reduce((sum, f) => sum + (f.memoryScore || 80), 0);
    const due = await this.getAllFlashcardsDue(userId);

    return {
      totalCards: count,
      averageRetention: count > 0 ? Math.round(sumScore / count) : 85,
      dueToday: due.length
    };
  },

  async createFlashcards(userId: string, materialId: string, cards: Omit<Flashcard, 'id' | 'userId' | 'materialId' | 'isFavorite' | 'reviewCount' | 'memoryScore' | 'easeFactor' | 'intervalDays' | 'nextReviewDate' | 'createdAt'>[]): Promise<Flashcard[]> {
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

    if (isPostgresOperational) {
      try {
        await db.delete(flashcards).where(and(eq(flashcards.userId, userId), eq(flashcards.materialId, materialId)));
        if (insertCards.length > 0) {
          await db.insert(flashcards).values(insertCards);
        }
      } catch (err) {
        console.warn('PostgreSQL write flashcards failed, loading JSON layer:', err);
        isPostgresOperational = false;
      }
    }

    localStore.flashcards = localStore.flashcards.filter((f: any) => !(f.userId === userId && f.materialId === materialId));
    localStore.flashcards.push(...insertCards);
    saveLocalStore();

    await this.addHistory(userId, materialId, 'Flashcard', `Sourced ${insertCards.length} srs learning flashcards`);
    await this.addXP(userId, 20);

    return insertCards as Flashcard[];
  },

  async updateFlashcardSRS(id: string, memoryScore: number, difficulty: FlashcardDifficulty): Promise<Flashcard> {
    const idx = localStore.flashcards.findIndex((f: any) => f.id === id);
    if (idx === -1 && !isPostgresOperational) throw new Error('Flashcard not found');

    const fc = isPostgresOperational ? (await db.select().from(flashcards).where(eq(flashcards.id, id)))[0] : localStore.flashcards[idx];
    if (!fc) throw new Error('Flashcard not resolved');

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

    if (isPostgresOperational) {
      try {
        await db.update(flashcards).set(updates).where(eq(flashcards.id, id));
      } catch (err) {
        console.warn('PostgreSQL update flashcard failed, updating local copy:', err);
        isPostgresOperational = false;
      }
    }

    if (idx !== -1) {
      localStore.flashcards[idx] = {
        ...localStore.flashcards[idx],
        ...updates
      };
      saveLocalStore();
    }

    await this.addXP(fc.userId, 5);
    return isPostgresOperational ? (await db.select().from(flashcards).where(eq(flashcards.id, id)))[0] as Flashcard : localStore.flashcards[idx];
  },

  async toggleFlashcardFavorite(id: string): Promise<Flashcard> {
    const idx = localStore.flashcards.findIndex((f: any) => f.id === id);
    if (idx === -1 && !isPostgresOperational) throw new Error('Flashcard not found');

    const fc = isPostgresOperational ? (await db.select().from(flashcards).where(eq(flashcards.id, id)))[0] : localStore.flashcards[idx];
    if (!fc) throw new Error('Flashcard not resolved');

    const nextFav = !fc.isFavorite;

    if (isPostgresOperational) {
      try {
        await db.update(flashcards).set({ isFavorite: nextFav }).where(eq(flashcards.id, id));
      } catch (err) {
        console.warn('PostgreSQL toggle favorite failed, updating local Copy:', err);
        isPostgresOperational = false;
      }
    }

    if (idx !== -1) {
      localStore.flashcards[idx].isFavorite = nextFav;
      saveLocalStore();
    }

    return isPostgresOperational ? (await db.select().from(flashcards).where(eq(flashcards.id, id)))[0] as Flashcard : localStore.flashcards[idx];
  },

  // PRACTICE QUIZZES & RESULTS
  async getQuizForMaterial(userId: string, materialId: string): Promise<Quiz | null> {
    if (!isPostgresOperational) {
      const q = localStore.quizzes.find((qz: any) => qz.userId === userId && qz.materialId === materialId);
      if (!q) return null;
      return {
        ...q,
        questions: typeof q.questions === 'string' ? JSON.parse(q.questions) : q.questions
      } as unknown as Quiz;
    }
    try {
      const results = await db.select().from(quizzes).where(and(eq(quizzes.userId, userId), eq(quizzes.materialId, materialId)));
      if (results.length === 0) return null;
      return {
        ...results[0],
        questions: JSON.parse(results[0].questions)
      } as unknown as Quiz;
    } catch (err) {
      console.warn('PostgreSQL loading quiz failed, trying JSON backup:', err);
      isPostgresOperational = false;
      const q = localStore.quizzes.find((qz: any) => qz.userId === userId && qz.materialId === materialId);
      if (!q) return null;
      return {
        ...q,
        questions: typeof q.questions === 'string' ? JSON.parse(q.questions) : q.questions
      } as unknown as Quiz;
    }
  },

  async getQuizById(quizId: string): Promise<Quiz | null> {
    if (!isPostgresOperational) {
      const q = localStore.quizzes.find((qz: any) => qz.id === quizId);
      if (!q) return null;
      return {
        ...q,
        questions: typeof q.questions === 'string' ? JSON.parse(q.questions) : q.questions
      } as unknown as Quiz;
    }
    try {
      const results = await db.select().from(quizzes).where(eq(quizzes.id, quizId));
      if (results.length === 0) return null;
      return {
        ...results[0],
        questions: JSON.parse(results[0].questions)
      } as unknown as Quiz;
    } catch (err) {
      console.warn('PostgreSQL select quiz id aborted, loading JSON:', err);
      isPostgresOperational = false;
      const q = localStore.quizzes.find((qz: any) => qz.id === quizId);
      if (!q) return null;
      return {
        ...q,
        questions: typeof q.questions === 'string' ? JSON.parse(q.questions) : q.questions
      } as unknown as Quiz;
    }
  },

  async createQuiz(userId: string, materialId: string, title: string, questions: QuizQuestion[]): Promise<Quiz> {
    const id = 'qz_' + Math.random().toString(36).substr(2, 9);
    const newQuiz = {
      id,
      userId,
      materialId,
      title,
      questions: JSON.stringify(questions),
      createdAt: new Date().toISOString()
    };

    if (isPostgresOperational) {
      try {
        await db.delete(quizzes).where(and(eq(quizzes.userId, userId), eq(quizzes.materialId, materialId)));
        await db.insert(quizzes).values(newQuiz);
      } catch (err) {
        console.warn('PostgreSQL create quiz failed, writing in memory:', err);
        isPostgresOperational = false;
      }
    }

    localStore.quizzes = localStore.quizzes.filter((q: any) => !(q.userId === userId && q.materialId === materialId));
    localStore.quizzes.push(newQuiz);
    saveLocalStore();

    return {
      ...newQuiz,
      questions
    } as unknown as Quiz;
  },

  async getQuizResults(userId: string): Promise<QuizResult[]> {
    if (!isPostgresOperational) {
      return localStore.quizResults
        .filter((q: any) => q.userId === userId)
        .map((row: any) => ({
          ...row,
          wrongAnswersReview: typeof row.wrongAnswersReview === 'string' ? JSON.parse(row.wrongAnswersReview) : row.wrongAnswersReview
        })) as unknown as QuizResult[];
    }
    try {
      const results = await db.select().from(quizResults).where(eq(quizResults.userId, userId));
      return results.map(row => ({
        ...row,
        wrongAnswersReview: JSON.parse(row.wrongAnswersReview)
      })) as unknown as QuizResult[];
    } catch (err) {
      console.warn('PostgreSQL load results failed, grabbing local JSON history:', err);
      isPostgresOperational = false;
      return localStore.quizResults
        .filter((q: any) => q.userId === userId)
        .map((row: any) => ({
          ...row,
          wrongAnswersReview: typeof row.wrongAnswersReview === 'string' ? JSON.parse(row.wrongAnswersReview) : row.wrongAnswersReview
        })) as unknown as QuizResult[];
    }
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

    if (isPostgresOperational) {
      try {
        await db.insert(quizResults).values(newResult);
      } catch (err) {
        console.warn('PostgreSQL save score failed, recording on JSON tier:', err);
        isPostgresOperational = false;
      }
    }

    localStore.quizResults.push(newResult);
    saveLocalStore();

    const quizRecord = await this.getQuizById(quizId);
    const materialId = quizRecord ? quizRecord.materialId : '';
    const quizTitle = quizRecord ? quizRecord.title : 'Practice Quiz';
    
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
    if (!isPostgresOperational) {
      const idx = localStore.tutorChats.findIndex((ch: any) => ch.userId === userId && ch.materialId === materialId);
      if (idx !== -1) {
        const c = localStore.tutorChats[idx];
        return {
          ...c,
          conversation: typeof c.conversation === 'string' ? JSON.parse(c.conversation) : c.conversation
        } as unknown as TutorChat;
      }
    } else {
      try {
        const results = await db.select().from(tutorChats).where(and(eq(tutorChats.userId, userId), eq(tutorChats.materialId, materialId)));
        if (results.length > 0) {
          return {
            ...results[0],
            conversation: JSON.parse(results[0].conversation)
          } as unknown as TutorChat;
        }
      } catch (err) {
        console.warn('PostgreSQL load chats failed, opening local session:', err);
        isPostgresOperational = false;
      }
    }

    // Default initialization Socratic greeting
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

    if (isPostgresOperational) {
      try {
        await db.insert(tutorChats).values(initialTutorChat);
      } catch (e) {
        isPostgresOperational = false;
      }
    }

    localStore.tutorChats.push(initialTutorChat);
    saveLocalStore();

    return {
      ...initialTutorChat,
      conversation: JSON.parse(initialTutorChat.conversation)
    } as unknown as TutorChat;
  },

  async addTutorChatMessage(userId: string, materialId: string, sender: 'user' | 'tutor', text: string): Promise<TutorChat> {
    const activeChats = await this.getTutorChats(userId, materialId);
    let currentConversation = activeChats.conversation || [];
    let recordId = activeChats.id;

    const newMessage = {
      id: 'msg_' + Math.random().toString(36).substr(2, 9),
      sender,
      text,
      timestamp: new Date().toISOString()
    };

    currentConversation.push(newMessage);

    if (isPostgresOperational) {
      try {
        await db.update(tutorChats).set({
          conversation: JSON.stringify(currentConversation)
        }).where(eq(tutorChats.id, recordId));
      } catch (err) {
        console.warn('PostgreSQL update tutor chat message failed, updating localized copy:', err);
        isPostgresOperational = false;
      }
    }

    const idx = localStore.tutorChats.findIndex((ch: any) => ch.id === recordId);
    if (idx !== -1) {
      localStore.tutorChats[idx].conversation = JSON.stringify(currentConversation);
    } else {
      localStore.tutorChats.push({
        id: recordId,
        userId,
        materialId,
        conversation: JSON.stringify(currentConversation),
        createdAt: new Date().toISOString()
      });
    }
    saveLocalStore();

    if (sender === 'user' && currentConversation.filter(m => m.sender === 'user').length === 1) {
      await this.addHistory(userId, materialId, 'TutorChat', 'Consulted with AI tutor');
      await this.addXP(userId, 10);
    }

    return {
      id: recordId,
      userId,
      materialId,
      conversation: currentConversation,
      createdAt: activeChats.createdAt || new Date().toISOString()
    } as unknown as TutorChat;
  },

  // ADMIN ANALYTICS & STATS
  async getSystemAnalytics() {
    const userProfiles = await this.getAllUsers();
    const mats = localStore.materials;
    const histories = localStore.learningHistory;
    const results = localStore.quizResults;
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
  if (!isPostgresOperational) {
    console.log('PostgreSQL is not operational or unconfigured. StudyMind is executing on active Local JSON store /tmp.');
    return;
  }
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
      console.log('PostgreSQL database seeded successfully with initial values!');
    }
  } catch (err) {
    console.warn('DB seeding warning (PostgreSQL tables may not exist yet, falling back to JSON schema):', err);
    isPostgresOperational = false;
  }
}

// Fire seeding asynchronously
initDB();
