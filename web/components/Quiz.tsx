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
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1 bg-gray-700/50 rounded-full h-3 shadow-inner">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full transition-all duration-300 shadow-lg"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
        <span className="text-sm text-gray-300 font-medium min-w-fit bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700/50">
          {currentQuestionIndex + 1} / {questions.length}
        </span>
      </div>

      {/* Question Card */}
      <Card className="p-6 bg-gradient-to-br from-gray-800/80 to-gray-800/60 backdrop-blur-sm border-gray-700/50 shadow-xl">
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium text-emerald-400 bg-gradient-to-r from-emerald-500/30 to-teal-500/30 px-3 py-1 rounded-full border border-emerald-500/50">
                <span className="mr-1">❓</span> Domanda {currentQuestionIndex + 1}
              </span>
              <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded border border-gray-600/50">
                {currentQuestion.type === 'multiple_choice' ? 'Risposta multipla' : 'Risposta aperta'}
              </span>
            </div>
            <h3 className="text-xl font-semibold text-white">{currentQuestion.question}</h3>
          </div>

          {/* Multiple Choice Options */}
          {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
            <div className="space-y-3">
              {currentQuestion.options.map((option) => (
                <label
                  key={option.id}
                  className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all hover:scale-[1.02] ${
                    currentAnswer === option.id
                      ? 'border-emerald-500 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 shadow-lg shadow-emerald-500/20'
                      : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50 bg-gray-800/30'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option.id}
                    checked={currentAnswer === option.id}
                    onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                    className="mt-1 w-4 h-4 text-emerald-500 bg-gray-700 border-gray-600"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-white">{option.id}.</span>{' '}
                    <span className="text-gray-300">{option.text}</span>
                  </div>
                </label>
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
                className="w-full h-40 p-4 border-2 border-gray-700 bg-gray-800/50 text-white rounded-lg focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none placeholder-gray-500 transition-all"
              />
              <p className="text-sm text-gray-400 mt-2">
                {currentAnswer.length} caratteri
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        <Button
          onClick={handlePrevious}
          disabled={isFirstQuestion}
          variant="secondary"
        >
          ← Precedente
        </Button>

        <div className="flex gap-2">
          {questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                index === currentQuestionIndex
                  ? 'bg-emerald-500 w-6 shadow-lg shadow-emerald-500/50'
                  : answers[questions[index].id]
                  ? 'bg-teal-500 shadow-md shadow-teal-500/50'
                  : 'bg-gray-700'
              }`}
              aria-label={`Vai alla domanda ${index + 1}`}
            />
          ))}
        </div>

        {!isLastQuestion ? (
          <Button onClick={handleNext} disabled={!hasAnswer}>
            Successiva →
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || Object.keys(answers).length < questions.length}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? 'Invio in corso...' : 'Invia Quiz'}
          </Button>
        )}
      </div>

      {/* Answer Summary */}
      <Card className="p-4 bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">
            Risposte completate: <span className="font-semibold text-white">{Object.keys(answers).length}</span> su{' '}
            <span className="font-semibold text-white">{questions.length}</span>
          </span>
          {Object.keys(answers).length < questions.length && (
            <span className="text-amber-400 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Alcune domande non hanno risposta
            </span>
          )}
        </div>
      </Card>
    </div>
  );
};
