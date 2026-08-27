import React, { useState, useMemo } from 'react';
import { calculateKeywordDensity, KeywordDensityItem } from '../../../services/toolsService';

interface KeywordDensityToolProps {
  isUrdu: boolean;
  onCopy: (text: string, msg?: string) => void;
}

export const KeywordDensityTool: React.FC<KeywordDensityToolProps> = ({ isUrdu, onCopy }) => {
  const [text, setText] = useState('');
  const [activeTab, setActiveTab] = useState<'1' | '2' | '3'>('1');

  const { oneWord, twoWord, threeWord } = useMemo(() => {
    return calculateKeywordDensity(text);
  }, [text]);

  const activeList: KeywordDensityItem[] = activeTab === '1' ? oneWord : activeTab === '2' ? twoWord : threeWord;

  return (
    <div className="space-y-8" id="keyword-density-container">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-900 to-orange-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30">
            🔑 Google Rank Factor & On-Page Auditor
          </span>
          <span className="text-xs text-amber-200/80">
            {isUrdu ? 'کی ورڈ اسٹفنگ سے بچیں' : 'Prevent Keyword Stuffing Penalties'}
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
          {isUrdu ? 'کی ورڈ ڈینسٹی اور سرچ تجزیہ کار' : 'Keyword Density & Phrase Frequency Analyzer'}
        </h2>
        <p className="text-amber-100/90 text-sm sm:text-base max-w-3xl leading-relaxed">
          {isUrdu
            ? 'اپنے مضمون یا بلاگ میں 1 لفظی، 2 لفظی اور 3 لفظی کی ورڈز کے فیصد تناسب کا جائزہ لیں تاکہ گوگل سرچ پر بغیر کسی منفی اثر کے ٹاپ رینک کر سکیں۔'
            : 'Audit single, 2-word, and 3-word n-gram density to optimize your articles for organic Google search traffic without over-optimization.'}
        </p>
      </div>

      {/* Input Text Box */}
      <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-zinc-700/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-700 pb-3">
          <label className="text-sm font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            {isUrdu ? 'متن یہاں درج کریں' : 'Paste Your Article / Webpage Content'}
          </label>
          <span className="text-xs text-slate-400">
            Total Words: {text.trim() ? text.trim().split(/\s+/).length : 0}
          </span>
        </div>

        <textarea
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isUrdu ? 'یہاں اپنا مضمون یا بلاگ کا متن پیسٹ کریں...' : 'Paste your text or blog post here to analyze keyword frequency & density percentage...'}
          className="w-full p-4 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none leading-relaxed"
        />

        {/* Tab Selection */}
        <div className="flex bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl w-fit gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('1')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${activeTab === '1' ? 'bg-white dark:bg-zinc-700 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-slate-500'}`}
          >
            1-Word Keywords ({oneWord.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('2')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${activeTab === '2' ? 'bg-white dark:bg-zinc-700 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-slate-500'}`}
          >
            2-Word Phrases ({twoWord.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('3')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${activeTab === '3' ? 'bg-white dark:bg-zinc-700 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-slate-500'}`}
          >
            3-Word Phrases ({threeWord.length})
          </button>
        </div>

        {/* Results Table */}
        <div className="overflow-x-auto">
          {activeList.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              {text.trim() ? 'No multi-occurrence phrases found.' : 'Enter text above to see keyword density percentages.'}
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 font-semibold">
                  <th className="py-2.5 px-3">Keyword / Phrase</th>
                  <th className="py-2.5 px-3">Count</th>
                  <th className="py-2.5 px-3">Density (%)</th>
                  <th className="py-2.5 px-3">SEO Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {activeList.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                    <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white capitalize">{item.phrase}</td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-zinc-300 font-semibold">{item.count}x</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${item.density > 3 ? 'bg-rose-500' : item.density > 1 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min(100, item.density * 20)}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-800 dark:text-zinc-200">{item.density}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      {item.density > 3 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                          ⚠️ Stuffing Risk (&gt;3%)
                        </span>
                      ) : item.density >= 1 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          ✅ Ideal (1-3%)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                          Low (&lt;1%)
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
