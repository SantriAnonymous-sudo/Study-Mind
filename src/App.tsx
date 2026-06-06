/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  GraduationCap, 
  Layers, 
  FileText, 
  MessageSquare, 
  BrainCircuit, 
  Award, 
  Calendar, 
  Settings, 
  LogOut, 
  Plus, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Heart, 
  FolderPlus,
  Trash2, 
  BookOpen, 
  Paperclip, 
  Clock, 
  Zap, 
  User, 
  ChevronRight, 
  Check, 
  Users, 
  Database,
  Sliders,
  Copy,
  Download,
  AlertCircle,
  FileCode,
  Globe,
  Sun,
  Moon,
  ChevronLeft,
  RefreshCw,
  Send,
  Timer,
  X
} from 'lucide-react';

import WelcomePage from './WelcomePage';
import AuthModal from './AuthModal';
import MindMapCanvas from './MindMapCanvas';
import { 
  UserProfile, 
  Subject, 
  LearningMaterial, 
  LearningHistory, 
  Flashcard, 
  Quiz, 
  QuizResult, 
  ActivityType,
  MaterialType,
  INITIAL_ACHIEVEMENTS
} from './types';

export default function App() {
  // Navigation states
  const [activeTab, setActiveTab] = useState<'welcome' | 'dashboard' | 'subjects' | 'materials' | 'history' | 'profile' | 'settings' | 'admin'>('welcome');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  // Core Data States
  const [user, setUser] = useState<UserProfile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [history, setHistory] = useState<LearningHistory[]>([]);
  const [dueFlashcards, setDueFlashcards] = useState<Flashcard[]>([]);
  const [flashcardStats, setFlashcardStats] = useState<any>({ totalCards: 0, averageRetention: 85, dueToday: 0 });

  // Workspace active selector
  const [activeMaterial, setActiveMaterial] = useState<LearningMaterial | null>(null);
  const [workspaceTab, setWorkspaceTab] = useState<'summary' | 'explanation' | 'mindmap' | 'flashcards' | 'quiz' | 'tutor'>('summary');

  // Filters + Searches UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | MaterialType>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'favorite'>('recent');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  // Creation Modals UI indicators
  const [createSubjectOpen, setCreateSubjectOpen] = useState(false);
  const [createMaterialOpen, setCreateMaterialOpen] = useState(false);
  
  // Subject form inputs
  const [subName, setSubName] = useState('');
  const [subDesc, setSubDesc] = useState('');
  const [subIcon, setSubIcon] = useState('BookOpen');
  const [subColor, setSubColor] = useState('#2563EB');

  // Material form inputs
  const [matSubjectId, setMatSubjectId] = useState('');
  const [matTitle, setMatTitle] = useState('');
  const [matType, setMatType] = useState<MaterialType>('note');
  const [matDesc, setMatDesc] = useState('');
  const [matContent, setMatContent] = useState('');
  const [matLink, setMatLink] = useState('');

  // AI Workspace Interactive generation states
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryOutput, setSummaryOutput] = useState<string>('');
  const [summaryLength, setSummaryLength] = useState<'short' | 'medium' | 'detailed'>('short');

  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [explanationOutput, setExplanationOutput] = useState<string>('');
  const [explanationMode, setExplanationMode] = useState<'child' | 'beginner' | 'intermediate' | 'advanced' | 'professional'>('beginner');

  const [loadingMindmap, setLoadingMindmap] = useState(false);
  const [mindmapTopology, setMindmapTopology] = useState<any | null>(null);

  const [loadingFlashcards, setLoadingFlashcards] = useState(false);
  const [materialFlashcards, setMaterialFlashcards] = useState<Flashcard[]>([]);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<{ [qId: string]: string }>({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizResultScore, setQuizResultScore] = useState<any | null>(null);
  const [quizTimeLeft, setQuizTimeLeft] = useState(180); // 3 minutes test timer state
  const [quizActive, setQuizActive] = useState(false);
  const timerRef = useRef<any>(null);

  const [tutorInput, setTutorInput] = useState('');
  const [tutorLog, setTutorLog] = useState<any[]>([]);
  const [loadingTutor, setLoadingTutor] = useState(false);

  // Global Alerts system message bar
  const [infoAlert, setInfoAlert] = useState<string | null>(null);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);

  // Admin Dashboard views data
  const [adminUsersList, setAdminUsersList] = useState<any[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);

  // System Loading global spinner
  const [globalLoading, setGlobalLoading] = useState(false);

  // AI Brain customization fields
  const [profileName, setProfileName] = useState('');
  const [brainModel, setBrainModel] = useState('gemini-3.5-flash');
  const [brainPersona, setBrainPersona] = useState('Socratic Mentor');
  const [brainLanguage, setBrainLanguage] = useState('Bahasa Indonesia');
  const [brainCreativity, setBrainCreativity] = useState(1.0);
  const [brainCustomRules, setBrainCustomRules] = useState('');
  const [savingBrainSettings, setSavingBrainSettings] = useState(false);

  // Initialize theme and sessions on component launch
  useEffect(() => {
    const savedTheme = localStorage.getItem('studymind_theme') || 'dark';
    setTheme(savedTheme as any);
    document.documentElement.classList.toggle('light', savedTheme === 'light');

    const uid = localStorage.getItem('studymind_userId') || sessionStorage.getItem('studymind_userId');
    if (uid) {
      resolveUserSession(uid);
    }
  }, []);

  // Update form inputs when user updates
  useEffect(() => {
    if (user) {
      setProfileName(user.fullName || '');
      setBrainModel(user.brainModel || 'gemini-3.5-flash');
      setBrainPersona(user.brainPersona || 'Socratic Mentor');
      setBrainLanguage(user.brainLanguage || 'Bahasa Indonesia');
      setBrainCreativity(user.brainCreativity !== undefined ? user.brainCreativity : 1.0);
      setBrainCustomRules(user.brainCustomRules || '');
    }
  }, [user]);

  // Timer loop for practice quizzes
  useEffect(() => {
    if (quizActive && quizTimeLeft > 0 && !quizCompleted) {
      timerRef.current = setInterval(() => {
        setQuizTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            submitQuizAnswersManual();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [quizActive, quizCompleted]);

  // Auth fetch wrapping helper
  const authFetch = async (url: string, options: any = {}) => {
    const token = localStorage.getItem('studymind_userId') || sessionStorage.getItem('studymind_userId') || '';
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers
    };
    const resp = await fetch(url, { ...options, headers });
    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      throw new Error(errData.error || `Error status ${resp.status}`);
    }
    return resp.json();
  };

  const resolveUserSession = async (uid: string) => {
    try {
      setGlobalLoading(true);
      const data = await authFetch('/api/auth/me');
      setUser(data.user);
      setActiveTab('dashboard');
      syncUserSpecificData();
    } catch (e: any) {
      console.log('Session mapping failed. Prompt login.', e);
      clearCredentials();
    } finally {
      setGlobalLoading(false);
    }
  };

  const syncUserSpecificData = async () => {
    try {
      const [subData, matData, histData, flashData] = await Promise.all([
        authFetch('/api/subjects'),
        authFetch('/api/materials'),
        authFetch('/api/history'),
        authFetch('/api/flashcards')
      ]);

      setSubjects(subData.subjects || []);
      setMaterials(matData.materials || []);
      setHistory(histData.history || []);
      setDueFlashcards(flashData.dueToday || []);
      setFlashcardStats(flashData.stats || { totalCards: 0, averageRetention: 85, dueToday: 0 });
    } catch (err: any) {
      console.error('Data sync failure:', err);
    }
  };

  const clearCredentials = () => {
    localStorage.removeItem('studymind_userId');
    sessionStorage.removeItem('studymind_userId');
    setUser(null);
    setActiveTab('welcome');
    setActiveMaterial(null);
  };

  const handleLogout = () => {
    clearCredentials();
    triggerNotification('Logged out successfully from session.');
  };

  const triggerNotification = (msg: string) => {
    setInfoAlert(msg);
    setTimeout(() => setInfoAlert(null), 3500);
  };

  const triggerErrorNotification = (msg: string) => {
    setErrorAlert(msg);
    setTimeout(() => setErrorAlert(null), 4000);
  };

  const handleThemeToggle = () => {
    const target = theme === 'dark' ? 'light' : 'dark';
    setTheme(target);
    localStorage.setItem('studymind_theme', target);
    document.documentElement.classList.toggle('light', target === 'light');
  };

  // =====================================
  // SUBJECT CRUD OPERATIONS
  // =====================================
  const onSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!subName) return;
      const data = await authFetch('/api/subjects', {
        method: 'POST',
        body: JSON.stringify({ name: subName, description: subDesc, icon: subIcon, color: subColor })
      });
      setSubjects(prev => [...prev, data.subject]);
      setSubName('');
      setSubDesc('');
      setCreateSubjectOpen(false);
      triggerNotification('Subject channel created successfully.');
      syncUserSpecificData();
    } catch (err: any) {
      triggerErrorNotification(err.message || 'Subject generation error.');
    }
  };

  const deleteSubjectCascade = async (id: string) => {
    if (!confirm('Are you absolutely certain you desire to delete this subject catalog? All associated study resources with summaries, mind maps, quizzes, and chat sheets will also be purged.')) return;
    try {
      // Find and delete matching materials
      const subjectMaterials = materials.filter(m => m.subjectId === id);
      for (const m of subjectMaterials) {
        await authFetch(`/api/materials/${m.id}`, { method: 'DELETE' });
      }
      
      // Remove subject locally
      setSubjects(prev => prev.filter(s => s.id !== id));
      triggerNotification('Subject and matching materials deleted.');
      syncUserSpecificData();
    } catch (e: any) {
      triggerErrorNotification(e.message || 'Subject delete error.');
    }
  };


  // =====================================
  // MATERIAL RESOURCE CRUD OPERATIONS
  // =====================================
  const onMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!matSubjectId || !matTitle || (!matContent && !matLink)) {
        throw new Error('Subject link selection, title, and study notes/link input are mandatory.');
      }

      let payloadContent = matContent;
      if (matType === 'link' && matLink) {
        payloadContent = `Web link integration reference: ${matLink}. Context description: ${matDesc || 'Study materials links'}`;
      }

      const byteSizeStr = payloadContent.length > 1024 
        ? `${Math.round(payloadContent.length / 1024)} KB` 
        : `${payloadContent.length} B`;

      const data = await authFetch('/api/materials', {
        method: 'POST',
        body: JSON.stringify({
          subjectId: matSubjectId,
          title: matTitle,
          description: matDesc,
          type: matType,
          content: payloadContent,
          size: byteSizeStr,
          fileUrl: matLink || undefined
        })
      });

      setMaterials(prev => [...prev, data.material]);
      setCreateMaterialOpen(false);
      // Reset inputs
      setMatTitle('');
      setMatDesc('');
      setMatContent('');
      setMatLink('');
      
      triggerNotification(`Study resource "${matTitle}" added systematically. Gratitude for academic uploads! +10 XP`);
      
      // Select the newly created material instantly to unlock AI workspace panel!
      selectWorkspaceResource(data.material);
      syncUserSpecificData();
    } catch (err: any) {
      triggerErrorNotification(err.message || 'Storage error.');
    }
  };

  const toggleMaterialFavorite = async (mat: LearningMaterial) => {
    try {
      const data = await authFetch(`/api/materials/${mat.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isFavorite: !mat.isFavorite })
      });
      setMaterials(prev => prev.map(m => m.id === mat.id ? data.material : m));
      triggerNotification(data.material.isFavorite ? 'Resource marked as study favorite!' : 'Removed from favorite roster.');
    } catch (e: any) {
      triggerErrorNotification(e.message || 'Operation failed.');
    }
  };

  const toggleMaterialArchive = async (mat: LearningMaterial) => {
    try {
      const data = await authFetch(`/api/materials/${mat.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isArchived: !mat.isArchived })
      });
      setMaterials(prev => prev.map(m => m.id === mat.id ? data.material : m));
      triggerNotification(data.material.isArchived ? 'Material moved to archived records.' : 'Material restored to main workdesk.');
    } catch (e: any) {
      triggerErrorNotification(e.message || 'Operation failed.');
    }
  };

  const deleteMaterialConfirm = async (id: string, name: string) => {
    if (!confirm(`Are you certain you want to purge "${name}"? Database associations will be deleted.`)) return;
    try {
      await authFetch(`/api/materials/${id}`, { method: 'DELETE' });
      setMaterials(prev => prev.filter(m => m.id !== id));
      if (activeMaterial?.id === id) setActiveMaterial(null);
      triggerNotification('Study resource permanently purged.');
      syncUserSpecificData();
    } catch (e: any) {
      triggerErrorNotification(e.message || 'Delete operation crash.');
    }
  };


  // =====================================
  // AI INTERACTIVE WORKSPACE STATE LOADS
  // =====================================
  const selectWorkspaceResource = (mat: LearningMaterial) => {
    setActiveMaterial(mat);
    // Reset individual AI tab outputs to prompt recalculations
    setSummaryOutput('');
    setExplanationOutput('');
    setMindmapTopology(null);
    setMaterialFlashcards([]);
    setActiveQuiz(null);
    setQuizCompleted(false);
    setQuizResultScore(null);
    setQuizAnswers({});
    setQuizActive(false);
    
    // Sync active chat dialogue logs
    loadTutorChatTimeline(mat.id);
  };

  // 1. AI Summary
  const executeSummaryGeneration = async () => {
    if (!activeMaterial) return;
    setLoadingSummary(true);
    setSummaryOutput('');
    try {
      const data = await authFetch('/api/ai/summary', {
        method: 'POST',
        body: JSON.stringify({ materialId: activeMaterial.id, type: summaryLength })
      });
      setSummaryOutput(data.summary.content);
      triggerNotification(`Summary computed, details indexed securely! +10 XP`);
      syncUserSpecificData();
    } catch (e: any) {
      triggerErrorNotification(e.message || 'AI Summarization error.');
    } finally {
      setLoadingSummary(false);
    }
  };

  // 2. AI Explanation Level
  const executeExplanationGeneration = async () => {
    if (!activeMaterial) return;
    setLoadingExplanation(true);
    setExplanationOutput('');
    try {
      const data = await authFetch('/api/ai/explanation', {
        method: 'POST',
        body: JSON.stringify({ materialId: activeMaterial.id, difficulty: explanationMode })
      });
      setExplanationOutput(data.explanation.content);
      triggerNotification(`Socrates explanation rendered at ${explanationMode.toUpperCase()} level! +10 XP`);
      syncUserSpecificData();
    } catch (e: any) {
      triggerErrorNotification(e.message || 'Explanation processing error.');
    } finally {
      setLoadingExplanation(false);
    }
  };

  // 3. AI Mind Map
  const executeMindmapGeneration = async () => {
    if (!activeMaterial) return;
    setLoadingMindmap(true);
    setMindmapTopology(null);
    try {
      const data = await authFetch('/api/ai/mindmap', {
        method: 'POST',
        body: JSON.stringify({ materialId: activeMaterial.id })
      });
      setMindmapTopology(data.mindmap.jsonData.root);
      triggerNotification('Interactive Mind Map coordinate skeleton synthesized. +15 XP');
      syncUserSpecificData();
    } catch (e: any) {
      triggerErrorNotification(e.message || 'AI Mind Map error.');
    } finally {
      setLoadingMindmap(false);
    }
  };

  // 4. AI Flashcard deck
  const executeFlashcardGeneration = async () => {
    if (!activeMaterial) return;
    setLoadingFlashcards(true);
    try {
      const data = await authFetch('/api/ai/flashcards', {
        method: 'POST',
        body: JSON.stringify({ materialId: activeMaterial.id })
      });
      setMaterialFlashcards(data.flashcards || []);
      setActiveCardIndex(0);
      setIsCardFlipped(false);
      triggerNotification(`AI structured deck of ${data.flashcards.length} spaced repetition cards generated! +20 XP`);
      syncUserSpecificData();
    } catch (e: any) {
      triggerErrorNotification(e.message || 'Flashcards synthesis crashed.');
    } finally {
      setLoadingFlashcards(false);
    }
  };

  // Log visual feedback from review: Easy, Medium, Hard Spaced scheduling updates
  const submitFlashcardFeedback = async (cardId: string, level: 'easy' | 'medium' | 'hard') => {
    try {
      // Metric logic
      const targetScore = level === 'easy' ? 100 : level === 'medium' ? 80 : 40;
      await authFetch(`/api/flashcards/${cardId}`, {
        method: 'PUT',
        body: JSON.stringify({ memoryScore: targetScore, difficulty: level })
      });
      
      triggerNotification(`SRS updated. Scheduled review interval recorded. +5 XP`);

      // Advance deck visually locally
      if (activeCardIndex < materialFlashcards.length - 1) {
        setIsCardFlipped(false);
        setTimeout(() => setActiveCardIndex(idx => idx + 1), 200);
      } else {
        triggerNotification('Amazing! You have thoroughly completed this study deck segment.');
      }
      syncUserSpecificData();
    } catch (err: any) {
      triggerErrorNotification(err.message || 'Spaced update crash.');
    }
  };

  // Easy toggling favorite of flashcard
  const toggleFlashcardFav = async (cardId: string) => {
    try {
      const data = await authFetch(`/api/flashcards/${cardId}/favorite`, { method: 'PUT' });
      setMaterialFlashcards(prev => prev.map(f => f.id === cardId ? data.card : f));
      triggerNotification('Spaced card status toggled.');
    } catch (e: any) {
      console.log(e);
    }
  };

  // 5. AI Quiz Workspace Panel
  const executeQuizSynthesis = async () => {
    if (!activeMaterial) return;
    setLoadingQuiz(true);
    setActiveQuiz(null);
    setQuizCompleted(false);
    setQuizResultScore(null);
    setQuizAnswers({});
    try {
      const data = await authFetch('/api/ai/quiz', {
        method: 'POST',
        body: JSON.stringify({ materialId: activeMaterial.id })
      });
      setActiveQuiz(data.quiz);
      setQuizTimeLeft(180); // 3 minutes test threshold
      setQuizActive(true);
      triggerNotification('Interactive practice exam sourced. Start test!');
    } catch (e: any) {
      triggerErrorNotification(e.message || 'Practice exam creation failed.');
    } finally {
      setLoadingQuiz(false);
    }
  };

  const submitQuizAnswersManual = async () => {
    if (!activeQuiz) return;
    setQuizActive(false);
    setLoadingQuiz(true);
    try {
      const data = await authFetch('/api/ai/quiz-results', {
        method: 'POST',
        body: JSON.stringify({ quizId: activeQuiz.id, answers: quizAnswers })
      });
      
      setQuizResultScore(data.result);
      setQuizCompleted(true);
      triggerNotification(`Assessment evaluated! Verified score: ${data.result.score}% of key accuracy guidelines. +30 XP`);
      syncUserSpecificData();
    } catch (err: any) {
      triggerErrorNotification(err.message || 'Scoring computations crashed.');
    } finally {
      setLoadingQuiz(false);
    }
  };

  // 6. AI Socratic Tutor dialogue memory
  const loadTutorChatTimeline = async (mathId: string) => {
    try {
      const data = await authFetch(`/api/tutor/chat/${mathId}`);
      setTutorLog(data.chat.conversation || []);
    } catch (e) {
      console.log('Error caching Socratic chats:', e);
    }
  };

  const sendTutorMessagePrompt = async () => {
    if (!activeMaterial || !tutorInput.trim()) return;
    const query = tutorInput;
    setTutorInput('');
    setLoadingTutor(true);

    // Render locally immediately for responsive interface flow
    setTutorLog(prev => [...prev, { id: 'temp_user_id', sender: 'user', text: query, timestamp: new Date().toISOString() }]);

    try {
      const data = await authFetch(`/api/tutor/chat/${activeMaterial.id}`, {
        method: 'POST',
        body: JSON.stringify({ message: query })
      });
      setTutorLog(data.chat.conversation || []);
      syncUserSpecificData();
    } catch (err: any) {
      triggerErrorNotification(err.message || 'AI dialogue processing error.');
    } finally {
      setLoadingTutor(false);
    }
  };


  // =====================================
  // ADMINDESK PANEL DETAILS
  // =====================================
  const openAdminPortal = async () => {
    try {
      setGlobalLoading(true);
      const [statsData, usersData] = await Promise.all([
        authFetch('/api/admin/analytics'),
        authFetch('/api/admin/users')
      ]);
      setAdminStats(statsData.stats);
      setAdminUsersList(usersData.users || []);
      setActiveTab('admin');
    } catch (e: any) {
      triggerErrorNotification('Access Denied. authorized system administrators only.');
    } finally {
      setGlobalLoading(false);
    }
  };

  const adminDeleteUserAccount = async (targetUid: string) => {
    if (!confirm('Are you absolutely certain you desire to delete this user from the centralized server database? This action is non-reversible.')) return;
    try {
      await authFetch(`/api/admin/users/${targetUid}`, { method: 'DELETE' });
      setAdminUsersList(prev => prev.filter(u => u.uid !== targetUid));
      triggerNotification('User directory purged safely.');
    } catch (e: any) {
      triggerErrorNotification(e.message || 'Purge failed.');
    }
  };


  const handleSaveBrainSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingBrainSettings(true);
      const res = await authFetch('/api/auth/profile', {
        method: 'POST',
        body: JSON.stringify({
          fullName: profileName,
          email: user?.email,
          profilePhoto: user?.profilePhoto,
          brainModel,
          brainPersona,
          brainLanguage,
          brainCreativity,
          brainCustomRules
        })
      });
      setUser(res.user);
      triggerNotification('Konfigurasi Otak AI & profil Anda berhasil disimpan secara aman!');
    } catch (err: any) {
      triggerErrorNotification(err.message || 'Gagal menyimpan konfigurasi.');
    } finally {
      setSavingBrainSettings(false);
    }
  };


  // =====================================
  // AUXILIARY UTILS: EXPORTS, RECOVERY, PROFILE RESTORE
  // =====================================
  const downloadPersonalBackupData = async () => {
    try {
      const data = await authFetch('/api/auth/download-data');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'studymind_backup.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      triggerNotification('Secure structural JSON data backup download initiated.');
    } catch (err: any) {
      triggerErrorNotification(err.message || 'Data backup export failed.');
    }
  };

  const triggerAccountDeleteSelf = async () => {
    if (!confirm('WARNING: Deleting your account will completely destroy all your registered materials, flashcards, scores, and active study XP charts from our server directory. Proceed?')) return;
    try {
      await authFetch('/api/auth/account', { method: 'DELETE' });
      clearCredentials();
      triggerNotification('Your account profile has been wiped.');
    } catch (err: any) {
      triggerErrorNotification(err.message || 'Operation failed.');
    }
  };

  const copyToClipboardText = (txt: string) => {
    navigator.clipboard.writeText(txt);
    triggerNotification('Copied to clipboard!');
  };

  const triggerLocalDownloadTxtFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    triggerNotification('Study guide file downloaded!');
  };


  // =====================================
  // SEARCH / FILTER COMPILATION LISTINGS
  // =====================================
  const filteredMaterials = materials.filter(m => {
    // Search constraints
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Type categorizers
    const matchesType = filterType === 'all' || m.type === filterType;
    
    // Fav filters
    const matchesFav = !showFavoritesOnly || m.isFavorite;

    // Archive filters
    const matchesArchive = showArchived ? m.isArchived : !m.isArchived;

    return matchesSearch && matchesType && matchesFav && matchesArchive;
  });

  if (sortBy === 'title') {
    filteredMaterials.sort((a,b) => a.title.localeCompare(b.title));
  } else {
    // default recent timestamps sorting
    filteredMaterials.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Welcome default mapping if not logged inside session
  if (activeTab === 'welcome' && !user) {
    return (
      <>
        <WelcomePage 
          onStart={() => { setAuthModalMode('register'); setAuthModalOpen(true); }} 
          onLoginClick={() => { setAuthModalMode('login'); setAuthModalOpen(true); }} 
        />
        {authModalOpen && (
          <AuthModal 
            initialMode={authModalMode}
            onClose={() => setAuthModalOpen(false)} 
            onSuccess={(p) => { setAuthModalOpen(false); setUser(p); setActiveTab('dashboard'); syncUserSpecificData(); }} 
          />
        )}
      </>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col md:flex-row transition-colors duration-300`}>
      
      {/* Global Alerts Floating block banner */}
      <div className="fixed bottom-6 right-6 z-50 space-y-2 max-w-sm">
        {infoAlert && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-blue-900 bg-slate-950 text-xs text-blue-200 shadow-2xl animate-slide-up bg-radial-[circle_200px_at_100%_100%] from-blue-950/40 to-transparent">
            <Award className="w-4.5 h-4.5 text-blue-400 shrink-0" />
            <span>{infoAlert}</span>
          </div>
        )}
        {errorAlert && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-rose-900 bg-slate-950 text-xs text-rose-200 shadow-2xl animate-slide-up bg-radial-[circle_200px_at_100%_100%] from-rose-950/40 to-transparent">
            <AlertCircle className="w-4.5 h-4.5 text-rose-400 shrink-0" />
            <span>{errorAlert}</span>
          </div>
        )}
      </div>

      {/* Global loading spinner override */}
      {globalLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-xs">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            <span className="text-xs text-slate-500 font-mono">Resolving study systems...</span>
          </div>
        </div>
      )}

      {/* Navigation Left Sidebar Panel */}
      <aside className="w-full md:w-64 bg-slate-950 border-r border-slate-900 flex flex-col shrink-0">
        
        {/* Brand identity panel */}
        <div className="h-16 px-6 border-b border-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img 
              src="/logo.png" 
              alt="StudyMind AI Logo" 
              className="w-8 h-8 rounded-lg object-cover shadow-md shadow-blue-500/10" 
              referrerPolicy="no-referrer"
            />
            <span className="font-extrabold tracking-tight text-white">StudyMind AI</span>
          </div>
          
          <button 
            onClick={handleThemeToggle} 
            className="p-1.5 rounded-lg border border-slate-900 text-slate-400 hover:text-white hover:bg-slate-900"
            title="Toggle theme mode"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* User XP Gamified status badge bar */}
        {user && (
          <div className="p-4 mx-4 mt-4 rounded-xl border border-slate-900 bg-slate-900/20 relative overflow-hidden bg-radial-[circle_150px_at_0%_0%] from-blue-950/30 to-transparent">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
                <span className="text-xs font-black text-blue-400">L{user.level}</span>
              </div>
              <div className="text-left text-xs">
                <h4 className="font-bold text-white leading-none mb-0.5">{user.fullName}</h4>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Level {Math.floor(user.xp / 100) + 1} • {user.xp} XP</span>
              </div>
            </div>
            {/* XP progress gauge */}
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden mb-1">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${user.xp % 100}%` }}></div>
            </div>
            <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold uppercase">
              <span>{user.xp % 100}/100 xp</span>
              <span className="flex items-center gap-0.5 text-amber-500">
                <Zap className="w-3 h-3 fill-amber-500" /> {user.learningStreak} DAY STREAK
              </span>
            </div>
          </div>
        )}

        {/* Workspace Quick Actions and tabs navigation list */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 text-left">
          <button
            onClick={() => { setActiveTab('dashboard'); setActiveMaterial(null); }}
            className={`w-full px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-2.5 transition-colors ${activeTab === 'dashboard' && !activeMaterial ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/15' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
          >
            <Layers className="w-4 h-4" /> Dashboard overview
          </button>

          <button
            onClick={() => { setActiveTab('subjects'); setActiveMaterial(null); }}
            className={`w-full px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-2.5 transition-colors ${activeTab === 'subjects' && !activeMaterial ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/15' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
          >
            <BookOpen className="w-4 h-4" /> Subjects workspace
          </button>

          <button
            onClick={() => { setActiveTab('dashboard'); if (materials.length > 0) { selectWorkspaceResource(materials[0]); } }}
            className={`w-full px-3 py-2 rounded-xl text-sm font-semibold flex items-center justify-between transition-colors ${activeMaterial ? 'bg-slate-900 border border-slate-800 text-blue-400' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
          >
            <span className="flex items-center gap-2.5">
              <BrainCircuit className="w-4 h-4" /> AI Study Space
            </span>
            {activeMaterial && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>}
          </button>

          <button
            onClick={() => { setActiveTab('history'); setActiveMaterial(null); }}
            className={`w-full px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-2.5 transition-colors ${activeTab === 'history' && !activeMaterial ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/15' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
          >
            <Calendar className="w-4 h-4" /> Study log logs
          </button>

          <button
            onClick={() => { setActiveTab('profile'); setActiveMaterial(null); }}
            className={`w-full px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-2.5 transition-colors ${activeTab === 'profile' && !activeMaterial ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/15' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
          >
            <Award className="w-4 h-4" /> Scholar Badges & Stats
          </button>

          <button
            onClick={() => { setActiveTab('settings'); setActiveMaterial(null); }}
            className={`w-full px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-2.5 transition-colors ${activeTab === 'settings' && !activeMaterial ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/15' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
          >
            <Settings className="w-4 h-4" /> Settings Panel
          </button>

          {user?.role === 'admin' && (
            <button
              onClick={openAdminPortal}
              className={`w-full px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-2.5 transition-colors ${activeTab === 'admin' ? 'bg-amber-600/20 border border-amber-600/30 text-amber-300' : 'text-amber-500 hover:text-amber-300 hover:bg-slate-900'}`}
            >
              <Database className="w-4 h-4" /> Admin Console
            </button>
          )}
        </nav>

        {/* Sidebar Footer Logout trigger */}
        <div className="p-4 border-t border-slate-900 text-left">
          <button 
            onClick={handleLogout} 
            className="w-full px-3 py-2 text-slate-500 hover:text-rose-400 hover:bg-slate-900/50 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Logout session
          </button>
        </div>
      </aside>

      {/* Main Container Viewport wrapper */}
      <main className="flex-1 min-h-screen bg-slate-950 overflow-y-auto">
        <header className="h-16 px-8 border-b border-slate-900 flex items-center justify-between bg-slate-950/60 sticky top-0 z-15 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <span className="text-sm font-extrabold text-slate-100 uppercase tracking-widest bg-slate-900 border border-slate-800 px-3 py-1 rounded-md">
              {activeMaterial ? `Active study: ${activeMaterial.title}` : activeTab}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setCreateMaterialOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-lg shadow-blue-600/10 active:translate-y-px transition-all"
            >
              <Plus className="w-4 h-4" /> Add study paper
            </button>
          </div>
        </header>

        {/* Dashboard and related sub tabs viewport router */}
        <div className="p-8 max-w-7xl mx-auto space-y-8 text-left">

          {/* Create Subject Modal override */}
          {createSubjectOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
              <div className="w-full max-w-md rounded-2xl border border-slate-900 bg-slate-950 p-6 relative">
                <div className="absolute top-0 inset-x-0 h-0.5 bg-blue-500"></div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-white text-base">New Subject Channel</h3>
                  <button onClick={() => setCreateSubjectOpen(false)} className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-900">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={onSubjectSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-semibold uppercase">Subject Name</label>
                    <input 
                      type="text" 
                      required 
                      value={subName} 
                      onChange={(e) => setSubName(e.target.value)}
                      placeholder="e.g. Backprop Algorithms" 
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-900 bg-slate-900/30 text-slate-200 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-semibold uppercase">Icons Selector</label>
                    <div className="grid grid-cols-4 gap-2">
                      {['BookOpen', 'GraduationCap', 'Cpu', 'Layers', 'MessageSquare', 'Database', 'Sliders', 'Award'].map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setSubIcon(icon)}
                          className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center transition-all ${subIcon === icon ? 'border-blue-500 bg-blue-950/40 text-white' : 'border-slate-900 bg-slate-900/20 text-slate-400'}`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-semibold uppercase">Accent Color Theme</label>
                    <div className="flex gap-2">
                      {['#2563EB', '#22C55E', '#EC4899', '#EAB308', '#A855F7', '#EF4444'].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSubColor(color)}
                          className="w-7 h-7 rounded-full border-2 transition-transform"
                          style={{ backgroundColor: color, borderColor: subColor === color ? 'white' : 'transparent' }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-semibold uppercase">Brief Overview</label>
                    <textarea 
                      value={subDesc} 
                      onChange={(e) => setSubDesc(e.target.value)}
                      placeholder="Brief mapping statement..." 
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-900 bg-slate-900/30 text-slate-200 text-sm focus:border-blue-500 focus:outline-none h-18"
                    />
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-blue-600 rounded-xl text-white font-bold text-sm shadow-lg shadow-blue-600/10 active:translate-y-px">
                    Create Workspace Channel
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Create Material / Note / Upload Upload Modal override */}
          {createMaterialOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
              <div className="w-full max-w-lg rounded-2xl border border-slate-900 bg-slate-950 p-6 relative">
                <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-blue-500 to-emerald-400"></div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-white text-base">Compile Study Resource Paper</h3>
                  <button onClick={() => setCreateMaterialOpen(false)} className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-900">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={onMaterialSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-semibold uppercase">Save under Subject</label>
                      <select
                        required
                        value={matSubjectId}
                        onChange={(e) => setMatSubjectId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-900 bg-slate-900 text-slate-300 text-sm focus:outline-none focus:border-blue-500"
                      >
                        <option value="">Select subject channel...</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-semibold uppercase">Category Type</label>
                      <select
                        value={matType}
                        onChange={(e) => setMatType(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-900 bg-slate-900 text-slate-300 text-sm focus:outline-none focus:border-blue-500"
                      >
                        <option value="note">Notes / Plain Markdown</option>
                        <option value="link">Web reference Link / URL</option>
                        <option value="pdf">Academic PDF transcript</option>
                        <option value="txt">General Text Document</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-semibold uppercase">Topic Designation Title</label>
                    <input 
                      type="text" 
                      required 
                      value={matTitle} 
                      onChange={(e) => setMatTitle(e.target.value)}
                      placeholder="e.g. Gradient descent optimization rules"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-900 bg-slate-900/30 text-slate-200 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  {matType === 'link' && (
                    <div className="space-y-1">
                      <label className="text-xs text-amber-400 font-semibold uppercase">Google URL link / Web document URL</label>
                      <input 
                        type="url" 
                        required 
                        value={matLink} 
                        onChange={(e) => setMatLink(e.target.value)}
                        placeholder="https://example.com/curation-papers"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-900 bg-slate-900/30 text-slate-200 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-semibold uppercase">Brief Annotations</label>
                    <input 
                      type="text" 
                      value={matDesc}
                      onChange={(e) => setMatDesc(e.target.value)}
                      placeholder="Briefly notes context for reminders..." 
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-900 bg-slate-900/30 text-slate-200 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-semibold uppercase">Resource Content Body</label>
                    <textarea 
                      required={matType !== 'link'}
                      value={matContent}
                      onChange={(e) => setMatContent(e.target.value)}
                      placeholder="Type your notes here, copy-paste research content, transcripts, or plain Markdown structures."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-900 bg-slate-900/30 text-slate-200 text-sm focus:outline-none focus:border-blue-500 h-32 font-mono"
                    />
                  </div>

                  <button type="submit" className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 rounded-xl text-white font-bold text-sm shadow-xl active:translate-y-px">
                    Compile Resource & Generate Spacing Index (+10 XP)
                  </button>
                </form>
              </div>
            </div>
          )}


          {/* VIEW: MAIN WORKSPACE CONTAINER (AI Study Space) IF MATERIAL ACTIVE */}
          {activeMaterial ? (
            <div className="space-y-8 animate-fade-in relative z-10 transition-transform">
              
              {/* Back navigation header line */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setActiveMaterial(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-900 text-xs font-semibold hover:bg-slate-900 text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Return to workspace index
                </button>
                <span className="text-xs font-mono text-slate-600">/</span>
                <span className="text-xs font-bold text-slate-400 truncate max-w-sm">Active Workspace: {activeMaterial.title}</span>
              </div>

              {/* Resource Profile Header Card */}
              <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/10 relative overflow-hidden bg-radial-[circle_300px_at_100%_0%] from-blue-950/20 to-transparent">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-950/60 border border-blue-900/40 text-[10px] uppercase font-bold text-blue-400">{activeMaterial.type}</span>
                      <span className="text-xs text-slate-500">{activeMaterial.size} study resource</span>
                    </div>
                    <h2 className="text-2xl font-black text-white">{activeMaterial.title}</h2>
                    <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">{activeMaterial.description || 'No direct notes annotation provided.'}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => toggleMaterialFavorite(activeMaterial)}
                      className={`p-2 rounded-lg border ${activeMaterial.isFavorite ? 'border-pink-900 text-pink-500 bg-pink-950/15' : 'border-slate-900 text-slate-400 hover:text-white hover:bg-slate-900'}`}
                      title="Favorite resource"
                    >
                      <Heart className="w-4.5 h-4.5" />
                    </button>
                    <button 
                      onClick={() => toggleMaterialArchive(activeMaterial)}
                      className={`px-3.5 py-1.5 rounded-lg border text-xs font-medium ${activeMaterial.isArchived ? 'border-amber-900 text-amber-500 bg-amber-950/15' : 'border-slate-900 text-slate-400 hover:text-white hover:bg-slate-900'}`}
                      title="Archive workspace"
                    >
                      {activeMaterial.isArchived ? 'Archived' : 'Archive'}
                    </button>
                    <button 
                      onClick={() => deleteMaterialConfirm(activeMaterial.id, activeMaterial.title)}
                      className="p-2 rounded-lg border border-slate-900 text-slate-500 hover:text-rose-400 hover:bg-rose-950/10 transition-colors"
                      title="Purge permanently"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Sub-Tabs AI generators toggles navigation panel */}
              <div className="flex border-b border-slate-900 overflow-x-auto gap-2 py-1 scrollbar-none">
                {[
                  { id: 'summary', label: 'AI Summaries', icon: <FileText className="w-4 h-4" /> },
                  { id: 'explanation', label: 'Socratic Explanations', icon: <Sliders className="w-4 h-4" /> },
                  { id: 'mindmap', label: 'SVG Mind Map', icon: <BrainCircuit className="w-4 h-4" /> },
                  { id: 'flashcards', label: 'Interactive Flashcards', icon: <Layers className="w-4 h-4" /> },
                  { id: 'quiz', label: 'Practice Exams', icon: <Award className="w-4 h-4" /> },
                  { id: 'tutor', label: 'Live Tutor Chat', icon: <MessageSquare className="w-4 h-4" /> }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setWorkspaceTab(t.id as any)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shrink-0 ${workspaceTab === t.id ? 'bg-blue-600/10 border border-blue-500/20 text-blue-400' : 'text-slate-400 hover:text-white border border-transparent'}`}
                  >
                    {t.icon}
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>

              {/* AI Study space rendering area based on selected workspaceTab state */}
              <div className="min-h-96">
                
                {/* 1. Summary Module */}
                {workspaceTab === 'summary' && (
                  <div className="space-y-6 animate-fade-in text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-900 bg-slate-900/10">
                      <div className="space-y-1">
                        <h4 className="font-bold text-white text-sm">Design Study length constraints</h4>
                        <p className="text-slate-500 text-xs">Summaries are parsed utilizing generative models.</p>
                      </div>
                      <div className="flex gap-2 items-center">
                        <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                          {['short', 'medium', 'detailed'].map((len) => (
                            <button
                              key={len}
                              onClick={() => setSummaryLength(len as any)}
                              className={`px-3 py-1 text-xs font-bold rounded-md uppercase tracking-wider transition-colors ${summaryLength === len ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                              {len}
                            </button>
                          ))}
                        </div>
                        <button 
                          onClick={executeSummaryGeneration}
                          disabled={loadingSummary}
                          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1"
                        >
                          {loadingSummary ? <RefreshCw className="w-4.5 h-4.5 animate-spin" /> : 'Generate Summary'}
                        </button>
                      </div>
                    </div>

                    {summaryOutput ? (
                      <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950 text-left space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                          <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Computed summary guide Guide layout</span>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => copyToClipboardText(summaryOutput)}
                              className="p-1 px-2 text-xs rounded border border-slate-900 hover:bg-slate-900 text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5" /> Copy Text
                            </button>
                            <button 
                              onClick={() => triggerLocalDownloadTxtFile(`summary_${activeMaterial.title.toLowerCase().replace(/\s+/g, '_')}.md`, summaryOutput)}
                              className="p-1 px-2 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1 transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" /> Export MD
                            </button>
                          </div>
                        </div>
                        <div className="text-sm text-slate-300 space-y-3 prose leading-relaxed prose-invert font-sans whitespace-pre-wrap">
                          {summaryOutput}
                        </div>
                      </div>
                    ) : (
                      <div className="h-64 rounded-2xl border border-dashed border-slate-800 flex flex-col items-center justify-center p-6 text-center text-slate-500 space-y-2 bg-slate-900/10">
                        <FileText className="w-8 h-8 text-slate-700 animate-pulse" />
                        <h4 className="font-semibold text-slate-400">Generate high-value executive summaries</h4>
                        <p className="text-xs max-w-sm">Choose summary density profile parameters and formulate guides of deep structural clarity with Gemini 3.5-flash.</p>
                      </div>
                    )}
                  </div>
                )}


                {/* 2. Socratic Explanations Module */}
                {workspaceTab === 'explanation' && (
                  <div className="space-y-6 animate-fade-in text-left font-sans">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-900 bg-slate-900/10">
                      <div className="space-y-1">
                        <h4 className="font-bold text-white text-sm">Select Cognitive comprehension level</h4>
                        <p className="text-slate-500 text-xs">Configure terminology and analogies perfectly calibrated for varying skill-levels.</p>
                      </div>
                      <div className="flex gap-2 items-center">
                        <select
                          value={explanationMode}
                          onChange={(e) => setExplanationMode(e.target.value as any)}
                          className="px-3.5 py-1.5 rounded-lg border border-slate-910 bg-slate-900 text-slate-300 text-xs font-semibold focus:outline-none"
                        >
                          <option value="child">Child / Explain Like I am 5</option>
                          <option value="beginner">Beginner / Clean Ground Base</option>
                          <option value="intermediate">Intermediate / Intuitive Concepts</option>
                          <option value="advanced">Advanced / Tech In-Depth Definitions</option>
                          <option value="professional">Professional / Expert Academic</option>
                        </select>
                        <button 
                          onClick={executeExplanationGeneration}
                          disabled={loadingExplanation}
                          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1"
                        >
                          {loadingExplanation ? <RefreshCw className="w-4.5 h-4.5 animate-spin" /> : 'Get Explanation'}
                        </button>
                      </div>
                    </div>

                    {explanationOutput ? (
                      <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950 space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                          <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Level explanation targeting: {explanationMode.toUpperCase()}</span>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => copyToClipboardText(explanationOutput)}
                              className="p-1 px-2 text-xs rounded border border-slate-900 text-slate-400 hover:text-white flex items-center gap-1"
                            >
                              <Copy className="w-3.5 h-3.5" /> Copy
                            </button>
                            <button 
                              onClick={() => triggerLocalDownloadTxtFile(`explanation_${explanationMode}_${activeMaterial.title.toLowerCase().replace(/\s+/g, '_')}.md`, explanationOutput)}
                              className="p-1 px-2 text-xs rounded bg-blue-600 text-white font-bold flex items-center gap-1"
                            >
                              <Download className="w-3.5 h-3.5" /> Download PDF / MD
                            </button>
                          </div>
                        </div>
                        <div className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed space-y-3 prose prose-invert font-sans">
                          {explanationOutput}
                        </div>
                      </div>
                    ) : (
                      <div className="h-64 rounded-2xl border border-dashed border-slate-800 flex flex-col items-center justify-center p-6 text-center text-slate-500 space-y-2 bg-slate-900/10">
                        <Sliders className="w-8 h-8 text-slate-700 animate-pulse" />
                        <h4 className="font-semibold text-slate-400">Demystify high-level concepts</h4>
                        <p className="text-xs max-w-sm">Formulate analogies perfectly styled to any learner profile using adaptive explain engines.</p>
                      </div>
                    )}
                  </div>
                )}


                {/* 3. Mind Map Canvas integration */}
                {workspaceTab === 'mindmap' && (
                  <div className="space-y-6 animate-fade-in h-[550px]">
                    {mindmapTopology ? (
                      <MindMapCanvas rootNode={mindmapTopology} />
                    ) : (
                      <div className="h-full rounded-2xl border border-dashed border-slate-800 flex flex-col items-center justify-center p-6 text-center text-slate-500 space-y-4 bg-slate-900/10">
                        <div className="w-14 h-14 rounded-2xl bg-blue-950/20 border border-blue-900/30 flex items-center justify-center">
                          <BrainCircuit className="w-8 h-8 text-blue-500" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-300">Generate Hierarchical mental blueprint map</h4>
                          <p className="text-xs text-slate-500 max-w-sm">We will index details structurally and map connectivity branches. Click create map to proceed.</p>
                        </div>
                        <button
                          onClick={executeMindmapGeneration}
                          disabled={loadingMindmap}
                          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/10 transition-all flex items-center gap-1.5"
                        >
                          {loadingMindmap ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Create Mental Map +15 XP'}
                        </button>
                      </div>
                    )}
                  </div>
                )}


                {/* 4. Spaced repetition interactive flashcards reviews */}
                {workspaceTab === 'flashcards' && (
                  <div className="space-y-6 animate-fade-in text-left">
                    {materialFlashcards.length > 0 ? (
                      <div className="max-w-xl mx-auto space-y-6">
                        
                        {/* Deck progression metrics counter */}
                        <div className="flex justify-between items-center text-xs text-slate-500 font-bold uppercase">
                          <span>Card {activeCardIndex + 1} of {materialFlashcards.length} cards</span>
                          <span className="text-blue-400">SRS interval active</span>
                        </div>

                        {/* Standard Flashcard viewport frame */}
                        <div 
                          onClick={() => setIsCardFlipped(!isCardFlipped)}
                          className="h-64 rounded-2xl border border-slate-900 bg-slate-900/30 hover:border-blue-500/30 p-8 flex flex-col justify-between cursor-pointer select-none relative overflow-hidden transition-all duration-300 shadow-xl bg-radial-[circle_250px_at_0%_0%] from-blue-950/30 to-transparent"
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest bg-slate-950 px-2 py-0.5 rounded border border-slate-900">
                              {isCardFlipped ? 'RECALL ANSWER SHEET' : 'PRACTICE QUESTION'}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFlashcardFav(materialFlashcards[activeCardIndex].id);
                              }}
                              className={`p-1.5 rounded-md border ${materialFlashcards[activeCardIndex].isFavorite ? 'border-pink-950 text-pink-500 bg-pink-950/10' : 'border-slate-800 text-slate-500 hover:text-white'}`}
                            >
                              <Heart className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="text-center py-4 px-2">
                            {isCardFlipped ? (
                              <p className="text-base font-medium text-slate-200 leading-relaxed animate-fade-in">{materialFlashcards[activeCardIndex].answer}</p>
                            ) : (
                              <p className="text-lg font-bold text-white tracking-tight leading-snug">{materialFlashcards[activeCardIndex].question}</p>
                            )}
                          </div>

                          <span className="text-[10px] text-slate-500 text-center uppercase tracking-wider block">Click anywhere on card to flip and verify</span>
                        </div>

                        {/* Interactive difficulty SRS schedule feedback controllers */}
                        {isCardFlipped ? (
                          <div className="p-4 rounded-xl border border-slate-900 bg-slate-950 space-y-3 animate-fade-in">
                            <h4 className="text-xs uppercase font-bold text-slate-500 tracking-wider text-center">Rate your recall understanding quality</h4>
                            <div className="grid grid-cols-3 gap-3">
                              <button
                                onClick={() => submitFlashcardFeedback(materialFlashcards[activeCardIndex].id, 'easy')}
                                className="p-3 rounded-lg border border-emerald-900/40 bg-emerald-950/15 hover:bg-emerald-950/25 text-emerald-300 text-xs font-bold transition-all text-center"
                              >
                                Easy / Instant Recall<br /><span className="text-[9px] text-emerald-500">Next review: 14 days</span>
                              </button>
                              <button
                                onClick={() => submitFlashcardFeedback(materialFlashcards[activeCardIndex].id, 'medium')}
                                className="p-3 rounded-lg border border-blue-900/40 bg-blue-950/15 hover:bg-blue-950/25 text-blue-300 text-xs font-bold transition-all text-center"
                              >
                                Medium / Stumbled<br /><span className="text-[9px] text-blue-500">Next review: 3 days</span>
                              </button>
                              <button
                                onClick={() => submitFlashcardFeedback(materialFlashcards[activeCardIndex].id, 'hard')}
                                className="p-3 rounded-lg border border-rose-900/40 bg-rose-950/15 hover:bg-rose-950/25 text-rose-300 text-xs font-bold transition-all text-center"
                              >
                                Hard / Forgotten<br /><span className="text-[9px] text-rose-500">Next review: 1 day</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => { if (activeCardIndex > 0) { setActiveCardIndex(idx => idx - 1); setIsCardFlipped(false); } }}
                              disabled={activeCardIndex === 0}
                              className="px-3.5 py-1.5 rounded border border-slate-900 hover:bg-slate-900 text-xs font-semibold text-slate-400 disabled:opacity-30"
                            >
                              Prev
                            </button>
                            <button
                              onClick={() => { if (activeCardIndex < materialFlashcards.length - 1) { setActiveCardIndex(idx => idx + 1); setIsCardFlipped(false); } }}
                              disabled={activeCardIndex === materialFlashcards.length - 1}
                              className="px-3.5 py-1.5 rounded border border-slate-900 hover:bg-slate-900 text-xs font-semibold text-slate-400 disabled:opacity-30"
                            >
                              Next
                            </button>
                          </div>
                        )}

                      </div>
                    ) : (
                      <div className="h-64 rounded-2xl border border-dashed border-slate-800 flex flex-col items-center justify-center p-6 text-center text-slate-500 space-y-4 bg-slate-900/10">
                        <Layers className="w-8 h-8 text-slate-700 animate-pulse" />
                        <div className="space-y-1">
                          <h4 className="font-semibold text-slate-400">Extract memorization flashcard deck</h4>
                          <p className="text-xs max-w-xs">Instantly build active retrieval reviews utilizing spacing repetition loops with Gemini.</p>
                        </div>
                        <button
                          onClick={executeFlashcardGeneration}
                          disabled={loadingFlashcards}
                          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/10 flex items-center gap-1"
                        >
                          {loadingFlashcards ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Generate Flashcards +20 XP'}
                        </button>
                      </div>
                    )}
                  </div>
                )}


                {/* 5. Practice exam assessment quizzes */}
                {workspaceTab === 'quiz' && (
                  <div className="space-y-6 animate-fade-in text-left">
                    {activeQuiz ? (
                      <div className="max-w-2xl mx-auto space-y-6">
                        
                        {/* Quiz Header Info and counts */}
                        <div className="flex justify-between items-center bg-slate-900/40 p-4 rounded-xl border border-slate-900">
                          <div>
                            <h4 className="font-bold text-white text-sm">{activeQuiz.title}</h4>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{activeQuiz.questions.length} questions exam</span>
                          </div>
                          
                          {/* Timer tracking */}
                          <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 text-xs font-mono font-bold ${quizTimeLeft < 45 ? 'border-rose-900 bg-rose-950/20 text-rose-300' : 'border-slate-800 text-slate-300'}`}>
                            <Timer className={`w-4 h-4 ${quizTimeLeft < 45 ? 'animate-bounce text-rose-400' : ''}`} />
                            <span>{Math.floor(quizTimeLeft / 60)}:{(quizTimeLeft % 60).toString().padStart(2, '0')}</span>
                          </div>
                        </div>

                        {/* Quiz Results Scorecard display if completed */}
                        {quizCompleted && quizResultScore ? (
                          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950 text-left space-y-6">
                            <div className="text-center space-y-1">
                              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Exam evaluation sheet</span>
                              <div className="text-4xl font-black text-blue-500 mb-2">{quizResultScore.score}% ACCURACY</div>
                              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                                You scored correctly on {quizResultScore.correctAnswersCount} of {quizResultScore.totalQuestions} metrics queries. Gratitude for completion! +30 XP
                              </p>
                            </div>

                            <hr className="border-slate-900" />

                            <div className="space-y-4">
                              <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Wrong responses & evaluation Advice</h4>
                              {quizResultScore.wrongAnswersReview.map((rev: any, index: number) => (
                                <div key={index} className="p-4 rounded-xl border border-slate-900 bg-slate-900/10 space-y-1 text-xs">
                                  <h5 className="font-bold text-white">Q: {rev.questionText}</h5>
                                  <p className="text-slate-400">Your Answer: <span className="text-rose-400 font-semibold">{rev.selectedAnswer || '(empty)'}</span></p>
                                  <p className="text-slate-400">Ideal Rubric Target: <span className="text-emerald-400 font-semibold">{rev.correctAnswer}</span></p>
                                  <p className="text-slate-300 font-medium italic mt-2 text-blue-300">Grade advice: {rev.explanation}</p>
                                </div>
                              ))}
                            </div>

                            <button
                              onClick={executeQuizSynthesis}
                              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl"
                            >
                              Retry practice exam
                            </button>
                          </div>
                        ) : (
                          // Active quiz questions lists
                          <div className="space-y-6">
                            {activeQuiz.questions.map((q, idx) => (
                              <div key={q.id} className="p-6 rounded-2xl border border-slate-900 bg-slate-900/10 space-y-4">
                                <h5 className="font-bold text-white text-sm">
                                  <span className="text-blue-500 mr-2">#{idx + 1}</span> {q.question}
                                </h5>

                                {q.type === 'multiple-choice' && q.options && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {q.options.map((opt) => {
                                      // Extract label key A, B, C, D
                                      const labelChar = opt.substring(0, 1) || '';
                                      const isSelected = quizAnswers[q.id] === labelChar;
                                      return (
                                        <button
                                          key={opt}
                                          type="button"
                                          onClick={() => setQuizAnswers(prev => ({ ...prev, [q.id]: labelChar }))}
                                          className={`p-3 rounded-lg border text-xs font-semibold text-left transition-colors ${isSelected ? 'border-blue-500 bg-blue-950/20 text-white' : 'border-slate-900 bg-slate-950/40 text-slate-300 hover:bg-slate-900'}`}
                                        >
                                          {opt}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}

                                {q.type === 'true-false' && (
                                  <div className="flex gap-3">
                                    {['True', 'False'].map((tf) => {
                                      const isSelected = quizAnswers[q.id] === tf;
                                      return (
                                        <button
                                          key={tf}
                                          type="button"
                                          onClick={() => setQuizAnswers(prev => ({ ...prev, [q.id]: tf }))}
                                          className={`flex-1 p-3 rounded-lg border text-xs font-bold transition-all text-center ${isSelected ? 'border-blue-500 bg-blue-950/20 text-white' : 'border-slate-900 bg-slate-950/40 text-slate-300 hover:bg-slate-900'}`}
                                        >
                                          {tf}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}

                                {q.type === 'essay' && (
                                  <div className="space-y-1.5">
                                    <textarea
                                      value={quizAnswers[q.id] || ''}
                                      onChange={(e) => setQuizAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                      placeholder="Type your essay answer. AI will evaluate your vocabulary scope against academic key rubrics..."
                                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-900 bg-slate-900/30 text-slate-200 text-xs focus:outline-none focus:border-blue-500 h-24"
                                    />
                                    <span className="text-[10px] text-slate-500 italic block">Essay grades are calculated using Gemini criteria scoring.</span>
                                  </div>
                                )}
                              </div>
                            ))}

                            <button
                              onClick={submitQuizAnswersManual}
                              disabled={loadingQuiz}
                              className="w-full py-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 rounded-xl text-white font-bold text-sm shadow-xl transition-all"
                            >
                              {loadingQuiz ? <RefreshCw className="w-4.5 h-4.5 animate-spin mx-auto" /> : 'Submit Practice exam Answers (+30 XP)'}
                            </button>
                          </div>
                        )}

                      </div>
                    ) : (
                      <div className="h-64 rounded-2xl border border-dashed border-slate-800 flex flex-col items-center justify-center p-6 text-center text-slate-500 space-y-4 bg-slate-900/10">
                        <Award className="w-8 h-8 text-slate-700 animate-pulse" />
                        <div className="space-y-1">
                          <h4 className="font-semibold text-slate-400">Synthesize AI subject practices exams</h4>
                          <p className="text-xs max-w-xs">Includes Multiple Choice, True/False, and grading Socratic essays assessments.</p>
                        </div>
                        <button
                          onClick={executeQuizSynthesis}
                          disabled={loadingQuiz}
                          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/10 flex items-center gap-1"
                        >
                          {loadingQuiz ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Synthesize Quiz exam +30 XP'}
                        </button>
                      </div>
                    )}
                  </div>
                )}


                {/* 6. AI Socratic Tutor dialogs chats */}
                {workspaceTab === 'tutor' && (
                  <div className="space-y-6 animate-fade-in text-left">
                    
                    {/* Floating Info dialogue */}
                    <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-xl flex gap-2 text-xs text-blue-300">
                      <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>Socratic active tutoring maps chats logs dynamically on this context paper.</span>
                    </div>

                    {/* Chat dialog logs space viewport */}
                    <div className="border border-slate-900 rounded-2xl bg-slate-950 overflow-hidden flex flex-col h-[400px]">
                      
                      {/* Message timeline viewport */}
                      <div className="flex-1 p-4 overflow-y-auto space-y-4 scroll-smooth">
                        {tutorLog.map((m: any, index: number) => {
                          const isTutor = m.sender === 'tutor';
                          return (
                            <div 
                              key={m.id || index} 
                              className={`flex ${isTutor ? 'justify-start' : 'justify-end'} animate-fade-in`}
                            >
                              <div className={`max-w-lg p-3.5 rounded-2xl text-xs leading-relaxed border ${isTutor ? 'bg-slate-900/50 border-slate-900 text-slate-200 rounded-tl-none bg-gradient-to-br from-slate-900/80 to-transparent' : 'bg-blue-600 text-white border-transparent rounded-tr-none shadow-lg shadow-blue-600/10'}`}>
                                <div className="flex justify-between items-center mb-1 text-[9px] uppercase font-bold text-slate-400/80">
                                  <span>{isTutor ? 'AI SOCRATIC PARTNER' : 'STUDENT'}</span>
                                  <span>{m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                </div>
                                <div className="whitespace-pre-wrap font-sans">{m.text}</div>
                              </div>
                            </div>
                          );
                        })}
                        {loadingTutor && (
                          <div className="flex justify-start animate-pulse">
                            <div className="bg-slate-900/50 border border-slate-900 rounded-2xl rounded-tl-none p-4 text-xs text-slate-500">
                              <span className="flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" /> Socratic partner is formulating reflections...</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Chat footer input panel */}
                      <div className="p-3 border-t border-slate-900 bg-slate-950/60 flex gap-2">
                        <input
                          type="text"
                          value={tutorInput}
                          onChange={(e) => setTutorInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') sendTutorMessagePrompt(); }}
                          placeholder="Ask a question: Explain chapter 3 formulas, simplify core concept..."
                          disabled={loadingTutor}
                          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-900 bg-slate-900/30 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                        />
                        <button
                          onClick={sendTutorMessagePrompt}
                          disabled={loadingTutor || !tutorInput.trim()}
                          className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors disabled:opacity-50"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>

                    </div>

                  </div>
                )}


              </div>

            </div>
          ) : (
            // =====================================
            // VIEW: PRIMARY TABS INDEX (Dashboard, Subjects, History, etc.)
            // =====================================
            <div className="space-y-8 animate-fade-in text-left">
              
              {/* HEADER WELCOME BANNER */}
              {user && activeTab === 'dashboard' && (
                <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/10 relative overflow-hidden bg-radial-[circle_400px_at_100%_100%] from-blue-950/20 to-transparent">
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h2 className="text-xl font-bold text-white">Salutations, Scholar {user.fullName}!</h2>
                      <p className="text-slate-400 text-xs max-w-2xl">
                        Let's optimize memory loops today. You have resolved <span className="text-blue-400">{materials.length} research source elements</span> cataloged under <span className="text-emerald-400">{subjects.length} study categories</span>.
                      </p>
                    </div>
                    {dueFlashcards.length > 0 && (
                      <div className="px-3.5 py-2.5 rounded-xl bg-orange-950/15 border border-orange-900/40 text-xs text-orange-300 flex items-center gap-2">
                        <Zap className="w-4.5 h-4.5 animate-bounce text-orange-400" />
                        <span>Practice alarms: <strong className="font-bold text-white">{dueFlashcards.length} flashcards due for review</strong> today!</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* VIEW TABS ROUTER */}
              
              {/* A. DASHBOARD VIEW CONTROLLER */}
              {activeTab === 'dashboard' && (
                <div className="space-y-8 animate-fade-in text-left">
                  
                  {/* Analytic stats grid dashboard cards */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[
                      { label: 'Subjects mapped', count: subjects.length, icon: <BookOpen className="w-4.5 h-4.5 text-blue-500" /> },
                      { label: 'Study materials', count: materials.length, icon: <FileText className="w-4.5 h-4.5 text-emerald-500" /> },
                      { label: 'Accumulated XP', count: user?.xp || 0, icon: <Award className="w-4.5 h-4.5 text-pink-500" /> },
                      { label: 'Day Streak', count: user?.learningStreak || 1, icon: <Zap className="w-4.5 h-4.5 text-amber-500 animate-pulse" /> },
                      { label: 'Reviews Due today', count: dueFlashcards.length, icon: <Layers className="w-4.5 h-4.5 text-orange-500" /> },
                      { label: 'Retention rate %', count: `${flashcardStats.averageRetention}%`, icon: <BrainCircuit className="w-4.5 h-4.5 text-sky-500" /> }
                    ].map((stat, i) => (
                      <div key={i} className="p-4 rounded-xl border border-slate-900 bg-slate-900/10 space-y-2 select-none hover:border-slate-800 transition-colors">
                        <div className="flex justify-between items-center text-slate-500">
                          <span className="text-[10px] uppercase font-bold tracking-wider leading-none text-left">{stat.label}</span>
                          {stat.icon}
                        </div>
                        <h3 className="text-xl font-bold text-white">{stat.count}</h3>
                      </div>
                    ))}
                  </div>

                  {/* Dynamic SVG Visual Charts Grid and Quick Link controllers */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Progress tracking SVG Graph Chart */}
                    <div className="lg:col-span-8 p-6 rounded-2xl border border-slate-900 bg-slate-950/40 space-y-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-white text-sm">Memory Retention and Quiz Scores Progress</h4>
                          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Weekly trend monitoring index</span>
                        </div>
                        <span className="text-xs text-blue-400 font-bold">Stable recalling tracks</span>
                      </div>

                      {/* failure-proof beautiful inline coordinate raw inline SVG Graph chart representation */}
                      <div className="h-44 w-full bg-slate-950/60 rounded-xl border border-slate-900 relative p-2 flex items-end">
                        <svg className="w-full h-full overflow-visible">
                          {/* Grid background lines */}
                          <line x1="0" y1="20" x2="100%" y2="20" stroke="#0f172a" strokeWidth="1" />
                          <line x1="0" y1="60" x2="100%" y2="60" stroke="#0f172a" strokeWidth="1" />
                          <line x1="0" y1="100" x2="100%" y2="100" stroke="#0f172a" strokeWidth="1" />
                          <line x1="0" y1="140" x2="100%" y2="140" stroke="#0f172a" strokeWidth="1" />

                          {/* SVG Path visual line curves */}
                          <path
                            d="M 20,130 Q 140,80 260,95 T 500,40"
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                          />
                          <path
                            d="M 20,140 Q 140,110 260,120 T 500,65"
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="2.5"
                            strokeDasharray="4"
                            strokeLinecap="round"
                          />

                          {/* Data points */}
                          <circle cx="20" cy="130" r="5" fill="#3b82f6" stroke="#020617" strokeWidth="2" />
                          <circle cx="150" cy="85" r="5" fill="#3b82f6" stroke="#020617" strokeWidth="2" />
                          <circle cx="280" cy="100" r="5" fill="#3b82f6" stroke="#020617" strokeWidth="2" />
                          <circle cx="430" cy="45" r="5" fill="#3b82f6" stroke="#020617" strokeWidth="2" />

                          {/* Axis labels */}
                          <text x="20" y="170" fill="#475569" className="text-[10px] font-mono">Mon</text>
                          <text x="150" y="170" fill="#475569" className="text-[10px] font-mono">Wed</text>
                          <text x="280" y="170" fill="#475569" className="text-[10px] font-mono">Fri</text>
                          <text x="430" y="170" fill="#475569" className="text-[10px] font-mono">Sun</text>
                        </svg>
                        
                        {/* Legend tag badges indicator */}
                        <div className="absolute top-4 right-4 flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-[9px] uppercase font-bold tracking-wider text-slate-400">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                            <span>Memory strength index</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[9px] uppercase font-bold tracking-wider text-slate-400">
                            <span className="w-2.5 h-1 border-t border-emerald-500 border-dashed"></span>
                            <span>Quiz scores accuracy</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Study Action triggers list */}
                    <div className="lg:col-span-4 p-6 rounded-2xl border border-slate-900 bg-slate-950/40 space-y-4 text-left">
                      <div>
                        <h4 className="font-bold text-white text-sm">Study Workspace Quick Links</h4>
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Instant workflows</span>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => setCreateMaterialOpen(true)}
                          className="w-full p-3 rounded-xl border border-slate-900 bg-slate-900/10 hover:bg-slate-900/30 text-xs font-semibold text-slate-300 hover:text-white transition-colors flex items-center justify-between group"
                        >
                          <span className="flex items-center gap-2">
                            <Plus className="w-4 h-4 text-blue-500" /> Upload a new study paper
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                        </button>

                        <button 
                          onClick={() => setCreateSubjectOpen(true)}
                          className="w-full p-3 rounded-xl border border-slate-900 bg-slate-900/10 hover:bg-slate-900/30 text-xs font-semibold text-slate-300 hover:text-white transition-colors flex items-center justify-between group"
                        >
                          <span className="flex items-center gap-2">
                            <FolderPlus className="w-4 h-4 text-emerald-500" /> Create customized subject
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                        </button>

                        <button 
                          onClick={() => { if (materials.length > 0) { selectWorkspaceResource(materials[0]); setWorkspaceTab('flashcards'); } else { triggerNotification('Please upload your study papers first!'); } }}
                          className="w-full p-3 rounded-xl border border-slate-900 bg-slate-900/10 hover:bg-slate-900/30 text-xs font-semibold text-slate-300 hover:text-white transition-colors flex items-center justify-between group"
                        >
                          <span className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-pink-500" /> Initiate spacing card reviews
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* STUDY PAPERS VAULT SECTION INDEX */}
                  <hr className="border-slate-900" />
                  
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-extrabold text-white text-lg">My Study Papers Repository</h3>
                        <p className="text-xs text-slate-500">Retrieve summaries, interactive mind templates, quizzes, and spaced card reviews.</p>
                      </div>

                      <div className="flex flex-wrap gap-2 items-center">
                        {/* Type Quick filters */}
                        <select
                          value={filterType}
                          onChange={(e) => setFilterType(e.target.value as any)}
                          className="px-3 py-1.5 rounded-lg border border-slate-900 bg-slate-900 text-xs text-slate-400 focus:outline-none"
                        >
                          <option value="all">All File formats</option>
                          <option value="note">Notes Workspaces</option>
                          <option value="link">Web direct links</option>
                          <option value="pdf">Academic PDFs</option>
                        </select>

                        {/* Favorites filter toggle */}
                        <button
                          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${showFavoritesOnly ? 'border-pink-900 bg-pink-950/15 text-pink-400' : 'border-slate-900 text-slate-500 hover:text-white'}`}
                        >
                          Favorites List Only
                        </button>

                        {/* Search input */}
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                          <input 
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search Vault elements..."
                            className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-900 bg-slate-950 text-xs text-slate-300 focus:border-blue-500 focus:outline-none w-44"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Materials layout cards stream */}
                    {filteredMaterials.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredMaterials.map((mat) => {
                          const matSubject = subjects.find(s => s.id === mat.subjectId);
                          return (
                            <div 
                              key={mat.id}
                              onClick={() => selectWorkspaceResource(mat)}
                              className="p-5 rounded-2xl border border-slate-900 bg-slate-900/10 hover:border-slate-800 transition-all cursor-pointer text-left space-y-4 group relative overflow-hidden bg-radial-[circle_150px_at_0%_0%] from-slate-900/10 to-transparent"
                            >
                              <div className="flex justify-between items-start">
                                <span 
                                  className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
                                  style={{ backgroundColor: `${matSubject?.color || '#2563_EB'}20`, color: matSubject?.color || '#2563EB', border: `1px solid ${matSubject?.color || '#2563_EB'}30` }}
                                >
                                  {matSubject?.name || 'Academic Studies'}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">{mat.size}</span>
                              </div>

                              <div className="space-y-1">
                                <h4 className="font-bold text-white tracking-tight leading-snug group-hover:text-blue-400 transition-colors">{mat.title}</h4>
                                <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">{mat.description || 'No summary annotations annotated.'}</p>
                              </div>

                              <div className="border-t border-slate-900 pt-3 flex justify-between items-center text-[10px] text-slate-500">
                                <span className="flex items-center gap-1 font-mono uppercase">
                                  <FileText className="w-3.5 h-3.5" /> {mat.type} format
                                </span>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); toggleMaterialFavorite(mat); }}
                                  className={`p-1 hover:bg-slate-950 rounded-md transition-colors ${mat.isFavorite ? 'text-pink-500' : 'text-slate-500 hover:text-white'}`}
                                >
                                  <Heart className="w-3.5 h-3.5 fill-current" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="h-44 border border-dashed border-slate-900 rounded-2xl flex flex-col items-center justify-center text-slate-500 text-xs p-6 text-center space-y-1">
                        <FileText className="w-6 h-6 text-slate-700 animate-pulse" />
                        <h4 className="font-bold text-slate-400">Vault registers are empty</h4>
                        <p>Configure customized subject catalog nodes and upload references sheets to start.</p>
                      </div>
                    )}
                  </div>

                </div>
              )}


              {/* B. SUBJECT MANAGEMENT TAB */}
              {activeTab === 'subjects' && (
                <div className="space-y-6 animate-fade-in text-left">
                  <div className="flex justify-between items-center border-b border-slate-900 pb-4">
                    <div>
                      <h2 className="text-2xl font-black text-white">Subject Channels Workspace</h2>
                      <p className="text-xs text-slate-500">Organize and segment learning categories to build modular resources desks.</p>
                    </div>
                    <button 
                      onClick={() => setCreateSubjectOpen(true)}
                      className="bg-blue-600 hover:bg-blue-300 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold leading-none"
                    >
                      New Channel
                    </button>
                  </div>

                  {subjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {subjects.map((sub) => {
                        const matchingMaterialsCount = materials.filter(m => m.subjectId === sub.id).length;
                        return (
                          <div 
                            key={sub.id}
                            className="p-5 rounded-2xl border border-slate-900 bg-slate-900/10 space-y-4 relative overflow-hidden text-left hover:border-slate-800 transition-colors"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-10 h-10 rounded-xl flex items-center justify-center opacity-90 text-white font-bold text-sm"
                                  style={{ backgroundColor: `${sub.color}20`, color: sub.color, border: `1px solid ${sub.color}40` }}
                                >
                                  {sub.icon.substring(0, 2)}
                                </div>
                                <div>
                                  <h4 className="font-black text-white text-sm">{sub.name}</h4>
                                  <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Indexed subject node</span>
                                </div>
                              </div>

                              <button 
                                onClick={() => deleteSubjectCascade(sub.id)}
                                className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/10 transition-colors"
                                title="Delete Subject Channel"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <p className="text-slate-400 text-xs line-clamp-3 leading-relaxed">{sub.description || 'No direct study parameters cataloged or annotated.'}</p>

                            <hr className="border-slate-900" />

                            <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase">
                              <span>{matchingMaterialsCount} study files save</span>
                              <button 
                                onClick={() => { setSearchQuery(''); setFilterType('all'); setActiveTab('dashboard'); }}
                                className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                              >
                                Browse Elements <ChevronRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-64 border border-dashed border-slate-900 rounded-2xl flex flex-col items-center justify-center p-6 text-center text-slate-500 space-y-2">
                      <BookOpen className="w-8 h-8 text-slate-700 animate-pulse" />
                      <h4 className="font-bold text-slate-400">No active academic channels registered</h4>
                      <p className="text-xs">Establish customized segments (e.g. Accounting, Neurals Networks, Algorithms) to sort study resources.</p>
                      <button onClick={() => setCreateSubjectOpen(true)} className="px-4 py-2 mt-2 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-lg shadow-blue-500/10">Build Subject Node First</button>
                    </div>
                  )}

                </div>
              )}


              {/* C. STUDY SYSTEM ACTIVITY LOGS TIMELINE */}
              {activeTab === 'history' && (
                <div className="space-y-6 animate-fade-in text-left">
                  <div className="border-b border-slate-900 pb-4">
                    <h2 className="text-2xl font-black text-white">Academic History logs Timeline</h2>
                    <p className="text-xs text-slate-500">Timeline review log maps and calendars tracking your generative AI milestones.</p>
                  </div>

                  {history.length > 0 ? (
                    <div className="max-w-xl mx-auto relative pl-6 border-l border-slate-900 space-y-8 py-2">
                      {history.map((hist) => {
                        const iconColor = hist.activityType === 'Upload' ? 'text-emerald-500 bg-emerald-950/20' : 
                                          hist.activityType === 'Summary' ? 'text-blue-500 bg-blue-950/20' : 
                                          hist.activityType === 'Explanation' ? 'text-purple-500 bg-purple-950/20' : 
                                          hist.activityType === 'MindMap' ? 'text-sky-400 bg-sky-950/20' : 
                                          hist.activityType === 'Flashcard' ? 'text-pink-500 bg-pink-950/20' : 'text-amber-500 bg-amber-950/20';
                        return (
                          <div key={hist.id} className="relative space-y-1">
                            {/* timeline node badge */}
                            <div className={`absolute -left-[35px] top-0 w-6.5 h-6.5 rounded-full flex items-center justify-center border border-slate-950 shrink-0 ${iconColor}`}>
                              <span className="text-[8px] font-black">{hist.activityType.substring(0, 1)}</span>
                            </div>
                            
                            <div className="flex justify-between items-center text-[10px] text-slate-500">
                              <span className="font-bold uppercase tracking-wider text-blue-400">{hist.activityType} activity</span>
                              <span className="font-mono">{new Date(hist.createdAt).toLocaleDateString()} {new Date(hist.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <h4 className="font-bold text-white text-xs">{hist.activityTitle}</h4>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-64 border border-dashed border-slate-900 rounded-2xl flex flex-col items-center justify-center p-6 text-slate-500 text-xs">
                      <Calendar className="w-8 h-8 text-slate-700 animate-pulse" />
                      <p className="mt-2">Logs details are empty. Summarize active resources or evaluate test quizzes to record history coordinates.</p>
                    </div>
                  )}

                </div>
              )}


              {/* D. SHOLAR ACHIEVEMENTS & STATS GAUGES PROFILE */}
              {activeTab === 'profile' && (
                <div className="space-y-8 animate-fade-in text-left">
                  <div className="border-b border-slate-900 pb-4">
                    <h2 className="text-2xl font-black text-white">Elite Scholar Badges Tracker</h2>
                    <p className="text-xs text-slate-500">Unlock gamified achievements status by maintaining active research milestones.</p>
                  </div>

                  {/* Badges system grids mapping */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {INITIAL_ACHIEVEMENTS.map((badge) => {
                      // Sim stats mapping checks for unlocked states
                      const isUnlocked = user && (
                        (badge.id === 'first_upload' && materials.length >= 1) ||
                        (badge.id === 'first_summary' && history.some(h => h.activityType === 'Summary')) ||
                        (badge.id === 'streak_7' && user.learningStreak >= 7) ||
                        (badge.id === 'srs_expert' && flashcardStats.totalCards >= 3) ||
                        (badge.id === 'tutor_scholar' && history.some(h => h.activityType === 'TutorChat')) ||
                        badge.id === 'quiz_master' // unlocked for pro demo elements
                      );

                      return (
                        <div 
                          key={badge.id}
                          className={`p-5 rounded-2xl border relative overflow-hidden flex items-start gap-4 ${isUnlocked ? 'border-blue-900/40 bg-radial-[circle_150px_at_100%_100%] from-blue-950/15 to-transparent' : 'border-slate-910 bg-slate-950/20 opacity-40'}`}
                        >
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm border shrink-0 ${isUnlocked ? 'bg-blue-600/10 border-blue-500/20 text-blue-400' : 'bg-slate-900 border-slate-800 text-slate-600'}`}>
                            {badge.icon.substring(0,2)}
                          </div>
                          <div className="space-y-1.5 flex-1 p-0">
                            <div className="flex justify-between items-start">
                              <h4 className="font-bold text-white text-xs tracking-tight">{badge.title}</h4>
                              {isUnlocked && <span className="text-[8px] tracking-wider uppercase font-black text-emerald-400">UNLOCKED</span>}
                            </div>
                            <p className="text-slate-400 text-[11px] leading-relaxed">{badge.description}</p>
                            <span className="text-[10px] text-pink-500 font-bold uppercase mt-1 block">+{badge.xpReward} XP REWARD</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}


              {/* E. SETTINGS CONTROL SUITE */}
              {activeTab === 'settings' && (
                <div className="max-w-xl mx-auto space-y-8 animate-fade-in text-left">
                  <div className="border-b border-slate-900 pb-4">
                    <h2 className="text-2xl font-black text-white">Settings Management Pane</h2>
                    <p className="text-xs text-slate-500">Configure personal account details, change passwords, and trigger localized backups.</p>
                  </div>

                  {user && (
                    <div className="space-y-6">
                      
                      {/* Password / general simulated update controls */}
                      <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/10 space-y-4">
                        <h4 className="font-bold text-white text-xs uppercase tracking-wider">Account security parameters</h4>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Primary email address</label>
                          <input 
                            type="email" 
                            disabled 
                            value={user.email} 
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-900 bg-slate-900/50 text-slate-500 text-xs font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">User directory Role ID</label>
                          <input 
                            type="text" 
                            disabled 
                            value={user.role.toUpperCase()} 
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-900 bg-slate-900/50 text-slate-500 text-xs font-mono"
                          />
                        </div>
                      </div>

                      {/* AI BRAIN CONFIGURATION SUITE */}
                      <form onSubmit={handleSaveBrainSettings} className="p-6 rounded-2xl border border-blue-950/50 bg-slate-900/20 shadow-xl space-y-5">
                        <div className="flex items-center gap-2.5 border-b border-slate-900 pb-3">
                          <BrainCircuit className="w-5 h-5 text-blue-500 animate-pulse" />
                          <div>
                            <h4 className="font-bold text-white text-sm">Konfigurasi Otak AI</h4>
                            <p className="text-[10px] text-slate-400">Atur preferensi berpikir, model kecerdasan buatan, dan instruksi personal tutor Anda.</p>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nama Lengkap Pengguna</label>
                          <input 
                            type="text" 
                            required
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-950/50 text-slate-300 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kecerdasan Mesin (AI Model)</label>
                          <select 
                            value={brainModel}
                            onChange={(e) => setBrainModel(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-950/50 text-slate-300 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                          >
                            <option value="gemini-3.5-flash">Gemini 3.5 Flash (Sangat Pintar & Responsif)</option>
                            <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Super Cepat & Ringan)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gaya Persona & Karakter Tutor</label>
                          <select 
                            value={brainPersona}
                            onChange={(e) => setBrainPersona(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-950/50 text-slate-300 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                          >
                            <option value="Socratic Mentor">Socratic Mentor (Membimbing dengan pertanyaan analitis)</option>
                            <option value="Strict Professor">Strict Professor (Sangat terstruktur, detail & berbobot)</option>
                            <option value="Friendly Study Ally">Friendly Study Ally (Santai, interaktif & bersahabat)</option>
                            <option value="Code & Logic Expert">Code & Logic Expert (Spesialis logika, pemrograman & matematika)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bahasa Utama Jawaban</label>
                          <select 
                            value={brainLanguage}
                            onChange={(e) => setBrainLanguage(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-950/50 text-slate-300 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                          >
                            <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                            <option value="English">English</option>
                            <option value="Javanese">Basa Jawa</option>
                            <option value="Sundanese">Basa Sunda</option>
                            <option value="Auto">Deteksi Otomatis (Sesuai Materi)</option>
                          </select>
                        </div>

                        <div className="space-y-2 select-none">
                          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <span>Index Kreativitas (Temperature)</span>
                            <span className="text-blue-400 font-mono text-xs">{brainCreativity}</span>
                          </div>
                          <input 
                            type="range" 
                            min="0.1" 
                            max="1.5" 
                            step="0.1"
                            value={brainCreativity}
                            onChange={(e) => setBrainCreativity(parseFloat(e.target.value))}
                            className="w-full accent-blue-600"
                          />
                          <div className="flex justify-between text-[9px] text-slate-500 font-semibold uppercase">
                            <span>Sangat Presisi (Fakta)</span>
                            <span>Sangat Kreatif (Analogi)</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Petunjuk Khusus (Custom Instructions)</label>
                          <textarea 
                            value={brainCustomRules}
                            onChange={(e) => setBrainCustomRules(e.target.value)}
                            placeholder="Contoh: Selalu jelaskan langkah demi langkah, gunakan sapaan 'Kakak', sisipkan analogi sains..."
                            className="w-full p-3 rounded-xl border border-slate-800 bg-slate-950/50 text-slate-300 text-xs font-sans h-20 focus:border-blue-500 focus:outline-none"
                          />
                        </div>

                        <button 
                          type="submit"
                          disabled={savingBrainSettings}
                          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg hover:shadow-blue-600/10 flex items-center justify-center gap-1.5 transition-all text-center disabled:opacity-50"
                        >
                          {savingBrainSettings ? 'Menyinkronkan Otak...' : 'Simpan Konfigurasi Otak AI & Profil'}
                        </button>
                      </form>

                      {/* Download vault configuration buttons */}
                      <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/10 space-y-4">
                        <h4 className="font-bold text-white text-xs uppercase tracking-wider">Structural Local backup Recovery</h4>
                        <p className="text-slate-400 text-xs leading-relaxed">
                          Export complete subjects structure, files metadata counts, practice quiz accomplishments, and active logs timeline into a structured study JSON files.
                        </p>
                        <button 
                          onClick={downloadPersonalBackupData}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-lg flex items-center gap-1 transition-colors"
                        >
                          <Download className="w-4 h-4" /> Export Personal Backup Data
                        </button>
                      </div>

                      {/* Danger Wipe Purge Operations zone */}
                      <div className="p-6 rounded-2xl border border-rose-950/20 bg-rose-950/5 space-y-4">
                        <h4 className="font-bold text-red-400 text-xs uppercase tracking-wider">Danger operations zone</h4>
                        <p className="text-xs text-slate-400">Permanently delete your profile workspace. Wipe summaries, active history arrays and credential metrics indices.</p>
                        <button 
                          onClick={triggerAccountDeleteSelf}
                          className="px-4 py-2 bg-rose-900 hover:bg-rose-800 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                          Purge Account vault
                        </button>
                      </div>

                    </div>
                  )}

                </div>
              )}


              {/* F. SYSTEM ADMIN VIEWPORT CONSOLE */}
              {activeTab === 'admin' && adminStats && (
                <div className="space-y-8 animate-fade-in text-left">
                  <div className="border-b border-slate-900 pb-4">
                    <h2 className="text-2xl font-black text-amber-500 flex items-center gap-2">
                       Administrator Dashboard Control Panel
                    </h2>
                    <p className="text-xs text-slate-500">Cross-system diagnostic metrics lists, active registrations maps, and account prune tools.</p>
                  </div>

                  {/* Stats grids analytic blocks */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Total registered Users', count: adminStats.totalUsers },
                      { label: 'Materials globally mapped', count: adminStats.totalMaterials },
                      { label: 'Socratic activities triggers', count: adminStats.totalInteractions },
                      { label: 'Practice Exams Graded', count: adminStats.totalQuizzesRun }
                    ].map((st, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-slate-900 bg-slate-900/10 space-y-2">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">{st.label}</span>
                        <h3 className="text-2xl font-black text-white">{st.count}</h3>
                      </div>
                    ))}
                  </div>

                  {/* Users streams lists table */}
                  <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/40 space-y-4">
                    <h4 className="font-bold text-white text-sm uppercase tracking-wider">Active users directory databases</h4>
                    {adminUsersList.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left divide-y divide-slate-900">
                          <thead>
                            <tr className="text-slate-500 uppercase tracking-wider">
                              <th className="py-3 px-2">Scholar Credentials</th>
                              <th className="py-3 px-2">Access Level</th>
                              <th className="py-3 px-2">Status Role</th>
                              <th className="py-3 px-2">Join timestamp</th>
                              <th className="py-3 px-2 text-right">Action options</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-900">
                            {adminUsersList.map((usr) => (
                              <tr key={usr.uid} className="hover:bg-slate-900/10 text-slate-300">
                                <td className="py-3.5 px-2">
                                  <div className="font-bold text-white">{usr.fullName}</div>
                                  <div className="text-[10px] text-slate-500 font-mono">{usr.email}</div>
                                </td>
                                <td className="py-3.5 px-2 font-bold font-mono">L{usr.level} • {usr.xp} XP</td>
                                <td className="py-3.5 px-2">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${usr.role === 'admin' ? 'bg-amber-950 text-amber-300 border border-amber-900/40' : 'bg-slate-900 text-slate-400'}`}>
                                    {usr.role.toUpperCase()}
                                  </span>
                                </td>
                                <td className="py-3.5 px-2 text-slate-500 font-mono">{new Date(usr.joinDate).toLocaleDateString()}</td>
                                <td className="py-3.5 px-2 text-right">
                                  <button 
                                    onClick={() => adminDeleteUserAccount(usr.uid)}
                                    className="p-1 px-2 hover:bg-rose-950/10 border border-transparent hover:border-rose-900 rounded text-rose-500 font-bold transition-all text-[10px] uppercase"
                                    title="Purge permanently"
                                  >
                                    Purge user
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-slate-500 text-xs">No entries cached.</p>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </main>

    </div>
  );
}
