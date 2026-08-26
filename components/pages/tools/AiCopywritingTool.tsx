import React, { useState } from 'react';
import { 
  generateCopywritingPro, 
  CopywritingInput, 
  GeneratedCopyVariants,
  CopywritingFramework,
  CopywritingTone,
  CopywritingLanguage 
} from '../../../services/toolsService';

interface AiCopywritingToolProps {
  isUrdu: boolean;
  userPhone?: string;
  onCopy: (text: string, msg?: string) => void;
}

export const AiCopywritingTool: React.FC<AiCopywritingToolProps> = ({ isUrdu, userPhone, onCopy }) => {
  const [copyInput, setCopyInput] = useState<CopywritingInput>({
    platform: 'facebook',
    framework: 'aida',
    tone: 'urgent',
    productName: '',
    category: 'Clothing & Fashion',
    keyFeatures: '',
    price: '',
    originalPrice: '',
    discountOffer: 'Free Delivery / کیش آن ڈیلیوری',
    location: 'All Pakistan (کیش آن ڈیلیوری دستیاب)',
    contact: userPhone || '',
    language: 'urdu',
    targetAudience: 'Men & Women across Pakistan'
  });

  const [copyVariants, setCopyVariants] = useState<GeneratedCopyVariants | null>(null);
  const [activeVariantTab, setActiveVariantTab] = useState<'main' | 'short' | 'whatsapp' | 'headlines'>('main');
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);

  const handleGenerateCopy = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!copyInput.productName.trim()) {
      return;
    }

    setIsGeneratingCopy(true);
    try {
      const result = await generateCopywritingPro(copyInput);
      setCopyVariants(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingCopy(false);
    }
  };

  return (
    <div className="space-y-8" id="copywriting-tool-container">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 to-teal-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
            ✍️ Direct-Response Sales Copywriting AI
          </span>
          <span className="text-xs text-emerald-200/80">
            {isUrdu ? 'اردو، رومن اردو اور انگریزی سپورٹ' : 'Urdu, Roman Urdu & English'}
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
          {isUrdu ? 'اے آئی اشتہاری تحریر ساز (AI Copywriting & Ad Pack)' : 'AI Ad Copy & WhatsApp Closer Generator'}
        </h2>
        <p className="text-emerald-100/90 text-sm sm:text-base max-w-3xl leading-relaxed">
          {isUrdu
            ? 'فیس بک، واٹس ایپ، اولیکس اور ٹک ٹاک کے لیے کسٹمر کو فوری خریدار بنانے والے پروفیشنل اشتہارات، ہکس اور واٹس ایپ کلوزنگ پیغامات بنائیں۔'
            : 'Generate high-converting social media ads, AIDA hooks, WhatsApp deal closers, and SEO hashtags tailored for Pakistani ecommerce shoppers.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form */}
        <form onSubmit={handleGenerateCopy} className="lg:col-span-6 bg-white dark:bg-dark-surface border border-slate-200 dark:border-zinc-700/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-sm border-b border-slate-100 dark:border-zinc-700 pb-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            {isUrdu ? 'پروڈکٹ کی معلومات درج کریں' : 'Product & Campaign Details'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                {isUrdu ? 'پروڈکٹ کا نام' : 'Product Name'} *
              </label>
              <input
                type="text"
                required
                value={copyInput.productName}
                onChange={(e) => setCopyInput({ ...copyInput, productName: e.target.value })}
                placeholder="e.g. Smart Waterproof Watch"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                {isUrdu ? 'زبان کا انتخاب' : 'Language'}
              </label>
              <select
                value={copyInput.language}
                onChange={(e) => setCopyInput({ ...copyInput, language: e.target.value as CopywritingLanguage })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="urdu">🇵🇰 اردو (Urdu Script)</option>
                <option value="roman_urdu">💬 Roman Urdu</option>
                <option value="english">🌐 Professional English</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
              {isUrdu ? 'اہم خوبیاں و خصوصیات (الگ بذریعہ کوما)' : 'Key Features & Selling Points'} *
            </label>
            <textarea
              rows={3}
              required
              value={copyInput.keyFeatures}
              onChange={(e) => setCopyInput({ ...copyInput, keyFeatures: e.target.value })}
              placeholder="e.g. 7-day battery, Bluetooth calling, Heart rate monitor, 1-year warranty"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                {isUrdu ? 'سیل قیمت (Rs.)' : 'Discount Price (Rs.)'}
              </label>
              <input
                type="text"
                value={copyInput.price}
                onChange={(e) => setCopyInput({ ...copyInput, price: e.target.value })}
                placeholder="2499"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                {isUrdu ? 'پرانی قیمت (Rs.)' : 'Original Price (Rs.)'}
              </label>
              <input
                type="text"
                value={copyInput.originalPrice}
                onChange={(e) => setCopyInput({ ...copyInput, originalPrice: e.target.value })}
                placeholder="4000"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Framework
              </label>
              <select
                value={copyInput.framework}
                onChange={(e) => setCopyInput({ ...copyInput, framework: e.target.value as CopywritingFramework })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="aida">AIDA (Attention, Interest, Desire, Action)</option>
                <option value="pas">PAS (Problem, Agitate, Solution)</option>
                <option value="whatsapp_close">WhatsApp Direct Closer</option>
                <option value="tiktok_script">TikTok / Reels Viral 30s Script</option>
                <option value="marketplace_seo">Marketplace SEO Listing</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Tone
              </label>
              <select
                value={copyInput.tone}
                onChange={(e) => setCopyInput({ ...copyInput, tone: e.target.value as CopywritingTone })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="urgent">🔥 Urgent & Limited Offer</option>
                <option value="friendly">🤝 Friendly & Trustworthy</option>
                <option value="luxury">💎 Luxury & Premium</option>
                <option value="professional">💼 Professional & Direct</option>
                <option value="viral">🚀 Viral & High Energy</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isGeneratingCopy || !copyInput.productName.trim()}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md flex items-center justify-center gap-2 transition"
          >
            {isGeneratingCopy ? '✨ Writing High-Converting Ad Pack...' : '✨ Generate Pro Ad Copy Pack'}
          </button>
        </form>

        {/* Right Output Box */}
        <div className="lg:col-span-6 space-y-4">
          {copyVariants ? (
            <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-zinc-700/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
              {/* Output Tabs */}
              <div className="flex bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setActiveVariantTab('main')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                    activeVariantTab === 'main' ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  📰 Main Ad Copy
                </button>
                <button
                  type="button"
                  onClick={() => setActiveVariantTab('whatsapp')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                    activeVariantTab === 'whatsapp' ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  💬 WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => setActiveVariantTab('short')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                    activeVariantTab === 'short' ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  ⚡ Story Hook
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-4 bg-slate-50 dark:bg-zinc-900/80 rounded-xl border border-slate-200 dark:border-zinc-700 font-sans">
                {activeVariantTab === 'main' && (
                  <div className="text-xs sm:text-sm text-slate-800 dark:text-zinc-100 leading-relaxed whitespace-pre-wrap">
                    {copyVariants.mainAdCopy}
                  </div>
                )}
                {activeVariantTab === 'whatsapp' && (
                  <div className="text-xs sm:text-sm text-slate-800 dark:text-zinc-100 leading-relaxed whitespace-pre-wrap">
                    {copyVariants.whatsappCloser}
                  </div>
                )}
                {activeVariantTab === 'short' && (
                  <div className="text-xs sm:text-sm text-slate-800 dark:text-zinc-100 leading-relaxed whitespace-pre-wrap">
                    {copyVariants.shortHook}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const textToCopy = activeVariantTab === 'main' 
                      ? copyVariants.mainAdCopy 
                      : activeVariantTab === 'whatsapp' 
                      ? copyVariants.whatsappCloser 
                      : copyVariants.shortHook;
                    onCopy(textToCopy, isUrdu ? 'کاپی ہو گیا!' : 'Ad copy copied!');
                  }}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow transition flex items-center justify-center gap-1.5"
                >
                  📋 Copy Selected Text
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-700/80 rounded-2xl p-12 text-center text-slate-400 text-xs sm:text-sm space-y-2">
              <div className="text-3xl">✨</div>
              <div className="font-semibold text-slate-600 dark:text-zinc-300">
                {isUrdu ? 'پروڈکٹ کا نام لکھیں اور "Generate" پر کلک کریں' : 'Fill product details and generate instant copy'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
