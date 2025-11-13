'use client';

import React from 'react';
import { Card } from './Card';
import { Button } from './Button';

interface QuestionCorrection {
  question_id: string;
  question: string;
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
  explanation: string;
  score: number;
}

interface QuizResultsProps {
  totalQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
  corrections: QuestionCorrection[];
  overallFeedback: string;
  onRetry?: () => void;
  onNewQuiz?: () => void;
}

export const QuizResults: React.FC<QuizResultsProps> = ({
  totalQuestions,
  correctAnswers,
  scorePercentage,
  corrections,
  overallFeedback,
  onRetry,
  onNewQuiz,
}) => {
  const getScoreTheme = (percentage: number) => {
    if (percentage >= 90) {
      return {
        card: 'border-emerald-400/40 bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-transparent shadow-emerald-900/40',
        value: 'text-emerald-300',
        chip: 'bg-emerald-500/15 text-emerald-200',
      };
    }

    if (percentage >= 70) {
      return {
        card: 'border-blue-400/40 bg-gradient-to-br from-blue-500/20 via-blue-500/10 to-transparent shadow-blue-900/40',
        value: 'text-blue-300',
        chip: 'bg-blue-500/15 text-blue-200',
      };
    }

    if (percentage >= 50) {
      return {
        card: 'border-amber-400/40 bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-transparent shadow-amber-900/40',
        value: 'text-amber-300',
        chip: 'bg-amber-500/15 text-amber-200',
      };
    }

    return {
      card: 'border-rose-400/40 bg-gradient-to-br from-rose-500/25 via-rose-500/10 to-transparent shadow-rose-900/40',
      value: 'text-rose-300',
      chip: 'bg-rose-500/15 text-rose-200',
    };
  };

  const scoreTheme = getScoreTheme(scorePercentage);

  return (
    <div className="space-y-6">
      {/* Score Summary */}
      <Card className={`relative overflow-hidden rounded-3xl border px-6 py-8 sm:px-10 sm:py-10 text-gray-100 shadow-xl ${scoreTheme.card}`}>
        <div className="absolute inset-y-0 right-[-120px] hidden w-[320px] rounded-l-full bg-white/5 blur-3xl lg:block" aria-hidden></div>
        <div className="relative z-10 text-center space-y-6">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Quiz completato!</h2>

          <div className="flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-12">
            <div className="text-center">
              <div className={`text-5xl font-bold sm:text-6xl ${scoreTheme.value}`}>
                {Math.round(scorePercentage)}%
              </div>
              <p className="mt-2 text-sm uppercase tracking-[0.3em] text-gray-300">Punteggio</p>
            </div>

            <div className="hidden h-20 w-px bg-white/20 sm:block" />

            <div className="text-center">
              <div className="text-3xl font-bold text-white sm:text-4xl">
                {correctAnswers} / {totalQuestions}
              </div>
              <p className="mt-2 text-sm uppercase tracking-[0.3em] text-gray-300">Risposte corrette</p>
            </div>
          </div>

          {overallFeedback && (
            <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-5 text-left shadow-lg">
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl text-lg ${scoreTheme.chip}`} aria-hidden>
                  💬
                </span>
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-300">Feedback generale</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-100/85">{overallFeedback}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Question by Question Review */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white">Revisione dettagliata</h3>

        {corrections.map((correction, index) => (
          <Card
            key={correction.question_id}
            className={`p-6 rounded-3xl border ${
              correction.is_correct
                ? 'border-emerald-400/40 bg-emerald-500/10'
                : 'border-rose-400/40 bg-rose-500/10'
            } shadow-lg shadow-black/30`}
          >
            <div className="space-y-4">
              {/* Question Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-200">Domanda {index + 1}</span>
                    {correction.is_correct ? (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-medium text-emerald-200">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Corretta
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-rose-500/15 px-3 py-1 text-sm font-medium text-rose-200">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Errata
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-white">{correction.question}</h4>
                </div>
                <div className="ml-4 text-sm font-medium text-gray-200">
                  {Math.round(correction.score * 100)}%
                </div>
              </div>

              {/* Answers */}
              <div className="space-y-3">
                <div className="rounded-2xl border border-white/10 bg-[#0B1327]/70 p-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.3em] text-gray-300">La tua risposta</p>
                  <p className="text-sm leading-relaxed text-gray-100/90">{correction.user_answer || '(Nessuna risposta)'}</p>
                </div>

                {!correction.is_correct && (
                  <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">Risposta corretta</p>
                    <p className="text-sm font-medium text-emerald-100">{correction.correct_answer}</p>
                  </div>
                )}
              </div>

              {/* Explanation */}
              <div className="rounded-2xl border border-blue-400/30 bg-blue-500/10 p-4">
                <div className="flex items-start gap-2">
                  <svg
                    className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-200"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-[0.3em] text-blue-200">Spiegazione</p>
                    <p className="text-sm leading-relaxed text-blue-100/90">{correction.explanation}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center pt-4">
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="secondary"
            size="lg"
            className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-gray-100 hover:border-blue-400/40 hover:bg-blue-500/10"
          >
            Riprova Quiz
          </Button>
        )}
        {onNewQuiz && (
          <Button
            onClick={onNewQuiz}
            variant="primary"
            size="lg"
            className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-3 font-semibold shadow-lg shadow-blue-900/40 hover:from-blue-400 hover:to-indigo-400"
          >
            Nuovo Quiz
          </Button>
        )}
      </div>
    </div>
  );
};
