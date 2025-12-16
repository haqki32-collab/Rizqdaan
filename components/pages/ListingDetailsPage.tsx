
import React, { useState, useEffect } from 'react';
import { Listing, User, Review } from '../../types';
import { db } from '../../firebaseConfig';
import { doc, updateDoc, arrayUnion, arrayRemove, increment, getDoc, getDocs, query, collection, where } from 'firebase/firestore';

interface ListingDetailsPageProps {
  listing: Listing;
  user: User | null;
  onNavigate: (view: 'listings' | 'chats' | 'vendor-profile', payload?: { targetUser?: { id: string, name: string }, targetVendorId?: string }) => void;
}

const ListingDetailsPage: React.FC<ListingDetailsPageProps> = ({ listing, user, onNavigate }) => {
    // Sync local state with props to ensure updates from parent (App.tsx) are reflected
    const [reviews, setReviews] = useState<Review[]>(listing.reviews || []);
    
    const [newRating, setNewRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [newComment, setNewComment] = useState('');
    const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
    const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest'>('newest');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    
    // Vendor Data State
    const [vendorData, setVendorData] = useState<User | null>(null);
    const [vendorStats, setVendorStats] = useState({ rating: 0, reviewCount: 0 });

    // Local state for Helpful/Not Helpful interaction (Client-side only for now)
    const [helpfulState, setHelpfulState] = useState<Record<string, 'helpful' | 'not-helpful'>>({});

    // Image Gallery State
    const images = listing.images && listing.images.length > 0 ? listing.images : [listing.imageUrl];
    const [activeImage, setActiveImage] = useState(images[0]);

    // Favorites State
    const [isFavorite, setIsFavorite] = useState(false);
    
    // Sync reviews when listing prop updates
    useEffect(() => {
        setReviews(listing.reviews || []);
    }, [listing.reviews]);

    useEffect(() => {
        if (user && user.favorites) {
            setIsFavorite(user.favorites.includes(listing.id));
        }
    }, [user, listing.id]);

    // 1. Increment View Count on Load
    useEffect(() => {
        if (db) {
            const listingRef = doc(db, 'listings', listing.id);
            updateDoc(listingRef, { views: increment(1) }).catch(e => {
                if (e.code === 'permission-denied') {
                     // Silently fail in demo mode
                } else {
                    console.warn("View inc failed:", e.message);
                }
            });
        }
    }, [listing.id]);

    // 2. Fetch Real Vendor Data (Shop Name & Ratings)
    useEffect(() => {
        const fetchVendorInfo = async () => {
            if (!db || !listing.vendorId) return;

            try {
                // Get User Doc
                const userSnap = await getDoc(doc(db, "users", listing.vendorId));
                if (userSnap.exists()) {
                    setVendorData(userSnap.data() as User);
                }

                // Get All Listings for Vendor to calc average
                const q = query(collection(db, "listings"), where("vendorId", "==", listing.vendorId));
                const querySnapshot = await getDocs(q);
                
                let totalRating = 0;
                let count = 0;
                querySnapshot.forEach((doc) => {
                    const l = doc.data();
                    if (l.rating > 0) {
                        totalRating += l.rating;
                        count++;
                    }
                });
                
                setVendorStats({
                    rating: count > 0 ? totalRating / count : 0,
                    reviewCount: count // Approximate review/listing count
                });

            } catch (e) {
                console.error("Error fetching vendor details", e);
            }
        };

        fetchVendorInfo();
    }, [listing.vendorId]);

    const handleToggleFavorite = async () => {
        if (!user) {
            alert("Please login to save favorites.");
            return;
        }
        
        // Optimistic UI Update
        const wasFavorite = isFavorite;
        setIsFavorite(!wasFavorite);

        if (!db) return;

        const userRef = doc(db, 'users', user.id);
        const listingRef = doc(db, 'listings', listing.id);

        try {
            if (wasFavorite) {
                await updateDoc(userRef, { favorites: arrayRemove(listing.id) });
                await updateDoc(listingRef, { likes: increment(-1) });
            } else {
                await updateDoc(userRef, { favorites: arrayUnion(listing.id) });
                await updateDoc(listingRef, { likes: increment(1) });
            }
        } catch (e: any) {
            console.error("DB Update failed:", e.message || String(e));
            // Revert state if failed
            setIsFavorite(wasFavorite);
            alert("Failed to update favorite. " + e.message);
        }
    };

    const handleCallClick = () => {
        if (db) {
            const listingRef = doc(db, 'listings', listing.id);
            updateDoc(listingRef, { calls: increment(1) }).catch(e => {
                 // Ignore permission errors for analytics tracking
            });
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: listing.title,
            text: `Check out ${listing.title} on RizqDaan!`,
            url: window.location.href
        };

        try {
            if (navigator.share && (window.location.protocol === 'http:' || window.location.protocol === 'https:')) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                alert("Link copied to clipboard!");
            }
        } catch (err: any) {
            console.error("Share failed:", err.message || "Unknown error");
            try {
                 await navigator.clipboard.writeText(window.location.href);
                 alert("Link copied to clipboard!");
            } catch (clipboardErr) {
                // Ignore
            }
        }
    };

    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newRating === 0 || !newComment.trim() || !user) return;
        
        setIsSubmittingReview(true);

        const newReview: Review = {
            id: `r-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            author: user.name,
            rating: newRating,
            comment: newComment.trim(),
            date: new Date().toISOString().split('T')[0]
        };
        
        // Optimistic update (Show immediately)
        const updatedReviews = [newReview, ...reviews];
        setReviews(updatedReviews);
        
        // Reset Form
        setNewRating(0);
        setNewComment('');
        setIsReviewFormOpen(false);

        // Save to Firestore
        if(db) {
            try {
                const listingRef = doc(db, 'listings', listing.id);
                await updateDoc(listingRef, {
                    reviews: arrayUnion(newReview)
                });
            } catch(e: any) {
                console.error("Error saving review:", e.message || "Unknown error");
                alert("Failed to submit review. " + e.message);
                // Revert optimistic update
                setReviews(reviews);
            }
        }
        setIsSubmittingReview(false);
    };

    const handleHelpfulAction = (reviewId: string, action: 'helpful' | 'not-helpful') => {
        setHelpfulState(prev => ({
            ...prev,
            [reviewId]: prev[reviewId] === action ? undefined : action // Toggle off if clicked again
        }));
    };

    const discountPercent = listing.originalPrice 
        ? Math.round(((listing.originalPrice - listing.price) / listing.originalPrice) * 100)
        : 0;

    // --- Review Stats Calculation ---
    const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
        const star = Math.round(r.rating) as keyof typeof starCounts;
        if (star >= 1 && star <= 5) starCounts[star]++;
    });
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews : 0;

    const sortedReviews = [...reviews].sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.date).getTime() - new Date(a.date).getTime();
        if (sortBy === 'highest') return b.rating - a.rating;
        if (sortBy === 'lowest') return a.rating - b.rating;
        return 0;
    });

  return (
    <div className="bg-gray-100 dark:bg-black min-h-screen pb-24 md:pb-10">
      
      {/* Breadcrumbs */}
      <div className="container mx-auto px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="cursor-pointer hover:text-primary" onClick={() => onNavigate('listings')}>Home</span>
          <span className="mx-2">/</span>
          <span className="cursor-pointer hover:text-primary">{listing.category}</span>
          <span className="mx-2">/</span>
          <span className="text-gray-800 dark:text-gray-200 font-medium truncate">{listing.title}</span>
      </div>

      <div className="container mx-auto px-0 md:px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-2 md:gap-4 lg:gap-6">
            
            {/* LEFT COLUMN: IMAGES */}
            <div className="lg:col-span-4">
                <div className="bg-white dark:bg-dark-surface rounded-none md:rounded-lg p-0 md:p-2 shadow-sm">
                    <div className="relative w-full aspect-square md:rounded overflow-hidden mb-0 md:mb-2 bg-gray-50 border-b md:border border-gray-100 dark:border-gray-700">
                        <img src={activeImage} alt={listing.title} className="w-full h-full object-contain" />
                        {discountPercent > 0 && (
                            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                -{discountPercent}%
                            </span>
                        )}
                    </div>
                    {/* Thumbnails */}
                    {images.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto scrollbar-hide p-2 md:p-0">
                            {images.map((img, index) => (
                                <button 
                                    key={index} 
                                    onMouseEnter={() => setActiveImage(img)}
                                    onClick={() => setActiveImage(img)} 
                                    className={`relative w-16 h-16 flex-shrink-0 rounded border-2 transition-all overflow-hidden ${activeImage === img ? 'border-primary' : 'border-transparent hover:border-gray-300'}`}
                                >
                                    <img src={img} alt={`View ${index + 1}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* MIDDLE COLUMN: INFO */}
            <div className="lg:col-span-5 flex flex-col gap-2 md:gap-4">
                <div className="bg-white dark:bg-dark-surface rounded-none md:rounded-lg p-4 md:p-6 shadow-sm border-y md:border border-gray-100 dark:border-gray-700">
                    <h1 className="text-xl md:text-2xl font-medium text-gray-900 dark:text-white leading-snug mb-2">{listing.title}</h1>
                    
                    {/* Ratings & Shares */}
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2 text-sm">
                            <div className="flex text-yellow-400">
                                {[...Array(5)].map((_, i) => (
                                    <span key={i}>{i < Math.round(listing.rating) ? '★' : '☆'}</span>
                                ))}
                            </div>
                            <a href="#reviews" className="text-blue-500 hover:underline cursor-pointer">{reviews.length} Ratings</a>
                            <span className="text-gray-300">|</span>
                            <span className="text-gray-500">{listing.views || 0} Views</span>
                        </div>
                        <div className="flex gap-3 text-gray-400">
                            <button onClick={handleShare} className="hover:text-primary transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                            </button>
                            <button onClick={handleToggleFavorite} className={`hover:text-red-500 transition-colors ${isFavorite ? 'text-red-500' : ''}`}>
                                <svg className="w-5 h-5" fill={isFavorite ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                            </button>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-700 my-4"></div>

                    {/* Price Section */}
                    <div className="mb-6">
                        <div className="flex items-baseline gap-3">
                            <span className="text-3xl font-bold text-primary dark:text-white">Rs. {(listing.price || 0).toLocaleString()}</span>
                            {discountPercent > 0 && (
                                <>
                                    <span className="text-gray-400 line-through text-sm">Rs. {(listing.originalPrice || 0).toLocaleString()}</span>
                                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold">-{discountPercent}%</span>
                                </>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Best price guaranteed.</p>
                    </div>

                </div>
                
                {/* Description Box */}
                <div className="bg-white dark:bg-dark-surface rounded-none md:rounded-lg p-4 shadow-sm border-y md:border border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-2 text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded">Product Details</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line p-2">
                        {listing.description}
                    </p>
                </div>
            </div>

            {/* RIGHT COLUMN: SIDEBAR */}
            <div className="lg:col-span-3 space-y-2 md:space-y-4">
                
                {/* Seller Location & Contact Card */}
                <div className="bg-white dark:bg-dark-surface rounded-none md:rounded-lg p-4 shadow-sm text-sm border-y md:border border-gray-100 dark:border-gray-700">
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-wider">Seller Location & Contact</h4>
                    
                    {/* Location */}
                    <div className="flex items-start gap-3 mb-4 group">
                        <div className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                        <div>
                            <span className="block text-xs text-gray-400 font-semibold uppercase">Address</span>
                            <span className="font-medium text-gray-800 dark:text-white block leading-tight mb-1">{listing.location}</span>
                            <span className="text-xs text-blue-500 cursor-pointer hover:underline" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(listing.location)}`, '_blank')}>View on Map</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 mt-4">
                        {/* New Message Button */}
                        <button
                            onClick={() => {
                                if (!user) {
                                    alert("Please login to send messages.");
                                    return;
                                }
                                onNavigate('chats', { targetUser: { id: listing.vendorId, name: vendorData?.shopName || listing.vendorName } });
                            }}
                            className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors shadow-sm"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            Message Now
                        </button>

                        <a 
                            href={`https://wa.me/${listing.contact.whatsapp}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors shadow-sm"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                            Contact on WhatsApp
                        </a>
                        <a 
                            href={`tel:${listing.contact.phone}`} 
                            onClick={handleCallClick}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-transform active:scale-95"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                            <span className="font-bold text-sm">Call Now</span>
                        </a>
                    </div>
                </div>

                {/* Seller Info */}
                <div className="bg-white dark:bg-dark-surface rounded-none md:rounded-lg p-4 shadow-sm text-sm border-y md:border border-gray-100 dark:border-gray-700">
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Vendor Profile</h4>
                    <div className="flex items-center gap-3 mb-4 cursor-pointer" onClick={() => onNavigate('vendor-profile', { targetVendorId: listing.vendorId })}>
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden border border-primary/20">
                            {vendorData?.profilePictureUrl ? (
                                <img src={vendorData.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-primary font-bold text-xl">{(vendorData?.shopName || listing.vendorName).charAt(0).toUpperCase()}</span>
                            )}
                        </div>
                        <div>
                            <h5 className="font-bold text-gray-900 dark:text-white hover:text-primary transition-colors text-base">
                                {vendorData?.shopName || listing.vendorName}
                            </h5>
                            {/* Real Rating Display */}
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                                <div className="flex items-center text-yellow-500 font-bold bg-yellow-50 px-1.5 py-0.5 rounded">
                                    <span>{vendorStats.rating.toFixed(1)}</span>
                                    <svg className="w-3 h-3 ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.367-2.446a1 1 0 00-1.175 0l-3.367 2.446c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z"/></svg>
                                </div>
                                <span>({vendorStats.reviewCount} Ads)</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* BUTTONS ROW: VISIT + MESSAGE */}
                    <div className="grid grid-cols-2 gap-2">
                        <button 
                            onClick={() => onNavigate('vendor-profile', { targetVendorId: listing.vendorId })}
                            className="w-full py-2.5 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-bold uppercase transition-colors"
                        >
                            Visit Store
                        </button>
                        <button
                            onClick={() => {
                                if (!user) {
                                    alert("Please login to message.");
                                    return;
                                }
                                onNavigate('chats', { targetUser: { id: listing.vendorId, name: vendorData?.shopName || listing.vendorName } });
                            }}
                            className="w-full py-2.5 bg-primary text-white rounded hover:bg-primary-dark text-xs font-bold uppercase transition-colors flex items-center justify-center gap-1"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                            Message
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* ... (Rest of the component code: Ratings & Reviews, Sticky Bottom Actions) ... */}
        
        {/* --- PROFESSIONAL RATINGS & REVIEWS SECTION --- */}
        <div id="reviews" className="mt-4 md:mt-8 bg-white dark:bg-dark-surface rounded-none md:rounded-lg shadow-sm border-y md:border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* ... (Existing Ratings Code) ... */}
            <div className="p-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Ratings & Reviews</h2>
                
                <div className="flex flex-col md:flex-row gap-8 mb-8">
                    {/* Summary Dashboard */}
                    <div className="md:w-1/3 flex flex-col justify-center border-r border-gray-100 dark:border-gray-700 pr-0 md:pr-8">
                        <div className="flex items-end gap-3 mb-2">
                            <span className="text-5xl font-extrabold text-gray-900 dark:text-white">{averageRating.toFixed(1)}</span>
                            <div className="flex flex-col mb-1.5">
                                <div className="flex text-yellow-400 text-lg">
                                    {[...Array(5)].map((_, i) => <span key={i}>{i < Math.round(averageRating) ? '★' : '☆'}</span>)}
                                </div>
                                <span className="text-sm text-gray-500">{totalReviews} Reviews</span>
                            </div>
                        </div>
                        
                        {/* Star Distribution Bars */}
                        <div className="space-y-1.5 mt-2">
                            {[5, 4, 3, 2, 1].map(star => {
                                const count = starCounts[star as keyof typeof starCounts];
                                const percent = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                                return (
                                    <div key={star} className="flex items-center gap-3 text-xs">
                                        <span className="w-8 text-gray-500 text-right">{star} Star</span>
                                        <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${percent}%` }}></div>
                                        </div>
                                        <span className="w-8 text-gray-400">{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Controls & Form Trigger */}
                    <div className="md:w-2/3">
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                                {['newest', 'highest', 'lowest'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setSortBy(type as any)}
                                        className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all capitalize ${
                                            sortBy === type 
                                            ? 'bg-white dark:bg-dark-surface shadow-sm text-gray-900 dark:text-white' 
                                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                                        }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                            
                            {user ? (
                                <button 
                                    onClick={() => setIsReviewFormOpen(!isReviewFormOpen)}
                                    className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-lg shadow hover:bg-primary-dark transition-all"
                                >
                                    {isReviewFormOpen ? 'Close Form' : 'Write a Review'}
                                </button>
                            ) : (
                                <span className="text-xs text-gray-500">Login to review</span>
                            )}
                        </div>

                        {/* Review Form */}
                        {isReviewFormOpen && user && (
                            <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 animate-fade-in">
                                <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-4">Share your experience</h3>
                                <form onSubmit={handleReviewSubmit}>
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="text-sm text-gray-600 dark:text-gray-300">Your Rating:</span>
                                        <div className="flex">
                                            {[...Array(5)].map((_, index) => (
                                                <button type="button" key={index} onClick={() => setNewRating(index + 1)} onMouseEnter={() => setHoverRating(index + 1)} onMouseLeave={() => setHoverRating(0)} className="focus:outline-none p-1">
                                                    <svg className={`w-6 h-6 transition-colors ${index + 1 <= (hoverRating || newRating) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.367-2.446a1 1 0 00-1.175 0l-3.367 2.446c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" /></svg>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <textarea 
                                        value={newComment} 
                                        onChange={(e) => setNewComment(e.target.value)} 
                                        className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary min-h-[100px]" 
                                        placeholder="What did you like or dislike?" 
                                    />
                                    <div className="flex justify-end mt-3">
                                        <button 
                                            type="submit" 
                                            disabled={newRating === 0 || !newComment.trim() || isSubmittingReview} 
                                            className="px-6 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {isSubmittingReview ? 'Posting...' : 'Post Review'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Review List */}
                        <div className="space-y-6">
                            {sortedReviews.length > 0 ? (
                                sortedReviews.map(review => {
                                    const isHelpful = helpfulState[review.id] === 'helpful';
                                    const isNotHelpful = helpfulState[review.id] === 'not-helpful';
                                    
                                    return (
                                        <div key={review.id} className="border-b border-gray-100 dark:border-gray-700 pb-6 last:border-0">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-xs text-gray-600 dark:text-gray-300">
                                                        {review.author.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <span className="block text-sm font-bold text-gray-900 dark:text-white">{review.author}</span>
                                                    </div>
                                                </div>
                                                <span className="text-xs text-gray-400">{review.date}</span>
                                            </div>
                                            
                                            <div className="flex text-yellow-400 text-xs mb-2">
                                                {[...Array(5)].map((_, i) => <span key={i}>{i < review.rating ? '★' : '☆'}</span>)}
                                            </div>
                                            
                                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{review.comment}</p>
                                            
                                            {/* Interactive Helpful Buttons */}
                                            <div className="flex items-center gap-4 mt-3">
                                                <button 
                                                    onClick={() => handleHelpfulAction(review.id, 'helpful')}
                                                    className={`flex items-center gap-1 text-xs transition-colors ${isHelpful ? 'text-primary font-bold' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                                                >
                                                    <svg className="w-4 h-4" fill={isHelpful ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                                                    Helpful {isHelpful && '(1)'}
                                                </button>
                                                <button 
                                                    onClick={() => handleHelpfulAction(review.id, 'not-helpful')}
                                                    className={`flex items-center gap-1 text-xs transition-colors ${isNotHelpful ? 'text-red-500 font-bold' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                                                >
                                                    <svg className="w-4 h-4" fill={isNotHelpful ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.92m-3.76 9.02L17 13m-7 1v9a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13v-9m-7 10h2m5 9h2a2 2 0 002-2v-6a2 2 0 00-2-2h-2.5" /></svg>
                                                    Not Helpful
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-10">
                                    <p className="text-gray-500 text-sm">No reviews yet. Be the first to review!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* STICKY BOTTOM ACTIONS (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-surface border-t border-gray-200 dark:border-gray-700 px-4 py-3 md:hidden z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] pb-[env(safe-area-inset-bottom,20px)]">
          <div className="flex gap-2">
              <button
                onClick={() => {
                    if (!user) {
                        alert("Please login to send messages.");
                        return;
                    }
                    onNavigate('chats', { targetUser: { id: listing.vendorId, name: vendorData?.shopName || listing.vendorName } });
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg shadow-md transition-transform active:scale-95"
              >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                  Message
              </button>
              <a 
                href={`tel:${listing.contact.phone}`} 
                onClick={handleCallClick}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-transform active:scale-95"
              >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                  <span className="font-bold text-sm">Call Now</span>
              </a>
          </div>
      </div>

    </div>
  );
};

export default ListingDetailsPage;
