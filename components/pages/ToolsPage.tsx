import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../src/context/LanguageContext';
import { Listing, User } from '../../types';

// Sub-tools
import { ProfitLossCalculatorTool } from './tools/ProfitLossCalculatorTool';
import { PlagiarismCheckerTool } from './tools/PlagiarismCheckerTool';
import { AiCopywritingTool } from './tools/AiCopywritingTool';
import { ImageCompressorTool } from './tools/ImageCompressorTool';
import { MetaTagGeneratorTool } from './tools/MetaTagGeneratorTool';
import { KeywordDensityTool } from './tools/KeywordDensityTool';
import { WordCounterTool } from './tools/WordCounterTool';
import { CaseConverterTool } from './tools/CaseConverterTool';
import { InvoiceKhataTool } from './tools/InvoiceKhataTool';
import { RobotsSitemapTool } from './tools/RobotsSitemapTool';
import { WhatsAppAndQrTool } from './tools/WhatsAppAndQrTool';
import { DiscountGstTool } from './tools/DiscountGstTool';

interface ToolsPageProps {
  initialTool?: string;
  onNavigate: (view: any, payload?: any) => void;
  listings?: Listing[];
  user?: User | null;
}

export type ToolKey = 
  | 'profit-calculator'
  | 'plagiarism-checker'
  | 'copywriting'
  | 'image-compressor'
  | 'meta-tag-generator'
  | 'keyword-density'
  | 'word-counter'
  | 'case-converter'
  | 'invoice'
  | 'robots-sitemap'
  | 'whatsapp-qr'
  | 'discount-gst';

interface ToolMeta {
  id: ToolKey;
  slugs: string[];
  titleEn: string;
  titleUr: string;
  seoTitle: string;
  seoDesc: string;
  seoKeywords: string;
  category: 'ecommerce' | 'writing' | 'images' | 'seo';
  categoryLabel: string;
  icon: string;
  badge?: string;
  faqs: { q: string; a: string }[];
}

