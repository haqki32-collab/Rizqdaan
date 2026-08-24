import { doc, getDoc, setDoc, updateDoc, increment, arrayUnion, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Transaction, AppNotification } from '../types';

export interface LaunchBonusConfig {
  maxSpots: number;
  claimedCount: number;
  bonusAmount: number;
  isActive: boolean;
}

const DEFAULT_BONUS_CONFIG: LaunchBonusConfig = {
  maxSpots: 50,
  claimedCount: 12, // Starting claim count showing traction
  bonusAmount: 1000,
  isActive: true,
};

export const getLaunchBonusStats = async (): Promise<LaunchBonusConfig> => {
  if (!db) return DEFAULT_BONUS_CONFIG;
  try {
    const docRef = doc(db, 'settings', 'launch_bonus');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...DEFAULT_BONUS_CONFIG, ...(snap.data() as Partial<LaunchBonusConfig>) };
    } else {
      // Initialize setting if not present
      await setDoc(docRef, DEFAULT_BONUS_CONFIG, { merge: true });
      return DEFAULT_BONUS_CONFIG;
    }
  } catch (err) {
    console.warn("Launch bonus config fetch warning:", err);
    return DEFAULT_BONUS_CONFIG;
  }
};

export const claimFirstAdBonus = async (userId: string, userName: string): Promise<{ success: boolean; amount?: number; message?: string; alreadyClaimed?: boolean }> => {
  if (!db || !userId) return { success: false, message: "Invalid session." };

  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return { success: false, message: "User not found." };
    }

    const userData = userSnap.data();
    if (userData.hasReceivedFirstAdBonus) {
      return { success: false, alreadyClaimed: true, message: "Bonus already claimed previously." };
    }

    const bonusStats = await getLaunchBonusStats();
    if (!bonusStats.isActive || bonusStats.claimedCount >= bonusStats.maxSpots) {
      return { success: false, message: "Offer limit reached (First 50 users completed)." };
    }

    const bonusAmount = bonusStats.bonusAmount || 1000;
    const currentBalance = userData.wallet?.balance || 0;
    const newBalance = currentBalance + bonusAmount;

    const bonusTx: Transaction = {
      id: `tx_bonus_${Date.now()}`,
      type: 'bonus',
      amount: bonusAmount,
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
      description: `🎉 Welcome Bonus (First 50 Users Offer) - پہلے 50 صارفین کے لیے 1000 روپے بونس`
    };

    // Update user wallet & bonus status
    await updateDoc(userRef, {
      'wallet.balance': newBalance,
      hasReceivedFirstAdBonus: true,
      walletHistory: arrayUnion(bonusTx)
    });

    // Increment bonus claim counter in settings
    try {
      const configRef = doc(db, 'settings', 'launch_bonus');
      await updateDoc(configRef, {
        claimedCount: increment(1)
      });
    } catch (e) {
      console.warn("Bonus count update warning:", e);
    }

    // Add In-App Notification
    try {
      const notifData: Omit<AppNotification, 'id'> = {
        userId: userId,
        title: '🎉 1,000 روپے بونس اکاؤنٹ میں شامل!',
        message: `مبارک ہو ${userName}! پہلا اشتہار لگانے پر آپ کو 1,000 روپے کا سائن اپ بونس مل گیا ہے۔ اسے اپنے اشتہار کو Featured / Promote کرنے کے لیے استعمال کریں۔`,
        type: 'success',
        isRead: false,
        createdAt: new Date().toISOString(),
        link: 'vendor-dashboard'
      };
      await addDoc(collection(db, 'notifications'), notifData);
    } catch (e) {
      console.warn("Notification creation warning:", e);
    }

    return { success: true, amount: bonusAmount, message: "Bonus credited successfully!" };
  } catch (err: any) {
    console.error("Claim first ad bonus error:", err);
    return { success: false, message: err?.message || "Failed to credit bonus." };
  }
};
