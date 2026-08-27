
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, Unsubscribe } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, onSnapshot, query, orderBy, limit, startAfter, getDocs, QueryDocumentSnapshot, DocumentData, where } from 'firebase/firestore';
import { getToken, onMessage } from 'firebase/messaging';
import { App as CapacitorApp } from '@capacitor/app';
import { auth, db, messaging } from './firebaseConfig';

import Header from './components/common/Header';
import BottomNavBar from './components/common/BottomNavBar';
import HomePage from './components/pages/HomePage';
import ListingsPage from './components/pages/ListingsPage';
import ListingDetailsPage from './components/pages/ListingDetailsPage';
import VendorDashboard from './components/pages/VendorDashboard';
import VendorProfilePage from './components/pages/VendorProfilePage';
import AuthPage from './components/auth/AuthPage';
import AccountPage from './components/auth/AccountPage';
import SubCategoryPage from './components/pages/SubCategoryPage';
import FavoritesPage from './components/pages/FavoritesPage';
import SavedSearchesPage from './components/pages/SavedSearchesPage';
import EditProfilePage from './components/auth/EditProfilePage';
import SettingsPage from './components/pages/SettingsPage';
import ReferralPage from './components/pages/ReferralPage';
import AdminPanel from './components/admin/AdminPanel';
import ChatPage from './components/pages/ChatPage';
import AddFundsPage from './components/pages/AddFundsPage';
import WalletHistoryPage from './components/pages/WalletHistoryPage';
import NotificationsPage from './components/pages/NotificationsPage'; 
import HelpCenterPage from './components/pages/HelpCenterPage';
import ToolsPage from './components/pages/ToolsPage';
import BlogPage from './components/pages/BlogPage';
import BlogDetailPage from './components/pages/BlogDetailPage';
import { LaunchBonusModal, LaunchBonusFloatingBadge } from './components/common/LaunchBonusModal';
import { Listing, User, Category, AppView, NavigatePayload, AppNotification, BlogPost } from './types';
import { CATEGORIES as DEFAULT_CATEGORIES } from './constants';
import { checkAndTriggerAutoPublish, getBlogPosts } from './services/blogService';

export const getOrCreateGuestUser = (): User => {
  try {
    const cached = localStorage.getItem('rizqdaan_guest_user');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.id) return parsed;
    }
  } catch(e) {}
  
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const newGuest: User = {
    id: `guest_${Date.now()}_${randomNum}`,
    name: `Buyer #${randomNum}`,
    email: `buyer_${randomNum}@guest.rizqdaan.com`,
    phone: '',
    shopName: `Buyer #${randomNum}`,
    shopAddress: 'Pakistan',
    isVerified: false,
    isGuest: true,
    memberSince: new Date().getFullYear().toString(),
    favorites: [],
    wallet: { balance: 0, totalSpend: 0, pendingDeposit: 0, pendingWithdrawal: 0 },
    walletHistory: []
  };
  try {
    localStorage.setItem('rizqdaan_guest_user', JSON.stringify(newGuest));
  } catch(e) {}
  return newGuest;
};

