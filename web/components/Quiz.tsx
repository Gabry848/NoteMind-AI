'use client';

import React, { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';

interface QuizOption {
  id: string;
  text: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'open_ended';
  options?: QuizOption[];
}

interface QuizProps {
  questions: QuizQuestion[];
  onSubmit: (answers: { question_id: string; answer: string }[]) => void;
  isSubmitting?: boolean;
}

export const Quiz: React.FC<QuizProps> = ({ questions, onSubmit, isSubmitting = false }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleNext = () => {
    if (!isLastQuestion) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstQuestion) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    const answerArray = questions.map((q) => ({
      question_id: q.id,
      answer: answers[q.id] || '',
    }));
    onSubmit(answerArray);
  };

  const currentAnswer = answers[currentQuestion.id] || '';
  const hasAnswer = currentAnswer.trim() !== '';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Progress Bar */}
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex-1 h-2 rounded-full bg-white/10">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
        <span className="text-xs sm:text-sm text-gray-300 font-medium min-w-fit">
          {currentQuestionIndex + 1} / {questions.length}
        </span>
      </div>

      {/* Question Card */}
      <Card className="p-4 sm:p-6 bg-[#0B1327]/70 backdrop-blur border-white/10 shadow-xl">
        <div className="space-y-4 sm:space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="rounded-full bg-blue-500/15 px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-blue-300">
                Domanda {currentQuestionIndex + 1}
              </span>
              <span className="rounded px-2 py-1 text-xs text-gray-300 bg-white/5">
                {currentQuestion.type === 'multiple_choice' ? 'Multipla' : 'Aperta'}
              </span>
            </div>
            <h3 className="text-base sm:text-xl font-semibold text-white leading-relaxed">{currentQuestion.question}</h3>
          </div>

          {/* Multiple Choice Options */}
          {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
            <div className="space-y-2 sm:space-y-3">
              {currentQuestion.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleAnswer(currentQuestion.id, option.id)}
                  className={`w-full flex items-start gap-3 p-3 sm:p-4 border-2 rounded-lg transition-all text-left ${
                    currentAnswer === option.id
                      ? 'border-blue-400/60 bg-blue-500/15 shadow-lg shadow-blue-900/40'
                      : 'border-white/10 bg-white/5 hover:border-blue-400/40 hover:bg-blue-500/10 active:bg-blue-500/20'
                  }`}
                >
                  <div className={`flex-shrink-0 mt-0.5 w-5 h-5 sm:w-4 sm:h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                    currentAnswer === option.id
                      ? 'border-blue-400 bg-blue-500'
                      : 'border-white/20 bg-[#0B1327]/70'
                  }`}>
                    {currentAnswer === option.id && (
                      <div className="w-2 h-2 sm:w-2 sm:h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-white text-sm sm:text-base">{option.id}.</span>{' '}
                    <span className="text-gray-300 text-sm sm:text-base">{option.text}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Open Ended Answer */}
          {currentQuestion.type === 'open_ended' && (
            <div>
              <textarea
                value={currentAnswer}
                onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                placeholder="Scrivi la tua risposta qui..."
                className="min-h-[120px] sm:h-40 w-full resize-none rounded-lg border-2 border-white/10 bg-[#0B1327]/70 p-3 sm:p-4 text-sm sm:text-base text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
              />
              <p className="text-xs sm:text-sm text-gray-400 mt-2">
                {currentAnswer.length} caratteri
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <Button
          onClick={handlePrevious}
          disabled={isFirstQuestion}
          variant="secondary"
          className="order-2 sm:order-1 rounded-xl border border-white/10 bg-white/5 px-4 sm:px-5 py-3 sm:py-2 text-sm sm:text-base font-semibold text-gray-100 hover:border-blue-400/40 hover:bg-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] sm:min-h-0"
        >
          ← Precedente
        </Button>

        {/* Question Indicators - Hidden on small mobile */}
        <div className="hidden sm:flex order-3 gap-2 justify-center">
          {questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                index === currentQuestionIndex
                  ? 'bg-blue-500 w-6'
                  : answers[questions[index].id]
                  ? 'bg-green-500'
                  : 'bg-gray-700'
              }`}
              aria-label={`Vai alla domanda ${index + 1}`}
            />
          ))}
        </div>

        {!isLastQuestion ? (
          <Button
            onClick={handleNext}
            disabled={!hasAnswer}
            className="order-1 sm:order-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-4 sm:px-5 py-3 sm:py-2 text-sm sm:text-base font-semibold shadow-lg shadow-blue-900/40 hover:from-blue-400 hover:to-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-600 disabled:to-gray-700 min-h-[48px] sm:min-h-0"
          >
            Successiva →
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || Object.keys(answers).length < questions.length}
            className="order-1 sm:order-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 sm:px-5 py-3 sm:py-2 text-sm sm:text-base font-semibold shadow-lg shadow-emerald-900/40 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-600 disabled:to-gray-700 min-h-[48px] sm:min-h-0"
          >
            {isSubmitting ? 'Invio...' : 'Invia Quiz'}
          </Button>
        )}
      </div>

      {/* Answer Summary */}
      <Card className="p-3 sm:p-4 bg-[#0B1327]/70 backdrop-blur border-white/10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs sm:text-sm">
          <span className="text-gray-400">
            Risposte: <span className="font-semibold text-white">{Object.keys(answers).length}</span> /{' '}
            <span className="font-semibold text-white">{questions.length}</span>
          </span>
          {Object.keys(answers).length < questions.length && (
            <span className="flex items-center gap-1 text-amber-300"></span>
          )}
        </div>
      </Card>
    </div>
  );
};