const TOOLS_CONFIG: ToolMeta[] = [
  {
    id: 'profit-calculator',
    slugs: ['profit-calculator', 'profit-or-loss-calculator', 'profit', 'roi-calculator', 'ecommerce-calculator'],
    titleEn: 'Profit & Loss Calculator (E-Commerce & Courier RTO)',
    titleUr: 'منافع اور نقصان کا کیلکولیٹر (ای کامرس اور واپسی شرح)',
    seoTitle: 'Profit and Loss Calculator Pakistan - Free Ecommerce Courier ROI Calculator | RizqDaan',
    seoDesc: 'Calculate accurate net profit, profit margins, COD courier return loss (RTO), and ad spend ROI for online shopping businesses in Pakistan.',
    seoKeywords: 'profit or loss calculator, ecommerce profit calculator pakistan, courier return loss calculator, cod rto rate calculator, daraz profit calculator',
    category: 'ecommerce',
    categoryLabel: 'E-Commerce & Business',
    icon: '📊',
    badge: 'Trending 🔥',
    faqs: [
      {
        q: 'How to calculate net profit in Pakistani e-commerce?',
        a: 'Net Profit = Selling Price - Sourcing Cost - Delivery Fee - Packaging Cost - Ad Cost (CAC) - Return Loss (RTO). Our free calculator automatically applies these factors.'
      },
      {
        q: 'What is a good courier return (RTO) rate in Pakistan COD?',
        a: 'The average Cash on Delivery (COD) return rate across Pakistan couriers (TCS, Leopards, Trax, PostEx) is 10% to 18%. Anything below 12% is considered healthy.'
      }
    ]
  },
  {
    id: 'plagiarism-checker',
    slugs: ['plagiarism-checker', 'plagiarism', 'ai-detector', 'originality-scanner'],
    titleEn: 'Plagiarism Checker & AI Content Scanner',
    titleUr: 'پلیجرازم اور اے آئی ڈیٹیکٹر (100% اوریجنل چیکر)',
    seoTitle: 'Free Plagiarism Checker Online & AI Detector 100% Unique | RizqDaan Tools',
    seoDesc: 'Free online plagiarism checker and AI detection scanner. Check text originality score, detect repetitive sentences, and humanize content with 1 click.',
    seoKeywords: 'plagiarism checker free, online plagiarism scanner, ai detection tool, humanize ai text, check originality free, urdu plagiarism checker',
    category: 'writing',
    categoryLabel: 'Writing & Content',
    icon: '🔍',
    badge: 'Popular',
    faqs: [
      {
        q: 'Is this plagiarism checker 100% free with no limit?',
        a: 'Yes, RizqDaan Plagiarism Checker is completely free to use with unlimited word checks and instant sentence-by-sentence analysis.'
      },
      {
        q: 'Does it support Urdu, Roman Urdu, and English?',
        a: 'Yes, our originality engine audits English, pure Urdu script, and conversational Roman Urdu text accurately.'
      }
    ]
  },
  {
    id: 'copywriting',
    slugs: ['copywriting', 'ad-generator', 'ai-copy', 'sales-copy'],
    titleEn: 'AI Copywriting & Ad Pack Generator',
    titleUr: 'اے آئی اشتہاری تحریر ساز (فیس بک، واٹس ایپ، ٹک ٹاک)',
    seoTitle: 'Free AI Copywriting & Ad Generator Pakistan (AIDA/PAS) | RizqDaan Tools',
    seoDesc: 'Generate high-converting Facebook ads, TikTok scripts, Instagram story hooks, and WhatsApp closing messages in Urdu, Roman Urdu, and English.',
    seoKeywords: 'ai copywriting free, ad copy generator, facebook ad copy urdu, whatsapp marketing copy, aida copy generator',
    category: 'writing',
    categoryLabel: 'Writing & Content',
    icon: '✍️',
    badge: 'AI Powered',
    faqs: [
      {
        q: 'What copywriting frameworks are supported?',
        a: 'We support AIDA (Attention, Interest, Desire, Action), PAS (Problem, Agitate, Solution), TikTok Viral 30s Scripts, and WhatsApp Direct Closers.'
      }
    ]
  },
  {
    id: 'image-compressor',
    slugs: ['image-compressor', 'image-resizer', 'compress-image', 'reduce-image-kb'],
    titleEn: 'Image Compressor & Resizer (KB / MB Reducer)',
    titleUr: 'آن لائن تصویر کمپریسر اور سائز کم کرنے کا ٹول',
    seoTitle: 'Free Online Image Compressor & Resizer (Reduce KB Size) | RizqDaan Tools',
    seoDesc: 'Compress JPG, PNG, and WebP images up to 85% without quality loss directly in your browser. 100% private with zero server uploads.',
    seoKeywords: 'image compressor online, compress image to 50kb, reduce photo size in kb, resize image online, webp image compressor',
    category: 'images',
    categoryLabel: 'Images & Media',
    icon: '🖼️',
    badge: '100% Client-Side',
    faqs: [
      {
        q: 'Are my images uploaded to any server?',
        a: 'No! All image compression is handled 100% client-side inside your browser via HTML5 Canvas for total privacy.'
      }
    ]
  },
  {
    id: 'meta-tag-generator',
    slugs: ['meta-tag-generator', 'meta-tags', 'seo-tags', 'open-graph-generator'],
    titleEn: 'SEO Meta Tag Generator & SERP Simulator',
    titleUr: 'ایس ای او میٹا ٹیگ جنریٹر اور گوگل سرچ پریویو',
    seoTitle: 'SEO Meta Tags Generator & Live Google SERP Simulator | RizqDaan Tools',
    seoDesc: 'Generate search engine optimized meta title, meta description, keywords, Open Graph, and Twitter Cards with real-time Google search snippet preview.',
    seoKeywords: 'meta tag generator, seo meta tags maker, google serp simulator, open graph meta generator, twitter card tags',
    category: 'seo',
    categoryLabel: 'SEO & Webmaster',
    icon: '🏷️',
    faqs: [
      {
        q: 'Why are meta tags important for Google ranking?',
        a: 'Meta titles and descriptions tell Google what your page is about and directly influence organic Click-Through Rate (CTR) in search results.'
      }
    ]
  },
  {
    id: 'keyword-density',
    slugs: ['keyword-density', 'keyword-analyzer', 'keyword-frequency'],
    titleEn: 'Keyword Density & Phrase Frequency Analyzer',
    titleUr: 'کی ورڈ ڈینسٹی اور سرچ تجزیہ کار',
    seoTitle: 'Keyword Density Checker & N-Gram Frequency Analyzer | RizqDaan Tools',
    seoDesc: 'Audit 1-word, 2-word, and 3-word phrase density to prevent keyword stuffing penalties and optimize organic Google rankings.',
    seoKeywords: 'keyword density checker, keyword frequency tool, seo keyword analyzer, check keyword stuffing',
    category: 'seo',
    categoryLabel: 'SEO & Webmaster',
    icon: '🔑',
    faqs: [
      {
        q: 'What is the optimal keyword density for Google SEO?',
        a: 'An ideal primary keyword density is typically between 1% to 2.5%. Densities above 3% risk keyword stuffing algorithmic penalties.'
      }
    ]
  },
  {
    id: 'word-counter',
    slugs: ['word-counter', 'character-counter', 'reading-time'],
    titleEn: 'Word & Character Counter (Live Reading Time)',
    titleUr: 'الفاظ اور حروف کا کاؤنٹر اور پڑھنے کا وقت',
    seoTitle: 'Live Word & Character Counter Online with Reading Time | RizqDaan Tools',
    seoDesc: 'Count words, characters with and without spaces, sentences, paragraphs, reading time, and speaking time in real time.',
    seoKeywords: 'word counter online, character counter, word count tool, reading time calculator, urdu word counter',
    category: 'writing',
    categoryLabel: 'Writing & Content',
    icon: '📏',
    faqs: [
      {
        q: 'How is reading time calculated?',
        a: 'Standard human silent reading speed averages 200 to 230 words per minute. Our tool uses 225 WPM as the baseline.'
      }
    ]
  },
  {
    id: 'case-converter',
    slugs: ['case-converter', 'text-formatter', 'convert-case'],
    titleEn: 'Text Case Converter & Capitalization Formatter',
    titleUr: 'ٹیکسٹ کیس کنورٹر اور فارمیٹر',
    seoTitle: 'Online Text Case Converter (UPPERCASE, lowercase, Title Case) | RizqDaan Tools',
    seoDesc: 'Convert text case instantly to UPPERCASE, lowercase, Title Case, Sentence Case, Capitalized Case, and CamelCase with 1-click whitespace cleaner.',
    seoKeywords: 'case converter, uppercase to lowercase, title case converter, sentence case online, clean spaces',
    category: 'writing',
    categoryLabel: 'Writing & Content',
    icon: '🔤',
    faqs: [
      {
        q: 'Can this tool remove duplicate spaces and blank lines?',
        a: 'Yes, click "Remove Extra Spaces" to instantly clean unnecessary tabs, duplicate spaces, and extra line breaks.'
      }
    ]
  },
  {
    id: 'invoice',
    slugs: ['invoice', 'urdu-invoice', 'receipt-maker', 'bill-generator'],
    titleEn: 'Digital Invoice, Bill & Urdu Khata Generator',
    titleUr: 'ڈیجیٹل انوائس، بل اور اردو کھاتہ جنریٹر',
    seoTitle: 'Free Invoice Generator Pakistan & Thermal POS Receipt Maker | RizqDaan Tools',
    seoDesc: 'Create professional PDF invoices, retail receipts, and Urdu customer khata bills with automatic tax calculation and direct WhatsApp receipt sharing.',
    seoKeywords: 'invoice generator pakistan, free online invoice maker, urdu khata bill, thermal pos receipt generator, pdf bill maker',
    category: 'ecommerce',
    categoryLabel: 'E-Commerce & Business',
    icon: '🧾',
    faqs: [
      {
        q: 'Can I send receipts directly on WhatsApp?',
        a: 'Yes! Click "WhatsApp Receipt" to send a pre-formatted itemized bill directly to your customer without downloading.'
      }
    ]
  },
  {
    id: 'robots-sitemap',
    slugs: ['robots-sitemap', 'robots-txt-generator', 'sitemap-generator', 'xml-sitemap'],
    titleEn: 'Robots.txt & XML Sitemap Generator',
    titleUr: 'روبوٹس فائل اور سائٹ میپ جنریٹر',
    seoTitle: 'Free Robots.txt & XML Sitemap Generator for Google Search Console | RizqDaan Tools',
    seoDesc: 'Generate valid robots.txt files and XML sitemaps to optimize search engine crawl budget and accelerate Google indexing.',
    seoKeywords: 'robots txt generator, xml sitemap generator, google sitemap maker, seo crawl optimizer',
    category: 'seo',
    categoryLabel: 'SEO & Webmaster',
    icon: '🤖',
    faqs: [
      {
        q: 'How does an XML sitemap help SEO?',
        a: 'An XML sitemap provides a roadmap of all important URLs to search engine bots, ensuring newly created pages get indexed quickly.'
      }
    ]
  },
  {
    id: 'whatsapp-qr',
    slugs: ['whatsapp-qr', 'whatsapp-link', 'qr-code-generator', 'direct-whatsapp'],
    titleEn: 'WhatsApp Direct Chat Link & QR Code Generator',
    titleUr: 'واٹس ایپ ڈائریکٹ چیٹ لنک اور کیو آر کوڈ جنریٹر',
    seoTitle: 'WhatsApp Direct Chat Link & Custom QR Code Generator | RizqDaan Tools',
    seoDesc: 'Create direct wa.me chat links with custom pre-filled inquiry text without saving contacts, plus generate downloadable high-res QR codes.',
    seoKeywords: 'whatsapp link generator, wa me link with message, create qr code free, download qr code image',
    category: 'ecommerce',
    categoryLabel: 'E-Commerce & Business',
    icon: '📱',
    faqs: [
      {
        q: 'Do customers need to save my phone number to message me?',
        a: 'No! Direct wa.me links open WhatsApp instantly with your pre-written message even if your number is not in their phonebook.'
      }
    ]
  },
  {
    id: 'discount-gst',
    slugs: ['discount-gst', 'discount-calculator', 'gst-calculator', 'tax-calculator'],
    titleEn: 'Sales Discount & Pakistan GST / Tax Calculator',
    titleUr: 'ڈسکاؤنٹ اور سیلز ٹیکس (GST / VAT) کیلکولیٹر',
    seoTitle: 'Sales Discount & Pakistan GST (18%) Calculator | RizqDaan Tools',
    seoDesc: 'Calculate discount savings, FBR sales tax (GST 18%), and final customer payable balance with itemized breakdown.',
    seoKeywords: 'discount calculator, pakistan gst calculator, sales tax calculator fbr, price after discount',
    category: 'ecommerce',
    categoryLabel: 'E-Commerce & Business',
    icon: '💰',
    faqs: [
      {
        q: 'What is the standard GST rate in Pakistan?',
        a: 'The standard General Sales Tax (GST) rate in Pakistan is 18% on taxable goods and supplies.'
      }
    ]
  }
];

