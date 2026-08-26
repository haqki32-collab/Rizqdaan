
import React, { useState, useEffect, useMemo } from 'react';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { CATEGORIES, CLOUDINARY_URL, CLOUDINARY_UPLOAD_PRESET, PAKISTAN_LOCATIONS } from '../../constants';
import { ListingType, Listing } from '../../types';
import { generateDescription } from '../../services/geminiService';
import { claimFirstAdBonus } from '../../services/bonusService';
import { Geolocation } from '@capacitor/geolocation';

const compressImage = async (file: File): Promise<File> => {
    const compressionPromise = new Promise<File>((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800; 
                    const scaleSize = MAX_WIDTH / img.width;
                    const width = scaleSize < 1 ? MAX_WIDTH : img.width;
                    const height = scaleSize < 1 ? img.height * scaleSize : img.height;
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) { resolve(file); return; } 
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => {
                        if (!blob) { resolve(file); return; } 
                        const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: 'image/jpeg', lastModified: Date.now() });
                        resolve(newFile);
                    }, 'image/jpeg', 0.6); 
                } catch (e) { resolve(file); }
            };
            img.onerror = () => resolve(file);
        };
        reader.onerror = () => resolve(file);
    });
    return Promise.race([compressionPromise, new Promise<File>((r) => setTimeout(() => r(file), 3000))]);
};

interface AddListingFormProps {
    onSuccess?: () => void;
    initialData?: Listing | null;
    onPromoteListing?: (listingId: string) => void;
}

