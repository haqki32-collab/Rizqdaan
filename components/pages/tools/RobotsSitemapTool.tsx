import React, { useState } from 'react';
import { generateRobotsTxt, generateSitemapXml } from '../../../services/toolsService';

interface RobotsSitemapToolProps {
  isUrdu: boolean;
  onCopy: (text: string, msg?: string) => void;
}

export const RobotsSitemapTool: React.FC<RobotsSitemapToolProps> = ({ isUrdu, onCopy }) => {
  const [activeSubTab, setActiveSubTab] = useState<'robots' | 'sitemap'>('robots');

  // Robots state
  const [allowGoogle, setAllowGoogle] = useState(true);
  const [allowBing, setAllowBing] = useState(true);
  const [disallowPaths, setDisallowPaths] = useState('/admin/\n/cart/\n/checkout/\n/account/');
  const [sitemapUrl, setSitemapUrl] = useState('https://myshop.com/sitemap.xml');

  // Sitemap state
  const [siteBaseUrl, setSiteBaseUrl] = useState('https://myshop.com');
  const [urlList, setUrlList] = useState(
    '/\n/shop\n/categories\n/about-us\n/contact\n/terms'
  );

  const robotsOutput = generateRobotsTxt({
    allowGoogle,
    allowBing,
    disallowPaths: disallowPaths.split('\n').filter(Boolean),
    sitemapUrl
  });

  const urlsForSitemap = urlList.split('\n').map(u => u.trim()).filter(Boolean).map(path => ({
    loc: `${siteBaseUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : '/' + path}`,
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: path === '/' ? 'daily' : 'weekly',
    priority: path === '/' ? '1.0' : '0.8'
  }));

  const sitemapOutput = generateSitemapXml(urlsForSitemap);

  const downloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-8" id="robots-sitemap-container">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-400/20 text-indigo-300 border border-indigo-400/30">
            🤖 Webmaster & Google Search Console Essentials
          </span>
          <span className="text-xs text-indigo-200/80">
            {isUrdu ? '100% گوگل ویلڈیشن سپورٹ' : 'W3C & Google XML Compliant'}
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
          {isUrdu ? 'روبوٹس فائل اور سائٹ میپ جنریٹر (Robots.txt & Sitemap.xml)' : 'Robots.txt & XML Sitemap Generator for Google Indexing'}
        </h2>
        <p className="text-indigo-100/90 text-sm sm:text-base max-w-3xl leading-relaxed">
          {isUrdu
            ? 'گوگل باٹس اور سرچ انجنز کے لیے درست Robots.txt اور XML Sitemap تیار کریں تاکہ آپ کی ویب سائٹ کا ہر صفحہ تیزی سے انڈیکس ہو۔'
            : 'Generate search-engine compliant robots.txt rules and XML sitemaps to accelerate Google crawl budget and indexing.'}
        </p>
      </div>

      {/* Sub Tabs */}
      <div className="flex bg-slate-100 dark:bg-zinc-800 p-1.5 rounded-2xl w-fit gap-1 border border-slate-200 dark:border-zinc-700">
        <button
          type="button"
          onClick={() => setActiveSubTab('robots')}
          className={`px-5 py-2 text-xs sm:text-sm font-bold rounded-xl transition ${
            activeSubTab === 'robots' ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-slate-500'
          }`}
        >
          🤖 Robots.txt Generator
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('sitemap')}
          className={`px-5 py-2 text-xs sm:text-sm font-bold rounded-xl transition ${
            activeSubTab === 'sitemap' ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-slate-500'
          }`}
        >
          🗺️ XML Sitemap Generator
        </button>
      </div>

      {activeSubTab === 'robots' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6 bg-white dark:bg-dark-surface border border-slate-200 dark:border-zinc-700/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-sm border-b border-slate-100 dark:border-zinc-700 pb-3">
              Crawl Rules Configuration
            </h3>

            <div className="space-y-3">
              <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowGoogle}
                  onChange={(e) => setAllowGoogle(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                Allow Googlebot (Recommended)
              </label>
              <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowBing}
                  onChange={(e) => setAllowBing(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                Allow Bingbot & Yahoo
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Disallow Paths (One per line)
              </label>
              <textarea
                rows={4}
                value={disallowPaths}
                onChange={(e) => setDisallowPaths(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Sitemap URL Location
              </label>
              <input
                type="url"
                value={sitemapUrl}
                onChange={(e) => setSitemapUrl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="lg:col-span-6 bg-slate-900 text-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-mono text-indigo-400">robots.txt Preview</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onCopy(robotsOutput, 'robots.txt copied!')}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition"
                >
                  📋 Copy
                </button>
                <button
                  type="button"
                  onClick={() => downloadFile(robotsOutput, 'robots.txt', 'text/plain')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold shadow transition border border-slate-700"
                >
                  📥 Download
                </button>
              </div>
            </div>
            <pre className="text-xs font-mono bg-black/60 p-4 rounded-xl text-emerald-400 overflow-x-auto leading-relaxed">
              {robotsOutput}
            </pre>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6 bg-white dark:bg-dark-surface border border-slate-200 dark:border-zinc-700/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-sm border-b border-slate-100 dark:border-zinc-700 pb-3">
              Sitemap URLs Configuration
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Base Website URL
              </label>
              <input
                type="url"
                value={siteBaseUrl}
                onChange={(e) => setSiteBaseUrl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Relative Page Slugs (One per line)
              </label>
              <textarea
                rows={6}
                value={urlList}
                onChange={(e) => setUrlList(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="lg:col-span-6 bg-slate-900 text-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-mono text-indigo-400">sitemap.xml Preview</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onCopy(sitemapOutput, 'sitemap.xml copied!')}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition"
                >
                  📋 Copy
                </button>
                <button
                  type="button"
                  onClick={() => downloadFile(sitemapOutput, 'sitemap.xml', 'application/xml')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold shadow transition border border-slate-700"
                >
                  📥 Download
                </button>
              </div>
            </div>
            <pre className="text-xs font-mono bg-black/60 p-4 rounded-xl text-cyan-300 overflow-x-auto max-h-80 leading-relaxed">
              {sitemapOutput}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
