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
  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-50 border-green-200';
    if (percentage >= 70) return 'bg-blue-50 border-blue-200';
    if (percentage >= 50) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="space-y-6">
      {/* Score Summary */}
      <Card className={`p-8 border-2 ${getScoreBgColor(scorePercentage)}`}>
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Quiz Completato!</h2>
          
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <div className={`text-5xl font-bold ${getScoreColor(scorePercentage)}`}>
                {Math.round(scorePercentage)}%
              </div>
              <p className="text-sm text-gray-600 mt-2">Punteggio</p>
            </div>
            
            <div className="h-16 w-px bg-gray-300" />
            
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {correctAnswers} / {totalQuestions}
              </div>
              <p className="text-sm text-gray-600 mt-2">Risposte Corrette</p>
            </div>
          </div>

          {overallFeedback && (
            <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Feedback Generale</h3>
              <p className="text-gray-700">{overallFeedback}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Question by Question Review */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900">Revisione Dettagliata</h3>
        
        {corrections.map((correction, index) => (
          <Card
            key={correction.question_id}
            className={`p-6 border-l-4 ${
              correction.is_correct ? 'border-l-green-500 bg-green-50/30' : 'border-l-red-500 bg-red-50/30'
            }`}
          >
            <div className="space-y-4">
              {/* Question Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-600">Domanda {index + 1}</span>
                    {correction.is_correct ? (
                      <span className="flex items-center gap-1 text-sm font-medium text-green-600">
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
                      <span className="flex items-center gap-1 text-sm font-medium text-red-600">
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
                  <h4 className="font-semibold text-gray-900">{correction.question}</h4>
                </div>
                <div className="text-sm font-medium text-gray-600 ml-4">
                  {Math.round(correction.score * 100)}%
                </div>
              </div>

              {/* Answers */}
              <div className="space-y-3">
                <div className="p-3 bg-white rounded-lg border border-gray-200">
                  <p className="text-sm font-medium text-gray-600 mb-1">La tua risposta:</p>
                  <p className="text-gray-900">{correction.user_answer || '(Nessuna risposta)'}</p>
                </div>

                {!correction.is_correct && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-800 mb-1">Risposta corretta:</p>
                    <p className="text-green-900">{correction.correct_answer}</p>
                  </div>
                )}
              </div>

              {/* Explanation */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
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
                    <p className="text-sm font-medium text-blue-900 mb-1">Spiegazione:</p>
                    <p className="text-sm text-blue-800">{correction.explanation}</p>
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
          <Button onClick={onRetry} variant="secondary" size="lg">
            Riprova Quiz
          </Button>
        )}
        {onNewQuiz && (
          <Button onClick={onNewQuiz} variant="primary" size="lg">
            Nuovo Quiz
          </Button>
        )}
      </div>
    </div>
  );
};
