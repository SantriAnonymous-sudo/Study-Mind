/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
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

const DB_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DB_DIR, 'users.json');
const SUBJECTS_FILE = path.join(DB_DIR, 'subjects.json');
const MATERIALS_FILE = path.join(DB_DIR, 'materials.json');
const HISTORY_FILE = path.join(DB_DIR, 'history.json');
const SUMMARIES_FILE = path.join(DB_DIR, 'summaries.json');
const EXPLANATIONS_FILE = path.join(DB_DIR, 'explanations.json');
const MINDMAPS_FILE = path.join(DB_DIR, 'mindmaps.json');
const FLASHCARDS_FILE = path.join(DB_DIR, 'flashcards.json');
const QUIZZES_FILE = path.join(DB_DIR, 'quizzes.json');
const QUIZ_RESULTS_FILE = path.join(DB_DIR, 'quiz_results.json');
const CHATS_FILE = path.join(DB_DIR, 'chats.json');

// Ensure db directory structure exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Utility to read and write files safely
function readJSON<T>(filePath: string, defaultValue: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return defaultValue;
  }
}

function writeJSON<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
  }
}

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

// Seed databases if empty
export function initDB() {
  const users = readJSON<{ [email: string]: any }>(USERS_FILE, {});
  const subjects = readJSON<Subject[]>(SUBJECTS_FILE, []);
  
  // Seed default admin if not existing
  const adminEmail = 'akang.munggiz.07@gmail.com';
  if (!users[adminEmail]) {
    const adminId = 'admin_demo_id';
    users[adminEmail] = {
      uid: adminId,
      fullName: 'Munggiz Scholar',
      email: adminEmail,
      passwordHash: hashPassword('admin123'),
      profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
      level: 5,
      xp: 450,
      learningStreak: 4,
      joinDate: new Date('2026-06-01T12:00:00Z').toISOString(),
      role: 'admin',
      unlockedAchievements: ['first_upload']
    };
    writeJSON(USERS_FILE, users);

    // Seed default subjects for Admin
    if (subjects.length === 0) {
      const demoSubjects: Subject[] = [
        {
          id: 'sub_1',
          userId: adminId,
          name: 'Computer Science & AI',
          icon: 'Cpu',
          color: '#2563EB', // Blue
          description: 'Study of algorithms, neural networks, machine systems, and large language structures.',
          createdAt: new Date('2026-06-01T12:00:00Z').toISOString()
        },
        {
          id: 'sub_2',
          userId: adminId,
          name: 'Digital Marketing strategy',
          icon: 'Megaphone',
          color: '#22C55E', // Green
          description: 'Analyzing user acquisitions, performance campaigns, viral hooks, and SEO frameworks.',
          createdAt: new Date('2026-06-01T12:00:00Z').toISOString()
        }
      ];
      writeJSON(SUBJECTS_FILE, demoSubjects);

      // Seed default material notes
      const demoMaterials: LearningMaterial[] = [
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
      ];
      writeJSON(MATERIALS_FILE, demoMaterials);

      // Seed default Learning History
      const demoHistory: LearningHistory[] = [
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
      ];
      writeJSON(HISTORY_FILE, demoHistory);

      // Seed default summaries
      const demoSummaries: AISummary[] = [
        {
          id: 'sum_1',
          userId: adminId,
          materialId: 'mat_1',
          type: 'short',
          content: `**Short Summary:** Deep Neural Networks (DNNs) consist of input, output, and multiple hidden layers that capture complex non-linear structures. They are optimized by backpropagating gradients of a loss function via the chain rule, updating system parameters with algorithms like Adam or SGD.`,
          createdAt: new Date('2026-06-01T12:10:00Z').toISOString()
        }
      ];
      writeJSON(SUMMARIES_FILE, demoSummaries);
    }
  }
}

// Call initDB immediately
initDB();

