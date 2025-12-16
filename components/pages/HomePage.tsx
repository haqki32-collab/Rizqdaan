
import React, { useState, useEffect, useCallback } from 'react';
import { CATEGORIES, PAKISTAN_LOCATIONS } from '../../constants';
import { Listing, Category } from '../../types';
import ListingCard from '../common/ListingCard';

interface HomePageProps {
  listings: Listing[];
  onNavigate: (view: 'listings' | 'details' | 'subcategories', payload?: { listing?: Listing; category?: Category; query?: string }) => void;
  onSaveSearch: (query: string) => void;
}

// Helper to shuffle array for random listings
const shuffleArray = (array: any[]) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

// --- PROMO BANNERS DATA ---
const PROMO_BANNERS = [
    { id: 1, title: "MEGA SALE", subtitle: "Up to 70% OFF on Electronics", color: "from-blue-600 to-blue-800", icon: "⚡" },
    { id: 2, title: "FRESH FOOD", subtitle: "Order Home Chef Meals Today", color: "from-orange-500 to-red-500", icon: "🍔" },
    { id: 3, title: "FASHION WEEK", subtitle: "New Summer Collection Arrival", color: "from-pink-500 to-rose-500", icon: "👗" },
    { id: 4, title: "HOME DECOR", subtitle: "Renovate Your Home on Budget", color: "from-teal-500 to-green-600", icon: "🏡" },
    { id: 5, title: "AUTO BAZAR", subtitle: "Buy & Sell Cars Instantly", color: "from-gray-700 to-gray-900", icon: "🚗" },
    { id: 6, title: "TECH DEALS", subtitle: "Laptops & Mobiles at Best Prices", color: "from-indigo-600 to-purple-700", icon: "💻" },
    { id: 7, title: "BEAUTY GLOW", subtitle: "Skincare & Makeup Sale", color: "from-fuchsia-500 to-pink-600", icon: "💄" },
    { id: 8, title: "SERVICES", subtitle: "Hire Plumbers, Electricians & More", color: "from-yellow-500 to-amber-600", icon: "🛠️" },
    { id: 9, title: "KIDS CORNER", subtitle: "Toys, Clothes & School Gear", color: "from-cyan-400 to-blue-500", icon: "🧸" },
    { id: 10, title: "PROPERTY", subtitle: "Find Your Dream House Now", color: "from-emerald-600 to-green-800", icon: "🏢" }
];

