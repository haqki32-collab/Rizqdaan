import React, { useState } from 'react';
import { convertTextCase } from '../../../services/toolsService';

interface CaseConverterToolProps {
  isUrdu: boolean;
  onCopy: (text: string, msg?: string) => void;
}

export const CaseConverterTool: React.FC<CaseConverterToolProps> = ({ isUrdu, onCopy }) => {
  const [text, setText] = useState('');

  const applyCase = (mode: string) => {
    if (!text) return;
    const res = convertTextCase(text, mode);
    setText(res);
  };

  return (
    <div className="space-y-8" id="case-converter-container">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-900 to-emerald-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-400/20 text-teal-300 border border-teal-400/30">
            🔤 Instant String & Typography Formatter
          </span>
          <span className="text-xs text-teal-200/80">
            {isUrdu ? '1-کلک کیس کنورژن' : 'All 8 Standard Text Formats'}
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
          {isUrdu ? 'ٹیکسٹ کیس کنورٹر اور فارمیٹر' : 'Text Case Converter & Capitalization Formatter'}
        </h2>
        <p className="text-teal-100/90 text-sm sm:text-base max-w-3xl leading-relaxed">
          {isUrdu
            ? 'اپنے متن کو ایک کلک میں UPPERCASE, lowercase, Title Case, Sentence Case, CamelCase اور Clean Spaces میں تبدیل کریں۔'
            : 'Instantly convert any text between UPPERCASE, lowercase, Title Case, Sentence Case, CamelCase, snake_case, and remove duplicate whitespace.'}
        </p>
      </div>

      {/* Main Box */}
      <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-zinc-700/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        {/* Buttons Toolbar */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyCase('sentence')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 rounded-xl text-xs font-semibold transition"
          >
            Sentence case
          </button>
          <button
            type="button"
            onClick={() => applyCase('lower')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 rounded-xl text-xs font-semibold transition"
          >
            lower case
          </button>
          <button
            type="button"
            onClick={() => applyCase('upper')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 rounded-xl text-xs font-semibold transition"
          >
            UPPER CASE
          </button>
          <button
            type="button"
            onClick={() => applyCase('capitalized')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 rounded-xl text-xs font-semibold transition"
          >
            Capitalized Case
          </button>
          <button
            type="button"
            onClick={() => applyCase('alternating')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 rounded-xl text-xs font-semibold transition"
          >
            aLtErNaTiNg cAsE
          </button>
          <button
            type="button"
            onClick={() => applyCase('title')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 rounded-xl text-xs font-semibold transition"
          >
            Title Case
          </button>
          <button
            type="button"
            onClick={() => applyCase('camel')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 rounded-xl text-xs font-semibold transition"
          >
            camelCase
          </button>
          <button
            type="button"
            onClick={() => applyCase('snake')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 rounded-xl text-xs font-semibold transition"
          >
            snake_case
          </button>
          <button
            type="button"
            onClick={() => applyCase('clean_spaces')}
            className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 rounded-xl text-xs font-semibold transition border border-teal-200 dark:border-teal-800"
          >
            ✨ Remove Extra Spaces
          </button>
        </div>

        <textarea
          rows={7}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isUrdu ? 'یہاں اپنا ٹیکسٹ درج کریں اور اوپر دیے گئے بٹنز سے کیس تبدیل کریں...' : 'Type or paste your text here, then click any format button above...'}
          className="w-full p-4 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none leading-relaxed"
        />

        <div className="flex justify-between items-center pt-2">
          <div className="text-xs text-slate-400">
            Characters: {text.length} | Words: {text.trim() ? text.trim().split(/\s+/).length : 0}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onCopy(text, isUrdu ? 'کاپی ہو گیا!' : 'Copied to clipboard!')}
              disabled={!text.trim()}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow transition"
            >
              📋 Copy Result
            </button>
            <button
              type="button"
              onClick={() => setText('')}
              disabled={!text.trim()}
              className="px-3 py-2 text-rose-500 text-xs font-medium hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
