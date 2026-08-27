import React, { useState, useMemo } from 'react';
import { calculateDiscountAndGst, DiscountInput, DiscountResult } from '../../../services/toolsService';

interface DiscountGstToolProps {
  isUrdu: boolean;
  onCopy: (text: string, msg?: string) => void;
}

export const DiscountGstTool: React.FC<DiscountGstToolProps> = ({ isUrdu, onCopy }) => {
  const [params, setParams] = useState<DiscountInput>({
    originalPrice: 4500,
    discountPercent: 20,
    salesTaxPercent: 18,
  });

  const result: DiscountResult = useMemo(() => {
    return calculateDiscountAndGst(params);
  }, [params]);

  return (
    <div className="space-y-8" id="discount-gst-container">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-950 to-emerald-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
            💰 Price & FBR / Sales Tax Calculator
          </span>
          <span className="text-xs text-emerald-200/80">
            {isUrdu ? 'فوری ڈسکاؤنٹ اور جی ایس ٹی کا حساب' : 'Instant Discount & Tax Calculation'}
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
          {isUrdu ? 'ڈسکاؤنٹ اور سیلز ٹیکس (GST / VAT) کیلکولیٹر' : 'Sales Discount & Pakistan GST / Tax Calculator'}
        </h2>
        <p className="text-emerald-100/90 text-sm sm:text-base max-w-3xl leading-relaxed">
          {isUrdu
            ? 'کسی بھی پروڈکٹ یا انوائس پر رعایت (Discount %)، سیلز ٹیکس (GST %) اور حتمی قابل ادائیگی رقم کا فوری اور درست حساب لگائیں۔'
            : 'Calculate exact discount savings, FBR sales tax (GST 18%), and final customer payable balance with complete breakdown.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Inputs */}
        <div className="lg:col-span-6 bg-white dark:bg-dark-surface border border-slate-200 dark:border-zinc-700/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-sm border-b border-slate-100 dark:border-zinc-700 pb-3">
            {isUrdu ? 'رقم اور فیصد درج کریں' : 'Input Pricing Values'}
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
              {isUrdu ? 'اصل قیمت (Original Price)' : 'Original Retail Price (Rs.)'} *
            </label>
            <input
              type="number"
              min="0"
              value={params.originalPrice || ''}
              onChange={(e) => setParams({ ...params, originalPrice: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white font-semibold text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
              {isUrdu ? 'رعایت کی شرح (Discount %)' : 'Discount Percentage (%)'}
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={params.discountPercent || ''}
              onChange={(e) => setParams({ ...params, discountPercent: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white font-semibold text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
              {isUrdu ? 'سیلز ٹیکس شرح (GST / Sales Tax %)' : 'Sales Tax / GST Percentage (%)'}
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={params.salesTaxPercent || ''}
              onChange={(e) => setParams({ ...params, salesTaxPercent: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white font-semibold text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">Standard Pakistan Sales Tax / GST is 18%</p>
          </div>
        </div>

        {/* Output Card */}
        <div className="lg:col-span-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
            {isUrdu ? 'حتمی حساب' : 'Final Price Breakdown'}
          </div>

          <div className="mb-4">
            <div className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Final Payable Amount</div>
            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-700 dark:text-emerald-400">
              Rs. {result.finalPrice.toLocaleString()}
            </div>
          </div>

          <div className="space-y-2.5 text-xs border-t border-emerald-200/80 dark:border-emerald-800/80 pt-4 text-slate-700 dark:text-zinc-300">
            <div className="flex justify-between">
              <span>Original Price:</span>
              <span className="font-bold">Rs. {params.originalPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
              <span>You Save (Discount {params.discountPercent}%):</span>
              <span>- Rs. {result.discountAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Price after Discount:</span>
              <span className="font-medium">Rs. {result.priceAfterDiscount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-zinc-400">
              <span>Sales Tax / GST ({params.salesTaxPercent}%):</span>
              <span>+ Rs. {result.taxAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
