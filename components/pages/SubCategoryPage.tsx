import React, { useState, useEffect } from 'react';
import { Category } from '../../types';
import { CATEGORIES as DEFAULT_CATEGORIES, renderIconByKey } from '../../constants';

interface SubCategoryPageProps {
  category: Category | null;
  categories?: Category[];
  onNavigate: (view: 'home') => void;
  onListingNavigate: (view: 'listings', query: string) => void;
}

const SubCategoryPage: React.FC<SubCategoryPageProps> = ({ category, categories = [], onNavigate, onListingNavigate }) => {
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(category ? category.id : null);
  const [searchQuery, setSearchQuery] = useState('');

  // Sync expanded status with initial/prop selection if selected
  useEffect(() => {
    if (category) {
      setExpandedCategoryId(category.id);
    }
  }, [category]);

  const toggleCategory = (id: string) => {
    setExpandedCategoryId(prev => prev === id ? null : id);
  };

  const categoriesToRender = categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  // Filter categories and subcategories based on search query
  const filteredCategories = categoriesToRender.map(cat => {
    const matchedSubs = cat.subcategories.filter(sub => 
      sub.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    // Check if category itself matches
    const nameMatches = cat.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return {
      ...cat,
      // If category itself matches, show all its subcategories, otherwise only matched ones
      matchedSubcategories: nameMatches ? cat.subcategories : matchedSubs,
      matches: nameMatches || matchedSubs.length > 0
    };
  }).filter(cat => cat.matches);

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <header className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center">
          <button
            onClick={() => onNavigate('home')}
            className="p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
            aria-label="Back to home"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="ml-2">
            <h1 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">
              {category ? `${category.name}` : 'All Categories'}
            </h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
              {category ? 'Browse Subcategories' : 'Choose a classification'}
            </p>
          </div>
        </div>
        <div className="text-[10px] text-primary dark:text-teal-400 bg-primary/10 dark:bg-teal-400/10 px-2.5 py-1 rounded-full font-bold uppercase tracking-tight">
          {categoriesToRender.length} Main categories
        </div>
      </header>

      {/* Search Input for filtering */}
      <div className="relative flex items-center">
        <input
          type="text"
          placeholder="Search and filter categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-surface text-gray-800 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary dark:focus:ring-teal-400/20 dark:focus:border-teal-400 shadow-sm text-sm transition-all placeholder-gray-400"
        />
        <svg className="w-4 h-4 text-gray-400 absolute left-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute right-3 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-white uppercase font-bold"
          >
            Clear
          </button>
        )}
      </div>

      {/* Categories Accordion List */}
      <div className="space-y-3">
        {filteredCategories.length > 0 ? (
          filteredCategories.map((cat) => {
            const isExpanded = expandedCategoryId === cat.id || searchQuery.length > 0;
            return (
              <div 
                key={cat.id} 
                className={`bg-white dark:bg-dark-surface rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isExpanded 
                    ? 'shadow-md border-primary/20 dark:border-teal-500/20 ring-1 ring-primary/5 dark:ring-teal-500/5' 
                    : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 shadow-sm'
                }`}
              >
                {/* Accordion Trigger */}
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/25"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors ${
                      isExpanded 
                        ? 'bg-primary/10 text-primary dark:bg-teal-500/10 dark:text-teal-400' 
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      <div className="w-5 h-5 flex items-center justify-center">
                        {renderIconByKey(cat.icon)}
                      </div>
                    </div>
                    <div>
                      <h3 className={`font-bold transition-colors ${
                        isExpanded ? 'text-primary dark:text-teal-400 text-sm md:text-base' : 'text-gray-800 dark:text-gray-200 text-sm md:text-base'
                      }`}>
                        {cat.name}
                      </h3>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                        {cat.subcategories.length} Subcategories
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider hidden sm:inline-block">
                      {isExpanded ? 'Collapse' : 'Expand'}
                    </span>
                    <div className={`p-1 rounded-lg transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-primary/10 text-primary dark:bg-teal-500/10 dark:text-teal-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </button>

                {/* Dropdown Content */}
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isExpanded ? 'max-h-[1000px] opacity-100 py-3 border-t border-gray-50 dark:border-gray-800' : 'max-h-0 opacity-0 pointer-events-none'
                  }`}
                >
                  <div className="px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {cat.matchedSubcategories.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => onListingNavigate('listings', sub.name)}
                        className="flex items-center justify-between p-3 bg-gray-50 hover:bg-primary/5 dark:bg-gray-800/50 dark:hover:bg-teal-500/5 rounded-xl transition-all text-left border border-transparent hover:border-primary/10 dark:hover:border-teal-400/10 active:scale-[0.98]"
                      >
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate pr-2">{sub.name}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))}
                    {cat.matchedSubcategories.length === 0 && (
                      <div className="col-span-full py-4 text-center text-xs text-gray-400">
                        No subcategories found.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-gray-800">
            <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-bold text-gray-900 dark:text-white">No categories found</h3>
            <p className="mt-1 text-xs text-gray-500">Try searching for something else.</p>
            <button 
              onClick={() => setSearchQuery('')}
              className="mt-4 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-md"
            >
              Reset Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubCategoryPage;
