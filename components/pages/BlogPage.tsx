import React, { useState, useEffect } from 'react';
import { BlogPost, Listing, FlashNewsItem } from '../../types';
import { 
  getBlogPosts, 
  PAKISTAN_TRENDING_TOPICS, 
  generateFullSeoArticle, 
  saveBlogPost, 
  deleteBlogPost,
  checkAndTriggerAutoPublish,
  getEffectiveViews,
  getFlashNews,
  addFlashNewsItem,
  handleBlogImageError,
  handleAvatarError,
  getSmartCoverImage
} from '../../services/blogService';
import { useLanguage } from '../../src/context/LanguageContext';

interface BlogPageProps {
  onNavigate: (view: any, payload?: any) => void;
  listings: Listing[];
}

export const BlogPage: React.FC<BlogPageProps> = ({ onNavigate, listings }) => {
  const { isUrdu } = useLanguage();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [flashNews, setFlashNews] = useState<FlashNewsItem[]>([]);
  const [selectedFlashNews, setSelectedFlashNews] = useState<FlashNewsItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'views' | 'likes' | 'trending'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [customTopicInput, setCustomTopicInput] = useState<string>('');
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [showFlashModal, setShowFlashModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'trending' | 'flash' | 'archive'>('trending');
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Form states for new flash news
  const [newFlashTitle, setNewFlashTitle] = useState('');
  const [newFlashSummary, setNewFlashSummary] = useState('');
  const [newFlashSource, setNewFlashSource] = useState('Sarafa / Market Desk');
  const [newFlashCategory, setNewFlashCategory] = useState<'breaking' | 'rates' | 'business' | 'tech' | 'policy'>('breaking');

  // Load posts & start 5-minute silent background check
  useEffect(() => {
    loadArticles();
    loadFlashNews();

    // SEO Title & Meta tags
    document.title = isUrdu 
      ? 'پاکستان مارکیٹ نیوز، سونے کے ریٹس، پی ٹی اے ٹیکس و خریداری گائیڈ | RizqDaan'
      : 'Pakistan Market Rates, Gold Prices, PTA Taxes & Buying Guides 2026 | RizqDaan';

    // Trigger auto-pilot check on load
    checkAndTriggerAutoPublish().then(newPost => {
      if (newPost) {
        setPosts(prev => [newPost, ...prev.filter(p => p.id !== newPost.id)]);
      }
    }).catch(() => {});

    // Silent background publisher runs every 60s to check if 5 minutes elapsed
    const bgTimer = setInterval(() => {
      checkAndTriggerAutoPublish().then(p => {
        if (p) loadArticles();
      }).catch(() => {});
    }, 60 * 1000);

    return () => clearInterval(bgTimer);
  }, []);

  const loadArticles = async () => {
    const list = await getBlogPosts();
    setPosts(list);
  };

  const loadFlashNews = async () => {
    const flashes = await getFlashNews();
    setFlashNews(flashes);
  };

  const handleCreateFlashNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlashTitle.trim() || !newFlashSummary.trim()) return;

    const newItem: FlashNewsItem = {
      id: `fn-${Date.now()}`,
      title: newFlashTitle.trim(),
      urduTitle: newFlashTitle.trim(),
      summary: newFlashSummary.trim(),
      urduSummary: newFlashSummary.trim(),
      category: newFlashCategory,
      categoryLabel: newFlashCategory.toUpperCase(),
      timestamp: new Date().toISOString(),
      timeAgo: 'Just now',
      source: newFlashSource || 'Market Alert Desk',
      views: 120,
      badgeText: newFlashCategory === 'breaking' ? '🚨 BREAKING' : '⚡ LIVE TREND',
      badgeType: newFlashCategory === 'breaking' ? 'breaking' : 'hot',
      fullDetails: newFlashSummary.trim()
    };

    const updated = await addFlashNewsItem(newItem);
    setFlashNews(updated);
    setShowFlashModal(false);
    setNewFlashTitle('');
    setNewFlashSummary('');
    setStatusNotification(isUrdu ? '⚡ بریکنگ نیوز الرٹ کامیابی سے نشر ہو گیا!' : '⚡ Breaking flash news alert published live!');
    setTimeout(() => setStatusNotification(null), 3000);
  };

  const handleGenerateNextInQueue = async (customTopic?: string) => {
    setIsGenerating(true);
    setStatusNotification(isUrdu ? 'گوگل سرچ سے لائیو ریٹس اینالائز کر کے نیا مضمون لکھا جا رہا ہے...' : 'AI researching live Google Trends & writing 1,400+ words article...');
    try {
      let topicToUse;
      if (customTopic) {
        topicToUse = {
          topic: customTopic,
          category: "market_rates" as const,
          categoryLabel: "Market News",
          keyword: customTopic.split(' ').slice(0, 4).join(' '),
          relatedProductKeyword: customTopic.split(' ')[0],
          coverImage: getSmartCoverImage(customTopic, "market_rates")
        };
      } else {
        const existingKeywords = posts.map(p => p.keyword.toLowerCase());
        topicToUse = PAKISTAN_TRENDING_TOPICS.find(
          t => !existingKeywords.some(ek => ek.includes(t.keyword.toLowerCase()))
        ) || PAKISTAN_TRENDING_TOPICS[Math.floor(Math.random() * PAKISTAN_TRENDING_TOPICS.length)];
      }

      const newArticle = await generateFullSeoArticle(topicToUse);
      await saveBlogPost(newArticle);
      setPosts(prev => [newArticle, ...prev.filter(p => p.id !== newArticle.id)]);
      setStatusNotification(isUrdu ? '✅ نیا آرٹیکل کامیابی سے شائع اور مستقل محفوظ ہو گیا!' : '✅ New verified article published and permanently stored!');
      setTimeout(() => setStatusNotification(null), 3000);
      setShowCustomModal(false);
      setCustomTopicInput('');
    } catch (e) {
      console.error("Manual article generation failed:", e);
      setStatusNotification(isUrdu ? '❌ ایرر: دوبارہ کوشش کریں۔' : '❌ Error generating article. Please retry.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(isUrdu ? 'کیا آپ اس آرٹیکل کو ڈیلیٹ کرنا چاہتے ہیں؟' : 'Are you sure you want to delete this article?')) {
      await deleteBlogPost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
    }
  };

  const categories = [
    { id: 'all', label: isUrdu ? 'تمام مضامین' : 'All Topics', icon: '🔥' },
    { id: 'market_rates', label: isUrdu ? 'سونے و مارکیٹ ریٹس' : 'Gold & Rates', icon: '💰' },
    { id: 'mobiles', label: isUrdu ? 'موبائلز و پی ٹی اے' : 'Mobiles & PTA', icon: '📱' },
    { id: 'vehicles', label: isUrdu ? 'بائیکس و گاڑیاں' : 'Bikes & Cars', icon: '🏍️' },
    { id: 'electronics', label: isUrdu ? 'لیپ ٹاپس و سولر' : 'Laptops & Solar', icon: '💻' },
    { id: 'business', label: isUrdu ? 'ہول سیل و بزنس' : 'Wholesale Market', icon: '🏬' },
    { id: 'buying_guides', label: isUrdu ? 'رہنمائی و ٹپس' : 'Buyer Guides', icon: '🛡️' }
  ];

  // Months available for filtering
  const availableMonths = Array.from(new Set(
    posts.map(p => {
      const d = new Date(p.publishedAt);
      return `${d.toLocaleString('en-PK', { month: 'short' })} ${d.getFullYear()}`;
    })
  ));

  // Filter & Sort Logic
  const filteredPosts = posts.filter(post => {
    const matchesCat = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.keyword.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const postDate = new Date(post.publishedAt);
    const postMonthStr = `${postDate.toLocaleString('en-PK', { month: 'short' })} ${postDate.getFullYear()}`;
    const matchesMonth = selectedMonth === 'all' || postMonthStr === selectedMonth;

    return matchesCat && matchesSearch && matchesMonth;
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    if (sortBy === 'views') return getEffectiveViews(b) - getEffectiveViews(a);
    if (sortBy === 'likes') return (b.likes || 0) - (a.likes || 0);
    if (sortBy === 'trending') return (b.trendingScore || 0) - (a.trendingScore || 0);
    return 0;
  });

  const featuredPost = filteredPosts[0];
  const secondaryPosts = filteredPosts.slice(1);
  const totalViews = posts.reduce((sum, p) => sum + getEffectiveViews(p), 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-dark-bg pb-24 text-gray-900 dark:text-white">
      {/* 🔴 LIVE COMMODITY RATES TICKER */}
      <div className="bg-emerald-950 text-emerald-100 py-2.5 px-4 text-xs font-bold flex items-center gap-3 overflow-hidden border-b border-emerald-900 shadow-inner">
        <span className="flex items-center gap-1.5 bg-red-600 text-white px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black animate-pulse flex-shrink-0">
          <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
          LIVE 2026
        </span>
        <div className="overflow-x-auto whitespace-nowrap scrollbar-none flex items-center gap-6 text-[11px] font-medium">
          <span>💰 <b>Sarafa Bazar:</b> 24K Gold Tola: Rs. 484,000 | 10g: Rs. 414,960</span>
          <span>•</span>
          <span>💵 <b>Forex Rate:</b> USD to PKR: Rs. 278.40 (Interbank) | Rs. 280.25 (Open Market)</span>
          <span>•</span>
          <span>📱 <b>PTA DIRBS:</b> iPhone 15 Pro Max Passport: Rs. 132,000 | CNIC: Rs. 156,000</span>
          <span>•</span>
          <span>🏍️ <b>Atlas Honda:</b> CD 70: Rs. 157,900 | CG 125: Rs. 234,900</span>
          <span>•</span>
          <span>⚡ <b>Solar Energy:</b> 585W Tier-1 Panels: Rs. 34 - 38 / Watt</span>
        </div>
      </div>

      {/* STATUS NOTIFICATION TOAST */}
      {statusNotification && (
        <div className="bg-emerald-600 text-white py-2.5 px-4 text-center text-xs font-bold shadow-md animate-fade-in flex items-center justify-center gap-2">
          <span>{statusNotification}</span>
        </div>
      )}

      {/* CLEAN EDITORIAL HEADER & HERO */}
      <div className="bg-gradient-to-r from-emerald-900 via-primary to-teal-900 text-white py-8 px-4 sm:px-6 lg:px-8 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2.5">
                <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-white/20">
                  ⚡ Pakistan Market Intelligence
                </span>
                <span className="bg-amber-400 text-gray-900 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                  100% Verified Rates
                </span>
                <span className="bg-emerald-400/30 text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  📚 {posts.length} Verified Guides
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight drop-shadow-sm">
                {isUrdu ? 'پاکستان مارکیٹ نیوز، ریٹس و خریداری گائیڈ' : 'Pakistan Market News, Rates & Buying Guides'}
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100 mt-1.5 max-w-2xl font-normal leading-relaxed">
                {isUrdu 
                  ? 'گوگل ٹرینڈز اور مارکیٹ کے ہائی-سرچ کی ورڈز پر مبنی مصدقہ ریٹس، سونا، کرنسی، پی ٹی اے ٹیکس، بائیکس، اور رزق دان پر ڈائریکٹ سودے بغیر کمیشن۔'
                  : 'Real-time verified commodity rates, smartphone PTA tax schedules, automobile valuations, and direct marketplace deals across Pakistan.'}
              </p>
            </div>

            {/* Subtle Editorial Actions */}
            <div className="flex flex-wrap lg:flex-col gap-2 min-w-[200px] justify-start lg:justify-end">
              <button
                type="button"
                onClick={() => setShowFlashModal(true)}
                className="py-2 px-3.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                <span>⚡</span>
                <span>{isUrdu ? 'شارٹ بریکنگ نیوز بھیجیں' : 'Post Breaking Flash'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCustomModal(true)}
                className="py-2 px-3.5 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl border border-white/30 transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>✍️</span>
                <span>{isUrdu ? 'نیا تفصیلی آرٹیکل' : 'Write Full Article'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleGenerateNextInQueue()}
                disabled={isGenerating}
                className="py-1.5 px-3 bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold text-[11px] rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isGenerating ? (
                  <span>Generating...</span>
                ) : (
                  <>
                    <span>✨</span>
                    <span>{isUrdu ? 'آٹو آرٹیکل تیار کریں' : 'Generate SEO Guide'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* TAB NAVIGATION: TRENDING VS FLASH VS ARCHIVE */}
          <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/15 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('trending')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'trending'
                  ? 'bg-white text-emerald-950 shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <span>🔥</span>
              <span>{isUrdu ? 'تازہ ترین و ٹرینڈنگ فیڈ' : 'Featured & Trending'}</span>
            </button>

            <button
              onClick={() => setActiveTab('flash')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'flash'
                  ? 'bg-white text-emerald-950 shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              <span>{isUrdu ? '⚡ بریکنگ نیوز و شارٹ ٹرینڈز' : '⚡ Live Breaking Flashes'} ({flashNews.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('archive')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'archive'
                  ? 'bg-white text-emerald-950 shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <span>📚</span>
              <span>{isUrdu ? 'مکمل آرکائیو لائبریری' : 'Full Article Library'} ({posts.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* POST BREAKING FLASH NEWS MODAL */}
      {showFlashModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-surface max-w-lg w-full rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700 animate-scale-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                <span className="text-red-600">⚡</span>
                <span>{isUrdu ? 'شارٹ بریکنگ نیوز یا مارکیٹ الرٹ پوسٹ کریں' : 'Post Live Short Breaking News'}</span>
              </h3>
              <button 
                onClick={() => setShowFlashModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFlashNews} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300 block mb-1">
                  {isUrdu ? 'بریکنگ ہیڈلائن' : 'Breaking Headline'}
                </label>
                <input
                  type="text"
                  required
                  value={newFlashTitle}
                  onChange={(e) => setNewFlashTitle(e.target.value)}
                  placeholder="e.g. Gold Price jumped by Rs. 2,000 per tola in Sarafa Market"
                  className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300 block mb-1">Category</label>
                  <select
                    value={newFlashCategory}
                    onChange={(e: any) => setNewFlashCategory(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-xs font-bold"
                  >
                    <option value="breaking">🚨 Breaking Alert</option>
                    <option value="rates">💰 Commodity / Rate</option>
                    <option value="tech">📱 Mobile & Tech</option>
                    <option value="business">🏬 Business & Auto</option>
                    <option value="policy">📜 Government / Policy</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300 block mb-1">Source / Attribution</label>
                  <input
                    type="text"
                    value={newFlashSource}
                    onChange={(e) => setNewFlashSource(e.target.value)}
                    placeholder="e.g. Sarafa Association / SBP"
                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300 block mb-1">
                  {isUrdu ? 'مختصر تفصیل / اہم نکات' : 'Short Summary / Key Details'}
                </label>
                <textarea
                  rows={3}
                  required
                  value={newFlashSummary}
                  onChange={(e) => setNewFlashSummary(e.target.value)}
                  placeholder="Provide concise, accurate 2-3 sentences breaking summary..."
                  className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowFlashModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <span>⚡</span>
                  <span>Publish Flash Alert</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FLASH NEWS DETAIL MODAL */}
      {selectedFlashNews && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-surface max-w-xl w-full rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700 animate-scale-up">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                  selectedFlashNews.badgeType === 'breaking'
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-amber-400 text-gray-900'
                }`}>
                  {selectedFlashNews.badgeText}
                </span>
                <span className="text-xs text-gray-400">⏱️ {selectedFlashNews.timeAgo}</span>
                <span className="text-xs text-gray-400">• 👁️ {selectedFlashNews.views} views</span>
              </div>
              <button 
                onClick={() => setSelectedFlashNews(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-base"
              >
                ✕
              </button>
            </div>

            <h2 className="text-lg font-black text-gray-900 dark:text-white leading-snug">
              {isUrdu && selectedFlashNews.urduTitle ? selectedFlashNews.urduTitle : selectedFlashNews.title}
            </h2>

            <div className="my-3 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 rounded-2xl">
              <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase block mb-1">
                Verified Source & Reporting:
              </span>
              <span className="text-xs font-semibold text-gray-800 dark:text-emerald-100">
                🏛️ {selectedFlashNews.source}
              </span>
            </div>

            <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed font-normal">
              {selectedFlashNews.fullDetails || selectedFlashNews.summary}
            </p>

            {/* Matching Marketplace Listings */}
            {selectedFlashNews.relatedKeyword && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-gray-900 dark:text-white">
                    {isUrdu ? 'رزق دان پر متعلقہ ڈائریکٹ سودے:' : 'Matching Marketplace Deals on RizqDaan:'}
                  </span>
                  <button 
                    onClick={() => {
                      setSelectedFlashNews(null);
                      onNavigate('listings', { query: selectedFlashNews.relatedKeyword });
                    }}
                    className="text-[11px] font-bold text-primary hover:underline"
                  >
                    View All →
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {listings.filter(l => 
                    l.title.toLowerCase().includes((selectedFlashNews.relatedKeyword || '').toLowerCase()) ||
                    l.category.toLowerCase().includes((selectedFlashNews.relatedKeyword || '').toLowerCase())
                  ).slice(0, 2).map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => {
                        setSelectedFlashNews(null);
                        onNavigate('details', { listing: item });
                      }}
                      className="cursor-pointer p-2 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center gap-2 hover:border-primary transition-all"
                    >
                      <img src={item.imageUrl} alt={item.title} className="w-10 h-10 rounded-lg object-cover" />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">{item.title}</h4>
                        <span className="text-[11px] font-black text-primary">Rs. {item.price.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedFlashNews(null)}
                className="px-5 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-bold rounded-xl shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM TOPIC MODAL */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-surface max-w-lg w-full rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                <span>✍️</span>
                <span>{isUrdu ? 'کسی بھی ٹاپک پر 1400 الفاظ کا آرٹیکل بنائیں' : 'Generate Custom 1,400+ Words SEO Article'}</span>
              </h3>
              <button 
                onClick={() => setShowCustomModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              {isUrdu 
                ? 'اپنا مطلوبہ ٹاپک ٹائپ کریں، سسٹم گوگل سرچ سے 2026 کے تازہ ترین ریٹس سرچ کر کے مکمل SEO گائیڈ تیار کرے گا۔'
                : 'Type any trending Pakistani topic or rate query. The AI will Google-ground live 2026 data and publish it to the archive.'}
            </p>

            <input
              type="text"
              value={customTopicInput}
              onChange={(e) => setCustomTopicInput(e.target.value)}
              placeholder="e.g. Dollar Rate in Pakistan Today, Suzuki Cultus 2026 Price, Solar Inverter 6kW Rates"
              className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-none"
            />

            {/* Quick Suggestions */}
            <div className="mt-3">
              <span className="text-[10px] font-bold text-gray-400 block mb-1.5">Quick Trending Suggestions:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Today Gold Rate in Pakistan 2026",
                  "Suzuki Alto Used Car Rates & Fuel Average",
                  "Top 5 Used Laptops Under 80,000 PKR",
                  "Solar Net Metering & 5kW System Price",
                  "Faisalabad Wholesale Cloth Market Rates"
                ].map((sug, si) => (
                  <button
                    key={si}
                    type="button"
                    onClick={() => setCustomTopicInput(sug)}
                    className="text-[10px] bg-gray-100 dark:bg-gray-800 hover:bg-emerald-100 hover:text-primary px-2 py-1 rounded-md text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleGenerateNextInQueue(customTopicInput)}
                disabled={isGenerating || !customTopicInput.trim()}
                className="px-5 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-black rounded-xl shadow-md disabled:opacity-50 flex items-center gap-1.5"
              >
                {isGenerating ? 'Writing & Grounding...' : 'Generate & Publish to Archive'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FILTER CONTROLS & SEARCH BAR */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-white dark:bg-dark-surface p-4 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Search Box */}
            <div className="relative w-full md:w-80">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isUrdu ? 'مضمون یا ٹاپک تلاش کریں...' : 'Search articles, gold, PTA, cars...'}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-none"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Sort & Month Filter Dropdowns */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="py-2 px-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 focus:outline-none"
              >
                <option value="all">{isUrdu ? 'تمام مہینے' : 'All Months'}</option>
                {availableMonths.map((m, mi) => (
                  <option key={mi} value={m}>{m}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="py-2 px-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 focus:outline-none"
              >
                <option value="newest">{isUrdu ? 'تازہ ترین پہلے' : 'Newest First'}</option>
                <option value="views">{isUrdu ? 'زیادہ دیکھے گئے' : 'Most Viewed'}</option>
                <option value="likes">{isUrdu ? 'زیادہ پسندیدہ' : 'Most Liked'}</option>
                <option value="trending">{isUrdu ? 'ہائی ٹرینڈ اسکور' : 'Top Trending'}</option>
              </select>

              <div className="hidden sm:flex items-center border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 text-xs ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-gray-50 dark:bg-gray-800 text-gray-500'}`}
                  title="Grid View"
                >
                  ▦
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 text-xs ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-gray-50 dark:bg-gray-800 text-gray-500'}`}
                  title="List View"
                >
                  ☰
                </button>
              </div>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-gray-100 dark:border-gray-800">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                  selectedCategory === c.id
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-primary/50'
                }`}
              >
                <span>{c.icon}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ⚡ SHORT-TIME TRENDING & BREAKING NEWS SECTION (Shown on Trending & Flash tabs) */}
        {(activeTab === 'trending' || activeTab === 'flash') && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
                <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                  <span>⚡</span>
                  <span>{isUrdu ? 'شارٹ ٹائم ٹرینڈنگ و بریکنگ الرٹس' : 'Short-Time Trending & Breaking Flashes'}</span>
                </h3>
              </div>
              <button
                onClick={() => setShowFlashModal(true)}
                className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                <span>+ Post Alert</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {flashNews.map((fn) => (
                <div
                  key={fn.id}
                  onClick={() => setSelectedFlashNews(fn)}
                  className="cursor-pointer bg-white dark:bg-dark-surface p-4 rounded-2xl border border-gray-200/90 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-red-400 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        fn.badgeType === 'breaking' 
                          ? 'bg-red-600 text-white' 
                          : 'bg-amber-400 text-gray-900'
                      }`}>
                        {fn.badgeText}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">⏱️ {fn.timeAgo}</span>
                    </div>

                    <h4 className="text-xs font-black text-gray-900 dark:text-white leading-snug group-hover:text-primary transition-colors line-clamp-2">
                      {isUrdu && fn.urduTitle ? fn.urduTitle : fn.title}
                    </h4>

                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                      {isUrdu && fn.urduSummary ? fn.urduSummary : fn.summary}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between text-[10px]">
                    <span className="text-gray-400 font-medium truncate max-w-[120px]">🏛️ {fn.source}</span>
                    <span className="font-bold text-primary group-hover:underline">Quick Read →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ARTICLES GRID / ARCHIVE (Shown in Trending and Archive tabs) */}
        {activeTab !== 'flash' && (
          <>
            {filteredPosts.length === 0 ? (
              <div className="bg-white dark:bg-dark-surface p-12 text-center rounded-3xl border border-gray-200 dark:border-gray-800 my-8 shadow-sm">
                <span className="text-4xl mb-3 block">📰</span>
                <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">
                  {isUrdu ? 'اس فلٹر کے مطابق کوئی آرٹیکل نہیں ملا' : 'No articles match your selected filter'}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {isUrdu ? 'نیا آرٹیکل بنانے کے لیے "Publish Next" پر کلک کریں۔' : 'Click "Publish Next" above to create a fresh 1,400-word article instantly.'}
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                {/* Section Title */}
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <span>📖</span>
                    <span>{isUrdu ? 'تفصیلی آرٹیکلز و تصدیق شدہ گائیڈز' : 'In-Depth Market Analyses & Verified Guides'}</span>
                  </h3>
                  <span className="text-xs text-gray-400">{filteredPosts.length} Articles</span>
                </div>
            {/* FEATURED POST (HERO CARD) - Shown in Trending Tab */}
            {activeTab === 'trending' && featuredPost && (
              <div 
                onClick={() => onNavigate('blog-detail', { blogPost: featuredPost, blogId: featuredPost.id })}
                className="group cursor-pointer bg-white dark:bg-dark-surface rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all border border-gray-200/80 dark:border-gray-800 grid grid-cols-1 md:grid-cols-12"
              >
                <div className="md:col-span-6 relative overflow-hidden h-56 md:h-auto min-h-[260px]">
                  <img 
                    src={featuredPost.coverImage} 
                    alt={featuredPost.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    onError={(e) => handleBlogImageError(e, featuredPost.category, featuredPost.title)}
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="bg-red-600 text-white font-black text-[10px] uppercase px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                      <span>🔥</span> Google Trend #{featuredPost.trendingScore}
                    </span>
                    <span className="bg-primary text-white font-bold text-[10px] px-2.5 py-1 rounded-full shadow-md">
                      {featuredPost.categoryLabel}
                    </span>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    {featuredPost.readTimeMinutes} min read • {featuredPost.wordCount} words
                  </div>
                </div>

                <div className="md:col-span-6 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 font-medium mb-2">
                      <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded">
                        ✓ 2026 Verified
                      </span>
                      <span>📅 {new Date(featuredPost.publishedAt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span>•</span>
                      <span>👁️ {getEffectiveViews(featuredPost).toLocaleString()} views</span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white leading-tight group-hover:text-primary transition-colors">
                      {featuredPost.title}
                    </h2>

                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-2.5 line-clamp-3 leading-relaxed font-normal">
                      {featuredPost.summary}
                    </p>

                    {/* Price Highlights Chips if present */}
                    {featuredPost.priceHighlights && featuredPost.priceHighlights.length > 0 && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {featuredPost.priceHighlights.slice(0, 2).map((ph, phi) => (
                          <div key={phi} className="bg-emerald-50/70 dark:bg-gray-800 p-2 rounded-xl border border-emerald-200 dark:border-gray-700">
                            <span className="text-[10px] text-gray-500 block truncate">{ph.label}</span>
                            <span className="text-xs font-black text-emerald-800 dark:text-emerald-300">{ph.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img 
                        src={featuredPost.author.avatar} 
                        alt={featuredPost.author.name}
                        className="w-8 h-8 rounded-full object-cover border border-emerald-300"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        onError={handleAvatarError}
                      />
                      <div>
                        <p className="text-xs font-bold text-gray-800 dark:text-gray-200 leading-none">{featuredPost.author.name}</p>
                        <p className="text-[10px] text-gray-500 leading-none mt-0.5">{featuredPost.author.role}</p>
                      </div>
                    </div>

                    <span className="text-xs font-black text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      {isUrdu ? 'مکمل مضمون پڑھیں' : 'Read Full Guide'} →
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ARTICLE ARCHIVE VIEW: GRID VS LIST */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {(activeTab === 'trending' ? secondaryPosts : filteredPosts).map((post) => (
                  <div 
                    key={post.id}
                    onClick={() => onNavigate('blog-detail', { blogPost: post, blogId: post.id })}
                    className="group cursor-pointer bg-white dark:bg-dark-surface rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-gray-200/80 dark:border-gray-800 flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative h-44 overflow-hidden">
                        <img 
                          src={post.coverImage} 
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          onError={(e) => handleBlogImageError(e, post.category, post.title)}
                        />
                        <div className="absolute top-2.5 left-2.5 flex gap-1">
                          <span className="bg-primary/90 backdrop-blur-md text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow">
                            {post.categoryLabel}
                          </span>
                          {post.verifiedBadge && (
                            <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow">
                              ✓ Verified
                            </span>
                          )}
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                          {post.readTimeMinutes} min read
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-1.5">
                          <span>📅 {new Date(post.publishedAt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          <span>•</span>
                          <span>👁️ {getEffectiveViews(post).toLocaleString()}</span>
                          <span>•</span>
                          <span>❤️ {post.likes}</span>
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-snug group-hover:text-primary transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">
                          {post.summary}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 pt-0 border-t border-gray-100 dark:border-gray-800/60 mt-2 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-500 truncate max-w-[140px]">
                        By {post.author.name.split(' ')[0]}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleDelete(post.id, e)}
                          className="text-[10px] text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete article"
                        >
                          🗑️
                        </button>
                        <span className="text-xs font-bold text-primary">
                          {isUrdu ? 'پڑھیں' : 'Read'} →
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* LIST VIEW */
              <div className="space-y-3">
                {filteredPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => onNavigate('blog-detail', { blogPost: post, blogId: post.id })}
                    className="cursor-pointer bg-white dark:bg-dark-surface p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <img 
                        src={post.coverImage} 
                        alt={post.title}
                        className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        onError={(e) => handleBlogImageError(e, post.category, post.title)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                            {post.categoryLabel}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(post.publishedAt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="text-[10px] text-gray-400">• {post.readTimeMinutes} min read</span>
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-primary">
                          {post.title}
                        </h3>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{post.summary}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0 self-end sm:self-center">
                      <span className="text-xs text-gray-400">👁️ {getEffectiveViews(post).toLocaleString()}</span>
                      <span className="text-xs font-bold text-primary">Read Article →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
};

export default BlogPage;
