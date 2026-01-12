
import React, { useState } from 'react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Listing, User } from '../../types';

interface ManageListingsProps {
    listings: Listing[]; 
    user: User | null;
    onEdit: (listing: Listing) => void;
    onPreview: (listing: Listing) => void;
    onPromote: (listing: Listing) => void;
}

type ListingFilter = 'all' | 'live' | 'draft' | 'featured';

const ManageListings: React.FC<ManageListingsProps> = ({ listings, user, onEdit, onPreview, onPromote }) => {
  const [activeTab, setActiveTab] = useState<ListingFilter>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filteredListings = listings.filter(listing => {
      const status = listing.status || 'active';
      if (activeTab === 'live') return status === 'active';
      if (activeTab === 'draft') return status === 'draft';
      if (activeTab === 'featured') return listing.isPromoted && status === 'active';
      return true;
  });

  const handleDeleteClick = (listing: Listing) => {
      if (listing.isPromoted) {
          alert("❌ Cannot Delete: This listing is currently FEATURED. Please go to the 'Promotions' section and stop/delete the campaign first.");
          return;
      }

      if (confirmDeleteId === listing.id) {
          performDelete(listing.id);
      } else {
          setConfirmDeleteId(listing.id);
          setTimeout(() => {
              setConfirmDeleteId(prev => prev === listing.id ? null : prev);
          }, 3000);
      }
  };

  const performDelete = async (listingId: string) => {
      if (!db) return;
      setDeletingId(listingId);
      setConfirmDeleteId(null);
      setErrorMsg(null);
      try {
          await deleteDoc(doc(db, "listings", listingId));
      } catch (e: any) {
          setErrorMsg(`Delete failed: ${e.message}`);
      } finally {
          setDeletingId(null);
      }
  };

  if (!user) return <div>Please log in.</div>;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Manage Your Listings</h3>
      </div>
      
      {errorMsg && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow-sm relative">
              <p className="font-bold">Error</p>
              <p>{errorMsg}</p>
              <button onClick={() => setErrorMsg(null)} className="absolute top-2 right-2 text-red-500 font-bold">✕</button>
          </div>
      )}

      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 pb-2">
          {['all', 'live', 'draft', 'featured'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as ListingFilter)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 ${
                    activeTab === tab
                    ? 'border-primary text-primary dark:text-white bg-gray-50 dark:bg-gray-700/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)} 
                  <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded-full">
                    {tab === 'all' 
                        ? listings.length 
                        : listings.filter(l => {
                            const status = l.status || 'active';
                            if (tab === 'live') return status === 'active';
                            if (tab === 'draft') return status === 'draft';
                            if (tab === 'featured') return l.isPromoted && status === 'active';
                            return false;
                        }).length
                    }
                  </span>
              </button>
          ))}
      </div>

      <div className="space-y-6">
          {filteredListings.map(listing => (
          <div key={listing.id} className={`flex flex-col p-4 bg-white dark:bg-dark-surface rounded-xl shadow-md border ${listing.isPromoted ? 'border-yellow-400 ring-1 ring-yellow-400' : 'border-gray-200 dark:border-gray-700'}`}>
              <div className="flex flex-row gap-4 mb-4">
                  <div className="relative w-24 h-24 flex-shrink-0">
                        <img src={listing.imageUrl} alt={listing.title} className="w-full h-full rounded-lg object-cover bg-gray-200" />
                        {listing.isPromoted && <span className="absolute -top-2 -left-2 bg-yellow-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">FEATURED</span>}
                  </div>
                  <div className="flex-grow">
                      <div className="flex justify-between items-start">
                            <div className="max-w-[70%]">
                              <h4 className="font-bold text-base text-gray-800 dark:text-white line-clamp-1">{listing.title}</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400 font-bold">Rs.{listing.price.toLocaleString()}</p>
                            </div>
                            <button onClick={() => onPreview(listing)} className="text-[10px] font-black uppercase text-primary hover:underline flex items-center gap-1">
                                Preview
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7-7 7" /></svg>
                            </button>
                      </div>
                      
                      {/* Robust Stats Grid */}
                      <div className="grid grid-cols-5 gap-1.5 mt-3">
                            <div className="text-center bg-gray-50 dark:bg-gray-800 rounded-lg p-1.5 border border-gray-100 dark:border-gray-700">
                                <span className="block text-[8px] text-gray-400 uppercase font-black tracking-tighter">Views</span>
                                <span className="font-bold text-primary dark:text-white text-[11px]">{listing.views || 0}</span>
                            </div>
                            <div className="text-center bg-gray-50 dark:bg-gray-800 rounded-lg p-1.5 border border-gray-100 dark:border-gray-700">
                                <span className="block text-[8px] text-gray-400 uppercase font-black tracking-tighter">Calls</span>
                                <span className="font-bold text-blue-500 text-[11px]">{listing.calls || 0}</span>
                            </div>
                            <div className="text-center bg-teal-50 dark:bg-teal-900/20 rounded-lg p-1.5 border border-teal-100 dark:border-teal-900/30">
                                <span className="block text-[8px] text-teal-600 dark:text-teal-400 uppercase font-black tracking-tighter">Chats</span>
                                <span className="font-bold text-teal-700 dark:text-teal-300 text-[11px]">{listing.messages || 0}</span>
                            </div>
                            <div className="text-center bg-gray-50 dark:bg-gray-800 rounded-lg p-1.5 border border-gray-100 dark:border-gray-700">
                                <span className="block text-[8px] text-gray-400 uppercase font-black tracking-tighter">Rating</span>
                                <span className="font-bold text-yellow-500 text-[11px]">{listing.rating.toFixed(1)}</span>
                            </div>
                            <div className="text-center bg-gray-50 dark:bg-gray-800 rounded-lg p-1.5 border border-gray-100 dark:border-gray-700">
                                <span className="block text-[8px] text-gray-400 uppercase font-black tracking-tighter">Likes</span>
                                <span className="font-bold text-red-500 text-[11px]">{listing.likes || 0}</span>
                            </div>
                      </div>
                  </div>
              </div>
              <div className="grid grid-cols-3 gap-3 border-t border-gray-100 dark:border-gray-700 pt-3">
                  <button onClick={() => !listing.isPromoted && onPromote(listing)} className={`px-3 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${listing.isPromoted ? 'bg-yellow-400 text-white cursor-default' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 shadow-sm'}`}>{listing.isPromoted ? 'Featured' : 'Promote'}</button>
                  <button onClick={() => onEdit(listing)} className="px-3 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 shadow-sm transition-all">Edit</button>
                  <button onClick={() => handleDeleteClick(listing)} className={`px-3 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm ${confirmDeleteId === listing.id ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}>
                      {deletingId === listing.id ? '...' : (confirmDeleteId === listing.id ? 'Confirm?' : 'Delete')}
                  </button>
              </div>
          </div>
          ))}
          {filteredListings.length === 0 && (
              <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/40 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No listings found here.</p>
              </div>
          )}
      </div>
    </div>
  );
};

export default ManageListings;
