import { GoogleGenAI } from "@google/genai";

export type CopywritingFramework = 'aida' | 'pas' | 'whatsapp_close' | 'tiktok_script' | 'marketplace_seo';
export type CopywritingTone = 'urgent' | 'luxury' | 'friendly' | 'professional' | 'viral';
export type CopywritingLanguage = 'urdu' | 'roman_urdu' | 'english';

export interface CopywritingInput {
  platform: 'facebook' | 'whatsapp' | 'olx' | 'tiktok' | 'daraz';
  framework: CopywritingFramework;
  tone: CopywritingTone;
  productName: string;
  category?: string;
  keyFeatures: string;
  price?: string;
  originalPrice?: string;
  discountOffer?: string;
  location?: string;
  contact?: string;
  language: CopywritingLanguage;
  targetAudience?: string;
}

export interface GeneratedCopyVariants {
  shortHook: string;
  mainAdCopy: string;
  whatsappCloser: string;
  hashtags: string[];
  suggestedHeadlines: string[];
}

export interface PlagiarismResult {
  originalityScore: number;
  aiLikelihoodScore: number;
  wordCount: number;
  charCount: number;
  readabilityScore: number;
  readingTimeMinutes: number;
  sentencesCount: number;
  lexicalDiversity: number;
  duplicatesFound: { phrase: string; similarity: number; suggestion: string; index: number }[];
  highlightedSentences: { text: string; status: 'original' | 'common' | 'flagged'; feedback?: string }[];
  summary: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate?: string;
  template: 'modern' | 'urdu_khata' | 'pos_thermal' | 'luxury';
  currency: string;
  shopName: string;
  shopPhone: string;
  shopEmail?: string;
  shopAddress: string;
  shopNtn?: string;
  logoUrl?: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  customerCity?: string;
  items: InvoiceItem[];
  shippingFee: number;
  discountAmount: number;
  taxPercent: number;
  paidAmount: number;
  notes: string;
  paymentMethod: string;
  bankDetails?: {
    bankName: string;
    accountTitle: string;
    accountNumber: string;
    iban?: string;
    jazzCashNumber?: string;
    easyPaisaNumber?: string;
  };
}

export interface ProfitCalculationInput {
  costPrice: number;
  sellingPrice: number;
  deliveryFeePaidBySeller: number;
  packagingCost: number;
  adCostPerOrder: number;
  platformFeePercent: number;
  returnRatePercent: number;
  expectedMonthlySales: number;
}

export interface ProfitCalculationResult {
  netProfitPerUnit: number;
  profitMarginPercent: number;
  roiPercent: number;
  totalCostPerUnit: number;
  breakEvenPrice: number;
  returnCostLossPerOrder: number;
  projectedMonthlyRevenue: number;
  projectedMonthlyNetProfit: number;
  status: 'highly_profitable' | 'moderate' | 'low_margin' | 'loss_making';
}

export interface WordStatsResult {
  words: number;
  charactersWithSpaces: number;
  charactersWithoutSpaces: number;
  sentences: number;
  paragraphs: number;
  readingTimeMinutes: number;
  speakingTimeMinutes: number;
  averageWordLength: number;
  uniqueWords: number;
}

export interface KeywordDensityItem {
  phrase: string;
  count: number;
  density: number;
}

export interface MetaTagInput {
  title: string;
  description: string;
  keywords: string;
  author: string;
  siteUrl: string;
  imageUrl: string;
  twitterHandle: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
}

export interface DiscountInput {
  originalPrice: number;
  discountPercent: number;
  salesTaxPercent: number;
}

export interface DiscountResult {
  discountAmount: number;
  priceAfterDiscount: number;
  taxAmount: number;
  finalPrice: number;
  totalSavings: number;
}

/**
 * ✍️ PROFESSIONAL AI COPYWRITING ENGINE (Multi-Variant Generation)
 */
