// Reviewed local dataset of common school-science compounds.
// Formulae and facts follow standard school chemistry references.
export type Compound = {
  slug: string;
  name: string;
  formula: string; // Unicode subscripts, safe to render directly
  type: string;
  atoms: { element: string; symbol: string; count: number }[];
  explanation: string;
  funFact: string;
  uses: string;
};

export const COMPOUNDS: Compound[] = [
  {
    slug: "water",
    name: "Water",
    formula: "H₂O",
    type: "Covalent compound (oxide)",
    atoms: [
      { element: "Hydrogen", symbol: "H", count: 2 },
      { element: "Oxygen", symbol: "O", count: 1 },
    ],
    explanation:
      "Water is made of two hydrogen atoms bonded to one oxygen atom. It is the most important solvent on Earth — most living things are mostly water, and almost all life processes happen in it.",
    funFact: "Water is one of the few substances that expands when it freezes, which is why ice floats on liquid water.",
    uses: "Drinking, cleaning, cooking, and as the medium for nearly all chemical reactions in living cells.",
  },
  {
    slug: "carbon-dioxide",
    name: "Carbon Dioxide",
    formula: "CO₂",
    type: "Covalent compound (oxide)",
    atoms: [
      { element: "Carbon", symbol: "C", count: 1 },
      { element: "Oxygen", symbol: "O", count: 2 },
    ],
    explanation:
      "Carbon dioxide is a gas made of one carbon atom and two oxygen atoms. You breathe it out, and plants take it in to make their food during photosynthesis.",
    funFact: "Solid carbon dioxide is called dry ice. Instead of melting, it turns straight into a gas — a process called sublimation.",
    uses: "Used by plants in photosynthesis, in fizzy drinks, and in fire extinguishers.",
  },
  {
    slug: "sodium-chloride",
    name: "Sodium Chloride",
    formula: "NaCl",
    type: "Ionic compound (salt)",
    atoms: [
      { element: "Sodium", symbol: "Na", count: 1 },
      { element: "Chlorine", symbol: "Cl", count: 1 },
    ],
    explanation:
      "Sodium chloride is common table salt. A sodium atom gives an electron to a chlorine atom, and the resulting charged particles lock together into a crystal.",
    funFact: "Sodium is a metal that reacts violently with water, and chlorine is a poisonous gas — yet together they make the harmless salt on your food.",
    uses: "Seasoning and preserving food, and making chlorine and other chemicals industrially.",
  },
  {
    slug: "oxygen",
    name: "Oxygen",
    formula: "O₂",
    type: "Diatomic element (molecule)",
    atoms: [{ element: "Oxygen", symbol: "O", count: 2 }],
    explanation:
      "Oxygen gas exists as two oxygen atoms bonded together. It makes up about 21% of the air and is needed by most living things to release energy from food.",
    funFact: "Oxygen itself does not burn, but it supports burning — things burn much faster in pure oxygen.",
    uses: "Breathing, hospitals, welding, and rocket propellant systems.",
  },
  {
    slug: "methane",
    name: "Methane",
    formula: "CH₄",
    type: "Covalent compound (hydrocarbon)",
    atoms: [
      { element: "Carbon", symbol: "C", count: 1 },
      { element: "Hydrogen", symbol: "H", count: 4 },
    ],
    explanation:
      "Methane is the simplest hydrocarbon: one carbon atom joined to four hydrogen atoms. It is the main ingredient of natural gas used for cooking and heating.",
    funFact: "Methane is also produced by cows and other grazing animals as they digest their food.",
    uses: "Fuel for cooking, heating and electricity generation.",
  },
  {
    slug: "ammonia",
    name: "Ammonia",
    formula: "NH₃",
    type: "Covalent compound",
    atoms: [
      { element: "Nitrogen", symbol: "N", count: 1 },
      { element: "Hydrogen", symbol: "H", count: 3 },
    ],
    explanation:
      "Ammonia is a sharp-smelling gas made of one nitrogen atom and three hydrogen atoms. It dissolves in water to form a weak alkali.",
    funFact: "Most of the world's ammonia is made in factories to produce fertilisers that help grow crops.",
    uses: "Fertilisers, cleaning products, and refrigeration.",
  },
  {
    slug: "hydrochloric-acid",
    name: "Hydrochloric Acid",
    formula: "HCl",
    type: "Acid (in solution)",
    atoms: [
      { element: "Hydrogen", symbol: "H", count: 1 },
      { element: "Chlorine", symbol: "Cl", count: 1 },
    ],
    explanation:
      "Hydrogen chloride gas dissolved in water makes hydrochloric acid, a strong acid. Your own stomach uses a dilute version of it to help digest food.",
    funFact: "Your stomach lining renews itself constantly so the acid inside does not digest the stomach itself.",
    uses: "Digestion in the stomach, cleaning metals, and producing other chemicals.",
  },
  {
    slug: "sodium-bicarbonate",
    name: "Sodium Bicarbonate",
    formula: "NaHCO₃",
    type: "Ionic compound (salt)",
    atoms: [
      { element: "Sodium", symbol: "Na", count: 1 },
      { element: "Hydrogen", symbol: "H", count: 1 },
      { element: "Carbon", symbol: "C", count: 1 },
      { element: "Oxygen", symbol: "O", count: 3 },
    ],
    explanation:
      "Sodium bicarbonate is baking soda. When it meets an acid — like vinegar or lemon juice — it fizzes and releases carbon dioxide gas.",
    funFact: "That fizz is what makes cakes and bread rise in the oven.",
    uses: "Baking, antacids for indigestion, and gentle cleaning.",
  },
  {
    slug: "glucose",
    name: "Glucose",
    formula: "C₆H₁₂O₆",
    type: "Covalent compound (sugar)",
    atoms: [
      { element: "Carbon", symbol: "C", count: 6 },
      { element: "Hydrogen", symbol: "H", count: 12 },
      { element: "Oxygen", symbol: "O", count: 6 },
    ],
    explanation:
      "Glucose is a simple sugar that plants make during photosynthesis. Your cells break it down to release the energy that powers everything you do.",
    funFact: "Your brain alone uses about 120 grams of glucose every day.",
    uses: "The main energy source for living cells; also used in sports drinks and medicine.",
  },
  {
    slug: "calcium-carbonate",
    name: "Calcium Carbonate",
    formula: "CaCO₃",
    type: "Ionic compound (salt)",
    atoms: [
      { element: "Calcium", symbol: "Ca", count: 1 },
      { element: "Carbon", symbol: "C", count: 1 },
      { element: "Oxygen", symbol: "O", count: 3 },
    ],
    explanation:
      "Calcium carbonate is the main material in chalk, limestone, marble and seashells. It reacts with acids, which is why acid rain damages limestone buildings.",
    funFact: "Sea creatures build their shells and coral reefs out of calcium carbonate they pull from seawater.",
    uses: "Building materials, antacid tablets, and chalk.",
  },
  {
    slug: "hydrogen-peroxide",
    name: "Hydrogen Peroxide",
    formula: "H₂O₂",
    type: "Covalent compound (peroxide)",
    atoms: [
      { element: "Hydrogen", symbol: "H", count: 2 },
      { element: "Oxygen", symbol: "O", count: 2 },
    ],
    explanation:
      "Hydrogen peroxide is like water with one extra oxygen atom. That extra oxygen makes it reactive, so it slowly breaks down into water and oxygen gas.",
    funFact: "The fizzing you see when it touches a cut is oxygen gas being released as it breaks down.",
    uses: "Disinfecting small wounds, bleaching hair, and whitening products.",
  },
  {
    slug: "ethanol",
    name: "Ethanol",
    formula: "C₂H₅OH",
    type: "Covalent compound (alcohol)",
    atoms: [
      { element: "Carbon", symbol: "C", count: 2 },
      { element: "Hydrogen", symbol: "H", count: 6 },
      { element: "Oxygen", symbol: "O", count: 1 },
    ],
    explanation:
      "Ethanol is the alcohol found in hand sanitisers and antiseptics. It is made when yeast ferments sugars, and it evaporates quickly from the skin.",
    funFact: "Ethanol can be used as a fuel — some cars run on a blend of petrol and ethanol made from plants.",
    uses: "Hand sanitisers, antiseptics, solvents and biofuel.",
  },
];

export const findCompound = (slug: string) => COMPOUNDS.find((c) => c.slug === slug);
