import React, { useState } from 'react';
import { generateMetaTags, MetaTagInput } from '../../../services/toolsService';

interface MetaTagGeneratorToolProps {
  isUrdu: boolean;
  onCopy: (text: string, msg?: string) => void;
}

export const MetaTagGeneratorTool: React.FC<MetaTagGeneratorToolProps> = ({ isUrdu, onCopy }) => {
  const [data, setData] = useState<MetaTagInput>({
    title: 'Top Online Store in Pakistan | Fast Cash on Delivery',
    description: 'Shop premium electronics, fashion, and home essentials with fastest cash on delivery across Pakistan. 100% genuine products with easy returns.',
    keywords: 'online shopping pakistan, cash on delivery, buy electronics karachi, fashion lahore, best prices',
    author: 'RizqDaan Merchant',
    siteUrl: 'https://myshop.com',
    imageUrl: 'https://myshop.com/og-banner.jpg',
    twitterHandle: '@myshop_pk',
    robotsIndex: true,
    robotsFollow: true
  });

  const [activePreviewTab, setActivePreviewTab] = useState<'google' | 'facebook' | 'twitter'>('google');

  const metaHtml = generateMetaTags(data);

  return (
    <div className="space-y-8" id="meta-tag-generator-container">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-cyan-900 to-blue-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
            🏷️ SEO & Social Open Graph Architect
          </span>
          <span className="text-xs text-cyan-200/80">
            {isUrdu ? 'گوگل اور فیس بک میں ٹاپ رینکنگ کے لیے' : 'Live Google & Facebook Snippet Simulator'}
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
          {isUrdu ? 'ایس ای او میٹا ٹیگ جنریٹر اور گوگل سرچ پریویو' : 'SEO Meta Tags Generator & Live SERP Simulator'}
        </h2>
        <p className="text-cyan-100/90 text-sm sm:text-base max-w-3xl leading-relaxed">
          {isUrdu
            ? 'اپنی ویب سائٹ، بلاگ یا شاپ کے لیے پرفیکٹ میٹا ٹیگز، اوپن گراف (OG) اور ٹوئٹر کارڈ ٹیگز بنائیں اور دیکھیں کہ گوگل سرچ اور فیس بک شیئر پر آپ کا لنک کیسا دکھائی دے گا۔'
            : 'Generate high-ranking meta title, description, keywords, Open Graph, and Twitter tags with real-time Google search snippet rendering.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Inputs */}
        <div className="lg:col-span-6 bg-white dark:bg-dark-surface border border-slate-200 dark:border-zinc-700/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-sm border-b border-slate-100 dark:border-zinc-700 pb-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
            {isUrdu ? 'ویب سائٹ کی تفصیلات درج کریں' : 'Website SEO Details'}
          </h3>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
              <span>{isUrdu ? 'صفحے کا عنوان (Meta Title)' : 'Meta Title'} *</span>
              <span className={`text-[11px] ${data.title.length > 60 ? 'text-amber-500 font-bold' : 'text-slate-400'}`}>
                {data.title.length}/60 chars (Recommended: 50-60)
              </span>
            </div>
            <input
              type="text"
              value={data.title}
              onChange={(e) => setData({ ...data, title: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
              <span>{isUrdu ? 'تفصیل (Meta Description)' : 'Meta Description'} *</span>
              <span className={`text-[11px] ${data.description.length > 160 ? 'text-amber-500 font-bold' : 'text-slate-400'}`}>
                {data.description.length}/160 chars (Recommended: 120-160)
              </span>
            </div>
            <textarea
              rows={3}
              value={data.description}
              onChange={(e) => setData({ ...data, description: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                {isUrdu ? 'کی ورڈز (الگ بذریعہ کوما)' : 'Keywords (Comma separated)'}
              </label>
              <input
                type="text"
                value={data.keywords}
                onChange={(e) => setData({ ...data, keywords: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                {isUrdu ? 'سائٹ کا مکمل لنک (Canonical URL)' : 'Canonical Website URL'}
              </label>
              <input
                type="url"
                value={data.siteUrl}
                onChange={(e) => setData({ ...data, siteUrl: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                {isUrdu ? 'شیئر بینر تصویر لنک (OG Image)' : 'Social Share Banner Image URL'}
              </label>
              <input
                type="url"
                value={data.imageUrl}
                onChange={(e) => setData({ ...data, imageUrl: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                {isUrdu ? 'ٹوئٹر ہینڈل (Twitter/X Username)' : 'Twitter / X Handle'}
              </label>
              <input
                type="text"
                value={data.twitterHandle}
                onChange={(e) => setData({ ...data, twitterHandle: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Live Simulator & Export */}
        <div className="lg:col-span-6 space-y-6">
          {/* Live Preview Tabs */}
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-zinc-700/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-700 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Live Simulator Preview
              </span>
              <div className="flex bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('google')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                    activePreviewTab === 'google' ? 'bg-white dark:bg-zinc-700 text-cyan-600 dark:text-cyan-400 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Google SERP
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('facebook')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                    activePreviewTab === 'facebook' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Facebook / OG
                </button>
              </div>
            </div>

            {/* Google Snippet View */}
            {activePreviewTab === 'google' && (
              <div className="p-4 bg-slate-50 dark:bg-zinc-900/80 rounded-xl border border-slate-200 dark:border-zinc-700 font-sans space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-400">
                  <span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[10px]">🌐</span>
                  <span className="truncate">{data.siteUrl || 'https://myshop.com'}</span>
                </div>
                <div className="text-base sm:text-lg font-medium text-blue-700 dark:text-blue-400 hover:underline cursor-pointer line-clamp-1">
                  {data.title || 'Your Page Title'}
                </div>
                <div className="text-xs text-slate-600 dark:text-zinc-300 line-clamp-2 leading-relaxed">
                  {data.description || 'Your meta description summary goes here...'}
                </div>
              </div>
            )}

            {/* Facebook Card View */}
            {activePreviewTab === 'facebook' && (
              <div className="bg-slate-50 dark:bg-zinc-900/80 rounded-xl border border-slate-200 dark:border-zinc-700 overflow-hidden font-sans">
                <div className="h-36 bg-slate-200 dark:bg-zinc-800 flex items-center justify-center text-xs text-slate-400 overflow-hidden">
                  {data.imageUrl ? (
                    <img src={data.imageUrl} alt="Social Card" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  ) : (
                    '1200 x 630 px Social Image'
                  )}
                </div>
                <div className="p-3 space-y-1">
                  <div className="text-[11px] uppercase text-slate-400 tracking-wider truncate">{new URL(data.siteUrl || 'https://myshop.com').hostname}</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{data.title}</div>
                  <div className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2">{data.description}</div>
                </div>
              </div>
            )}
          </div>

          {/* Export Code */}
          <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-cyan-400">&lt;head&gt; HTML Meta Code</span>
              <button
                type="button"
                onClick={() => onCopy(metaHtml, isUrdu ? 'میٹا کوڈ کاپی ہو گیا!' : 'HTML Meta tags copied!')}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow transition"
              >
                📋 Copy All Code
              </button>
            </div>
            <pre className="text-xs font-mono bg-black/50 p-3.5 rounded-xl overflow-x-auto text-cyan-200 max-h-48 leading-relaxed">
              {metaHtml}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
