import { Ship } from "./index";

// This is a simulated CMS (content management system) data source
export const SHIP_REVIEWS: Record<string, string> = {
  "Oasis": "The ultimate mega-ship experience. With its neighborhood concept, Central Park, and Boardwalk, it feels more like a floating city than a ship. Perfect for families who want endless entertainment.",
  "QueenMary2": "The last true ocean liner. Elegance, tradition, and white-glove service define this vessel. It offers a sophisticated, slow-paced voyage across the Atlantic that is unmatched in the industry.",
  "Freedom": "A great balance of size and fun. While not as massive as the Oasis class, it packs a punch with the FlowRider and vibrant promenade. A solid choice for a Caribbean getaway.",
};

// General generator (if no specific review, generate one based on data)
export const getGeneratedReview = (shipName: string, density: number) => {
  if (SHIP_REVIEWS[shipName]) return SHIP_REVIEWS[shipName];
  
  // Simple rule-based generation system
  if (density > 45) return `Known for its generous space ratio, ${shipName} offers a relaxed, uncrowded atmosphere ideal for travelers seeking tranquility.`;
  if (density < 35) return `${shipName} is a high-energy vessel packed with activities. Expect a bustling, social vibe perfect for those who love to be in the center of the action.`;
  return `A well-rounded vessel offering a classic cruising experience with a mix of relaxation and entertainment options.`;
};


// 1. Quadrant Definitions - Used for tooltip hover
export const QUADRANT_DEFINITIONS = {
  "Cash Cow": {
    title: "Cash Cow",
    desc: "High Efficiency, High Density. These ships pack passengers in efficiently. They generate maximum revenue per square meter but offer lower passenger comfort.",
    criteria: "Efficiency > 2.5 & Space < 40"
  },
  "Mass Market": {
    title: "Mass Market",
    desc: "High Efficiency, Low Density. Optimized for scale but slightly less crowded than Cash Cows. The standard industry workhorses.",
    criteria: "Efficiency > 2.5 & Space < 40" 
  },
  "Luxury": {
    title: "Luxury Niche",
    desc: "Low Efficiency, High Space. High crew-to-passenger ratio and vast space. Operational costs are high, requiring premium ticket prices to sustain.",
    criteria: "Efficiency < 2.5 & Space > 40"
  },
  "Risk Asset": {
    title: "Risk Asset",
    desc: "Low Efficiency, Low Space. The worst of both worlds. Crowded yet operationally expensive. Often older vessels needing refit or disposal.",
    criteria: "Efficiency < 2.5 & Space < 40"
  }
};

// 2. Investment Analysis Generator (AI Analyst)
export const generateInvestmentMemo = (ship: Ship) => {
  const ratio = ship.crew > 0 ? ship.passengers / ship.crew : 0;
  const density = ship.passenger_density;
  
  // Determine quadrant
  let category = "Risk Asset";
  let sentiment = "Negative";
  if (density >= 40 && ratio >= 2.5) { category = "Cash Cow"; sentiment = "Positive"; }
  else if (density < 40 && ratio >= 2.5) { category = "Mass Market"; sentiment = "Neutral"; }
  else if (density >= 40 && ratio < 2.5) { category = "Luxury"; sentiment = "Positive"; }

  // Generate summary
  const summary = [
    `Asset ${ship.Ship_name} operates as a **${category}** within the ${ship.Cruise_line} fleet.`,
    `With a pax/crew ratio of **${ratio.toFixed(2)}** and density of **${density.toFixed(1)}**,`,
    category === 'Luxury' 
      ? "it targets high-net-worth yields through superior service levels."
      : category === 'Cash Cow'
      ? "it maximizes volume efficiency, representing a strong revenue generator."
      : "it balances operational costs with standard market expectations."
  ].join(" ");

  // Risk/Opportunity Points
  const bulletPoints = [];
  if (ship.Age > 20) bulletPoints.push("⚠️ High Risk: Aging asset approaching obsolescence.");
  if (ship.Age < 5) bulletPoints.push("🚀 Opportunity: Modern hardware commanding premium pricing.");
  if (ratio > 3.5) bulletPoints.push("💰 Efficiency: Exceptional operational leverage.");
  if (density > 50) bulletPoints.push("💎 Premium: Market-leading space ratio.");

  return { category, sentiment, summary, bulletPoints };
};

// B2C Storytelling
export const generateTravelerReview = (ship: Ship) => {
  const ratio = ship.crew > 0 ? ship.passengers / ship.crew : 0;
  const density = ship.passenger_density;
  const age = ship.Age;

  // 1. Define Headline
  let headline = "A Classic Ocean Voyage";
  if (density < 30) headline = "An Exclusive Sanctuary at Sea";
  else if (density > 45) headline = "The Ultimate Floating City";
  else if (age < 5) headline = "State-of-the-Art Modern Luxury";

  // 2. Define Vibe Tags
  const tags = [];
  if (age < 5) tags.push("✨ Brand New");
  if (age > 20) tags.push("🎻 Timeless Elegance");
  if (ratio < 2.5) tags.push("👑 Royal Service");
  if (density > 50) tags.push("🎉 Non-stop Fun");
  if (density < 35) tags.push("🧘 Zen Retreat");

  // 3. Generate Marketing Copy
  let description = "";
  
  if (density > 45) {
    description += `${ship.Ship_name} is designed for energy and excitement. It's a bustling hub of activity where there's never a dull moment. `;
  } else if (density < 35) {
    description += `Escape the crowds aboard ${ship.Ship_name}. This vessel prioritizes personal space and tranquility, offering a private yacht-like feel. `;
  } else {
    description += `${ship.Ship_name} strikes the perfect balance between relaxation and entertainment. `;
  }

  if (ratio < 2.4) {
    description += `With an exceptional crew ratio, expect your glass to be refilled before you even ask. It's pampering at its finest.`;
  } else {
    description += `The friendly crew ensures a warm, welcoming atmosphere perfect for families and groups connecting on the open ocean.`;
  }

  // 4. Define Recommended Audience
  const bestFor = density > 40 ? "Families & Party Lovers" : "Couples & Seekers of Quiet";

  return { headline, description, tags, bestFor };
};