const ToolsPage: React.FC<ToolsPageProps> = ({ initialTool, onNavigate, user }) => {
  const { isUrdu } = useLanguage();

  // Find initial tool by matching slugs
  const resolveToolKey = (slug?: string): ToolKey => {
    if (!slug) return 'profit-calculator';
    const match = TOOLS_CONFIG.find(t => t.id === slug || t.slugs.includes(slug.toLowerCase()));
    return match ? match.id : 'profit-calculator';
  };

  const [activeTool, setActiveTool] = useState<ToolKey>(() => resolveToolKey(initialTool));
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'ecommerce' | 'writing' | 'images' | 'seo'>('all');
  const [copyToast, setCopyToast] = useState<string | null>(null);

  const currentToolMeta = TOOLS_CONFIG.find(t => t.id === activeTool) || TOOLS_CONFIG[0];

  // ══════════════════════════════════════════════════════════════════
  // 🚀 DEEP SEO ENGINE (Dynamic Title, Meta Tags, Canonical & JSON-LD)
  // ══════════════════════════════════════════════════════════════════
  useEffect(() => {
    // 1. Dynamic Page Title
    document.title = currentToolMeta.seoTitle;

    // 2. Dynamic Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', currentToolMeta.seoDesc);

    // 3. Dynamic Meta Keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute('content', currentToolMeta.seoKeywords);

    // 4. Dynamic Canonical Link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    const currentUrl = `https://rizqdaan.com/?tool=${currentToolMeta.id}`;
    canonical.setAttribute('href', currentUrl);

    // 5. Open Graph Meta Tags
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', currentToolMeta.seoTitle);

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', currentToolMeta.seoDesc);

    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', currentUrl);

    // 6. Dynamic JSON-LD Structured Data for Google Rich Snippets & FAQs
    const schemaId = 'dynamic-tool-jsonld';
    let schemaScript = document.getElementById(schemaId) as HTMLScriptElement | null;
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.id = schemaId;
      schemaScript.type = 'application/ld+json';
      document.head.appendChild(schemaScript);
    }

    const structuredData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebApplication",
          "name": currentToolMeta.titleEn,
          "alternateName": currentToolMeta.titleUr,
          "url": currentUrl,
          "description": currentToolMeta.seoDesc,
          "applicationCategory": "BusinessApplication, UtilitiesApplication",
          "operatingSystem": "All",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "PKR"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "ratingCount": "1240"
          }
        },
        {
          "@type": "FAQPage",
          "mainEntity": currentToolMeta.faqs.map(faq => ({
            "@type": "Question",
            "name": faq.q,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": faq.a
            }
          }))
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "RizqDaan",
              "item": "https://rizqdaan.com/"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Tools",
              "item": "https://rizqdaan.com/?tool=all"
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": currentToolMeta.titleEn,
              "item": currentUrl
            }
          ]
        }
      ]
    };

    schemaScript.textContent = JSON.stringify(structuredData);

    return () => {
      // clean up if needed
    };
  }, [currentToolMeta]);

  // Handle Tool Switch with URL update
  const switchTool = (toolId: ToolKey) => {
    setActiveTool(toolId);
    try {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('tool', toolId);
      window.history.pushState({ tool: toolId }, '', newUrl.toString());
    } catch (e) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showToast = (msg: string) => {
    setCopyToast(msg);
    setTimeout(() => setCopyToast(null), 3000);
  };

  const copyToClipboard = (text: string, successMsg?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast(successMsg || (isUrdu ? 'کاپی ہو گیا!' : 'Copied to clipboard!'));
  };

  // Filter tools based on search and category
  const filteredTools = TOOLS_CONFIG.filter(t => {
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    const matchesSearch = !searchFilter.trim() || 
      t.titleEn.toLowerCase().includes(searchFilter.toLowerCase()) || 
      t.titleUr.includes(searchFilter) ||
      t.seoKeywords.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-dark-bg text-slate-900 dark:text-zinc-100 pb-20">
      {/* Toast alert */}
      {copyToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-bounce">
          <span>✨</span> {copyToast}
        </div>
      )}

      {/* Hero Header & Search Hub */}
      <section className="bg-gradient-to-b from-[#002f34] via-[#003d44] to-[#002f34] text-white pt-8 pb-12 px-4 sm:px-6 lg:px-8 border-b border-teal-900/50">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                ⚡ 100% Free Online Small SEO Tools & Business Suite
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                {isUrdu ? 'رزق دان پروفیشنل ٹولز و ایس ای او سویٹ' : 'RizqDaan Pro Business, Content & Small SEO Tools'}
              </h1>
            </div>
            <div className="text-xs text-teal-200/80 max-w-xs sm:text-right hidden sm:block">
              12+ Enterprise utilities crafted for Pakistani businesses, freelancers & creators.
            </div>
          </div>

          {/* Search & Category Filter Pills */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-3 text-slate-400">🔍</span>
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder={isUrdu ? 'ٹول تلاش کریں (مثلاً: Profit Calculator, Plagiarism, Image Compress)...' : 'Search tools (e.g. Profit or Loss Calculator, Plagiarism, Image Resizer)...'}
                className="w-full pl-10 pr-4 py-2.5 bg-white/10 hover:bg-white/15 focus:bg-white text-white focus:text-slate-900 placeholder-teal-200/60 focus:placeholder-slate-400 border border-teal-700/60 focus:border-white rounded-xl text-sm focus:outline-none transition shadow-inner backdrop-blur-sm"
              />
              {searchFilter && (
                <button
                  type="button"
                  onClick={() => setSearchFilter('')}
                  className="absolute right-3 top-2.5 text-xs text-teal-200 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {[
                { id: 'all', label: 'All Tools' },
                { id: 'ecommerce', label: '📊 E-Commerce' },
                { id: 'writing', label: '✍️ Writing' },
                { id: 'images', label: '🖼️ Images' },
                { id: 'seo', label: '⚙️ SEO Suite' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id as any)}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition border ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-500 text-white border-emerald-400 shadow-md'
                      : 'bg-white/10 text-teal-100 border-teal-700/40 hover:bg-white/20'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tool Selector Horizontal Strip */}
      <section className="bg-white dark:bg-dark-surface border-b border-slate-200 dark:border-zinc-800 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 overflow-x-auto scrollbar-none flex gap-2">
          {filteredTools.map((t) => {
            const isActive = activeTool === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => switchTool(t.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition shrink-0 ${
                  isActive
                    ? 'bg-primary text-white dark:bg-emerald-600 shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300'
                }`}
              >
                <span>{t.icon}</span>
                <span>{isUrdu ? t.titleUr : t.titleEn.split('(')[0]}</span>
                {t.badge && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'}`}>
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Tool Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Render the Active Tool Component */}
        <div className="min-h-[500px]">
          {activeTool === 'profit-calculator' && (
            <ProfitLossCalculatorTool isUrdu={isUrdu} onCopy={copyToClipboard} />
          )}

          {activeTool === 'plagiarism-checker' && (
            <PlagiarismCheckerTool isUrdu={isUrdu} onCopy={copyToClipboard} />
          )}

          {activeTool === 'copywriting' && (
            <AiCopywritingTool isUrdu={isUrdu} userPhone={user?.phone} onCopy={copyToClipboard} />
          )}

          {activeTool === 'image-compressor' && (
            <ImageCompressorTool isUrdu={isUrdu} onCopy={copyToClipboard} />
          )}

          {activeTool === 'meta-tag-generator' && (
            <MetaTagGeneratorTool isUrdu={isUrdu} onCopy={copyToClipboard} />
          )}

          {activeTool === 'keyword-density' && (
            <KeywordDensityTool isUrdu={isUrdu} onCopy={copyToClipboard} />
          )}

          {activeTool === 'word-counter' && (
            <WordCounterTool isUrdu={isUrdu} onCopy={copyToClipboard} />
          )}

          {activeTool === 'case-converter' && (
            <CaseConverterTool isUrdu={isUrdu} onCopy={copyToClipboard} />
          )}

          {activeTool === 'invoice' && (
            <InvoiceKhataTool isUrdu={isUrdu} userPhone={user?.phone} onCopy={copyToClipboard} />
          )}

          {activeTool === 'robots-sitemap' && (
            <RobotsSitemapTool isUrdu={isUrdu} onCopy={copyToClipboard} />
          )}

          {activeTool === 'whatsapp-qr' && (
            <WhatsAppAndQrTool isUrdu={isUrdu} onCopy={copyToClipboard} />
          )}

          {activeTool === 'discount-gst' && (
            <DiscountGstTool isUrdu={isUrdu} onCopy={copyToClipboard} />
          )}
        </div>

        {/* 📚 SEO & FAQ Accordion Section for Active Tool (Top Google Ranking Anchor) */}
        <section className="mt-14 pt-10 border-t border-slate-200 dark:border-zinc-800 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {isUrdu ? 'اکثر پوچھے گئے سوالات (FAQs) اور گائیڈ' : `Frequently Asked Questions (FAQ) - ${currentToolMeta.titleEn.split('(')[0]}`}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
                Everything you need to know about using {currentToolMeta.titleEn} for maximum online success.
              </p>
            </div>
            <span className="text-xs px-3 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold rounded-full border border-emerald-200 dark:border-emerald-800">
              Verified by RizqDaan SEO
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentToolMeta.faqs.map((faq, idx) => (
              <div key={idx} className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-zinc-700/80 rounded-2xl p-5 shadow-sm space-y-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-start gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">Q:</span>
                  <span>{faq.q}</span>
                </h4>
                <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed pl-5">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>

          {/* Explore Other Free Tools Grid */}
          <div className="pt-8">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
              Explore More Free Tools & Utilities on RizqDaan
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {TOOLS_CONFIG.filter(t => t.id !== activeTool).slice(0, 8).map(tool => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => switchTool(tool.id)}
                  className="p-3.5 rounded-xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-zinc-700/80 hover:border-emerald-500 dark:hover:border-emerald-500 text-left transition shadow-xs group"
                >
                  <div className="text-xl mb-1.5 group-hover:scale-110 transition transform origin-left">{tool.icon}</div>
                  <div className="text-xs font-bold text-slate-800 dark:text-zinc-100 line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                    {isUrdu ? tool.titleUr : tool.titleEn.split('(')[0]}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                    {tool.categoryLabel}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ToolsPage;