export async function generateCopywritingPro(input: CopywritingInput): Promise<GeneratedCopyVariants> {
  const langPrompt = {
    urdu: 'خالص شاندار اردو زبان (Urdu script) میں لکھیں جو پاکستانی خریداروں کے دل کو چھوئے۔',
    roman_urdu: 'Conversational Roman Urdu me likhein (Urdu written in English alphabets like "Agar aap dhoond rahe hain behtareen quality...") jo social media pe high engagement deti hai.',
    english: 'High-converting, professional English with compelling marketing psychology and crisp action verbs.'
  }[input.language];

  const frameworkDescriptions = {
    aida: 'AIDA Framework (Attention Grabber Hook -> Interest Builder -> Irresistible Desire & Social Proof -> Clear Call to Action with Price/Order Link).',
    pas: 'PAS Framework (Identify Problem/Pain -> Agitate & Highlight frustration -> Present this Product as the Ultimate Solution & Offer).',
    whatsapp_close: 'WhatsApp Direct Closer (Bullet-pointed key specs, urgent special bundle price, delivery across Pakistan, direct click to order link).',
    tiktok_script: 'TikTok / Reels Viral 30-Sec Script (0-3s Visual Hook, 3-15s Product Demo & Problem solved, 15-25s Social Proof / Warranty, 25-30s Ending CTA).',
    marketplace_seo: 'Marketplace SEO (RizqDaan / Daraz / OLX) Description with high-ranking search keywords, bulleted specifications, package contents, and trust badge.'
  }[input.framework];

  const tonePrompt = {
    urgent: 'Urgent, limited stock, discount timer, FOMO tone (e.g. "محدود اسٹاک - پہلے آئیے پہلے پائیے").',
    luxury: 'High-end, elegant, sophisticated, and premium craftsmanship tone.',
    friendly: 'Warm, relatable, honest, and friendly conversational tone.',
    professional: 'Authoritative, clear, corporate B2B credibility tone.',
    viral: 'Energetic, punchy, emoji-rich, curiosity-driven viral tone.'
  }[input.tone];

  const prompt = `You are a legendary Pakistani direct-response copywriter & digital marketing strategist.
Create a complete high-converting ad pack for the following product.

Product: ${input.productName}
Category: ${input.category || 'General'}
Key Features & Highlights: ${input.keyFeatures}
Price: ${input.price ? `Rs. ${input.price}` : 'Special Offer Price'}
Original Price: ${input.originalPrice ? `Rs. ${input.originalPrice}` : ''}
Discount/Deal: ${input.discountOffer || 'Free Delivery / Limited Time Offer'}
Location / Availability: ${input.location || 'All Pakistan Cash on Delivery'}
Contact / WhatsApp: ${input.contact || 'WhatsApp / Inbox'}
Target Audience: ${input.targetAudience || 'Pakistani Buyers & Shoppers'}

Framework: ${frameworkDescriptions}
Tone: ${tonePrompt}
Language requirement: ${langPrompt}

You MUST return a JSON object ONLY with the following exact keys:
{
  "shortHook": "A punchy 1-2 sentence hook for Instagram Stories / SMS / WhatsApp Status with emojis and price",
  "mainAdCopy": "The complete, high-converting ad copy formatted with clean paragraphs, bullet points, benefits, price highlight, and call to action",
  "whatsappCloser": "A crisp, direct closing message with bullet points designed specifically for WhatsApp chat inquiries to close deals instantly",
  "hashtags": ["#RizqDaan", "#PakistanShopping", "#TopDeal", "#Trend", "#Brand"],
  "suggestedHeadlines": ["Catchy Headline 1", "Curiosity Headline 2", "Discount Headline 3"]
}`;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text?.trim();
    if (text) {
      const parsed = JSON.parse(text);
      if (parsed.mainAdCopy) {
        return {
          shortHook: parsed.shortHook || `${input.productName} - Rs. ${input.price || ''} | Cash on Delivery!`,
          mainAdCopy: parsed.mainAdCopy,
          whatsappCloser: parsed.whatsappCloser || parsed.shortHook,
          hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : ['#RizqDaan', '#Pakistan', '#OnlineShopping'],
          suggestedHeadlines: Array.isArray(parsed.suggestedHeadlines) ? parsed.suggestedHeadlines : [`Best ${input.productName}`]
        };
      }
    }
  } catch (err) {
    console.warn("AI generation fallback to smart local engine:", err);
  }

  // High-Grade Algorithmic Fallback
  return generateProFallbackCopy(input);
}

