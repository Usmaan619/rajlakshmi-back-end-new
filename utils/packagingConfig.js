// ============================================================================
// Packaging Configuration — Product-wise Box/Bag Dimensions
//
// Dimensions are in CENTIMETERS (cm) as required by the Shipmozo API.
// Conversion: 1 foot = 30.48 cm
//
// How to add a new product type:
//   1. Add a new key under PACKAGING_PROFILES
//   2. Set maxWeightKg = max weight that fits in ONE bag/box
//   3. Set dims = actual physical size of ONE bag/box in cm
//   4. Add keywords = words from the product name or category that identify it
// ============================================================================

const PACKAGING_PROFILES = {
  // ──────────────────────────────────────────────────────────────
  // Ghee / Oil — PP Bag (polypropylene woven sack)
  // Real size: 3ft × 2ft × 1ft  =  91cm × 61cm × 30cm
  // Max per bag: 30kg
  // ──────────────────────────────────────────────────────────────
  ghee: {
    name: "Ghee/Oil PP Bag (30kg)",
    maxWeightKg: 30,
    dims: { length: "91", width: "61", height: "30" },
    keywords: ["ghee", "oil", "tel", "butter", "makhan"],
  },

  // ──────────────────────────────────────────────────────────────
  // Makhana (Fox Nuts) — Large corrugated box
  // Real size: 6ft × 3.5ft × 2ft  =  183cm × 107cm × 61cm
  // Max per box: 10kg (makhana is very light and voluminous)
  // ──────────────────────────────────────────────────────────────
  makhana: {
    name: "Makhana Large Box (10kg)",
    maxWeightKg: 10,
    dims: { length: "183", width: "107", height: "61" },
    keywords: ["makhana", "foxnut", "fox nut", "lotus seed", "phool makhana"],
  },

  // ──────────────────────────────────────────────────────────────
  // Dry Fruits / Nuts — Medium cardboard box
  // Real size: 2ft × 1.5ft × 1ft  =  61cm × 46cm × 30cm
  // Max per box: 15kg
  // ──────────────────────────────────────────────────────────────
  dryFruits: {
    name: "Dry Fruits Box (15kg)",
    maxWeightKg: 15,
    dims: { length: "61", width: "46", height: "30" },
    keywords: ["almond", "badam", "cashew", "kaju", "walnut", "akhrot",
               "raisin", "kishmish", "pistachio", "pista", "dry fruit",
               "dryfruits", "nuts"],
  },

  // ──────────────────────────────────────────────────────────────
  // Powder / Flour / Masala — PP Bag
  // Real size: 2.5ft × 1.5ft × 0.5ft  =  76cm × 46cm × 15cm
  // Max per bag: 25kg
  // ──────────────────────────────────────────────────────────────
  powder: {
    name: "Powder/Flour PP Bag (25kg)",
    maxWeightKg: 25,
    dims: { length: "76", width: "46", height: "15" },
    keywords: ["powder", "atta", "flour", "masala", "spice", "haldi",
               "turmeric", "mirchi", "besan", "sooji", "daliya"],
  },

  // ──────────────────────────────────────────────────────────────
  // Small / Retail Pouches (500gm, 1kg, 5kg)
  // Real size: 0.5ft × 0.3ft × 0.2ft  =  15cm × 10cm × 8cm
  // Max per pouch: 5kg
  // ──────────────────────────────────────────────────────────────
  pouch: {
    name: "Retail Pouch (5kg)",
    maxWeightKg: 5,
    dims: { length: "15", width: "10", height: "8" },
    keywords: [], // used as fallback for small weight items only
  },

  // ──────────────────────────────────────────────────────────────
  // DEFAULT — Standard 30kg PP bag (used when no keyword matches)
  // ──────────────────────────────────────────────────────────────
  default: {
    name: "Standard PP Bag (30kg)",
    maxWeightKg: 30,
    dims: { length: "91", width: "61", height: "30" },
    keywords: [],
  },
};

/**
 * Detect packaging profile from product name or category string.
 * @param {string} productName - Product name or category
 * @returns {object} - Matching PACKAGING_PROFILES entry
 */
const detectPackagingProfile = (productName = "") => {
  const name = productName.toLowerCase();

  for (const [key, profile] of Object.entries(PACKAGING_PROFILES)) {
    if (key === "default" || key === "pouch") continue; // checked last
    if (profile.keywords.some((kw) => name.includes(kw))) {
      return profile;
    }
  }

  return PACKAGING_PROFILES.default;
};

module.exports = { PACKAGING_PROFILES, detectPackagingProfile };