const AddListingForm: React.FC<AddListingFormProps> = ({ onSuccess, initialData, onPromoteListing }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bonusAwarded, setBonusAwarded] = useState<{ amount: number; listingId: string } | null>(null);
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].name);
  const [type, setType] = useState<ListingType>(ListingType.Product);
  const [keywords, setKeywords] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [gpsCoords, setGpsCoords] = useState<{lat: number, lng: number} | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [newFilePreviews, setNewFilePreviews] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  const isEditMode = !!initialData;
  const discountPercent = useMemo(() => {
    const orig = parseFloat(originalPrice);
    const disc = parseFloat(price);
    return (orig > 0 && disc > 0 && orig > disc) ? Math.round(((orig - disc) / orig) * 100) : 0;
  }, [originalPrice, price]);

  useEffect(() => {
      if (initialData) {
          setTitle(initialData.title);
          setDescription(initialData.description);
          setPrice(initialData.price.toString());
          setOriginalPrice(initialData.originalPrice?.toString() || '');
          setCategory(initialData.category);
          setType(initialData.type);
          const locParts = initialData.location ? initialData.location.split(',').map(s => s.trim()) : [];
          if (locParts.length >= 3) {
              const prov = locParts.pop() || '';
              const cty = locParts.pop() || '';
              setSelectedProvince(prov);
              setSelectedCity(cty);
              setManualAddress(locParts.join(', '));
          } else setManualAddress(initialData.location || '');
          if (initialData.latitude && initialData.longitude) setGpsCoords({ lat: initialData.latitude, lng: initialData.longitude });
          setExistingImages(initialData.images && initialData.images.length > 0 ? initialData.images : [initialData.imageUrl]);
      }
  }, [initialData]);

  const handleGetLocation = async () => {
      setGettingLocation(true);
      try {
          const pos = await Geolocation.getCurrentPosition();
          setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          alert("✅ Location pinned successfully!");
      } catch (err) {
          console.error("GPS Error", err);
          alert("Unable to retrieve location. Ensure GPS is ON and permissions allowed.");
      } finally {
          setGettingLocation(false);
      }
  };

  const handleGenerateDescription = async () => {
    if (!keywords.trim()) return alert("Please enter keywords first.");
    setIsGenerating(true);
    try {
      const generatedDesc = await generateDescription(keywords);
      setDescription(generatedDesc);
    } catch (error) { alert('AI generation failed.'); }
    finally { setIsGenerating(false); }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          const files = Array.from(e.target.files) as File[];
          if ((existingImages.length + selectedFiles.length + files.length) > 8) return alert("Max 8 images.");
          setNewFilePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
          setSelectedFiles(prev => [...prev, ...files]);
      }
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET); 
      const response = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Cloudinary upload failed');
      const data = await response.json();
      return data.secure_url;
  };

  const handleFormSubmit = async (e: React.FormEvent, status: 'active' | 'draft' = 'active') => {
      e.preventDefault();
      if (!auth.currentUser || !db) return alert("Login required.");
      if (!title || !price || !manualAddress || !selectedCity || !selectedProvince) return alert("Fill all fields.");
      if (existingImages.length === 0 && selectedFiles.length === 0) return alert("Add a photo.");

      setIsLoading(true);
      const finalUrls = [...existingImages];
      try {
          for (let i = 0; i < selectedFiles.length; i++) {
              setLoadingText(`Uploading Image ${i + 1}/${selectedFiles.length}...`);
              const file = await compressImage(selectedFiles[i]);
              finalUrls.push(await uploadToCloudinary(file));
          }
          const listingData = {
              title, description, price: parseFloat(price), category, type,
              originalPrice: (parseFloat(originalPrice) > parseFloat(price)) ? parseFloat(originalPrice) : null,
              imageUrl: finalUrls[0], images: finalUrls, status,
              location: `${manualAddress}, ${selectedCity}, ${selectedProvince}`,
              latitude: gpsCoords?.lat || null, longitude: gpsCoords?.lng || null,
              updatedAt: new Date().toISOString(),
              ...(isEditMode ? {} : {
                  vendorId: auth.currentUser.uid, vendorName: auth.currentUser.displayName || 'Vendor',
                  rating: 0, reviews: [], contact: { phone: '', whatsapp: '' }, itemsSold: 0,
                  hasFreeDelivery: false, views: 0, likes: 0, isPromoted: false, createdAt: new Date().toISOString()
              })
          };
          let newListingId = '';
          if (isEditMode && initialData) {
              await updateDoc(doc(db, "listings", initialData.id), listingData);
              newListingId = initialData.id;
          } else {
              const docRef = await addDoc(collection(db, "listings"), listingData);
              newListingId = docRef.id;

              // Check and claim first ad bonus (1000 Rs for first 50 users)
              try {
                  const bonusRes = await claimFirstAdBonus(auth.currentUser.uid, auth.currentUser.displayName || 'Vendor');
                  if (bonusRes.success && bonusRes.amount) {
                      setBonusAwarded({ amount: bonusRes.amount, listingId: newListingId });
                      setIsLoading(false);
                      return; // Stop here to let user celebrate and choose to promote
                  }
              } catch (bErr) {
                  console.warn("Bonus claim note:", bErr);
              }
          }
          setLoadingText('Success!');
          setTimeout(() => onSuccess && onSuccess(), 1000);
      } catch (err: any) { alert(`Error: ${err.message}`); }
      finally { setIsLoading(false); }
  };

  if (bonusAwarded) {
    return (
      <div className="py-8 px-4 max-w-lg mx-auto text-center animate-fade-in">
        <div className="bg-gradient-to-b from-white to-amber-50/40 dark:from-dark-surface dark:to-gray-900 rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-amber-400">
          <div className="text-6xl animate-bounce mb-3">🎉</div>
          <span className="bg-amber-400 text-gray-900 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
            First 50 Users Bonus (پہلے 50 صارفین کی آفر)
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-4">
            مبارک ہو! 1,000 روپے شامل ہو گئے!
          </h2>
          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
            Rs. {bonusAwarded.amount.toLocaleString()} Added to Your Wallet!
          </p>

          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-4 leading-relaxed bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
            آپ کا پہلا اشتہار کامیابی سے شائع ہو گیا ہے۔ اس 1,000 روپے کے بونس کو آپ اپنے اس اشتہار کو <strong className="text-amber-600 dark:text-amber-400">Featured / Promote</strong> کرنے کے لیے استعمال کر سکتے ہیں تاکہ خریداروں کی تعداد میں 10 گنا اضافہ ہو!
          </p>

          <div className="mt-6 space-y-3">
            <button
              onClick={() => {
                if (onPromoteListing) {
                  onPromoteListing(bonusAwarded.listingId);
                } else if (onSuccess) {
                  onSuccess();
                }
              }}
              className="w-full py-4 bg-gradient-to-r from-amber-500 via-primary to-teal-600 hover:from-amber-600 hover:to-teal-700 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-primary/30 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <span>🚀</span>
              <span>ابھی اشتہار کو Featured کریں (Feature Ad Now)</span>
            </button>

            <button
              onClick={() => onSuccess && onSuccess()}
              className="w-full py-3 text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-800 rounded-xl"
            >
              میرے تمام اشتہارات دیکھیں (View My Listings)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-10 animate-fade-in">
      <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">{isEditMode ? 'Edit Listing' : 'Create New Ad'}</h3>
      <form className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Item Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary outline-none" placeholder="e.g. Handmade Leather Wallet" disabled={isLoading} />
        </div>
        <div className="space-y-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">Pricing</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="number" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} className="w-full px-4 py-3 border rounded-xl" placeholder="Original Price (Optional)" disabled={isLoading} />
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-4 py-3 border-2 border-primary rounded-xl" placeholder="Final Price (Required)" required disabled={isLoading} />
            </div>
            {discountPercent > 0 && <div className="text-center p-2 bg-green-100 text-green-700 rounded-lg text-sm font-bold">{discountPercent}% OFF!</div>}
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 w-full px-4 py-3 border rounded-xl" disabled={isLoading}>
                {CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
        </div>
        <div className="space-y-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border">
            <h4 className="font-semibold text-gray-800 dark:text-white">Location</h4>
            <select value={selectedProvince} onChange={(e) => { setSelectedProvince(e.target.value); setSelectedCity(''); }} className="w-full p-3 border rounded-lg">
                <option value="">Select Province</option>
                {Object.keys(PAKISTAN_LOCATIONS).map(prov => <option key={prov} value={prov}>{prov}</option>)}
            </select>
            <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} disabled={!selectedProvince} className="w-full p-3 border rounded-lg">
                <option value="">{selectedProvince ? "Select City" : "Select Province First"}</option>
                {selectedProvince && PAKISTAN_LOCATIONS[selectedProvince]?.map(city => <option key={city} value={city}>{city}</option>)}
            </select>
            <input type="text" value={manualAddress} onChange={(e) => setManualAddress(e.target.value)} className="w-full p-3 border rounded-lg" placeholder="Shop #, Street / Area" />
            <button type="button" onClick={handleGetLocation} disabled={gettingLocation || isLoading} className="w-full py-2 bg-blue-50 text-blue-600 rounded-lg border flex items-center justify-center gap-2">
                {gettingLocation ? <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span> : '📍'}
                {gpsCoords ? 'Exact GPS Pinned' : 'Use Native GPS for Better Accuracy'}
            </button>
        </div>
        <div>
            <label className="block text-sm font-medium mb-2">Photos (Max 8)</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {existingImages.map((src, idx) => (
                    <div key={`ex-${idx}`} className="relative aspect-square rounded-lg overflow-hidden border border-green-500">
                        <img src={src} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setExistingImages(prev => prev.filter((_, i) => i !== idx))} className="absolute top-0 right-0 bg-red-600 text-white p-1 rounded-bl-lg">✕</button>
                    </div>
                ))}
                {newFilePreviews.map((src, idx) => (
                    <div key={`nw-${idx}`} className="relative aspect-square rounded-lg overflow-hidden border border-blue-500">
                        <img src={src} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => { setSelectedFiles(prev => prev.filter((_, i) => i !== idx)); setNewFilePreviews(prev => prev.filter((_, i) => i !== idx)); }} className="absolute top-0 right-0 bg-red-600 text-white p-1 rounded-bl-lg">✕</button>
                    </div>
                ))}
                {(existingImages.length + selectedFiles.length) < 8 && (
                    <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-primary/50 rounded-xl bg-blue-50 cursor-pointer">
                        <span className="text-3xl text-primary">+</span>
                        <input type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
                    </label>
                )}
            </div>
        </div>
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium">Description</label>
                <button type="button" onClick={handleGenerateDescription} disabled={isGenerating || isLoading} className="text-xs text-primary font-bold">✨ AI WRITER</button>
            </div>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} className="w-full px-4 py-3 border rounded-xl" placeholder="Describe your item..." disabled={isLoading}></textarea>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button type="button" onClick={(e) => handleFormSubmit(e, 'draft')} disabled={isLoading} className="flex-1 py-4 border rounded-xl font-bold">Save Draft</button>
            <button type="button" onClick={(e) => handleFormSubmit(e, 'active')} disabled={isLoading} className="flex-[2] py-4 bg-primary text-white font-bold rounded-xl shadow-lg">
                {isLoading ? loadingText : (isEditMode ? 'Update Ad' : 'Post Ad Now')}
            </button>
        </div>
      </form>
    </div>
  );
};

export default AddListingForm;
