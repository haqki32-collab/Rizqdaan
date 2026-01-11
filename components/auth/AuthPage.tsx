
import React, { useState } from 'react';
import { User } from '../../types';
import { PAKISTAN_LOCATIONS } from '../../constants';
import { auth, db } from '../../firebaseConfig';
import { signInWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification } from 'firebase/auth';

type AuthStep = 'form' | 'verification_pending';

interface AuthPageProps {
  onLogin: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  onSignup: (userData: Omit<User, 'id' | 'isVerified'> & { referralCodeInput?: string }) => Promise<{ success: boolean; message: string; user?: User }>;
  onVerifyAndLogin: (userId: string) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin, onSignup, onVerifyAndLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState<AuthStep>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [resending, setResending] = useState(false);
  
  // Legal Modal States
  const [legalModal, setLegalModal] = useState<{ isOpen: boolean; type: 'tos' | 'privacy' }>({ isOpen: false, type: 'tos' });

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [shopName, setShopName] = useState('');
  const [password, setPassword] = useState('');
  const [referralCodeInput, setReferralCodeInput] = useState('');
  
  // Structured Address State
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  
  const [error, setError] = useState<string>('');
  const [info, setInfo] = useState('');

  const handlePasswordReset = async () => {
      if (!email) {
          setError("Please enter your email first.");
          return;
      }
      if (!auth) return;
      try {
          await sendPasswordResetEmail(auth, email);
          setInfo(`Reset link sent to ${email}. Check your inbox.`);
      } catch (e: any) {
          setError(e.message);
      }
  };

  const handleResendEmail = async () => {
      setResending(true);
      setError('');
      try {
          if (auth.currentUser) {
              await sendEmailVerification(auth.currentUser);
              setInfo("Verification email sent again. Please check your inbox!");
          } else {
              setError("Session expired. Please try to log in to trigger a new verification link.");
          }
      } catch (e: any) {
          if (e.code === 'auth/too-many-requests') {
              setError("Too many requests. Please wait a few minutes before trying again.");
          } else {
              setError(e.message);
          }
      } finally {
          setResending(false);
      }
  };

  const clearForm = () => {
    setName(''); setEmail(''); setPhone(''); setShopName(''); 
    setPassword(''); setError(''); setInfo('');
    setSelectedProvince(''); setSelectedCity(''); setManualAddress('');
    setReferralCodeInput('');
  };

  const handleModeToggle = (mode: 'login' | 'signup') => {
    setIsLogin(mode === 'login');
    setStep('form');
    clearForm();
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!email || !password) {
      setError('Email and Password are required.');
      return;
    }
    setIsLoading(true);
    const result = await onLogin(email, password);
    setIsLoading(false);
    
    if (!result.success) {
      setError(result.message);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    
    if (!selectedProvince || !selectedCity || !manualAddress) {
        setError('Complete business address is required.');
        return;
    }
    const fullShopAddress = `${manualAddress}, ${selectedCity}, ${selectedProvince}`;

    if (!name || !email || !phone || !shopName || !password) {
      setError('Please fill in all the required fields.');
      return;
    }

    setIsLoading(true);
    const result = await onSignup({ name, email, phone, shopName, shopAddress: fullShopAddress, password, referralCodeInput });
    setIsLoading(false);

    if (result.success) {
      setStep('verification_pending');
    } else {
      setError(result.message);
    }
  };

  const LocationInputs = () => (
      <div className="space-y-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
           <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Business Location</label>
           <input type="text" value="Pakistan" disabled className="w-full px-4 py-2.5 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 text-sm font-bold" />
           <select 
              value={selectedProvince}
              onChange={(e) => { setSelectedProvince(e.target.value); setSelectedCity(''); }}
              className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
              required
           >
               <option value="">Select Province</option>
               {Object.keys(PAKISTAN_LOCATIONS).map(prov => <option key={prov} value={prov}>{prov}</option>)}
           </select>
           <select 
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              disabled={!selectedProvince}
              className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm disabled:opacity-50"
              required
           >
               <option value="">{selectedProvince ? "Select City" : "Select Province First"}</option>
               {selectedProvince && PAKISTAN_LOCATIONS[selectedProvince]?.map(city => <option key={city} value={city}>{city}</option>)}
           </select>
           <input
              type="text"
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
              placeholder="Shop #, Street, Area / Bazaar"
              required
           />
      </div>
  );

