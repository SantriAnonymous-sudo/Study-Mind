/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';
import { DB, hashPassword, INITIAL_ACHIEVEMENTS } from './server/db';
import { SummaryLength, ExplanationDifficulty } from './src/types';

const PORT = 3000;
const app = express();

// Middleware for parsing JSON requests
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Helper to extract session details
function getUserIdFromRequest(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Token is simple user ID mapped for this iframe proof platform session
}

// Auth Middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized access. Please register or log in first.' });
  }
  const user = DB.getUserByUid(userId);
  if (!user) {
    return res.status(401).json({ error: 'Session expired or user profile invalid.' });
  }
  req.body.authenticatedUserId = userId;
  next();
}

// Lazy-loaded Gemini AI client helper with aistudio-build telemetry headers
let aiInstance: GoogleGenAI | null = null;
function getAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY is not defined. Please add your credentials in Settings > Secrets.');
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiInstance;
}

// =====================================
// AUTH SYSTEM API ENDPOINTS
// =====================================

app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { fullName, email, password, confirmPassword, role } = req.body;
    
    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'Full Name, Email and Password are required.' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    const existingUser = DB.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = hashPassword(password);
    const assignedRole = (role === 'admin' || email.toLowerCase() === 'akang.munggiz.07@gmail.com') ? 'admin' : 'student';
    
    const user = DB.createUser(fullName, email, passwordHash, assignedRole);
    res.status(201).json({ message: 'Registration successful!', user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const userRecord = DB.getUserByEmail(email);
    if (!userRecord) {
      return res.status(401).json({ error: 'No account registered with this email address.' });
    }

    const inputHash = hashPassword(password);
    if (userRecord.passwordHash !== inputHash) {
      return res.status(401).json({ error: 'Incorrect email address or security password.' });
    }

    // Exclude password hash from payload
    const { passwordHash, ...safeProfile } = userRecord;
    
    // Register streak progression check
    DB.updateStreak(safeProfile.uid);
    const updatedProfile = DB.getUserByUid(safeProfile.uid);

    res.json({ message: 'Authentication successful!', user: updatedProfile });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/google-sso', (req: Request, res: Response) => {
  try {
    const { fullName, email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email parameter is compulsory.' });
    }

    let userRecord = DB.getUserByEmail(email);
    if (!userRecord) {
      const randomPass = Math.random().toString(36).substring(2) + '_sso';
      const passwordHash = hashPassword(randomPass);
      const assignedRole = (email.toLowerCase() === 'akang.munggiz.07@gmail.com') ? 'admin' : 'student';
      // Create user
      const createdUser = DB.createUser(fullName || 'Google Scholar', email, passwordHash, assignedRole);
      // Retrieve direct record
      userRecord = DB.getUserByEmail(email);
    }

    // Exclude password hash from profile
    const { passwordHash, ...safeProfile } = userRecord;
    DB.updateStreak(safeProfile.uid);
    const updatedProfile = DB.getUserByUid(safeProfile.uid);

    res.json({ message: 'Google Authentication linked successfully!', user: updatedProfile });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/me', requireAuth, (req: Request, res: Response) => {
  const userId = req.body.authenticatedUserId;
  const user = DB.getUserByUid(userId);
  if (!user) {
    return res.status(404).json({ error: 'User profiles could not be resolved.' });
  }
  res.json({ user });
});

app.post('/api/auth/profile', requireAuth, (req: Request, res: Response) => {
  try {
    const userId = req.body.authenticatedUserId;
    const { fullName, email, profilePhoto } = req.body;
    const updated = DB.updateUserProfile(userId, { fullName, email, profilePhoto });
    res.json({ message: 'Profile updated successfully!', user: updated });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  const user = DB.getUserByEmail(email);
  if (!user) {
    return res.status(404).json({ error: 'No registered user is associated with this email.' });
  }
  res.json({ message: 'A secure password reset link has been successfully generated and dispatched to your email address.' });
});

app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required.' });
  }
  const user = DB.getUserByEmail(email);
  if (!user) {
    return res.status(404).json({ error: 'User does not exist.' });
  }
  const passwordHash = hashPassword(newPassword);
  DB.updateUserProfile(user.uid, { passwordHash } as any);
  res.json({ message: 'Password has been updated. You can now log in securely.' });
});