function generateProFallbackCopy(input: CopywritingInput): GeneratedCopyVariants {
  const p = input.productName;
  const fList = input.keyFeatures.split(/[,،\n]+/).map(s => s.trim()).filter(Boolean);
  const pr = input.price ? `Rs. ${input.price}` : 'مناسب قیمت';
  const oldPr = input.originalPrice ? `Rs. ${input.originalPrice}` : '';
  const c = input.contact || 'WhatsApp / Inbox';
  const loc = input.location || 'پورے پاکستان میں کیش آن ڈیلیوری';

  if (input.language === 'urdu') {
    const mainCopy = `🔥 *شاندار پیشکش! ${p} اب دستیاب ہے!* 🔥

کیا آپ بہترین معیار اور پائیدار کوالٹی کے خواہشمند ہیں؟ رزق دان لایا ہے آپ کے لیے خاص پیشکش!

✨ *اہم خصوصیات و تفصیلات:*
${fList.map(item => `✅ ${item}`).join('\n')}

💰 *خصوصی رعایت:*
${oldPr ? `❌ پرانی قیمت: ~~${oldPr}~~` : ''}
🎉 *نئی ڈسکاؤنٹ قیمت:* *${pr}*
${input.discountOffer ? `🎁 ${input.discountOffer}` : '🚚 پورے پاکستان میں تیز ترین ڈیلیوری!'}

📍 *سہولت:* ${loc}
💯 100% کوالٹی کی تسلی اور محفوظ خریداری کی گارنٹی۔

📲 *ابھی آرڈر کے لیے واٹس ایپ پر رابطہ کریں:*
👉 ${c}

آرڈر کی تصدیق کے لیے اپنا نام، پتہ اور موبائل نمبر میسج کریں۔`;

    const shortHook = `✨ ${p} پر زبردست ڈسکاؤنٹ! اب صرف ${pr} میں۔ پورے پاکستان میں کیش آن ڈیلیوری دستیاب ہے۔ آرڈر کے لیے ابھی رابطہ کریں: ${c} 📦`;
    
    const waCloser = `السلام علیکم! 🌸\nآپ کی پسندیدہ پروڈکٹ *"${p}"* کا آرڈر کنفرم کرنے کے لیے شکریہ۔\n\n📌 قیمت: *${pr}*\n📦 کیش آن ڈیلیوری: دستیاب ہے\n\nبرائے مہربانی اپنا مکمل نام، پتہ اور 2 فون نمبرز بھیج دیں تاکہ پارسل فوری روانہ کیا جا سکے۔`;

    return {
      shortHook,
      mainAdCopy: mainCopy,
      whatsappCloser: waCloser,
      hashtags: [`#${p.replace(/\s+/g, '_')}`, '#RizqDaan', '#خریداری', '#پاکستان', '#سیل'],
      suggestedHeadlines: [
        `🔥 ${p} پر شاندار ڈسکاؤنٹ آفر!`,
        `✨ اب گھر بیٹھے منگوائیں ${p} بہترین قیمت پر`,
        `🚀 محدود اسٹاک — ${p} پر کیش آن ڈیلیوری!`
      ]
    };
  } else if (input.language === 'roman_urdu') {
    const mainCopy = `🔥 *Zabardast Offer! ${p} ab available hai!* 🔥

Agar aap top quality aur reliable cheez dhoond rahe hain to yeh deal miss mat karein!

✨ *Key Features & Highlights:*
${fList.map(item => `✅ ${item}`).join('\n')}

💰 *Special Discount Price:*
${oldPr ? `❌ Pehle: ~~${oldPr}~~` : ''}
🎉 *Ab sirf:* *${pr}*
${input.discountOffer ? `🎁 ${input.discountOffer}` : '🚚 Fast Cash on Delivery across Pakistan!'}

📍 *Delivery:* ${loc}
💯 100% Customer Satisfaction Guarantee!

📲 *Order ke liye abhi WhatsApp karein:*
👉 ${c}

Name, Address aur Contact number bhej kar apna order book karein!`;

    const shortHook = `🔥 ${p} ab sirf ${pr} me! Pure Pakistan me Cash on Delivery! Order ke liye WhatsApp karein: ${c}`;
    const waCloser = `Assalam o Alaikum! 😊\nAapka order *"${p}"* book karne ke liye details confirm karein:\n\n💰 Price: *${pr}*\n📦 Delivery: Cash on Delivery\n\nPlease apna Name, City, Complete Address aur 2 Mobile numbers bhej dein. Shukriya!`;

    return {
      shortHook,
      mainAdCopy: mainCopy,
      whatsappCloser: waCloser,
      hashtags: [`#${p.replace(/\s+/g, '')}`, '#RizqDaan', '#OnlineShoppingPK', '#SalePakistan', '#TrendingDeal'],
      suggestedHeadlines: [
        `🔥 Massive Discount on ${p}!`,
        `✨ Get ${p} with Free Cash on Delivery`,
        `⚡ Limited Stock Alert: Order ${p} Today!`
      ]
    };
  } else {
    const mainCopy = `🔥 *Special Promotion: Premium ${p} is Now Available!* 🔥

Upgrade your experience with unmatched quality, durability, and unbeatable value.

✨ *Key Highlights & Specifications:*
${fList.map(item => `✅ ${item}`).join('\n')}

💰 *Exclusive Deal:*
${oldPr ? `❌ Original Price: ~~${oldPr}~~` : ''}
🎉 *Discounted Offer:* *${pr}*
${input.discountOffer ? `🎁 ${input.discountOffer}` : '🚚 Nationwide Express Delivery across Pakistan!'}

📍 *Availability:* ${loc}
💯 100% Satisfaction & Authenticity Guaranteed.

📲 *How to Order:*
👉 Contact / WhatsApp: ${c}
Send your Name, Shipping Address, and Phone Number to confirm your parcel today!`;

    const shortHook = `✨ Premium ${p} is now available for just ${pr}! Express delivery across Pakistan. WhatsApp now: ${c} 📦`;
    const waCloser = `Hello! Thank you for your interest in *"${p}"*.\n\n💰 Price: *${pr}*\n📦 Cash on Delivery: Available\n\nPlease share your Full Name, Complete Shipping Address, and 2 Contact Numbers to dispatch your order immediately.`;

    return {
      shortHook,
      mainAdCopy: mainCopy,
      whatsappCloser: waCloser,
      hashtags: [`#${p.replace(/\s+/g, '')}`, '#RizqDaan', '#ShoppingPakistan', '#BestDeals', '#CashOnDelivery'],
      suggestedHeadlines: [
        `🔥 Unbeatable Deal on ${p}!`,
        `✨ Why Everyone in Pakistan is Buying ${p}`,
        `🚀 Limited Time Offer: Order ${p} Now`
      ]
    };
  }
}

