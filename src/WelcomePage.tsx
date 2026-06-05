/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileText, 
  BrainCircuit, 
  Layers, 
  HelpCircle, 
  GraduationCap, 
  Zap, 
  MessageSquare, 
  ArrowRight, 
  CheckCircle,
  Menu,
  X,
  Lock,
  Award,
  Sparkles,
  BarChart4
} from 'lucide-react';

interface WelcomeProps {
  onStart: () => void;
  onLoginClick: () => void;
}

export default function WelcomePage({ onStart, onLoginClick }: WelcomeProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const features = [
    {
      icon: <FileText className="w-6 h-6 text-blue-500" />,
      title: "AI Study Summaries",
      description: "Condense long PDFs, textbook chapters, or web links into highly legible, structured guides of short, medium, or detailed lengths."
    },
    {
      icon: <BrainCircuit className="w-6 h-6 text-green-500" />,
      title: "Interactive Mind Maps",
      description: "Synthesize hierarchical mental maps with automatic zoom and pan controls to grasp structural relations between concepts visually."
    },
    {
      icon: <MessageSquare className="w-6 h-6 text-sky-500" />,
      title: "AI Socratic Tutor Chat",
      description: "Engage in real-time academic dialogue directly on your materials. Prompt questions, demand review examples, or clarify complex equations."
    },
    {
      icon: <Layers className="w-6 h-6 text-purple-500" />,
      title: "AI Quiz Generator",
      description: "Instantly create practice tests featuring Multiple Choice, True/False, and grading AI rubric assays with immediate feedback."
    },
    {
      icon: <Zap className="w-6 h-6 text-amber-500" />,
      title: "Spaced Repetition System",
      description: "Auto-schedule flashcard reviews using 1 to 90-day memory intervals to optimize long-term cognitive memory retention active tracks."
    },
    {
      icon: <BarChart4 className="w-6 h-6 text-rose-500" />,
      title: "Academic Gamification",
      description: "Gain status XP points and level streaks with active study milestones. Unlock badges for steady daily research routines."
    }
  ];

  const pricingTiers = [
    {
      name: "Free Scholar",
      price: "$0",
      description: "Perfect for secondary students getting comfortable with spaced study guidelines.",
      features: [
        "Create up to 3 study subjects",
        "Save 10 learning materials & links",
        "Generate basic summaries & flashcards",
        "Standard Quiz Generator tool",
        "Local device session storage sync"
      ],
      buttonLabel: "Start For Free",
      popular: false
    },
    {
      name: "Pro Mind",
      price: "$9",
      period: "/month",
      description: "Enabling grand-master level toolkits for professional researchers and students.",
      features: [
        "Unlimited custom Subjects workspace",
        "Unlimited Materials storage up to 50MB",
        "Advanced Socratic Tutor conversations",
        "Hierarchical SVG Custom Mind Maps",
        "Spaced Memory interval scheduling",
        "Essay AI-grading rubric assessments",
        "Admin Analytics Dashboard accesses"
      ],
      buttonLabel: "Upgrade To Pro",
      popular: true
    }
  ];

  const faqs = [
    {
      q: "What file formats does StudyMind support?",
      a: "Our learning platform supports PDF, Microsoft Word (DOCX), PowerPoint slides (PPTX), Plain Text (TXT), Markdown documents, notes workspaces, and direct web links imports."
    },
    {
      q: "How does the Spaced Repetition scheduling algorithm work?",
      a: "Based on your self-reported recall difficulty (Easy, Medium, Hard), StudyMind schedules upcoming flashcard reviews at optimized intervals of 1, 3, 7, 14, 30, 60, or 90 days, targeting the peak moment of potential biological forgetting."
    },
    {
      q: "Can StudyMind evaluate complex essay answers?",
      a: "Yes! Using Gemini 3.5-flash reasoning, the Quiz System grades your custom written essay answers against calculated rubrics and delivers comprehensive, structured advise on what criteria and vocabulary you missed."
    },
    {
      q: "Is my personal uploads safe from other users?",
      a: "Absolutely. All subjects, learning summaries, flashcards, chats, and files are protected on our secure local servers and are strictly linked to your unique personal account credentials."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white transition-colors duration-300">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-[600px] overflow-hidden pointer-events-none -z-10 bg-radial-[circle_800px_at_50%_-100px] from-[#1e293b]/50 to-transparent"></div>

      {/* Header Sticky Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img 
              src="/logo.png" 
              alt="StudyMind AI Logo" 
              className="w-9 h-9 rounded-xl object-cover shadow-lg shadow-blue-500/20" 
              referrerPolicy="no-referrer"
            />
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-blue-300 bg-clip-text text-transparent">StudyMind AI</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-slate-400 hover:text-white text-sm transition-colors">Features</a>
            <a href="#pricing" className="text-slate-400 hover:text-white text-sm transition-colors">Pricing</a>
            <a href="#faq" className="text-slate-400 hover:text-white text-sm transition-colors">FAQ</a>
            <button onClick={onLoginClick} className="text-slate-300 hover:text-white text-sm font-medium flex items-center gap-1.5 transition-colors">
              <Lock className="w-3.5 h-3.5" /> Sign In
            </button>
            <button onClick={onStart} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg shadow-blue-600/20 transition-all flex items-center gap-1 hover:gap-2">
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
          </nav>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-slate-400 hover:text-white p-1">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav Overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-900 bg-slate-950 px-4 py-4 space-y-3 absolute w-full left-0 shadow-xl">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-slate-300 hover:text-white py-2">Features</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block text-slate-300 hover:text-white py-2">Pricing</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="block text-slate-300 hover:text-white py-2">FAQ</a>
            <div className="border-t border-slate-900 pt-3 flex flex-col gap-2">
              <button onClick={() => { setMobileMenuOpen(false); onLoginClick(); }} className="w-full text-center py-2 text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg text-sm">
                Sign In
              </button>
              <button onClick={() => { setMobileMenuOpen(false); onStart(); }} className="w-full text-center py-2.5 bg-blue-600 text-white font-medium rounded-lg text-sm">
                Get Started
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Core Section */}
      <section className="relative pt-20 pb-20 px-4 md:px-8 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-950/50 border border-blue-900/40 rounded-full text-xs text-blue-400 font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Accelerated Spacing Memory System
        </div>
        
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none mb-6">
          Learn Faster.<br />
          <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">Remember Longer.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Transform your learning materials into summaries, mind maps, flashcards, quizzes, and personalized AI tutoring.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
          <button onClick={onStart} className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-base font-bold shadow-xl shadow-blue-500/20 active:translate-y-px transition-all flex items-center justify-center gap-2">
            Get Started <ArrowRight className="w-5 h-5 text-white" />
          </button>
          <button onClick={onLoginClick} className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-base font-bold transition-all flex items-center justify-center gap-2">
            <Lock className="w-4 h-4 text-slate-400" /> Log In to Account
          </button>
        </div>

        {/* Dashboard Visual Mock */}
        <div className="mt-16 border border-slate-900 rounded-2xl bg-slate-950/60 p-2 shadow-2xl relative max-w-4xl mx-auto">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
          <div className="rounded-xl border border-slate-900/80 overflow-hidden bg-slate-900/40 divide-y divide-slate-900">
            {/* Top Mock Panel Indicators */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
              </div>
              <span className="text-xs font-mono text-slate-500">studymind-applet-v26.06.local</span>
              <div className="w-14"></div>
            </div>
            {/* Interface Visual Mock */}
            <div className="grid grid-cols-12 h-64 md:h-96">
              {/* Sidebar Mock */}
              <div className="col-span-3 border-r border-slate-900 bg-slate-950/30 p-2.5 hidden sm:flex flex-col gap-2 text-left">
                <div className="h-6 w-3/4 rounded bg-slate-800/40 mb-2"></div>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className={`h-8 rounded flex items-center px-2 gap-2 ${i === 0 ? 'bg-blue-950/40 border border-blue-900/30' : 'bg-transparent'}`}>
                    <div className="w-3.5 h-3.5 rounded bg-slate-800/80"></div>
                    <div className="h-3 w-1/2 rounded bg-slate-800/40"></div>
                  </div>
                ))}
              </div>
              {/* Canvas Visual Mock */}
              <div className="col-span-12 sm:col-span-9 p-6 text-left space-y-6 overflow-hidden">
                <div className="flex justify-between items-center mb-2">
                  <div className="space-y-1">
                    <div className="h-4 w-48 rounded bg-slate-800"></div>
                    <div className="h-2.5 w-32 rounded bg-slate-800/60"></div>
                  </div>
                  <div className="h-8 w-20 rounded-md bg-blue-600/30 border border-blue-600/40"></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-2">
                      <div className="h-6 w-6 rounded bg-blue-500/30"></div>
                      <div className="h-3 w-3/4 rounded bg-slate-800"></div>
                      <div className="h-2 w-1/2 rounded bg-slate-800/60"></div>
                    </div>
                  ))}
                </div>
                <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 text-xs text-slate-400 space-y-2">
                  <div className="h-3 w-32 rounded bg-slate-800 mb-1"></div>
                  <p className="italic">"Explain backpropagation neural nets like I am an intermediate student."</p>
                  <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-lg text-slate-300">
                    Neural networks train utilizing gradients. Backpropagation moves error coordinates recursively backwards through layered nodes to balance scalar weights and parameters properly...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section Grid */}
      <section id="features" className="py-24 border-t border-slate-900 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4 sm:text-4xl text-white">
              Accelerate Your Path To Topic Mastery
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              Every tool in StudyMind is engineered on modern generative AI reasoning layers to eliminate study friction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="group p-6 rounded-2xl border border-slate-900 bg-slate-900/20 hover:border-blue-500/30 hover:bg-slate-900/40 transition-all flex flex-col gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 border-t border-slate-900 bg-slate-950/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white mb-3">Loved by Elite Scholars</h2>
            <p className="text-slate-400">Read stories from researchers, developers, and students around the globe.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                text: "The spaced repetetive scheduling absolutely changed my medical school results. I loaded 2,000 flashcards, set my review difficulty, and watched my recall level soar.",
                author: "Dr. Sarah Jansen",
                role: "Residency Physician"
              },
              {
                text: "I upload long project spec whitepapers and turn them into interactive visual mind maps instantly. The zoom and pan navigation is brilliant and beautiful.",
                author: "Marcus Vance",
                role: "Senior AI Architect"
              },
              {
                text: "The Socratic tutor is remarkable. It does not simply give me simple answers; it forces me to think from basic principles by formulating clever coding quiz challenges.",
                author: "Kai Lin",
                role: "Full-Stack Student"
              }
            ].map((t, i) => (
              <div key={i} className="p-6 rounded-2xl border border-slate-900 bg-slate-950/40 flex flex-col justify-between gap-6 relative">
                <p className="text-slate-300 text-sm leading-relaxed italic">"{t.text}"</p>
                <div className="border-t border-slate-900 pt-4">
                  <h4 className="font-bold text-sm text-white">{t.author}</h4>
                  <span className="text-xs text-blue-400">{t.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Matrix */}
      <section id="pricing" className="py-24 border-t border-slate-900 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white mb-3">Transparent Tiered Pricing</h2>
            <p className="text-slate-400 text-sm">Select the perfect account scale for your personal study needs.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {pricingTiers.map((tier, idx) => (
              <div key={idx} className={`p-8 rounded-2xl border relative flex flex-col justify-between ${tier.popular ? 'border-blue-600 bg-blue-950/10 shadow-2xl shadow-blue-500/5' : 'border-slate-900 bg-slate-950/40'}`}>
                {tier.popular && (
                  <span className="absolute -top-3.5 right-6 bg-blue-600 text-white font-bold text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" /> Most Popular
                  </span>
                )}
                
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{tier.name}</h3>
                  <p className="text-slate-400 text-xs mb-6 leading-relaxed">{tier.description}</p>
                  
                  <div className="flex items-baseline mb-6">
                    <span className="text-4xl font-extrabold text-white">{tier.price}</span>
                    {tier.period && <span className="text-slate-400 text-sm font-medium ml-1">{tier.period}</span>}
                  </div>

                  <hr className="border-slate-900 mb-6" />

                  <ul className="space-y-3 mb-8">
                    {tier.features.map((f, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2 text-sm text-slate-300">
                        <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button onClick={onStart} className={`w-full py-3 rounded-xl font-bold text-sm transition-all shadow-lg ${tier.popular ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/10' : 'bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white'}`}>
                  {tier.buttonLabel}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Sections Accordion */}
      <section id="faq" className="py-24 border-t border-slate-900 bg-slate-950/60 font-sans">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white mb-3">Frequently Asked Questions</h2>
            <p className="text-slate-400 text-sm">Clear insights into our product mechanics.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((f, i) => (
              <div 
                key={i} 
                className="border border-slate-900 rounded-xl overflow-hidden bg-slate-950/40"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full text-left px-6 py-4 flex items-center justify-between text-white font-semibold text-base focus:outline-none"
                >
                  <span>{f.q}</span>
                  <HelpCircle className={`w-4 h-4 text-blue-500 transition-transform ${activeFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {activeFaq === i && (
                  <div className="px-6 pb-5 pt-1 text-slate-400 text-sm leading-relaxed border-t border-slate-900/60 bg-slate-950/20">
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Professional Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-2.5">
              <img 
                src="/logo.png" 
                alt="StudyMind AI Logo" 
                className="w-8 h-8 rounded-lg object-cover shadow-md shadow-blue-500/10" 
                referrerPolicy="no-referrer"
              />
              <span className="font-bold text-lg text-white tracking-tight">StudyMind AI</span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              An intelligent client-centered academic ecosystem optimized for permanent understanding levels.
            </p>
          </div>
          <div className="text-left">
            <h4 className="font-semibold text-sm text-white mb-4">Core Platform</h4>
            <div className="space-y-2.5 text-xs text-slate-400">
              <a href="#features" className="hover:text-blue-400 transition-colors block">AI Summaries</a>
              <a href="#features" className="hover:text-blue-400 transition-colors block">Socratic Active Chats</a>
              <a href="#features" className="hover:text-blue-400 transition-colors block">Spaced Flashcards</a>
              <a href="#features" className="hover:text-blue-400 transition-colors block">Grading Exams</a>
            </div>
          </div>
          <div className="text-left">
            <h4 className="font-semibold text-sm text-white mb-4">Corporate Info</h4>
            <div className="space-y-2.5 text-xs text-slate-400">
              <span className="hover:text-blue-400 cursor-pointer block">Academic Privacy Agreement</span>
              <span className="hover:text-blue-400 cursor-pointer block">API Security Procedures</span>
              <span className="hover:text-blue-400 cursor-pointer block">Terms of Education</span>
              <span className="hover:text-blue-400 cursor-pointer block">SaaS Subscriptions</span>
            </div>
          </div>
          <div className="text-left">
            <h4 className="font-semibold text-sm text-white mb-4">Connect Support</h4>
            <div className="space-y-2.5 text-xs text-slate-400">
              <span className="text-slate-300">support@studymindai.domain</span>
              <span className="text-slate-500 italic block">Active 24/7 Academic Support Channels</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-900 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <span>&copy; {new Date().getFullYear()} StudyMind AI. Incorporating Server-side Gemini AI models. All rights reserved.</span>
          <div className="flex gap-4">
            <span className="hover:text-slate-300 transition-colors cursor-pointer">Security Systems</span>
            <span className="hover:text-slate-300 transition-colors cursor-pointer">Unsplash Images</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