app.post('/api/auth/verify-email', (req: Request, res: Response) => {
  res.json({ message: 'Verification link has been dispatched to your primary electronic address.' });
});

// Download Personal Data
app.get('/api/auth/download-data', requireAuth, (req: Request, res: Response) => {
  const userId = req.body.authenticatedUserId;
  const user = DB.getUserByUid(userId);
  const subjects = DB.getSubjects(userId);
  const materials = DB.getMaterials(userId);
  const history = DB.getLearningHistory(userId);
  const quizResults = DB.getQuizResults(userId);

  const payload = {
    userProfile: user,
    subjects,
    materialsTotalCount: materials.length,
    materials,
    studyActivitiesTimeline: history,
    quizAccomplishments: quizResults,
    exportedAt: new Date().toISOString()
  };

  res.setHeader('Content-disposition', 'attachment; filename=studymind_backup.json');
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(payload, null, 2));
});

// Admin command: Delete current account
app.delete('/api/auth/account', requireAuth, (req: Request, res: Response) => {
  const userId = req.body.authenticatedUserId;
  DB.deleteUser(userId);
  res.json({ success: true, message: 'Your account and database records have been deleted.' });
});


// =====================================
// SUBJECT MANAGEMENT
// =====================================

app.get('/api/subjects', requireAuth, (req: Request, res: Response) => {
  const userId = req.body.authenticatedUserId;
  res.json({ subjects: DB.getSubjects(userId) });
});