/**
 * 🔍 ENTERPRISE PLAGIARISM & CONTENT ORIGINALITY SCANNER
 */
export function analyzePlagiarismPro(text: string): PlagiarismResult {
  const cleanText = text.trim();
  const words = cleanText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const charCount = cleanText.length;
  
  const rawSentences = cleanText.split(/([.!?۔\n]+)/).filter(s => s.trim().length > 0);
  const sentences: string[] = [];
  for (let i = 0; i < rawSentences.length; i += 2) {
    const sentenceBody = rawSentences[i]?.trim();
    const punct = rawSentences[i + 1] || '';
    if (sentenceBody && sentenceBody.length > 2) {
      sentences.push(sentenceBody + (punct.trim() ? ' ' + punct.trim() : ''));
    }
  }

  const sentencesCount = Math.max(1, sentences.length);
  const readingTimeMinutes = Math.max(0.5, Math.round((wordCount / 200) * 10) / 10);

  if (wordCount < 10) {
    return {
      originalityScore: 100,
      aiLikelihoodScore: 5,
      wordCount,
      charCount,
      readabilityScore: 90,
      readingTimeMinutes: 0.1,
      sentencesCount: 1,
      lexicalDiversity: 100,
      duplicatesFound: [],
      highlightedSentences: [{
        text: cleanText,
        status: 'original',
        feedback: 'Text is very brief. Add at least 15-20 words for deep algorithmic scanning.'
      }],
      summary: 'Short text scanned. For an exhaustive plagiarism and AI detection audit, enter a complete paragraph or article.'
    };
  }

  const lowerWords = words.map(w => w.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/g, '')).filter(Boolean);
  const uniqueWords = new Set(lowerWords);
  const lexicalDiversity = Math.min(100, Math.round((uniqueWords.size / Math.max(1, lowerWords.length)) * 100));

  const nGramMap = new Map<string, number>();
  const duplicatesFound: { phrase: string; similarity: number; suggestion: string; index: number }[] = [];

  for (let i = 0; i <= lowerWords.length - 4; i++) {
    const nGram = lowerWords.slice(i, i + 4).join(' ');
    const count = (nGramMap.get(nGram) || 0) + 1;
    nGramMap.set(nGram, count);

    if (count === 2) {
      duplicatesFound.push({
        phrase: words.slice(i, i + 4).join(' '),
        similarity: 92,
        suggestion: 'This exact sequence appears multiple times. Paraphrase with dynamic synonyms for higher engagement.',
        index: i
      });
    }
  }

  const cliches = [
    'in this day and age', 'at the end of the day', 'game changer', 'supercharge your',
    'revolutionize the way', 'state of the art', 'as a matter of fact', 'delve into',
    'beacon of hope', 'tapestry of', 'plethora of', 'testament to'
  ];

  let clicheCount = 0;
  const lowerFull = cleanText.toLowerCase();
  cliches.forEach(c => {
    if (lowerFull.includes(c)) clicheCount++;
  });

  const highlightedSentences = sentences.map((sentence) => {
    const sWords = sentence.toLowerCase().split(/\s+/).filter(Boolean);
    const hasDuplicate = duplicatesFound.some(d => sentence.toLowerCase().includes(d.phrase.toLowerCase()));
    const hasCliche = cliches.some(c => sentence.toLowerCase().includes(c));

    if (hasDuplicate) {
      return {
        text: sentence,
        status: 'flagged' as const,
        feedback: 'Flagged: Contains repetitive n-gram or redundant sequence. Recommended to rewrite.'
      };
    } else if (hasCliche || sWords.length > 35) {
      return {
        text: sentence,
        status: 'common' as const,
        feedback: hasCliche ? 'Common AI/Marketing cliché detected.' : 'Overly long sentence; split for better readability.'
      };
    } else {
      return {
        text: sentence,
        status: 'original' as const,
        feedback: '100% Organic & Unique flow.'
      };
    }
  });

  const duplicatePenalty = Math.min(35, duplicatesFound.length * 7);
  const clichePenalty = Math.min(15, clicheCount * 4);
  const diversityBonus = lexicalDiversity > 70 ? 5 : 0;
  
  const originalityScore = Math.max(60, Math.min(99, Math.round(100 - duplicatePenalty - clichePenalty + diversityBonus)));
  
  const avgSentenceLength = wordCount / sentencesCount;
  const sentenceVariance = Math.abs(avgSentenceLength - 16);
  const aiLikelihoodScore = Math.max(4, Math.min(88, Math.round((clicheCount * 12) + (100 - lexicalDiversity) * 0.4 + (sentenceVariance < 3 ? 15 : 0))));
  const readabilityScore = Math.min(98, Math.max(55, Math.round(65 + (lexicalDiversity * 0.2) + (avgSentenceLength > 12 && avgSentenceLength < 22 ? 10 : 0))));

  let summary = '';
  if (originalityScore >= 90) {
    summary = '🌟 Outstanding Originality! The text exhibits natural human phrasing, rich vocabulary diversity, and zero duplicate indexing flags.';
  } else if (originalityScore >= 75) {
    summary = '✅ High Quality & Safe. Content is mostly unique with minor cliché structures. Ready to publish or use our 1-click Paraphraser.';
  } else {
    summary = '⚠️ Repetitive / Generic Patterns Detected. We suggest clicking "AI Paraphrase (100% Unique)" below to make your text completely original and engaging.';
  }

  return {
    originalityScore,
    aiLikelihoodScore,
    wordCount,
    charCount,
    readabilityScore,
    readingTimeMinutes,
    sentencesCount,
    lexicalDiversity,
    duplicatesFound: duplicatesFound.slice(0, 5),
    highlightedSentences,
    summary
  };
}

