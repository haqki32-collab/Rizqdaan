import React, { useState, useMemo } from 'react';
import { InvoiceData, InvoiceItem } from '../../../services/toolsService';

interface InvoiceKhataToolProps {
  isUrdu: boolean;
  userPhone?: string;
  onCopy: (text: string, msg?: string) => void;
}

export const InvoiceKhataTool: React.FC<InvoiceKhataToolProps> = ({ isUrdu, userPhone, onCopy }) => {
  const [data, setData] = useState<InvoiceData>({
    invoiceNumber: 'INV-' + Math.floor(1000 + Math.random() * 9000),
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    template: 'modern',
    currency: 'PKR',
    shopName: 'Al-Madina Traders',
    shopPhone: userPhone || '0300-1234567',
    shopAddress: 'Shahrah-e-Faisal, Karachi, Pakistan',
    shopNtn: '',
    customerName: 'Muhammad Ali',
    customerPhone: '0321-9876543',
    customerAddress: 'Gulshan-e-Iqbal Block 13',
    customerCity: 'Karachi',
    items: [
      { id: '1', description: 'Wireless Bluetooth Earbuds (Black)', quantity: 2, unitPrice: 1850 },
      { id: '2', description: 'Fast Charger 20W USB-C', quantity: 1, unitPrice: 950 }
    ],
    shippingFee: 250,
    discountAmount: 150,
    taxPercent: 0,
    paidAmount: 0,
    notes: 'Thank you for your business! Warranty claims require original bill.',
    paymentMethod: 'Cash on Delivery (COD)'
  });

  const subtotal = useMemo(() => {
    return data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  }, [data.items]);

  const taxAmount = useMemo(() => {
    return Math.round(((subtotal - data.discountAmount) * data.taxPercent) / 100);
  }, [subtotal, data.discountAmount, data.taxPercent]);

  const totalAmount = useMemo(() => {
    return subtotal - data.discountAmount + taxAmount + data.shippingFee;
  }, [subtotal, data.discountAmount, taxAmount, data.shippingFee]);

  const balanceDue = useMemo(() => {
    return Math.max(0, totalAmount - data.paidAmount);
  }, [totalAmount, data.paidAmount]);

  const addItem = () => {
    setData(prev => ({
      ...prev,
      items: [...prev.items, { id: Date.now().toString(), description: 'New Item', quantity: 1, unitPrice: 500 }]
    }));
  };

  const removeItem = (id: string) => {
    if (data.items.length <= 1) return;
    setData(prev => ({
      ...prev,
      items: prev.items.filter(i => i.id !== id)
    }));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, val: any) => {
    setData(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === id ? { ...i, [field]: val } : i)
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const whatsappReceipt = `🧾 *Digital Receipt - ${data.shopName}*
Invoice #: ${data.invoiceNumber}
Date: ${data.date}
Customer: ${data.customerName}
━━━━━━━━━━━━━━━━━━━━
${data.items.map((it, idx) => `${idx + 1}. ${it.description} (x${it.quantity}) - Rs. ${(it.quantity * it.unitPrice).toLocaleString()}`).join('\n')}
━━━━━━━━━━━━━━━━━━━━
Subtotal: Rs. ${subtotal.toLocaleString()}
Delivery Fee: Rs. ${data.shippingFee.toLocaleString()}
${data.discountAmount > 0 ? `Discount: -Rs. ${data.discountAmount.toLocaleString()}\n` : ''}*Total Amount: Rs. ${totalAmount.toLocaleString()}*
Payment: ${data.paymentMethod}
━━━━━━━━━━━━━━━━━━━━
Thank you for shopping with ${data.shopName}! 🌸`;

  return (
    <div className="space-y-8" id="invoice-generator-container">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-emerald-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
            🧾 POS Receipt & Urdu Khata Maker
          </span>
          <span className="text-xs text-emerald-200/80">
            {isUrdu ? 'پرنٹ اور واٹس ایپ شیئر سپورٹ' : 'Printable & Instant WhatsApp Share'}
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
          {isUrdu ? 'ڈیجیٹل انوائس، بل اور اردو کھاتہ جنریٹر' : 'Digital Invoice, Bill & Urdu Khata Receipt Generator'}
        </h2>
        <p className="text-emerald-100/90 text-sm sm:text-base max-w-3xl leading-relaxed">
          {isUrdu
            ? 'اپنی دکان یا آن لائن برانڈ کے لیے چند سیکنڈ میں پیشہ ورانہ انوائس یا تھرمل رسید بنائیں، پی ڈی ایف پرنٹ کریں یا کسٹمر کو واٹس ایپ پر بھیجیں۔'
            : 'Generate branded PDF invoices, thermal POS receipts, and Urdu customer bills with automatic tax calculation and instant WhatsApp delivery.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Inputs (Hidden during print) */}
        <div className="lg:col-span-5 bg-white dark:bg-dark-surface border border-slate-200 dark:border-zinc-700/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 print:hidden">
          <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-sm border-b border-slate-100 dark:border-zinc-700 pb-3">
            Invoice Details
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">Invoice #</label>
              <input
                type="text"
                value={data.invoiceNumber}
                onChange={(e) => setData({ ...data, invoiceNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">Date</label>
              <input
                type="date"
                value={data.date}
                onChange={(e) => setData({ ...data, date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">Your Shop / Business Name</label>
              <input
                type="text"
                value={data.shopName}
                onChange={(e) => setData({ ...data, shopName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">Shop Phone / WhatsApp</label>
              <input
                type="text"
                value={data.shopPhone}
                onChange={(e) => setData({ ...data, shopPhone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">Customer Name</label>
              <input
                type="text"
                value={data.customerName}
                onChange={(e) => setData({ ...data, customerName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">Customer Phone</label>
              <input
                type="text"
                value={data.customerPhone}
                onChange={(e) => setData({ ...data, customerPhone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">Items / Products</span>
              <button
                type="button"
                onClick={addItem}
                className="text-xs text-emerald-600 font-semibold hover:underline"
              >
                + Add Item
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {data.items.map((item) => (
                <div key={item.id} className="flex gap-2 items-center text-xs">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    placeholder="Item name"
                    className="flex-1 px-2 py-1.5 bg-slate-50 dark:bg-zinc-800 border rounded-lg"
                  />
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                    className="w-14 px-2 py-1.5 bg-slate-50 dark:bg-zinc-800 border rounded-lg text-center"
                  />
                  <input
                    type="number"
                    min="0"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="w-20 px-2 py-1.5 bg-slate-50 dark:bg-zinc-800 border rounded-lg text-right"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-rose-500 hover:text-rose-700 px-1 font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">Delivery / Shipping Fee</label>
              <input
                type="number"
                min="0"
                value={data.shippingFee}
                onChange={(e) => setData({ ...data, shippingFee: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">Discount (Rs.)</label>
              <input
                type="number"
                min="0"
                value={data.discountAmount}
                onChange={(e) => setData({ ...data, discountAmount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs"
              />
            </div>
          </div>
        </div>

        {/* Live Invoice Preview & Actions */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex gap-2 print:hidden justify-end">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold shadow flex items-center gap-1.5 transition"
            >
              🖨️ Print / Save PDF
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(whatsappReceipt)}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow flex items-center gap-1.5 transition"
            >
              💬 WhatsApp Receipt
            </a>
          </div>

          {/* Printable Invoice Container */}
          <div className="bg-white text-slate-900 rounded-2xl p-6 sm:p-8 shadow-md border border-slate-200 font-sans space-y-6 print:border-none print:shadow-none print:p-0">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-6">
              <div>
                <h2 className="text-2xl font-extrabold text-emerald-800">{data.shopName}</h2>
                <div className="text-xs text-slate-500 mt-1">{data.shopAddress}</div>
                <div className="text-xs text-slate-500">Phone: {data.shopPhone}</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold uppercase tracking-wider text-slate-400">INVOICE</div>
                <div className="text-xs font-bold text-slate-800 mt-1">#{data.invoiceNumber}</div>
                <div className="text-xs text-slate-500">Date: {data.date}</div>
              </div>
            </div>

            {/* Bill To */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Billed To:</div>
                <div className="font-bold text-slate-800">{data.customerName}</div>
                <div className="text-slate-600">{data.customerAddress}</div>
                <div className="text-slate-600">{data.customerCity}</div>
                <div className="text-slate-600">Ph: {data.customerPhone}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Payment Details:</div>
                <div className="text-slate-700">{data.paymentMethod}</div>
              </div>
            </div>

            {/* Table */}
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-300 text-slate-600 uppercase font-semibold text-[10px]">
                  <th className="py-2">Description</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-right">Price</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((it) => (
                  <tr key={it.id}>
                    <td className="py-2.5 font-medium text-slate-800">{it.description}</td>
                    <td className="py-2.5 text-center text-slate-600">{it.quantity}</td>
                    <td className="py-2.5 text-right text-slate-600">Rs. {it.unitPrice.toLocaleString()}</td>
                    <td className="py-2.5 text-right font-bold text-slate-900">Rs. {(it.quantity * it.unitPrice).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end pt-2">
              <div className="w-64 space-y-1.5 text-xs text-slate-700 border-t border-slate-200 pt-3">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold">Rs. {subtotal.toLocaleString()}</span>
                </div>
                {data.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span>- Rs. {data.discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery:</span>
                  <span>+ Rs. {data.shippingFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-300 pt-2">
                  <span>Total Amount:</span>
                  <span className="text-emerald-800">Rs. {totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="border-t border-slate-100 pt-4 text-center text-[11px] text-slate-400">
              {data.notes}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
