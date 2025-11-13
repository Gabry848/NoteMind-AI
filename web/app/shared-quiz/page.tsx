'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Quiz } from '@/components/Quiz';
import { QuizResults } from '@/components/QuizResults';
import { quiz as quizApi } from '@/lib/api';

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

export default function SharedQuizPage() {
  const searchParams = useSearchParams();
  const shareToken = searchParams.get('token');
  
  const [stage, setStage] = useState<'loading' | 'quiz' | 'results' | 'error'>('loading');
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [resultsData, setResultsData] = useState<QuizResultsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (shareToken) {
      loadSharedQuiz();
    } else {
      setError('Token di condivisione non valido');
      setStage('error');
    }
  }, [shareToken]);

  const loadSharedQuiz = async () => {
    if (!shareToken) return;

    try {
      setStage('loading');
      const data = await quizApi.getShared(shareToken);
      setQuizData(data);
      setStage('quiz');
    } catch (error: any) {
      console.error('Error loading shared quiz:', error);
      
      if (error.response?.status === 410) {
        setError('Questo quiz è scaduto');
      } else if (error.response?.status === 404) {
        setError('Quiz non trovato o non più disponibile');
      } else {
        setError('Errore durante il caricamento del quiz');
      }
      setStage('error');
    }
  };

  const handleSubmitQuiz = async (answers: { question_id: string; answer: string }[]) => {
    if (!shareToken) return;

    setIsSubmitting(true);
    try {
      const data = await quizApi.submitShared(shareToken, answers);
      setResultsData(data);
      setStage('results');
    } catch (error: any) {
      console.error('Error submitting quiz:', error);
      setError('Errore durante l\'invio delle risposte');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setStage('quiz');
    setResultsData(null);
  };

  if (stage === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🧠</div>
          <p className="text-xl text-gray-300">Caricamento quiz...</p>
        </div>
      </div>
    );
  }

  if (stage === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-red-500/30 p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-white mb-4">Ops!</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Torna alla Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-purple-500/20 blur-[110px]" />
        <div className="absolute bottom-[-140px] left-1/3 h-96 w-96 rounded-full bg-emerald-500/15 blur-[130px]" />
      </div>

      <div className="relative z-10">
        <header className="mx-auto max-w-4xl px-4 sm:px-6 pt-8 sm:pt-14 pb-6">
          <div className="text-center mb-8">
            <div className="inline-block px-4 py-2 bg-blue-500/20 border border-blue-400/30 rounded-full mb-4">
              <span className="text-sm font-semibold text-blue-300">Quiz Condiviso</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Metti alla prova le tue conoscenze
            </h1>
            <p className="text-gray-300">
              Completa questo quiz e scopri il tuo punteggio
            </p>
          </div>

          {quizData && (
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              <div className="px-4 py-2 bg-gray-800/60 border border-gray-700/50 rounded-xl">
                <span className="text-sm text-gray-400">Difficoltà: </span>
                <span className="text-sm font-semibold text-white">
                  {formatDifficulty(quizData.difficulty)}
                </span>
              </div>
              <div className="px-4 py-2 bg-gray-800/60 border border-gray-700/50 rounded-xl">
                <span className="text-sm text-gray-400">Domande: </span>
                <span className="text-sm font-semibold text-white">
                  {quizData.question_count}
                </span>
              </div>
            </div>
          )}
        </header>

        <main className="mx-auto max-w-4xl px-4 sm:px-6 pb-16">
          <div className="rounded-2xl sm:rounded-[28px] border border-white/10 bg-white/5 p-1 shadow-2xl backdrop-blur">
            <div className="rounded-xl sm:rounded-[24px] border border-white/10 bg-gray-800/90 p-6 sm:p-8">
              {stage === 'quiz' && quizData && (
                <Quiz
                  questions={quizData.questions}
                  onSubmit={handleSubmitQuiz}
                  isSubmitting={isSubmitting}
                />
              )}

              {stage === 'results' && resultsData && (
                <QuizResults
                  totalQuestions={resultsData.total_questions}
                  correctAnswers={resultsData.correct_answers}
                  scorePercentage={resultsData.score_percentage}
                  corrections={resultsData.corrections}
                  overallFeedback={resultsData.overall_feedback}
                  onRetry={handleRetry}
                  onNewQuiz={() => {
                    window.location.reload();
                  }}
                />
              )}
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400 mb-2">
              Vuoi creare i tuoi quiz personalizzati?
            </p>
            <a
              href="/"
              className="inline-block text-blue-400 hover:text-blue-300 font-semibold transition-colors"
            >
              Scopri NoteMind AI →
            </a>
          </div>
        </main>
      </div>
    </div>
  );
}
