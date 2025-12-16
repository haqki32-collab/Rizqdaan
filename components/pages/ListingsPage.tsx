
import React, { useState, useEffect } from 'react';
import { CATEGORIES } from '../../constants';
import { Listing } from '../../types';
import ListingCard from '../common/ListingCard';

interface ListingsPageProps {
  listings: Listing[];
  // Updated type to match App.tsx handleNavigate signature
  onNavigate: (view: 'details', payload: { listing: Listing }) => void;
  initialSearchTerm?: string;
}

const ListingsPage: React.FC<ListingsPageProps> = ({ listings, onNavigate, initialSearchTerm = '' }) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false); // Mobile category toggle

  useEffect(() => {
    setSearchTerm(initialSearchTerm);
  }, [initialSearchTerm]);

  // Filter from the REAL listings passed as props
  // AND Sort by Featured status (isPromoted)
  const filteredListings = listings.filter(listing => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch = searchTermLower === '' ? true : (
      listing.title.toLowerCase().includes(searchTermLower) ||
      listing.description.toLowerCase().includes(searchTermLower) ||
      listing.category.toLowerCase().includes(searchTermLower) ||
      listing.vendorName.toLowerCase().includes(searchTermLower)
    );
    const matchesCategory = selectedCategory === 'All' || listing.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
      // 1. Featured First (isPromoted = true comes first)
      if (a.isPromoted === b.isPromoted) {
          // If both featured or both not featured, sort by newest
          return 0; 
      }
      return a.isPromoted ? -1 : 1;
  });

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Filters Sidebar */}
      <aside className="w-full md:w-1/4">
        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-lg overflow-hidden sticky top-20">
          
          {/* Header & Search - Always Visible */}
          <div className="p-4 md:p-6 border-b md:border-b-0 border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 hidden md:block">Filters</h3>
            
            <div className="relative">
                <input
                id="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search listings..."
                className="block w-full pl-4 pr-10 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-shadow outline-none"
                />
                <div className="absolute right-3 top-3.5 text-gray-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
            </div>

            {/* Mobile Category Toggle */}
            <button 
                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                className="md:hidden w-full mt-4 flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600"
            >
                <span className="font-medium text-gray-700 dark:text-gray-300">
                    {selectedCategory === 'All' ? 'Select Category' : selectedCategory}
                </span>
                <svg className={`w-5 h-5 text-gray-500 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
          </div>

          {/* Category List - Hidden on mobile unless open, Visible on Desktop */}
          <div className={`p-4 md:p-6 pt-0 md:pt-0 ${isCategoryOpen ? 'block' : 'hidden md:block'}`}>
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 hidden md:block mt-4">Category</h4>
            <ul className="space-y-1 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
              {['All', ...CATEGORIES.map(c => c.name)].map(category => (
                <li key={category}>
                  <button
                    onClick={() => {
                        setSelectedCategory(category);
                        setIsCategoryOpen(false); // Close on mobile selection
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      selectedCategory === category
                        ? 'bg-primary text-white font-semibold shadow-sm'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {category}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>

      {/* Listings Content */}
      <main className="w-full md:w-3/4">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
                {searchTerm ? `Results for "${searchTerm}"` : (selectedCategory === 'All' ? 'All Listings' : `${selectedCategory}`)}
                <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">({filteredListings.length})</span>
            </h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredListings.length > 0 ? (
            filteredListings.map(listing => (
              // FIX: Passed { listing: l } object structure to match App.tsx payload expectation
              <ListingCard key={listing.id} listing={listing} onViewDetails={(l) => onNavigate('details', { listing: l })} />
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
                <div className="inline-block p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                    <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">No matches found</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Try adjusting your search or category filter.</p>
                <button 
                    onClick={() => {setSearchTerm(''); setSelectedCategory('All');}}
                    className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark"
                >
                    Clear Filters
                </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ListingsPage;