const HomePage: React.FC<HomePageProps> = ({ listings, onNavigate, onSaveSearch }) => {
  // Use the REAL listings passed from App.tsx
  // Priority: Is Promoted -> Newest (by index/creation)
  const sortedListings = [...listings].sort((a, b) => {
      // Prioritize promoted items
      if (a.isPromoted && !b.isPromoted) return -1;
      if (!a.isPromoted && b.isPromoted) return 1;
      return 0;
  });

  const featuredListings = sortedListings.filter(l => l.isPromoted).slice(0, 10);
  const remainingListings = sortedListings.filter(l => !l.isPromoted);
  
  const [randomListings, setRandomListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  
  // --- FILTER STATE ---
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [locationData, setLocationData] = useState({ province: '', city: '', isGps: false });
  const [sortBy, setSortBy] = useState('recommended');
  const [filters, setFilters] = useState({
      verifiedOnly: false,
      openNow: false,
      freeDelivery: false,
      onSale: false
  });
  const [gpsLoading, setGpsLoading] = useState(false);

  // Touch state for swipe
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    // Load initial set of random listings
    if (remainingListings.length > 0) {
      setRandomListings(shuffleArray([...remainingListings]).slice(0, 8));
    }
  }, [listings]); // Re-run when listings prop changes

  // --- BANNER AUTO-SCROLL LOGIC ---
  useEffect(() => {
      const interval = setInterval(() => {
          setCurrentBannerIndex((prevIndex) => (prevIndex + 1) % PROMO_BANNERS.length);
      }, 3000); // 3 Seconds

      return () => clearInterval(interval);
  }, []);

  // --- SWIPE HANDLERS ---
  const onTouchStart = (e: React.TouchEvent) => {
      setTouchEnd(null); 
      setTouchStart(e.targetTouches[0].clientX);
  }

  const onTouchMove = (e: React.TouchEvent) => {
      setTouchEnd(e.targetTouches[0].clientX);
  }

  const onTouchEnd = () => {
      if (!touchStart || !touchEnd) return;
      const distance = touchStart - touchEnd;
      const isLeftSwipe = distance > 50;
      const isRightSwipe = distance < -50;

      if (isLeftSwipe) {
          setCurrentBannerIndex((prev) => (prev + 1) % PROMO_BANNERS.length);
      }
      if (isRightSwipe) {
          setCurrentBannerIndex((prev) => (prev - 1 + PROMO_BANNERS.length) % PROMO_BANNERS.length);
      }
  }

  const loadMoreListings = useCallback(() => {
    setIsLoading(true);
    // Simulate network delay
    setTimeout(() => {
      // Append more random listings from the remaining pool
      const newItems = shuffleArray([...remainingListings]).slice(0, 4);
      setRandomListings(prev => [...prev, ...newItems]);
      setIsLoading(false);
    }, 700);
  }, [remainingListings]);

  const handleScroll = useCallback(() => {
    // Check if user is near the bottom of the page
    if (window.innerHeight + document.documentElement.scrollTop + 200 >= document.documentElement.scrollHeight && !isLoading) {
      loadMoreListings();
    }
  }, [isLoading, loadMoreListings]);
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('listings', { query: searchQuery });
    }
  };

  const handleGetLocation = () => {
      if (!navigator.geolocation) {
          alert("Geolocation is not supported by this browser.");
          return;
      }
      setGpsLoading(true);
      navigator.geolocation.getCurrentPosition((pos) => {
          setGpsLoading(false);
          setLocationData({ province: '', city: '', isGps: true });
          // In a real app, you would reverse geocode coords here
      }, (err) => {
          setGpsLoading(false);
          alert("Could not get location. Please enable GPS.");
      });
  };

  const handleApplyFilters = () => {
      setIsFilterOpen(false);
      const filterSummary = [];
      if (locationData.city) filterSummary.push(locationData.city);
      if (filters.verifiedOnly) filterSummary.push("Verified");
      if (filters.onSale) filterSummary.push("On Sale");
      
      // Construct a search query based on filters to simulate navigation
      const query = filterSummary.length > 0 ? filterSummary.join(" ") : "All Listings";
      onNavigate('listings', { query });
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Helper to get display text for location
  const locationDisplay = locationData.isGps 
    ? "📍 Current Location (Near Me)" 
    : (locationData.city ? `${locationData.city}, ${locationData.province}` : "Pakistan");

  return (
    <div className="space-y-4">
      
      {/* --- ADVANCED HEADER & FILTERS --- */}
      <div className="bg-primary dark:bg-dark-primary pt-3 pb-3 px-4 rounded-b-2xl shadow-md -mx-4 -mt-4 sm:-mx-6 lg:-mx-8 mb-4 transition-all">
        <div className="container mx-auto max-w-4xl">
            
            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="relative flex items-center mb-3">
                 <input
                    type="text"
                    placeholder="Search for electronics & appliances..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-12 py-2.5 rounded-lg border-0 bg-white text-gray-800 focus:ring-2 focus:ring-accent-teal/50 shadow-sm text-sm transition-all placeholder-gray-400"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <button type="button" onClick={() => onSaveSearch(searchQuery)} className="absolute right-3 p-1 text-gray-400 hover:text-primary transition-colors" aria-label="Save search">
                  <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                </button>
            </form>

            {/* Interactive Location & Filter Bar */}
            <div className="flex items-center justify-between">
                <button 
                    onClick={() => setIsFilterOpen(true)}
                    className="flex items-center text-white/90 hover:text-white font-medium text-sm group truncate max-w-[70%]"
                >
                    <div className={`p-1 rounded-full mr-1.5 transition-colors ${locationData.isGps ? 'bg-green-500 text-white' : 'bg-white/10 group-hover:bg-white/20'}`}>
                        <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                    </div>
                    <span className="truncate">{locationDisplay}</span>
                    <svg className="w-3 h-3 ml-1 text-white/70 group-hover:text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </button>

                <button 
                    onClick={() => setIsFilterOpen(true)}
                    className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full text-xs text-white font-medium transition-all border border-white/20"
                >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                    Filters
                </button>
            </div>
        </div>
      </div>

      {/* --- FILTER MODAL (Bottom Sheet / Modal) --- */}
      {isFilterOpen && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsFilterOpen(false)}></div>
              
              <div className="relative bg-white dark:bg-dark-surface w-full md:w-[500px] md:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-slide-up">
                  
                  {/* Modal Header */}
                  <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                          Advanced Filters
                      </h3>
                      <button onClick={() => setIsFilterOpen(false)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                  </div>

                  {/* Modal Body (Scrollable) */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-6">
                      
                      {/* 1. Location Section */}
                      <section>
                          <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">Location</h4>
                          
                          <button 
                            onClick={handleGetLocation}
                            className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium text-sm border mb-3 transition-all ${
                                locationData.isGps 
                                ? 'bg-green-50 border-green-500 text-green-700' 
                                : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-200 hover:bg-gray-50'
                            }`}
                          >
                              {gpsLoading ? <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span> : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                              Use Current Location (Near Me)
                          </button>

                          <div className={`grid grid-cols-2 gap-3 transition-opacity ${locationData.isGps ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                              <div>
                                  <label className="block text-xs text-gray-500 mb-1">Province</label>
                                  <select 
                                    className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none focus:border-primary"
                                    value={locationData.province}
                                    onChange={(e) => setLocationData({ ...locationData, province: e.target.value, city: '' })}
                                  >
                                      <option value="">Select</option>
                                      {Object.keys(PAKISTAN_LOCATIONS).map(p => <option key={p} value={p}>{p}</option>)}
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-xs text-gray-500 mb-1">City / Area</label>
                                  <select 
                                    className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none focus:border-primary"
                                    value={locationData.city}
                                    onChange={(e) => setLocationData({ ...locationData, city: e.target.value })}
                                    disabled={!locationData.province}
                                  >
                                      <option value="">Select</option>
                                      {locationData.province && PAKISTAN_LOCATIONS[locationData.province].map(c => <option key={c} value={c}>{c}</option>)}
                                  </select>
                              </div>
                          </div>
                      </section>

                      {/* 2. Sort Section */}
                      <section>
                          <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">Sort By</h4>
                          <div className="grid grid-cols-2 gap-2">
                              {['recommended', 'nearest', 'top_rated', 'newest'].map(opt => (
                                  <button 
                                    key={opt}
                                    onClick={() => setSortBy(opt)}
                                    className={`py-2 px-3 text-sm rounded-lg border transition-all ${
                                        sortBy === opt 
                                        ? 'bg-primary/10 border-primary text-primary font-semibold' 
                                        : 'bg-transparent border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                                    }`}
                                  >
                                      {opt.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </button>
                              ))}
                          </div>
                      </section>

                      {/* 3. Features Section (Toggles) */}
                      <section>
                          <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">Features & Reliability</h4>
                          <div className="space-y-3">
                              
                              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                  <div className="flex items-center gap-3">
                                      <div className="bg-blue-100 p-1.5 rounded-full text-blue-600">
                                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" /></svg>
                                      </div>
                                      <div>
                                          <span className="block text-sm font-semibold text-gray-800 dark:text-gray-200">Verified Vendors Only</span>
                                          <span className="block text-xs text-gray-500">Show only trusted sellers</span>
                                      </div>
                                  </div>
                                  <div className={`w-10 h-6 flex items-center rounded-full p-1 duration-300 ease-in-out ${filters.verifiedOnly ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${filters.verifiedOnly ? 'translate-x-4' : ''}`}></div>
                                  </div>
                                  <input type="checkbox" className="hidden" checked={filters.verifiedOnly} onChange={() => setFilters({...filters, verifiedOnly: !filters.verifiedOnly})} />
                              </label>

                              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                  <div className="flex items-center gap-3">
                                      <div className="bg-green-100 p-1.5 rounded-full text-green-600">
                                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                      </div>
                                      <div>
                                          <span className="block text-sm font-semibold text-gray-800 dark:text-gray-200">Free Delivery</span>
                                          <span className="block text-xs text-gray-500">Items with £0 shipping fee</span>
                                      </div>
                                  </div>
                                  <div className={`w-10 h-6 flex items-center rounded-full p-1 duration-300 ease-in-out ${filters.freeDelivery ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${filters.freeDelivery ? 'translate-x-4' : ''}`}></div>
                                  </div>
                                  <input type="checkbox" className="hidden" checked={filters.freeDelivery} onChange={() => setFilters({...filters, freeDelivery: !filters.freeDelivery})} />
                              </label>

                              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                  <div className="flex items-center gap-3">
                                      <div className="bg-red-100 p-1.5 rounded-full text-red-600">
                                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                      </div>
                                      <div>
                                          <span className="block text-sm font-semibold text-gray-800 dark:text-gray-200">Open Now</span>
                                          <span className="block text-xs text-gray-500">Currently open businesses</span>
                                      </div>
                                  </div>
                                  <div className={`w-10 h-6 flex items-center rounded-full p-1 duration-300 ease-in-out ${filters.openNow ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${filters.openNow ? 'translate-x-4' : ''}`}></div>
                                  </div>
                                  <input type="checkbox" className="hidden" checked={filters.openNow} onChange={() => setFilters({...filters, openNow: !filters.openNow})} />
                              </label>

                          </div>
                      </section>

                  </div>

                  {/* Modal Footer */}
                  <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-dark-surface pb-8 md:pb-4">
                      <div className="flex gap-3">
                          <button 
                            onClick={() => {
                                setLocationData({province:'', city:'', isGps:false});
                                setSortBy('recommended');
                                setFilters({verifiedOnly:false, freeDelivery:false, openNow:false, onSale:false});
                            }}
                            className="flex-1 py-3 text-gray-600 dark:text-gray-300 font-semibold rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                              Reset
                          </button>
                          <button 
                            onClick={handleApplyFilters}
                            className="flex-[2] py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-primary-dark transition-transform active:scale-95"
                          >
                              Show Results
                          </button>
                      </div>
                  </div>

              </div>
          </div>
      )}
      
      {/* --- 10 BANNER CAROUSEL (Auto-Scroll & Swipe) --- */}
      <div 
        className="relative w-full overflow-hidden rounded-xl shadow-md group h-40 sm:h-52 md:h-64 touch-pan-y"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
          {/* Slider Track */}
          <div 
            className="flex transition-transform duration-500 ease-in-out h-full"
            style={{ transform: `translateX(-${currentBannerIndex * 100}%)` }}
          >
              {PROMO_BANNERS.map((banner) => (
                  <div 
                    key={banner.id} 
                    className={`min-w-full h-full bg-gradient-to-r ${banner.color} flex items-center justify-between px-6 md:px-16 text-white relative`}
                  >
                      <div className="z-10">
                          <span className="bg-white/20 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider mb-2 inline-block border border-white/30">Featured Ad</span>
                          <h2 className="text-3xl md:text-5xl font-extrabold mb-2 drop-shadow-md">{banner.title}</h2>
                          <p className="text-sm md:text-xl font-medium opacity-90">{banner.subtitle}</p>
                          <button className="mt-4 px-4 py-2 bg-white text-gray-900 font-bold rounded-full text-xs md:text-sm hover:bg-gray-100 transition-colors shadow-lg">
                              Shop Now &rarr;
                          </button>
                      </div>
                      <div className="text-[80px] md:text-[150px] opacity-20 absolute right-4 md:right-20 rotate-12 pointer-events-none select-none">
                          {banner.icon}
                      </div>
                      
                      {/* Decorative Pattern */}
                      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                  </div>
              ))}
          </div>

          {/* Indicators (Dots) */}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 z-10">
              {PROMO_BANNERS.map((_, index) => (
                  <button
                      key={index}
                      onClick={() => setCurrentBannerIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          index === currentBannerIndex ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/80'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                  />
              ))}
          </div>
      </div>

      {/* Categories Section */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Browse Categories</h3>
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-10 gap-2 md:gap-4">
          {CATEGORIES.map((category) => (
            <div
              key={category.id}
              onClick={() => onNavigate('subcategories', { category })}
              className="group flex flex-col items-center p-2 bg-white dark:bg-dark-surface rounded-lg shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer text-center"
            >
              <div className="h-10 w-10 flex items-center justify-center text-primary dark:text-gray-200 mb-1 transition-transform duration-300 group-hover:scale-110">
                {category.icon}
              </div>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-tight h-8 flex items-center justify-center">{category.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Listings Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Featured Listings</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {featuredListings.length > 0 ? featuredListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} onViewDetails={(l) => onNavigate('details', { listing: l })} />
          )) : <p className="col-span-full text-center text-gray-500">No featured listings available.</p>}
        </div>
      </div>

      {/* Divider */}
      <hr className="border-gray-200 dark:border-gray-700 my-4" />

      {/* Random Listings Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">More For You</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {randomListings.map((listing, index) => (
            // Using index in key because items can be duplicated in this mock setup
            <ListingCard key={`${listing.id}-${index}`} listing={listing} onViewDetails={(l) => onNavigate('details', { listing: l })} />
          ))}
        </div>
      </div>
      
      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex justify-center items-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="ml-3 text-gray-600 dark:text-gray-400">Loading more...</p>
        </div>
      )}
    </div>
  );
};

export default HomePage;
