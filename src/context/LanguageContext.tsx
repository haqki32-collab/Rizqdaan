import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '../../types';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
  isUrdu: boolean;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    appName: 'RizqDaan',
    home: 'Home',
    allListings: 'All Listings',
    vendorDashboard: 'Vendor Dashboard',
    adminPanel: 'Admin Panel',
    chats: 'Chats',
    myAds: 'My Ads',
    account: 'Account',
    postAd: 'Post Ad',
    searchPlaceholder: 'Search anything (e.g. iPhone, AC, Lahore)...',
    voiceSearch: 'Voice Search',
    listening: 'Listening... Speak now',
    voiceError: 'Voice search not available on this browser',
    nearMe: 'Near Me',
    categories: 'Categories',
    viewAll: 'View All',
    seeAll: 'See All',
    featuredListings: 'Featured Listings',
    freshRecommendations: 'Fresh Recommendations',
    noItems: 'No items found',
    tryDifferentSearch: 'Try a different search or filter.',
    filters: 'Filters',
    askingPrice: 'Asking Price',
    rs: 'Rs.',
    savePercent: 'Save',
    chatNow: 'CHAT NOW',
    whatsapp: 'WHATSAPP',
    callSeller: 'CALL SELLER',
    shareOnWhatsApp: 'Share via WhatsApp',
    shareAd: 'Share Ad',
    copyLink: 'Copy Link',
    linkCopied: 'Link copied to clipboard!',
    reportAd: 'Report Ad',
    reportTitle: 'Report this Listing',
    reportDesc: 'Help us keep RizqDaan safe. Please select why you are reporting this ad:',
    reportReason: 'Reason for report',
    reportDetails: 'Additional details (optional)',
    reportSubmit: 'Submit Report',
    reportSuccess: 'Thank you! Your report has been submitted for review.',
    writeReview: 'WRITE REVIEW',
    customerFeedback: 'Customer Feedback',
    howWasExperience: 'How was your experience?',
    reviewPlaceholder: 'Tell other buyers about product quality, seller communication, etc...',
    postReview: 'POST REVIEW',
    reviewSuccess: 'Review posted successfully!',
    noReviewsYet: 'No reviews yet. Be the first to share!',
    soldBy: 'Sold By',
    verifiedMerchant: 'Verified Merchant',
    visitStorefront: 'Visit Storefront',
    aboutThisItem: 'About This Item',
    youMightAlsoLike: 'You Might Also Like',
    location: 'Location',
    currentLocation: 'Current Location',
    allPakistan: 'Pakistan',
    selectCity: 'Select City',
    changeLanguage: 'Language / زبان',
    settings: 'Settings',
    darkMode: 'Dark Mode',
    notifications: 'Notifications',
    deleteAccount: 'Delete Account',
    logout: 'Log Out',
    login: 'Log In',
    signup: 'Sign Up',
    availableBalance: 'Available Balance',
    addFunds: '+ Add Funds',
    manageMyAds: 'Manage My Ads',
    viewAnalytics: 'View Analytics',
    promoteBusiness: 'Promote Business',
    referEarn: 'Refer & Earn',
    helpCenter: 'Help Center',
  },
  ur: {
    appName: 'رزق دان',
    home: 'ہوم',
    allListings: 'تمام اشتہارات',
    vendorDashboard: 'دکان ڈیش بورڈ',
    adminPanel: 'ایڈمن پینل',
    chats: 'پیغامات',
    myAds: 'میرے اشتہارات',
    account: 'اکاؤنٹ',
    postAd: 'نیا اشتہار لگائیں',
    searchPlaceholder: 'کچھ بھی تلاش کریں (مثلاً موبائل، اے سی، لاہور)...',
    voiceSearch: 'بول کر تلاش کریں',
    listening: 'سن رہے ہیں... اب بولیں',
    voiceError: 'اس براؤزر پر وائس سرچ سپورٹڈ نہیں ہے',
    nearMe: 'میرے قریب',
    categories: 'کیٹیگریز',
    viewAll: 'سب دیکھیں',
    seeAll: 'تمام دیکھیں',
    featuredListings: '🔥 خاص اشتہارات',
    freshRecommendations: 'تازہ ترین اشتہارات',
    noItems: 'کوئی اشتہار نہیں ملا',
    tryDifferentSearch: 'کوئی اور نام یا کیٹیگری منتخب کریں۔',
    filters: 'فلٹرز',
    askingPrice: 'قیمت',
    rs: 'روپے',
    savePercent: 'بچت',
    chatNow: 'چیٹ کریں',
    whatsapp: 'واٹس ایپ',
    callSeller: 'کال کریں',
    shareOnWhatsApp: 'واٹس ایپ پر شیئر کریں',
    shareAd: 'اشتہار شیئر کریں',
    copyLink: 'لنک کاپی کریں',
    linkCopied: 'لنک کاپی ہو گیا ہے!',
    reportAd: 'اشتہار رپورٹ کریں',
    reportTitle: 'اس اشتہار کی رپورٹ کریں',
    reportDesc: 'رزق دان کو محفوظ رکھنے کے لیے بتائیں کہ آپ یہ اشتہار کیوں رپورٹ کر رہے ہیں:',
    reportReason: 'رپورٹ کی وجہ',
    reportDetails: 'مزید تفصیلات (اختیاری)',
    reportSubmit: 'رپورٹ جمع کروائیں',
    reportSuccess: 'شکریہ! آپ کی رپورٹ موصول ہو گئی ہے اور جلد کارروائی کی جائے گی۔',
    writeReview: 'ریویو لکھیں',
    customerFeedback: 'خریداروں کے ریویوز',
    howWasExperience: 'آپ کا تجربہ کیسا رہا؟',
    reviewPlaceholder: 'دیگر خریداروں کو بتائیں کہ چیز کیسی تھی اور بیچنے والے کا رویہ کیسا رہا...',
    postReview: 'ریویو بھیجیں',
    reviewSuccess: 'ریویو کامیابی سے شامل ہو گیا!',
    noReviewsYet: 'ابھی تک کوئی ریویو نہیں ہے۔ آپ پہلا ریویو دیں!',
    soldBy: 'فروخت کنندہ',
    verifiedMerchant: 'تصدیق شدہ تاجر',
    visitStorefront: 'دکان دیکھیں',
    aboutThisItem: 'چیز کی تفصیلات',
    youMightAlsoLike: 'آپ کو یہ بھی پسند آ سکتا ہے',
    location: 'مقام',
    currentLocation: 'موجودہ مقام',
    allPakistan: 'پورا پاکستان',
    selectCity: 'شہر منتخب کریں',
    changeLanguage: 'Language / زبان',
    settings: 'سیٹنگز',
    darkMode: 'ڈارک موڈ',
    notifications: 'نوٹیفیکیشنز',
    deleteAccount: 'اکاؤنٹ ڈیلیٹ کریں',
    logout: 'لاگ آؤٹ',
    login: 'لاگ ان',
    signup: 'سائن اپ',
    availableBalance: 'موجودہ بیلنس',
    addFunds: '+ پیسے جمع کریں',
    manageMyAds: 'میرے اشتہارات سنبھالیں',
    viewAnalytics: 'شماریات دیکھیں',
    promoteBusiness: 'کاروبار پروموٹ کریں',
    referEarn: 'دوستوں کو لائیں، کمائیں',
    helpCenter: 'مدد سینٹر',
  }
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key: string) => key,
  isUrdu: false,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('rizqdaan_lang');
    return (saved === 'ur' || saved === 'en') ? saved : 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('rizqdaan_lang', lang);
    if (lang === 'ur') {
      document.documentElement.setAttribute('lang', 'ur');
    } else {
      document.documentElement.setAttribute('lang', 'en');
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ur' : 'en');
  };

  const t = (key: string, fallback?: string): string => {
    return translations[language]?.[key] || fallback || translations['en']?.[key] || key;
  };

  useEffect(() => {
    document.documentElement.setAttribute('lang', language);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, isUrdu: language === 'ur' }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
