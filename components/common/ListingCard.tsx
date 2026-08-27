
import React from 'react';
import { Listing } from '../../types';
import { db } from '../../firebaseConfig';
import { collection, query, where, getDocs, updateDoc, increment, doc } from 'firebase/firestore';

interface ListingCardProps {
  listing: Listing;
  onViewDetails: (listing: Listing) => void;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, onViewDetails }) => {
  const handleCardClick = async () => {
    // Only track click when user actively interacts with the listing
    if (db && listing.id) {
      try {
        const listingRef = doc(db, 'listings', listing.id);
        updateDoc(listingRef, { views: increment(1) }).catch(() => {});

        if (listing.isPromoted) {
          const q = query(
            collection(db, 'campaigns'), 
            where('listingId', '==', listing.id),
            where('status', '==', 'active')
          );
          getDocs(q).then((snap) => {
            if (!snap.empty) {
              const activeCampaignDoc = snap.docs[0];
              const d = activeCampaignDoc.data();
              const newClicks = (d.clicks || 0) + 1;
              const impr = d.impressions || 1;
              const newCtr = Number(((newClicks / impr) * 100).toFixed(2));

              updateDoc(activeCampaignDoc.ref, {
                clicks: increment(1),
                ctr: newCtr
              }).catch(() => {});
            }
          }).catch(() => {});
        }
      } catch (e) {
        // Silent catch to prevent UI break
      }
    }
    onViewDetails(listing);
  };


  const StarRating = ({ rating, reviewsCount }: { rating: number, reviewsCount: number }) => {
    return (
      <div className="flex items-center gap-1">
        <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.367-2.446a1 1 0 00-1.175 0l-3.367 2.446c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
        </svg>
        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">{rating > 0 ? rating.toFixed(1) : 'New'}</span>
        <span className="text-[10px] text-gray-400">({reviewsCount})</span>
      </div>
    );
  };

  const discountPercent = listing.originalPrice 
    ? Math.round(((listing.originalPrice - listing.price) / listing.originalPrice) * 100)
    : 0;

  return (
    <div 
      className={`group bg-white dark:bg-dark-surface rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col relative ${listing.isPromoted ? 'ring-1 ring-accent-yellow/50' : ''}`}
      onClick={handleCardClick}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-900">
        <img 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
          src={listing.imageUrl} 
          alt={listing.title} 
          loading="lazy" 
        />
        <div className="absolute top-2 left-2 flex flex-col gap-1">
            {listing.isPromoted && (
                <span className="bg-accent-yellow text-primary text-[9px] font-extrabold px-2 py-0.5 rounded shadow-sm flex items-center gap-1 uppercase tracking-tighter">
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.367-2.446a1 1 0 00-1.175 0l-3.367 2.446c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z"/></svg>
                    Featured
                </span>
            )}
            {discountPercent > 0 && (
                <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-sm w-fit">
                    -{discountPercent}%
                </span>
            )}
        </div>

        {/* 📲 Quick WhatsApp Share Button on Card */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            const shareText = `🔥 *RizqDaan Deal:* ${listing.title}\n💰 *Price:* Rs. ${listing.price.toLocaleString()} (Location: ${listing.location})\n👉 View: ${window.location.origin}/?listing=${listing.id}`;
            const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
            window.open(waUrl, '_blank');
          }}
          title="Share to WhatsApp"
          className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 dark:bg-dark-surface/90 text-[#25D366] hover:bg-[#25D366] hover:text-white shadow-md transition-all active:scale-90"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.407 3.481 2.239 2.24 3.477 5.23 3.475 8.411-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.394 1.664zm6.222-3.528c1.552.92 3.51 1.405 5.621 1.406 5.543 0 10.054-4.51 10.057-10.055.002-2.686-1.047-5.212-2.952-7.118-1.904-1.905-4.432-2.952-7.118-2.952-5.544 0-10.054 4.51-10.057 10.055-.001 2.112.553 4.17 1.602 5.962l-.999 3.649 3.846-.947zm11.387-5.477c-.31-.156-1.834-.905-2.113-1.006-.279-.101-.482-.151-.684.151-.202.302-.782 1.006-.958 1.207-.176.202-.352.227-.662.071-.31-.156-1.311-.484-2.498-1.543-.923-.824-1.547-1.841-1.728-2.143-.181-.303-.019-.466.136-.621.14-.14.31-.362.466-.543.156-.181.208-.31.31-.517.103-.207.052-.387-.026-.543-.078-.156-.684-1.649-.938-2.261-.247-.597-.499-.516-.684-.525-.176-.008-.378-.009-.58-.009s-.53.076-.807.378c-.278.302-1.061 1.037-1.061 2.531s1.087 2.946 1.239 3.148c.152.202 2.139 3.267 5.182 4.581.724.312 1.288.499 1.728.639.728.231 1.389.198 1.912.12.583-.087 1.834-.751 2.09-1.477.256-.725.256-1.348.179-1.477-.076-.128-.278-.204-.588-.36z"/>
          </svg>
        </button>
        <div className="absolute bottom-2 left-2">
             <span className="bg-black/40 backdrop-blur-sm text-white text-[8px] px-1.5 py-0.5 rounded font-medium uppercase tracking-widest">
                {listing.category.split(' ')[0]}
             </span>
        </div>
      </div>
      <div className="p-3 flex flex-col flex-grow">
        <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-baseline gap-1">
                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 tracking-tight">Rs.</span>
                <span className="text-base sm:text-lg font-black text-gray-900 dark:text-white tracking-tight leading-none">
                    {listing.price.toLocaleString()}
                </span>
            </div>
            <button className="text-gray-400 hover:text-red-500 transition-colors p-1 -mr-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            </button>
        </div>
        {listing.originalPrice && (
            <p className="text-[11px] text-gray-400 font-medium line-through -mt-1 mb-1 flex items-center gap-0.5">
                <span>Rs.</span>
                <span>{listing.originalPrice.toLocaleString()}</span>
            </p>
        )}
        <h3 className="text-xs font-medium text-gray-700 dark:text-gray-200 leading-tight line-clamp-2 mb-3 min-h-[2.5rem]">
            {listing.title}
        </h3>
        <div className="mt-auto border-t border-gray-50 dark:border-gray-800 pt-2 flex items-center justify-between">
            <StarRating rating={listing.rating} reviewsCount={listing.reviews?.length || 0} />
            <div className="flex items-center text-[10px] text-gray-400 gap-0.5 max-w-[50%]">
                <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span className="truncate">{listing.location.split(',')[0]}</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ListingCard;
