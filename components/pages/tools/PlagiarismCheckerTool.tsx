import React, { useState } from 'react';
import { analyzePlagiarismPro, rewriteTextPro, PlagiarismResult } from '../../../services/toolsService';

interface PlagiarismCheckerToolProps {
  isUrdu: boolean;
  onCopy: (text: string, msg?: string) => void;
}

export const PlagiarismCheckerTool: React.FC<PlagiarismCheckerToolProps> = ({ isUrdu, onCopy }) => {
  const [inputText, setInputText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isHumanizing, setIsHumanizing] = useState(false);
  const [result, setResult] = useState<PlagiarismResult | null>(null);
  const [humanizedText, setHumanizedText] = useState<string | null>(null);
  const [humanizeMode, setHumanizeMode] = useState<'humanize' | 'fluent' | 'academic' | 'urdu_polish' | 'roman_urdu'>('humanize');

  const handleScan = () => {
    if (!inputText.trim()) return;
    setIsScanning(true);
    setHumanizedText(null);
    setTimeout(() => {
      const res = analyzePlagiarismPro(inputText);
      setResult(res);
      setIsScanning(false);
    }, 600);
  };

  const handleHumanize = async () => {
    if (!inputText.trim()) return;
    setIsHumanizing(true);
    try {
      const rewritten = await rewriteTextPro(inputText, humanizeMode);
      setHumanizedText(rewritten);
    } catch (e) {
      console.error(e);
    } finally {
      setIsHumanizing(false);
    }
  };

  return (
    <div className="space-y-8" id="plagiarism-checker-container">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-400/20 text-blue-300 border border-blue-400/30">
            🔍 AI Detection & Plagiarism Auditor
          </span>
          <span className="text-xs text-blue-200/80">
            {isUrdu ? '100% مفت اور فوری رپورٹ' : '100% Free, Unlimited & Instant'}
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
          {isUrdu ? 'پلیجرازم اور اے آئی ڈیٹیکٹر (100% اوریجنل مواد کا چیکر)' : 'Free Online Plagiarism Checker & AI Detection Scanner'}
        </h2>
        <p className="text-blue-100/90 text-sm sm:text-base max-w-3xl leading-relaxed">
          {isUrdu
            ? 'اپنے مضامین، اسائنمنٹس، بلاگ پوسٹس اور پروڈکٹ ڈسکرپشنز کو پلیجرازم، مشابہت اور اے آئی کے مشینی پن کے لیے اسکین کریں اور 1 کلک میں 100% اوریجنل بنائیں۔'
            : 'Audit articles, academic thesis, product listings, and blog content for duplicate patterns, cliché structures, and AI likelihood.'}
        </p>
      </div>

      {/* Input Area */}
      <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-zinc-700/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-700 pb-3">
          <label className="text-sm font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            {isUrdu ? 'متن درج کریں یا پیسٹ کریں' : 'Paste Your Text / Article Below (English, Urdu, Roman Urdu)'}
          </label>
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-zinc-400 font-medium">
            <span>Words: <strong>{inputText.trim() ? inputText.trim().split(/\s+/).length : 0}</strong></span>
            <span>•</span>
            <span>Chars: <strong>{inputText.length}</strong></span>
            {inputText.length > 0 && (
              <button 
                type="button" 
                onClick={() => { setInputText(''); setResult(null); setHumanizedText(null); }}
                className="text-rose-500 hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <textarea
          rows={7}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isUrdu ? 'یہاں اپنا مضمون، آرٹیکل یا اسائنمنٹ پیسٹ کریں...' : 'Paste your content here to check for duplicate content, AI markers, and readability...'}
          className="w-full p-4 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed resize-y"
        />

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleScan}
              disabled={isScanning || !inputText.trim()}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold shadow flex items-center gap-2 transition"
            >
              {isScanning ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Scanning Originality...
                </>
              ) : (
                <>🔍 {isUrdu ? 'پلیجرازم اسکین کریں' : 'Scan for Plagiarism & AI'}</>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={humanizeMode}
              onChange={(e: any) => setHumanizeMode(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-800 dark:text-zinc-200 font-medium focus:outline-none"
            >
              <option value="humanize">🤖 AI Humanizer (Natural)</option>
              <option value="fluent">✨ Fluent Paraphrase</option>
              <option value="academic">🎓 Academic Scholarly</option>
              <option value="urdu_polish">🇵🇰 Urdu Nastaliq Polish</option>
              <option value="roman_urdu">💬 Roman Urdu</option>
            </select>
            <button
              type="button"
              onClick={handleHumanize}
              disabled={isHumanizing || !inputText.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow transition"
            >
              {isHumanizing ? 'Rewriting...' : '✨ Rewrite & 100% Unique'}
            </button>
          </div>
        </div>
      </div>

      {/* Humanized Result Box if Generated */}
      {humanizedText && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl p-6 shadow-md space-y-3">
          <div className="flex items-center justify-between border-b border-emerald-200/80 dark:border-emerald-800/80 pb-3">
            <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
              <span>✨</span> {isUrdu ? '100% اوریجنل و انسانی انداز میں تبدیل شدہ متن' : '100% Unique & Humanized Version'}
            </h3>
            <button
              type="button"
              onClick={() => onCopy(humanizedText, isUrdu ? 'متن کاپی ہو گیا!' : 'Humanized text copied!')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow transition"
            >
              📋 Copy
            </button>
          </div>
          <p className="text-slate-800 dark:text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">
            {humanizedText}
          </p>
        </div>
      )}

      {/* Audit Report Scores */}
      {result && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-zinc-700 rounded-2xl p-4 text-center shadow-sm">
              <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-1">
                {isUrdu ? 'اوریجنل سکور' : 'Originality'}
              </div>
              <div className={`text-2xl sm:text-3xl font-extrabold ${result.originalityScore >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {result.originalityScore}%
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Unique Content</div>
            </div>

            <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-zinc-700 rounded-2xl p-4 text-center shadow-sm">
              <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-1">
                {isUrdu ? 'مشابہت / نقل' : 'Plagiarism'}
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                {100 - result.originalityScore}%
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Similarity Match</div>
            </div>

            <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-zinc-700 rounded-2xl p-4 text-center shadow-sm">
              <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-1">
                {isUrdu ? 'اے آئی کا امکان' : 'AI Likelihood'}
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-purple-600 dark:text-purple-400">
                {result.aiLikelihoodScore}%
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Machine Clichés</div>
            </div>

            <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-zinc-700 rounded-2xl p-4 text-center shadow-sm">
              <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-1">
                {isUrdu ? 'پڑھنے کی روانی' : 'Readability'}
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-teal-600 dark:text-teal-400">
                {result.readabilityScore}/100
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Flesch Grade</div>
            </div>
          </div>

          {/* Sentence by sentence feedback */}
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-zinc-700 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <span>📝</span> {isUrdu ? 'جملہ وار تجزیہ اور فیڈ بیک' : 'Sentence-by-Sentence Audit Breakdown'}
            </h4>
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {result.highlightedSentences.map((sent, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl text-xs sm:text-sm border transition ${
                    sent.status === 'flagged'
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                      : sent.status === 'common'
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                      : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40 text-slate-800 dark:text-zinc-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{sent.text}</p>
                    <span className="shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border">
                      {sent.status === 'flagged' ? 'Flagged' : sent.status === 'common' ? 'Cliché' : 'Unique'}
                    </span>
                  </div>
                  {sent.feedback && (
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                      💡 {sent.feedback}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
