import React, { useState } from 'react';

interface WhatsAppAndQrToolProps {
  isUrdu: boolean;
  onCopy: (text: string, msg?: string) => void;
}

export const WhatsAppAndQrTool: React.FC<WhatsAppAndQrToolProps> = ({ isUrdu, onCopy }) => {
  const [phoneNumber, setPhoneNumber] = useState('923001234567');
  const [message, setMessage] = useState('Assalam o Alaikum! Mujhe aapki product / listing ke baray me maloomat chahiye.');
  const [qrText, setQrText] = useState('https://rizqdaan.com');
  const [qrSize, setQrSize] = useState('250');

  // Format phone number clean
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '').replace(/^0/, '92');
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(qrText)}&color=002f34&bgcolor=ffffff&margin=1`;

  const downloadQr = async () => {
    try {
      const response = await fetch(qrCodeImageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'rizqdaan-qr-code.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      window.open(qrCodeImageUrl, '_blank');
    }
  };

  return (
    <div className="space-y-8" id="whatsapp-qr-container">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 to-teal-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
            📱 WhatsApp & QR Code Lead Magnet
          </span>
          <span className="text-xs text-emerald-200/80">
            {isUrdu ? 'بغیر نمبر محفوظ کیے ڈائریکٹ چیٹ' : 'Direct Chat Link & High-Res QR'}
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
          {isUrdu ? 'واٹس ایپ ڈائریکٹ چیٹ لنک اور کیو آر کوڈ جنریٹر' : 'WhatsApp Direct Chat Link & Custom QR Code Generator'}
        </h2>
        <p className="text-emerald-100/90 text-sm sm:text-base max-w-3xl leading-relaxed">
          {isUrdu
            ? 'کسٹمرز کے لیے پہلے سے لکھا ہوا واٹس ایپ میسج لنک اور اپنے کاروبار کے لیے ایچ ڈی کیو آر کوڈ بنائیں جسے پرنٹ یا سوشل میڈیا پر لگا سکیں۔'
            : 'Create instant wa.me links with custom pre-filled inquiry text without saving contacts, plus generate and download high-resolution QR codes.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* WhatsApp Link Box */}
        <div className="lg:col-span-7 bg-white dark:bg-dark-surface border border-slate-200 dark:border-zinc-700/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-sm border-b border-slate-100 dark:border-zinc-700 pb-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            {isUrdu ? '1. واٹس ایپ لنک بنائیں' : '1. WhatsApp Chat Link with Pre-filled Message'}
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
              {isUrdu ? 'موبائل نمبر (بشمول ملکی کوڈ، مثلاً 923001234567)' : 'WhatsApp Phone Number (with 92 Country Code)'} *
            </label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder="e.g. 923001234567"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
              {isUrdu ? 'پہلے سے لکھا ہوا میسج (Pre-filled Message)' : 'Default Custom Message'}
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs space-y-2">
            <div className="font-semibold text-emerald-800 dark:text-emerald-300">Generated Direct Link:</div>
            <div className="font-mono text-[11px] text-slate-700 dark:text-zinc-300 break-all select-all">
              {whatsappUrl}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={() => onCopy(whatsappUrl, isUrdu ? 'واٹس ایپ لنک کاپی ہو گیا!' : 'WhatsApp link copied!')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow transition"
            >
              📋 Copy Link
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow transition flex items-center gap-1.5"
            >
              🚀 Test Open WhatsApp
            </a>
            <button
              type="button"
              onClick={() => setQrText(whatsappUrl)}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow transition"
            >
              🔄 Convert Link to QR Code
            </button>
          </div>
        </div>

        {/* QR Code Generator Box */}
        <div className="lg:col-span-5 bg-white dark:bg-dark-surface border border-slate-200 dark:border-zinc-700/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 text-center">
          <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-sm border-b border-slate-100 dark:border-zinc-700 pb-3 flex items-center justify-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
            {isUrdu ? '2. ایچ ڈی کیو آر کوڈ' : '2. QR Code Generator'}
          </h3>

          <div className="text-left">
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
              QR Code Data (URL / Text / WhatsApp Link)
            </label>
            <input
              type="text"
              value={qrText}
              onChange={(e) => setQrText(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div className="py-2 flex justify-center">
            <div className="p-3 bg-white border-2 border-slate-200 dark:border-zinc-700 rounded-2xl shadow-md inline-block">
              <img
                src={qrCodeImageUrl}
                alt="Generated QR Code"
                className="w-44 h-44 object-contain rounded-lg"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={downloadQr}
            className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow flex items-center justify-center gap-1.5 transition"
          >
            📥 {isUrdu ? 'کیو آر کوڈ امیج ڈاؤنلوڈ کریں' : 'Download QR Code (PNG)'}
          </button>
        </div>
      </div>
    </div>
  );
};
