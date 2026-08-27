import React, { useState, useEffect } from 'react';
import { Listing } from '../../types';
import { useLanguage } from '../../src/context/LanguageContext';
import { WhatsAppDealCardModal } from './WhatsAppDealCardModal';

interface UrgentDealsSectionProps {
  listings: Listing[];
  onNavigate: (view: any, payload?: any) => void;
}

export const UrgentDealsSection: React.FC<UrgentDealsSectionProps> = ({
  listings,
  onNavigate
}) => {
  const { isUrdu } = useLanguage();
  const [selectedListingForShare, setSelectedListingForShare] = useState<Listing | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // Countdown timer calculation (resets daily at midnight)
  const [timeLeft, setTimeLeft] = useState({ hours: 5, minutes: 42, seconds: 18 });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const diff = endOfDay.getTime() - now.getTime();

      if (diff > 0) {
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft({ hours, minutes, seconds });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter listings: pick items on sale or sort to find great deals
  const urgentDeals = listings
    .filter(l => {
      if (selectedTag === 'all') return true;
      if (selectedTag === 'mobiles') return l.category.toLowerCase().includes('mobile') || l.category.toLowerCase().includes('phone');
      if (selectedTag === 'vehicles') return l.category.toLowerCase().includes('vehicle') || l.category.toLowerCase().includes('bike') || l.category.toLowerCase().includes('car');
      if (selectedTag === 'fashion') return l.category.toLowerCase().includes('cloth') || l.category.toLowerCase().includes('fashion');
      if (selectedTag === 'electronics') return l.category.toLowerCase().includes('electronic') || l.category.toLowerCase().includes('laptop');
      return true;
    })
    .slice(0, 6);

  if (urgentDeals.length === 0 && listings.length === 0) return null;

  const dealsToDisplay = urgentDeals.length > 0 ? urgentDeals : listings.slice(0, 4);

  return (
    <div className="my-4 p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-red-600 via-rose-700 to-amber-700 text-white shadow-xl relative overflow-hidden">
      {/* Background flare */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-400/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-red-400/20 rounded-full blur-2xl pointer-events-none"></div>

      {/* Top Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-amber-400 text-gray-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
              <span className="animate-pulse">🔥</span> {isUrdu ? 'فوری ہنگامی سیل' : 'URGENT DISTRESS SALE'}
            </span>
            <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
              {isUrdu ? '30% تا 50% رعایت' : '30% - 50% OFF'}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black tracking-tight leading-tight">
            {isUrdu ? 'آج کی سستی ترین ڈیلز - فوری خریداری' : 'Flash Deals & Emergency Bargains'}
          </h2>
        </div>

        {/* Live Countdown Timer */}
        <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-2xl backdrop-blur-md border border-white/15 self-start sm:self-auto">
          <span className="text-xs text-amber-300 font-bold mr-1">
            ⏰ {isUrdu ? 'باقی وقت:' : 'Ends In:'}
          </span>
          <div className="flex items-center gap-1 font-mono text-xs font-black">
            <span className="bg-white/20 px-1.5 py-0.5 rounded text-white">{String(timeLeft.hours).padStart(2, '0')}h</span>
            <span>:</span>
            <span className="bg-white/20 px-1.5 py-0.5 rounded text-white">{String(timeLeft.minutes).padStart(2, '0')}m</span>
            <span>:</span>
            <span className="bg-amber-400 px-1.5 py-0.5 rounded text-gray-900 animate-pulse">{String(timeLeft.seconds).padStart(2, '0')}s</span>
          </div>
        </div>
      </div>

      {/* Category Tags */}
      <div className="relative z-10 flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-3 text-xs">
        <button
          onClick={() => setSelectedTag('all')}
          className={`px-3 py-1 rounded-full font-bold transition-all whitespace-nowrap ${selectedTag === 'all' ? 'bg-white text-red-700 shadow-sm' : 'bg-white/15 text-white hover:bg-white/25'}`}
        >
          {isUrdu ? 'تمام ڈیلز' : 'All Deals'}
        </button>
        <button
          onClick={() => setSelectedTag('mobiles')}
          className={`px-3 py-1 rounded-full font-bold transition-all whitespace-nowrap ${selectedTag === 'mobiles' ? 'bg-white text-red-700 shadow-sm' : 'bg-white/15 text-white hover:bg-white/25'}`}
        >
          📱 {isUrdu ? 'موبائلز' : 'Mobiles'}
        </button>
        <button
          onClick={() => setSelectedTag('vehicles')}
          className={`px-3 py-1 rounded-full font-bold transition-all whitespace-nowrap ${selectedTag === 'vehicles' ? 'bg-white text-red-700 shadow-sm' : 'bg-white/15 text-white hover:bg-white/25'}`}
        >
          🏍️ {isUrdu ? 'بائیکس و گاڑیاں' : 'Vehicles'}
        </button>
        <button
          onClick={() => setSelectedTag('electronics')}
          className={`px-3 py-1 rounded-full font-bold transition-all whitespace-nowrap ${selectedTag === 'electronics' ? 'bg-white text-red-700 shadow-sm' : 'bg-white/15 text-white hover:bg-white/25'}`}
        >
          💻 {isUrdu ? 'لیپ ٹاپس' : 'Laptops'}
        </button>
        <button
          onClick={() => setSelectedTag('fashion')}
          className={`px-3 py-1 rounded-full font-bold transition-all whitespace-nowrap ${selectedTag === 'fashion' ? 'bg-white text-red-700 shadow-sm' : 'bg-white/15 text-white hover:bg-white/25'}`}
        >
          👗 {isUrdu ? 'کپڑے و فیشن' : 'Fashion'}
        </button>
      </div>

      {/* Horizontal Carousel of Deals */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {dealsToDisplay.map((deal) => {
          const discountPrice = Math.round(deal.price * 1.25); // Estimated original price for anchor comparison
          const displayImg = deal.imageUrl || (deal.images && deal.images[0]) || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400';

          return (
            <div 
              key={`urgent-${deal.id}`}
              className="bg-white dark:bg-dark-surface rounded-2xl p-3 text-gray-900 dark:text-white shadow-lg border border-red-200/50 dark:border-gray-800 flex flex-col justify-between group hover:shadow-xl transition-all"
            >
              <div 
                onClick={() => onNavigate('details', { listing: deal })}
                className="cursor-pointer"
              >
                {/* Image Container with Discount Badge */}
                <div className="relative h-36 rounded-xl overflow-hidden mb-2 bg-gray-100 dark:bg-gray-800">
                  <img 
                    src={displayImg} 
                    alt={deal.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-2 left-2 bg-red-600 text-white font-black text-[10px] px-2 py-0.5 rounded-md shadow-md uppercase tracking-wider flex items-center gap-1">
                    <span>⚡</span>
                    <span>20-30% OFF</span>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white font-bold text-[10px] px-2 py-0.5 rounded-md">
                    📍 {deal.location}
                  </div>
                </div>

                {/* Title and Price */}
                <h3 className="text-xs font-black line-clamp-1 group-hover:text-primary transition-colors">
                  {deal.title}
                </h3>
                
                <div className="flex items-baseline gap-2 mt-1 mb-2">
                  <span className="text-base font-black text-red-600 dark:text-red-400">
                    Rs. {deal.price.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-gray-400 line-through font-semibold">
                    Rs. {discountPrice.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons: WhatsApp Share & Chat */}
              <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setSelectedListingForShare(deal)}
                  title="Share Deal to WhatsApp"
                  className="py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] rounded-xl flex items-center justify-center gap-1 transition-all"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.407 3.481 2.239 2.24 3.477 5.23 3.475 8.411-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.394 1.664zm6.222-3.528c1.552.92 3.51 1.405 5.621 1.406 5.543 0 10.054-4.51 10.057-10.055.002-2.686-1.047-5.212-2.952-7.118-1.904-1.905-4.432-2.952-7.118-2.952-5.544 0-10.054 4.51-10.057 10.055-.001 2.112.553 4.17 1.602 5.962l-.999 3.649 3.846-.947zm11.387-5.477c-.31-.156-1.834-.905-2.113-1.006-.279-.101-.482-.151-.684.151-.202.302-.782 1.006-.958 1.207-.176.202-.352.227-.662.071-.31-.156-1.311-.484-2.498-1.543-.923-.824-1.547-1.841-1.728-2.143-.181-.303-.019-.466.136-.621.14-.14.31-.362.466-.543.156-.181.208-.31.31-.517.103-.207.052-.387-.026-.543-.078-.156-.684-1.649-.938-2.261-.247-.597-.499-.516-.684-.525-.176-.008-.378-.009-.58-.009s-.53.076-.807.378c-.278.302-1.061 1.037-1.061 2.531s1.087 2.946 1.239 3.148c.152.202 2.139 3.267 5.182 4.581.724.312 1.288.499 1.728.639.728.231 1.389.198 1.912.12.583-.087 1.834-.751 2.09-1.477.256-.725.256-1.348.179-1.477-.076-.128-.278-.204-.588-.36z"/>
                  </svg>
                  <span>{isUrdu ? 'کارڈ شیئر' : 'Share'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('details', { listing: deal })}
                  className="py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] rounded-xl flex items-center justify-center gap-1 transition-all shadow-sm"
                >
                  <span>{isUrdu ? 'ابھی خریدیں' : 'Buy Now'}</span>
                  <span>➔</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Share Modal Trigger */}
      {selectedListingForShare && (
        <WhatsAppDealCardModal
          isOpen={!!selectedListingForShare}
          onClose={() => setSelectedListingForShare(null)}
          listing={selectedListingForShare}
        />
      )}
    </div>
  );
};
