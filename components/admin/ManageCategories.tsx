
import React, { useState, useEffect } from 'react';
import { Category } from '../../types';
import { db } from '../../firebaseConfig';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { ICONS } from '../../constants';

const ManageCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [iconKey, setIconKey] = useState('shopping');
  const [subcategoriesStr, setSubcategoriesStr] = useState('');

  useEffect(() => {
      if(!db) return;
      const unsub = onSnapshot(collection(db, 'categories'), (snap) => {
          const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Category));
          setCategories(data);
      });
      return () => unsub();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!db) return;

      const subs = subcategoriesStr.split(',').map((s, idx) => ({
          id: `sub-${Date.now()}-${idx}`,
          name: s.trim()
      })).filter(s => s.name);

      // For simplicity, we store the icon KEY (string) in the DB, 
      // though the Type interface allows ReactElement. 
      // Ideally, types.ts should be updated to allow string for icon.
      // Here we are just storing the object as is, but in a real app you'd store 'shopping' and map it on render.
      
      // Assuming App handles the display mapping if it receives a string or object. 
      // We'll store the raw string key for now as the `icon` prop in types.ts accepts string.

      const payload = {
          name,
          icon: iconKey, // Storing string key
          subcategories: subs
      };

      try {
          if (editingId) {
              await updateDoc(doc(db, 'categories', editingId), payload);
              setEditingId(null);
          } else {
              await addDoc(collection(db, 'categories'), payload);
              setIsAdding(false);
          }
          resetForm();
      } catch (err: any) {
          console.error("Error saving category:", err.message);
          alert("Failed to save.");
      }
  };

  const handleEditClick = (cat: Category) => {
      setEditingId(cat.id);
      setIsAdding(false);
      setName(cat.name);
      // If icon is stored as string, use it. If it's ReactElement (from mock), default to shopping.
      setIconKey(typeof cat.icon === 'string' ? cat.icon : 'shopping');
      setSubcategoriesStr(cat.subcategories.map(s => s.name).join(', '));
  };

  const handleDelete = async (id: string) => {
      if (window.confirm("Delete this category?")) {
          if (db) await deleteDoc(doc(db, 'categories', id));
      }
  };

  const resetForm = () => {
      setName('');
      setIconKey('shopping');
      setSubcategoriesStr('');
      setEditingId(null);
      setIsAdding(false);
  };

  // Helper to render icon from key or object
  const renderIcon = (icon: any) => {
      if (React.isValidElement(icon)) return icon;
      if (typeof icon === 'string' && ICONS[icon as keyof typeof ICONS]) {
          return ICONS[icon as keyof typeof ICONS];
      }
      return <span className="text-xs">Icon</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Manage Categories</h2>
        {!isAdding && !editingId && (
            <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-dark transition-all"
            >
            + Add Category
            </button>
        )}
      </div>

      {/* FORM */}
      {(isAdding || editingId) && (
          <div className="bg-white dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 animate-fade-in">
              <h3 className="text-lg font-bold mb-4 dark:text-white">{editingId ? 'Edit Category' : 'New Category'}</h3>
              <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-medium mb-1 dark:text-gray-300">Name</label>
                          <input className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={name} onChange={e => setName(e.target.value)} required />
                      </div>
                      <div>
                          <label className="block text-sm font-medium mb-1 dark:text-gray-300">Icon</label>
                          <select className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={iconKey} onChange={e => setIconKey(e.target.value)}>
                              {Object.keys(ICONS).map(k => <option key={k} value={k}>{k}</option>)}
                          </select>
                      </div>
                  </div>
                  <div>
                      <label className="block text-sm font-medium mb-1 dark:text-gray-300">Subcategories (comma separated)</label>
                      <input className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={subcategoriesStr} onChange={e => setSubcategoriesStr(e.target.value)} placeholder="e.g. Mobile, Laptop, Accessories" />
                  </div>
                  <div className="flex justify-end gap-2">
                      <button type="button" onClick={resetForm} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                      <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Save</button>
                  </div>
              </form>
          </div>
      )}

      {/* LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map(category => (
          <div key={category.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white dark:bg-gray-700 rounded-full text-primary dark:text-white shadow-sm">
                            {renderIcon(category.icon)}
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">{category.name}</h3>
                    </div>
                    <div className="flex gap-1">
                        <button onClick={() => handleEditClick(category)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg></button>
                        <button onClick={() => handleDelete(category.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg></button>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                    {category.subcategories.map(sub => (
                    <span key={sub.id} className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md border border-gray-300 dark:border-gray-600">
                        {sub.name}
                    </span>
                    ))}
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManageCategories;
