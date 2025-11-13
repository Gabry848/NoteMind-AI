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
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white">Crea il Tuo Quiz</h1>
        <p className="text-gray-400">
          Seleziona i documenti e configura il quiz per testare la tua conoscenza
        </p>
      </div>

      {/* Document Selection */}
      <Card className="p-6 bg-gradient-to-br from-gray-800/80 to-gray-800/60 backdrop-blur-sm border-gray-700/50 shadow-xl">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="text-xl">📄</span>
          1. Seleziona i Documenti
        </h2>
        <MultiDocumentSelector
          selectedDocumentIds={selectedDocuments}
          onSelectionChange={setSelectedDocuments}
        />
      </Card>

      {/* Quiz Configuration */}
      <Card className="p-6 bg-gradient-to-br from-gray-800/80 to-gray-800/60 backdrop-blur-sm border-gray-700/50 shadow-xl">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="text-xl">⚙️</span>
          2. Configura il Quiz
        </h2>
        
        <div className="space-y-6">
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
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => setQuestionType('multiple_choice')}
                className={`p-4 rounded-lg border-2 transition-all text-left hover:scale-105 ${
                  questionType === 'multiple_choice'
                    ? 'border-blue-500 bg-gradient-to-br from-blue-500/30 to-blue-600/20 shadow-lg shadow-blue-500/20'
                    : 'border-gray-700 hover:border-gray-600 bg-gray-800/50 hover:bg-gray-800/70'
                }`}
              >
                <div className="font-semibold text-white mb-1 flex items-center gap-2">
                  <span>🔴</span> Risposta Multipla
                </div>
                <div className="text-sm text-gray-400">Domande con opzioni A, B, C, D</div>
              </button>

              <button
                onClick={() => setQuestionType('open_ended')}
                className={`p-4 rounded-lg border-2 transition-all text-left hover:scale-105 ${
                  questionType === 'open_ended'
                    ? 'border-purple-500 bg-gradient-to-br from-purple-500/30 to-purple-600/20 shadow-lg shadow-purple-500/20'
                    : 'border-gray-700 hover:border-gray-600 bg-gray-800/50 hover:bg-gray-800/70'
                }`}
              >
                <div className="font-semibold text-white mb-1 flex items-center gap-2">
                  <span>✍️</span> Risposta Aperta
                </div>
                <div className="text-sm text-gray-400">Domande che richiedono spiegazioni</div>
              </button>

              <button
                onClick={() => setQuestionType('mixed')}
                className={`p-4 rounded-lg border-2 transition-all text-left hover:scale-105 ${
                  questionType === 'mixed'
                    ? 'border-cyan-500 bg-gradient-to-br from-cyan-500/30 to-cyan-600/20 shadow-lg shadow-cyan-500/20'
                    : 'border-gray-700 hover:border-gray-600 bg-gray-800/50 hover:bg-gray-800/70'
                }`}
              >
                <div className="font-semibold text-white mb-1 flex items-center gap-2">
                  <span>🎲</span> Misto
                </div>
                <div className="text-sm text-gray-400">Combinazione di entrambi i tipi</div>
              </button>
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Livello di Difficoltà
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => setDifficulty('easy')}
                className={`p-4 rounded-lg border-2 transition-all text-left hover:scale-105 ${
                  difficulty === 'easy'
                    ? 'border-green-500 bg-gradient-to-br from-green-500/30 to-green-600/20 shadow-lg shadow-green-500/20'
                    : 'border-gray-700 hover:border-gray-600 bg-gray-800/50 hover:bg-gray-800/70'
                }`}
              >
                <div className="font-semibold text-white mb-1 flex items-center gap-2">
                  <span>😊</span> Facile
                </div>
                <div className="text-sm text-gray-400">Concetti base e comprensione semplice</div>
              </button>

              <button
                onClick={() => setDifficulty('medium')}
                className={`p-4 rounded-lg border-2 transition-all text-left hover:scale-105 ${
                  difficulty === 'medium'
                    ? 'border-yellow-500 bg-gradient-to-br from-yellow-500/30 to-yellow-600/20 shadow-lg shadow-yellow-500/20'
                    : 'border-gray-700 hover:border-gray-600 bg-gray-800/50 hover:bg-gray-800/70'
                }`}
              >
                <div className="font-semibold text-white mb-1 flex items-center gap-2">
                  <span>🤔</span> Medio
                </div>
                <div className="text-sm text-gray-400">Richiede comprensione e analisi</div>
              </button>

              <button
                onClick={() => setDifficulty('hard')}
                className={`p-4 rounded-lg border-2 transition-all text-left hover:scale-105 ${
                  difficulty === 'hard'
                    ? 'border-red-500 bg-gradient-to-br from-red-500/30 to-red-600/20 shadow-lg shadow-red-500/20'
                    : 'border-gray-700 hover:border-gray-600 bg-gray-800/50 hover:bg-gray-800/70'
                }`}
              >
                <div className="font-semibold text-white mb-1 flex items-center gap-2">
                  <span>🔥</span> Difficile
                </div>
                <div className="text-sm text-gray-400">Domande avanzate e approfondite</div>
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Summary and Start Button */}
      <Card className="p-6 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 border-2 border-emerald-500/40 backdrop-blur-sm shadow-xl shadow-emerald-500/10">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <span>🚀</span> Pronto per Iniziare?
            </h3>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-300">
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
          >
            {isLoading ? 'Creazione Quiz...' : 'Genera Quiz'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
