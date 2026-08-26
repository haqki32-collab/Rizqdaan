import React, { useState, useRef } from 'react';
import { compressImageCanvas } from '../../../services/toolsService';

interface ImageCompressorToolProps {
  isUrdu: boolean;
  onCopy: (text: string, msg?: string) => void;
}

export const ImageCompressorTool: React.FC<ImageCompressorToolProps> = ({ isUrdu }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [compressedDataUrl, setCompressedDataUrl] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [quality, setQuality] = useState<number>(75);
  const [maxWidth, setMaxWidth] = useState<number>(1600);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setSelectedFile(file);
    setOriginalSize(file.size);
    const url = URL.createObjectURL(file);
    setOriginalPreview(url);
    runCompression(file, quality, maxWidth);
  };

  const runCompression = async (file: File, q: number, maxW: number) => {
    setIsCompressing(true);
    try {
      const res = await compressImageCanvas(file, q / 100, maxW);
      setCompressedDataUrl(res.dataUrl);
      setCompressedSize(res.compressedSize);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleQualityChange = (newQ: number) => {
    setQuality(newQ);
    if (selectedFile) {
      runCompression(selectedFile, newQ, maxWidth);
    }
  };

  const handleDownload = () => {
    if (!compressedDataUrl) return;
    const a = document.createElement('a');
    a.href = compressedDataUrl;
    a.download = `compressed-${selectedFile?.name || 'image.jpg'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatKB = (bytes: number) => {
    if (bytes >= 1048576) {
      return (bytes / 1048576).toFixed(2) + ' MB';
    }
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  const percentSaved = originalSize > 0 && compressedSize > 0 
    ? Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100))
    : 0;

  return (
    <div className="space-y-8" id="image-compressor-container">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-400/20 text-purple-300 border border-purple-400/30">
            🖼️ 100% Client-Side Privacy Safe
          </span>
          <span className="text-xs text-purple-200/80">
            {isUrdu ? 'کوئی فائل سرور پر اپلوڈ نہیں ہوتی' : 'Zero Server Uploads • Infinite Free'}
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
          {isUrdu ? 'آن لائن تصویر کمپریسر اور سائز کم کرنے کا ٹول' : 'Online Image Compressor & Resizer (KB / MB Reducer)'}
        </h2>
        <p className="text-purple-100/90 text-sm sm:text-base max-w-3xl leading-relaxed">
          {isUrdu
            ? 'اپنی تصاویر اور پراڈکٹ فوٹوز کا سائز کوالٹی خراب کیے بغیر 80% تک کم کریں۔ دراز، واٹس ایپ، فیس بک اور ویب سائٹ کے لیے بہترین۔'
            : 'Compress JPG, PNG, and WebP images up to 85% without noticeable loss in quality. Perfect for Daraz listings, Shopify stores, and fast SEO loading.'}
        </p>
      </div>

      {/* Upload Box */}
      <div 
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange(e.dataTransfer.files[0]);
          }
        }}
        className="border-2 border-dashed border-purple-300 dark:border-purple-800/80 hover:border-purple-500 dark:hover:border-purple-600 bg-purple-50/50 dark:bg-purple-950/20 rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3"
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          accept="image/*" 
          className="hidden" 
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) handleFileChange(e.target.files[0]);
          }}
        />
        <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center text-2xl text-purple-600 dark:text-purple-300 shadow-sm">
          📸
        </div>
        <div>
          <div className="text-sm sm:text-base font-bold text-slate-800 dark:text-zinc-100">
            {isUrdu ? 'تصویر یہاں ڈریگ کریں یا کلک کر کے منتخب کریں' : 'Click to Upload or Drag & Drop Image here'}
          </div>
          <div className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Supports JPG, PNG, WebP (Up to 25 MB)
          </div>
        </div>
      </div>

      {/* Compressor Controls & Preview */}
      {selectedFile && (
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-zinc-700/80 rounded-2xl p-6 shadow-sm space-y-6">
          {/* Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 dark:bg-zinc-800/60 p-4 rounded-xl border border-slate-200 dark:border-zinc-700">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                <span>{isUrdu ? 'کمپریشن کوالٹی:' : 'Compression Quality:'}</span>
                <span className="text-purple-600 dark:text-purple-400 font-bold">{quality}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="95"
                step="5"
                value={quality}
                onChange={(e) => handleQualityChange(parseInt(e.target.value))}
                className="w-full h-2 bg-purple-200 dark:bg-purple-950 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Smaller File (10%)</span>
                <span>Best Quality (95%)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                <span>{isUrdu ? 'زیادہ سے زیادہ چوڑائی (Max Width):' : 'Max Width (Resize):'}</span>
                <span className="text-purple-600 dark:text-purple-400 font-bold">{maxWidth} px</span>
              </div>
              <input
                type="range"
                min="600"
                max="2400"
                step="200"
                value={maxWidth}
                onChange={(e) => {
                  setMaxWidth(parseInt(e.target.value));
                  if (selectedFile) runCompression(selectedFile, quality, parseInt(e.target.value));
                }}
                className="w-full h-2 bg-purple-200 dark:bg-purple-950 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Mobile (600px)</span>
                <span>HD Desktop (2400px)</span>
              </div>
            </div>
          </div>

          {/* Size Comparison Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-3.5 bg-slate-50 dark:bg-zinc-800/80 rounded-xl border border-slate-200 dark:border-zinc-700">
              <div className="text-xs text-slate-500 dark:text-zinc-400">Original Size</div>
              <div className="text-lg font-bold text-slate-800 dark:text-zinc-100">{formatKB(originalSize)}</div>
            </div>
            <div className="p-3.5 bg-purple-50 dark:bg-purple-950/50 rounded-xl border border-purple-200 dark:border-purple-800/60">
              <div className="text-xs text-purple-700 dark:text-purple-300 font-medium">Compressed Size</div>
              <div className="text-lg font-extrabold text-purple-700 dark:text-purple-400">
                {isCompressing ? 'Processing...' : formatKB(compressedSize)}
              </div>
            </div>
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
              <div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">Reduction Saved</div>
              <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                ⚡ {percentSaved}% Saved
              </div>
            </div>
          </div>

          {/* Image Previews */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-2">Original Preview</div>
              {originalPreview && (
                <div className="h-64 bg-slate-100 dark:bg-zinc-800 rounded-xl overflow-hidden flex items-center justify-center p-2 border border-slate-200 dark:border-zinc-700">
                  <img src={originalPreview} alt="Original" className="max-h-full max-w-full object-contain" />
                </div>
              )}
            </div>

            <div>
              <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-2">Compressed Output</div>
              {compressedDataUrl ? (
                <div className="h-64 bg-slate-100 dark:bg-zinc-800 rounded-xl overflow-hidden flex items-center justify-center p-2 border border-purple-300 dark:border-purple-800">
                  <img src={compressedDataUrl} alt="Compressed" className="max-h-full max-w-full object-contain" />
                </div>
              ) : (
                <div className="h-64 bg-slate-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-xs text-slate-400">
                  Compressing...
                </div>
              )}
            </div>
          </div>

          {/* Download Action */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={!compressedDataUrl || isCompressing}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-md flex items-center gap-2 transition"
            >
              📥 {isUrdu ? 'کمپریسڈ تصویر ڈاؤنلوڈ کریں' : 'Download Compressed Image'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
