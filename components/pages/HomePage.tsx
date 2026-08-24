import React, { useState, useEffect, useCallback } from 'react';
import { CATEGORIES as DEFAULT_CATEGORIES, PAKISTAN_LOCATIONS, renderIconByKey } from '../../constants';
import { Listing, Category, HomeBanner } from '../../types';
import ListingCard from '../common/ListingCard';
import { db } from '../../firebaseConfig';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useLanguage } from '../../src/context/LanguageContext';

interface HomePageProps {
  listings: Listing[];
  categories?: Category[]; 
  onNavigate: (view: 'listings' | 'details' | 'subcategories' | any, payload?: { listing?: Listing; category?: Category; query?: string }) => void;
  onSaveSearch: (query: string) => void;
  onOpenBonusModal?: () => void;
}

const shuffleArray = (array: any[]) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

const DEFAULT_BANNERS: HomeBanner[] = [
    { id: '1', title: "MEGA SALE", subtitle: "Up to 70% OFF on Electronics", color: "from-blue-600 to-blue-800", icon: "⚡", isActive: true, order: 0 },
    { id: '2', title: "FRESH FOOD", subtitle: "Order Home Chef Meals Today", color: "from-orange-500 to-red-500", icon: "🍔", isActive: true, order: 1 },
    { id: '3', title: "FASHION WEEK", subtitle: "New Summer Collection Arrival", color: "from-pink-500 to-rose-500", icon: "👗", isActive: true, order: 2 },
];

const PAK_CITIES_COORDS = [
  { city: 'Karachi', province: 'Sindh', lat: 24.8607, lng: 67.0011 },
  { city: 'Lahore', province: 'Punjab', lat: 31.5204, lng: 74.3587 },
  { city: 'Faisalabad', province: 'Punjab', lat: 31.4504, lng: 73.1350 },
  { city: 'Rawalpindi', province: 'Punjab', lat: 33.5651, lng: 73.0169 },
  { city: 'Islamabad', province: 'Islamabad Capital Territory', lat: 33.6844, lng: 73.0479 },
  { city: 'Multan', province: 'Punjab', lat: 30.1575, lng: 71.5249 },
  { city: 'Hyderabad', province: 'Sindh', lat: 25.3960, lng: 68.3578 },
  { city: 'Peshawar', province: 'Khyber Pakhtunkhwa', lat: 34.0151, lng: 71.5249 },
  { city: 'Quetta', province: 'Balochistan', lat: 30.1798, lng: 66.9750 },
  { city: 'Gujranwala', province: 'Punjab', lat: 32.1877, lng: 74.1945 },
  { city: 'Sialkot', province: 'Punjab', lat: 32.4945, lng: 74.5229 },
  { city: 'Abbottabad', province: 'Khyber Pakhtunkhwa', lat: 34.1688, lng: 73.2215 },
  { city: 'Sukkur', province: 'Sindh', lat: 27.7052, lng: 68.8574 },
  { city: 'Mardan', province: 'Khyber Pakhtunkhwa', lat: 34.1986, lng: 72.0404 },
  { city: 'Mirpur', province: 'Azad Kashmir', lat: 33.1484, lng: 73.7519 },
  { city: 'Gilgit', province: 'Gilgit-Baltistan', lat: 35.9208, lng: 74.3089 },
];

