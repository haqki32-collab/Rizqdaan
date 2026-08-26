import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { ListingReport, Listing } from '../../types';

interface ManageReportsProps {
  listings: Listing[];
  onDeleteListing?: (listingId: string) => void;
  onNavigate?: (view: string, payload?: any) => void;
}

const ManageReports: React.FC<ManageReportsProps> = ({ listings, onDeleteListing, onNavigate }) => {
  const [reports, setReports] = useState<ListingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    try {
      const q = query(collection(db, 'reports'));
      const unsub = onSnapshot(q, (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ListingReport));
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setReports(list);
        setLoading(false);
      }, (err) => {
        console.warn("Reports listener error:", err.message);
        setLoading(false);
      });
      return () => unsub();
    } catch (e) {
      setLoading(false);
    }
  }, []);

  const handleUpdateStatus = async (reportId: string, status: 'resolved' | 'dismissed') => {
    if (!db) return;
    setActionLoading(reportId);
    try {
      await updateDoc(doc(db, 'reports', reportId), { status });
    } catch (e) {
      console.error("Failed to update report:", e);
      alert("Error updating report status.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteReportedListing = async (report: ListingReport) => {
    if (!window.confirm(`Are you sure you want to permanently delete the listing "${report.listingTitle}"?`)) {
      return;
    }
    setActionLoading(report.id);
    try {
      if (db) {
        await deleteDoc(doc(db, 'listings', report.listingId)).catch(() => {});
        await updateDoc(doc(db, 'reports', report.id), { status: 'resolved' });
      }
      if (onDeleteListing) {
        onDeleteListing(report.listingId);
      }
      alert("Listing deleted and report marked as resolved.");
    } catch (e) {
      console.error("Failed to delete listing:", e);
      alert("Error deleting listing.");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredReports = reports.filter(r => {
    if (filter === 'all') return true;
    return (r.status || 'pending') === filter;
  });

  const pendingCount = reports.filter(r => (r.status || 'pending') === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <span>🚨 Safety & Ad Reports</span>
            {pendingCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingCount} Pending
              </span>
            )}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Review user-reported ads, fake listings, and fraud complaints.
          </p>
        </div>

        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl gap-1 self-start sm:self-auto">
          {(['pending', 'resolved', 'dismissed', 'all'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${
                filter === tab
                  ? 'bg-white dark:bg-dark-surface text-primary shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
          <div className="text-4xl mb-2">🛡️</div>
          <h3 className="text-base font-bold text-gray-700 dark:text-gray-200">No {filter} reports</h3>
          <p className="text-xs text-gray-400 mt-1">Platform is clean and safe!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => {
            const relatedListing = listings.find(l => l.id === report.listingId);
            return (
              <div
                key={report.id}
                className="bg-white dark:bg-dark-surface p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col md:flex-row items-start justify-between gap-5 transition-all hover:border-gray-300 dark:hover:border-gray-700"
              >
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                      {report.reason}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      report.status === 'resolved'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : report.status === 'dismissed'
                        ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {report.status || 'pending'}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {report.createdAt ? new Date(report.createdAt).toLocaleString() : 'Recent'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {report.listingTitle}
                  </h3>

                  {report.details && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 italic">
                      "{report.details}"
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>Vendor: <strong className="text-gray-700 dark:text-gray-200">{report.vendorName}</strong></span>
                    {report.reportedByUserName && (
                      <span>Reported by: <strong className="text-gray-700 dark:text-gray-200">{report.reportedByUserName}</strong></span>
                    )}
                  </div>
                </div>

                <div className="flex flex-row md:flex-col items-center md:items-end gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-gray-100 dark:border-gray-800">
                  {relatedListing && onNavigate && (
                    <button
                      onClick={() => onNavigate('details', { listing: relatedListing })}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl transition-all"
                    >
                      View Ad
                    </button>
                  )}

                  {report.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleDeleteReportedListing(report)}
                        disabled={actionLoading === report.id}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
                      >
                        Delete Listing
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                        disabled={actionLoading === report.id}
                        className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                      >
                        Dismiss
                      </button>
                    </>
                  )}

                  {report.status !== 'pending' && (
                    <button
                      onClick={() => handleUpdateStatus(report.id, 'pending')}
                      className="text-xs text-primary font-bold hover:underline"
                    >
                      Reopen Report
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ManageReports;
