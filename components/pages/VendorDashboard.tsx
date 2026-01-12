
import React, { useState, useEffect } from 'react';
import AddListingForm from '../vendor/AddListingForm';
import ManageListings from '../vendor/ManageListings';
import VendorAnalytics from '../vendor/VendorAnalytics';
import VendorPromotions from '../vendor/VendorPromotions';
import { Listing, User } from '../../types';
import { db } from '../../firebaseConfig';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

type VendorTab = 'dashboard' | 'my-listings' | 'add-listing' | 'promotions';

interface VendorDashboardProps {
  initialTab: VendorTab;
  listings: Listing[]; // This global list might be limited
  user: User | null;
  onNavigate?: (view: string, payload?: any) => void;
}

const VendorDashboard: React.FC<VendorDashboardProps> = ({ initialTab, user, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<VendorTab>(initialTab);
  const [listingToEdit, setListingToEdit] = useState<Listing | null>(null);
  const [listingToPromoteId, setListingToPromoteId] = useState<string | undefined>(undefined);
  const [vendorListings, setVendorListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  // CRITICAL: Fetch ALL listings for this vendor to ensure analytics are accurate
  useEffect(() => {
    if (!user?.id || !db) {
        setLoading(false);
        return;
    }

    setLoading(true);
    const q = query(
        collection(db, "listings"),
        where("vendorId", "==", user.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        let items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
        items.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateB - dateA;
        });
        setVendorListings(items);
        setLoading(false);
    }, (err) => {
        console.error("VendorDashboard data error:", err.message);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.id]);

  useEffect(() => {
      const validTab = ['dashboard', 'my-listings', 'add-listing', 'promotions'].includes(initialTab) 
          ? initialTab 
          : 'dashboard';
      setActiveTab(validTab as VendorTab);
      
      if (initialTab === 'add-listing') {
          setListingToEdit(null);
      }
      if (initialTab !== 'promotions') {
          setListingToPromoteId(undefined);
      }
  }, [initialTab]);

  const handleEditListing = (listing: Listing) => {
      setListingToEdit(listing);
      setActiveTab('add-listing');
      window.scrollTo(0, 0);
  };

  const handlePromoteListing = (listing: Listing) => {
      setListingToPromoteId(listing.id);
      setActiveTab('promotions');
      window.scrollTo(0, 0);
  };

  const handleAddSuccess = () => {
      setListingToEdit(null);
      setActiveTab('my-listings');
  };
  
  const handlePreview = (listing: Listing) => {
      if (onNavigate) {
          onNavigate('details', { listing });
      }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <VendorAnalytics listings={vendorListings} user={user} />;
      case 'my-listings':
        return (
            <ManageListings 
                listings={vendorListings} 
                user={user} 
                onEdit={handleEditListing} 
                onPreview={handlePreview}
                onPromote={handlePromoteListing}
            />
        );
      case 'add-listing':
        return (
            <AddListingForm 
                onSuccess={handleAddSuccess} 
                initialData={listingToEdit} 
            />
        );
      case 'promotions':
        return (
            <VendorPromotions 
                user={user} 
                initialListingId={listingToPromoteId} 
                onNavigate={(view) => onNavigate && onNavigate(view as any)}
            />
        );
      default:
        return <VendorAnalytics listings={vendorListings} user={user} />;
    }
  };

  const TabButton = ({ tab, label }: { tab: VendorTab; label: string }) => (
    <button
      onClick={() => {
          setActiveTab(tab);
          if (tab === 'add-listing') setListingToEdit(null);
          if (tab !== 'promotions') setListingToPromoteId(undefined);
      }}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors text-left w-full md:w-auto ${
        activeTab === tab 
          ? 'bg-primary text-white shadow' 
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-1/4">
        <div className="p-4 bg-white dark:bg-dark-surface rounded-xl shadow-lg h-full">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Vendor Menu</h2>
          <nav className="flex flex-col space-y-2">
            <TabButton tab="dashboard" label="Dashboard & Analytics" />
            <TabButton tab="my-listings" label="Manage Listings" />
            <TabButton tab="add-listing" label={listingToEdit ? "Edit Listing" : "Add New Listing"} />
            <div className="my-2 border-t border-gray-100 dark:border-gray-700"></div>
            <TabButton tab="promotions" label="Promote Business ✨" />
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="w-full md:w-3/4">
        <div className="p-6 bg-white dark:bg-dark-surface rounded-xl shadow-lg min-h-[500px]">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
                <p className="mt-4 text-gray-500 font-bold uppercase text-[10px] tracking-widest">Loading Analytics...</p>
             </div>
          ) : renderTabContent()}
        </div>
      </main>
    </div>
  );
};

export default VendorDashboard;