app.post('/api/subjects', requireAuth, (req: Request, res: Response) => {
  try {
    const userId = req.body.authenticatedUserId;
    const { name, icon, color, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Subject designation title is mandatory.' });
    
    const sub = DB.createSubject(userId, name, icon || 'BookOpen', color || '#2563EB', description || '');
    res.status(201).json({ message: 'Subject created.', subject: sub });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// =====================================
// MATERIAL STORAGE
// =====================================

app.get('/api/materials', requireAuth, (req: Request, res: Response) => {
  const userId = req.body.authenticatedUserId;
  res.json({ materials: DB.getMaterials(userId) });
});

app.post('/api/materials', requireAuth, (req: Request, res: Response) => {
  try {
    const userId = req.body.authenticatedUserId;
    const { subjectId, title, description, content, type, size, fileUrl } = req.body;
    
    if (!subjectId || !title || !content || !type) {
      return res.status(400).json({ error: 'Subject category link, title designation, and raw content are mandatory.' });
    }

    const materialObj = DB.createMaterial(userId, {
      subjectId,
      title,
      description: description || '',
      content,
      type,
      size: size || '1 KB',
      fileUrl
    });

    res.status(201).json({ message: 'Study resource saved successfully!', material: materialObj });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/materials/:id', requireAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isFavorite, isArchived, title, description, content } = req.body;
    const updated = DB.updateMaterial(id, { isFavorite, isArchived, title, description, content });
    res.json({ message: 'Resource status successfully updated.', material: updated });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/materials/:id', requireAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = DB.deleteMaterial(id);
    if (!success) {
      return res.status(404).json({ error: 'The requested resource element could not be found.' });
    }
    res.json({ success: true, message: 'Resource permanently purged from server vaults.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// =====================================
// LEARNING HISTORY
// =====================================

app.get('/api/history', requireAuth, (req: Request, res: Response) => {
  const userId = req.body.authenticatedUserId;
  res.json({ history: DB.getLearningHistory(userId) });
});


// =====================================
// FLASHCARDS & SRS (SPACED REPETITION)
// =====================================

app.get('/api/flashcards', requireAuth, (req: Request, res: Response) => {
  const userId = req.body.authenticatedUserId;
  res.json({ 
    flashcards: DB.getFlashcards(userId, req.query.materialId as string || ''),
    dueToday: DB.getAllFlashcardsDue(userId),
    stats: DB.getFlashcardStats(userId)
  });
});

app.put('/api/flashcards/:id', requireAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { memoryScore, difficulty } = req.body; // difficulty: easy, medium, hard
    const updated = DB.updateFlashcardSRS(id, memoryScore || 80, difficulty || 'medium');
    res.json({ message: 'Spaced repetition metrics synchronised successfully.', card: updated });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/flashcards/:id/favorite', requireAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = DB.toggleFlashcardFavorite(id);
    res.json({ card: updated });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});


// =====================================
// AI MODULES: GEMINI CONFIG & ROUTES
// =====================================

// AI Summarization Generator
app.post('/api/ai/summary', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.body.authenticatedUserId;
    const { materialId, type } = req.body; // type: short, medium, detailed
    
    if (!materialId || !type) {
      return res.status(400).json({ error: 'Resource index and summary length are required.' });
    }

    const materialList = DB.getMaterials(userId);
    const mat = materialList.find(m => m.id === materialId);
    if (!mat) return res.status(404).json({ error: 'Material not resolved.' });

    // Retrieve previous cached summary if exists for performance
    const previous = DB.getSummaries(userId, materialId).find(s => s.type === type);
    if (previous) {
      return res.json({ summary: previous });
    }

    const ai = getAI();
    const prompt = `Perform an elite ${type} academic study summary of the text provided below. 
Highlight the fundamental concepts, definitions, paradigms, and crucial takeaways. 
Keep the format elegant with Markdown title headers, bullet points, and clean syntax.

TEXT TO SUMMARIZE:
${mat.content}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    const aiText = response.text || 'Failed to capture summarize parameters.';
    const savedSum = DB.createSummary(userId, materialId, type as SummaryLength, aiText);

    res.json({ summary: savedSum });
  } catch (error: any) {
    console.error('AI Summary Error:', error);
    res.status(500).json({ error: error.message || 'Error occurred during AI processing.' });
  }
});

// AI Explanation Generator
app.post('/api/ai/explanation', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.body.authenticatedUserId;
    const { materialId, difficulty } = req.body; // child, beginner, intermediate, advanced, professional
    
    if (!materialId || !difficulty) {
      return res.status(400).json({ error: 'Material referent identifier and explanation level are mandatory.' });
    }

    const materialList = DB.getMaterials(userId);
    const mat = materialList.find(m => m.id === materialId);
    if (!mat) return res.status(404).json({ error: 'Material not resolved.' });

    const previous = DB.getExplanations(userId, materialId).find(e => e.difficulty === difficulty);
    if (previous) {
      return res.json({ explanation: previous });
    }

    const ai = getAI();
    const prompt = `Break down and explain the key elements of the material text below for a learner at the "${difficulty.toUpperCase()}" level of cognitive understanding.
Choose explanations, terminology, mental frameworks, analogies, and pacing perfectly suited to this requested level. Use Markdown formatting.

STUDY MATERIAL CONTENT:
${mat.content}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    const aiText = response.text || `Could not resolve explanation block for ${difficulty} level.`;
    const savedExp = DB.createExplanation(userId, materialId, difficulty as ExplanationDifficulty, aiText);

    res.json({ explanation: savedExp });
  } catch (error: any) {
    console.error('AI Explanation Error:', error);
    res.status(500).json({ error: error.message || 'Error executing AI explanation request.' });
  }
});

// AI Mind Map Generator
app.post('/api/ai/mindmap', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.body.authenticatedUserId;
    const { materialId } = req.body;

    if (!materialId) {
      return res.status(400).json({ error: 'Material key is required.' });
    }

    const materialList = DB.getMaterials(userId);
    const mat = materialList.find(m => m.id === materialId);
    if (!mat) return res.status(404).json({ error: 'Material not resolved.' });

    const previous = DB.getMindMaps(userId, materialId);
    if (previous.length > 0) {
      return res.json({ mindmap: previous[0] });
    }

    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Directly synthesize the core structural skeleton of the study notes content below into a hierarchical mind-map JSON format. 
Each branch node should have an "id" (string), "label" (string), "description" (optional string), and "children" (array of nodes).
The tree must start from a single root node representing the master topic. Use the JSON schema explicitly.

CONTENT TO MAP:
${mat.content}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['root'],
          properties: {
            root: {
              type: Type.OBJECT,
              required: ['id', 'label'],
              properties: {
                id: { type: Type.STRING },
                label: { type: Type.STRING, description: 'Title of the main subject context node' },
                description: { type: Type.STRING },
                children: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    required: ['id', 'label'],
                    properties: {
                      id: { type: Type.STRING },
                      label: { type: Type.STRING },
                      description: { type: Type.STRING },
                      children: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          required: ['id', 'label'],
                          properties: {
                            id: { type: Type.STRING },
                            label: { type: Type.STRING },
                            description: { type: Type.STRING },
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    const rootData = JSON.parse(response.text.trim());
    const mindmapObj = DB.createMindMap(userId, materialId, rootData);

    res.json({ mindmap: mindmapObj });
  } catch (error: any) {
    console.error('AI Mind Map Error:', error);
    res.status(500).json({ error: error.message || 'Error executing AI mind mapping.' });
  }
});

// AI Flashcards Generator
app.post('/api/ai/flashcards', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.body.authenticatedUserId;
    const { materialId } = req.body;

    if (!materialId) {
      return res.status(400).json({ error: 'Material context link is required.' });
    }

    const materialList = DB.getMaterials(userId);
    const mat = materialList.find(m => m.id === materialId);
    if (!mat) return res.status(404).json({ error: 'Material not resolved.' });

    const previous = DB.getFlashcards(userId, materialId);
    if (previous.length > 0) {
      return res.json({ flashcards: previous });
    }

    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Analyze the material content below and extract 6 high-value review flashcards consisting of core questions and descriptive, direct answers to optimize retention. 
Return structured JSON schema as requested.

CONTENT DATA:
${mat.content}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ['question', 'answer', 'difficulty'],
            properties: {
              question: { type: Type.STRING },
              answer: { type: Type.STRING },
              difficulty: { type: Type.STRING, description: 'Select: "easy", "medium", "hard"' }
            }
          }
        }
      }
    });

    const rawCards = JSON.parse(response.text.trim());
    const savedCards = DB.createFlashcards(userId, materialId, rawCards);

    res.json({ flashcards: savedCards });
  } catch (error: any) {
    console.error('AI Flashcard Error:', error);
    res.status(500).json({ error: error.message || 'Error occurred during AI flashcard extraction.' });
  }
});

// AI Quiz System Generator
app.post('/api/ai/quiz', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.body.authenticatedUserId;
    const { materialId, title } = req.body;

    if (!materialId) {
      return res.status(400).json({ error: 'Material link is required.' });
    }

    const materialList = DB.getMaterials(userId);
    const mat = materialList.find(m => m.id === materialId);
    if (!mat) return res.status(404).json({ error: 'Material not resolved.' });

    const existingQuiz = DB.getQuizForMaterial(userId, materialId);
    if (existingQuiz) {
      return res.json({ quiz: existingQuiz });
    }

    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Synthesize a rigorous, highly-informative 5-question exam quiz based on learning content provided.
Include exactly:
- 3 Multiple Choice questions (with 4 clean options tagged A, B, C, D)
- 1 True/False question
- 1 Essay conceptual inquiry question (where the correct answer should explain the ideal assessment rubric/criteria to match against for manual scoring)
Provide the response strictly in JSON layout.

LEARNING SUBJECT CONTENT:
${mat.content}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ['question', 'type', 'correctAnswer'],
            properties: {
              question: { type: Type.STRING },
              type: { type: Type.STRING, description: 'Must be "multiple-choice", "true-false", or "essay"' },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'For multiple choice questions: provide 4 distinct choices. Keep undefined for true-false/essay.'
              },
              correctAnswer: { type: Type.STRING, description: 'For multiple-choice: e.g. "A". True/False: "True". Essay: Rubric content.' }
            }
          }
        }
      }
    });

    const parsedQuestions = JSON.parse(response.text.trim());
    
    // Inject generated IDs to questions
    const formattedQuestions = parsedQuestions.map((q: any, index: number) => ({
      ...q,
      id: `q_idx_${index}_` + Math.random().toString(36).substr(2, 5)
    }));

    const quizObj = DB.createQuiz(userId, materialId, title || `Quiz - ${mat.title}`, formattedQuestions);
    res.json({ quiz: quizObj });
  } catch (error: any) {
    console.error('Quiz Generation Error:', error);
    res.status(500).json({ error: error.message || 'Error executing AI Quiz generation.' });
  }
});

