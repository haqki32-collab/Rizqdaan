import React, { useState, useEffect } from 'react';
import { BlogPost, Listing } from '../../types';
import { recordPostView, likeBlogPost, getBlogPosts, getEffectiveViews, handleBlogImageError, handleAvatarError } from '../../services/blogService';
import { useLanguage } from '../../src/context/LanguageContext';

interface BlogDetailPageProps {
  post: BlogPost;
  onNavigate: (view: any, payload?: any) => void;
  listings: Listing[];
}

export const BlogDetailPage: React.FC<BlogDetailPageProps> = ({ post: initialPost, onNavigate, listings }) => {
  const { isUrdu } = useLanguage();
  const [post, setPost] = useState<BlogPost>(initialPost);
  const [likes, setLikes] = useState<number>(initialPost.likes || 0);
  const [hasLiked, setHasLiked] = useState<boolean>(false);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal');
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  // Sync post, inject instant SEO Schema, & track reading progress
  useEffect(() => {
    setPost(initialPost);
    setLikes(initialPost.likes || 0);
    recordPostView(initialPost.id);

    // Dynamic SEO Title & Meta Tags for Google Search Indexing
    document.title = `${initialPost.title} | RizqDaan Pakistan`;

    const metaDescriptionEl = document.querySelector('meta[name="description"]');
    if (metaDescriptionEl) {
      metaDescriptionEl.setAttribute('content', initialPost.metaDescription || initialPost.summary);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = initialPost.metaDescription || initialPost.summary;
      document.head.appendChild(meta);
    }

    // JSON-LD NewsArticle & FAQPage Schema for Instant Google Rich Results & Discover
    const schemaScriptId = 'rizqdaan-blog-jsonld';
    let scriptTag = document.getElementById(schemaScriptId) as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = schemaScriptId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": initialPost.title,
      "description": initialPost.summary,
      "image": [initialPost.coverImage],
      "datePublished": initialPost.publishedAt,
      "dateModified": initialPost.publishedAt,
      "author": [{
        "@type": "Organization",
        "name": "RizqDaan Market Intelligence Desk",
        "url": "https://rizqdaan.com"
      }],
      "publisher": {
        "@type": "Organization",
        "name": "RizqDaan Pakistan",
        "logo": {
          "@type": "ImageObject",
          "url": "https://rizqdaan.com/logo.png"
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": window.location.href
      }
    };
    scriptTag.text = JSON.stringify(structuredData);

    getBlogPosts().then(list => setAllPosts(list));

    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (windowHeight > 0) {
        setScrollProgress((totalScroll / windowHeight) * 100);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scriptTag && scriptTag.parentNode) {
        scriptTag.parentNode.removeChild(scriptTag);
      }
    };
  }, [initialPost.id]);

  const handleLike = async () => {
    if (hasLiked) return;
    setHasLiked(true);
    const updated = await likeBlogPost(post.id);
    setLikes(updated);
  };

  const handleShareWhatsApp = () => {
    const text = `📰 *${post.title}*\n\nRead the complete 2026 market update and buying guide on RizqDaan Pakistan:\n${window.location.href}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  // Find matching listings on RizqDaan
  const matchingListings = listings.filter(item => {
    if (!post.relatedProductKeyword) return false;
    const kw = post.relatedProductKeyword.toLowerCase();
    return (
      item.title.toLowerCase().includes(kw) ||
      item.description.toLowerCase().includes(kw) ||
      item.category.toLowerCase().includes(kw)
    );
  }).slice(0, 4);

  // Other trending articles
  const relatedPosts = allPosts.filter(p => p.id !== post.id).slice(0, 3);

  // Parse markdown into clean JSX elements
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let tableBuffer: string[] = [];
    let inTable = false;

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Check for Markdown Table Rows
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        inTable = true;
        tableBuffer.push(trimmed);
        return;
      } else if (inTable) {
        inTable = false;
        elements.push(renderTable(tableBuffer, `table-${idx}`));
        tableBuffer = [];
      }

      if (trimmed.startsWith('# ')) {
        // Skip title as it's already in the header
        return;
      } else if (trimmed.startsWith('## ')) {
        elements.push(
          <div key={idx} className="mt-8 mb-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <span className="w-1.5 h-6 bg-primary rounded-full inline-block"></span>
              {trimmed.substring(3)}
            </h2>
          </div>
        );
      } else if (trimmed.startsWith('### ')) {
        elements.push(
          <h3 key={idx} className="text-base sm:text-lg font-bold text-emerald-800 dark:text-emerald-300 mt-6 mb-2">
            {trimmed.substring(4)}
          </h3>
        );
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const itemText = trimmed.substring(2);
        elements.push(
          <li key={idx} className={`ml-4 list-disc ${fontSize === 'large' ? 'text-base sm:text-lg' : 'text-sm sm:text-base'} text-gray-700 dark:text-gray-300 my-1.5 leading-relaxed`}>
            {parseBoldText(itemText)}
          </li>
        );
      } else if (/^\d+\.\s/.test(trimmed)) {
        elements.push(
          <p key={idx} className={`${fontSize === 'large' ? 'text-base sm:text-lg' : 'text-sm sm:text-base'} text-gray-700 dark:text-gray-300 my-2 leading-relaxed pl-3 border-l-2 border-emerald-500`}>
            {parseBoldText(trimmed)}
          </p>
        );
      } else if (trimmed === '---') {
        elements.push(<hr key={idx} className="my-6 border-gray-200 dark:border-gray-800" />);
      } else if (trimmed.length > 0) {
        elements.push(
          <p key={idx} className={`${fontSize === 'large' ? 'text-base sm:text-lg' : 'text-sm sm:text-base'} text-gray-700 dark:text-gray-300 my-3 leading-relaxed`}>
            {parseBoldText(trimmed)}
          </p>
        );
      }
    });

    if (tableBuffer.length > 0) {
      elements.push(renderTable(tableBuffer, 'table-end'));
    }

    return elements;
  };

  const renderTable = (rows: string[], key: string) => {
    const parsedRows = rows.map(r => 
      r.split('|').map(c => c.trim()).filter((_, i, arr) => i !== 0 && i !== arr.length - 1)
    );

    if (parsedRows.length < 2) return null;
    const headers = parsedRows[0];
    const dataRows = parsedRows.slice(2); // skip separator row |:---|

    return (
      <div key={key} className="my-6">
        <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1.5 px-1 sm:hidden">
          <span>📊 Price / Rate Table</span>
          <span className="text-primary font-bold">👉 Scroll horizontally</span>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-dark-surface">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead className="bg-emerald-800 text-white font-bold border-b border-emerald-900">
              <tr>
                {headers.map((h, i) => (
                  <th key={i} className="py-3 px-4 font-black whitespace-nowrap">{parseBoldText(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {dataRows.map((row, ri) => (
                <tr key={ri} className={ri % 2 === 0 ? 'bg-white dark:bg-dark-surface' : 'bg-gray-50/70 dark:bg-gray-800/30 hover:bg-emerald-50/50 transition-colors'}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="py-3 px-4 text-gray-800 dark:text-gray-200 whitespace-nowrap font-medium">
                      {parseBoldText(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const parseBoldText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-black text-gray-900 dark:text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="italic">{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs text-primary font-mono font-bold">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-dark-bg pb-24 text-gray-900 dark:text-white">
      {/* 🚀 READING PROGRESS BAR */}
      <div 
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-emerald-500 via-primary to-teal-400 z-50 transition-all duration-150"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* TOAST */}
      {copiedToast && (
        <div className="fixed top-6 right-6 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-fade-in border border-white/20">
          <span>✓</span> Link copied to clipboard!
        </div>
      )}

      {/* BREADCRUMB & BACK NAV */}
      <div className="bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-gray-800 py-3 px-4 sm:px-6 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => onNavigate('blog')}
            className="text-xs font-black text-gray-700 dark:text-gray-200 hover:text-primary flex items-center gap-1.5 transition-colors bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg"
          >
            ← {isUrdu ? 'تمام مضامین و آرکائیو' : 'Back to News & Trends Archive'}
          </button>
          
          <div className="flex items-center gap-2">
            {/* Font Size Adjuster */}
            <button
              onClick={() => setFontSize(prev => prev === 'normal' ? 'large' : 'normal')}
              className="text-[11px] font-bold px-2.5 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
              title="Toggle Font Size"
            >
              {fontSize === 'large' ? 'A (Normal)' : 'A+ (Large)'}
            </button>

            <span className="text-[10px] bg-red-600/10 text-red-600 font-bold px-2 py-0.5 rounded-full border border-red-200">
              🔥 #{post.trendingScore || 98}
            </span>
            <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
              {post.categoryLabel}
            </span>
          </div>
        </div>
      </div>

      {/* ARTICLE WRAPPER */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* ARTICLE HEADER CARD */}
        <div className="bg-white dark:bg-dark-surface p-6 sm:p-8 rounded-3xl border border-gray-200/80 dark:border-gray-800 shadow-sm">
          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-3">
            <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1">
              ✓ Verified 2026 Rates
            </span>
            <span>📅 {new Date(post.publishedAt).toLocaleDateString('en-PK', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            <span>•</span>
            <span>⏱️ {post.readTimeMinutes} min read</span>
            <span>•</span>
            <span>✍️ {post.wordCount} words</span>
            <span>•</span>
            <span>👁️ {getEffectiveViews(post).toLocaleString()} views</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 dark:text-white leading-tight tracking-tight">
            {post.title}
          </h1>

          {/* ENGLISH SUMMARY & URDU SUMMARY TOGGLE */}
          <div className="mt-5 space-y-3">
            <div className="bg-emerald-50/70 dark:bg-gray-800/60 p-4 sm:p-5 rounded-2xl border-l-4 border-primary">
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Executive Summary:</p>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-200 leading-relaxed font-medium">
                {post.summary}
              </p>
            </div>

            {post.urduSummary && (
              <div className="bg-amber-50/70 dark:bg-amber-950/20 p-4 sm:p-5 rounded-2xl border-r-4 border-amber-500 text-right" dir="rtl">
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">خلاصہ (اردو میں):</p>
                <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                  {post.urduSummary}
                </p>
              </div>
            )}
          </div>

          {/* 📊 LIVE PRICE & METRIC HIGHLIGHT STAT CARDS */}
          {post.priceHighlights && post.priceHighlights.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
              <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-3 flex items-center gap-1.5">
                <span>⚡</span>
                <span>Live 2026 Key Rate & Spec Highlights:</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {post.priceHighlights.map((stat, si) => (
                  <div key={si} className="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-emerald-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 leading-snug">{stat.label}</span>
                    <span className="text-sm sm:text-base font-black text-emerald-800 dark:text-emerald-300 mt-1">{stat.value}</span>
                    {stat.subtext && <span className="text-[10px] text-gray-400 mt-0.5">{stat.subtext}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* KEY TAKEAWAYS BOX */}
          {post.keyTakeaways && post.keyTakeaways.length > 0 && (
            <div className="mt-6 bg-gradient-to-r from-teal-900 to-emerald-950 text-white p-5 rounded-2xl">
              <h3 className="text-sm font-black uppercase tracking-wider text-emerald-300 mb-3 flex items-center gap-2">
                <span>📌</span>
                <span>Key Market Takeaways:</span>
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-emerald-100">
                {post.keyTakeaways.map((point, pi) => (
                  <li key={pi} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold flex-shrink-0">✓</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Author info & Action buttons */}
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img 
                src={post.author.avatar} 
                alt={post.author.name}
                className="w-11 h-11 rounded-full object-cover border-2 border-emerald-400"
                referrerPolicy="no-referrer"
                loading="lazy"
                onError={handleAvatarError}
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-black text-gray-900 dark:text-white">{post.author.name}</p>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">Desk</span>
                </div>
                <p className="text-xs text-gray-500">{post.author.role}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Like Button */}
              <button
                onClick={handleLike}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  hasLiked 
                    ? 'bg-red-50 text-red-600 border-red-200 shadow-sm' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{hasLiked ? '❤️' : '🤍'}</span>
                <span>{likes} Helpful</span>
              </button>

              {/* WhatsApp Share */}
              <button
                onClick={handleShareWhatsApp}
                className="px-4 py-2 bg-[#25D366] hover:bg-[#1ebd59] text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.407 3.481 2.239 2.24 3.477 5.23 3.475 8.411-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.394 1.664zm6.222-3.528c1.552.92 3.51 1.405 5.621 1.406 5.543 0 10.054-4.51 10.057-10.055.002-2.686-1.047-5.212-2.952-7.118-1.904-1.905-4.432-2.952-7.118-2.952-5.544 0-10.054 4.51-10.057 10.055-.001 2.112.553 4.17 1.602 5.962l-.999 3.649 3.846-.947zm11.387-5.477c-.31-.156-1.834-.905-2.113-1.006-.279-.101-.482-.151-.684.151-.202.302-.782 1.006-.958 1.207-.176.202-.352.227-.662.071-.31-.156-1.311-.484-2.498-1.543-.923-.824-1.547-1.841-1.728-2.143-.181-.303-.019-.466.136-.621.14-.14.31-.362.466-.543.156-.181.208-.31.31-.517.103-.207.052-.387-.026-.543-.078-.156-.684-1.649-.938-2.261-.247-.597-.499-.516-.684-.525-.176-.008-.378-.009-.58-.009s-.53.076-.807.378c-.278.302-1.061 1.037-1.061 2.531s1.087 2.946 1.239 3.148c.152.202 2.139 3.267 5.182 4.581.724.312 1.288.499 1.728.639.728.231 1.389.198 1.912.12.583-.087 1.834-.751 2.09-1.477.256-.725.256-1.348.179-1.477-.076-.128-.278-.204-.588-.36z"/></svg>
                <span>Share</span>
              </button>

              {/* Copy Link */}
              <button
                onClick={handleCopyLink}
                className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 rounded-xl transition-all"
                title="Copy Link"
              >
                🔗
              </button>
            </div>
          </div>
        </div>

        {/* COVER IMAGE */}
        <div className="my-6 rounded-3xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-800 max-h-96">
          <img 
            src={post.coverImage} 
            alt={post.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={(e) => handleBlogImageError(e, post.category, post.title)}
          />
        </div>

        {/* ARTICLE BODY */}
        <div className="bg-white dark:bg-dark-surface p-6 sm:p-10 rounded-3xl border border-gray-200/80 dark:border-gray-800 shadow-sm">
          {renderFormattedContent(post.content)}

          {/* 🇵🇰 EMBEDDED RIZQDAAN MARKETPLACE PRODUCTS WIDGET */}
          <div className="my-10 bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 dark:from-gray-800/90 dark:via-gray-800 dark:to-emerald-950/40 p-6 rounded-3xl border-2 border-emerald-300 dark:border-emerald-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <span className="bg-emerald-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                  ⚡ Live Deals on RizqDaan
                </span>
                <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white mt-1">
                  {isUrdu 
                    ? `رزق دان پر ${post.relatedProductKeyword || 'متعلقہ'} کے تازہ ترین اشتہارات (ڈائریکٹ مالک سے خریدیں)` 
                    : `Direct Seller Deals on RizqDaan for ${post.relatedProductKeyword || post.categoryLabel}`}
                </h3>
              </div>
              <button
                onClick={() => onNavigate('listings', { query: post.relatedProductKeyword || '' })}
                className="text-xs font-black text-primary hover:underline whitespace-nowrap"
              >
                {isUrdu ? 'تمام ڈیلز دیکھیں' : 'View All Matching Ads'} →
              </button>
            </div>

            {matchingListings.length === 0 ? (
              <div className="bg-white dark:bg-dark-surface p-6 text-center rounded-2xl border border-emerald-200 dark:border-gray-700">
                <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                  {isUrdu ? 'کیا آپ اس ٹاپک سے متعلق کوئی چیز بیچنا چاہتے ہیں؟ اپنا اشتہار 1 منٹ میں مفت لگائیں!' : 'Want to sell items related to this topic? Post your ad for free in 1 minute!'}
                </p>
                <button
                  onClick={() => onNavigate('vendor-dashboard')}
                  className="mt-3 px-5 py-2 bg-primary text-white font-black text-xs rounded-xl shadow-md hover:bg-primary-dark transition-all"
                >
                  {isUrdu ? 'مفت اشتہار لگائیں' : 'Post Free Ad Now'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {matchingListings.map(item => (
                  <div
                    key={item.id}
                    onClick={() => onNavigate('details', { listing: item })}
                    className="cursor-pointer bg-white dark:bg-dark-surface p-3 rounded-2xl border border-emerald-200/80 dark:border-gray-700 shadow-sm hover:shadow-md transition-all flex items-center gap-3"
                  >
                    <img 
                      src={item.imageUrl} 
                      alt={item.title}
                      className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">{item.title}</h4>
                      <p className="text-sm font-black text-primary mt-0.5">Rs. {item.price.toLocaleString()}</p>
                      <p className="text-[10px] text-gray-500 truncate">📍 {item.location}</p>
                    </div>
                    <span className="text-xs font-bold text-primary flex-shrink-0">View →</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* GROUNDING & SOURCE CITATIONS */}
          {post.groundingSources && post.groundingSources.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
              <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-2 flex items-center gap-1.5">
                <span>🛡️</span>
                <span>Verified Data Sources & Industry Citations:</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {post.groundingSources.map((source, si) => (
                  <a
                    key={si}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-gray-700 flex items-center gap-1 hover:underline"
                  >
                    <span>🔗</span>
                    <span>{source.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* FAQs ACCORDION */}
          {post.faq && post.faq.length > 0 && (
            <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800">
              <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span>❓</span>
                <span>Frequently Asked Questions (FAQs)</span>
              </h3>
              <div className="space-y-3">
                {post.faq.map((f, fi) => (
                  <div key={fi} className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">{f.question}</h4>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1.5 leading-relaxed">{f.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAGS */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-gray-400 mr-2">🏷️ Tags:</span>
              {post.tags.map((tag, ti) => (
                <span 
                  key={ti}
                  onClick={() => onNavigate('listings', { query: tag })}
                  className="cursor-pointer bg-gray-100 hover:bg-emerald-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-primary text-[11px] font-bold px-3 py-1 rounded-lg transition-colors border border-gray-200 dark:border-gray-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* RELATED ARTICLES CAROUSEL */}
        {relatedPosts.length > 0 && (
          <div className="mt-10">
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4">
              {isUrdu ? 'دیگر ٹرینڈنگ مضامین' : 'More Trending Guides & Market Updates'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedPosts.map(rp => (
                <div
                  key={rp.id}
                  onClick={() => onNavigate('blog-detail', { blogPost: rp, blogId: rp.id })}
                  className="cursor-pointer bg-white dark:bg-dark-surface p-3.5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all group"
                >
                  <img 
                    src={rp.coverImage} 
                    alt={rp.title}
                    className="w-full h-28 rounded-xl object-cover group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    onError={(e) => handleBlogImageError(e, rp.category, rp.title)}
                  />
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white mt-2 line-clamp-2 group-hover:text-primary">
                    {rp.title}
                  </h4>
                  <p className="text-[10px] text-gray-400 mt-1">{rp.readTimeMinutes} min read</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
};

export default BlogDetailPage;