  const renderForm = () => (
    <div className="space-y-6">
      <form onSubmit={isLogin ? handleLoginSubmit : handleSignupSubmit} className="space-y-5">
        {!isLogin && (
          <>
            <InputField id="name" label="Full Name" type="text" value={name} onChange={setName} required />
            <InputField id="phone" label="Phone Number" type="tel" value={phone} onChange={setPhone} required />
            <InputField id="shopName" label="Business / Shop Name" type="text" value={shopName} onChange={setShopName} required />
            <LocationInputs />
          </>
        )}
        <InputField id="email" label="Email Address" type="email" value={email} onChange={setEmail} required />
        <InputField id="password" label="Password" type="password" value={password} onChange={setPassword} required />
        
        {!isLogin && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Referral Code (Optional)</label>
                <input
                  type="text"
                  value={referralCodeInput}
                  onChange={(e) => setReferralCodeInput(e.target.value)}
                  placeholder="e.g. FRIEND-1234"
                  className="block w-full px-4 py-2 bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 rounded-lg outline-none text-sm font-mono"
                />
            </div>
        )}

        {isLogin && (
            <div className="flex justify-end">
                <button type="button" onClick={handlePasswordReset} className="text-xs text-primary dark:text-blue-400 hover:underline font-bold">Forgot Password?</button>
            </div>
        )}

