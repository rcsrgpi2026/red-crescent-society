export const NOTIFICATION_CONFIG = {
  scoring: {
    SAME_DISTRICT: 40,
    NEARBY_DISTRICT: 20,
    EXACT_BLOOD_MATCH: 30,
    COMPATIBLE_BLOOD_MATCH: 15,
    AVAILABLE_DONOR: 20,
    RECENTLY_ACTIVE_VOLUNTEER: 15,
    ACTIVE_PUSH_TOKEN: 10,
    RECENT_SIMILAR_PENALTY: -30,
  },
  thresholds: {
    HIGH_SCORE_IMMEDIATE: 80,
    NORMAL_MIN_SCORE: 60,
    LOW_PRIORITY_MIN_SCORE: 70,
    CRITICAL_MIN_SCORE: 0,
  },
  rateLimits: {
    ENABLED: false, // Disabled for testing/development purposes as requested
    MAX_NORMAL_PER_DAY: 5,
    MAX_BLOOD_REQUESTS_PER_DAY: 3,
    MAX_EMERGENCY_PER_DAY: 10,
    COOLDOWN_MINUTES_SIMILAR: 30,
  },
  defaultQuietHours: {
    start: "22:00",
    end: "07:00",
  },
};

/** Blood group compatibility chart for blood donations (recipient -> compatible donor blood groups) */
export const BLOOD_COMPATIBILITY: Record<string, string[]> = {
  "A+": ["A+", "A-", "O+", "O-"],
  "A-": ["A-", "O-"],
  "B+": ["B+", "B-", "O+", "O-"],
  "B-": ["B-", "O-"],
  "AB+": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
  "AB-": ["AB-", "A-", "B-", "O-"],
  "O+": ["O+", "O-"],
  "O-": ["O-"],
};

/**
 * Bangladesh District Proximity mapping (Division & Neighboring clusters).
 * Focus on Rajshahi division as primary base, plus full national coverage.
 */
export const NEARBY_DISTRICTS: Record<string, string[]> = {
  Rajshahi: ["Natore", "Naogaon", "Chapainawabganj", "Pabna", "Kushtia"],
  Chapainawabganj: ["Rajshahi", "Naogaon"],
  Naogaon: ["Rajshahi", "Bogura", "Joypurhat", "Chapainawabganj"],
  Natore: ["Rajshahi", "Pabna", "Sirajganj", "Bogura", "Kushtia"],
  Bogura: ["Naogaon", "Joypurhat", "Sirajganj", "Gaibandha", "Natore"],
  Pabna: ["Rajshahi", "Natore", "Sirajganj", "Kushtia", "Manikganj"],
  Sirajganj: ["Pabna", "Natore", "Bogura", "Tangail", "Jamalpur"],
  Joypurhat: ["Naogaon", "Bogura", "Dinajpur", "Gaibandha"],
  Dhaka: ["Gazipur", "Narayanganj", "Munshiganj", "Manikganj", "Narsingdi"],
  Gazipur: ["Dhaka", "Tangail", "Narsingdi", "Kishoreganj", "Mymensingh"],
  Chittagong: ["Cox's Bazar", "Feni", "Rangamati", "Khagrachhari", "Bandarban"],
  Sylhet: ["Moulvibazar", "Habiganj", "Sunamganj"],
  Khulna: ["Jessore", "Satkhira", "Bagerhat", "Narail"],
  Barisal: ["Jhalokati", "Pirojpur", "Patuakhali", "Bhola"],
  Rangpur: ["Dinajpur", "Kurigram", "Gaibandha", "Nilphamari", "Lalmonirhat"],
  Mymensingh: ["Jamalpur", "Netrokona", "Sherpur", "Gazipur", "Tangail"],
  Comilla: ["Chandpur", "Brahmanbaria", "Feni", "Noakhali"],
};
