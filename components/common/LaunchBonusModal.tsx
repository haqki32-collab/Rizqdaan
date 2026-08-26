import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../src/context/LanguageContext';
import { getLaunchBonusStats, LaunchBonusConfig } from '../../services/bonusService';

interface LaunchBonusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaim: () => void;
  isLoggedIn: boolean;
  hasClaimedBonus?: boolean;
}

export const LaunchBonusModal: React.FC<LaunchBonusModalProps> = ({
  isOpen,
  onClose,
  onClaim,
  isLoggedIn,
  hasClaimedBonus = false
}) => {
  const { isUrdu } = useLanguage();
  const [stats, setStats] = useState<LaunchBonusConfig>({
    maxSpots: 50,
    claimedCount: 14,
    bonusAmount: 1000,
    isActive: true
  });

  useEffect(() => {
    getLaunchBonusStats().then(setStats).catch(() => {});
  }, []);

  if (!isOpen) return null;

  const remainingSpots = Math.max(0, stats.maxSpots - stats.claimedCount);
  const percentClaimed = Math.min(100, Math.round((stats.claimedCount / stats.maxSpots) * 100));

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-gradient-to-b from-white to-gray-50 dark:from-dark-surface dark:to-gray-900 rounded-3xl shadow-2xl border-2 border-amber-400/40 dark:border-amber-500/30 overflow-hidden text-gray-800 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Banner */}
        <div className="bg-gradient-to-r from-amber-500 via-primary to-teal-600 px-6 py-4 text-white relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <span className="bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border border-white/30 text-amber-200">
                🔥 {isUrdu ? 'محدود مدت کی آفر' : 'LIMITED TIME OFFER'}
              </span>
              <span className="text-xs font-bold bg-amber-400 text-gray-900 px-2 py-0.5 rounded-full shadow-sm">
                {isUrdu ? 'صرف پہلے 50 صارفین' : 'First 50 Users Only'}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              title="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mt-3 text-center">
            <div className="inline-block text-4xl sm:text-5xl animate-bounce mb-1">🎁</div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              {isUrdu ? '1,000 روپے کا مفت سائن اپ بونس!' : 'Get Rs. 1,000 Free Bonus!'}
            </h2>
            <p className="text-xs sm:text-sm text-white/90 mt-1 font-medium">
              {isUrdu 
                ? 'سائن اپ کریں اور پہلا اشتہار لگا کر 1000 روپے وصول کریں!' 
                : 'Sign up & post your first listing to receive Rs. 1,000 automatically!'}
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Progress Bar (Spots Claimed) */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-3.5">
            <div className="flex justify-between items-center text-xs font-black mb-1.5">
              <span className="text-amber-800 dark:text-amber-300 flex items-center gap-1">
                <span>⚡</span>
                <span>{isUrdu ? `کل سیٹیں: ${stats.maxSpots}` : `Total Spots: ${stats.maxSpots}`}</span>
              </span>
              <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">
                {isUrdu ? `صرف ${remainingSpots} باقی ہیں!` : `Only ${remainingSpots} spots left!`}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden p-0.5">
              <div 
                className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-1000 ease-out shadow-sm"
                style={{ width: `${percentClaimed}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center mt-1 font-semibold">
              {isUrdu 
                ? `${stats.claimedCount} صارفین اب تک یہ بونس حاصل کر چکے ہیں` 
                : `${stats.claimedCount} vendors have already claimed their Rs. 1,000 bonus`}
            </p>
          </div>

          {/* 3 Step Instruction Cards */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">
              {isUrdu ? 'بونس کیسے حاصل کریں؟' : 'How to Claim Your Rs. 1,000:'}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Step 1 */}
              <div className="bg-white dark:bg-dark-surface p-3 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex sm:flex-col items-center text-left sm:text-center gap-3 sm:gap-1.5">
                <span className="w-7 h-7 flex-shrink-0 bg-primary/10 text-primary rounded-full flex items-center justify-center font-black text-xs">
                  1
                </span>
                <div>
                  <h5 className="text-xs font-black text-gray-800 dark:text-gray-100">
                    {isUrdu ? 'اکاؤنٹ بنائیں' : 'Sign Up Free'}
                  </h5>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight mt-0.5">
                    {isUrdu ? 'سائن اپ کریں یا لاگ ان کریں' : 'Register your vendor account'}
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-white dark:bg-dark-surface p-3 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex sm:flex-col items-center text-left sm:text-center gap-3 sm:gap-1.5">
                <span className="w-7 h-7 flex-shrink-0 bg-amber-500/10 text-amber-600 rounded-full flex items-center justify-center font-black text-xs">
                  2
                </span>
                <div>
                  <h5 className="text-xs font-black text-gray-800 dark:text-gray-100">
                    {isUrdu ? 'پہلا اشتہار لگائیں' : 'Post 1st Listing'}
                  </h5>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight mt-0.5">
                    {isUrdu ? 'پروڈکٹ یا دکان کا اشتہار درج کریں' : 'List your product or service'}
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-white dark:bg-dark-surface p-3 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm flex sm:flex-col items-center text-left sm:text-center gap-3 sm:gap-1.5">
                <span className="w-7 h-7 flex-shrink-0 bg-emerald-600 text-white rounded-full flex items-center justify-center font-black text-xs">
                  ✓
                </span>
                <div>
                  <h5 className="text-xs font-black text-emerald-700 dark:text-emerald-300">
                    {isUrdu ? '1,000 روپے والٹ میں' : 'Get Rs. 1,000'}
                  </h5>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight mt-0.5">
                    {isUrdu ? 'اشتہار کو مفت Featured کریں' : 'Use it to Feature your ad'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bonus Highlight Info */}
          <div className="bg-teal-50 dark:bg-teal-950/30 rounded-xl p-3 border border-teal-200 dark:border-teal-800/40 flex items-start gap-2.5">
            <span className="text-lg">⭐</span>
            <p className="text-xs text-teal-900 dark:text-teal-200 leading-relaxed font-medium">
              {isUrdu 
                ? 'اس 1,000 روپے سے آپ اپنے اشتہار کو سرچ میں سب سے اوپر (Featured Listing) لا سکتے ہیں تاکہ لاکھوں خریدار آپ سے فوری رابطہ کریں۔' 
                : 'You can use this Rs. 1,000 balance directly to make your post a FEATURED listing on top of searches and attract 10x more customers!'}
            </p>
          </div>

          {/* Call to Action Button */}
          <div className="space-y-2 pt-1">
            {hasClaimedBonus ? (
              <div className="w-full py-3.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-black text-center rounded-2xl border border-emerald-300 dark:border-emerald-700 text-sm">
                ✅ {isUrdu ? 'آپ کو 1,000 روپے بونس مل چکا ہے!' : 'You have already claimed this Rs. 1,000 bonus!'}
              </div>
            ) : (
              <button
                type="button"
                onClick={onClaim}
                className="w-full py-4 bg-gradient-to-r from-amber-500 via-primary to-teal-600 hover:from-amber-600 hover:to-teal-700 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-primary/30 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <span>🎉</span>
                <span>
                  {isLoggedIn 
                    ? (isUrdu ? 'ابھی اشتہار لگائیں اور بونس لیں' : 'Post Ad & Claim Rs. 1,000 Bonus') 
                    : (isUrdu ? 'سائن اپ کریں اور 1,000 روپے حاصل کریں' : 'Sign Up & Claim Rs. 1,000 Bonus')}
                </span>
                <span>➔</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
            >
              {isUrdu ? 'بعد میں دیکھیں (Dismiss)' : 'Maybe Later'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const LaunchBonusFloatingBadge: React.FC<{ onClick: () => void; isUrdu: boolean }> = ({ onClick, isUrdu }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 z-40 flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-amber-500 via-primary to-teal-600 text-white rounded-full shadow-2xl border-2 border-amber-300/80 hover:scale-105 active:scale-95 transition-all group animate-pulse"
      title={isUrdu ? '1000 روپے سائن اپ بونس آفر' : 'Rs. 1000 Signup Bonus Offer'}
    >
      <span className="text-base sm:text-lg animate-bounce">🎁</span>
      <div className="flex flex-col text-left">
        <span className="text-[10px] font-black uppercase tracking-wider text-amber-200 leading-none">
          {isUrdu ? 'مفت بونس' : 'FREE BONUS'}
        </span>
        <span className="text-xs font-black leading-tight text-white">
          {isUrdu ? '1,000 روپے آفر' : 'Rs. 1,000 Offer'}
        </span>
      </div>
      <span className="bg-white/20 text-[9px] font-bold px-1.5 py-0.5 rounded-full backdrop-blur-sm">
        50 {isUrdu ? 'صارفین' : 'Spots'}
      </span>
    </button>
  );
};
