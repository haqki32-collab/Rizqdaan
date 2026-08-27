import React, { useState, useRef } from 'react';
import { Listing } from '../../types';
import { useLanguage } from '../../src/context/LanguageContext';

interface WhatsAppDealCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: Listing;
}

export const WhatsAppDealCardModal: React.FC<WhatsAppDealCardModalProps> = ({
  isOpen,
  onClose,
  listing
}) => {
  const { isUrdu } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [generatingPoster, setGeneratingPoster] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !listing) return null;

  const currentUrl = `${window.location.origin}/?listing=${listing.id}`;
  const displayImage = listing.imageUrl || (listing.images && listing.images[0]) || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600';

  const shareText = isUrdu 
    ? `🔥 *شاندار ڈسکاؤنٹ ڈیل - رزق دان پاکستان* 🔥\n\n📌 *${listing.title}*\n💰 *قیمت:* صرف Rs. ${listing.price.toLocaleString()}\n📍 *مقام:* ${listing.location}\n🏷️ *کیٹیگری:* ${listing.category}\n\n✅ *ڈائریکٹ مالک سے رابطہ کریں اور ابھی خریدیں:*\n👉 ${currentUrl}\n\n🇵🇰 *رزق دان - پاکستان کا تیز ترین خرید و فروخت پلیٹ فارم*`
    : `🔥 *HOT DEAL ON RIZQDAAN PAKISTAN* 🔥\n\n📌 *${listing.title}*\n💰 *Price:* Rs. ${listing.price.toLocaleString()}\n📍 *Location:* ${listing.location}\n🏷️ *Category:* ${listing.category}\n\n✅ *Direct Seller Contact & Details:*\n👉 ${currentUrl}\n\n🇵🇰 *RizqDaan - Buy & Sell Free in Pakistan*`;

  const handleShareToWhatsApp = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank');
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      prompt("Copy formatted deal text:", shareText);
    }
  };

  // Generate Image Poster with Canvas
  const handleDownloadPoster = async () => {
    setGeneratingPoster(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1350; // Instagram / WhatsApp Status aspect ratio (4:5)
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw Gradient Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGrad.addColorStop(0, '#044e42');
      bgGrad.addColorStop(0.3, '#0b705e');
      bgGrad.addColorStop(1, '#062d26');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Top Brand Header
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px sans-serif';
      ctx.fillText('🇵🇰 RizqDaan Pakistan', 60, 90);
      
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText('🔥 VERIFIED DEAL', 800, 90);

      // White Card in Center
      ctx.fillStyle = '#ffffff';
      ctx.roundRect ? ctx.roundRect(60, 140, 960, 980, 40) : ctx.fillRect(60, 140, 960, 980);
      ctx.fill();

      // Product Image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = displayImage;

      await new Promise((resolve) => {
        img.onload = () => {
          try {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect ? ctx.roundRect(90, 170, 900, 560, 30) : ctx.rect(90, 170, 900, 560);
            ctx.clip();
            ctx.drawImage(img, 90, 170, 900, 560);
            ctx.restore();
          } catch(e) {}
          resolve(true);
        };
        img.onerror = () => resolve(true);
      });

      // Price Tag Badge
      ctx.fillStyle = '#ef4444';
      ctx.roundRect ? ctx.roundRect(100, 680, 440, 90, 20) : ctx.fillRect(100, 680, 440, 90);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 46px sans-serif';
      ctx.fillText(`Rs. ${listing.price.toLocaleString()}`, 130, 745);

      // Product Title
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 48px sans-serif';
      const truncatedTitle = listing.title.length > 32 ? listing.title.substring(0, 32) + '...' : listing.title;
      ctx.fillText(truncatedTitle, 100, 830);

      // Location & Category
      ctx.fillStyle = '#4b5563';
      ctx.font = '34px sans-serif';
      ctx.fillText(`📍 ${listing.location}   •   🏷️ ${listing.category}`, 100, 890);

      // Seller Verified
      ctx.fillStyle = '#059669';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText(`✅ Direct Seller: ${listing.vendorName || 'Verified Merchant'}`, 100, 950);

      // Footer call to action on white card
      ctx.fillStyle = '#f3f4f6';
      ctx.roundRect ? ctx.roundRect(90, 1000, 900, 90, 20) : ctx.fillRect(90, 1000, 900, 90);
      ctx.fill();

      ctx.fillStyle = '#0b705e';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText(`🌐 Visit & Buy: rizqdaan.com/?listing=${listing.id.substring(0, 10)}`, 130, 1055);

      // Bottom Banner
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('📲 WhatsApp par share karen aur foran customer hasil karen!', canvas.width / 2, 1220);

      // Download
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      const link = document.createElement('a');
      link.download = `RizqDaan-Deal-${listing.title.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch(err) {
      console.error("Poster creation error", err);
    } finally {
      setGeneratingPoster(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-dark-surface rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden text-gray-800 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🔥</span>
            <div>
              <h3 className="text-base sm:text-lg font-black leading-tight">
                {isUrdu ? 'واٹس ایپ و سوشل میڈیا ڈیل کارڈ' : '1-Click WhatsApp Deal Card'}
              </h3>
              <p className="text-[11px] text-emerald-100 font-medium">
                {isUrdu ? 'اسٹیٹس اور فیس بک گروپس میں شیئر کر کے فوری خریدار لائیں' : 'Share to WhatsApp Status & FB groups for instant leads'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Card Preview Box */}
          <div 
            ref={posterRef}
            className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <img 
                src={displayImage} 
                alt={listing.title} 
                className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-emerald-300 shadow-sm flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                    HOT DEAL
                  </span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold truncate">
                    📍 {listing.location}
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-black text-gray-900 dark:text-white line-clamp-1">
                  {listing.title}
                </h4>
                <div className="text-sm sm:text-base font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
                  Rs. {listing.price.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Formatted Text Box */}
            <div className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto selection:bg-emerald-200">
              {shareText}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5">
            {/* WhatsApp Share Button */}
            <button
              onClick={handleShareToWhatsApp}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-[#25D366] hover:bg-[#20ba59] text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-green-500/25 active:scale-98 transition-all cursor-pointer"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.407 3.481 2.239 2.24 3.477 5.23 3.475 8.411-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.394 1.664zm6.222-3.528c1.552.92 3.51 1.405 5.621 1.406 5.543 0 10.054-4.51 10.057-10.055.002-2.686-1.047-5.212-2.952-7.118-1.904-1.905-4.432-2.952-7.118-2.952-5.544 0-10.054 4.51-10.057 10.055-.001 2.112.553 4.17 1.602 5.962l-.999 3.649 3.846-.947zm11.387-5.477c-.31-.156-1.834-.905-2.113-1.006-.279-.101-.482-.151-.684.151-.202.302-.782 1.006-.958 1.207-.176.202-.352.227-.662.071-.31-.156-1.311-.484-2.498-1.543-.923-.824-1.547-1.841-1.728-2.143-.181-.303-.019-.466.136-.621.14-.14.31-.362.466-.543.156-.181.208-.31.31-.517.103-.207.052-.387-.026-.543-.078-.156-.684-1.649-.938-2.261-.247-.597-.499-.516-.684-.525-.176-.008-.378-.009-.58-.009s-.53.076-.807.378c-.278.302-1.061 1.037-1.061 2.531s1.087 2.946 1.239 3.148c.152.202 2.139 3.267 5.182 4.581.724.312 1.288.499 1.728.639.728.231 1.389.198 1.912.12.583-.087 1.834-.751 2.09-1.477.256-.725.256-1.348.179-1.477-.076-.128-.278-.204-.588-.36z"/>
              </svg>
              <span>{isUrdu ? 'واٹس ایپ پر فوری شیئر کریں' : 'Share to WhatsApp Now'}</span>
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Copy Text Button */}
              <button
                onClick={handleCopyText}
                className="py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
              >
                <span>{copied ? '✅' : '📋'}</span>
                <span>{copied ? (isUrdu ? 'کاپی ہو گیا!' : 'Copied!') : (isUrdu ? 'متن کاپی کریں' : 'Copy Text')}</span>
              </button>

              {/* Download Poster Image */}
              <button
                onClick={handleDownloadPoster}
                disabled={generatingPoster}
                className="py-3 bg-emerald-100 dark:bg-emerald-950/60 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
              >
                {generatingPoster ? (
                  <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-emerald-700 border-t-transparent"></span>
                ) : (
                  <span>🖼️</span>
                )}
                <span>{generatingPoster ? (isUrdu ? 'بن رہا ہے...' : 'Generating...') : (isUrdu ? 'تصویری پوسٹر ڈاؤنلوڈ' : 'Download Poster')}</span>
              </button>
            </div>
          </div>

          {/* Pro Viral Tip */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 rounded-xl text-[11px] text-amber-900 dark:text-amber-300 flex items-start gap-2">
            <span className="text-sm">💡</span>
            <div>
              <span className="font-bold">{isUrdu ? 'وائرل ٹپ: ' : 'Growth Tip: '}</span>
              {isUrdu 
                ? 'اس کارڈ کو اپنے واٹس ایپ اسٹیٹس اور 5 فیس بک بائے/سیل گروپس میں پوسٹ کریں، روزانہ 100+ کسٹمرز آپ سے رابطہ کریں گے!'
                : 'Post this deal image on your WhatsApp status & 5 local buy/sell groups to get 100+ direct customer inquiries daily!'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