const HomePage: React.FC<HomePageProps> = ({ listings, categories = [], onNavigate, onSaveSearch, onOpenBonusModal }) => {
  const { t, language, setLanguage, isUrdu } = useLanguage();
  const [banners, setBanners] = useState<HomeBanner[]>(DEFAULT_BANNERS);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  
  const displayCategories = categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  const sortedListings = [...listings].sort((a, b) => {
      if (a.isPromoted && !b.isPromoted) return -1;
      if (!a.isPromoted && b.isPromoted) return 1;
      return 0;
  });

  const featuredListings = sortedListings.filter(l => l.isPromoted).slice(0, 10);
  const remainingListings = sortedListings.filter(l => !l.isPromoted);
  
  const [randomListings, setRandomListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Voice Search State
  const [isListening, setIsListening] = useState(false);

  // Filter & Location State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [locationData, setLocationData] = useState({ province: '', city: '', isGps: false });
  const [filters, setFilters] = useState({
      verifiedOnly: false,
      onSale: false
  });
  const [gpsLoading, setGpsLoading] = useState(false);

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
      if (!db) return;
      const q = query(collection(db, 'banners'), where('isActive', '==', true));
      
      const unsub = onSnapshot(q, (snap) => {
          let fetchedBanners = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as HomeBanner));
          
          if (fetchedBanners.length > 0) {
              fetchedBanners.sort((a, b) => (a.order || 0) - (b.order || 0));
              setBanners(fetchedBanners);
          } else {
              setBanners(DEFAULT_BANNERS);
          }
      }, (err) => {
          console.error("Banners fetch error:", err.message);
      });
      return () => unsub();
  }, []);

  useEffect(() => {
    if (remainingListings.length > 0) {
      setRandomListings(shuffleArray([...remainingListings]).slice(0, 8));
    }
  }, [listings]); 

  useEffect(() => {
      if (banners.length <= 1) return;
      const interval = setInterval(() => {
          setCurrentBannerIndex((prevIndex) => (prevIndex + 1) % banners.length);
      }, 5000); 
      return () => clearInterval(interval);
  }, [banners.length]);

  const onTouchStart = (e: React.TouchEvent) => {
      setTouchEnd(null); 
      setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
      setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
      if (!touchStart || !touchEnd || banners.length <= 1) return;
      const distance = touchStart - touchEnd;
      if (distance > 50) setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
      if (distance < -50) setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleBannerClick = (banner: HomeBanner) => {
      if (!banner.link) return;
      const targetListing = listings.find(l => l.id === banner.link);
      if (targetListing) onNavigate('details', { listing: targetListing });
      else onNavigate('listings', { query: banner.link });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) onNavigate('listings', { query: searchQuery });
  };

  // 🎙️ Voice Search Logic
  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(isUrdu ? "اس براؤزر پر وائس سرچ سپورٹڈ نہیں ہے۔ براہ کرم کروم یا سفاری استعمال کریں۔" : "Voice search is not supported on this browser. Please use Chrome, Safari or Edge.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = isUrdu ? 'ur-PK' : 'en-PK';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0]?.transcript;
        if (transcript) {
          setSearchQuery(transcript);
          setIsListening(false);
          onNavigate('listings', { query: transcript.trim() });
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event?.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error("Voice search error:", err);
      setIsListening(false);
    }
  };

  // 📍 "Near Me" GPS Location Resolver
  const handleGetNearMeLocation = () => {
    if (!navigator.geolocation) {
      alert(isUrdu ? "آپ کے براؤزر میں لوکیشن کی سہولت موجود نہیں ہے" : "Geolocation is not supported by your browser.");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        let nearest = PAK_CITIES_COORDS[0];
        let minDistance = Infinity;

        PAK_CITIES_COORDS.forEach((c) => {
          const dLat = (c.lat - latitude) * (Math.PI / 180);
          const dLng = (c.lng - longitude) * (Math.PI / 180);
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(latitude * (Math.PI / 180)) * Math.cos(c.lat * (Math.PI / 180)) *
                    Math.sin(dLng / 2) * Math.sin(dLng / 2);
          const distance = 6371 * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
          if (distance < minDistance) {
            minDistance = distance;
            nearest = c;
          }
        });

        setLocationData({ province: nearest.province, city: nearest.city, isGps: true });
        setSelectedCity(nearest.city);
        setSelectedProvince(nearest.province);
        setGpsLoading(false);
        setIsFilterOpen(false);
        onNavigate('listings', { query: nearest.city });
      },
      (err) => {
        console.warn("Geolocation error:", err);
        setGpsLoading(false);
        alert(isUrdu ? "مقام حاصل نہیں ہو سکا۔ براہ کرم لوکیشن کی اجازت دیں۔" : "Unable to retrieve location. Please check browser permissions.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleApplyFilters = () => {
      setIsFilterOpen(false);
      const filterSummary: string[] = [];
      if (selectedCity) {
        setLocationData({ province: selectedProvince, city: selectedCity, isGps: false });
        filterSummary.push(selectedCity);
      }
      if (filters.verifiedOnly) filterSummary.push("Verified");
      if (filters.onSale) filterSummary.push("Sale");
      const q = filterSummary.length > 0 ? filterSummary.join(" ") : "";
      onNavigate('listings', { query: q });
  };

  const handleResetLocation = () => {
    setLocationData({ province: '', city: '', isGps: false });
    setSelectedCity('');
    setSelectedProvince('');
    setIsFilterOpen(false);
    onNavigate('listings', { query: '' });
  };

  const locationDisplay = locationData.isGps 
    ? (isUrdu ? `📍 میرے قریب (${locationData.city})` : `📍 Near Me (${locationData.city})`)
    : (locationData.city ? `📍 ${locationData.city}` : (isUrdu ? "🇵🇰 پورا پاکستان" : "🇵🇰 All Pakistan"));

  return (
    <div className="space-y-3">
      {/* 📍 STICKY TOP SEARCH & LOCATION BAR */}
      <div className="bg-primary dark:bg-dark-primary py-2.5 px-4 rounded-b-2xl shadow-md -mx-4 mb-3 transition-all sticky top-0 z-40">
        <div className="container mx-auto max-w-4xl">
            <div className="flex items-center justify-between mb-2">
                <button 
                    onClick={() => setIsFilterOpen(true)}
                    className="flex items-center text-white/95 hover:text-white text-xs font-bold truncate max-w-[65%] bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-sm"
                >
                    <svg className="w-3.5 h-3.5 mr-1 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                    <span className="truncate">{locationDisplay}</span>
                    <svg className="w-3 h-3 ml-1 text-white/70 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </button>

                {/* 🌐 Language Switcher Pill */}
                <div className="flex items-center bg-white/20 p-0.5 rounded-full border border-white/20 backdrop-blur-sm">
                  <button 
                    onClick={() => setLanguage('en')}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black transition-all ${language === 'en' ? 'bg-white text-primary shadow-sm' : 'text-white/80 hover:text-white'}`}
                  >
                    EN
                  </button>
                  <button 
                    onClick={() => setLanguage('ur')}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black transition-all ${language === 'ur' ? 'bg-white text-primary shadow-sm' : 'text-white/80 hover:text-white'}`}
                  >
                    اردو
                  </button>
                </div>
            </div>

            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                 <input
                    type="text"
                    placeholder={isListening ? t('listening') : t('searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-9 pr-20 py-2.5 rounded-xl border-0 bg-white text-gray-800 focus:ring-2 focus:ring-teal-300 shadow-sm text-sm transition-all placeholder-gray-400 font-medium ${isListening ? 'ring-2 ring-red-400 animate-pulse' : ''}`}
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                
                {/* 🎙️ Voice Search Button inside input */}
                <button 
                  type="button" 
                  onClick={startVoiceSearch} 
                  title={t('voiceSearch')}
                  className={`absolute right-10 p-1.5 rounded-lg transition-all ${isListening ? 'bg-red-500 text-white animate-ping' : 'text-gray-400 hover:text-primary hover:bg-gray-100'}`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                </button>

                {/* Filter Modal trigger */}
                <button 
                  type="button" 
                  onClick={() => setIsFilterOpen(true)} 
                  className="absolute right-2 p-1.5 text-gray-400 hover:text-primary transition-colors border-l border-gray-200 pl-2"
                >
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                </button>
            </form>
        </div>
      </div>

      {/* 📍 LOCATION & FILTER MODAL */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[1200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-dark-surface rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-800 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📍</span>
                <h3 className="text-lg font-black text-gray-900 dark:text-white">{isUrdu ? 'مقام اور فلٹرز' : 'Location & Filters'}</h3>
              </div>
              <button onClick={() => setIsFilterOpen(false)} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* GPS Near Me Button */}
            <button
              type="button"
              onClick={handleGetNearMeLocation}
              disabled={gpsLoading}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-gradient-to-r from-primary to-teal-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-primary/20 active:scale-98 transition-all disabled:opacity-50"
            >
              {gpsLoading ? (
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              )}
              <span>{isUrdu ? '📍 میرے قریب تلاش کریں (GPS)' : '📍 Find Near Me (Auto GPS)'}</span>
            </button>

            {/* Province and City Selection */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  {isUrdu ? 'صوبہ / علاقہ منتخب کریں' : 'Select Province / Territory'}
                </label>
                <select
                  value={selectedProvince}
                  onChange={(e) => {
                    setSelectedProvince(e.target.value);
                    setSelectedCity('');
                  }}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-800 dark:text-gray-200 outline-none focus:border-primary"
                >
                  <option value="">{isUrdu ? 'تمام پاکستان' : 'All Pakistan'}</option>
                  {Object.keys(PAKISTAN_LOCATIONS).map((prov) => (
                    <option key={prov} value={prov}>{prov}</option>
                  ))}
                </select>
              </div>

              {selectedProvince && (
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    {isUrdu ? 'شہر منتخب کریں' : 'Select City'}
                  </label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-800 dark:text-gray-200 outline-none focus:border-primary"
                  >
                    <option value="">{isUrdu ? 'تمام شہر' : 'All Cities'}</option>
                    {(PAKISTAN_LOCATIONS[selectedProvince] || []).map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Quick Filter Checkboxes */}
            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.verifiedOnly}
                  onChange={(e) => setFilters(f => ({ ...f, verifiedOnly: e.target.checked }))}
                  className="h-4 w-4 text-primary rounded"
                />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  {isUrdu ? 'صرف تصدیق شدہ دکاندار (Verified Merchants)' : 'Verified Merchants Only'}
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.onSale}
                  onChange={(e) => setFilters(f => ({ ...f, onSale: e.target.checked }))}
                  className="h-4 w-4 text-primary rounded"
                />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  {isUrdu ? 'ڈسکاؤنٹ والے اشتہارات (Special Discounts)' : 'Special Discounts & Offers'}
                </span>
              </label>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetLocation}
                className="flex-1 py-3 text-xs font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 transition-all"
              >
                {isUrdu ? 'ری سیٹ' : 'Reset All'}
              </button>
              <button
                type="button"
                onClick={handleApplyFilters}
                className="flex-[2] py-3 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/30 transition-all"
              >
                {isUrdu ? 'فلٹر لگائیں' : 'Apply Filters'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🖼️ CAROUSEL PROMOTION BANNERS */}
      <div 
        className="relative w-full overflow-hidden rounded-2xl shadow-sm group h-36 sm:h-48 md:h-56 touch-pan-y cursor-pointer"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
          <div 
            className="flex transition-transform duration-500 ease-in-out h-full"
            style={{ transform: `translateX(-${currentBannerIndex * 100}%)` }}
          >
              {banners.map((banner) => (
                  <div 
                    key={banner.id} 
                    onClick={() => handleBannerClick(banner)}
                    className={`min-w-full h-full flex items-center justify-between px-5 md:px-12 text-white relative overflow-hidden`}
                  >
                      {banner.imageUrl ? (
                          <img src={banner.imageUrl} className="absolute inset-0 w-full h-full object-cover z-0" alt="" />
                      ) : (
                          <div className={`absolute inset-0 bg-gradient-to-r ${banner.color} z-0`}></div>
                      )}

                      <div className="z-10 max-w-[65%]">
                          {banner.title && (
                              <>
                                  <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1 inline-block border border-white/30 backdrop-blur-sm">
                                    {isUrdu ? 'پروموشن' : 'Promotion'}
                                  </span>
                                  <h2 className="text-xl md:text-3xl font-extrabold mb-1 drop-shadow-md leading-tight uppercase">{banner.title}</h2>
                              </>
                          )}
                          {banner.subtitle && <p className="text-xs md:text-sm font-medium opacity-90 mb-3 drop-shadow-sm">{banner.subtitle}</p>}
                      </div>
                      
                      {!banner.imageUrl && (
                          <div className="text-[60px] md:text-[100px] opacity-20 absolute right-2 md:right-10 rotate-12 pointer-events-none select-none z-10">
                            {banner.icon}
                          </div>
                      )}
                  </div>
              ))}
          </div>
      </div>

      {/* 🗂️ CATEGORIES SECTION */}
      <div>
        <div className="flex justify-between items-center mb-2 px-1">
            <h3 className="text-sm font-bold text-gray-800 dark:text-white">{t('categories')}</h3>
            <span className="text-[11px] text-primary font-bold cursor-pointer hover:underline" onClick={() => onNavigate('subcategories')}>
              {t('viewAll')}
            </span>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 gap-2">
          {displayCategories.slice(0, 8).map((category) => (
            <div
              key={category.id}
              onClick={() => onNavigate('subcategories', { category })}
              className="group flex flex-col items-center p-2 bg-white dark:bg-dark-surface rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer text-center border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
            >
              <div className="h-8 w-8 flex items-center justify-center text-primary dark:text-gray-200 mb-1">
                {renderIconByKey(category.icon)}
              </div>
              <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 leading-tight line-clamp-1">{category.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 🎁 RS. 1,000 SIGNUP BONUS PROMO CARD */}
      <div 
        onClick={onOpenBonusModal}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-primary to-teal-700 p-4 text-white shadow-lg cursor-pointer transform hover:scale-[1.01] active:scale-[0.99] transition-all border border-amber-300/40 my-3"
      >
        <div className="absolute -right-4 -bottom-6 text-6xl opacity-20 select-none pointer-events-none">🎁</div>
        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="bg-amber-300 text-gray-900 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                {isUrdu ? 'صرف پہلے 50 صارفین' : 'First 50 Users Only'}
              </span>
              <span className="bg-white/20 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                🔥 {isUrdu ? 'محدود مدت' : 'Limited Time'}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black leading-tight drop-shadow-sm">
              {isUrdu ? '1,000 روپے کا مفت سائن اپ بونس!' : 'Get Rs. 1,000 Signup Bonus!'}
            </h3>
            <p className="text-[11px] sm:text-xs text-white/90 font-medium mt-0.5 line-clamp-1">
              {isUrdu 
                ? 'سائن اپ کریں اور پہلا اشتہار لگا کر 1000 روپے حاصل کریں، پوسٹ مفت Featured کریں!' 
                : 'Sign up & post your first listing to receive Rs. 1,000 in your wallet for ad promotion!'}
            </p>
          </div>
          <div className="flex-shrink-0 flex items-center gap-1 bg-white text-primary px-3 py-2 rounded-xl font-black text-xs shadow-md hover:bg-gray-50 transition-colors">
            <span>{isUrdu ? 'حاصل کریں' : 'Claim'}</span>
            <span className="text-amber-500 text-sm font-bold">➔</span>
          </div>
        </div>
      </div>

      {/* 🔥 FEATURED LISTINGS */}
      <div>
        <div className="flex justify-between items-center mb-2 mt-3 px-1">
            <h2 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-1">
              {t('featuredListings')}
            </h2>
            <span className="text-[11px] text-primary font-bold cursor-pointer hover:underline" onClick={() => onNavigate('listings')}>
              {t('seeAll')}
            </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {featuredListings.length > 0 ? featuredListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} onViewDetails={(l) => onNavigate('details', { listing: l })} />
          )) : <p className="col-span-full text-center text-xs text-gray-500 py-4">{t('noItems')}</p>}
        </div>
      </div>

      <hr className="border-gray-100 dark:border-gray-800 my-2" />

      {/* ✨ FRESH RECOMMENDATIONS */}
      <div>
        <h2 className="text-sm font-bold text-gray-800 dark:text-white mb-2 px-1">
          {t('freshRecommendations')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {randomListings.map((listing, index) => (
            <ListingCard key={`${listing.id}-${index}`} listing={listing} onViewDetails={(l) => onNavigate('details', { listing: l })} />
          ))}
        </div>
      </div>
      
      {isLoading && <div className="flex justify-center items-center py-4"><div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div></div>}
    </div>
  );
};

export default HomePage;