export const DB = {
  // USER METHODS
  getUserByEmail(email: string) {
    const users = readJSON<{ [email: string]: any }>(USERS_FILE, {});
    return users[email.toLowerCase()] || null;
  },

  getUserByUid(uid: string): UserProfile | null {
    const users = readJSON<{ [email: string]: any }>(USERS_FILE, {});
    for (const email in users) {
      if (users[email].uid === uid) {
        // Exclude password hash from profile returning
        const { passwordHash, ...safeProfile } = users[email];
        return safeProfile as UserProfile;
      }
    }
    return null;
  },

  getAllUsers(): UserProfile[] {
    const users = readJSON<{ [email: string]: any }>(USERS_FILE, {});
    return Object.values(users).map(u => {
      const { passwordHash, ...safe } = u;
      return safe as UserProfile;
    });
  },

  createUser(fullName: string, email: string, passwordHash: string, role: 'student' | 'admin' = 'student'): UserProfile {
    const users = readJSON<{ [email: string]: any }>(USERS_FILE, {});
    const emailKey = email.toLowerCase();
    
    if (users[emailKey]) {
      throw new Error('User already exists');
    }

    const uid = 'usr_' + Math.random().toString(36).substr(2, 9);
    const newUser = {
      uid,
      fullName,
      email: emailKey,
      passwordHash,
      profilePhoto: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(fullName)}`,
      level: 1,
      xp: 0,
      learningStreak: 1,
      lastActiveDate: new Date().toISOString().substring(0, 10),
      joinDate: new Date().toISOString(),
      role,
      unlockedAchievements: []
    };

    users[emailKey] = newUser;
    writeJSON(USERS_FILE, users);

    // Auto seed default subjects for new users
    const defaultSubjects: Subject[] = [
      {
        id: 'sub_new_1',
        userId: uid,
        name: 'General Studies',
        icon: 'GraduationCap',
        color: '#2563EB',
        description: 'Primary workspace for broad study concepts, research notes, and general reviews.',
        createdAt: new Date().toISOString()
      }
    ];
    const existingSubjects = readJSON<Subject[]>(SUBJECTS_FILE, []);
    writeJSON(SUBJECTS_FILE, [...existingSubjects, ...defaultSubjects]);

    const { passwordHash: _, ...safeProfile } = newUser;
    return safeProfile as UserProfile;
  },

  updateUserProfile(uid: string, updates: Partial<UserProfile>): UserProfile {
    const users = readJSON<{ [email: string]: any }>(USERS_FILE, {});
    let userEmailKey = '';
    
    for (const email in users) {
      if (users[email].uid === uid) {
        userEmailKey = email;
        break;
      }
    }

    if (!userEmailKey) {
      throw new Error('User profile not found');
    }

    users[userEmailKey] = {
      ...users[userEmailKey],
      ...updates
    };

    writeJSON(USERS_FILE, users);
    const { passwordHash, ...safe } = users[userEmailKey];
    return safe as UserProfile;
  },

  deleteUser(uid: string): boolean {
    const users = readJSON<{ [email: string]: any }>(USERS_FILE, {});
    let userEmailKey = '';
    
    for (const email in users) {
      if (users[email].uid === uid) {
        userEmailKey = email;
        break;
      }
    }

    if (!userEmailKey) return false;

    delete users[userEmailKey];
    writeJSON(USERS_FILE, users);

    // Clean up user data
    const subjects = readJSON<Subject[]>(SUBJECTS_FILE, []);
    writeJSON(SUBJECTS_FILE, subjects.filter(s => s.userId !== uid));

    const materials = readJSON<LearningMaterial[]>(MATERIALS_FILE, []);
    writeJSON(MATERIALS_FILE, materials.filter(m => m.userId !== uid));

    return true;
  },

  addXP(uid: string, amount: number): { xp: number; level: number; unlocked: Achievement[] } {
    const profile = this.getUserByUid(uid);
    if (!profile) throw new Error('User not found');

    const currentXP = profile.xp + amount;
    
    // Level System Formula e.g. level = math.floor(xp / 100) + 1
    const currentLevel = Math.floor(currentXP / 100) + 1;
    
    let achievementsToUnlock: Achievement[] = [];
    const users = readJSON<{ [email: string]: any }>(USERS_FILE, {});
    let emailKey = '';
    for (const email in users) {
      if (users[email].uid === uid) {
        emailKey = email;
        break;
      }
    }

    if (emailKey) {
      const unlockedList = users[emailKey].unlockedAchievements || [];
      
      // Streak and other condition assessments for rewards
      const totalUploads = readJSON<LearningMaterial[]>(MATERIALS_FILE, []).filter(m => m.userId === uid).length;
      const totalSummaries = readJSON<AISummary[]>(SUMMARIES_FILE, []).filter(s => s.userId === uid).length;
      const streakCount = users[emailKey].learningStreak || 1;
      
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

      users[emailKey].xp = currentXP;
      users[emailKey].level = currentLevel;
      users[emailKey].unlockedAchievements = unlockedList;
      writeJSON(USERS_FILE, users);
    }

    return { xp: currentXP, level: currentLevel, unlocked: achievementsToUnlock };
  },

  updateStreak(uid: string): number {
    const users = readJSON<{ [email: string]: any }>(USERS_FILE, {});
    let emailKey = '';
    for (const email in users) {
      if (users[email].uid === uid) {
        emailKey = email;
        break;
      }
    }

    if (!emailKey) return 1;

    const todayStr = new Date().toISOString().substring(0, 10);
    const lastActive = users[emailKey].lastActiveDate;
    let currentStreak = users[emailKey].learningStreak || 1;

    if (lastActive) {
      if (lastActive === todayStr) {
        // Daily active already
      } else {
        const lastDate = new Date(lastActive);
        const todayDate = new Date(todayStr);
        const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Continuous days streak incremented!
          currentStreak += 1;
        } else if (diffDays > 1) {
          // Streak broken
          currentStreak = 1;
        }
      }
    }

    users[emailKey].lastActiveDate = todayStr;
    users[emailKey].learningStreak = currentStreak;
    writeJSON(USERS_FILE, users);

    return currentStreak;
  },

  // SUBJECT METHODS
  getSubjects(userId: string): Subject[] {
    const subjects = readJSON<Subject[]>(SUBJECTS_FILE, []);
    return subjects.filter(s => s.userId === userId);
  },

  createSubject(userId: string, name: string, icon: string, color: string, description: string): Subject {
    const subjects = readJSON<Subject[]>(SUBJECTS_FILE, []);
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
    subjects.push(newSub);
    writeJSON(SUBJECTS_FILE, subjects);
    return newSub;
  },

  // MATERIALS STORAGE
  getMaterials(userId: string): LearningMaterial[] {
    const materials = readJSON<LearningMaterial[]>(MATERIALS_FILE, []);
    return materials.filter(m => m.userId === userId);
  },

  createMaterial(userId: string, material: Omit<LearningMaterial, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isFavorite' | 'isArchived'>): LearningMaterial {
    const materials = readJSON<LearningMaterial[]>(MATERIALS_FILE, []);
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

    materials.push(newMaterial);
    writeJSON(MATERIALS_FILE, materials);

    // Track in History
    this.addHistory(userId, id, 'Upload', `Uploaded ${material.title}`);
    
    // Grant XP
    this.addXP(userId, 10);

    return newMaterial;
  },

  updateMaterial(id: string, updates: Partial<LearningMaterial>): LearningMaterial {
    const materials = readJSON<LearningMaterial[]>(MATERIALS_FILE, []);
    const index = materials.findIndex(m => m.id === id);
    if (index === -1) throw new Error('Material not found');

    materials[index] = {
      ...materials[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    writeJSON(MATERIALS_FILE, materials);
    return materials[index];
  },

  deleteMaterial(id: string): boolean {
    const materials = readJSON<LearningMaterial[]>(MATERIALS_FILE, []);
    const filtered = materials.filter(m => m.id !== id);
    if (materials.length === filtered.length) return false;
    
    writeJSON(MATERIALS_FILE, filtered);

    // Clean up related summary guides, tests, flashcard items
    const histories = readJSON<LearningHistory[]>(HISTORY_FILE, []);
    writeJSON(HISTORY_FILE, histories.filter(h => h.materialId !== id));

    const summaries = readJSON<AISummary[]>(SUMMARIES_FILE, []);
    writeJSON(SUMMARIES_FILE, summaries.filter(s => s.materialId !== id));

    const explanations = readJSON<AIExplanation[]>(EXPLANATIONS_FILE, []);
    writeJSON(EXPLANATIONS_FILE, explanations.filter(e => e.materialId !== id));

    const mindmaps = readJSON<AIMindMap[]>(MINDMAPS_FILE, []);
    writeJSON(MINDMAPS_FILE, mindmaps.filter(m => m.materialId !== id));

    const flashcards = readJSON<Flashcard[]>(FLASHCARDS_FILE, []);
    writeJSON(FLASHCARDS_FILE, flashcards.filter(f => f.materialId !== id));

    const quizzes = readJSON<Quiz[]>(QUIZZES_FILE, []);
    writeJSON(QUIZZES_FILE, quizzes.filter(q => q.materialId !== id));

    const chats = readJSON<TutorChat[]>(CHATS_FILE, []);
    writeJSON(CHATS_FILE, chats.filter(c => c.materialId !== id));

    return true;
  },

  // LEARNING HISTORY
  getLearningHistory(userId: string): LearningHistory[] {
    const history = readJSON<LearningHistory[]>(HISTORY_FILE, []);
    return history.filter(h => h.userId === userId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  addHistory(userId: string, materialId: string, activityType: ActivityType, activityTitle: string, metadata?: any): LearningHistory {
    const history = readJSON<LearningHistory[]>(HISTORY_FILE, []);
    const id = 'hist_' + Math.random().toString(36).substr(2, 9);
    const newHistory: LearningHistory = {
      id,
      userId,
      materialId,
      activityType,
      activityTitle,
      metadata,
      createdAt: new Date().toISOString()
    };
    history.push(newHistory);
    writeJSON(HISTORY_FILE, history);
    return newHistory;
  },

  // AI SUMMARIES
  getSummaries(userId: string, materialId: string): AISummary[] {
    const summaries = readJSON<AISummary[]>(SUMMARIES_FILE, []);
    return summaries.filter(s => s.userId === userId && s.materialId === materialId);
  },

  createSummary(userId: string, materialId: string, type: 'short' | 'medium' | 'detailed', content: string): AISummary {
    const summaries = readJSON<AISummary[]>(SUMMARIES_FILE, []);
    const id = 'sum_' + Math.random().toString(36).substr(2, 9);
    
    // Remove duplication for the same length summary
    const filtered = summaries.filter(s => !(s.userId === userId && s.materialId === materialId && s.type === type));

    const newSummary: AISummary = {
      id,
      userId,
      materialId,
      type,
      content,
      createdAt: new Date().toISOString()
    };
    
    filtered.push(newSummary);
    writeJSON(SUMMARIES_FILE, filtered);

    this.addHistory(userId, materialId, 'Summary', `Generated ${type} summary`);
    this.addXP(userId, 10);

    return newSummary;
  },

  // AI EXPLANATIONS
  getExplanations(userId: string, materialId: string): AIExplanation[] {
    const explanations = readJSON<AIExplanation[]>(EXPLANATIONS_FILE, []);
    return explanations.filter(e => e.userId === userId && e.materialId === materialId);
  },

  createExplanation(userId: string, materialId: string, difficulty: ExplanationDifficulty, content: string): AIExplanation {
    const explanations = readJSON<AIExplanation[]>(EXPLANATIONS_FILE, []);
    const id = 'exp_' + Math.random().toString(36).substr(2, 9);

    const filtered = explanations.filter(e => !(e.userId === userId && e.materialId === materialId && e.difficulty === difficulty));

    const newExplanation: AIExplanation = {
      id,
      userId,
      materialId,
      difficulty,
      content,
      createdAt: new Date().toISOString()
    };

    filtered.push(newExplanation);
    writeJSON(EXPLANATIONS_FILE, filtered);

    this.addHistory(userId, materialId, 'Explanation', `Generated explanations in ${difficulty} mode`);
    this.addXP(userId, 10);

    return newExplanation;
  },

  // AI MIND MAPS
  getMindMaps(userId: string, materialId: string): AIMindMap[] {
    const mindmaps = readJSON<AIMindMap[]>(MINDMAPS_FILE, []);
    return mindmaps.filter(m => m.userId === userId && m.materialId === materialId);
  },

  createMindMap(userId: string, materialId: string, jsonData: { root: MindMapNode }): AIMindMap {
    const mindmaps = readJSON<AIMindMap[]>(MINDMAPS_FILE, []);
    const id = 'mm_' + Math.random().toString(36).substr(2, 9);

    const filtered = mindmaps.filter(m => !(m.userId === userId && m.materialId === materialId));

    const newMindMap: AIMindMap = {
      id,
      userId,
      materialId,
      jsonData,
      createdAt: new Date().toISOString()
    };

    filtered.push(newMindMap);
    writeJSON(MINDMAPS_FILE, filtered);

    this.addHistory(userId, materialId, 'MindMap', `Created interactive mind-map blueprint`);
    this.addXP(userId, 15);

    return newMindMap;
  },

  // AI FLASHCARDS & SRS ENTRIES
  getFlashcards(userId: string, materialId: string): Flashcard[] {
    const flashcards = readJSON<Flashcard[]>(FLASHCARDS_FILE, []);
    return flashcards.filter(f => f.userId === userId && f.materialId === materialId);
  },

  getAllFlashcardsDue(userId: string): Flashcard[] {
    const flashcards = readJSON<Flashcard[]>(FLASHCARDS_FILE, []);
    const todayStr = new Date().toISOString().substring(0, 10);
    return flashcards.filter(f => f.userId === userId && f.nextReviewDate <= todayStr);
  },

  getFlashcardStats(userId: string) {
    const flashcards = readJSON<Flashcard[]>(FLASHCARDS_FILE, []);
    const userFC = flashcards.filter(f => f.userId === userId);
    const sumScore = userFC.reduce((sum, f) => sum + (f.memoryScore || 80), 0);
    const count = userFC.length;
    return {
      totalCards: count,
      averageRetention: count > 0 ? Math.round(sumScore / count) : 85,
      dueToday: this.getAllFlashcardsDue(userId).length
    };
  },

  createFlashcards(userId: string, materialId: string, cards: Omit<Flashcard, 'id' | 'userId' | 'materialId' | 'isFavorite' | 'reviewCount' | 'memoryScore' | 'easeFactor' | 'intervalDays' | 'nextReviewDate' | 'createdAt'>[]): Flashcard[] {
    const flashcards = readJSON<Flashcard[]>(FLASHCARDS_FILE, []);
    
    // Avoid double cards for same content
    const filtered = flashcards.filter(f => !(f.userId === userId && f.materialId === materialId));
    
    const newCards: Flashcard[] = cards.map(c => ({
      ...c,
      id: 'fc_' + Math.random().toString(36).substr(2, 9),
      userId,
      materialId,
      isFavorite: false,
      reviewCount: 0,
      memoryScore: 100, // Starts fresh and full memory strength
      easeFactor: 2.5,
      intervalDays: 1, // Next review in 1 day
      nextReviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().substring(0, 10), // tomorrow
      createdAt: new Date().toISOString()
    }));

    writeJSON(FLASHCARDS_FILE, [...filtered, ...newCards]);

    this.addHistory(userId, materialId, 'Flashcard', `Sourced ${newCards.length} srs learning flashcards`);
    this.addXP(userId, 20);

    return newCards;
  },

  updateFlashcardSRS(id: string, memoryScore: number, difficulty: FlashcardDifficulty): Flashcard {
    const flashcards = readJSON<Flashcard[]>(FLASHCARDS_FILE, []);
    const index = flashcards.findIndex(f => f.id === id);
    if (index === -1) throw new Error('Flashcard not found');

    const fc = flashcards[index];
    const newReviewCount = fc.reviewCount + 1;
    
    // Spaced repetition scheduler based on difficulty feedback (intervals: 1, 3, 7, 14, 30, 60, 90)
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
      // Hard pulls it back under review
      nextIntervalDays = 1;
    }

    const nextReviewDate = new Date(Date.now() + nextIntervalDays * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);

    flashcards[index] = {
      ...fc,
      reviewCount: newReviewCount,
      memoryScore,
      intervalDays: nextIntervalDays,
      nextReviewDate
    };

    writeJSON(FLASHCARDS_FILE, flashcards);
    
    // Give review rewards in active learning
    this.addXP(fc.userId, 5);

    return flashcards[index];
  },

  toggleFlashcardFavorite(id: string): Flashcard {
    const flashcards = readJSON<Flashcard[]>(FLASHCARDS_FILE, []);
    const index = flashcards.findIndex(f => f.id === id);
    if (index === -1) throw new Error('Flashcard not found');

    flashcards[index].isFavorite = !flashcards[index].isFavorite;
    writeJSON(FLASHCARDS_FILE, flashcards);
    return flashcards[index];
  },

  // PRACTICE QUIZZES & RESULTS
  getQuizForMaterial(userId: string, materialId: string): Quiz | null {
    const quizzes = readJSON<Quiz[]>(QUIZZES_FILE, []);
    return quizzes.find(q => q.userId === userId && q.materialId === materialId) || null;
  },

  createQuiz(userId: string, materialId: string, title: string, questions: QuizQuestion[]): Quiz {
    const quizzes = readJSON<Quiz[]>(QUIZZES_FILE, []);
    // Prevent duplicated assessments
    const filtered = quizzes.filter(q => !(q.userId === userId && q.materialId === materialId));
    
    const id = 'qz_' + Math.random().toString(36).substr(2, 9);
    const newQuiz: Quiz = {
      id,
      userId,
      materialId,
      title,
      questions,
      createdAt: new Date().toISOString()
    };

    filtered.push(newQuiz);
    writeJSON(QUIZZES_FILE, filtered);

    return newQuiz;
  },

  getQuizResults(userId: string): QuizResult[] {
    const results = readJSON<QuizResult[]>(QUIZ_RESULTS_FILE, []);
    return results.filter(r => r.userId === userId);
  },

  saveQuizResult(userId: string, quizId: string, score: number, totalQuestions: number, correctAnswersCount: number, wrongAnswersReview: any[]): QuizResult {
    const results = readJSON<QuizResult[]>(QUIZ_RESULTS_FILE, []);
    const id = 'qres_' + Math.random().toString(36).substr(2, 9);
    
    const newResult: QuizResult = {
      id,
      userId,
      quizId,
      score,
      totalQuestions,
      correctAnswersCount,
      wrongAnswersReview,
      completedAt: new Date().toISOString()
    };

    results.push(newResult);
    writeJSON(QUIZ_RESULTS_FILE, results);

    // Track history
    const quizRecord = readJSON<Quiz[]>(QUIZZES_FILE, []).find(q => q.id === quizId);
    const materialId = quizRecord ? quizRecord.materialId : '';
    const quizTitle = quizRecord ? quizRecord.title : 'Practice Quiz';
    
    this.addHistory(userId, materialId, 'Quiz', `Completed Quiz "${quizTitle}" with score ${score}%`, { score });

    // Grant completion XP
    this.addXP(userId, 30);

    // If score is 100%, unlock Quiz Master Achievement!
    if (score === 100) {
      this.addXP(userId, 50); // Additional award XP
    }

    return newResult;
  },

  // AI TUTOR CHATS
  getTutorChats(userId: string, materialId: string): TutorChat {
    const chats = readJSON<TutorChat[]>(CHATS_FILE, []);
    let record = chats.find(c => c.userId === userId && c.materialId === materialId);
    if (!record) {
      record = {
        id: 'tc_' + Math.random().toString(36).substr(2, 9),
        userId,
        materialId,
        conversation: [
          {
            id: 'init_msg',
            sender: 'tutor',
            text: 'Hello! I am your AI Socratic Study Partner. Ask me any hard-to-understand questions, prompt me to generate review examples, or ask me to explain parts of your uploaded study material!',
            timestamp: new Date().toISOString()
          }
        ],
        createdAt: new Date().toISOString()
      };
      chats.push(record);
      writeJSON(CHATS_FILE, chats);
    }
    return record;
  },

  addTutorChatMessage(userId: string, materialId: string, sender: 'user' | 'tutor', text: string): TutorChat {
    const chats = readJSON<TutorChat[]>(CHATS_FILE, []);
    const index = chats.findIndex(c => c.userId === userId && c.materialId === materialId);
    
    let chatRecord: TutorChat;
    if (index === -1) {
      chatRecord = {
        id: 'tc_' + Math.random().toString(36).substr(2, 9),
        userId,
        materialId,
        conversation: [],
        createdAt: new Date().toISOString()
      };
    } else {
      chatRecord = chats[index];
    }

    const newMessage: any = {
      id: 'msg_' + Math.random().toString(36).substr(2, 9),
      sender,
      text,
      timestamp: new Date().toISOString()
    };

    chatRecord.conversation.push(newMessage);

    if (index === -1) {
      chats.push(chatRecord);
    } else {
      chats[index] = chatRecord;
    }

    writeJSON(CHATS_FILE, chats);

    // Track tutor interaction in activities on first prompt
    if (sender === 'user' && chatRecord.conversation.filter(m => m.sender === 'user').length === 1) {
      this.addHistory(userId, materialId, 'TutorChat', 'Consulted with AI tutor');
      this.addXP(userId, 10);
    }

    return chatRecord;
  },

  // ADMIN ANALYTICS & STATS
  getSystemAnalytics() {
    const users = readJSON<{ [email: string]: any }>(USERS_FILE, {});
    const materials = readJSON<LearningMaterial[]>(MATERIALS_FILE, []);
    const histories = readJSON<LearningHistory[]>(HISTORY_FILE, []);
    const results = readJSON<QuizResult[]>(QUIZ_RESULTS_FILE, []);

    const userProfiles = Object.values(users);
    const totalXP = userProfiles.reduce((sum, u) => sum + (u.xp || 0), 0);

    return {
      totalUsers: userProfiles.length,
      totalMaterials: materials.length,
      totalInteractions: histories.length,
      totalQuizzesRun: results.length,
      totalLevelSum: userProfiles.reduce((sum, u) => sum + (u.level || 1), 0),
      averageXP: userProfiles.length > 0 ? Math.round(totalXP / userProfiles.length) : 0,
      materialsByType: {
        pdf: materials.filter(m => m.type === 'pdf').length,
        docx: materials.filter(m => m.type === 'docx').length,
        pptx: materials.filter(m => m.type === 'pptx').length,
        notes: materials.filter(m => m.type === 'markdown' || m.type === 'note' || m.type === 'txt').length,
        links: materials.filter(m => m.type === 'link').length,
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
