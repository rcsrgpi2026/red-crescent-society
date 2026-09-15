/**
 * Curated RCY Organizational Knowledge Base
 * Fact-checked reference data for deterministic grounding.
 */
import kbEmbeddings from "./kb-embeddings.json";
import { embedTextWithGemini, cosineSimilarity } from "./embeddings";

export interface KnowledgeArticle {
  id: string;
  titleBn: string;
  category: "about" | "blood" | "volunteer" | "principles" | "emergency" | "technology";
  keywords: string[];
  contentBn: string;
}

export const RCY_KNOWLEDGE_BASE: KnowledgeArticle[] = [
  {
    id: "about-rcy-rgpi",
    titleBn: "যুব রেড ক্রিসেন্ট আরজিপিআই ইউনিট পরিচিতি",
    category: "about",
    keywords: [
      "rcy",
      "red crescent",
      "রেড ক্রিসেন্ট কী",
      "আরজিপিআই",
      "পরিচিতি",
      "সংগঠন",
      "লক্ষ্য",
      "উদ্দেশ্য",
      "rgpi",
      "rcy rgpi",
      "red crescent youth",
      "সংগঠনের ইতিহাস",
      "রেডক্রিসেন্ট কি",
    ],
    contentBn: `বাংলাদেশ রেড ক্রিসেন্ট সোসাইটি, রাজশাহী পলিটেকনিক ইনস্টিটিউট (আরজিপিআই) যুব রেড ক্রিসেন্ট দল একটি স্বেচ্ছাসেবী মানবিক সংগঠন। 
এর মূল লক্ষ্য আর্তমানবতার সেবা, স্বেচ্ছায় রক্তদান উৎসাহিত করা, দুর্যোগ মোকাবিলায় প্রস্তুতি এবং শিক্ষার্থীদের নেতৃত্ব ও মানবিক মূল্যবোধে গড়ে তোলা। এটি একটি অরাজনৈতিক ও নিরপেক্ষ ছাত্র সংগঠন।`,
  },
  {
    id: "seven-principles",
    titleBn: "রেড ক্রসের ৭টি মূলনীতি",
    category: "principles",
    keywords: [
      "নীতিমালা",
      "মূলনীতি",
      "principles",
      "৭টি নীতি",
      "সাতটি নীতি",
      "7 principles",
      "সাত নীতি",
      "আদর্শ",
      "red cross principles",
    ],
    contentBn: `আন্তর্জাতিক রেড ক্রস ও রেড ক্রিসেন্ট আন্দোলনের ৭টি অলঙ্ঘনীয় মূলনীতি রয়েছে:
১. মানবতা (Humanity): প্রতিটি মানুষের জীবন ও স্বাস্থ্য রক্ষা এবং সম্মান নিশ্চিত করা।
২. পক্ষপাতহীনতা (Impartiality): জাতীয়তা, ধর্ম, বর্ণ বা রাজনৈতিক মতাদর্শ নির্বিশেষে সেবা প্রদান।
৩. নিরপেক্ষতা (Neutrality): রাজনৈতিক বা ধর্মীয় সংঘাতে পক্ষ না নেওয়া।
৪. স্বাধীনতা (Independence): নিজ নীতিতে স্বাধীনভাবে মানবিক কাজ পরিচালনা।
৫. স্বেচ্ছাসেবা (Voluntary Service): কোনো আর্থিক লাভের উদ্দেশ্য ছাড়া নিঃস্বার্থ সেবা।
৬. একতা (Unity): প্রতি দেশে মাত্র একটি রেড ক্রস বা রেড ক্রিসেন্ট সোসাইটি থাকবে।
৭. সার্বজনীনতা (Universality): বিশ্বব্যাপী সমান মর্যাদা ও সহযোগিতার অধিকার।`,
  },
  {
    id: "blood-donation-criteria",
    titleBn: "রক্তদানের শর্ত ও যোগ্যতা",
    category: "blood",
    keywords: [
      "রক্তদানের যোগ্যতা",
      "রক্ত দিতে কী লাগে",
      "রক্ত দিতে কি লাগে",
      "রক্তদানের শর্ত",
      "রক্তদান",
      "donor eligibility",
      "blood criteria",
      "কবে রক্ত দেওয়া যায়",
      "কবে রক্ত দেওয়া যায়",
      "রক্ত দেওয়া যাবে",
      "রক্ত দেওয়া যাবে",
      "রক্ত দিতে পারব",
      "রক্ত দিতে পারবো",
      "রক্তদানের নিয়ম",
      "রক্তদানের নিয়ম",
      "বয়স ১৭",
      "বয়স ১৭",
      "বয়স 17",
      "বয়স 17",
      "বয়স ১৮",
      "বয়স ১৮",
      "বয়স কত",
      "কত বছর বয়স",
      "কত বছর বয়স",
      "ওজন কত",
      "ওজন ৪৫",
      "ওজন ৫০",
      "কত কেজি",
      "কত ওজন",
      "রক্ত কতদিন পর",
      "কতদিন পর পর",
      "কত দিন পর",
      "রক্ত দেওয়ার ব্যবধান",
      "রক্ত দেওয়ার ব্যবধান",
      "blood donation gap",
      "blood gap",
      "donation interval",
      "রক্ত দিতে কি কি লাগে",
      "রক্ত দেয়ার যোগ্যতা",
      "antiseptic",
      "অ্যান্টিবায়োটিক",
      "ওষুধ খেলে রক্ত",
      "ঔষধ খেলে রক্ত",
    ],
    contentBn: `নিরাপদ রক্তদানের মৌলিক শর্তসমূহ:
১. বয়স: ১৮ থেকে ৬০ বছর।
২. ওজন: পুরুষের জন্য ন্যূনতম ৫০ কেজি, নারীর জন্য ন্যূনতম ৪৫ কেজি।
৩. হিমোগ্লোবিন: স্বাভাবিক মাত্রা (১২.৫ গ্রাম/ডেসিলিটার বা তার বেশি)।
৪. রক্তচাপ: স্বাভাবিক রক্তচাপ (সিস্টোলিক ১০০-১৪০, ডায়াস্টোলিক ৬০-৯০)।
৫. বিরতি: শেষ রক্তদানের পর পুরুষদের জন্য কমপক্ষে ৩-৪ মাস এবং নারীদের জন্য কমপক্ষে ৪ মাস অতিবাহিত হতে হবে।
৬. সতর্কতা: রক্তদানের সময় জ্বর, সর্দি বা কোনো অ্যান্টিবায়োটিক বা দীর্ঘমেয়াদি ওষুধের সেবন থাকলে রক্তদান সাময়িকভাবে স্থগিত রাখতে হবে।`,
  },
  {
    id: "volunteer-eligibility",
    titleBn: "স্বেচ্ছাসেবক হওয়ার যোগ্যতা ও নিয়ম",
    category: "volunteer",
    keywords: [
      "স্বেচ্ছাসেবক যোগ্যতা",
      "volunteer criteria",
      "কীভাবে সদস্য হব",
      "কিভাবে সদস্য হব",
      "যোগদানের নিয়ম",
      "যোগদানের নিয়ম",
      "সদস্য হওয়ার শর্ত",
      "সদস্য হওয়ার শর্ত",
      "সদস্য হতে চাই",
      "ভলান্টিয়ার হতে চাই",
      "স্বেচ্ছাসেবক হতে চাই",
      "volunteer hote chai",
      "join rcy",
      "member registration",
      "ভর্তি হতে চাই",
      "রিক্রুটমেন্ট",
      "recruitment",
      "কবে মেম্বার নিবে",
      "কবে ফর্ম ছাড়বে",
    ],
    contentBn: `যুব রেড ক্রিসেন্ট আরজিপিআই-এর স্বেচ্ছাসেবক হওয়ার নিয়মাবলী:
১. আবেদনকারীকে অবশ্যই রাজশাহী পলিটেকনিক ইনস্টিটিউটের (RGPI) নিয়মিত শিক্ষার্থী হতে হবে।
২. যখন অফিসিয়াল রিক্রুটমেন্ট ক্যাম্পেইন চালু থাকে (Active), তখনই আবেদন ফর্ম জমা দেওয়া যায়।
৩. আগ্রহী শিক্ষার্থীকে মানবসেবামূলক কাজে অংশগ্রহণের সদিচ্ছা থাকতে হবে।
৪. আবেদনের পর প্রাথমিক বাছাই ও মৌখিক সাক্ষাতকারের মাধ্যমে নির্বাচিত স্বেচ্ছাসেবকদের ওরিয়েন্টেশন ও পরিচয়পত্র প্রদান করা হয়।`,
  },
  {
    id: "certificate-verification",
    titleBn: "সার্টিফিকেট যাচাইকরণ পদ্ধতি",
    category: "about",
    keywords: [
      "certificate",
      "সার্টিফিকেট",
      "সনদ",
      "verification",
      "যাচাই",
      "ভেরিফিকেশন",
      "সার্টিফিকেট যাচাই",
      "টোকেন দিয়ে যাচাই",
      "token verify",
      "সনদ যাচাই",
      "certificate check",
    ],
    contentBn: `আরজিপিআই যুব রেড ক্রিসেন্ট থেকে প্রদত্ত প্রশিক্ষণ ও ভলান্টিয়ার সনদসমূহ স্বয়ংক্রিয়ভাবে কিউআর কোড (QR Code) এবং ইউনিক টোকেন দ্বারা সংরক্ষিত। 
ওয়েবসাইটের Certificate Verification লিংকে গিয়ে সনদের টোকেন নম্বর ইনপুট দিয়ে তাৎক্ষণিক সত্যতা ও ইস্যুর তারিখ যাচাই করা যায়।`,
  },
  {
    id: "emergency-helpline",
    titleBn: "জরুরি রক্ত সহায়তা ও হটলাইন",
    category: "emergency",
    keywords: [
      "helpline",
      "জরুরি",
      "জরুরী",
      "হটলাইন",
      "নম্বর",
      "emergency phone",
      "hotline",
      "blood helpline",
      "জরুরি ফোন নম্বর",
      "ফোন নম্বর",
      "হটলাইন কত",
      "emergency contact",
    ],
    contentBn: `জরুরি রক্তের প্রয়োজনে রাজশাহী ও নিকটবর্তী এলাকার রোগীরা আমাদের ২৪/৭ হটলাইনে যোগাযোগ করতে পারেন। 
ওয়েবসাইটের '/emergency' পেজে হটলাইন নম্বর এবং তাৎক্ষণিক নির্দেশনা দেওয়া আছে। এছাড়া সরাসরি রক্তদাতা খুঁজে পাওয়ার জন্য আমাদের ব্লাড ডিরেক্টরি ('/blood-support') ব্যবহার করুন।`,
  },
  {
    id: "leadership-and-incharge",
    titleBn: "ইনচার্জ শিক্ষক ও নেতৃত্ব",
    category: "about",
    keywords: [
      "incharge",
      "teacher",
      "ইনচার্জ",
      "ইনচার্জ শিক্ষক",
      "শিক্ষক",
      "টিচার",
      "দায়িত্বপ্রাপ্ত শিক্ষক",
      "দায়িত্বপ্রাপ্ত শিক্ষক",
      "অধ্যক্ষ",
      "প্রিন্সিপাল",
      "উপদেষ্টা",
      "দলনেতা",
      "team leader",
      "nurul amin",
      "নূরুল আমিন",
      "নুরুল আমিন",
      "রেজওয়ান",
      "rejwan",
      "আজম মাসুদুর রহমান",
      "রাশিদুল আমিন",
      "প্রধান সমন্বয়কারী",
      "নেতৃত্ব",
      "gl",
      "agl",
      "group leader",
      "গ্রুপ লিডার",
      "সহকারী গ্রুপ লিডার",
      "ict",
      "media",
      "communication",
      "আইসিটি",
      "মিডিয়া",
      "মিনহাজুল আবেদীন পিয়াস",
      "minhajul abadin pius",
      "pius",
      "sayem",
      "সায়েম",
      "sojol",
      "সজল",
      "shawon",
      "শাওন",
      "jakariya",
      "জাকারিয়া",
      "noman",
      "নোমান",
      "ihan",
      "ইহান",
      "maruf",
      "মারুফ",
      "resource mobilization",
      "সম্পদ সংগ্রহ",
    ],
    contentBn: `যুব রেড ক্রিসেন্ট, রাজশাহী পলিটেকনিক ইনস্টিটিউট (RCY RGPI)-এর প্রধান দায়িত্বশীল ও পূর্ণাঙ্গ কার্যনির্বাহী পরিষদ:
১. ইনচার্জ শিক্ষক (Incharge Teacher): জনাব মো: নূরুল আমিন (Md. Nurul Amin)।
২. অধ্যক্ষ ও প্রধান উপদেষ্টা (Principal Sir): ইঞ্জিনিয়ার আজম মাসুদুর রহমান (Engr. Ajm Masudur Rahman)।
৩. উপাধ্যক্ষ ও প্রতিষ্ঠাতা: ইঞ্জিনিয়ার মো: রাশিদুল আমিন (Engr. Md. Rashidul Amin)।
৪. যুব দলনেতা (Youth Team Leader): মো: রেজওয়ান (MD. Rejwan)।
৫. উপ-দলনেতা (Deputy Leaders): হোসাইন মোহাম্মদ এসাম (Hossain Mohammad Esam) ও মোছা: নুসরাত জাহান (Most. Nusrat Jahan)।

বিভাগীয় উইং ও গ্রুপ লিডার (GL) এবং সহকারী গ্রুপ লিডার (AGL) তালিকা:
• তথ্যপ্রযুক্তি, মিডিয়া ও যোগাযোগ (ICT Media & Communication):
  - গ্রুপ লিডার (GL): মিনহাজুল আবেদীন পিয়াস (Minhajul Abadin Pius)
  - সহকারী গ্রুপ লিডার (AGL): মো: সায়েম শাহাদাত (Md. Sayem Shahadat)
• সম্পদ সংগ্রহ ও ব্যবস্থাপনা (Resource Mobilization):
  - গ্রুপ লিডার (GL): মো: ইশতিয়াক আহমেদ ইহান (Md. Istiyak Ahmed Ihan)
  - সহকারী গ্রুপ লিডার (AGL): মো: মারুফ ইসলাম (Md. Maruf Islam)
• প্রশাসন, সংগঠন ও সদস্য সংগ্রহ (Administration, Organisation & Recruitment):
  - গ্রুপ লিডার (GL): মো: সজল (MD. Sojol)
  - সহকারী গ্রুপ লিডার (AGL): নূর মুহাম্মদ আলী (Noor Muhammad Ali)
• প্রশিক্ষণ ও সহ-শিক্ষা (Training and Co-Curriculum):
  - গ্রুপ লিডার (GL): অলিউল্লাহ শাওন (Oliullah Shawon)
  - সহকারী গ্রুপ লিডার (AGL): সুরাইয়া ইয়াসমিন সেতু (Suraiaya Yasmin Setu)
• দুর্যোগ ও মানবিক সহায়তা (Disaster & Humanitarian Response):
  - গ্রুপ লিডার (GL): মো: জাকারিয়া (Md. Jakariya)
  - সহকারী গ্রুপ লিডার (AGL): মো: তামিম হোসেন (Md. Tamim Hossain)
• স্বাস্থ্য ও সেবা (Health & Services):
  - গ্রুপ লিডার (GL): সাইফুল্লাহ মনসুর নোমান (Saifullah Mansur Noman)
  - সহকারী গ্রুপ লিডার (AGL): মো: আব্দুল বারী (Md. Abdul Bari)

কমিটির বিস্তারিত তালিকা দেখতে 'কার্যনির্বাহী কমিটি' (/team) পেজ ভিজিট করুন।`,
  },
  {
    id: "site-statistics-and-impact",
    titleBn: "প্ল্যাটফর্মের সামগ্রিক পরিসংখ্যান ও প্রভাব",
    category: "about",
    keywords: [
      "পরিসংখ্যান",
      "stats",
      "কত রক্তদান",
      "রক্তদান সম্পন্ন",
      "রক্তের ব্যাগ",
      "কয় ব্যাগ",
      "কত ইউনিট",
      "মোট রক্তদাতা",
      "কতজন ভলান্টিয়ার",
      "কয়টি ইভেন্ট",
      "impact",
    ],
    contentBn: `যুব রেড ক্রিসেন্ট আরজিপিআই প্ল্যাটফর্মের লাইভ পরিসংখ্যান ডাটাবেস থেকে স্বয়ংক্রিয়ভাবে হিসাব করা হয়:
- সফল রক্তদান: রক্তগ্রহীতার আবেদন পূরণ সাপেক্ষে নিশ্চিত হওয়া মোট রক্তদানের পরিমাণ (ব্যাগ/ইউনিট)।
- নিবন্ধিত রক্তদাতা: জরুরি প্রয়োজনে প্রস্তুত থাকা সক্রিয় রক্তদাতাদের সংখ্যা।
- স্বেচ্ছাসেবক দল: ইউনিটের নিবন্ধিত এবং অনুমোদিত যুব সদস্যবৃন্দ।
- ইভেন্ট ও ট্রেনিং: সফলভাবে সম্পন্ন হওয়া জনসচেতনতামূলক ক্যাম্পেইন, ফার্স্ট এইড ও দুর্যোগ ব্যবস্থাপনা কর্মসূচি।
সর্বশেষ লাইভ পরিসংখ্যান মূল পাতায় (/) এবং রক্ত সহায়তার হিসাব '/blood-support' পেজে দেখা যায়।`,
  },
  {
    id: "trainings-and-courses",
    titleBn: "প্রশিক্ষণ কর্মসূচি ও ফার্স্ট এইড কোর্স",
    category: "about",
    keywords: [
      "training",
      "ট্রেনিং",
      "প্রশিক্ষণ",
      "ফার্স্ট এইড",
      "first aid",
      "cpr",
      "প্রাথমিক চিকিৎসা",
      "দুর্যোগ ব্যবস্থাপনা",
      "disaster management",
      "কোর্স",
    ],
    contentBn: `রেড ক্রিসেন্ট যুব দল শিক্ষার্থীদের জন্য নিয়মিত প্রশিক্ষণ আয়োজন করে থাকে:
১. প্রাথমিক চিকিৎসা ও ফার্স্ট এইড (First Aid & CPR): জরুরি দুর্ঘটনা ও দুর্যোগে তাৎক্ষণিক জীবন বাঁচানোর কৌশল।
২. দুর্যোগ প্রস্তুতি ও ব্যবস্থাপনা (Disaster Response & Management): আগুন, ভূমিকম্প ও বন্যায় উদ্ধার কার্যক্রম।
৩. নেতৃত্ব ও দলগত দক্ষতা উন্নয়ন (Leadership & Humanitarian Orientation)।
প্রশিক্ষণ সফলভাবে সম্পন্নকারী শিক্ষার্থীদের অফিসিয়াল ভেরিফায়েবল সার্টিফিকেট প্রদান করা হয়। বিস্তারিত জানতে '/training' পেজ ভিজিট করুন।`,
  },
  {
    id: "campus-and-office",
    titleBn: "কার্যালয় ও ক্যাম্পাস উপস্থিতি",
    category: "about",
    keywords: [
      "office",
      "ঠিকানা",
      "অফিস",
      "কোথায় অবস্থিত",
      "location",
      "ক্যাম্পাস",
      "campus",
      "রুম",
      "দেখা করব",
    ],
    contentBn: `যুব রেড ক্রিসেন্ট (RCY RGPI)-এর প্রধান কার্যালয় রাজশাহী পলিটেকনিক ইনস্টিটিউট ক্যাম্পাসে অবস্থিত।
শিক্ষার্থী ও আগ্রহী ব্যক্তিবর্গ সরাসরি আমাদের ক্যাম্পাস কার্যালয়ে অথবা আমাদের অফিসিয়াল ফেসবুক পেজ ও জরুরি হটলাইনের মাধ্যমে যোগাযোগ করতে পারেন। যোগাযোগের সম্পূর্ণ তথ্য রয়েছে '/contact' পেজে।`,
  },
  {
    id: "student-and-volunteer-portals",
    titleBn: "শিক্ষার্থী ও স্বেচ্ছাসেবক পোর্টাল সুবিধা",
    category: "about",
    keywords: [
      "student portal",
      "volunteer portal",
      "আইডি কার্ড",
      "id card",
      "পয়েন্ট",
      "points",
      "সার্টিফিকেট",
      "লগইন",
      "portal login",
    ],
    contentBn: `আমাদের ওয়েবসাইটে শিক্ষার্থী ও স্বেচ্ছাসেবকদের জন্য আলাদা পোর্টাল রয়েছে:
১. শিক্ষার্থী পোর্টাল (/student/login): রোল ও তথ্য দিয়ে লগইন করে নিজস্ব প্রোফাইল, ব্লাড গ্রুপ তথ্য এবং ডিজিটাল আইডি কার্ড দেখা যায়।
২. স্বেচ্ছাসেবক পোর্টাল (/volunteer/login): অনুমোদিত স্বেচ্ছাসেবকদের কাজের ট্র্যাকিং, অর্জিত পয়েন্ট ও অংশগ্রহণের রেকর্ড প্রদর্শিত হয়।
৩. সার্টিফিকেট যাচাই (/verify/certificate/[token]): সনদের ইউনিক কোড দিয়ে সত্যতা যাচাই করা যায়।`,
  },
  {
    id: "legacy-and-alumni",
    titleBn: "প্রাক্তন ও আজীবন সদস্য (Legacy Members)",
    category: "about",
    keywords: [
      "legacy",
      "alumni",
      "প্রাক্তন",
      "সাবেক",
      "সাবেক নেতা",
      "সিনিয়র",
      "former leaders",
    ],
    contentBn: `আরজিপিআই যুব রেড ক্রিসেন্ট দলের প্রাক্তন নেতৃবৃন্দ ও সম্মানিত আজীবন সদস্যদের অবদানকে স্মরণীয় করে রাখতে 'প্রাক্তন ও আজীবন সদস্য' (/legacy-members) পাতাটি তৈরি করা হয়েছে। এখানে বিভিন্ন সেশনের সাবেক টিম লিডার ও দায়িত্বপ্রাপ্তদের তালিকা সংরক্ষিত আছে।`,
  },
  {
    id: "pwa-mobile-app",
    titleBn: "মোবাইল ও পিসি অ্যাপ ইনস্টলেশন (PWA Progressive Web App)",
    category: "technology",
    keywords: [
      "app",
      "অ্যাপ",
      "install",
      "ইনস্টল",
      "ডাউনলোড",
      "download",
      "mobile app",
      "apk",
      "pwa",
      "মোবাইল অ্যাপ",
      "kmne install",
      "kivabe install",
      "install korbo",
      "অ্যাপ নামাবো",
      "প্লে স্টোর",
      "play store",
    ],
    contentBn: `আমাদের ওয়েবসাইটটি একটি আধুনিক প্রগ্রেসিভ ওয়েব অ্যাপ (PWA - Progressive Web App)। কোনো প্লে-স্টোর বা এপিকে (APK) ফাইল ছাড়াই এটি সরাসরি আপনার অ্যান্ড্রয়েড ফোন, আইফোন বা কম্পিউটারে নিজস্ব অ্যাপ হিসেবে ইনস্টল করা যায়!

ইনস্টল করার সহজ নিয়ম:
১. অ্যান্ড্রয়েড ও কম্পিউটার (Chrome / Edge): ব্রাউজারে সাইটটি ওপেন করলে নিচে আসা 'ইনস্টল করুন (Install)' ব্যানারে ট্যাপ করুন অথবা ব্রাউজারের ডানপাশের ৩-ডট মেনু থেকে 'Install app' বা 'Add to Home screen' (হোম স্ক্রিনে যুক্ত করুন) চাপুন।
২. আইফোন / আইপ্যাড (iOS Safari): সাফারি ব্রাউজারের নিচে থাকা 'Share' (শেয়ার) আইকনে ক্লিক করে 'Add to Home Screen' (হোম স্ক্রিনে যোগ করুন) নির্বাচন করুন।

অ্যাপ ব্যবহারের সুবিধা:
- ফুলস্ক্রিন মোবাইল অ্যাপের মতো মসৃণ অভিজ্ঞতা।
- খুব কম স্টোরেজ নেয় এবং অফলাইনেও দ্রুত কাজ করে।
- নতুন নোটিশ ও জরুরি রক্তের আবেদনের লাইভ পুশ নোটিফিকেশন অ্যালার্ট সরাসরি পাওয়া যায়।`,
  },
  {
    id: "web-push-notifications",
    titleBn: "পুশ নোটিফিকেশন অন ও সতর্কবার্তা গ্রহণ (Web Push Notifications)",
    category: "technology",
    keywords: [
      "push notification",
      "notification",
      "নোটিফিকেশন",
      "পুশ নোটিফিকেশন",
      "alert",
      "bell",
      "অন করব",
      "on korbo",
      "enable push",
      "ঘণ্টা",
      "নোটিফিকেশন অন",
      "নোটিফিকেশন পাই না",
      "নোটিফিকেশন চালু",
    ],
    contentBn: `জরুরি রক্তের আবেদন, নতুন নোটিশ ও গুরুত্বপূর্ণ ইভেন্টের তাৎক্ষণিক আপডেট পেতে আমাদের ওয়েবসাইটে সরাসরি ডিভাইস পুশ নোটিফিকেশন (Push Notification) সুবিধা চালু রয়েছে:

পুশ নোটিফিকেশন চালু করার নিয়ম:
১. ওয়েবসাইটের ওপরে থাকা নোটিফিকেশন বেল (🔔 ঘণ্টা আইকন)-এ ক্লিক করুন।
২. মেনুতে 'Enable Push Notifications' বাটনে চাপুন (অথবা সাইটে আসা নোটিফিকেশন ব্যানারে 'অনুমতি দিন / Allow' নির্বাচন করুন)।
৩. ব্রাউজারের পারমিশন পপ-আপে 'Allow' সিলেক্ট করলেই নোটিফিকেশন চালু হয়ে যাবে।

* ব্রাউজারে ব্লক থাকলে সমাধানের নিয়ম:
ব্রাউজারের অ্যাড্রেস বারের বাম পাশে থাকা তালা (🔒) আইকনে ক্লিক করে Notifications অপশনটি 'Allow' করে পেজটি রিফ্রেশ করুন। এতে ব্রাউজার বা ট্যাব বন্ধ থাকলেও আপনার ফোনে বা পিসিতে রক্তের জরুরি সতর্কবার্তা চলে আসবে!`,
  },
];

