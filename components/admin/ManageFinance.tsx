
import React, { useState, useEffect } from 'react';
import { User, Transaction, WithdrawalRequest, DepositRequest, PaymentInfo, ReferralSettings } from '../../types';
import { db } from '../../firebaseConfig';
import { doc, updateDoc, arrayUnion, collection, onSnapshot, setDoc, increment, writeBatch } from 'firebase/firestore';

interface ManageFinanceProps {
  users: User[];
}

const ManageFinance: React.FC<ManageFinanceProps> = ({ users }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'deposits' | 'withdrawals' | 'ledger' | 'funds' | 'settings' | 'referrals'>('deposits'); 
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  
  // Processing State
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
      isOpen: boolean;
      type: 'deposit' | 'withdrawal';
      action: 'approve' | 'reject';
      item: any; // DepositRequest or WithdrawalRequest
  } | null>(null);

  // UI State
  const [depositFilter, setDepositFilter] = useState<'pending' | 'all'>('pending');
  const [proofUrl, setProofUrl] = useState<string | null>(null); 

  // Payment Info State
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
      bankName: 'JazzCash',
      accountTitle: 'Admin Name',
      accountNumber: '03001234567',
      instructions: 'Please send screenshot after payment.',
      customNote: ''
  });

  const [savingSettings, setSavingSettings] = useState(false);

  // Fetch Data
  useEffect(() => {
      if (!db) return;
      
      const unsubWithdrawals = onSnapshot(collection(db, 'withdrawals'), (snap) => {
          setWithdrawals(snap.docs.map(d => ({ id: d.id, ...d.data() } as WithdrawalRequest)));
      });

      const unsubDeposits = onSnapshot(collection(db, 'deposits'), (snap) => {
          setDeposits(snap.docs.map(d => ({ id: d.id, ...d.data() } as DepositRequest)));
      });

      const unsubSettings = onSnapshot(doc(db, 'settings', 'payment_info'), (snap) => {
          if (snap.exists()) setPaymentInfo(snap.data() as PaymentInfo);
      });

      return () => {
          unsubWithdrawals();
          unsubDeposits();
          unsubSettings();
      };
  }, []);

  // --- ACTIONS ---

  // Trigger Modal
  const initiateDepositAction = (req: DepositRequest, action: 'approve' | 'reject') => {
      setConfirmModal({
          isOpen: true,
          type: 'deposit',
          action,
          item: req
      });
  };

  const initiateWithdrawalAction = (req: WithdrawalRequest, action: 'approve' | 'reject') => {
      setConfirmModal({
          isOpen: true,
          type: 'withdrawal',
          action,
          item: req
      });
  };

  // EXECUTE DEPOSIT LOGIC
  const executeProcessDeposit = async () => {
      if (!confirmModal || !confirmModal.item) return;
      
      const req = confirmModal.item as DepositRequest;
      const action = confirmModal.action;
      
      setConfirmModal(null); // Close modal first
      setProcessingId(req.id);

      const targetStatus = action === 'approve' ? 'approved' : 'rejected';
      const timestamp = new Date().toISOString();

      try {
          // FIRESTORE UPDATE (Backend)
          if (db) {
              const batch = writeBatch(db);
              
              const depositRef = doc(db, 'deposits', req.id);
              batch.update(depositRef, { 
                  status: targetStatus,
                  adminNote: `Processed by Admin on ${new Date().toLocaleString()}`
              });

              const userRef = doc(db, 'users', req.userId);
              const safeAmount = Number(req.amount);
              
              if (action === 'approve') {
                  const tx: Transaction = {
                      id: `tx_dep_${req.id}`,
                      type: 'deposit',
                      amount: safeAmount,
                      date: timestamp.split('T')[0],
                      status: 'completed',
                      description: `Deposit Approved via ${req.method}`
                  };
                  
                  batch.update(userRef, {
                      "wallet.balance": increment(safeAmount),
                      "wallet.pendingDeposit": increment(-safeAmount),
                      walletHistory: arrayUnion(tx)
                  });
              } else {
                  batch.update(userRef, {
                      "wallet.pendingDeposit": increment(-safeAmount)
                  });
              }

              await batch.commit();
          }

      } catch (e: any) {
          console.error("Processing Error:", e.message);
          alert("Error processing deposit: " + e.message);
      } finally {
          setProcessingId(null);
      }
  };

  // EXECUTE WITHDRAWAL LOGIC
  const executeProcessWithdrawal = async () => {
      if (!confirmModal || !confirmModal.item) return;
      
      const req = confirmModal.item as WithdrawalRequest;
      const action = confirmModal.action;
      
      setConfirmModal(null);
      setProcessingId(req.id);
      
      const targetStatus = action === 'approve' ? 'approved' : 'rejected';
      
      try {
          if (db) {
              const batch = writeBatch(db);
              batch.update(doc(db, 'withdrawals', req.id), { status: targetStatus });
              
              const userRef = doc(db, 'users', req.userId);
              const amount = Number(req.amount);

              if (action === 'approve') {
                  const tx: Transaction = {
                      id: `tx_with_${req.id}`,
                      type: 'withdrawal',
                      amount: amount,
                      date: new Date().toISOString().split('T')[0],
                      status: 'completed',
                      description: `Withdrawal Approved`
                  };
                  batch.update(userRef, {
                      "wallet.pendingWithdrawal": increment(-amount),
                      walletHistory: arrayUnion(tx)
                  });
              } else {
                  // Refund on reject
                  const tx: Transaction = {
                      id: `tx_ref_${req.id}`,
                      type: 'adjustment',
                      amount: amount,
                      date: new Date().toISOString().split('T')[0],
                      status: 'completed',
                      description: `Withdrawal Refund (Rejected)`
                  };
                  batch.update(userRef, {
                      "wallet.pendingWithdrawal": increment(-amount),
                      "wallet.balance": increment(amount),
                      walletHistory: arrayUnion(tx)
                  });
              }
              await batch.commit();
          }
      } catch (e) { console.error(e); }
      setProcessingId(null);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!db) return;
      setSavingSettings(true);
      try {
          await setDoc(doc(db, 'settings', 'payment_info'), paymentInfo);
          alert("Payment settings updated!");
      } catch (e: any) {
          alert("Failed to save settings: " + e.message);
      }
      setSavingSettings(false);
  };

  return (
    <div className="min-h-screen pb-10">
      
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Financial Center</h2>
        <p className="text-gray-500 dark:text-gray-400">Manage deposits, withdrawals, and platform revenue.</p>
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
          {[
              { id: 'deposits', label: 'Deposit Requests', icon: '💰' },
              { id: 'withdrawals', label: 'Withdrawals', icon: '💸' },
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'ledger', label: 'Global Ledger', icon: '📒' },
              { id: 'settings', label: 'Payment Info', icon: '⚙️' },
          ].map((tab) => (
              <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.id 
                      ? 'border-primary text-primary dark:text-white bg-gray-50 dark:bg-gray-800/50 rounded-t-lg' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
              >
                  <span>{tab.icon}</span> {tab.label}
              </button>
          ))}
      </div>

      {/* --- DEPOSIT REQUESTS TAB (PROFESSIONAL DESIGN) --- */}
      {activeTab === 'deposits' && (
          <div className="bg-white dark:bg-dark-surface rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                  <h3 className="font-bold text-gray-800 dark:text-white text-lg">Deposit Requests</h3>
                  <div className="flex gap-2 bg-gray-200 dark:bg-gray-700 p-1 rounded-lg">
                      <button 
                        onClick={() => setDepositFilter('pending')}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${depositFilter === 'pending' ? 'bg-white dark:bg-dark-surface text-primary shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                      >
                          Pending
                      </button>
                      <button 
                        onClick={() => setDepositFilter('all')}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${depositFilter === 'all' ? 'bg-white dark:bg-dark-surface text-primary shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                      >
                          All History
                      </button>
                  </div>
              </div>

              <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-100 dark:bg-gray-900">
                          <tr>
                              <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Vendor Identity</th>
                              <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Amount</th>
                              <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Transaction Info</th>
                              <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Status</th>
                              <th className="px-6 py-4 text-right text-xs font-extrabold text-gray-500 uppercase tracking-wider">Management</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-dark-surface">
                          {deposits
                            .filter(d => depositFilter === 'all' || d.status === 'pending')
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map(req => {
                                const user = users.find(u => u.id === req.userId);
                                const isPending = req.status === 'pending';

                                return (
                                  <tr key={req.id} className={`transition-colors ${isPending ? 'bg-white dark:bg-dark-surface' : 'bg-gray-50/50 dark:bg-gray-800/30'}`}>
                                      <td className="px-6 py-4">
                                          <div className="flex items-center">
                                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-md mr-3">
                                                  {(user?.name || req.userName).charAt(0).toUpperCase()}
                                              </div>
                                              <div>
                                                  <div className="text-sm font-bold text-gray-900 dark:text-white">{user?.name || req.userName}</div>
                                                  <div className="text-xs text-gray-500 dark:text-gray-400">{user?.shopName}</div>
                                              </div>
                                          </div>
                                      </td>
                                      <td className="px-6 py-4">
                                          <div className="text-base font-bold text-green-600 dark:text-green-400">Rs. {req.amount.toLocaleString()}</div>
                                          <div className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Deposit</div>
                                      </td>
                                      <td className="px-6 py-4">
                                          <div className="flex flex-col gap-1">
                                              <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded w-fit border border-gray-200 dark:border-gray-600">
                                                  {req.transactionId}
                                              </span>
                                              <div className="text-xs text-gray-500">
                                                  <span className="font-semibold">{req.method}</span> • {req.date}
                                              </div>
                                              {req.screenshotUrl && (
                                                  <button 
                                                    onClick={() => setProofUrl(req.screenshotUrl || null)}
                                                    className="text-xs text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 mt-1 font-medium"
                                                  >
                                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                      View Receipt
                                                  </button>
                                              )}
                                          </div>
                                      </td>
                                      <td className="px-6 py-4">
                                          {req.status === 'approved' && (
                                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                                                  <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                  Approved
                                              </span>
                                          )}
                                          {req.status === 'rejected' && (
                                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                                                  <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                                  Rejected
                                              </span>
                                          )}
                                          {req.status === 'pending' && (
                                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200 animate-pulse">
                                                  Pending
                                              </span>
                                          )}
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                          {isPending ? (
                                              <div className="flex justify-end items-center gap-2 relative z-10">
                                                  <button 
                                                    onClick={() => initiateDepositAction(req, 'approve')}
                                                    disabled={processingId === req.id}
                                                    className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white text-xs font-bold rounded-lg shadow hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                                                  >
                                                      {processingId === req.id ? (
                                                          <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                                      ) : (
                                                          <>
                                                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                              Approve
                                                          </>
                                                      )}
                                                  </button>
                                                  <button 
                                                    onClick={() => initiateDepositAction(req, 'reject')}
                                                    disabled={processingId === req.id}
                                                    className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 text-red-600 text-xs font-bold rounded-lg shadow-sm hover:bg-red-50 hover:border-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                                                  >
                                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                      Reject
                                                  </button>
                                              </div>
                                          ) : (
                                              <div className="text-xs text-gray-400 italic">Action Taken</div>
                                          )}
                                      </td>
                                  </tr>
                                );
                            })}
                          
                          {deposits.filter(d => depositFilter === 'all' || d.status === 'pending').length === 0 && (
                              <tr>
                                  <td colSpan={5} className="px-6 py-20 text-center">
                                      <div className="flex flex-col items-center">
                                          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-3">
                                               <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                          </div>
                                          <h4 className="text-gray-800 dark:text-white font-medium">All clear!</h4>
                                          <p className="text-gray-500 text-sm">No deposits found in this view.</p>
                                      </div>
                                  </td>
                              </tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* WITHDRAWALS TAB */}
      {activeTab === 'withdrawals' && (
          <div className="bg-white dark:bg-dark-surface rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-100 dark:bg-gray-900">
                          <tr>
                              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Vendor</th>
                              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Amount</th>
                              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Account Details</th>
                              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Action</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-dark-surface">
                          {withdrawals.map(w => {
                              return (
                                <tr key={w.id}>
                                    <td className="px-6 py-4 font-medium">{w.userName}</td>
                                    <td className="px-6 py-4 text-red-600 font-bold">Rs. {w.amount}</td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold">{w.method}</div>
                                        <div className="text-xs text-gray-500">{w.accountDetails}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold capitalize ${w.status === 'approved' ? 'bg-green-100 text-green-700' : w.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {w.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {w.status === 'pending' && (
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => initiateWithdrawalAction(w, 'approve')} className="text-green-600 hover:text-green-800 font-bold text-xs bg-green-50 px-2 py-1 rounded border border-green-100">Approve</button>
                                                <button onClick={() => initiateWithdrawalAction(w, 'reject')} className="text-red-600 hover:text-red-800 font-bold text-xs bg-red-50 px-2 py-1 rounded border border-red-100">Reject</button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                              );
                          })}
                      </tbody>
                  </table>
                  {withdrawals.length === 0 && <div className="p-8 text-center text-gray-500">No withdrawal requests.</div>}
              </div>
          </div>
      )}

      {/* OVERVIEW CONTENT */}
      {activeTab === 'overview' && (
          <div className="p-4 bg-white dark:bg-dark-surface rounded-xl shadow-sm">
              <p className="text-gray-500">Global financial overview charts will appear here.</p>
          </div>
      )}

      {/* PAYMENT SETTINGS TAB */}
      {activeTab === 'settings' && (
          <div className="max-w-xl mx-auto bg-white dark:bg-dark-surface p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Admin Bank Details</h3>
              <form onSubmit={handleSaveSettings} className="space-y-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bank / Wallet Name</label>
                      <select 
                        value={paymentInfo.bankName}
                        onChange={(e) => setPaymentInfo({...paymentInfo, bankName: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      >
                          <option value="JazzCash">JazzCash</option>
                          <option value="EasyPaisa">EasyPaisa</option>
                          <option value="Meezan Bank">Meezan Bank</option>
                          <option value="SadaPay">SadaPay</option>
                      </select>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Title</label>
                      <input 
                        type="text" 
                        value={paymentInfo.accountTitle}
                        onChange={(e) => setPaymentInfo({...paymentInfo, accountTitle: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Number</label>
                      <input 
                        type="text" 
                        value={paymentInfo.accountNumber}
                        onChange={(e) => setPaymentInfo({...paymentInfo, accountNumber: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-white font-mono"
                      />
                  </div>
                  <button 
                    type="submit" 
                    disabled={savingSettings}
                    className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-all flex justify-center"
                  >
                      {savingSettings ? 'Saving...' : 'Update Details'}
                  </button>
              </form>
          </div>
      )}

      {/* PROOF MODAL (IMAGE LIGHTBOX) */}
      {proofUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setProofUrl(null)}>
              <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
                  <button 
                    onClick={() => setProofUrl(null)}
                    className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
                  >
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  <img src={proofUrl} alt="Payment Proof" className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl border-4 border-white" />
                  <div className="mt-4">
                      <a 
                        href={proofUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="bg-white text-black px-6 py-2 rounded-full font-bold shadow-lg hover:bg-gray-200 transition-colors"
                      >
                          Open Full Image
                      </a>
                  </div>
              </div>
          </div>
      )}

      {/* CONFIRMATION POPUP MODAL (REPLACES WINDOW.CONFIRM) */}
      {confirmModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setConfirmModal(null)}>
              <div className="bg-white dark:bg-dark-surface p-6 rounded-xl shadow-2xl max-w-sm w-full transform scale-100 transition-all border border-gray-100 dark:border-gray-700" onClick={e => e.stopPropagation()}>
                  <div className="text-center">
                      <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${
                          confirmModal.action === 'approve' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                          {confirmModal.action === 'approve' ? (
                              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          ) : (
                              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          )}
                      </div>
                      
                      <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white capitalize">
                          {confirmModal.action} {confirmModal.type}
                      </h3>
                      
                      <div className="mt-2">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                              Are you sure you want to <strong>{confirmModal.action}</strong> this request for <strong className="text-gray-800 dark:text-gray-200">Rs. {confirmModal.item.amount}</strong>?
                              {confirmModal.action === 'approve' 
                                ? ' This will update the user wallet immediately.' 
                                : ' This will mark it as rejected.'}
                          </p>
                      </div>
                  </div>
                  
                  <div className="mt-6 flex gap-3">
                      <button
                          onClick={() => setConfirmModal(null)}
                          className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                      >
                          Cancel
                      </button>
                      <button
                          onClick={() => {
                              if (confirmModal.type === 'deposit') executeProcessDeposit();
                              else executeProcessWithdrawal();
                          }}
                          className={`flex-1 px-4 py-2 text-white rounded-lg font-bold shadow-md transition-colors ${
                              confirmModal.action === 'approve' 
                              ? 'bg-green-600 hover:bg-green-700' 
                              : 'bg-red-600 hover:bg-red-700'
                          }`}
                      >
                          Yes, {confirmModal.action}
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default ManageFinance;
