'use client';

import React, { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import MultiDocumentSelector from './MultiDocumentSelector';

interface QuizConfigProps {
  onStartQuiz: (config: {
    documentIds: number[];
    questionCount: number;
    questionType: 'multiple_choice' | 'open_ended' | 'mixed';
    difficulty: 'easy' | 'medium' | 'hard';
  }) => void;
  isLoading?: boolean;
}

export const QuizConfig: React.FC<QuizConfigProps> = ({ onStartQuiz, isLoading = false }) => {
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
  const [questionCount, setQuestionCount] = useState(5);
  const [questionType, setQuestionType] = useState<'multiple_choice' | 'open_ended' | 'mixed'>('mixed');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const handleSubmit = () => {
    if (selectedDocuments.length === 0) {
      alert('Seleziona almeno un documento');
      return;
    }

    onStartQuiz({
      documentIds: selectedDocuments,
      questionCount,
      questionType,
      difficulty,
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Crea il Tuo Quiz</h1>
        <p className="text-sm sm:text-base text-gray-300">
          Seleziona i documenti e configura il quiz per testare la tua conoscenza
        </p>
      </div>

      {/* Document Selection */}
      <Card className="p-4 sm:p-6 bg-gray-800/70 backdrop-blur border-white/10 shadow-xl">
        <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
          1. Seleziona i Documenti
        </h2>
        <MultiDocumentSelector
          selectedDocumentIds={selectedDocuments}
          onSelectionChange={setSelectedDocuments}
        />
      </Card>

      {/* Quiz Configuration */}
      <Card className="p-4 sm:p-6 bg-gray-800/70 backdrop-blur border-white/10 shadow-xl">
        <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
          2. Configura il Quiz
        </h2>

        <div className="space-y-4 sm:space-y-6">
          {/* Number of Questions */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Numero di Domande: {questionCount}
            </label>
            <input
              type="range"
              min="3"
              max="20"
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="w-full h-2 rounded-lg bg-white/10 accent-blue-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>3</span>
              <span>20</span>
            </div>
          </div>

          {/* Question Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Tipo di Domande
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              <button
                onClick={() => setQuestionType('multiple_choice')}
                className={`p-3 sm:p-4 rounded-lg border-2 transition-all text-left min-h-[70px] ${
                  questionType === 'multiple_choice'
                    ? 'border-blue-400/60 bg-blue-500/15 shadow-lg shadow-blue-900/40'
                    : 'border-white/10 hover:border-blue-400/40 bg-white/5'
                }`}
              >
                <div className="font-semibold text-white mb-1 text-sm sm:text-base">Risposta Multipla</div>
                <div className="text-xs sm:text-sm text-gray-300">Domande con opzioni A, B, C, D</div>
              </button>

              <button
                onClick={() => setQuestionType('open_ended')}
                className={`p-3 sm:p-4 rounded-lg border-2 transition-all text-left min-h-[70px] ${
                  questionType === 'open_ended'
                    ? 'border-purple-400/60 bg-purple-500/15 shadow-lg shadow-purple-900/40'
                    : 'border-white/10 hover:border-purple-400/40 bg-white/5'
                }`}
              >
                <div className="font-semibold text-white mb-1 text-sm sm:text-base">Risposta Aperta</div>
                <div className="text-xs sm:text-sm text-gray-300">Domande che richiedono spiegazioni</div>
              </button>

              <button
                onClick={() => setQuestionType('mixed')}
                className={`p-3 sm:p-4 rounded-lg border-2 transition-all text-left min-h-[70px] ${
                  questionType === 'mixed'
                    ? 'border-blue-400/60 bg-blue-500/15 shadow-lg shadow-blue-900/40'
                    : 'border-white/10 hover:border-blue-400/40 bg-white/5'
                }`}
              >
                <div className="font-semibold text-white mb-1 text-sm sm:text-base">Misto</div>
                <div className="text-xs sm:text-sm text-gray-300">Combinazione di entrambi i tipi</div>
              </button>
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Livello di Difficoltà
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              <button
                onClick={() => setDifficulty('easy')}
                className={`p-3 sm:p-4 rounded-lg border-2 transition-all text-left min-h-[70px] ${
                  difficulty === 'easy'
                    ? 'border-emerald-400/60 bg-emerald-500/15 shadow-lg shadow-emerald-900/40'
                    : 'border-white/10 hover:border-emerald-400/40 bg-white/5'
                }`}
              >
                <div className="font-semibold text-white mb-1 text-sm sm:text-base">Facile</div>
                <div className="text-xs sm:text-sm text-gray-300">Concetti base e comprensione semplice</div>
              </button>

              <button
                onClick={() => setDifficulty('medium')}
                className={`p-3 sm:p-4 rounded-lg border-2 transition-all text-left min-h-[70px] ${
                  difficulty === 'medium'
                    ? 'border-amber-400/60 bg-amber-500/15 shadow-lg shadow-amber-900/40'
                    : 'border-white/10 hover:border-amber-400/40 bg-white/5'
                }`}
              >
                <div className="font-semibold text-white mb-1 text-sm sm:text-base">Medio</div>
                <div className="text-xs sm:text-sm text-gray-300">Richiede comprensione e analisi</div>
              </button>

              <button
                onClick={() => setDifficulty('hard')}
                className={`p-3 sm:p-4 rounded-lg border-2 transition-all text-left min-h-[70px] ${
                  difficulty === 'hard'
                    ? 'border-rose-400/60 bg-rose-500/15 shadow-lg shadow-rose-900/40'
                    : 'border-white/10 hover:border-rose-400/40 bg-white/5'
                }`}
              >
                <div className="font-semibold text-white mb-1 text-sm sm:text-base">Difficile</div>
                <div className="text-xs sm:text-sm text-gray-300">Domande avanzate e approfondite</div>
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Summary and Start Button */}
      <Card className="p-4 sm:p-6 bg-gradient-to-r from-blue-500/15 via-indigo-500/15 to-transparent border border-blue-400/40 backdrop-blur">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-semibold text-white text-base sm:text-lg">Pronto per Iniziare?</h3>
            <div className="flex flex-wrap gap-x-3 sm:gap-x-4 gap-y-1 text-xs sm:text-sm text-gray-200">
              <span>📄 {selectedDocuments.length} document{selectedDocuments.length !== 1 ? 'i' : 'o'}</span>
              <span>❓ {questionCount} domande</span>
              <span>
                📝{' '}
                {questionType === 'multiple_choice'
                  ? 'Risposta multipla'
                  : questionType === 'open_ended'
                  ? 'Risposta aperta'
                  : 'Misto'}
              </span>
              <span>
                🎯{' '}
                {difficulty === 'easy' ? 'Facile' : difficulty === 'medium' ? 'Medio' : 'Difficile'}
              </span>
            </div>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={selectedDocuments.length === 0 || isLoading}
            isLoading={isLoading}
            size="lg"
            className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 font-semibold shadow-lg shadow-blue-900/40 hover:from-blue-400 hover:to-indigo-400"
          >
            {isLoading ? 'Creazione...' : 'Genera Quiz'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