        <button type="submit" className="w-full py-4 px-4 bg-primary text-white font-bold rounded-2xl shadow-xl hover:brightness-110 active:scale-[0.98] transition-all flex justify-center disabled:opacity-50" disabled={isLoading}>
          {isLoading ? <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span> : (isLogin ? 'Sign In' : 'Create Account')}
        </button>
      </form>
    </div>
  );

  const renderVerificationPending = () => (
    <div className="text-center py-6 animate-fade-in">
        <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        </div>
        
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4">Verify Your Email</h2>
        
        <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-800 text-left space-y-4 mb-8">
            <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                A verification link has been sent to your <span className="font-bold">email address</span>.
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                Please check your <span className="font-bold">Inbox</span>. 
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 italic bg-white/50 dark:bg-black/20 p-3 rounded-lg border border-blue-200/50">
                "If you don't see the email, kindly check your <span className="font-bold underline">Spam</span> or <span className="font-bold underline">Trash</span> folder."
            </p>
        </div>

        <div className="space-y-4">
            <button 
                onClick={handleResendEmail}
                disabled={resending}
                className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
                {resending ? <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span> : 'Resend Verification Email'}
            </button>
            
            <button 
                onClick={() => handleModeToggle('login')}
                className="w-full py-3 text-gray-500 font-bold hover:text-primary transition-colors text-sm"
            >
                &larr; Back to Login
            </button>
        </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto mt-4 px-2">
      <div className="bg-white dark:bg-dark-surface rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
        {step === 'form' && (
          <div className="flex bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
            <button onClick={() => handleModeToggle('login')} className={`flex-1 p-4 text-center font-black text-xs tracking-widest transition-all ${isLogin ? 'bg-white dark:bg-dark-surface text-primary border-b-4 border-primary' : 'text-gray-400'}`}>LOG IN</button>
            <button onClick={() => handleModeToggle('signup')} className={`flex-1 p-4 text-center font-black text-xs tracking-widest transition-all ${!isLogin ? 'bg-white dark:bg-dark-surface text-primary border-b-4 border-primary' : 'text-gray-400'}`}>REGISTER</button>
          </div>
        )}
        <div className="p-8">
            {step === 'form' && (
                <div className="mb-8 text-center">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">{isLogin ? 'Welcome Back' : 'Join RizqDaan'}</h2>
                    <p className="text-sm text-gray-500 mt-2">{isLogin ? 'Manage your ads and earnings.' : 'Start your digital shop in minutes.'}</p>
                </div>
            )}
            
            {error && (
                <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-2xl text-xs font-bold leading-relaxed mb-6 animate-pulse shadow-sm flex items-start gap-3">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    {error}
                </div>
            )}
            
            {info && (
                <div className="bg-blue-50 text-blue-600 border border-blue-200 p-4 rounded-2xl text-xs font-bold mb-6 shadow-sm flex items-center gap-3">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {info}
                </div>
            )}
            
            {step === 'form' ? renderForm() : renderVerificationPending()}
        </div>
      </div>
      
      <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 font-medium">
              By continuing, you agree to our 
              <button onClick={() => setLegalModal({ isOpen: true, type: 'tos' })} className="text-primary underline mx-1">Terms of Service</button> 
              and 
              <button onClick={() => setLegalModal({ isOpen: true, type: 'privacy' })} className="text-primary underline mx-1">Privacy Policy</button>.
          </p>
      </div>

      {/* 📜 LEGAL MODAL */}
      {legalModal.isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white dark:bg-dark-surface w-full max-w-lg rounded-[2.5rem] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-white/20">
                  <div className="p-6 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                      <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                          {legalModal.type === 'tos' ? 'Terms of Service' : 'Privacy Policy'}
                      </h3>
                      <button onClick={() => setLegalModal({ ...legalModal, isOpen: false })} className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full hover:scale-110 transition-transform active:scale-90">
                          <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed custom-scrollbar bg-white dark:bg-dark-surface">
                      {legalModal.type === 'tos' ? (
                          <div className="space-y-6">
                              <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center underline">Terms of Service</h2>
                              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest text-center">Last Updated: January 2026</p>
                              
                              <p>Welcome to RizqDaan. These Terms of Service ("Terms", "Agreement") constitute a legally binding agreement between you ("User", "You", "Your") and RizqDaan ("RizqDaan", "We", "Us", "Our") governing your access to and use of the RizqDaan mobile application, website, and all related services, features, content, and products (collectively, the "Platform").</p>
                              
                              <p>By downloading, installing, accessing, or using the Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree with any part of these Terms, you must immediately stop using the Platform.</p>

                              <hr className="dark:border-gray-800" />

                              <div>
                                  <h4 className="font-black text-gray-900 dark:text-white text-base mb-2">1. About RizqDaan</h4>
                                  <p>RizqDaan is a digital business listing and advertisement platform designed to connect local sellers, service providers, and businesses with potential buyers and customers. The Platform allows vendors to list their products or services, display contact information, and promote their offerings. Buyers may browse listings and contact sellers directly.</p>
                                  <p className="mt-2 font-bold">RizqDaan does not:</p>
                                  <ul className="list-disc ml-5 mt-1 space-y-1">
                                      <li>Sell, resell, or distribute any products or services</li>
                                      <li>Act as a broker, agent, or representative of buyers or sellers</li>
                                      <li>Guarantee quality, pricing, availability, delivery, or performance of any product or service</li>
                                      <li>Handle payments, refunds, deliveries, or disputes between users unless explicitly stated</li>
                                  </ul>
                                  <p className="mt-2">All transactions, communications, and agreements are conducted directly between buyers and sellers, and RizqDaan is not a party to such transactions.</p>
                              </div>

                              <div>
                                  <h4 className="font-black text-gray-900 dark:text-white text-base mb-2">2. Eligibility and User Requirements</h4>
                                  <p>To use the Platform, you must:</p>
                                  <ul className="list-disc ml-5 mt-1 space-y-1">
                                      <li>Be at least 18 years old, or have legal parental or guardian consent</li>
                                      <li>Be legally capable of entering into binding contracts under applicable laws of Pakistan</li>
                                      <li>Provide accurate, complete, and truthful information during registration and use</li>
                                      <li>Use the Platform only for lawful purposes</li>
                                  </ul>
                                  <p className="mt-2">We reserve the right to refuse access, suspend accounts, or terminate services to any user who does not meet these eligibility requirements.</p>
                              </div>

                              <div>
                                  <h4 className="font-black text-gray-900 dark:text-white text-base mb-2">3. Account Registration and Security</h4>
                                  <h5 className="font-bold mt-2">3.1 Account Creation</h5>
                                  <p>To access certain features, you may be required to create an account. You agree to:</p>
                                  <ul className="list-disc ml-5 mt-1 space-y-1">
                                      <li>Provide accurate and up-to-date information</li>
                                      <li>Maintain the confidentiality of your login credentials</li>
                                      <li>Update your information if it changes</li>
                                  </ul>
                                  <h5 className="font-bold mt-2">3.2 Account Responsibility</h5>
                                  <p>You are solely responsible for:</p>
                                  <ul className="list-disc ml-5 mt-1 space-y-1">
                                      <li>All activities that occur under your account</li>
                                      <li>Maintaining the security of your password and device</li>
                                  </ul>
                                  <p className="mt-2">RizqDaan will not be liable for any loss or damage arising from unauthorized access to your account.</p>
                              </div>

                              <div>
                                  <h4 className="font-black text-gray-900 dark:text-white text-base mb-2">4. Vendor and Seller Responsibilities</h4>
                                  <p>If you register as a seller or service provider, you agree that:</p>
                                  <ul className="list-disc ml-5 mt-1 space-y-1">
                                      <li>All listings must be accurate, lawful, and not misleading</li>
                                      <li>You own or have legal rights to sell or advertise the listed products or services</li>
                                      <li>Your listings comply with all applicable local, provincial, and federal laws</li>
                                      <li>You will handle customer inquiries, payments, refunds, and deliveries independently</li>
                                  </ul>
                                  <p className="mt-2">RizqDaan reserves the right to edit, reject, suspend, or remove any listing that violates these Terms without prior notice.</p>
                              </div>

                              <div>
                                  <h4 className="font-black text-gray-900 dark:text-white text-base mb-2">5. Buyer Responsibilities</h4>
                                  <p>As a buyer or viewer, you acknowledge that:</p>
                                  <ul className="list-disc ml-5 mt-1 space-y-1">
                                      <li>You are responsible for verifying seller credibility before any transaction</li>
                                      <li>RizqDaan does not guarantee seller identity, quality, or reliability</li>
                                      <li>Any transaction you enter into is at your own risk</li>
                                  </ul>
                                  <p className="mt-2">We strongly recommend meeting sellers safely, verifying products, and avoiding advance payments where possible.</p>
                              </div>

                              <div>
                                  <h4 className="font-black text-gray-900 dark:text-white text-base mb-2">6. Subscription Fees and Payments</h4>
                                  <p>Some features of the Platform may require a paid subscription or promotional fee. By purchasing a subscription, you agree that:</p>
                                  <ul className="list-disc ml-5 mt-1 space-y-1">
                                      <li>Fees are charged as described at the time of purchase</li>
                                      <li>Payments are non-refundable unless explicitly stated</li>
                                      <li>RizqDaan may change pricing with prior notice</li>
                                  </ul>
                                  <p className="mt-2">Failure to pay applicable fees may result in suspension or removal of listings.</p>
                              </div>

                              <div>
                                  <h4 className="font-black text-gray-900 dark:text-white text-base mb-2">7. Prohibited Activities</h4>
                                  <p>You agree not to:</p>
                                  <ul className="list-disc ml-5 mt-1 space-y-1">
                                      <li>Post false, misleading, or fraudulent listings</li>
                                      <li>Engage in illegal, harmful, abusive, or deceptive activities</li>
                                      <li>Upload viruses, malware, or harmful code</li>
                                      <li>Attempt to bypass security or access restricted areas</li>
                                      <li>Use the Platform for money laundering, scams, or prohibited goods</li>
                                  </ul>
                                  <p className="mt-2">Violation of this section may result in immediate account termination and legal action.</p>
                              </div>

                              <div>
                                  <h4 className="font-black text-gray-900 dark:text-white text-base mb-2">8. Content Ownership and License</h4>
                                  <h5 className="font-bold mt-2">8.1 User Content</h5>
                                  <p>You retain ownership of any content you submit, including text, images, and business information. However, by posting content, you grant RizqDaan a non-exclusive, royalty-free, worldwide license to use, display, reproduce, and promote such content for Platform-related purposes.</p>
                                  <h5 className="font-bold mt-2">8.2 Platform Content</h5>
                                  <p>All logos, trademarks, designs, software, and content provided by RizqDaan are owned by or licensed to us and may not be copied, modified, or distributed without written permission.</p>
                              </div>

                              <div>
                                  <h4 className="font-black text-gray-900 dark:text-white text-base mb-2">9. Privacy and Data Protection</h4>
                                  <p>Your use of the Platform is also governed by our Privacy Policy, which explains how we collect, use, and protect your personal data. By using RizqDaan, you consent to such data practices.</p>
                              </div>

                              <div>
                                  <h4 className="font-black text-gray-900 dark:text-white text-base mb-2">10. Third-Party Services and Links</h4>
                                  <p>The Platform may contain links to third-party websites or services. RizqDaan does not control or endorse these services and is not responsible for their content, policies, or practices. You access third-party services at your own risk.</p>
                              </div>

                              <div>
                                  <h4 className="font-black text-gray-900 dark:text-white text-base mb-2">11. Disclaimers</h4>
                                  <p>The Platform is provided on an "as is" and "as available" basis. To the fullest extent permitted by law, RizqDaan disclaims all warranties, including but not limited to: Merchantability, Fitness for a particular purpose, Accuracy or reliability of listings, Uninterrupted or error-free service.</p>
                              </div>

                              <div>
                                  <h4 className="font-black text-gray-900 dark:text-white text-base mb-2">12. Limitation of Liability</h4>
                                  <p>To the maximum extent permitted by law, RizqDaan shall not be liable for: Any indirect, incidental, or consequential damages, Loss of profits, data, or business, Disputes, losses, or damages arising from user transactions. Your sole remedy is to stop using the Platform.</p>
                              </div>

                              <div>
                                  <h4 className="font-black text-gray-900 dark:text-white text-base mb-2">13. Indemnification</h4>
                                  <p>You agree to indemnify and hold harmless RizqDaan, its owners, employees, and partners from any claims, damages, losses, or expenses arising out of: Your use of the Platform, Your violation of these Terms, Your interaction or transactions with other users.</p>
                              </div>

                              <div>
                                  <h4 className="font-black text-gray-900 dark:text-white text-base mb-2">14. Suspension and Termination</h4>
                                  <p>RizqDaan reserves the right to: Suspend or terminate accounts without notice, Remove content or listings at its discretion, Restrict access for violations of these Terms. Upon termination, all rights granted to you under these Terms will immediately cease.</p>
                              </div>

                              <div>
                                  <h4 className="font-black text-gray-900 dark:text-white text-base mb-2">15. Modifications to Terms</h4>
                                  <p>We may update or modify these Terms at any time. Continued use of the Platform after changes constitutes acceptance of the revised Terms.</p>
                              </div>

                              <div>
                                  <h4 className="font-black text-gray-900 dark:text-white text-base mb-2">16. Governing Law and Jurisdiction</h4>
                                  <p>These Terms shall be governed by and construed in accordance with the laws of the Islamic Republic of Pakistan. Any disputes shall be subject to the exclusive jurisdiction of the courts of Pakistan.</p>
                              </div>

                              <div>
                                  <h4 className="font-black text-gray-900 dark:text-white text-base mb-2">17. Severability</h4>
                                  <p>If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.</p>
                              </div>

                              <div>
                                  <h4 className="font-black text-gray-900 dark:text-white text-base mb-2">18. Entire Agreement</h4>
                                  <p>These Terms, together with our Privacy Policy, constitute the entire agreement between you and RizqDaan regarding use of the Platform.</p>
                              </div>

                              <div>
                                  <h4 className="font-black text-gray-900 dark:text-white text-base mb-2">19. Contact Information</h4>
                                  <p>If you have any questions, concerns, or legal notices regarding these Terms, you may contact us through the official support channels within the app or via WhatsApp at +92370957756.</p>
                              </div>
                          </div>
                      ) : (
                          <div className="space-y-6">
                              <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center underline">Privacy Policy</h2>
                              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest text-center">Last updated: January 2026</p>
                              
                              <p>This Privacy Policy describes how we collect, use, disclose, and protect your information when you use our mobile application, website, and related services (collectively, the “App” or “Services”). By accessing or using our App, you agree to the collection and use of information in accordance with this Privacy Policy.</p>
                              <p>We are committed to protecting your privacy and ensuring transparency regarding how your data is handled.</p>

                              <div>
                                  <h4 className="font-black text-gray-900 dark:text-white text-base mb-2">1. Introduction</h4>
                                  <p>Your privacy is extremely important to us. This Privacy Policy explains: What information we collect, How we use your information, How we store and protect your data, When and why we share information, Your rights and choices regarding your data. If you do not agree with this Privacy Policy, please do not use our App.</p>
                              </div>

                              <div>
                                  <h4 className="font-black text-gray-900 dark:text-white text-base mb-2">2. Information We Collect</h4>
                                  <p>We collect different types of information for various purposes to provide and improve our services.</p>
                                  <h5 className="font-bold mt-2">2.1 Personal Information</h5>
                                  <p>We may collect personally identifiable information, including: Full name, Phone number, Email address, Profile photo, Business name, Business address and location. This is collected when you register, create a profile, or list services.</p>
                                  <h5 className="font-bold mt-2">2.2 Non-Personal Information</h5>
                                  <p>We automatically collect certain non-identifiable information such as: Device type, Operating system, IP address, and Usage statistics to help us understand how users interact with the App.</p>
                                  <h5 className="font-bold mt-2">2.3 Location Information</h5>
                                  <p>We may collect: Approximate location (city-level) and location you manually provide in listings. We do not track real-time GPS location unless explicitly permitted by you.</p>
                                  <h5 className="font-bold mt-2">2.4 User-Generated Content</h5>
                                  <p>We collect content you voluntarily submit, including listings, images, videos, reviews, and messages sent through the App.</p>
                                  <h5 className="font-bold mt-2">2.5 Payment Information</h5>
                                  <p>We do not store sensitive payment details such as card numbers. Payments are processed through third-party providers.</p>
                              </div>

                              <div>
                                  <h4 className="font-black text-gray-900 dark:text-white text-base mb-2">3. How We Use Your Information</h4>
                                  <p>We use information to: provide and maintain the App, create and manage accounts, verify users and prevent fraud, display listings, communicate with users, provide support, and improve app performance.</p>
                              </div>

                              <div>
                                  <h4 className="font-black text-gray-900 dark:text-white text-base mb-2">4. Sharing of Information</h4>
                                  <p>We do not sell or rent your personal data. We may share information: With other users (public business details), With service providers (hosting, analytics), For legal requirements (court orders), or during business transfers.</p>
                              </div>

                              <div>
                                  <h4 className="font-black text-gray-900 dark:text-white text-base mb-2">5. Data Storage and Security</h4>
                                  <p>We take reasonable security measures to protect your information, including secure servers and encrypted connections (HTTPS). However, no method of transmission over the internet is 100% secure.</p>
                              </div>

                              <div>
                                  <h4 className="font-black text-gray-900 dark:text-white text-base mb-2">6. Data Retention</h4>
                                  <p>We retain your information only for as long as necessary to provide services, comply with legal obligations, and resolve disputes. You may request deletion of your account at any time.</p>
                              </div>

                              <div>
                                  <h4 className="font-black text-gray-900 dark:text-white text-base mb-2">7. User Rights</h4>
                                  <p>You may have the right to: Access your personal data, Correct inaccurate information, Request deletion of your data, or Withdraw consent. You can exercise these rights by contacting us.</p>
                              </div>

                              <div>
                                  <h4 className="font-black text-gray-900 dark:text-white text-base mb-2">8. Account Deletion</h4>
                                  <p>You may delete your account through app settings or by contacting customer support. Upon deletion, your personal data will be permanently removed unless required by law.</p>
                              </div>

                              <div>
                                  <h4 className="font-black text-gray-900 dark:text-white text-base mb-2">9. Cookies and Tracking Technologies</h4>
                                  <p>We may use cookies or similar technologies to improve user experience and analyze usage. You can disable cookies through your device settings.</p>
                              </div>

                              <div>
                                  <h4 className="font-black text-gray-900 dark:text-white text-base mb-2">10. Third-Party Links</h4>
                                  <p>Our App may contain links to third-party websites. We are not responsible for their privacy practices and encourage you to review their policies.</p>
                              </div>

                              <div>
                                  <h4 className="font-black text-gray-900 dark:text-white text-base mb-2">11. Children’s Privacy</h4>
                                  <p>Our App is not intended for children under 13. We do not knowingly collect personal information from children and will delete such data if identified.</p>
                              </div>

                              <div>
                                  <h4 className="font-black text-gray-900 dark:text-white text-base mb-2">12. Advertisements</h4>
                                  <p>We may display advertisements through third-party networks. These networks may collect non-personal data to show relevant ads.</p>
                              </div>

                              <div>
                                  <h4 className="font-black text-gray-900 dark:text-white text-base mb-2">13. Push Notifications</h4>
                                  <p>We may send push notifications for account updates and new features. You can disable notifications through your device settings.</p>
                              </div>

                              <div>
                                  <h4 className="font-black text-gray-900 dark:text-white text-base mb-2">14. International Data Transfers</h4>
                                  <p>Your information may be stored or processed outside your country. By using the App, you consent to such transfers.</p>
                              </div>

                              <div>
                                  <h4 className="font-black text-gray-900 dark:text-white text-base mb-2">15. Changes to This Privacy Policy</h4>
                                  <p>We reserve the right to update this Privacy Policy at any time. Continued use of the App constitutes acceptance of the revised policy.</p>
                              </div>

                              <div>
                                  <h4 className="font-black text-gray-900 dark:text-white text-base mb-2">16. Consent</h4>
                                  <p>By using our App, you confirm that you have read and understood this Privacy Policy and agree to its terms.</p>
                              </div>

                              <div>
                                  <h4 className="font-black text-gray-900 dark:text-white text-base mb-2">17. Contact Information</h4>
                                  <p>If you have any questions regarding this policy, you may contact us via WhatsApp at +92370957756.</p>
                              </div>

                              <div>
                                  <h4 className="font-black text-gray-900 dark:text-white text-base mb-2">18. Compliance with Laws</h4>
                                  <p>We comply with applicable data protection laws, local privacy laws, and platform policies of Google Play and Apple App Store.</p>
                              </div>

                              <div>
                                  <h4 className="font-black text-gray-900 dark:text-white text-base mb-2">19. Limitation of Liability</h4>
                                  <p>We are not responsible for unauthorized access beyond our control or third-party actions.</p>
                              </div>

                              <div>
                                  <h4 className="font-black text-gray-900 dark:text-white text-base mb-2">20. Final Acknowledgment</h4>
                                  <p>By continuing to use our App, you acknowledge that you have read, understood, and agreed to this Privacy Policy.</p>
                              </div>

                              <div className="p-4 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/20">
                                  <p className="text-xs text-primary font-bold">Official Support:</p>
                                  <p className="text-sm dark:text-gray-300">WhatsApp: +92370957756</p>
                              </div>
                          </div>
                      )}
                  </div>
                  <div className="p-6 border-t dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex justify-center">
                       <button onClick={() => setLegalModal({ ...legalModal, isOpen: false })} className="px-10 py-3 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-full shadow-lg active:scale-95 transition-all">I Understand & Accept</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

const InputField = ({ id, label, type, value, onChange, required=false, disabled=false }: { id: string, label: string, type: string, value: string, onChange?: (val: string) => void, required?: boolean, disabled?: boolean }) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">{label}</label>
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange && onChange(e.target.value)}
      className="block w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-primary/30 rounded-2xl shadow-inner focus:outline-none disabled:bg-gray-100 dark:disabled:bg-gray-800 dark:text-white transition-all text-sm font-medium"
      required={required}
      disabled={disabled}
    />
  </div>
);

export default AuthPage;
