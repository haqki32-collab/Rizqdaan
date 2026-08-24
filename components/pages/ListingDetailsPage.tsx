import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Listing, User, Review } from '../../types';
import { db } from '../../firebaseConfig';
import { doc, updateDoc, arrayUnion, arrayRemove, increment, getDoc, setDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import ListingCard from '../common/ListingCard';
import { useLanguage } from '../../src/context/LanguageContext';

interface ListingDetailsPageProps {
  listing: Listing;
  listings: Listing[];
  user: User | null;
  onNavigate: (view: 'listings' | 'details' | 'chats' | 'vendor-profile', payload?: { listing?: Listing, targetUser?: { id: string, name: string }, targetVendorId?: string }) => void;
}

const SectionWrapper = ({ children, title, className = "", noBorder = false }: { children?: React.ReactNode, title?: string, className?: string, noBorder?: boolean }) => (
    <section className={`w-full bg-white dark:bg-dark-surface ${!noBorder ? 'border-b border-gray-100 dark:border-gray-800' : ''} p-5 md:p-8 ${className}`}>
        {title && <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-5">{title}</h3>}
        {children}
    </section>
);

const ListingDetailsPage: React.FC<ListingDetailsPageProps> = ({ listing, listings, user, onNavigate }) => {
    const { t, isUrdu } = useLanguage();
    const [reviews, setReviews] = useState<Review[]>(listing.reviews || []);
    const [newRating, setNewRating] = useState(5);
    const [newComment, setNewComment] = useState('');
    const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [vendorData, setVendorData] = useState<User | null>(null);
    
    // Share & Report state
    const [shareToast, setShareToast] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportReason, setReportReason] = useState('Fraudulent / Fake Seller');
    const [reportDetails, setReportDetails] = useState('');
    const [isSubmittingReport, setIsSubmittingReport] = useState(false);
    const [reportSuccessMessage, setReportSuccessMessage] = useState(false);
    
    // Carousel State
    const images = useMemo(() => listing.images && listing.images.length > 0 ? listing.images : [listing.imageUrl], [listing]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    const scrollRef = useRef<HTMLDivElement>(null);
    const fullscreenScrollRef = useRef<HTMLDivElement>(null);
    
    const [isFavorite, setIsFavorite] = useState(false);

    // Related Listings Logic
    const relatedListings = useMemo(() => {
        return listings
            .filter(l => l.category === listing.category && l.id !== listing.id)
            .sort(() => 0.5 - Math.random()) 
            .slice(0, 4);
    }, [listings, listing.id, listing.category]);

    useEffect(() => {
        setReviews(listing.reviews || []);
        setActiveIndex(0);
        if (scrollRef.current) scrollRef.current.scrollLeft = 0;
        window.scrollTo(0, 0);
    }, [listing.id]);

    useEffect(() => {
        if (user && user.favorites) setIsFavorite(user.favorites.includes(listing.id));
    }, [user, listing.id]);

    useEffect(() => {
        const fetchVendorInfo = async () => {
            if (!db || !listing.vendorId) return;
            try {
                const userSnap = await getDoc(doc(db, "users", listing.vendorId));
                if (userSnap.exists()) setVendorData(userSnap.data() as User);
            } catch (e) {}
        };
        fetchVendorInfo();
    }, [listing.vendorId]);

    // Handle carousel scroll synchronization
    const handleScroll = (e: React.UIEvent<HTMLDivElement>, isFs: boolean) => {
        const target = e.currentTarget;
        const width = target.clientWidth;
        const index = Math.round(target.scrollLeft / width);
        if (index !== activeIndex && index >= 0 && index < images.length) {
            setActiveIndex(index);
        }
    };

    const scrollToImage = (index: number, isFs: boolean) => {
        const ref = isFs ? fullscreenScrollRef : scrollRef;
        if (ref.current) {
            const width = ref.current.clientWidth;
            ref.current.scrollTo({
                left: index * width,
                behavior: 'smooth'
            });
        }
    };

    // When fullscreen opens, ensure it's at the right index
    useEffect(() => {
        if (isFullscreen && fullscreenScrollRef.current) {
            const width = fullscreenScrollRef.current.clientWidth;
            fullscreenScrollRef.current.scrollLeft = activeIndex * width;
        }
    }, [isFullscreen]);

    // Sync back when closing fullscreen
    const closeFullscreen = () => {
        setIsFullscreen(false);
        if (scrollRef.current) {
            const width = scrollRef.current.clientWidth;
            scrollRef.current.scrollLeft = activeIndex * width;
        }
    };

    // Analytics: Conversation Tracking
    const trackConversation = async (type: 'chat' | 'whatsapp') => {
        if (!db || !listing.id) return;
        try {
            const listingRef = doc(db, 'listings', listing.id);
            await updateDoc(listingRef, { messages: increment(1) });

            if (listing.isPromoted) {
                const q = query(
                    collection(db, 'campaigns'),
                    where('listingId', '==', listing.id),
                    where('status', '==', 'active')
                );
                const snap = await getDocs(q);
                if (!snap.empty) {
                    await updateDoc(snap.docs[0].ref, { conversions: increment(1) });
                }
            }
        } catch (e) {
            console.warn("Analytics tracking error (silent):", e);
        }
    };

    const handleToggleFavorite = async () => {
        if (!user) { alert(isUrdu ? "پسندیدہ میں شامل کرنے کے لیے لاگ ان کریں" : "Please login to save favorites."); return; }
        const wasFavorite = isFavorite;
        setIsFavorite(!wasFavorite);
        if (!db) return;
        const userRef = doc(db, 'users', user.id);
        const listingRef = doc(db, 'listings', listing.id);
        try {
            if (wasFavorite) {
                await setDoc(userRef, { favorites: arrayRemove(listing.id) }, { merge: true });
                await updateDoc(listingRef, { likes: increment(-1) }).catch(() => {});
            } else {
                await setDoc(userRef, { favorites: arrayUnion(listing.id) }, { merge: true });
                await updateDoc(listingRef, { likes: increment(1) }).catch(() => {});
            }
        } catch (e) {}
    };

    // 📱 WhatsApp One-Click Direct Share
    const handleWhatsAppShare = () => {
        const shareText = `🔥 *RizqDaan Par Behtareen Deal!* 🔥\n\n📌 *${listing.title}*\n💰 *Price:* Rs. ${listing.price.toLocaleString()}\n📍 *Location:* ${listing.location}\n\n👉 *View Details:* ${window.location.href}`;
        const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
        window.open(waUrl, '_blank');
    };

    // 🌐 Web Share API & Copy Link
    const handleGenericShare = async () => {
        const shareData = {
            title: `${listing.title} - RizqDaan`,
            text: `Check out ${listing.title} for Rs. ${listing.price.toLocaleString()} on RizqDaan!`,
            url: window.location.href,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
                return;
            } catch (err) {
                // fallback to copy
            }
        }

        try {
            await navigator.clipboard.writeText(window.location.href);
            setShareToast(true);
            setTimeout(() => setShareToast(false), 3000);
        } catch (e) {
            prompt("Copy this link:", window.location.href);
        }
    };

    // 🚨 Report Listing Submit
    const handleReportSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingReport(true);
        try {
            if (db) {
                await addDoc(collection(db, 'reports'), {
                    listingId: listing.id,
                    listingTitle: listing.title,
                    vendorId: listing.vendorId || '',
                    vendorName: vendorData?.shopName || listing.vendorName || 'Unknown',
                    reportedByUserId: user?.id || 'guest',
                    reportedByUserName: user?.name || 'Guest User',
                    reason: reportReason,
                    details: reportDetails.trim(),
                    status: 'pending',
                    createdAt: new Date().toISOString()
                });
            }
            setReportSuccessMessage(true);
            setTimeout(() => {
                setReportSuccessMessage(false);
                setIsReportModalOpen(false);
                setReportDetails('');
            }, 2500);
        } catch (err) {
            console.error("Report error:", err);
            alert("Error submitting report. Please try again.");
        } finally {
            setIsSubmittingReport(false);
        }
    };

    // ⭐ Ratings & Reviews Submit
    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newRating === 0 || !newComment.trim() || !user) return;
        setIsSubmittingReview(true);
        const newReview: Review = { 
            id: `r-${Date.now()}`, 
            author: user.name, 
            rating: newRating, 
            comment: newComment.trim(), 
            date: new Date().toISOString().split('T')[0] 
        };
        
        try {
            if (db) {
                const listingRef = doc(db, 'listings', listing.id);
                const allReviews = [...reviews, newReview];
                const avg = allReviews.reduce((a, b) => a + b.rating, 0) / allReviews.length;
                
                await updateDoc(listingRef, { 
                    reviews: arrayUnion(newReview),
                    rating: Number(avg.toFixed(1))
                });

                // Also save to separate reviews collection for records
                await addDoc(collection(db, 'reviews'), {
                    listingId: listing.id,
                    listingTitle: listing.title,
                    vendorId: listing.vendorId,
                    userId: user.id,
                    userName: user.name,
                    rating: newRating,
                    comment: newComment.trim(),
                    createdAt: new Date().toISOString()
                }).catch(() => {});

                setReviews(allReviews);
                setNewComment('');
                setNewRating(5);
                setIsReviewFormOpen(false);
            }
        } catch (e) {
            alert("Error submitting review.");
        } finally {
            setIsSubmittingReview(false);
        }
    };

    // Review statistics breakdown
    const ratingBreakdown = useMemo(() => {
        const counts = [0, 0, 0, 0, 0]; // 1, 2, 3, 4, 5 stars
        reviews.forEach(r => {
            const idx = Math.min(Math.max(Math.round(r.rating) - 1, 0), 4);
            counts[idx]++;
        });
        const total = reviews.length || 1;
        return [5, 4, 3, 2, 1].map(stars => ({
            stars,
            count: counts[stars - 1],
            percentage: Math.round((counts[stars - 1] / total) * 100)
        }));
    }, [reviews]);

    const discountPercent = listing.originalPrice ? Math.round(((listing.originalPrice - listing.price) / listing.originalPrice) * 100) : 0;

    const ratingLabels = isUrdu 
        ? ['', 'ناقص', 'مناسب', 'اچھا', 'بہت اچھا', 'زبردست!'] 
        : ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent!'];

  return (
    <div className="bg-gray-50 dark:bg-black min-h-screen pb-10 animate-fade-in overflow-x-hidden">
      
      {/* Toast Notification */}
      {shareToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[1100] bg-gray-900 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 animate-bounce">
          <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
          <span>{t('linkCopied')}</span>
        </div>
      )}

      {/* 🚨 REPORT AD MODAL */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-[1200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-dark-surface rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <h3 className="text-lg font-black text-gray-900 dark:text-white">{t('reportTitle')}</h3>
              </div>
              <button 
                onClick={() => setIsReportModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {reportSuccessMessage ? (
              <div className="text-center py-8 space-y-2">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto text-2xl">
                  ✓
                </div>
                <h4 className="text-base font-bold text-gray-900 dark:text-white">{t('reportSuccess')}</h4>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {t('reportDesc')}
                </p>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">{t('reportReason')}</label>
                  <select 
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-800 dark:text-gray-200 outline-none focus:border-red-500"
                  >
                    <option value="Fraudulent / Fake Seller">{isUrdu ? 'دھوکہ دہی / جعلی بیچنے والا' : 'Fraudulent / Fake Seller'}</option>
                    <option value="Incorrect Price or Information">{isUrdu ? 'غلط قیمت یا غلط معلومات' : 'Incorrect Price or Information'}</option>
                    <option value="Spam or Duplicate Ad">{isUrdu ? 'اسپیم یا ڈپلیکیٹ اشتہار' : 'Spam or Duplicate Ad'}</option>
                    <option value="Prohibited or Illegal Item">{isUrdu ? 'ممنوعہ یا غیر قانونی سامان' : 'Prohibited or Illegal Item'}</option>
                    <option value="Inappropriate Content or Image">{isUrdu ? 'نامناسب مواد یا تصاویر' : 'Inappropriate Content or Image'}</option>
                    <option value="Item Already Sold">{isUrdu ? 'پہلے سے فروخت ہو چکا ہے' : 'Item Already Sold'}</option>
                    <option value="Other">{isUrdu ? 'کوئی اور وجہ' : 'Other'}</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">{t('reportDetails')}</label>
                  <textarea 
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    rows={3}
                    placeholder={isUrdu ? 'مزید تفصیلات لکھیں...' : 'Explain the issue in detail...'}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-800 dark:text-gray-200 outline-none focus:border-red-500"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setIsReportModalOpen(false)}
                    className="flex-1 py-3 text-xs font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmittingReport}
                    className="flex-1 py-3 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-600/30 disabled:opacity-50 transition-all"
                  >
                    {isSubmittingReport ? 'Submitting...' : t('reportSubmit')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 🖼️ FULLSCREEN LIGHTBOX VIEWER */}
      {isFullscreen && (
          <div className="fixed inset-0 z-[1000] bg-black flex flex-col animate-fade-in">
              <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-[1010] bg-gradient-to-b from-black/80 to-transparent">
                  <div className="text-white text-sm font-black tracking-widest uppercase">
                      {activeIndex + 1} / {images.length}
                  </div>
                  <button onClick={closeFullscreen} className="p-2 bg-white/10 backdrop-blur-xl rounded-full text-white active:scale-90 transition-transform">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
              </div>

              <div 
                ref={fullscreenScrollRef}
                onScroll={(e) => handleScroll(e, true)}
                className="flex-1 flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
              >
                  {images.map((img, idx) => (
                      <div key={`fs-${idx}`} className="min-w-full h-full snap-center flex items-center justify-center p-2">
                          <img src={img} className="max-w-full max-h-full object-contain select-none" alt="" />
                      </div>
                  ))}
              </div>

              <div className="p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-center gap-2 overflow-x-auto no-scrollbar">
                   {images.map((_, idx) => (
                       <button 
                        key={`dot-${idx}`} 
                        onClick={() => scrollToImage(idx, true)}
                        className={`h-1.5 transition-all duration-300 rounded-full ${activeIndex === idx ? 'w-8 bg-primary' : 'w-2 bg-white/30'}`}
                       />
                   ))}
              </div>
          </div>
      )}

      {/* 📸 GALLERY SECTION */}
      <div className="w-screen md:w-full bg-gray-100 dark:bg-gray-900 relative aspect-[1/1] md:aspect-[16/7] overflow-hidden group shadow-lg -mx-4 md:mx-0">
          
          {/* Scroll Container */}
          <div 
            ref={scrollRef}
            onScroll={(e) => handleScroll(e, false)}
            className="flex w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar cursor-zoom-in"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            onClick={() => setIsFullscreen(true)}
          >
              {images.map((img, idx) => (
                  <div key={idx} className="min-w-full h-full snap-center flex items-center justify-center bg-white dark:bg-black">
                      <img 
                        src={img} 
                        alt={`${listing.title} - ${idx + 1}`} 
                        className="w-full h-full object-cover" 
                      />
                  </div>
              ))}
          </div>

          {/* Top Overlays */}
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent z-30 pointer-events-none">
              <button onClick={() => onNavigate('listings')} className="p-2 bg-black/30 backdrop-blur-md rounded-full text-white shadow-xl active:scale-90 transition-transform pointer-events-auto">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="flex gap-2 pointer-events-auto">
                <button 
                  onClick={handleGenericShare} 
                  title="Share"
                  className="p-2.5 bg-black/30 backdrop-blur-md rounded-full shadow-xl active:scale-90 transition-all text-white hover:bg-black/50"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                </button>
                <button onClick={handleToggleFavorite} className={`p-2.5 bg-black/30 backdrop-blur-md rounded-full shadow-xl active:scale-90 transition-all ${isFavorite ? 'text-red-500' : 'text-white'}`}>
                    <svg className="w-6 h-6" fill={isFavorite ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                </button>
              </div>
          </div>

          {/* Counter Badge */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/40 text-white text-[10px] font-black px-3 py-1 rounded-full backdrop-blur-md border border-white/10 z-20 shadow-lg tracking-widest">
                {activeIndex + 1} / {images.length}
            </div>
          )}
      </div>

      {/* Thumbnails Row */}
      {images.length > 1 && (
          <div className="bg-white dark:bg-dark-surface p-3 flex gap-2.5 overflow-x-auto no-scrollbar border-b border-gray-100 dark:border-gray-800 -mx-4 md:mx-0 w-screen md:w-full px-4">
              {images.map((img, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => scrollToImage(idx, false)}
                    className={`relative min-w-[70px] h-[70px] rounded-xl overflow-hidden border-2 transition-all duration-300 ${activeIndex === idx ? 'border-primary ring-2 ring-primary/20 scale-105 shadow-md' : 'border-transparent opacity-40'}`}
                  >
                      <img src={img} className="w-full h-full object-cover" alt="" />
                  </button>
              ))}
          </div>
      )}

      {/* 💎 PRIMARY INFO & PRICE */}
      <SectionWrapper className="!pb-2">
          <div className="space-y-4">
              <div className="flex justify-between items-start gap-4">
                  <div>
                      <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-tight mb-2 tracking-tight">{listing.title}</h1>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold">
                        <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        <span className="truncate">{listing.location}</span>
                      </div>
                  </div>
                  <button 
                    onClick={() => setIsReportModalOpen(true)}
                    className="text-gray-400 hover:text-red-500 flex items-center gap-1 text-[11px] font-bold p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title={t('reportAd')}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
                    <span className="hidden sm:inline">{t('reportAd')}</span>
                  </button>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{t('askingPrice')}</p>
                      <div className="flex items-baseline gap-2 flex-wrap">
                          <div className="inline-flex items-baseline gap-1">
                              <span className="text-base sm:text-lg font-bold text-gray-500 dark:text-gray-400">Rs.</span>
                              <span className="text-2xl sm:text-3xl font-black text-primary dark:text-white tracking-tight">
                                  {listing.price.toLocaleString()}
                              </span>
                          </div>
                          {listing.originalPrice && (
                              <span className="text-xs sm:text-sm text-gray-400 line-through font-semibold decoration-red-500/40 ml-1">
                                  Rs. {listing.originalPrice.toLocaleString()}
                              </span>
                          )}
                      </div>
                  </div>
                  {discountPercent > 0 && (
                      <div className="bg-red-500 text-white px-3 py-1.5 rounded-xl shadow-lg shadow-red-500/20 text-center flex flex-col items-center flex-shrink-0">
                          <span className="text-[8px] font-black uppercase leading-none opacity-80">{t('savePercent')}</span>
                          <span className="text-lg font-black leading-none">{discountPercent}%</span>
                      </div>
                  )}
              </div>
          </div>

          <div className="flex items-center justify-between pt-5 mt-4 border-t border-gray-50 dark:border-gray-800">
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 px-3 py-1.5 rounded-full border dark:border-gray-700">
                  <div className="flex text-accent-yellow text-xs gap-0.5">
                      {[...Array(5)].map((_, i) => (
                          <span key={i}>{i < Math.floor(listing.rating) ? '★' : '☆'}</span>
                      ))}
                  </div>
                  <span className="text-[11px] font-black text-gray-500 dark:text-gray-400">{listing.rating} ({reviews.length})</span>
              </div>
              <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{listing.createdAt ? new Date(listing.createdAt).toLocaleDateString() : 'New Entry'}</span>
          </div>
      </SectionWrapper>

      {/* 🚀 CALL TO ACTION & WHATSAPP SHARE SECTION */}
      <SectionWrapper className="!bg-primary/5 dark:!bg-primary/10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <button 
                onClick={() => { 
                    if (!user) { alert(isUrdu ? "چیٹ کرنے کے لیے لاگ ان کریں" : "Please login to chat."); return; } 
                    trackConversation('chat');
                    onNavigate('chats', { targetUser: { id: listing.vendorId, name: vendorData?.shopName || listing.vendorName } }); 
                }} 
                className="flex items-center justify-center gap-3 h-14 bg-white dark:bg-dark-surface text-primary dark:text-white font-black rounded-2xl active:scale-95 transition-all border-2 border-primary shadow-sm"
              >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                  <span className="text-xs uppercase tracking-widest">{t('chatNow')}</span>
              </button>

              <a 
                onClick={() => trackConversation('whatsapp')}
                href={`https://wa.me/${(vendorData?.phone || listing.contact.whatsapp).replace(/[^0-9]/g, '')}`} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-center gap-3 h-14 bg-green-600 hover:bg-green-700 text-white font-black rounded-2xl active:scale-95 transition-all shadow-lg shadow-green-600/30"
              >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.407 3.481 2.239 2.24 3.477 5.23 3.475 8.411-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.394 1.664zm6.222-3.528c1.552.92 3.51 1.405 5.621 1.406 5.543 0 10.054-4.51 10.057-10.055.002-2.686-1.047-5.212-2.952-7.118-1.904-1.905-4.432-2.952-7.118-2.952-5.544 0-10.054 4.51-10.057 10.055-.001 2.112.553 4.17 1.602 5.962l-.999 3.649 3.846-.947zm11.387-5.477c-.31-.156-1.834-.905-2.113-1.006-.279-.101-.482-.151-.684.151-.202.302-.782 1.006-.958 1.207-.176.202-.352.227-.662.071-.31-.156-1.311-.484-2.498-1.543-.923-.824-1.547-1.841-1.728-2.143-.181-.303-.019-.466.136-.621.14-.14.31-.362.466-.543.156-.181.208-.31.31-.517.103-.207.052-.387-.026-.543-.078-.156-.684-1.649-.938-2.261-.247-.597-.499-.516-.684-.525-.176-.008-.378-.009-.58-.009s-.53.076-.807.378c-.278.302-1.061 1.037-1.061 2.531s1.087 2.946 1.239 3.148c.152.202 2.139 3.267 5.182 4.581.724.312 1.288.499 1.728.639.728.231 1.389.198 1.912.12.583-.087 1.834-.751 2.09-1.477.256-.725.256-1.348.179-1.477-.076-.128-.278-.204-.588-.36z"/></svg>
                  <span className="text-xs uppercase tracking-widest">{t('whatsapp')}</span>
              </a>

              <a 
                onClick={() => {
                    const listingRef = doc(db, 'listings', listing.id);
                    updateDoc(listingRef, { calls: increment(1) }).catch(()=>{});
                }}
                href={`tel:${vendorData?.phone || listing.contact.phone}`} 
                className="flex items-center justify-center gap-3 h-14 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl active:scale-95 transition-all shadow-lg shadow-primary/30"
              >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  <span className="text-xs uppercase tracking-widest">{t('callSeller')}</span>
              </a>
          </div>

          {/* 📱 Quick One-Click WhatsApp Share Bar */}
          <button
            onClick={handleWhatsAppShare}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] dark:text-[#25D366] font-black text-xs uppercase tracking-wider rounded-2xl border border-[#25D366]/30 transition-all active:scale-[0.99]"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.407 3.481 2.239 2.24 3.477 5.23 3.475 8.411-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.394 1.664zm6.222-3.528c1.552.92 3.51 1.405 5.621 1.406 5.543 0 10.054-4.51 10.057-10.055.002-2.686-1.047-5.212-2.952-7.118-1.904-1.905-4.432-2.952-7.118-2.952-5.544 0-10.054 4.51-10.057 10.055-.001 2.112.553 4.17 1.602 5.962l-.999 3.649 3.846-.947zm11.387-5.477c-.31-.156-1.834-.905-2.113-1.006-.279-.101-.482-.151-.684.151-.202.302-.782 1.006-.958 1.207-.176.202-.352.227-.662.071-.31-.156-1.311-.484-2.498-1.543-.923-.824-1.547-1.841-1.728-2.143-.181-.303-.019-.466.136-.621.14-.14.31-.362.466-.543.156-.181.208-.31.31-.517.103-.207.052-.387-.026-.543-.078-.156-.684-1.649-.938-2.261-.247-.597-.499-.516-.684-.525-.176-.008-.378-.009-.58-.009s-.53.076-.807.378c-.278.302-1.061 1.037-1.061 2.531s1.087 2.946 1.239 3.148c.152.202 2.139 3.267 5.182 4.581.724.312 1.288.499 1.728.639.728.231 1.389.198 1.912.12.583-.087 1.834-.751 2.09-1.477.256-.725.256-1.348.179-1.477-.076-.128-.278-.204-.588-.36z"/></svg>
            <span>{t('shareOnWhatsApp')}</span>
          </button>
      </SectionWrapper>

      <SectionWrapper title={t('aboutThisItem')}>
          <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line font-medium opacity-90">{listing.description}</p>
      </SectionWrapper>

      <SectionWrapper title={t('soldBy')}>
          <div className="flex items-center gap-4 cursor-pointer p-4 rounded-3xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:border-primary/40 transition-all active:scale-[0.98]" onClick={() => onNavigate('vendor-profile', { targetVendorId: listing.vendorId })}>
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20 bg-primary/5 flex items-center justify-center shadow-inner">
                  {vendorData?.profilePictureUrl ? (
                      <img src={vendorData.profilePictureUrl} className="w-full h-full object-cover" alt="" />
                  ) : (
                      <span className="text-2xl font-black text-primary">{(vendorData?.shopName || listing.vendorName).charAt(0)}</span>
                  )}
              </div>
              <div className="flex-grow min-w-0">
                  <h4 className="text-lg font-black text-gray-900 dark:text-white truncate">{vendorData?.shopName || listing.vendorName}</h4>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-tight">{t('verifiedMerchant')} • Joined {vendorData?.memberSince || '2026'}</p>
                  <div className="text-[10px] text-primary font-black uppercase mt-1.5 flex items-center gap-1 group">
                      {t('visitStorefront')}
                      <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                  </div>
              </div>
          </div>
      </SectionWrapper>

      {/* 🌟 RATINGS & REVIEWS SECTION */}
      <SectionWrapper title={t('customerFeedback')}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 px-1">
              <div className="flex items-center gap-4">
                  <div className="text-center">
                    <span className="text-4xl font-black text-gray-900 dark:text-white">{listing.rating}</span>
                    <div className="flex text-accent-yellow text-sm gap-0.5 justify-center mt-1">
                      {[...Array(5)].map((_, i) => <span key={i}>{i < Math.floor(listing.rating) ? '★' : '☆'}</span>)}
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">{reviews.length} {t('reviews')}</p>
                  </div>

                  {/* Progress breakdown */}
                  <div className="flex-1 min-w-[160px] space-y-1 border-l border-gray-100 dark:border-gray-800 pl-4">
                    {ratingBreakdown.map((item) => (
                      <div key={item.stars} className="flex items-center gap-2 text-[10px] text-gray-500 font-bold">
                        <span className="w-3">{item.stars}★</span>
                        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-accent-yellow rounded-full transition-all duration-500" 
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <span className="w-6 text-right text-gray-400">{item.count}</span>
                      </div>
                    ))}
                  </div>
              </div>

              {user && user.id !== listing.vendorId && !isReviewFormOpen && (
                  <button 
                    onClick={() => setIsReviewFormOpen(true)} 
                    className="text-xs font-black text-white bg-primary hover:bg-primary/90 px-5 py-2.5 rounded-2xl shadow-md active:scale-95 transition-all self-start sm:self-auto"
                  >
                    ★ {t('writeReview')}
                  </button>
              )}
          </div>

          {isReviewFormOpen && (
              <div className="mb-10 p-6 bg-white dark:bg-gray-800 rounded-3xl animate-pop-in border-2 border-primary/20 shadow-2xl space-y-4">
                  <h4 className="font-black text-lg dark:text-white text-center">{t('howWasExperience')}</h4>
                  
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex justify-center gap-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button 
                              key={star} 
                              type="button"
                              onClick={() => setNewRating(star)} 
                              className={`text-4xl transition-all transform hover:scale-125 active:scale-95 ${newRating >= star ? 'text-accent-yellow scale-110 drop-shadow-sm' : 'text-gray-200 dark:text-gray-700'}`}
                            >
                                ★
                            </button>
                        ))}
                    </div>
                    <span className="text-xs font-bold text-primary dark:text-teal-400">
                      {ratingLabels[newRating]}
                    </span>
                  </div>

                  <textarea 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={t('reviewPlaceholder')}
                    className="w-full p-4 text-sm border-2 border-gray-100 rounded-2xl dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:border-primary transition-all placeholder:text-gray-400"
                    rows={4}
                  />

                  <div className="flex gap-3 pt-2">
                      <button 
                        onClick={handleReviewSubmit}
                        disabled={isSubmittingReview || newRating === 0 || !newComment.trim()}
                        className="flex-[2] py-4 bg-primary text-white font-black rounded-2xl shadow-xl disabled:opacity-50 transition-all active:scale-95"
                      >
                          {isSubmittingReview ? 'SENDING...' : t('postReview')}
                      </button>
                      <button onClick={() => setIsReviewFormOpen(false)} className="flex-1 py-4 text-gray-500 font-bold bg-gray-50 dark:bg-gray-700 rounded-2xl active:scale-95 transition-all">CANCEL</button>
                  </div>
              </div>
          )}

          <div className="space-y-6">
              {reviews.length > 0 ? (
                  <div className="space-y-4">
                      {reviews.map((review, idx) => (
                          <div key={idx} className="flex gap-4 p-5 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-700">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center font-black text-primary text-sm shadow-inner">
                                  {review.author.charAt(0)}
                              </div>
                              <div className="flex-grow min-w-0">
                                  <div className="flex justify-between items-start mb-1">
                                      <span className="font-black text-gray-900 dark:text-white text-sm truncate">{review.author}</span>
                                      <span className="text-[9px] text-gray-400 font-bold uppercase">{review.date}</span>
                                  </div>
                                  <div className="flex text-accent-yellow text-[10px] mb-2 gap-0.5">
                                      {[...Array(5)].map((_, i) => <span key={i}>{i < review.rating ? '★' : '☆'}</span>)}
                                  </div>
                                  <p className="text-gray-700 dark:text-gray-400 text-sm leading-relaxed italic font-medium">"{review.comment}"</p>
                              </div>
                          </div>
                      ))}
                  </div>
              ) : (
                  <div className="text-center py-16 bg-gray-50/50 dark:bg-gray-900/40 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                      <div className="text-4xl mb-3 opacity-30">✨</div>
                      <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest">{t('noReviewsYet')}</p>
                  </div>
              )}
          </div>
      </SectionWrapper>

      {/* 🧩 RECOMMENDED LISTINGS SECTION */}
      {relatedListings.length > 0 && (
          <SectionWrapper title={t('youMightAlsoLike')} noBorder>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {relatedListings.map(l => (
                      <ListingCard key={l.id} listing={l} onViewDetails={(item) => onNavigate('details', { listing: item })} />
                  ))}
              </div>
          </SectionWrapper>
      )}
    </div>
  );
};

export default ListingDetailsPage;
