
import React from 'react';
import { Listing } from '../../types';

interface ListingCardProps {
  listing: Listing;
  onViewDetails: (listing: Listing) => void;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, onViewDetails }) => {
  const StarRating = ({ rating, reviewsCount }: { rating: number, reviewsCount: number }) => {
    return (
      <div className="flex items-center">
        <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.367-2.446a1 1 0 00-1.175 0l-3.367 2.446c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
        </svg>
        <span className="text-[10px] text-gray-500 dark:text-gray-400 ml-0.5">{rating.toFixed(1)} ({reviewsCount})</span>
      </div>
    );
  };

  const discountPercent = listing.originalPrice 
    ? Math.round(((listing.originalPrice - listing.price) / listing.originalPrice) * 100)
    : 0;

  return (
    <div 
      className={`bg-white dark:bg-dark-surface rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 cursor-pointer flex flex-col relative ${listing.isPromoted ? 'ring-2 ring-yellow-400 ring-offset-1 dark:ring-offset-dark-bg' : ''}`}
      onClick={() => onViewDetails(listing)}
    >
      <div className="relative">
        <img className="w-full h-44 object-cover" src={listing.imageUrl} alt={listing.title} />
        {listing.isPromoted && (
            <span className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md z-10 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.367-2.446a1 1 0 00-1.175 0l-3.367 2.446c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z"/></svg>
                FEATURED
            </span>
        )}
      </div>
      <div className="p-3 flex flex-col flex-grow">
        <div className="flex items-center space-x-2 mb-2">
            {listing.hasFreeDelivery && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-md font-medium">FREE DELIVERY</span>}
            {discountPercent > 0 && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-md font-medium">SALE</span>}
        </div>
        <h3 className="text-sm font-medium text-gray-800 dark:text-white h-10 leading-tight mb-2 line-clamp-2">
            {listing.title}
        </h3>
        
        <div className="mt-auto">
            <div className="flex items-end gap-2 mb-3">
                <p className="text-lg font-bold text-primary">Rs.{listing.price.toLocaleString()}</p>
                {listing.originalPrice && (
                    <p className="text-xs text-gray-400 line-through mb-1">Rs.{listing.originalPrice.toLocaleString()}</p>
                )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
              <StarRating rating={listing.rating} reviewsCount={listing.reviews.length} />
              
              {/* Calls & Messages Counts */}
              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 font-medium">
                  <div className="flex items-center gap-1" title="Calls Received">
                      <svg className="w-3.5 h-3.5 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                      <span>{listing.calls || 0}</span>
                  </div>
                  <div className="flex items-center gap-1" title="Messages Received">
                      <svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" /></svg>
                      <span>{listing.messages || 0}</span>
                  </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ListingCard;