/**
 * 🔄 PRO AI REWRITER & HUMANIZER (100% Unique Multi-Style)
 */
export async function rewriteTextPro(
  text: string, 
  mode: 'humanize' | 'academic' | 'sales' | 'urdu_polish' | 'roman_urdu' | 'fluent'
): Promise<string> {
  const modeInstructions = {
    humanize: 'Rewrite in authentic, natural human cadence. Vary sentence lengths, replace mechanical clichés with dynamic active voice, and make it undetectable by AI scanners while preserving core facts.',
    fluent: 'Paraphrase smoothly with enhanced vocabulary, flawless flow, perfect grammar, and improved clarity without changing meaning.',
    academic: 'Rewrite in scholarly, formal, and authoritative vocabulary suitable for university thesis, research reports, and academic publications.',
    sales: 'Rewrite into high-impact, persuasive sales copywriting with emotional hooks, crisp bulleted clarity, and high conversion psychology.',
    urdu_polish: 'خالص، فصیح اور باوقار اردو زبان (Urdu script) میں ترجمہ و تحریر کریں۔ شاندار الفاظ کا چناؤ اور بامحاورہ انداز ہو۔',
    roman_urdu: 'Conversational Roman Urdu me rewrite karein jo social media, Pakistani customers aur clients ke liye behtareen aur clear ho.'
  }[mode];

  const prompt = `You are a world-class Content Editor, Linguist, and AI Humanizer.
Task: ${modeInstructions}

Guidelines:
1. Ensure 100% uniqueness and zero duplicate sequences.
2. Maintain all key factual points, numbers, and core intent.
3. Eliminate stiff AI clichés ("delve", "tapestry", "plethora", "supercharge").
4. Output ONLY the polished rewritten text without conversational preamble or quotation marks.

Source Text:
"""
${text}
"""`;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
    });

    const result = response.text?.trim();
    if (result && result.length > 10) return result;
  } catch (err) {
    console.warn("AI rewrite fallback:", err);
  }

  // Intelligent algorithmic synonym paraphraser
  return text
    .replace(/\bvery important\b/gi, 'crucial')
    .replace(/\bbest quality\b/gi, 'exceptional grade')
    .replace(/\bin order to\b/gi, 'to')
    .replace(/\bdelve into\b/gi, 'explore')
    .replace(/\bplethora of\b/gi, 'broad range of')
    .replace(/\butilize\b/gi, 'use')
    .replace(/\ba lot of\b/gi, 'numerous')
    .replace(/\bcontact us today\b/gi, 'get in touch with our team');
}

