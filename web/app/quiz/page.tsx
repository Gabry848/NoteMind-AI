'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QuizConfig } from '@/components/QuizConfig';
import { Quiz } from '@/components/Quiz';
import { QuizResults } from '@/components/QuizResults';
import { Button } from '@/components/Button';
import { quiz as quizApi } from '@/lib/api';

type QuizStage = 'config' | 'quiz' | 'results';

interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'open_ended';
  options?: { id: string; text: string }[];
}

interface QuizData {
  quiz_id: string;
  questions: QuizQuestion[];
  question_count: number;
  question_type: string;
  difficulty: string;
}

interface QuestionCorrection {
  question_id: string;
  question: string;
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
  explanation: string;
  score: number;
}

interface QuizResultsData {
  quiz_id: string;
  total_questions: number;
  correct_answers: number;
  score_percentage: number;
  corrections: QuestionCorrection[];
  overall_feedback: string;
}

const STAGE_FLOW: Array<{ id: QuizStage; label: string; icon: string }> = [
  { id: 'config', label: 'Configura', icon: '🧩' },
  { id: 'quiz', label: 'Quiz', icon: '🧠' },
  { id: 'results', label: 'Risultati', icon: '✨' },
];

const STAGE_META: Record<QuizStage, {
  title: string;
  subtitle: string;
  icon: string;
  accent: string;
  tips: Array<{ icon: string; text: string }>;
}> = {
  config: {
    title: 'Configura il tuo quiz',
    subtitle: 'Seleziona i documenti migliori e definisci le regole per un test su misura.',
    icon: '🛠️',
    accent: 'from-blue-500/25 to-indigo-500/10',
    tips: [
      { icon: '📁', text: 'Scegli più documenti per creare domande multi-contesto.' },
      { icon: '🎯', text: 'Regola difficoltà e formato per allenare memoria e ragionamento.' },
      { icon: '⚡', text: 'Più domande equivalgono a un punteggio più accurato.' },
    ],
  },
  quiz: {
    title: 'Quiz in corso',
    subtitle: 'Rispondi con calma, puoi sempre rivedere le domande prima dell’invio.',
    icon: '🚀',
    accent: 'from-purple-500/25 to-pink-500/10',
    tips: [
      { icon: '📝', text: 'Le risposte vengono salvate mentre navighi tra le domande.' },
      { icon: '🔁', text: 'Usa i pallini in fondo per saltare rapidamente alle domande.' },
      { icon: '💡', text: 'Per le risposte aperte focalizzati su concetti e parole chiave.' },
    ],
  },
  results: {
    title: 'Analizza i risultati',
    subtitle: 'Comprendi i punti forti e le aree da ripassare con le correzioni dettagliate.',
    icon: '📊',
    accent: 'from-emerald-500/25 to-teal-500/10',
    tips: [
      { icon: '🔍', text: 'Rivedi spiegazioni e risposte corrette per consolidare gli errori.' },
      { icon: '📈', text: 'Monitora il trend dei punteggi per pianificare il tuo studio.' },
      { icon: '🗂️', text: 'Genera un nuovo quiz sugli stessi documenti per fissare le nozioni.' },
    ],
  },
};

const formatQuestionType = (type: string) => {
  if (type === 'multiple_choice') {
    return 'Risposta multipla';
  }
  if (type === 'open_ended') {
    return 'Risposta aperta';
  }
  return 'Formato misto';
};

const formatDifficulty = (difficulty: string) => {
  switch (difficulty) {
    case 'easy':
      return 'Facile';
    case 'medium':
      return 'Intermedio';
    case 'hard':
      return 'Avanzato';
    default:
      return difficulty;
  }
};

const extractErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object') {
    const maybeError = error as {
      message?: string;
      response?: { data?: { detail?: string } };
    };

    if (maybeError.response?.data?.detail) {
      return maybeError.response.data.detail;
    }

    if (typeof maybeError.message === 'string' && maybeError.message.length > 0) {
      return maybeError.message;
    }
  }

  return fallback;
};