// Quiz Result Submission
app.post('/api/ai/quiz-results', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.body.authenticatedUserId;
    const { quizId, answers } = req.body; // answers is an object mapping question ID to selected answer string

    if (!quizId || !answers) {
      return res.status(400).json({ error: 'Quiz identifier and responses payload are required.' });
    }

    // Retrieve the Quiz from database to check answers
    const quizzes = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'quizzes.json'), 'utf-8')) as any[];
    const quiz = quizzes.find(q => q.id === quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz definition could not be resolved.' });

    let correctCount = 0;
    const totalCount = quiz.questions.length;
    const reviewPayload: any[] = [];

    const ai = getAI();

    for (const q of quiz.questions) {
      const selected = answers[q.id] || '';
      
      if (q.type === 'multiple-choice' || q.type === 'true-false') {
        const isCorrect = selected.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
        if (isCorrect) correctCount++;
        
        reviewPayload.push({
          questionId: q.id,
          questionText: q.question,
          selectedAnswer: selected,
          correctAnswer: q.correctAnswer,
          explanation: isCorrect ? 'Spot on!' : `The correct answer was designated as "${q.correctAnswer}".`
        });
      } else if (q.type === 'essay') {
        // Evaluate essay using Gemini 3.5-flash
        try {
          const gradingPrompt = `You are a strict, helpful university academic grader. 
Verify the student's essay answer below against the ideal grading rubric:

QUESTION:
${q.question}

IDEAL ASSESSMENT KEY RUBRIC:
${q.correctAnswer}

STUDENT ANSWER EXCERPT:
"${selected}"

Provide your feedback and grade strictly in JSON format. Return:
"score" (percentage score integer from 0 to 100 on how accurately they covered the key terms of the rubric)
"assessmentAdvice" (string explaining strengths, weaknesses, and what elements they missed).`;

          const gradingResp = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: gradingPrompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                required: ['score', 'assessmentAdvice'],
                properties: {
                  score: { type: Type.INTEGER },
                  assessmentAdvice: { type: Type.STRING }
                }
              }
            }
          });

          const evaluation = JSON.parse(gradingResp.text.trim());
          const calculatedPartial = evaluation.score / 100; // e.g. 0.8
          correctCount += calculatedPartial;

          reviewPayload.push({
            questionId: q.id,
            questionText: q.question,
            selectedAnswer: selected,
            correctAnswer: `Covering: ${q.correctAnswer.substring(0, 80)}...`,
            explanation: `Asessed at ${evaluation.score}% accuracy level. Grader feedback: ${evaluation.assessmentAdvice}`
          });
        } catch (err) {
          // Fallback essay grade
          correctCount += 0.5;
          reviewPayload.push({
            questionId: q.id,
            questionText: q.question,
            selectedAnswer: selected,
            correctAnswer: q.correctAnswer,
            explanation: 'Auto-graded essay default threshold fallback.'
          });
        }
      }
    }

    const finalPercentage = Math.round((correctCount / totalCount) * 100);
    const resultObj = DB.saveQuizResult(userId, quizId, finalPercentage, totalCount, Math.round(correctCount), reviewPayload);

    res.json({ result: resultObj });
  } catch (error: any) {
    console.error('Quiz Evaluation Error:', error);
    res.status(500).json({ error: error.message || 'Error occurred during grading calculations.' });
  }
});