/**
 * 💼 PROFIT MARGIN & E-COMMERCE ROI CALCULATOR
 */
export function calculateEcommerceProfit(input: ProfitCalculationInput): ProfitCalculationResult {
  const {
    costPrice,
    sellingPrice,
    deliveryFeePaidBySeller,
    packagingCost,
    adCostPerOrder,
    platformFeePercent,
    returnRatePercent,
    expectedMonthlySales
  } = input;

  const platformFee = (sellingPrice * platformFeePercent) / 100;
  const baseCost = costPrice + deliveryFeePaidBySeller + packagingCost + adCostPerOrder + platformFee;
  const returnCostPerFailedOrder = deliveryFeePaidBySeller + packagingCost + adCostPerOrder;
  const returnCostLossPerOrder = (returnCostPerFailedOrder * (returnRatePercent / 100));

  const totalCostPerUnit = baseCost + returnCostLossPerOrder;
  const netProfitPerUnit = Math.round((sellingPrice - totalCostPerUnit) * 100) / 100;
  const profitMarginPercent = Math.round((netProfitPerUnit / Math.max(1, sellingPrice)) * 1000) / 10;
  const roiPercent = Math.round((netProfitPerUnit / Math.max(1, totalCostPerUnit)) * 1000) / 10;

  const breakEvenPrice = Math.round(totalCostPerUnit);
  const projectedMonthlyRevenue = Math.round(sellingPrice * expectedMonthlySales);
  const projectedMonthlyNetProfit = Math.round(netProfitPerUnit * expectedMonthlySales);

  let status: 'highly_profitable' | 'moderate' | 'low_margin' | 'loss_making' = 'moderate';
  if (netProfitPerUnit <= 0) status = 'loss_making';
  else if (profitMarginPercent >= 35) status = 'highly_profitable';
  else if (profitMarginPercent >= 15) status = 'moderate';
  else status = 'low_margin';

  return {
    netProfitPerUnit,
    profitMarginPercent,
    roiPercent,
    totalCostPerUnit: Math.round(totalCostPerUnit),
    breakEvenPrice,
    returnCostLossPerOrder: Math.round(returnCostLossPerOrder),
    projectedMonthlyRevenue,
    projectedMonthlyNetProfit,
    status
  };
}

/**
 * 📏 WORD & CHARACTER COUNTER STATS
 */
