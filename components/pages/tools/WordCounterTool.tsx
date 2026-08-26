import React, { useState, useMemo } from 'react';
import { calculateWordStats, WordStatsResult } from '../../../services/toolsService';

interface WordCounterToolProps {
  isUrdu: boolean;
  onCopy: (text: string, msg?: string) => void;
}

export const WordCounterTool: React.FC<WordCounterToolProps> = ({ isUrdu, onCopy }) => {
  const [text, setText] = useState('');

  const stats: WordStatsResult = useMemo(() => {
    return calculateWordStats(text);
  }, [text]);

  return (
    <div className="space-y-8" id="word-counter-container">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-green-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
            📏 Real-time Text Analytics Engine
          </span>
          <span className="text-xs text-emerald-200/80">
            {isUrdu ? '100% درست اور تیز رفتار' : 'Live Reading & Speaking Calculator'}
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
          {isUrdu ? 'الفاظ اور حروف کا کاؤنٹر (Word & Character Counter)' : 'Live Word & Character Counter with Reading Time'}
        </h2>
        <p className="text-emerald-100/90 text-sm sm:text-base max-w-3xl leading-relaxed">
          {isUrdu
            ? 'الفاظ، حروف (بشمول اور بغیر خالی جگہ)، جملے، پیراگراف اور پڑھنے و بولنے کا وقت لائیو معلوم کریں۔'
            : 'Track word count, character count with/without spaces, sentence count, reading speed, and speaking duration in real-time.'}
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-zinc-700 rounded-2xl p-4 text-center shadow-sm">
          <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-1">Words</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.words}</div>
        </div>
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-zinc-700 rounded-2xl p-4 text-center shadow-sm">
          <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-1">Characters</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-teal-600 dark:text-teal-400">{stats.charactersWithSpaces}</div>
        </div>
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-zinc-700 rounded-2xl p-4 text-center shadow-sm">
          <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-1">No Spaces</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400">{stats.charactersWithoutSpaces}</div>
        </div>
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-zinc-700 rounded-2xl p-4 text-center shadow-sm">
          <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-1">Sentences</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">{stats.sentences}</div>
        </div>
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-zinc-700 rounded-2xl p-4 text-center shadow-sm">
          <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-1">Reading Time</div>
          <div className="text-xl sm:text-2xl font-extrabold text-purple-600 dark:text-purple-400">{stats.readingTimeMinutes} min</div>
        </div>
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-zinc-700 rounded-2xl p-4 text-center shadow-sm">
          <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-1">Speaking Time</div>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400">{stats.speakingTimeMinutes} min</div>
        </div>
      </div>

      {/* Main Text Input */}
      <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-zinc-700/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-3">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-700 pb-3">
          <label className="text-sm font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            {isUrdu ? 'یہاں ٹائپ کریں یا پیسٹ کریں' : 'Type or Paste Text to Count'}
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onCopy(text, isUrdu ? 'متن کاپی ہو گیا!' : 'Text copied!')}
              disabled={!text.trim()}
              className="px-3 py-1 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-lg font-medium transition"
            >
              📋 Copy
            </button>
            <button
              type="button"
              onClick={() => setText('')}
              disabled={!text.trim()}
              className="px-3 py-1 text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg font-medium transition"
            >
              Clear
            </button>
          </div>
        </div>

        <textarea
          rows={8}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isUrdu ? 'یہاں لکھنا شروع کریں...' : 'Type or paste your text here for real-time word counting...'}
          className="w-full p-4 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed"
        />
      </div>
    </div>
  );
};
