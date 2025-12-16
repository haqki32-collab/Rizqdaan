
import React, { useState, useEffect, useCallback } from 'react';
import * as firebaseAuth from 'firebase/auth';
import { doc, setDoc, getDoc, collection, onSnapshot, Unsubscribe, deleteDoc, updateDoc, arrayUnion, query, where, getDocs, increment } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebaseConfig';

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
import { Listing, User, Category, Transaction, ReferralSettings } from './types';
import { MOCK_LISTINGS, CATEGORIES as DEFAULT_CATEGORIES } from './constants';

const { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } = firebaseAuth;

type View = 'home' | 'listings' | 'details' | 'vendor-dashboard' | 'auth' | 'account' | 'subcategories' | 'chats' | 'add-listing' | 'my-ads' | 'vendor-analytics' | 'favorites' | 'saved-searches' | 'edit-profile' | 'settings' | 'admin' | 'vendor-profile' | 'promote-business' | 'add-balance' | 'referrals' | 'wallet-history' | 'notifications';
type NavigatePayload = {
  listing?: Listing;
  category?: Category;
  query?: string;
  targetUser?: { id: string; name: string };
  targetVendorId?: string;
};

const App: React.FC = () => {
  const [theme, setTheme] = useState('light');
  const [view, setView] = useState<View>('home');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [listingsDB, setListingsDB] = useState<Listing[]>(MOCK_LISTINGS);
  const [loadingData, setLoadingData] = useState(false);
  
  // Dynamic Categories State
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);

  // Chat State
  const [chatTargetUser, setChatTargetUser] = useState<{id: string, name: string} | null>(null);

  // Users DB State (For Admin)
  const [usersDB, setUsersDB] = useState<User[]>([]);

  const [initialVendorTab, setInitialVendorTab] = useState<'dashboard' | 'my-listings' | 'add-listing' | 'promotions'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  // Helper: Generate Unique Referral Code
  const generateReferralCode = (name: string) => {
      const cleanName = name.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase();
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      return `${cleanName}-${randomNum}`;
  };

  // Firebase Auth Listener with Real-time User Profile Update
  useEffect(() => {
    if (!auth) return;
    let userUnsubscribe: Unsubscribe | null = null;

    const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in, set up real-time listener for user profile
        if (db) {
            try {
                userUnsubscribe = onSnapshot(doc(db, "users", firebaseUser.uid), async (docSnap) => {
                    if (docSnap.exists()) {
                         const userData = docSnap.data() as User;
                         
                         // Check if user is missing a referral code (Backfill for old users)
                         if (!userData.referralCode) {
                             const newCode = generateReferralCode(userData.name || 'USER');
                             // Attempt to update, but don't block
                             updateDoc(doc(db, "users", firebaseUser.uid), { referralCode: newCode }).catch(e => console.log("Ref code update fallback"));
                             userData.referralCode = newCode;
                         }
                         
                         setUser({ id: firebaseUser.uid, ...userData });
                    } else {
                        // Fallback if doc doesn't exist yet
                        const newUser: User = { 
                            id: firebaseUser.uid, 
                            email: firebaseUser.email || '', 
                            name: firebaseUser.displayName || 'User',
                            phone: '', shopName: '', shopAddress: '', isVerified: false,
                            referralCode: generateReferralCode(firebaseUser.displayName || 'USER'),
                            favorites: [],
                            referredBy: null, // Default to null to prevent undefined errors
                        };
                        setUser(newUser);
                    }
                }, (error) => {
                    const msg = error?.message || String(error);
                    console.error("Error listening to user profile: " + msg);
                });
            } catch (e: any) {
                const msg = e?.message || String(e);
                console.error("Error setting up user listener: " + msg);
            }
        }
      } else {
        if (userUnsubscribe) {
            userUnsubscribe();
            userUnsubscribe = null;
        }
        setUser(null);
      }
    });
    return () => {
        authUnsubscribe();
        if (userUnsubscribe) userUnsubscribe();
    };
  }, []);

  // Real-time Listings Listener
  useEffect(() => {
    if (!isFirebaseConfigured() || !db) return;

    setLoadingData(true);
    
    const unsubscribe = onSnapshot(collection(db, "listings"), (snapshot) => {
      const firebaseListings: Listing[] = [];
      snapshot.forEach((doc) => {
        firebaseListings.push({ id: doc.id, ...doc.data() } as Listing);
      });
      // Direct assignment from DB, no local merging
      setListingsDB(firebaseListings);
      setLoadingData(false);
    }, (error: any) => {
      if (error?.code === 'permission-denied' || error?.message?.includes('permission')) {
          console.warn("⚠️ FIREBASE PERMISSION ERROR: Database access blocked. Using Mock.");
          setListingsDB(MOCK_LISTINGS); 
      }
      setLoadingData(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time Categories Listener
  useEffect(() => {
      if (!db) return;
      const unsubscribe = onSnapshot(collection(db, "categories"), (snapshot) => {
          const dbCategories: Category[] = [];
          snapshot.forEach(doc => {
              dbCategories.push({ id: doc.id, ...doc.data() } as Category);
          });
          if (dbCategories.length > 0) {
              setCategories(dbCategories);
          }
      });
      return () => unsubscribe();
  }, []);

  // Real-time Users Listener (For Admin Display)
  useEffect(() => {
    if (!isFirebaseConfigured() || !db || !user?.isAdmin) return;

    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const firebaseUsers: User[] = [];
      snapshot.forEach((doc) => {
        firebaseUsers.push({ id: doc.id, ...doc.data() as User });
      });
      setUsersDB(firebaseUsers);
    }, (error: any) => {
        console.error("Error listening to users:", error.message);
    });

    return () => unsubscribe();
  }, [user?.isAdmin]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const handleSaveSearch = async (query: string) => {
    if (!query.trim()) {
        alert('Please enter a search term to save.');
        return;
    }
    const lowerCaseQuery = query.toLowerCase();
    
    if (user && db) {
        // Save to Firestore if logged in
        if (!user.savedSearches?.includes(lowerCaseQuery)) {
            try {
                await updateDoc(doc(db, "users", user.id), {
                    savedSearches: arrayUnion(lowerCaseQuery)
                });
                alert(`Search "${query}" saved to your account!`);
            } catch(e: any) {
                console.error("Error saving search", e.message);
            }
        } else {
            alert('Search already saved.');
        }
    } else {
        alert('Please login to save searches.');
        setView('auth');
    }
  };

  const handleNavigate = useCallback((newView: View, payload?: NavigatePayload) => {
    if (newView !== 'details' && newView !== 'subcategories') {
      setSelectedListing(null);
      setSelectedCategory(null);
    }
     if (newView !== 'listings' && newView !== 'details') {
        setSearchQuery('');
    }

    if (payload?.listing && newView === 'details') {
      setSelectedListing(payload.listing);
    } 
    if (payload?.category && newView === 'subcategories') {
      setSelectedCategory(payload.category);
    } 
    if (payload?.query !== undefined && newView === 'listings') {
        setSearchQuery(payload.query);
    }
    if (payload?.targetUser && newView === 'chats') {
        setChatTargetUser(payload.targetUser);
    } else if (newView === 'chats') {
        setChatTargetUser(null); 
    }
    if (payload?.targetVendorId && newView === 'vendor-profile') {
        setSelectedVendorId(payload.targetVendorId);
    }

    if (newView === 'add-listing') {
        setInitialVendorTab('add-listing');
        setView('vendor-dashboard');
    } else if (newView === 'my-ads') {
        setInitialVendorTab('my-listings');
        setView('vendor-dashboard');
    } else if (newView === 'vendor-analytics') {
        setInitialVendorTab('dashboard');
        setView('vendor-dashboard');
    } else if (newView === 'promote-business') {
        setInitialVendorTab('promotions');
        setView('vendor-dashboard');
    } else if (['chats', 'account', 'favorites', 'saved-searches', 'edit-profile', 'settings', 'admin', 'add-balance', 'referrals', 'wallet-history', 'notifications'].includes(newView)) {
        if (user) {
            if (newView === 'admin' && !user.isAdmin) {
                setView('home'); 
            } else {
                setView(newView);
            }
        } else {
            setView('auth');
        }
    } else {
        setView(newView);
    }
    
    window.scrollTo(0, 0);
  }, [user]);
  
  const handleLogin = async (email: string, password: string) => {
    try {
        if (!navigator.onLine) return { success: false, message: 'No internet connection.' };

        // Admin Backdoor for Demo
        if (email === 'admin@rizqdaan.com' && password === 'admin') {
            const adminUser: User = {
                id: 'admin-demo',
                name: 'Admin',
                email: 'admin@rizqdaan.com',
                phone: '0000',
                shopName: 'Admin HQ',
                shopAddress: 'Cloud',
                isVerified: true,
                isAdmin: true
            };
            setUser(adminUser);
            setView('admin');
            return { success: true, message: 'Logged in as Demo Admin' };
        }

        if (!auth) throw new Error("Firebase keys are missing.");
        await signInWithEmailAndPassword(auth, email, password);
        setView('account');
        return { success: true, message: 'Login successful!' };
    } catch (error: any) {
        console.error("Login Error: " + error.message);
        return { success: false, message: error.message };
    }
  };

  const handleSignup = async (userData: Omit<User, 'id' | 'isVerified'> & { referralCodeInput?: string }) => {
    try {
        if (!navigator.onLine) return { success: false, message: 'No internet connection.' };
        if (!auth || !db) throw new Error("Firebase keys are missing.");
        
        // 1. Create Auth User
        const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password || 'password123');
        const firebaseUser = userCredential.user;
        const newUserId = firebaseUser.uid;
        
        // 2. Generate unique referral code for this new user
        const myReferralCode = generateReferralCode(userData.name);

        // 3. Handle Referral Logic (If code provided)
        
        // Fetch Settings for Dynamic Bonuses
        let inviterReward = 200; // Default
        let inviteeReward = 300; // Default
        
        try {
            const settingsSnap = await getDoc(doc(db, 'settings', 'referrals'));
            if (settingsSnap.exists()) {
                const settings = settingsSnap.data() as ReferralSettings;
                if (settings.isActive) {
                    inviterReward = settings.inviterBonus;
                    inviteeReward = settings.inviteeBonus;
                } else {
                    // Program disabled
                    inviterReward = 0;
                    inviteeReward = 0;
                }
            }
        } catch (e) {
            console.log("Using default referral rewards (settings fetch failed)");
        }

        let referrerId = null;
        let initialBalance = 0;
        const transactions: Transaction[] = [];

        if (userData.referralCodeInput && inviteeReward > 0) {
            // Find user with this code
            const q = query(collection(db, "users"), where("referralCode", "==", userData.referralCodeInput.trim().toUpperCase()));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                // Referrer found!
                const referrerDoc = querySnapshot.docs[0];
                referrerId = referrerDoc.id;
                
                // Credit Referrer (Bonus)
                if (inviterReward > 0) {
                    const referrerRef = doc(db, "users", referrerId);
                    const referrerBonusTx: Transaction = {
                        id: `tx_ref_${Date.now()}_R`,
                        type: 'referral_bonus',
                        amount: inviterReward,
                        date: new Date().toISOString().split('T')[0],
                        status: 'completed',
                        description: `Referral Bonus: Invited ${userData.name}`
                    };

                    await updateDoc(referrerRef, {
                        "wallet.balance": increment(inviterReward),
                        "referralStats.totalInvited": increment(1),
                        "referralStats.totalEarned": increment(inviterReward),
                        walletHistory: arrayUnion(referrerBonusTx)
                    });
                }

                // Credit New User (Welcome Bonus)
                initialBalance = inviteeReward;
                transactions.push({
                    id: `tx_ref_${Date.now()}_U`,
                    type: 'referral_bonus',
                    amount: inviteeReward,
                    date: new Date().toISOString().split('T')[0],
                    status: 'completed',
                    description: `Welcome Bonus: Used code ${userData.referralCodeInput}`
                });
            }
        }

        // 4. Create User Document
        const newUserProfile: User = {
            id: newUserId,
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            shopName: userData.shopName,
            shopAddress: userData.shopAddress,
            isVerified: false,
            referralCode: myReferralCode,
            referredBy: referrerId || null, 
            referralStats: { totalInvited: 0, totalEarned: 0 },
            wallet: { balance: initialBalance, totalSpend: 0, pendingDeposit: 0, pendingWithdrawal: 0 },
            walletHistory: transactions,
            favorites: []
        };

        await setDoc(doc(db, "users", newUserId), newUserProfile);
        
        return { success: true, message: 'Signup successful!', user: newUserProfile };

    } catch (error: any) {
        console.error("Signup Error: " + (error?.message || String(error)));
        return { success: false, message: error.message };
    }
  };

  const handleVerifyAndLogin = async (userId: string) => {
      if (!db) return;
      try {
          const userRef = doc(db, "users", userId);
          await setDoc(userRef, { isVerified: true }, { merge: true });
          setView('account');
      } catch (e: any) {
          console.error("Verification update failed: " + e.message);
      }
  };

  const handleAdminUpdateUserVerification = (userId: string, isVerified: boolean) => {
    if(db) {
        const userRef = doc(db, "users", userId);
        setDoc(userRef, { isVerified }, { merge: true });
    }
  };
  
  const handleAdminDeleteListing = async (listingId: string) => {
      // Optimistic Update not needed as onSnapshot will handle it
      if(db) {
          try {
             await deleteDoc(doc(db, "listings", listingId));
          } catch(e: any) {
              console.error("Error deleting listing:", e.message);
          }
      }
  };

  const handleImpersonate = (targetUser: User) => {
      setUser(targetUser);
      setInitialVendorTab('dashboard');
      setView('vendor-dashboard');
      window.scrollTo(0, 0);
      alert(`You are now accessing the dashboard as ${targetUser.name}`);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'dark bg-dark-bg' : 'bg-primary-light'}`}>
      <Header onNavigate={handleNavigate} toggleTheme={toggleTheme} currentTheme={theme} user={user} />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
        
        {view === 'home' && <HomePage listings={listingsDB} onNavigate={handleNavigate} onSaveSearch={handleSaveSearch} />}
        
        {view === 'listings' && <ListingsPage listings={listingsDB} onNavigate={handleNavigate} initialSearchTerm={searchQuery} />}
        
        {view === 'subcategories' && selectedCategory && (
            <SubCategoryPage 
                category={selectedCategory} 
                onNavigate={handleNavigate} 
                onListingNavigate={(v, q) => handleNavigate(v, { query: q })}
            />
        )}

        {view === 'details' && selectedListing && (
            <ListingDetailsPage 
                listing={selectedListing} 
                user={user} 
                onNavigate={handleNavigate} 
            />
        )}
        
        {view === 'vendor-dashboard' && (
             <VendorDashboard 
                initialTab={initialVendorTab} 
                listings={listingsDB} 
                user={user} 
                onNavigate={(v, payload) => handleNavigate(v, payload)}
             />
        )}

        {view === 'vendor-profile' && selectedVendorId && (
            <VendorProfilePage
                vendorId={selectedVendorId}
                currentUser={user}
                listings={listingsDB}
                onNavigate={handleNavigate}
            />
        )}

        {view === 'auth' && <AuthPage onLogin={handleLogin} onSignup={handleSignup} onVerifyAndLogin={handleVerifyAndLogin} />}
        
        {view === 'account' && user && <AccountPage user={user} listings={listingsDB} onLogout={() => { signOut(auth); setUser(null); setView('home'); }} onNavigate={handleNavigate} />}
        
        {view === 'favorites' && user && <FavoritesPage user={user} listings={listingsDB} onNavigate={handleNavigate} />}
        
        {view === 'saved-searches' && user && <SavedSearchesPage searches={user.savedSearches || []} onNavigate={handleNavigate} />}

        {view === 'edit-profile' && user && <EditProfilePage user={user} onNavigate={handleNavigate} />}

        {view === 'settings' && user && <SettingsPage user={user} onNavigate={handleNavigate} currentTheme={theme} toggleTheme={toggleTheme} onLogout={() => { signOut(auth); setUser(null); setView('home'); }} />}

        {view === 'referrals' && user && (
            <ReferralPage user={user} onNavigate={handleNavigate} />
        )}

        {view === 'add-balance' && user && (
            <AddFundsPage user={user} onNavigate={handleNavigate} />
        )}

        {view === 'wallet-history' && user && (
            <WalletHistoryPage user={user} onNavigate={handleNavigate} />
        )}

        {view === 'notifications' && user && (
            <NotificationsPage user={user} onNavigate={(view) => handleNavigate(view as View)} />
        )}

        {view === 'chats' && user && (
            <ChatPage 
                currentUser={user}
                targetUser={chatTargetUser}
                onNavigate={handleNavigate}
            />
        )}

        {/* Admin Panel */}
        {view === 'admin' && user?.isAdmin && (
            <AdminPanel 
                users={usersDB} 
                listings={listingsDB}
                onUpdateUserVerification={handleAdminUpdateUserVerification}
                onDeleteListing={handleAdminDeleteListing}
                onImpersonate={handleImpersonate}
                onNavigate={handleNavigate}
            />
        )}

      </main>

      <BottomNavBar onNavigate={handleNavigate} activeView={view} />
    </div>
  );
};

export default App;