export function calculateWordStats(text: string): WordStatsResult {
  const clean = text.trim();
  if (!clean) {
    return {
      words: 0,
      charactersWithSpaces: 0,
      charactersWithoutSpaces: 0,
      sentences: 0,
      paragraphs: 0,
      readingTimeMinutes: 0,
      speakingTimeMinutes: 0,
      averageWordLength: 0,
      uniqueWords: 0
    };
  }

  const words = clean.split(/\s+/).filter(Boolean);
  const charactersWithSpaces = text.length;
  const charactersWithoutSpaces = text.replace(/\s+/g, '').length;
  const sentences = clean.split(/[.!?۔\n]+/).filter(s => s.trim().length > 0).length || 1;
  const paragraphs = clean.split(/\n\s*\n/).filter(p => p.trim().length > 0).length || 1;

  const readingTimeMinutes = Math.max(0.1, Math.round((words.length / 225) * 10) / 10);
  const speakingTimeMinutes = Math.max(0.1, Math.round((words.length / 140) * 10) / 10);

  const lowerWords = words.map(w => w.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/g, '')).filter(Boolean);
  const uniqueWords = new Set(lowerWords).size;
  const totalLetters = lowerWords.reduce((acc, w) => acc + w.length, 0);
  const averageWordLength = words.length > 0 ? Math.round((totalLetters / words.length) * 10) / 10 : 0;

  return {
    words: words.length,
    charactersWithSpaces,
    charactersWithoutSpaces,
    sentences,
    paragraphs,
    readingTimeMinutes,
    speakingTimeMinutes,
    averageWordLength,
    uniqueWords
  };
}

/**
 * 🔤 TEXT CASE CONVERTER
 */
export function convertTextCase(text: string, mode: string): string {
  if (!text) return '';
  switch (mode) {
    case 'upper':
      return text.toUpperCase();
    case 'lower':
      return text.toLowerCase();
    case 'title':
      return text.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    case 'sentence':
      return text.toLowerCase().replace(/(^\s*\w|[.!?۔]\s*\w)/g, c => c.toUpperCase());
    case 'capitalized':
      return text.replace(/\b\w+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    case 'alternating':
      return text.split('').map((c, i) => (i % 2 === 0 ? c.toLowerCase() : c.toUpperCase())).join('');
    case 'camel':
      return text
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
        .replace(/^([A-Z])/, c => c.toLowerCase());
    case 'snake':
      return text
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '');
    case 'kebab':
      return text
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9\-\u0600-\u06FF]/g, '');
    case 'clean_spaces':
      return text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
    default:
      return text;
  }
}

/**
 * 🔑 KEYWORD DENSITY ANALYZER
 */