/**
 * Fast synchronous keyword search for knowledge articles.
 */
export function findRelevantKnowledgeSync(query: string): string | null {
  if (!query) return null;
  const q = query.toLowerCase().trim();

  const scoredMatches: Array<{ score: number; text: string }> = [];

  for (const article of RCY_KNOWLEDGE_BASE) {
    let score = 0;
    for (const kw of article.keywords) {
      if (q.includes(kw.toLowerCase())) {
        score++;
      }
    }
    if (score > 0) {
      scoredMatches.push({
        score,
        text: `[${article.titleBn}]:\n${article.contentBn}`,
      });
    }
  }

  if (scoredMatches.length === 0) return null;

  scoredMatches.sort((a, b) => b.score - a.score);
  return scoredMatches.slice(0, 2).map((m) => m.text).join("\n\n");
}

/**
 * Searches the curated knowledge base for factual snippets matching user query.
 *
 * 1. Fast path: Keyword matching. If score >= 2, returns immediately (0ms, 0 API tokens).
 * 2. Semantic fallback: If score < 2, embeds query via gemini-embedding-001 ($0) and
 *    computes cosine similarity against precomputed kb-embeddings.json.
 * 3. Returns best match if similarity >= 0.58, or fallback keyword match, or null.
 */
export async function findRelevantKnowledge(query: string): Promise<string | null> {
  if (!query) return null;
  const q = query.toLowerCase().trim();

  // 1. Evaluate keyword matches
  const keywordMatches: Array<{ score: number; article: KnowledgeArticle }> = [];

  for (const article of RCY_KNOWLEDGE_BASE) {
    let score = 0;
    for (const kw of article.keywords) {
      if (q.includes(kw.toLowerCase())) {
        score++;
      }
    }
    if (score > 0) {
      keywordMatches.push({ score, article });
    }
  }

  keywordMatches.sort((a, b) => b.score - a.score);

  // Strong keyword match: >= 2 hits -> return immediately
  if (keywordMatches.length > 0 && keywordMatches[0].score >= 2) {
    return keywordMatches
      .slice(0, 2)
      .map((m) => `[${m.article.titleBn}]:\n${m.article.contentBn}`)
      .join("\n\n");
  }

  // 2. Semantic Embedding Fallback
  try {
    const queryVector = await embedTextWithGemini(q);
    if (queryVector && Array.isArray(kbEmbeddings)) {
      let bestSimilarity = -1;
      let bestArticleId: string | null = null;

      for (const item of kbEmbeddings as Array<{ id: string; embedding: number[] }>) {
        if (item.embedding && Array.isArray(item.embedding)) {
          const sim = cosineSimilarity(queryVector, item.embedding);
          if (sim > bestSimilarity) {
            bestSimilarity = sim;
            bestArticleId = item.id;
          }
        }
      }

      // If semantic similarity exceeds threshold (0.58)
      if (bestSimilarity >= 0.58 && bestArticleId) {
        const matched = RCY_KNOWLEDGE_BASE.find((a) => a.id === bestArticleId);
        if (matched) {
          return `[${matched.titleBn}]:\n${matched.contentBn}`;
        }
      }
    }
  } catch (err) {
    console.warn("[Knowledge Retrieval] Semantic embedding fallback failed, falling back to keywords:", err);
  }

  // 3. Graceful fallback to weak keyword match (score === 1) if available
  if (keywordMatches.length > 0) {
    return `[${keywordMatches[0].article.titleBn}]:\n${keywordMatches[0].article.contentBn}`;
  }

  return null;
}