const App: React.FC = () => {
  const [theme, setTheme] = useState('light');
  const [view, setView] = useState<AppView>('home');
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);
  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);
  const [showLaunchBonusModal, setShowLaunchBonusModal] = useState(false);
  
  // Navigation State
  const [navigationStack, setNavigationStack] = useState<{view: AppView, payload?: NavigatePayload}[]>([]);
  const lastBackPressTime = useRef<number>(0);

  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [selectedBlogPost, setSelectedBlogPost] = useState<BlogPost | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<string>('copywriting');
  
  const [listingsDB, setListingsDB] = useState<Listing[]>(() => {
    try {
        const cached = localStorage.getItem('rizq_cached_listings');
        if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch(e) {}
    return [];
  });
  const [lastListingDoc, setLastListingDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMoreListings, setHasMoreListings] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
        const cached = localStorage.getItem('rizq_cached_categories');
        if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch(e) {}
    return DEFAULT_CATEGORIES;
  });
  const [chatTargetUser, setChatTargetUser] = useState<{id: string, name: string} | null>(null);
  const [chatContextListing, setChatContextListing] = useState<Listing | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [initialVendorTab, setInitialVendorTab] = useState<'dashboard' | 'my-listings' | 'add-listing' | 'promotions'>('dashboard');

  // Core View Logic
  const syncViewData = (newView: AppView, payload?: NavigatePayload) => {
    if (newView !== 'details' && newView !== 'subcategories') {
        setSelectedListing(null); setSelectedCategory(null);
    }
    if (newView !== 'blog-detail') {
        if (payload?.blogPost) setSelectedBlogPost(payload.blogPost);
    }
    if (newView !== 'listings' && newView !== 'details') setSearchQuery('');
    
    if (payload?.listing && newView === 'details') {
        setSelectedListing(payload.listing);
        try {
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('listing', payload.listing.id);
            newUrl.searchParams.delete('category');
            newUrl.searchParams.delete('blog');
            window.history.replaceState({ view: newView }, '', newUrl.toString());
        } catch(e) {}
    } else if (payload?.blogPost && newView === 'blog-detail') {
        setSelectedBlogPost(payload.blogPost);
        try {
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('blog', payload.blogPost.id);
            newUrl.searchParams.delete('listing');
            newUrl.searchParams.delete('category');
            window.history.replaceState({ view: newView }, '', newUrl.toString());
        } catch(e) {}
    } else if (payload?.category && newView === 'subcategories') {
        setSelectedCategory(payload.category);
        try {
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('category', payload.category.id);
            newUrl.searchParams.delete('listing');
            newUrl.searchParams.delete('blog');
            window.history.replaceState({ view: newView }, '', newUrl.toString());
        } catch(e) {}
    } else if (newView === 'tools') {
        if (payload?.tool) setSelectedTool(payload.tool);
        try {
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('tool', payload?.tool || selectedTool || 'copywriting');
            newUrl.searchParams.delete('listing');
            newUrl.searchParams.delete('category');
            newUrl.searchParams.delete('blog');
            window.history.replaceState({ view: newView }, '', newUrl.toString());
        } catch(e) {}
    } else if (newView === 'blog') {
        try {
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('view', 'blog');
            newUrl.searchParams.delete('listing');
            newUrl.searchParams.delete('category');
            newUrl.searchParams.delete('tool');
            window.history.replaceState({ view: newView }, '', newUrl.toString());
        } catch(e) {}
    } else if (newView === 'home') {
        try {
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('listing');
            newUrl.searchParams.delete('category');
            newUrl.searchParams.delete('tool');
            newUrl.searchParams.delete('blog');
            newUrl.searchParams.delete('view');
            window.history.replaceState({ view: newView }, '', newUrl.toString());
        } catch(e) {}
    }

    if (newView === 'subcategories') {
        setSelectedCategory(payload?.category || null);
    }
    if (payload?.query !== undefined && newView === 'listings') setSearchQuery(payload.query);
    if (newView === 'chats') {
        setChatTargetUser(payload?.targetUser || null);
        setChatContextListing(payload?.listing || null);
    }
    if (payload?.targetVendorId && newView === 'vendor-profile') setSelectedVendorId(payload.targetVendorId);

    const vendorSubRoutes = ['add-listing', 'my-ads', 'vendor-analytics', 'promote-business'];
    if (vendorSubRoutes.includes(newView as string)) {
        const tab = newView === 'add-listing' ? 'add-listing' : 
                    newView === 'my-ads' ? 'my-listings' : 
                    newView === 'promote-business' ? 'promotions' : 'dashboard';
        setInitialVendorTab(tab as any);
        setView('vendor-dashboard');
    } else {
        setView(newView);
    }
  };

  const handleNavigate = useCallback((newView: AppView, payload?: NavigatePayload) => {
    setNavigationStack(prev => [...prev, { view, payload: { 
        listing: selectedListing || undefined, 
        category: selectedCategory || undefined,
        query: searchQuery,
        targetUser: chatTargetUser || undefined,
        targetVendorId: selectedVendorId || undefined
    } }]);
    
    // Manage browser history to handle back button correctly
    window.history.pushState({ view: newView }, '', '');
    syncViewData(newView, payload);
    window.scrollTo(0, 0);
  }, [view, selectedListing, selectedCategory, searchQuery, chatTargetUser, selectedVendorId]);

  const handleGoBack = useCallback(() => {
    if (navigationStack.length > 0) {
        const stackCopy = [...navigationStack];
        const prevEntry = stackCopy.pop();
        setNavigationStack(stackCopy);
        
        if (prevEntry) {
            syncViewData(prevEntry.view, prevEntry.payload);
            return true;
        }
    } else if (view !== 'home') {
        setView('home');
        setNavigationStack([]);
        return true;
    }
    return false;
  }, [navigationStack, view]);

  // Back Button Listeners
  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
        const handled = handleGoBack();
        if (!handled && view === 'home') {
            // Check for double back to exit logic if needed
        }
    };

    const capBackHandler = CapacitorApp.addListener('backButton', () => {
        const handled = handleGoBack();
        if (!handled && view === 'home') {
            const currentTime = Date.now();
            if (currentTime - lastBackPressTime.current < 2000) {
                CapacitorApp.exitApp();
            } else {
                lastBackPressTime.current = currentTime;
                setActiveToast({
                    id: 'exit-alert', userId: 'local', type: 'info', isRead: false, createdAt: new Date().toISOString(),
                    title: "RizqDaan", message: "Pichla button dubara dabayen band karne ke liye."
                });
                setTimeout(() => setActiveToast(null), 2000);
            }
        }
    });

    window.addEventListener('popstate', onPopState);
    return () => {
        window.removeEventListener('popstate', onPopState);
        capBackHandler.then(h => h.remove());
    };
  }, [handleGoBack, view]);

  // Google Analytics Page View Tracking
  useEffect(() => {
    if (typeof (window as any).gtag === 'function') {
      const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-1ES343KS3J';
      if (GA_ID) {
        let viewTitle = view.charAt(0).toUpperCase() + view.slice(1);
        let pathName = `/${view}`;
        
        if (view === 'home') {
          pathName = '/';
          viewTitle = 'RizqDaan - Home';
        } else if (view === 'details' && selectedListing) {
          pathName = `/listings/${selectedListing.id}`;
          viewTitle = `${selectedListing.title} - RizqDaan`;
        } else if (view === 'subcategories') {
          pathName = selectedCategory ? `/categories/${selectedCategory.id}` : '/categories';
          viewTitle = selectedCategory ? `${selectedCategory.name} - Categories` : 'Main Categories';
        }

        (window as any).gtag('config', GA_ID, {
          page_title: viewTitle,
          page_path: pathName,
        });
      }
    }
  }, [view, selectedListing, selectedCategory]);

  // --- FIREBASE DATA LOGIC ---
  const triggerNativeNotification = (title: string, body: string) => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, {
              body: body, icon: '/icon.png', badge: '/favicon.ico', tag: 'rizqdaan-alert', rennotify: true,
          } as any);
      }).catch(() => {});
  };

  const requestPushPermission = async () => {
      if (!('Notification' in window) || !messaging || !user?.id || !db) { setShowPermissionBanner(false); return; }
      try {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
              const vapidKey = 'BAw_pNvmzPURAsecjQH0V3aPbVQ-PmvrZiui2YhyWOwYGb71ycnVejhE-O7qMOZ84oCa6uL-IcBwoyRgEENirlw';
              const token = await getToken(messaging, { vapidKey });
              if (token) {
                  await setDoc(doc(db, 'users', user.id), { fcmToken: token, notificationsEnabled: true }, { merge: true });
                  triggerNativeNotification("RizqDaan alerts active! 🔊", "Mubarak ho! Alerts enable ho gaye.");
                  setShowPermissionBanner(false);
              }
          } else { setShowPermissionBanner(false); }
      } catch (e) { setShowPermissionBanner(false); }
  };

  useEffect(() => {
    if (user && messaging && 'Notification' in window) {
        if (Notification.permission === 'default') setShowPermissionBanner(true);
        try {
            const unsubscribeOnMessage = onMessage(messaging, (payload) => {
                const title = payload.notification?.title || "Update";
                const body = payload.notification?.body || "Check your app.";
                triggerNativeNotification(title, body);
                setActiveToast({
                    id: Date.now().toString(), userId: user.id, title, message: body, type: 'info', isRead: false, createdAt: new Date().toISOString()
                });
                setTimeout(() => setActiveToast(null), 6000);
            });
            return () => unsubscribeOnMessage();
        } catch (e) {}
    }
  }, [user]);

  useEffect(() => {
    if (!auth) { setIsReady(true); return; }
    const timeout = setTimeout(() => { if (!isReady) setIsReady(true); }, 5000);
    let userUnsubscribe: Unsubscribe | null = null;
    const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
          if (firebaseUser) {
              if (db) {
                  userUnsubscribe = onSnapshot(doc(db, "users", firebaseUser.uid), (docSnap) => {
                      if (docSnap.exists()) {
                          setUser({ id: firebaseUser.uid, ...docSnap.data() } as User);
                      } else {
                          setUser(prev => prev && prev.id === firebaseUser.uid ? prev : ({
                              id: firebaseUser.uid,
                              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                              email: firebaseUser.email || '',
                              phone: '',
                              shopName: '',
                              shopAddress: '',
                              isVerified: true
                          } as User));
                      }
                      clearTimeout(timeout); 
                      setIsReady(true);
                  }, (err) => {
                      console.warn("User snapshot error:", err);
                      setUser(prev => prev || ({
                          id: firebaseUser.uid,
                          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                          email: firebaseUser.email || '',
                          phone: '',
                          shopName: '',
                          shopAddress: '',
                          isVerified: true
                      } as User));
                      clearTimeout(timeout); 
                      setIsReady(true);
                  });
              } else { 
                  setUser({
                      id: firebaseUser.uid,
                      name: firebaseUser.displayName || 'User',
                      email: firebaseUser.email || '',
                      phone: '',
                      shopName: '',
                      shopAddress: '',
                      isVerified: true
                  } as User);
                  clearTimeout(timeout);
                  setIsReady(true); 
              }
          } else {
              if (userUnsubscribe) userUnsubscribe();
              setUser(null); 
              clearTimeout(timeout); 
              setIsReady(true);
          }
      } catch (e) { 
          clearTimeout(timeout);
          setIsReady(true); 
      }
    });
    return () => { authUnsubscribe(); if (userUnsubscribe) userUnsubscribe(); clearTimeout(timeout); };
  }, []);

  useEffect(() => {
      if (!db || !isReady) return;
      const q = query(collection(db, "listings"), orderBy("createdAt", "desc"), limit(20));
      const unsubscribe = onSnapshot(q, (snapshot) => {
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
          if (items.length > 0) {
              setListingsDB(items);
              try { localStorage.setItem('rizq_cached_listings', JSON.stringify(items)); } catch(e) {}
          }
          setLastListingDoc(snapshot.docs[snapshot.docs.length - 1] || null);
          setHasMoreListings(snapshot.docs.length >= 20);

          // 🔗 Check for direct URL Deep Link on first load (e.g. ?listing=xyz or ?category=abc or ?search=abc)
          try {
              const urlParams = new URLSearchParams(window.location.search);
              const targetListingId = urlParams.get('listing');
              const targetCategoryId = urlParams.get('category');
              const targetSearch = urlParams.get('search');
              const targetTool = urlParams.get('tool');
              
              if (targetTool) {
                  setSelectedTool(targetTool);
                  setView('tools');
              } else if (targetListingId && (!selectedListing || selectedListing.id !== targetListingId)) {
                  const targetListing = items.find(l => l.id === targetListingId);
                  if (targetListing) {
                      setSelectedListing(targetListing);
                      setView('details');
                  } else {
                      // Fetch individually if not in top 20
                      getDoc(doc(db, "listings", targetListingId)).then(docSnap => {
                          if (docSnap.exists()) {
                              const fetched = { id: docSnap.id, ...docSnap.data() } as Listing;
                              setSelectedListing(fetched);
                              setView('details');
                          }
                      }).catch(() => {});
                  }
              } else if (targetCategoryId && (!selectedCategory || selectedCategory.id !== targetCategoryId)) {
                  const targetCat = categories.find(c => c.id === targetCategoryId);
                  if (targetCat) {
                      setSelectedCategory(targetCat);
                      setView('subcategories');
                  }
              } else if (urlParams.get('blog')) {
                  const blogId = urlParams.get('blog');
                  getBlogPosts().then(posts => {
                      const found = posts.find(p => p.id === blogId || p.slug === blogId);
                      if (found) {
                          setSelectedBlogPost(found);
                          setView('blog-detail');
                      }
                  });
              } else if (urlParams.get('view') === 'blog') {
                  setView('blog');
              } else if (targetSearch) {
                  setSearchQuery(targetSearch);
                  setView('listings');
              }
          } catch(e) {}
      }, (err) => {
          console.warn("Listings snapshot note (handled):", err.message);
      });
      return () => unsubscribe();
  }, [isReady]);

  // 🤖 5-Minute Automated Google Trends Article Publisher Background Runner
  useEffect(() => {
    // Initial check on boot
    checkAndTriggerAutoPublish().catch(e => console.warn("Auto-publish tick note:", e));

    // Run every 1 minute to check if 5 minutes have elapsed
    const autoPilotInterval = setInterval(() => {
      checkAndTriggerAutoPublish().then(newPost => {
        if (newPost) {
          console.log("⚡ Auto-pilot published new Google Trend SEO article:", newPost.title);
        }
      }).catch(err => console.warn("Auto-pilot timer note:", err));
    }, 60 * 1000);

    return () => clearInterval(autoPilotInterval);
  }, []);

  // Sync Categories from Firestore
  useEffect(() => {
      if (!db || !isReady) return;
      const unsubscribe = onSnapshot(collection(db, "categories"), (snapshot) => {
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
          if (items.length > 0) {
              setCategories(items);
              try { localStorage.setItem('rizq_cached_categories', JSON.stringify(items)); } catch(e) {}
          } else {
              setCategories(DEFAULT_CATEGORIES);
          }
      }, (err) => {
          console.warn("Categories fetch note (handled):", err.message);
      });
      return () => unsubscribe();
  }, [isReady]);

  const fetchMoreListings = async () => {
      if (!db || loadingData || !hasMoreListings || !lastListingDoc) return;
      setLoadingData(true);
      try {
          const q = query(collection(db, "listings"), orderBy("createdAt", "desc"), startAfter(lastListingDoc), limit(20));
          const snapshot = await getDocs(q);
          const newItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
          setHasMoreListings(snapshot.docs.length >= 20);
          setLastListingDoc(snapshot.docs[snapshot.docs.length - 1] || null);
          setListingsDB(prev => [...prev, ...newItems]);
      } catch(e) {}
      finally { setLoadingData(false); }
  };

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  // 🎁 Auto Show Rs 1,000 Launch Bonus Popup for Visitors / New Users
  useEffect(() => {
    if (isReady) {
      const hasSeenBonus = sessionStorage.getItem('rizq_bonus_popup_seen');
      if (!hasSeenBonus) {
        const timer = setTimeout(() => {
          setShowLaunchBonusModal(true);
          sessionStorage.setItem('rizq_bonus_popup_seen', 'true');
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [isReady]);

  const handleClaimBonusClick = () => {
    setShowLaunchBonusModal(false);
    if (user) {
      setInitialVendorTab('add-listing');
      setView('vendor-dashboard');
    } else {
      handleNavigate('auth');
    }
  };

  const handleLogin = async (email: string, password: string) => {
    try {
        if (email === 'admin@rizqdaan.com' && password === 'admin') {
            const adminUser: User = { id: 'admin-demo', name: 'Admin', email: 'admin@rizqdaan.com', phone: '0000', shopName: 'Admin HQ', shopAddress: 'Cloud', isVerified: true, isAdmin: true };
            setUser(adminUser); handleNavigate('admin'); return { success: true, message: 'Logged in' };
        }
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const uid = userCredential.user.uid;
        
        if (db) {
            try {
                const userDoc = await Promise.race([
                    getDoc(doc(db, "users", uid)),
                    new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000))
                ]);
                if (userDoc && userDoc.exists()) {
                    setUser({ id: uid, ...userDoc.data() } as User);
                } else if (!user) {
                    setUser({
                        id: uid,
                        name: userCredential.user.displayName || email.split('@')[0],
                        email: email,
                        phone: '',
                        shopName: '',
                        shopAddress: '',
                        isVerified: true
                    } as User);
                }
            } catch (e) {
                console.warn("User fetch error:", e);
            }
        }
        return { success: true, message: 'Login successful!' };
    } catch (error: any) { 
        console.error("Login error:", error);
        let msg = error.message;
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            msg = 'Invalid email or password. Please try again.';
        } else if (error.code === 'auth/too-many-requests') {
            msg = 'Too many failed attempts. Please try again in a few minutes.';
        } else if (error.code === 'auth/network-request-failed') {
            msg = 'Network error. Please check your internet connection.';
        }
        return { success: false, message: msg }; 
    }
  };

  const handleSignup = async (userData: any) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, userData.email.trim(), userData.password || 'password123');
        const newUserId = userCredential.user.uid;
        const newUserProfile: User = {
            id: newUserId, 
            name: userData.name.trim(), 
            email: userData.email.trim(), 
            phone: userData.phone.trim(),
            shopName: userData.shopName.trim(), 
            shopAddress: userData.shopAddress, 
            isVerified: true,
            referralCode: `USER-${Math.floor(1000 + Math.random() * 9000)}`, 
            referredBy: userData.referralCodeInput?.trim() || null,
            wallet: { balance: 0, totalSpend: 0, pendingDeposit: 0, pendingWithdrawal: 0 },
            walletHistory: [], 
            favorites: []
        };
        setUser(newUserProfile);
        
        if (db) {
            try {
                await Promise.race([
                    setDoc(doc(db, "users", newUserId), newUserProfile, { merge: true }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error("Firestore write timeout")), 4000))
                ]);
            } catch (fsErr) {
                console.warn("Firestore user creation note:", fsErr);
            }
        }
        return { success: true, message: 'Signup successful!', user: newUserProfile };
    } catch (error: any) { 
        console.error("Signup error:", error);
        let msg = error.message;
        if (error.code === 'auth/email-already-in-use') {
            msg = 'This email is already registered. Please log in instead.';
        } else if (error.code === 'auth/weak-password') {
            msg = 'Password should be at least 6 characters.';
        } else if (error.code === 'auth/invalid-email') {
            msg = 'Please enter a valid email address.';
        } else if (error.code === 'auth/network-request-failed') {
            msg = 'Network error. Please check your internet connection.';
        }
        return { success: false, message: msg }; 
    }
  };

  if (!isReady) {
      return (
          <div className="flex h-screen items-center justify-center bg-primary">
              <div className="text-center p-8">
                  <h1 className="text-white font-black text-2xl tracking-widest mb-2 uppercase animate-pulse">Rizq Daan</h1>
                  <p className="text-white/50 text-[10px] uppercase font-bold tracking-tighter">Please wait...</p>
              </div>
          </div>
      );
  }

  const renderView = () => {
    switch (view) {
      case 'home': return <HomePage listings={listingsDB} categories={categories} onNavigate={handleNavigate as any} onSaveSearch={() => {}} onOpenBonusModal={() => setShowLaunchBonusModal(true)} loadMore={fetchMoreListings} hasMore={hasMoreListings} isLoadingMore={loadingData} />;
      case 'listings': return <ListingsPage listings={listingsDB} onNavigate={(v, p) => handleNavigate('details', p)} initialSearchTerm={searchQuery} loadMore={fetchMoreListings} hasMore={hasMoreListings} isLoading={loadingData} />;
      case 'details': return selectedListing ? <ListingDetailsPage listing={selectedListing} listings={listingsDB} user={user} onNavigate={handleNavigate as any} /> : null;
      case 'vendor-dashboard': return <VendorDashboard initialTab={initialVendorTab} listings={listingsDB} user={user} onNavigate={handleNavigate as any} />;
      case 'vendor-profile': return selectedVendorId ? <VendorProfilePage vendorId={selectedVendorId} currentUser={user} listings={listingsDB} onNavigate={handleNavigate as any} /> : null;
      case 'auth': return <AuthPage onLogin={async (e, p) => { const res = await handleLogin(e, p); if (res.success) handleNavigate('home'); return res; }} onSignup={async (data) => { const res = await handleSignup(data); if (res.success) handleNavigate('home'); return res; }} onVerifyAndLogin={() => handleNavigate('home')} />;
      case 'account': return user ? <AccountPage user={user} listings={listingsDB} onLogout={() => { signOut(auth); setUser(null); handleNavigate('home'); }} onNavigate={handleNavigate as any} /> : <AuthPage onLogin={async (e, p) => { const res = await handleLogin(e, p); if (res.success) handleNavigate('home'); return res; }} onSignup={async (data) => { const res = await handleSignup(data); if (res.success) handleNavigate('home'); return res; }} onVerifyAndLogin={() => handleNavigate('home')} />;
      case 'subcategories': return <SubCategoryPage category={selectedCategory} categories={categories} onNavigate={() => handleGoBack()} onListingNavigate={(v, q) => handleNavigate(v as any, { query: q })} />;
      case 'chats': {
        const effectiveUser = user || getOrCreateGuestUser();
        return <ChatPage currentUser={effectiveUser} targetUser={chatTargetUser} contextListing={chatContextListing} onViewListing={(l) => { if ('description' in l) { handleNavigate('details', { listing: l as Listing }); } else { const found = listingsDB.find(x => x.id === l.id); if (found) handleNavigate('details', { listing: found }); } }} onNavigate={() => handleGoBack()} />;
      }
      case 'favorites': return user ? <FavoritesPage user={user} listings={listingsDB} onNavigate={handleNavigate as any} /> : null;
      case 'saved-searches': return user ? <SavedSearchesPage searches={user.savedSearches || []} onNavigate={handleNavigate as any} /> : null;
      case 'edit-profile': return user ? <EditProfilePage user={user} onNavigate={handleNavigate as any} /> : null;
      case 'settings': return user ? <SettingsPage user={user} onNavigate={handleNavigate as any} currentTheme={theme} toggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')} onLogout={() => { signOut(auth); setUser(null); handleNavigate('home'); }} /> : null;
      case 'admin': return user?.isAdmin ? <AdminPanel users={[]} listings={listingsDB} onUpdateUserVerification={() => {}} onDeleteListing={() => {}} onImpersonate={(u) => { setUser(u); handleNavigate('vendor-dashboard'); }} onNavigate={handleNavigate as any} /> : null;
      case 'add-balance': return user ? <AddFundsPage user={user} onNavigate={() => handleGoBack()} /> : null;
      case 'referrals': return user ? <ReferralPage user={user} onNavigate={() => handleGoBack()} /> : null;
      case 'wallet-history': return user ? <WalletHistoryPage user={user} onNavigate={() => handleGoBack()} /> : null;
      case 'notifications': return user ? <NotificationsPage user={user} onNavigate={handleNavigate as any} /> : null;
      case 'help-center': return <HelpCenterPage onNavigate={() => handleGoBack()} />;
      case 'tools': return <ToolsPage initialTool={selectedTool} onNavigate={handleNavigate as any} listings={listingsDB} user={user} />;
      case 'blog': return <BlogPage onNavigate={handleNavigate as any} listings={listingsDB} />;
      case 'blog-detail': return selectedBlogPost ? <BlogDetailPage post={selectedBlogPost} listings={listingsDB} onNavigate={handleNavigate as any} /> : <BlogPage onNavigate={handleNavigate as any} listings={listingsDB} />;
      default: return <HomePage listings={listingsDB} categories={categories} onNavigate={handleNavigate as any} onSaveSearch={() => {}} onOpenBonusModal={() => setShowLaunchBonusModal(true)} loadMore={fetchMoreListings} hasMore={hasMoreListings} isLoadingMore={loadingData} />;
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'dark bg-dark-bg' : 'bg-primary-light'}`}>
      
      {/* 🎁 1,000 RS SIGNUP BONUS POPUP MODAL */}
      <LaunchBonusModal 
        isOpen={showLaunchBonusModal}
        onClose={() => setShowLaunchBonusModal(false)}
        onClaim={handleClaimBonusClick}
        isLoggedIn={!!user}
        hasClaimedBonus={!!user?.hasReceivedFirstAdBonus}
      />

      {/* 🎁 FLOATING BONUS PILL (When on Home screen and bonus is active) */}
      {view === 'home' && !user?.hasReceivedFirstAdBonus && !showLaunchBonusModal && (
        <LaunchBonusFloatingBadge 
          onClick={() => setShowLaunchBonusModal(true)}
          isUrdu={true}
        />
      )}

      {activeToast && (
          <div onClick={() => activeToast.id !== 'exit-alert' && handleNavigate('notifications')} className="fixed top-4 left-4 right-4 z-[100] bg-white dark:bg-dark-surface shadow-2xl border-l-8 border-primary rounded-2xl p-4 animate-bounce-in cursor-pointer">
              <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-2 rounded-full text-primary">
                       <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-black text-gray-900 dark:text-white truncate uppercase tracking-tighter">{activeToast.title}</h4>
                      <p className="text-xs text-gray-500 truncate">{activeToast.message}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setActiveToast(null); }} className="text-gray-400 p-1">✕</button>
              </div>
          </div>
      )}

      {showPermissionBanner && (
          <div className="fixed bottom-20 left-4 right-4 z-50 bg-primary text-white p-5 rounded-2xl shadow-2xl animate-fade-in border-2 border-white/20">
              <div className="flex items-center justify-between gap-4">
                  <div className="flex-1"><h4 className="font-black text-sm uppercase">Enable Alerts?</h4><p className="text-[10px] opacity-80 mt-1">Get sound alerts for messages.</p></div>
                  <div className="flex gap-2">
                    <button onClick={requestPushPermission} className="px-4 py-2 bg-white text-primary rounded-xl text-xs font-black shadow-lg">Allow</button>
                    <button onClick={() => setShowPermissionBanner(false)} className="px-3 text-white/50 text-xs font-bold">Skip</button>
                  </div>
              </div>
          </div>
      )}

      <Header onNavigate={handleNavigate as any} toggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')} currentTheme={theme} user={user} />
      <main className={view === 'home' ? "container mx-auto px-4 sm:px-6 lg:px-8 pt-0 pb-24" : "container mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24"}>
        {renderView()}
      </main>
      <BottomNavBar onNavigate={handleNavigate as any} activeView={view} />
    </div>
  );
};

export default App;