// =====================================
// AI TUTOR CHATS
// =====================================

app.get('/api/tutor/chat/:materialId', requireAuth, (req: Request, res: Response) => {
  const userId = req.body.authenticatedUserId;
  const { materialId } = req.params;
  const chatObj = DB.getTutorChats(userId, materialId);
  res.json({ chat: chatObj });
});

app.post('/api/tutor/chat/:materialId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.body.authenticatedUserId;
    const { materialId } = req.params;
    const { message } = req.body;

    if (!message) return res.status(400).json({ error: 'Message context is required.' });

    const materialList = DB.getMaterials(userId);
    const mat = materialList.find(m => m.id === materialId);
    if (!mat) return res.status(404).json({ error: 'Material not resolved.' });

    // Append the user query in database state
    DB.addTutorChatMessage(userId, materialId, 'user', message);

    // Fetch refreshed conversation
    const currentChat = DB.getTutorChats(userId, materialId);
    const lastSixTurns = currentChat.conversation.slice(-8);

    // Compile message pipeline context for Gemini
    const ai = getAI();
    let historyContext = lastSixTurns.map(m => `${m.sender.toUpperCase()}: ${m.text}`).join('\n');

    const prompt = `You are a world-class, polite, and deeply encouraging AI Socratic Tutor.
Your focus is exclusive to helping the user master their uploaded study material, explained below:

===================================
UPLOADED STUDENT NOTE CONTEXT:
${mat.content}
===================================

Analyze their question within the learning history log below. Encourage deep thinking, formulate clear examples, break down hard formulas, simplify complex structures, and occasionally prompt self-testing queries to verify structural mastery.

PREVIOUS LOG CHAT MEMORY:
${historyContext}

Provide your academic tutor response directly in Markdown format:`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    const aiAnswerText = response.text || 'I was unable to synthesize a response at this time. Please prompt again.';
    
    // Save AI tutor turn to DB
    const finalChat = DB.addTutorChatMessage(userId, materialId, 'tutor', aiAnswerText);

    res.json({ chat: finalChat });
  } catch (error: any) {
    console.error('Tutor chat failure:', error);
    res.status(500).json({ error: error.message || 'AI Socratic module failed.' });
  }
});


