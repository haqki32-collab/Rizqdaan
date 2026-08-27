import React, { useState, useMemo } from 'react';
import { calculateEcommerceProfit, ProfitCalculationInput, ProfitCalculationResult } from '../../../services/toolsService';

interface ProfitLossCalculatorToolProps {
  isUrdu: boolean;
  onCopy: (text: string, msg?: string) => void;
}

export const ProfitLossCalculatorTool: React.FC<ProfitLossCalculatorToolProps> = ({ isUrdu, onCopy }) => {
  const [params, setParams] = useState<ProfitCalculationInput>({
    costPrice: 850,
    sellingPrice: 1999,
    deliveryFeePaidBySeller: 220,
    packagingCost: 40,
    adCostPerOrder: 350,
    platformFeePercent: 0,
    returnRatePercent: 12,
    expectedMonthlySales: 300,
  });

  const result: ProfitCalculationResult = useMemo(() => {
    return calculateEcommerceProfit(params);
  }, [params]);

  const updateParam = (key: keyof ProfitCalculationInput, value: number) => {
    setParams(prev => ({ ...prev, [key]: isNaN(value) ? 0 : Math.max(0, value) }));
  };

  const shareSummary = `📊 *E-Commerce & Courier Profit Report (RizqDaan)*
━━━━━━━━━━━━━━━━━━━━
🛍️ Selling Price: Rs. ${params.sellingPrice.toLocaleString()}
📦 Wholesale Cost: Rs. ${params.costPrice.toLocaleString()}
🚚 Delivery & Packaging: Rs. ${(params.deliveryFeePaidBySeller + params.packagingCost).toLocaleString()}
📢 Ad Cost (CAC): Rs. ${params.adCostPerOrder.toLocaleString()}
🔄 Return (RTO) Rate: ${params.returnRatePercent}%
━━━━━━━━━━━━━━━━━━━━
💰 *Net Profit / Unit:* Rs. ${result.netProfitPerUnit.toLocaleString()}
📈 *Profit Margin:* ${result.profitMarginPercent}%
🚀 *ROI:* ${result.roiPercent}%
💵 *Monthly Net Profit:* Rs. ${result.projectedMonthlyNetProfit.toLocaleString()}
━━━━━━━━━━━━━━━━━━━━
Calculate yours free on RizqDaan Tools: https://rizqdaan.com/?tool=profit-calculator`;

  return (
    <div className="space-y-8" id="profit-calculator-container">
      {/* Tool Header & Badge */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
            🇵🇰 Pakistan E-Commerce & COD Courier Specialist
          </span>
          <span className="text-xs text-emerald-200/80">
            {isUrdu ? '100% مفت اور درست منافع کا حساب' : '100% Free & Accurate Profit Estimator'}
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
          {isUrdu ? 'منافع اور نقصان کا کیلکولیٹر (ای کامرس اور کورئیر واپسی کا تخمینہ)' : 'E-Commerce Profit & Loss Calculator with Courier Return (RTO) Loss'}
        </h2>
        <p className="text-emerald-100/90 text-sm sm:text-base max-w-3xl leading-relaxed">
          {isUrdu 
            ? 'اپنی مصنوعات کی اصل لاگت، فیس بک اور ٹک ٹاک اشتہاری خرچ، پیکجنگ، کورئیر چارجز اور پارسل واپسی (RTO) کو شامل کر کے خالص منافع اور ماہانہ آمدنی کا قطعی حساب لگائیں۔'
            : 'Accurately compute net margins, Facebook/TikTok ad cost (CAC), delivery expenses, and courier return losses (COD) for your online business in Pakistan.'}
        </p>
      </div>

      {/* Main Grid: Inputs + Output Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: Inputs */}
        <div className="lg:col-span-7 bg-white dark:bg-dark-surface border border-slate-200 dark:border-zinc-700/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-700 pb-3">
            <h3 className="font-semibold text-slate-800 dark:text-zinc-100 text-base flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              {isUrdu ? 'قیمت اور اخراجات درج کریں (PKR)' : 'Product Pricing & Operational Costs (PKR)'}
            </h3>
            <button 
              type="button"
              onClick={() => setParams({
                costPrice: 900,
                sellingPrice: 2200,
                deliveryFeePaidBySeller: 230,
                packagingCost: 50,
                adCostPerOrder: 400,
                platformFeePercent: 0,
                returnRatePercent: 15,
                expectedMonthlySales: 250,
              })}
              className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-medium underline"
            >
              {isUrdu ? 'مثالی ڈیٹا لوڈ کریں' : 'Reset / Load Sample'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Selling Price */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                {isUrdu ? 'فروخت کی قیمت (Selling Price)' : 'Customer Selling Price (Rs.)'} *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-medium">Rs.</span>
                <input
                  type="number"
                  min="0"
                  value={params.sellingPrice || ''}
                  onChange={(e) => updateParam('sellingPrice', parseFloat(e.target.value))}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white font-semibold text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. 2000"
                />
              </div>
            </div>

            {/* Wholesale Cost */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                {isUrdu ? 'خریداری لاگت (Wholesale Cost)' : 'Product Sourcing / Cost Price (Rs.)'} *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-medium">Rs.</span>
                <input
                  type="number"
                  min="0"
                  value={params.costPrice || ''}
                  onChange={(e) => updateParam('costPrice', parseFloat(e.target.value))}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white font-semibold text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. 850"
                />
              </div>
            </div>

            {/* Ad Cost per order (CAC) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                {isUrdu ? 'فی آرڈر اشتہاری خرچ (Ad Spend / CAC)' : 'Marketing / Ad Cost per Order (CAC)'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-medium">Rs.</span>
                <input
                  type="number"
                  min="0"
                  value={params.adCostPerOrder || ''}
                  onChange={(e) => updateParam('adCostPerOrder', parseFloat(e.target.value))}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. 350"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Facebook / TikTok Ads cost per closed sale</p>
            </div>

            {/* Delivery Fee Paid by Seller */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                {isUrdu ? 'کورئیر چارجز (Courier Delivery Fee)' : 'Courier Delivery Fee Paid by Seller'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-medium">Rs.</span>
                <input
                  type="number"
                  min="0"
                  value={params.deliveryFeePaidBySeller || ''}
                  onChange={(e) => updateParam('deliveryFeePaidBySeller', parseFloat(e.target.value))}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. 220"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Trax / Leopards / PostEx / TCS avg delivery</p>
            </div>

            {/* Packaging Material Cost */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                {isUrdu ? 'پیکجنگ فلائر و باکس خرچ' : 'Flyer, Box & Packaging Cost (Rs.)'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-medium">Rs.</span>
                <input
                  type="number"
                  min="0"
                  value={params.packagingCost || ''}
                  onChange={(e) => updateParam('packagingCost', parseFloat(e.target.value))}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. 40"
                />
              </div>
            </div>

            {/* Courier Return / RTO % */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                {isUrdu ? 'پارسل واپسی شرح (Return / RTO %)' : 'Courier Return / Cancellation Rate (RTO %)'} *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={params.returnRatePercent || ''}
                  onChange={(e) => updateParam('returnRatePercent', parseFloat(e.target.value))}
                  className="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white font-semibold text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. 15"
                />
                <span className="absolute right-3 top-2.5 text-slate-400 text-sm font-bold">%</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Avg in Pakistan COD: 10% - 20%</p>
            </div>

            {/* Platform / Daraz commission % */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                {isUrdu ? 'پلیٹ فارم کمیشن (Daraz / Shopify %)' : 'Marketplace / Gateway Fee (%)'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={params.platformFeePercent || ''}
                  onChange={(e) => updateParam('platformFeePercent', parseFloat(e.target.value))}
                  className="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="0 (e.g. 15 for Daraz)"
                />
                <span className="absolute right-3 top-2.5 text-slate-400 text-sm font-bold">%</span>
              </div>
            </div>

            {/* Expected Monthly Orders */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                {isUrdu ? 'ماہانہ متوقع آرڈرز کی تعداد' : 'Expected Dispatches / Month'}
              </label>
              <input
                type="number"
                min="1"
                value={params.expectedMonthlySales || ''}
                onChange={(e) => updateParam('expectedMonthlySales', parseFloat(e.target.value))}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white font-semibold text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="e.g. 300"
              />
            </div>
          </div>
        </div>

        {/* Right Card: Dynamic Profit & Margins Output */}
        <div className="lg:col-span-5 space-y-4">
          <div className={`rounded-2xl p-6 border shadow-md transition-all ${
            result.status === 'highly_profitable'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80'
              : result.status === 'moderate'
              ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/80'
              : result.status === 'low_margin'
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/80'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/80'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                {isUrdu ? 'خالص منافع خلاصہ' : 'Unit Profit Breakdown'}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                result.status === 'highly_profitable'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                  : result.status === 'moderate'
                  ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200'
                  : result.status === 'low_margin'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200'
              }`}>
                {result.status === 'highly_profitable' && (isUrdu ? '🌟 شاندار منافع' : '🌟 High Margin')}
                {result.status === 'moderate' && (isUrdu ? '✅ مناسب منافع' : '✅ Healthy Margin')}
                {result.status === 'low_margin' && (isUrdu ? '⚠️ کم منافع' : '⚠️ Low Margin')}
                {result.status === 'loss_making' && (isUrdu ? '❌ نقصان میں جا رہا ہے' : '❌ Loss Making')}
              </span>
            </div>

            {/* Big Net Profit Figure */}
            <div className="mb-6">
              <div className="text-xs text-slate-500 dark:text-zinc-400 mb-1">
                {isUrdu ? 'فی آرڈر خالص منافع (Net Profit / Delivered Unit)' : 'Net Profit per Successful Order'}
              </div>
              <div className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
                result.netProfitPerUnit > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                Rs. {result.netProfitPerUnit.toLocaleString()}
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs font-semibold text-slate-600 dark:text-zinc-300">
                <span>Margin: <strong className="text-emerald-600 dark:text-emerald-400">{result.profitMarginPercent}%</strong></span>
                <span>•</span>
                <span>ROI: <strong className="text-teal-600 dark:text-teal-400">{result.roiPercent}%</strong></span>
              </div>
            </div>

            {/* Metrics Rows */}
            <div className="space-y-2.5 text-xs border-t border-slate-200/80 dark:border-zinc-700/80 pt-4">
              <div className="flex justify-between text-slate-600 dark:text-zinc-300">
                <span>{isUrdu ? 'فی پارسل کل اصل لاگت (بشمول واپسی)' : 'Total Cost per Unit (incl. RTO):'}</span>
                <span className="font-bold text-slate-900 dark:text-white">Rs. {result.totalCostPerUnit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-zinc-300">
                <span>{isUrdu ? 'واپسی (RTO) کا فی پارسل اوسط نقصان:' : 'Courier Return Loss per Dispatched Order:'}</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400">Rs. {result.returnCostLossPerOrder.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-zinc-300">
                <span>{isUrdu ? 'کم سے کم بریک ایون قیمت (Break-even):' : 'Minimum Break-Even Selling Price:'}</span>
                <span className="font-semibold text-slate-900 dark:text-white">Rs. {result.breakEvenPrice.toLocaleString()}</span>
              </div>
            </div>

            {/* Monthly Projection */}
            <div className="mt-5 p-4 rounded-xl bg-white/80 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700">
              <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-2">
                {isUrdu ? `ماہانہ تخمینہ (${params.expectedMonthlySales} آرڈرز)` : `Monthly Projection (${params.expectedMonthlySales} Orders)`}
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900/50">
                  <div className="text-[11px] text-slate-500">Gross Revenue</div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    Rs. {result.projectedMonthlyRevenue.toLocaleString()}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/50">
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">Net Income</div>
                  <div className="font-extrabold text-emerald-700 dark:text-emerald-400 text-sm">
                    Rs. {result.projectedMonthlyNetProfit.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-4">
              <button
                type="button"
                onClick={() => onCopy(shareSummary, isUrdu ? 'رپورٹ کاپی ہو گئی!' : 'Profit summary copied!')}
                className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow flex items-center justify-center gap-1.5 transition"
              >
                📋 {isUrdu ? 'رپورٹ کاپی کریں' : 'Copy Profit Report'}
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(shareSummary)}`}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow flex items-center justify-center gap-1 transition"
                title="Share on WhatsApp"
              >
                💬 WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* SEO & Educational Guide Section (Google Ranking Booster) */}
      <div className="bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700/80 rounded-2xl p-6 sm:p-8 space-y-6">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {isUrdu ? 'پاکستان میں ای کامرس کاروبار کا منافع کیسے نکالا جاتا ہے؟' : 'How to Accurately Calculate E-Commerce Profit in Pakistan (2026 Guide)'}
          </h3>
          <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">
            Many online sellers in Pakistan mistakenly calculate profit as <code>Selling Price - Wholesale Price</code>, leading to unexpected cash flow crises. In real COD (Cash on Delivery) operations, courier return ratios (10% to 25%), Facebook/TikTok ad burn, packaging flyers, and courier return penalties heavily impact your bottom line.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm">
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 space-y-1.5">
            <div className="font-bold text-emerald-600 dark:text-emerald-400">1. Factor in Courier RTO (Return)</div>
            <p className="text-slate-500 dark:text-zinc-400">
              When a parcel is returned in COD, you lose delivery cost both ways plus packaging and ad spend without earning revenue.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 space-y-1.5">
            <div className="font-bold text-teal-600 dark:text-teal-400">2. Customer Acquisition Cost (CAC)</div>
            <p className="text-slate-500 dark:text-zinc-400">
              Keep ad spend per sale under 25% of your product's selling price to ensure a healthy 30%+ profit margin.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 space-y-1.5">
            <div className="font-bold text-blue-600 dark:text-blue-400">3. 3X Pricing Rule</div>
            <p className="text-slate-500 dark:text-zinc-400">
              For high profitability in Pakistan ecommerce, your selling price should ideally be 2.5x to 3x your wholesale sourcing cost.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