export default function QuizPage() {
  const router = useRouter();
  const [stage, setStage] = useState<QuizStage>('config');
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [resultsData, setResultsData] = useState<QuizResultsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  const stageIndex = STAGE_FLOW.findIndex((step) => step.id === stage);
  const stageMeta = STAGE_META[stage];

  const stageStats = useMemo(() => {
    if (stage === 'quiz' && quizData) {
      return [
        { icon: '❓', label: 'Domande generate', value: `${quizData.question_count}`, helper: 'Totale domande da completare' },
        { icon: '🎚️', label: 'Difficoltà', value: formatDifficulty(quizData.difficulty), helper: 'Livello impostato per questo quiz' },
        { icon: '🧠', label: 'Formato', value: formatQuestionType(quizData.question_type), helper: 'Tipologia di risposta richiesta' },
      ];
    }

    if (stage === 'results' && resultsData) {
      return [
        { icon: '🏆', label: 'Punteggio', value: `${Math.round(resultsData.score_percentage)}%`, helper: 'Percentuale complessiva di successo' },
        { icon: '✅', label: 'Risposte corrette', value: `${resultsData.correct_answers}/${resultsData.total_questions}`, helper: 'Domande in cui hai centrato la risposta' },
        { icon: '🧾', label: 'Correzioni', value: `${resultsData.corrections.length}`, helper: 'Spiegazioni disponibili da rivedere' },
      ];
    }

    return [];
  }, [stage, quizData, resultsData]);

  const handleStartQuiz = async (config: {
    documentIds: number[];
    questionCount: number;
    questionType: 'multiple_choice' | 'open_ended' | 'mixed';
    difficulty: 'easy' | 'medium' | 'hard';
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await quizApi.generate({
        document_ids: config.documentIds,
        question_count: config.questionCount,
        question_type: config.questionType,
        difficulty: config.difficulty,
      });

      setQuizData(data);
      setStage('quiz');
    } catch (error: unknown) {
      const message = extractErrorMessage(error, 'Errore durante la generazione del quiz');
      setError(message);
      console.error('Error generating quiz:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitQuiz = async (answers: { question_id: string; answer: string }[]) => {
    if (!quizData) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await quizApi.submit({
        quiz_id: quizData.quiz_id,
        answers: answers,
      });

      setResultsData(data);
      setStage('results');
    } catch (error: unknown) {
      const message = extractErrorMessage(error, "Errore durante l'invio del quiz");
      setError(message);
      console.error('Error submitting quiz:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewQuiz = () => {
    setStage('config');
    setQuizData(null);
    setResultsData(null);
    setError(null);
  };

  const handleRetry = () => {
    setStage('quiz');
    setResultsData(null);
    setError(null);
  };

  const handleShareQuiz = async () => {
    if (!quizData) return;

    try {
      const shareData = await quizApi.share({
        quiz_id: quizData.quiz_id,
        title: `Quiz - ${quizData.question_count} domande`,
        description: `Difficoltà: ${quizData.difficulty}`,
        expires_in_days: 30,
      });

      setShareToken(shareData.share_token);
      setShowShareDialog(true);
    } catch (error) {
      console.error('Error sharing quiz:', error);
      setError('Errore durante la condivisione del quiz');
    }
  };

  const handleDownloadQuiz = async () => {
    setShowDownloadMenu(true);
  };

  const downloadInFormat = async (format: 'json' | 'markdown' | 'pdf') => {
    if (!quizData) return;

    try {
      if (format === 'json') {
        const data = await quizApi.downloadQuestions(quizData.quiz_id, 'json');
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quiz_${quizData.quiz_id}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        await quizApi.downloadQuestions(quizData.quiz_id, format);
      }
      setShowDownloadMenu(false);
    } catch (error) {
      console.error('Error downloading quiz:', error);
      setError('Errore durante il download');
    }
  };

  const copyShareLink = () => {
    if (!shareToken) return;
    
    const shareUrl = `${window.location.origin}/shared-quiz?token=${shareToken}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Link copiato negli appunti!');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-purple-500/20 blur-[110px]" />
        <div className="absolute bottom-[-140px] left-1/3 h-96 w-96 rounded-full bg-emerald-500/15 blur-[130px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.06),_transparent_55%)]" />
      </div>

      <div className="relative z-10">
        <header className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:px-6 pt-8 sm:pt-14 pb-4 sm:pb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="group inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-gray-300 transition-all hover:-translate-x-1 hover:border-blue-400/60 hover:text-white"
                title="Torna alla dashboard"
                aria-label="Torna alla dashboard"
              >
                <svg
                  className="h-6 w-6 transition-transform group-hover:-translate-x-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div className="flex flex-col">
                <h1 className="mt-2 sm:mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight text-white">
                  Rispondi, impara con il Quiz AI
                </h1>
                <p className="mt-2 sm:mt-3 max-w-2xl text-sm sm:text-base text-gray-300">
                  Un flusso guidato in tre fasi ti accompagna dalla configurazione alla revisione.
                </p>
              </div>
            </div>

            {stage !== 'config' && (
              <Button
                onClick={handleNewQuiz}
                variant="secondary"
                className="group flex items-center gap-2 text-sm font-semibold"
              >
                <span className="text-lg transition-transform group-hover:rotate-180">↺</span>
                <span className="hidden sm:inline">Nuovo Quiz</span>
                <span className="sm:hidden">Nuovo</span>
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {STAGE_FLOW.map((step, index) => {
              const isActive = stage === step.id;
              const isCompleted = stageIndex > index;
              const baseClasses = 'flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition-all';
              const stateClasses = isActive
                ? 'border-blue-400/60 bg-blue-500/15 text-white shadow-[0_0_20px_rgba(59,130,246,0.25)]'
                : isCompleted
                ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
                : 'border-white/10 bg-white/5 text-gray-400';

              return (
                <React.Fragment key={step.id}>
                  <div className={`${baseClasses} ${stateClasses}`}>
                    <span className="text-lg">{step.icon}</span>
                    <span className="font-semibold uppercase tracking-[0.25em] text-xs sm:text-sm">
                      {step.label}
                    </span>
                  </div>
                  {index < STAGE_FLOW.length - 1 && (
                    <div className="hidden h-px flex-1 min-w-[40px] bg-gradient-to-r from-white/10 via-white/20 to-transparent md:block" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </header>

        <main className="mx-auto grid max-w-6xl gap-4 sm:gap-6 lg:gap-8 px-4 sm:px-6 pb-8 sm:pb-16 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <section className="space-y-4 sm:space-y-6">
            {error && (
              <div className="rounded-xl sm:rounded-2xl border border-rose-400/40 bg-rose-500/15 p-3 sm:p-4 text-rose-100 shadow-lg">
                <div className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200">Errore</h3>
                    <p className="mt-1 text-sm text-rose-100 lg:text-base">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-2xl sm:rounded-[28px] border border-white/10 bg-white/5 p-1 shadow-2xl backdrop-blur">
              <div className="rounded-xl sm:rounded-[24px] border border-white/10 bg-gray-800/90 p-4 sm:p-6 lg:p-8">
                {stage === 'config' && (
                  <QuizConfig onStartQuiz={handleStartQuiz} isLoading={isLoading} />
                )}

                {stage === 'quiz' && quizData && (
                  <Quiz
                    questions={quizData.questions}
                    onSubmit={handleSubmitQuiz}
                    isSubmitting={isLoading}
                  />
                )}

                {stage === 'results' && resultsData && (
                  <QuizResults
                    totalQuestions={resultsData.total_questions}
                    correctAnswers={resultsData.correct_answers}
                    scorePercentage={resultsData.score_percentage}
                    corrections={resultsData.corrections}
                    overallFeedback={resultsData.overall_feedback}
                    quizId={quizData?.quiz_id}
                    onRetry={handleRetry}
                    onNewQuiz={handleNewQuiz}
                    onShare={handleShareQuiz}
                    onDownload={handleDownloadQuiz}
                  />
                )}
              </div>
            </div>
          </section>

          <aside className="space-y-4 sm:space-y-6">
            <div className={`overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-gradient-to-br ${stageMeta.accent} p-4 sm:p-6 lg:p-7 backdrop-blur` }>
              <div className="flex items-start gap-4">
                <span className="text-3xl" aria-hidden>{stageMeta.icon}</span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gray-300">Stato attuale</p>
                  <h2 className="mt-2 text-xl font-semibold text-white sm:text-2xl">{stageMeta.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-gray-100/85">
                    {stageMeta.subtitle}
                  </p>
                </div>
              </div>

              <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
                {stageMeta.tips.map((tip, index) => (
                  <div
                    key={`${tip.icon}-${index}`}
                    className="flex items-start gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border border-white/10 bg-gray-800/70 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-200"
                  >
                    <span className="mt-0.5 text-lg" aria-hidden>{tip.icon}</span>
                    <p className="leading-relaxed">{tip.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {stageStats.length > 0 && (
              <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-gray-800/80 p-4 sm:p-6 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gray-400">Metriche rapide</p>
                <div className="mt-4 sm:mt-5 space-y-3 sm:space-y-4">
                  {stageStats.map((stat) => (
                    <div
                      key={stat.label}
                      className="flex items-start justify-between gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl" aria-hidden>{stat.icon}</span>
                        <div className="leading-tight">
                          <p className="text-[0.65rem] uppercase tracking-[0.3em] text-gray-400">{stat.label}</p>
                          <p className="mt-1 text-lg font-semibold text-white">{stat.value}</p>
                        </div>
                      </div>
                      {stat.helper && (
                        <p className="max-w-[180px] text-right text-xs leading-snug text-gray-400">{stat.helper}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </main>
      </div>

      {/* Share Dialog */}
      {showShareDialog && shareToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Condividi Quiz</h3>
              <button
                onClick={() => setShowShareDialog(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-gray-300 mb-4">
              Copia questo link per condividere il quiz con altre persone. Non è richiesta l'autenticazione.
            </p>

            <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 mb-4 break-all">
              <code className="text-sm text-blue-300">
                {`${window.location.origin}/shared-quiz?token=${shareToken}`}
              </code>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={copyShareLink}
                variant="primary"
                className="flex-1"
              >
                <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copia Link
              </Button>
              <Button
                onClick={() => setShowShareDialog(false)}
                variant="secondary"
              >
                Chiudi
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Download Format Dialog */}
      {showDownloadMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Scegli formato</h3>
              <button
                onClick={() => setShowDownloadMenu(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-gray-300 mb-6">
              Seleziona il formato per scaricare le domande del quiz:
            </p>

            <div className="space-y-3">
              <button
                onClick={() => downloadInFormat('pdf')}
                className="w-full flex items-center gap-4 p-4 bg-red-500/10 border border-red-400/40 rounded-xl hover:bg-red-500/20 transition-colors text-left"
              >
                <svg className="w-8 h-8 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
                <div>
                  <div className="font-semibold text-white">PDF</div>
                  <div className="text-sm text-gray-400">Formato stampabile professionale</div>
                </div>
              </button>

              <button
                onClick={() => downloadInFormat('markdown')}
                className="w-full flex items-center gap-4 p-4 bg-blue-500/10 border border-blue-400/40 rounded-xl hover:bg-blue-500/20 transition-colors text-left"
              >
                <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                <div>
                  <div className="font-semibold text-white">Markdown</div>
                  <div className="text-sm text-gray-400">Testo formattato modificabile</div>
                </div>
              </button>

              <button
                onClick={() => downloadInFormat('json')}
                className="w-full flex items-center gap-4 p-4 bg-green-500/10 border border-green-400/40 rounded-xl hover:bg-green-500/20 transition-colors text-left"
              >
                <svg className="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <div>
                  <div className="font-semibold text-white">JSON</div>
                  <div className="text-sm text-gray-400">Dati strutturati per sviluppatori</div>
                </div>
              </button>
            </div>

            <div className="mt-4">
              <Button
                onClick={() => setShowDownloadMenu(false)}
                variant="secondary"
                className="w-full"
              >
                Annulla
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
