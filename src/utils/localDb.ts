/**
 * StudyMind Client-Side Database & Offline Router Fallback (Vercel & Offline Deployments)
 * Persists data inside browser localStorage to ensure a highly responsive, error-free client-only fallback.
 */

import { UserProfile, Subject, LearningMaterial, LearningHistory, Flashcard, Quiz, AISummary, AIExplanation, AIMindMap } from '../types';
import { safeStorage } from './safeStorage';

// Storage Key Constants
const USERS_KEY = 'studymind_local_users';
const SUBJECTS_KEY = 'studymind_local_subjects';
const MATERIALS_KEY = 'studymind_local_materials';
const HISTORY_KEY = 'studymind_local_history';
const FLASHCARDS_KEY = 'studymind_local_flashcards';
const SUMMARIES_KEY = 'studymind_local_summaries';
const EXPLANATIONS_KEY = 'studymind_local_explanations';
const MINDMAPS_KEY = 'studymind_local_mindmaps';
const QUIZZES_KEY = 'studymind_local_quizzes';
const CHATS_KEY = 'studymind_local_chats';

// Helper: safe JSON parsing
const getLocalJSON = <T>(key: string, defaultValue: T): T => {
  try {
    const raw = safeStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (e) {
    return defaultValue;
  }
};

const setLocalJSON = (key: string, data: any): void => {
  try {
    safeStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to persist client database JSON state:', e);
  }
};

// Seed admin profile and pre-populate if empty
const initLocalDb = () => {
  const users = getLocalJSON<any[]>(USERS_KEY, []);
  
  // Always ensure 'akang.munggiz.07@gmail.com' is registered as our seed user
  const adminEmail = 'akang.munggiz.07@gmail.com';
  const hasAdmin = users.some(u => u.email.toLowerCase() === adminEmail);
  if (!hasAdmin) {
    users.push({
      uid: 'user-admin-munggiz',
      fullName: 'StudyMind Scholar Admin',
      email: adminEmail,
      passwordHash: 'admin123', // Simple text matching for mock login
      profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      level: 1,
      xp: 150,
      learningStreak: 3,
      joinDate: new Date().toISOString(),
      role: 'admin',
      brainModel: 'gemini-3.5-flash',
      brainPersona: 'Socratic Mentor',
      brainLanguage: 'Bahasa Indonesia',
      brainCreativity: 1.0,
      brainCustomRules: 'Jawab semua pertanyaan dengan bahasa Indonesia yang santun dan solutif.'
    });
    setLocalJSON(USERS_KEY, users);
  }

  // Pre-populate some starter Subjects if empty
  const subjects = getLocalJSON<Subject[]>(SUBJECTS_KEY, []);
  if (subjects.length === 0) {
    const starterSubjects: Subject[] = [
      {
        id: 'sub-ipa',
        userId: 'user-admin-munggiz',
        name: 'Ilmu Pengetahuan Alam',
        icon: 'Cpu',
        color: '#2563EB',
        description: 'Mempelajari biologi, fisika, kimia, astronomi, dan fenomena semesta.',
        createdAt: new Date().toISOString()
      },
      {
        id: 'sub-ips',
        userId: 'user-admin-munggiz',
        name: 'Ilmu Sosial & Humaniora',
        icon: 'Layers',
        color: '#EC4899',
        description: 'Membahas sosiologi, sejarah, ekonomi, geografi, dan kebudayaan warga.',
        createdAt: new Date().toISOString()
      }
    ];
    setLocalJSON(SUBJECTS_KEY, starterSubjects);
  }
};

// Run immediately
initLocalDb();

/**
 * High-performance mock study kit generators (Flashcard, summary, quiz, chatbot)
 * Triggers on addition of customized study materials locally!
 */
export function generateStudyKit(userId: string, material: LearningMaterial) {
  const content = material.content || '';
  const paragraphs = content.split('\n').map(p => p.trim()).filter(Boolean);
  const keywords = content.match(/[A-Z][a-z]{3,12}/g) || ['Belajar', 'Ilmutek', 'Informasi'];
  const uniqueKeywords = Array.from(new Set(keywords)).filter(w => w.length > 4).slice(0, 8);

  // 1. Generate Smart Local Summary
  const summaryLengthModes: ('short' | 'medium' | 'detailed')[] = ['short', 'medium', 'detailed'];
  const summaries = getLocalJSON<AISummary[]>(SUMMARIES_KEY, []);
  
  summaryLengthModes.forEach(mode => {
    let modeText = '';
    if (mode === 'short') {
      modeText = `### Ringkasan Eksekutif (${material.title})\n\n- **Inti Studi**: Bahasan utama adalah mengenai pembelajaran terstruktur serta penguasaan kompetensi mendasar.\n- **Poin Utama**: Topik ini menerangkan relasi konsep penting yang tertuang dalam dokumen.\n- **Saran Belajar**: Kerjakan simulasi kuis dan uji ingatan melalui kartu flashcard untuk pemahaman optimal.`;
    } else if (mode === 'medium') {
      modeText = `### Ringkasan Komprehensif (${material.title})\n\n#### 📌 Pendahuluan & Latar Belakang\nMateri ini menyajikan kerangka kerja intelektual yang didasarkan pada dokumen "${material.title}". Pembahasan difokuskan pada analisis terpadu aspek akademis.\n\n#### 🔑 Tinjauan Pokok Bahasan\n1. **Prinsip Dasar**: Pola berpikir kritis untuk memetakan keterkaitan konsep.\n2. **Aplikasi Praktis**: Implementasi teori ke dalam latihan kasus nyata.\n3. **Kesimpulan**: Metodologi ini mempermudah retensi memori jangka panjang dengan pendekatan bertahap.`;
    } else {
      modeText = `### Ringkasan Detil & Analisis Mendalam (${material.title})\n\n#### 🏷️ Deskripsi Umum Materi\nDokumen ini mengintegrasikan wawasan komprehensif mengenai subjek pilihan Anda. Ditulis untuk memfasilitasi kebutuhan riset terapan.\n\n#### 📝 Analisis Sub-Bab & Penjelasan Detail\n- **Modul Utama**: Menitikberatkan pada integrasi konseptual.\n- **Modul Menengah**: Menjabarkan relasi sebab-akibat antar poin-poin yang didiskusikan.\n- **Implikasi Praktis**: Memberikan arahan taktis dalam penyelesaian masalah nyata terkait materi ini.\n\n#### 💡 Rekomendasi Mentor Socratic\n- Mintalah bot tutor menjelaskan bagian rumit berulang kali.\n- Gunakan peta mind-map untuk mengingat hierarki topik.`;
    }

    summaries.push({
      id: `sum-${material.id}-${mode}`,
      userId,
      materialId: material.id,
      type: mode,
      content: modeText,
      createdAt: new Date().toISOString()
    });
  });
  setLocalJSON(SUMMARIES_KEY, summaries);

  // 2. Generate Local Flashcards
  const flashcards = getLocalJSON<Flashcard[]>(FLASHCARDS_KEY, []);
  const sampleCardPrompts = [
    { q: `Apa fokus utama dokumen "${material.title}"?`, a: `Fokus utamanya adalah menguraikan gagasan, materi inti, dan konsep utama yang dibahas untuk mempermudah pemahaman siswa.` },
    { q: `Sebutkan poin penting pertama dari materi ini!`, a: `Poin penting pertamanya berkaitan dengan fundasi dasar dari teori yang dikemukakan dalam subbab pembuka.` },
    { q: `Bagaimana cara mengaplikasikan materi "${material.title}" dalam kehidupan sehari-hari?`, a: `Dengan merumuskan solusi berbasis logika kritis dari masalah nyata yang relevan dengan bahasan tersebut.` },
    { q: `Apa kesimpulan akhir dari evaluasi dokumen ini?`, a: `Bahwa pemahaman menyeluruh memerlukan kombinasi membaca teori, latihan evaluasi kuis mandiri, serta diskusi aktif.` }
  ];

  sampleCardPrompts.forEach((prompt, idx) => {
    flashcards.push({
      id: `fc-${material.id}-${idx}`,
      userId,
      materialId: material.id,
      question: prompt.q,
      answer: prompt.a,
      difficulty: 'medium',
      isFavorite: false,
      reviewCount: 0,
      memoryScore: 100,
      easeFactor: 2.5,
      intervalDays: 1,
      nextReviewDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    });
  });
  setLocalJSON(FLASHCARDS_KEY, flashcards);

  // 3. Generate Local Mind Map
  const mindmaps = getLocalJSON<AIMindMap[]>(MINDMAPS_KEY, []);
  const mapNodes = uniqueKeywords.map((kw, i) => ({
    id: `node-${material.id}-${i}`,
    label: kw,
    description: `Definisi lanjutan dan eksplorasi topik ${kw}.`
  }));

  mindmaps.push({
    id: `mm-${material.id}`,
    userId,
    materialId: material.id,
    jsonData: {
      root: {
        id: `root-${material.id}`,
        label: material.title,
        description: material.description || 'Pusat Analisis Materi Akademis',
        children: [
          {
            id: `child-1-${material.id}`,
            label: 'Aspek Fundamental',
            description: 'Konsep dasar yang menjadi pilar pembahasan.',
            children: mapNodes.slice(0, 3)
          },
          {
            id: `child-2-${material.id}`,
            label: 'Implementasi & Analisis',
            description: 'Penerapan praktis teori.',
            children: mapNodes.slice(3, 6)
          }
        ]
      }
    },
    createdAt: new Date().toISOString()
  });
  setLocalJSON(MINDMAPS_KEY, mindmaps);

  // 4. Generate Interactive Quizzes
  const quizzes = getLocalJSON<Quiz[]>(QUIZZES_KEY, []);
  quizzes.push({
    id: `qz-${material.id}`,
    userId,
    materialId: material.id,
    title: `Kuis Pemahaman: ${material.title}`,
    questions: [
      {
        id: `q-${material.id}-1`,
        question: `Apakah kegunaan utama dari pokok bahasan dalam dokumen "${material.title}"?`,
        type: 'multiple-choice',
        options: [
          'A. Memberikan landasan konsep dasar yang terpadu',
          'B. Menghapus data penting untuk efisiensi',
          'C. Mengatur jadwal harian secara pasif',
          'D. Sebagai hiasan aplikasi visual belaka'
        ],
        correctAnswer: 'A'
      },
      {
        id: `q-${material.id}-2`,
        question: `Benar atau Salah: Dokumen "${material.title}" mengemukakan pentingnya pemikiran kritis dalam memahami subbab dasar belajar.`,
        type: 'true-false',
        correctAnswer: 'True'
      },
      {
        id: `q-${material.id}-3`,
        question: `Jelaskan secara ringkas menurut pendapat Anda, mengapa konsep "${uniqueKeywords[0] || 'Utama'}" krusial untuk dipelajari lebih dalam!`,
        type: 'essay',
        correctAnswer: 'Analisis esai dinilai dari penjelasan logis, keterkaitan argumentasi ilmiah, penguasaan istilah teknis, serta penyajian analogi relevan.'
      }
    ],
    createdAt: new Date().toISOString()
  });
  setLocalJSON(QUIZZES_KEY, quizzes);

  // 5. Post Activity Log to History
  const history = getLocalJSON<LearningHistory[]>(HISTORY_KEY, []);
  history.push({
    id: `hist-${Date.now()}`,
    userId,
    materialId: material.id,
    activityType: 'Upload',
    activityTitle: `Mengunggah bahan belajar "${material.title}"`,
    createdAt: new Date().toISOString()
  });
  setLocalJSON(HISTORY_KEY, history);
}

/**
 * Automatically seeds standard, fully interactive study templates
 * for newly registered or logged-in users so their interface is instantly alive.
 */
export function seedUserSandbox(userId: string) {
  const subjects = getLocalJSON<Subject[]>(SUBJECTS_KEY, []);
  
  // Ensure user has their customized subjects
  const userHasSubjects = subjects.some(s => s.userId === userId);
  if (!userHasSubjects) {
    const userSubjects: Subject[] = [
      {
        id: `sub-ipa-${userId}`,
        userId,
        name: 'Ilmu Pengetahuan Alam',
        icon: 'Cpu',
        color: '#2563EB',
        description: 'Mempelajari biologi, fisika, kimia, astronomi, dan fenomena semesta.',
        createdAt: new Date().toISOString()
      },
      {
        id: `sub-ips-${userId}`,
        userId,
        name: 'Ilmu Sosial & Humaniora',
        icon: 'Layers',
        color: '#EC4899',
        description: 'Membahas sosiologi, sejarah, ekonomi, geografi, dan kebudayaan warga.',
        createdAt: new Date().toISOString()
      }
    ];
    subjects.push(...userSubjects);
    setLocalJSON(SUBJECTS_KEY, subjects);
  }

  const materials = getLocalJSON<LearningMaterial[]>(MATERIALS_KEY, []);
  const userHasMaterials = materials.some(m => m.userId === userId);
  if (!userHasMaterials) {
    const starterMaterials: LearningMaterial[] = [
      {
        id: `mat-ipa-${userId}`,
        userId,
        subjectId: `sub-ipa-${userId}`,
        title: 'Misteri Black Hole dan Cakrawala Kejadian',
        description: 'Eksplorasi gravitasi ekstrem, batas relativitas umum, dan kosmos.',
        content: `Black hole atau lubang hitam adalah wilayah di ruang angkasa di mana gaya gravitasi begitu kuat bahkan cahaya pun tidak dapat lolos darinya. Cakrawala kejadian (event horizon) adalah batas luar batas lubang hitam di mana kecepatan lepas melebihi hukum fisika cahaya. Teori Relativitas Umum Einstein meramalkan bahwa massa yang cukup kompak dapat mendeformasi ruang-waktu untuk membentuk lubang hitam. Belajar astronomi membantu kita memahami batas-batas imajinasi manusia dan hukum alam semesta.`,
        type: 'txt',
        size: '1.2 KB',
        isFavorite: true,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: `mat-ips-${userId}`,
        userId,
        subjectId: `sub-ips-${userId}`,
        title: 'Revolusi Industri & Sosiologi Masyarakat Modern',
        description: 'Studi pergeseran pola agraris ke industrialisasi urban modern.',
        content: `Revolusi Industri dimulai di Inggris pada akhir abad ke-18 dengan penemuan mesin uap James Watt. Peristiwa sejarah ini mengubah tatanan ekonomi dunia dari agraris menjadi industri manufaktur urban. Dampak sosial utamanya meliputi urbanisasi besar-besaran, lahirnya kelas pekerja baru, dan digitalisasi modern saat ini. Memahami sosiologi sejarah membantu kita melihat pola masa depan.`,
        type: 'txt',
        size: '1.5 KB',
        isFavorite: false,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    starterMaterials.forEach(m => {
      materials.push(m);
      // Automatically generate associated interactive study assets (Summaries, flashcards, mindmaps, quizzes)
      generateStudyKit(userId, m);
    });

    setLocalJSON(MATERIALS_KEY, materials);
  }
}

/**
 * Simulated Local API router
 * Dynamically intercepts `/api/` fetch requests on client deployments.
 */
export async function handleLocalDbRequest(urlString: string, init?: RequestInit): Promise<Response> {
  const url = new URL(urlString, window.location.origin);
  const path = url.pathname;
  const method = init?.method?.toUpperCase() || 'GET';
  const body = init?.body ? JSON.parse(init.body as string) : {};

  // Mock Request Authentication Token validation
  // Extract token from request headers (typically Bearer uid)
  let authUserId = 'user-admin-munggiz'; 
  if (init?.headers) {
    let authHeader = '';
    const headersAny = init.headers as any;
    if (typeof headersAny.get === 'function') {
      authHeader = headersAny.get('Authorization') || headersAny.get('authorization') || '';
    } else {
      const headersObj = init.headers as Record<string, string>;
      authHeader = headersObj['Authorization'] || headersObj['authorization'] || '';
    }
    if (authHeader.startsWith('Bearer ')) {
      authUserId = authHeader.substring(7).trim();
    }
  }

  // Helper macro: Build custom Response object
  const makeJsonRes = (status: number, data: any) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  try {
    // 1. POST /api/auth/register
    if (path === '/api/auth/register' && method === 'POST') {
      const { fullName, email, password } = body;
      const users = getLocalJSON<any[]>(USERS_KEY, []);
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        return makeJsonRes(400, { error: 'Alamat email ini sudah terdaftar.' });
      }

      const newUser: UserProfile = {
        uid: `user-${Date.now()}`,
        fullName: fullName || 'Personal Scholar',
        email: email,
        level: 1,
        xp: 0,
        learningStreak: 1,
        joinDate: new Date().toISOString(),
        profilePhoto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        role: 'student',
        brainModel: 'gemini-3.5-flash',
        brainPersona: 'Socratic Mentor',
        brainLanguage: 'Bahasa Indonesia',
        brainCreativity: 1.0,
        brainCustomRules: ''
      };

      // In client mode, save password plaintext within list
      users.push({ ...newUser, passwordHash: password });
      setLocalJSON(USERS_KEY, users);

      // Seed starter materials & subjects for premium landing experience
      seedUserSandbox(newUser.uid);

      return makeJsonRes(201, { message: 'Registrasi lokal berhasil!', user: newUser });
    }

    // 2. POST /api/auth/login
    if (path === '/api/auth/login' && method === 'POST') {
      const { email, password } = body;
      const users = getLocalJSON<any[]>(USERS_KEY, []);
      const match = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!match) {
        return makeJsonRes(401, { error: 'Akun dengan email ini tidak ditemukan.' });
      }
      if (match.passwordHash && match.passwordHash !== password) {
        return makeJsonRes(401, { error: 'Kata sandi salah. Silakan coba lagi.' });
      }

      // Safe update developer active streak
      match.learningStreak = (match.learningStreak || 0) + 1;
      setLocalJSON(USERS_KEY, users);

      // Seed starter materials & subjects so user has content on first login
      seedUserSandbox(match.uid);

      const { passwordHash, ...safeUser } = match;
      return makeJsonRes(200, { message: 'Selamat datang kembali!', user: safeUser });
    }

    // 3. POST /api/auth/google-sso
    if (path === '/api/auth/google-sso' && method === 'POST') {
      const { fullName, email } = body;
      const users = getLocalJSON<any[]>(USERS_KEY, []);
      let match = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!match) {
        match = {
          uid: `user-sso-${Date.now()}`,
          fullName: fullName || email.split('@')[0],
          email: email,
          passwordHash: 'sso_dummy',
          level: 1,
          xp: 10,
          learningStreak: 1,
          joinDate: new Date().toISOString(),
          profilePhoto: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
          role: 'student',
          brainModel: 'gemini-3.5-flash',
          brainPersona: 'Socratic Mentor',
          brainLanguage: 'Bahasa Indonesia',
          brainCreativity: 1.0
        };
        users.push(match);
        setLocalJSON(USERS_KEY, users);
      }

      // Seed starter materials & subjects for SSO entries
      seedUserSandbox(match.uid);

      const { passwordHash, ...safeUser } = match;
      return makeJsonRes(200, { message: 'Autentikasi Pintar SSO Berhasil!', user: safeUser });
    }

    // 4. GET /api/auth/me
    if (path === '/api/auth/me' && method === 'GET') {
      const users = getLocalJSON<any[]>(USERS_KEY, []);
      const user = users.find(u => u.uid === authUserId);
      if (!user) {
        return makeJsonRes(404, { error: 'Sesi belajar Anda telah kedaluwarsa. Silakan masuk kembali.' });
      }

      // Ensure active sessions are always seeded
      seedUserSandbox(user.uid);

      const { passwordHash, ...safeUser } = user;
      return makeJsonRes(200, { user: safeUser });
    }

    // 5. POST /api/auth/profile
    if (path === '/api/auth/profile' && method === 'POST') {
      const users = getLocalJSON<any[]>(USERS_KEY, []);
      const idx = users.findIndex(u => u.uid === authUserId);
      if (idx === -1) {
        return makeJsonRes(404, { error: 'User profile not resolved in local storage.' });
      }

      users[idx] = { ...users[idx], ...body };
      setLocalJSON(USERS_KEY, users);

      const { passwordHash, ...safeUser } = users[idx];
      return makeJsonRes(200, { message: 'Profil Anda telah disinkronkan!', user: safeUser });
    }

    // 6. POST /api/auth/forgot-password or reset-password
    if (path === '/api/auth/forgot-password' && method === 'POST') {
      return makeJsonRes(200, { message: 'Email instruksi reset sandi telah dikirim secara virtual!' });
    }
    if (path === '/api/auth/reset-password' && method === 'POST') {
      const { email, newPassword } = body;
      const users = getLocalJSON<any[]>(USERS_KEY, []);
      const idx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
      if (idx !== -1) {
        users[idx].passwordHash = newPassword;
        setLocalJSON(USERS_KEY, users);
      }
      return makeJsonRes(200, { message: 'Kata sandi baru berhasil dikonfigurasikan!' });
    }

    // 7. GET /api/subjects
    if (path === '/api/subjects' && method === 'GET') {
      const subjects = getLocalJSON<Subject[]>(SUBJECTS_KEY, []);
      const mine = subjects.filter(s => s.userId === authUserId || s.userId === 'user-admin-munggiz');
      return makeJsonRes(200, { subjects: mine });
    }

    // 8. POST /api/subjects
    if (path === '/api/subjects' && method === 'POST') {
      const { name, icon, color, description } = body;
      if (!name) return makeJsonRes(400, { error: 'Nama subjek mendaftar wajib diisi.' });

      const subjects = getLocalJSON<Subject[]>(SUBJECTS_KEY, []);
      const newSub: Subject = {
        id: `sub-${Date.now()}`,
        userId: authUserId,
        name,
        icon: icon || 'BookOpen',
        color: color || '#2563EB',
        description: description || '',
        createdAt: new Date().toISOString()
      };
      subjects.push(newSub);
      setLocalJSON(SUBJECTS_KEY, subjects);

      return makeJsonRes(201, { message: 'Subjek baru berhasil didaftarkan.', subject: newSub });
    }

    // 9. DELETE /api/subjects/:id
    if (path.startsWith('/api/subjects/') && method === 'DELETE') {
      const id = path.split('/').pop();
      const subjects = getLocalJSON<Subject[]>(SUBJECTS_KEY, []);
      const filtered = subjects.filter(s => s.id !== id);
      setLocalJSON(SUBJECTS_KEY, filtered);
      return makeJsonRes(200, { success: true, message: 'Subjek berhasil dihapus.' });
    }

    // 10. GET /api/materials
    if (path === '/api/materials' && method === 'GET') {
      const materials = getLocalJSON<LearningMaterial[]>(MATERIALS_KEY, []);
      const mine = materials.filter(m => m.userId === authUserId);
      return makeJsonRes(200, { materials: mine });
    }

    // 11. POST /api/materials (Study Resource Generation)
    if (path === '/api/materials' && method === 'POST') {
      const { subjectId, title, description, content, type, size, fileUrl } = body;
      if (!subjectId || !title || !content || !type) {
        return makeJsonRes(400, { error: 'Subjek, judul materi, serta konten wajib diisi.' });
      }

      const materials = getLocalJSON<LearningMaterial[]>(MATERIALS_KEY, []);
      const newMat: LearningMaterial = {
        id: `mat-${Date.now()}`,
        userId: authUserId,
        subjectId,
        title,
        description: description || '',
        content,
        type,
        size: size || '12 KB',
        isFavorite: false,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      materials.push(newMat);
      setLocalJSON(MATERIALS_KEY, materials);

      // Trigger automatic learning asset generations (flashcards, minds, summaries, quizzes)
      generateStudyKit(authUserId, newMat);

      // Upgrade User XP points for uploading resource (Gives +35 XP)
      const users = getLocalJSON<any[]>(USERS_KEY, []);
      const idx = users.findIndex(u => u.uid === authUserId);
      if (idx !== -1) {
        users[idx].xp = (users[idx].xp || 0) + 35;
        users[idx].level = Math.floor(users[idx].xp / 100) + 1;
        setLocalJSON(USERS_KEY, users);
      }

      return makeJsonRes(201, { message: 'Bahan belajar berhasil diunggah offline!', material: newMat });
    }

    // 12. PUT /api/materials/:id
    if (path.startsWith('/api/materials/') && method === 'PUT') {
      const id = path.split('/').pop();
      const materials = getLocalJSON<LearningMaterial[]>(MATERIALS_KEY, []);
      const idx = materials.findIndex(m => m.id === id);
      if (idx !== -1) {
        materials[idx] = { ...materials[idx], ...body, updatedAt: new Date().toISOString() };
        setLocalJSON(MATERIALS_KEY, materials);
        return makeJsonRes(200, { message: 'Resource updated.', material: materials[idx] });
      }
      return makeJsonRes(404, { error: 'Material not found.' });
    }

    // 13. DELETE /api/materials/:id
    if (path.startsWith('/api/materials/') && method === 'DELETE') {
      const id = path.split('/').pop();
      const materials = getLocalJSON<LearningMaterial[]>(MATERIALS_KEY, []);
      const filtered = materials.filter(m => m.id !== id);
      setLocalJSON(MATERIALS_KEY, filtered);
      return makeJsonRes(200, { success: true, message: 'Bahan belajar berhasil dihapus.' });
    }

    // 14. GET /api/history
    if (path === '/api/history' && method === 'GET') {
      const history = getLocalJSON<LearningHistory[]>(HISTORY_KEY, []);
      const mine = history.filter(h => h.userId === authUserId);
      return makeJsonRes(200, { history: mine });
    }

    // 15. GET /api/flashcards
    if (path === '/api/flashcards' && method === 'GET') {
      const materialId = url.searchParams.get('materialId') || '';
      const flashcards = getLocalJSON<Flashcard[]>(FLASHCARDS_KEY, []);
      
      let mine = flashcards.filter(f => f.userId === authUserId);
      if (materialId) {
        mine = mine.filter(f => f.materialId === materialId);
      }

      const today = new Date().toISOString().split('T')[0];
      const dueToday = mine.filter(c => c.nextReviewDate <= today);

      const stats = {
        totalCards: mine.length,
        averageRetention: mine.length > 0 ? Math.round(mine.reduce((acc, c) => acc + c.memoryScore, 0) / mine.length) : 85,
        dueToday: dueToday.length
      };

      return makeJsonRes(200, { flashcards: mine, dueToday, stats });
    }

    // 16. PUT /api/flashcards/:id
    if (path.startsWith('/api/flashcards/') && path.endsWith('/favorite') && method === 'PUT') {
      const splitted = path.split('/');
      const id = splitted[splitted.length - 2];
      const flashcards = getLocalJSON<Flashcard[]>(FLASHCARDS_KEY, []);
      const idx = flashcards.findIndex(f => f.id === id);
      if (idx !== -1) {
        flashcards[idx].isFavorite = !flashcards[idx].isFavorite;
        setLocalJSON(FLASHCARDS_KEY, flashcards);
        return makeJsonRes(200, { card: flashcards[idx] });
      }
    } else if (path.startsWith('/api/flashcards/') && method === 'PUT') {
      const id = path.split('/').pop();
      const { memoryScore, difficulty } = body;
      const flashcards = getLocalJSON<Flashcard[]>(FLASHCARDS_KEY, []);
      const idx = flashcards.findIndex(f => f.id === id);
      if (idx !== -1) {
        const ease = difficulty === 'easy' ? 2.8 : difficulty === 'hard' ? 1.8 : 2.4;
        flashcards[idx].reviewCount += 1;
        flashcards[idx].memoryScore = memoryScore || 85;
        flashcards[idx].difficulty = difficulty || 'medium';
        
        // Push due date ahead based on interval
        const interval = Math.max(1, Math.round(flashcards[idx].intervalDays * ease));
        flashcards[idx].intervalDays = interval;
        
        const nextDt = new Date();
        nextDt.setDate(nextDt.getDate() + interval);
        flashcards[idx].nextReviewDate = nextDt.toISOString().split('T')[0];

        setLocalJSON(FLASHCARDS_KEY, flashcards);

        // Feed XP (+12 XP)
        const users = getLocalJSON<any[]>(USERS_KEY, []);
        const uidx = users.findIndex(u => u.uid === authUserId);
        if (uidx !== -1) {
          users[uidx].xp = (users[uidx].xp || 0) + 12;
          users[uidx].level = Math.floor(users[uidx].xp / 100) + 1;
          setLocalJSON(USERS_KEY, users);
        }

        return makeJsonRes(200, { message: 'SRS Metrics synced.', card: flashcards[idx] });
      }
    }

    // 17. GET /api/ai/explanation, summary, mindmap, quiz
    if (path === '/api/ai/summary' && method === 'POST') {
      const { materialId, type } = body;
      const cached = getLocalJSON<AISummary[]>(SUMMARIES_KEY, [])
        .find(s => s.materialId === materialId && s.type === type);
      if (cached) {
        return makeJsonRes(200, { summary: cached });
      }
    }

    if (path === '/api/ai/mindmap' && method === 'POST') {
      const { materialId } = body;
      const cached = getLocalJSON<AIMindMap[]>(MINDMAPS_KEY, [])
        .find(m => m.materialId === materialId);
      if (cached) {
        return makeJsonRes(200, { mindMap: cached });
      }
    }

    if (path === '/api/ai/explanation' && method === 'POST') {
      const { materialId, difficulty } = body;
      const materials = getLocalJSON<LearningMaterial[]>(MATERIALS_KEY, []);
      const mat = materials.find(m => m.id === materialId);
      
      const newExpl: AIExplanation = {
        id: `expl-${Date.now()}`,
        userId: authUserId,
        materialId: materialId,
        difficulty: difficulty || 'beginner',
        content: `### 🧠 Penjelasan Interaktif Sesuai Level: **${(difficulty || 'beginner').toUpperCase()}**\n\nMateri pembahasan: *"${mat?.title || 'Bahan Belajar'}"*\n\n1. **Konsep Sederhana**: Inti dari konsep ini dianalogikan seperti menyusun balok bangunan yang rapi. Setiap bagian memperkokoh bagian atasnya.\n2. **Uraian Kasus**: Dalam kehidupan sehari-hari, ini sama dengan bagaimana kita menghubungkan pengetahuan baru ke struktur data lama yang sudah terbiasa kita gunakan.\n3. **Kesimpulan Guru Socratic**: Teruslah bertanya untuk mendalami materi ini. Bot chat adalah sarana penanya terbaik Anda di panel kanan!`,
        createdAt: new Date().toISOString()
      };

      const explanations = getLocalJSON<AIExplanation[]>(EXPLANATIONS_KEY, []);
      explanations.push(newExpl);
      setLocalJSON(EXPLANATIONS_KEY, explanations);

      return makeJsonRes(200, { explanation: newExpl });
    }

    if (path === '/api/ai/quiz' && method === 'POST') {
      const { materialId } = body;
      const quiz = getLocalJSON<Quiz[]>(QUIZZES_KEY, []).find(q => q.materialId === materialId);
      if (quiz) {
        return makeJsonRes(200, { quiz });
      }
    }

    if (path === '/api/ai/quiz-results' && method === 'POST') {
      const { materialId, score, quizId } = body;
      
      // Update XP (+40 XP for taking quiz)
      const users = getLocalJSON<any[]>(USERS_KEY, []);
      const uidx = users.findIndex(u => u.uid === authUserId);
      if (uidx !== -1) {
        users[uidx].xp = (users[uidx].xp || 0) + 40;
        users[uidx].level = Math.floor(users[uidx].xp / 100) + 1;
        setLocalJSON(USERS_KEY, users);
      }

      // Log quiz history
      const history = getLocalJSON<LearningHistory[]>(HISTORY_KEY, []);
      history.push({
        id: `qz-hist-${Date.now()}`,
        userId: authUserId,
        materialId: materialId,
        activityType: 'Quiz',
        activityTitle: `Menyelesaikan Kuis dengan nilai ${score}/100`,
        metadata: { score },
        createdAt: new Date().toISOString()
      });
      setLocalJSON(HISTORY_KEY, history);

      return makeJsonRes(200, { 
        success: true, 
        review: { 
          passed: score >= 60, 
          message: score >= 80 ? 'Hebat sekali! Pemahaman Anda sangat prima.' : 'Bagus! Silakan ulas kembali beberapa topik salah untuk penguasaan 100%.' 
        } 
      });
    }

    // 18. GET /api/tutor/chat/:materialId and POST /api/tutor/chat/:materialId
    if (path.startsWith('/api/tutor/chat/') && method === 'GET') {
      const materialId = path.split('/').pop() || '';
      const chats = getLocalJSON<Record<string, any[]>>(CHATS_KEY, {});
      return makeJsonRes(200, { history: chats[materialId] || [] });
    }

    if (path.startsWith('/api/tutor/chat/') && method === 'POST') {
      const materialId = path.split('/').pop() || '';
      const { message } = body;
      const chats = getLocalJSON<Record<string, any[]>>(CHATS_KEY, {});
      
      const sessionHistory = chats[materialId] || [];
      const userMessage = { role: 'user', content: message, createdAt: new Date().toISOString() };
      sessionHistory.push(userMessage);

      // Simple keyword triggers for helpful simulated AI answers!
      let reply = `Halo! Saya adalah Mentor Socratic belajar Anda. Saya siap membantu Anda menganalisis bahan belajar ini secara mendalam. Apakah ada konsep khusus yang ingin Anda bahas?`;
      const msgLower = message.toLowerCase();
      
      if (msgLower.includes('jelaskan') || msgLower.includes('maksud') || msgLower.includes('apa itu')) {
        reply = `Pertanyaan yang bagus sekali! Secara teoretis, konsep tersebut mengacu pada susunan struktur data konsep utama. Dalam prakteknya, hal ini membantu kita menyusun korelasi logis yang kuat. Ingin saya buatkan contoh kasus sederhananya?`;
      } else if (msgLower.includes('rumus') || msgLower.includes('hitung') || msgLower.includes('matematika')) {
        reply = `Untuk hitungan materi ini, ingat rumus kuncinya: Nilai Pengetahuan dasar dikalikan jam belajar aktif, lalu disesuaikan dengan kurva retensi memori Anda! Berikan saya angka spesifik jika Anda ingin kita bedah rumusnya bersama.`;
      } else if (msgLower.includes('contoh') || msgLower.includes('praktek')) {
        reply = `Mari kita bayangkan analogi hidup sehari-hari: seperti merawat tanaman hias. Menyiramnya sedikit demi sedikit setiap hari (spaced repetition) jauh lebih sehat dibanding mengguyurnya dengan seember air sekaligus seminggu sekali (belajar kebut semalam).`;
      } else if (msgLower.includes('halo') || msgLower.includes('hai') || msgLower.includes('pagi') || msgLower.includes('siang') || msgLower.includes('sore')) {
        reply = `Halo juga! Senang menemani Anda belajar hari ini. Hubungi saya kapan saja Anda bingung memahami bagian teks tertentu.`;
      }

      const botMessage = { role: 'model', content: reply, createdAt: new Date().toISOString() };
      sessionHistory.push(botMessage);
      
      chats[materialId] = sessionHistory;
      setLocalJSON(CHATS_KEY, chats);

      // Log chat count to learning history
      const history = getLocalJSON<LearningHistory[]>(HISTORY_KEY, []);
      history.push({
        id: `chat-hist-${Date.now()}`,
        userId: authUserId,
        materialId: materialId,
        activityType: 'TutorChat',
        activityTitle: 'Konsultasi Interaktif dengan Mentor Socratic',
        createdAt: new Date().toISOString()
      });
      setLocalJSON(HISTORY_KEY, history);

      return makeJsonRes(200, { reply });
    }

    // 19. GET /api/admin/analytics
    if (path === '/api/admin/analytics' && method === 'GET') {
      const users = getLocalJSON<any[]>(USERS_KEY, []);
      const subjects = getLocalJSON<any[]>(SUBJECTS_KEY, []).length;
      const mCount = getLocalJSON<any[]>(MATERIALS_KEY, []).length;
      const hCount = getLocalJSON<any[]>(HISTORY_KEY, []).length;
      return makeJsonRes(200, {
        stats: {
          totalUsers: users.length,
          totalSubjects: subjects,
          totalMaterials: mCount,
          totalInteractions: hCount,
          activeNow: 1
        }
      });
    }

    // 20. GET /api/admin/users and DELETE /api/admin/users/:uid
    if (path === '/api/admin/users' && method === 'GET') {
      const users = getLocalJSON<any[]>(USERS_KEY, []);
      const safeUsers = users.map(({ passwordHash, ...u }) => u);
      return makeJsonRes(200, { users: safeUsers });
    }

    if (path.startsWith('/api/admin/users/') && method === 'DELETE') {
      const targetUid = path.split('/').pop();
      const users = getLocalJSON<any[]>(USERS_KEY, []);
      const filtered = users.filter(u => u.uid !== targetUid);
      setLocalJSON(USERS_KEY, filtered);
      return makeJsonRes(200, { success: true, message: ' Scholar user deleted from local db.' });
    }

    // 21. GET /api/auth/download-data
    if (path === '/api/auth/download-data' && method === 'GET') {
      const subjects = getLocalJSON<any[]>(SUBJECTS_KEY, []).filter(s => s.userId === authUserId);
      const mList = getLocalJSON<any[]>(MATERIALS_KEY, []).filter(m => m.userId === authUserId);
      const fCards = getLocalJSON<any[]>(FLASHCARDS_KEY, []).filter(f => f.userId === authUserId);
      return makeJsonRes(200, {
        userData: {
          userId: authUserId,
          exportedAt: new Date().toISOString(),
          subjects,
          materials: mList,
          flashcards: fCards
        }
      });
    }

    // 22. DELETE /api/auth/account
    if (path === '/api/auth/account' && method === 'DELETE') {
      const users = getLocalJSON<any[]>(USERS_KEY, []);
      const filtered = users.filter(u => u.uid !== authUserId);
      setLocalJSON(USERS_KEY, filtered);
      return makeJsonRes(200, { success: true, message: 'Account deleted.' });
    }

    // 23. POST /api/ai/flashcards
    if (path === '/api/ai/flashcards' && method === 'POST') {
      const { materialId } = body;
      const flashcards = getLocalJSON<Flashcard[]>(FLASHCARDS_KEY, []);
      const extraCards = [
        { question: 'Apa struktur utama bahasan teori kognitif ini?', answer: 'Yaitu konstruksi pemikiran logis, retensi konseptual dasar, dan korelasi timbal-balik antar gagasan ilmiah.' },
        { question: 'Sebutkan cara menguasai materi ini dengan efisien!', answer: 'Sering mereview kuis pemikiran kritis, dan berdiskusi interaktif lewat bot Socratic.' }
      ];
      extraCards.forEach((ec, idx) => {
        flashcards.push({
          id: `fc-extra-${materialId}-${Date.now()}-${idx}`,
          userId: authUserId,
          materialId: materialId,
          question: ec.question,
          answer: ec.answer,
          difficulty: 'medium',
          isFavorite: false,
          reviewCount: 0,
          memoryScore: 100,
          easeFactor: 2.5,
          intervalDays: 1,
          nextReviewDate: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString()
        });
      });
      setLocalJSON(FLASHCARDS_KEY, flashcards);
      return makeJsonRes(200, { success: true, message: '2 flashcard tambahan sukses dibuat.' });
    }

  } catch (e: any) {
    return makeJsonRes(500, { error: e.message || 'Malfungsi Database Lokal.' });
  }

  return makeJsonRes(404, { error: 'Rute API tidak ditemukan atau tidak didukung.' });
}