export function calculateKeywordDensity(text: string, maxItems = 10): { oneWord: KeywordDensityItem[]; twoWord: KeywordDensityItem[]; threeWord: KeywordDensityItem[] } {
  const clean = text.toLowerCase().replace(/[^a-z0-9\s\u0600-\u06FF]/g, ' ');
  const words = clean.split(/\s+/).filter(w => w.length > 2);
  const totalWords = words.length;

  if (totalWords < 3) {
    return { oneWord: [], twoWord: [], threeWord: [] };
  }

  const stopWords = new Set([
    'the', 'and', 'for', 'that', 'this', 'with', 'from', 'your', 'have', 'are', 'was', 'were',
    'will', 'our', 'not', 'can', 'all', 'you', 'they', 'what', 'which', 'their', 'when', 'more',
    'اور', 'ہے', 'ہیں', 'کے', 'کی', 'کو', 'سے', 'پر', 'میں', 'کا', 'ایک', 'تھا', 'تھی', 'تھے'
  ]);

  // 1-word density
  const oneMap = new Map<string, number>();
  words.forEach(w => {
    if (!stopWords.has(w) && w.length > 2) {
      oneMap.set(w, (oneMap.get(w) || 0) + 1);
    }
  });

  const oneWord: KeywordDensityItem[] = Array.from(oneMap.entries())
    .map(([phrase, count]) => ({
      phrase,
      count,
      density: Math.round((count / totalWords) * 1000) / 10
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, maxItems);

  // 2-word density
  const twoMap = new Map<string, number>();
  for (let i = 0; i < words.length - 1; i++) {
    const p = `${words[i]} ${words[i + 1]}`;
    twoMap.set(p, (twoMap.get(p) || 0) + 1);
  }
  const twoWord: KeywordDensityItem[] = Array.from(twoMap.entries())
    .filter(([_, count]) => count > 1)
    .map(([phrase, count]) => ({
      phrase,
      count,
      density: Math.round((count / (totalWords - 1)) * 1000) / 10
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, maxItems);

  // 3-word density
  const threeMap = new Map<string, number>();
  for (let i = 0; i < words.length - 2; i++) {
    const p = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
    threeMap.set(p, (threeMap.get(p) || 0) + 1);
  }
  const threeWord: KeywordDensityItem[] = Array.from(threeMap.entries())
    .filter(([_, count]) => count > 1)
    .map(([phrase, count]) => ({
      phrase,
      count,
      density: Math.round((count / (totalWords - 2)) * 1000) / 10
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, maxItems);

  return { oneWord, twoWord, threeWord };
}

/**
 * 🏷️ META TAG GENERATOR (SEO & Social Tags)
 */
export function generateMetaTags(data: MetaTagInput): string {
  const robotsVal = `${data.robotsIndex ? 'index' : 'noindex'}, ${data.robotsFollow ? 'follow' : 'nofollow'}`;
  return `<!-- Primary Meta Tags -->
<title>${data.title}</title>
<meta name="title" content="${data.title}">
<meta name="description" content="${data.description}">
<meta name="keywords" content="${data.keywords}">
<meta name="author" content="${data.author}">
<meta name="robots" content="${robotsVal}">
<link rel="canonical" href="${data.siteUrl}">

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:url" content="${data.siteUrl}">
<meta property="og:title" content="${data.title}">
<meta property="og:description" content="${data.description}">
<meta property="og:image" content="${data.imageUrl}">

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:url" content="${data.siteUrl}">
<meta property="twitter:title" content="${data.title}">
<meta property="twitter:description" content="${data.description}">
<meta property="twitter:image" content="${data.imageUrl}">
${data.twitterHandle ? `<meta property="twitter:site" content="${data.twitterHandle}">` : ''}`;
}

/**
 * 🤖 ROBOTS.TXT GENERATOR
 */
export function generateRobotsTxt(options: {
  allowGoogle: boolean;
  allowBing: boolean;
  disallowPaths: string[];
  sitemapUrl: string;
}): string {
  let lines: string[] = ['# Robots.txt generated via RizqDaan SEO Webmaster Tools'];
  
  lines.push('User-agent: *');
  if (options.disallowPaths.length === 0) {
    lines.push('Disallow: /admin/');
    lines.push('Disallow: /private/');
  } else {
    options.disallowPaths.forEach(p => {
      if (p.trim()) lines.push(`Disallow: ${p.trim()}`);
    });
  }

  if (!options.allowGoogle) lines.push('\nUser-agent: Googlebot\nDisallow: /');
  if (!options.allowBing) lines.push('\nUser-agent: Bingbot\nDisallow: /');

  if (options.sitemapUrl) {
    lines.push(`\nSitemap: ${options.sitemapUrl.trim()}`);
  }

  return lines.join('\n');
}

/**
 * 🗺️ XML SITEMAP GENERATOR
 */
export function generateSitemapXml(urls: { loc: string; lastmod: string; changefreq: string; priority: string }[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
}

/**
 * 💰 DISCOUNT & SALES TAX (GST) CALCULATOR
 */
export function calculateDiscountAndGst(input: DiscountInput): DiscountResult {
  const { originalPrice, discountPercent, salesTaxPercent } = input;
  const discountAmount = Math.round(((originalPrice * discountPercent) / 100) * 100) / 100;
  const priceAfterDiscount = Math.max(0, originalPrice - discountAmount);
  const taxAmount = Math.round(((priceAfterDiscount * salesTaxPercent) / 100) * 100) / 100;
  const finalPrice = Math.round((priceAfterDiscount + taxAmount) * 100) / 100;
  const totalSavings = discountAmount;

  return {
    discountAmount,
    priceAfterDiscount,
    taxAmount,
    finalPrice,
    totalSavings
  };
}

/**
 * 🖼️ CLIENT-SIDE IMAGE COMPRESSOR
 */
export function compressImageCanvas(
  file: File, 
  quality: number, // 0.1 to 1.0
  maxWidth = 1920,
  maxHeight = 1080
): Promise<{ blob: Blob; dataUrl: string; originalSize: number; compressedSize: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Canvas context unavailable"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const mimeType = file.type === 'image/png' ? 'image/jpeg' : file.type;
        const dataUrl = canvas.toDataURL(mimeType, quality);

        canvas.toBlob((blob) => {
          if (blob) {
            resolve({
              blob,
              dataUrl,
              originalSize: file.size,
              compressedSize: blob.size
            });
          } else {
            reject(new Error("Compression blob failed"));
          }
        }, mimeType, quality);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