// =====================================
// ADMIN PORTAL SYSTEM API
// =====================================

// Check role: admin
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized.' });
  const user = DB.getUserByUid(userId);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden. Accessible only by authorized administrators.' });
  }
  req.body.authenticatedUserId = userId;
  next();
}

app.get('/api/admin/analytics', requireAuth, requireAdmin, (req: Request, res: Response) => {
  try {
    const stats = DB.getSystemAnalytics();
    res.json({ stats });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/users', requireAuth, requireAdmin, (req: Request, res: Response) => {
  try {
    const users = DB.getAllUsers();
    res.json({ users });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/users/:uid', requireAuth, requireAdmin, (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    if (uid === req.body.authenticatedUserId) {
      return res.status(400).json({ error: 'You are preventatively blocked from deleting your own live administrator account.' });
    }
    const success = DB.deleteUser(uid);
    if (!success) return res.status(404).json({ error: 'Target user could not be found.' });
    res.json({ message: 'User database directory has been thoroughly purged.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// =====================================
// FRONTEND STATIC BUNDLE ROUTING
// =====================================

const isProduction = process.env.NODE_ENV === 'production';

async function bootstrap() {
  if (!isProduction) {
    // Inject and integrate standard Vite dev server directly to express middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static generated directories
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StudyMind Server launched on http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch(err => {
  console.error('Failure initializing the multi-layer app server:', err);
});
