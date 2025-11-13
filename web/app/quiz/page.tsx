'use client';

import React, { useState } from 'react';
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

export default function QuizPage() {
  const router = useRouter();
  const [stage, setStage] = useState<QuizStage>('config');
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [resultsData, setResultsData] = useState<QuizResultsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Errore durante la generazione del quiz');
      console.error('Error generating quiz:', err);
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
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Errore durante l\'invio del quiz');
      console.error('Error submitting quiz:', err);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="w-10 h-10 bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700/50 rounded-lg flex items-center justify-center text-gray-300 hover:text-white transition-all"
                title="Torna alla Dashboard"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">📝</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Quiz Studente</h1>
                <p className="text-gray-400">Testa la tua comprensione dei documenti</p>
              </div>
            </div>
            {stage !== 'config' && (
              <Button onClick={handleNewQuiz} variant="secondary">
                ← Nuovo Quiz
              </Button>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-red-400 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-red-400 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Main Content */}
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
            onRetry={handleRetry}
            onNewQuiz={handleNewQuiz}
          />
        )}
      </div>
    </div>
  );
}
