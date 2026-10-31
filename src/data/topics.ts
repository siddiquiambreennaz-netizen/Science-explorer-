// Learning topics library. Structured so new subjects/topics can be appended freely.
export type Topic = {
  slug: string;
  subject: "Chemistry" | "Physics" | "Biology" | "Earth & Space";
  title: string;
  description: string;
  objectives: string[];
  compounds: string[]; // compound slugs from compounds.ts
  quizId: string | null; // seeded quiz UUID, if one exists for this topic
};

export const QUIZ_IDS = {
  chemistryBasics: "00000000-0000-4000-8000-000000000001",
  matterMolecules: "00000000-0000-4000-8000-000000000002",
  lifeScience: "00000000-0000-4000-8000-000000000003",
} as const;

export const TOPICS: Topic[] = [
  {
    slug: "atoms-and-molecules",
    subject: "Chemistry",
    title: "Atoms & Molecules",
    description:
      "Everything around you is built from tiny particles called atoms. Learn how atoms join together to form molecules and compounds.",
    objectives: [
      "Describe what an atom is made of (protons, neutrons, electrons)",
      "Explain the difference between an element, a molecule and a compound",
      "Read a simple chemical formula like H₂O or CO₂",
    ],
    compounds: ["water", "carbon-dioxide", "oxygen"],
    quizId: QUIZ_IDS.chemistryBasics,
  },
  {
    slug: "states-of-matter",
    subject: "Chemistry",
    title: "States of Matter",
    description:
      "Solids, liquids and gases behave differently because of how their particles are arranged. Discover how heating and cooling change matter.",
    objectives: [
      "Compare the particle arrangement in solids, liquids and gases",
      "Explain melting, freezing, evaporation and condensation",
      "Give everyday examples of changes of state",
    ],
    compounds: ["water", "carbon-dioxide"],
    quizId: QUIZ_IDS.matterMolecules,
  },
  {
    slug: "acids-and-bases",
    subject: "Chemistry",
    title: "Acids & Bases",
    description:
      "From lemon juice to soap, acids and bases are part of daily life. Learn what makes a substance acidic or alkaline and how they react.",
    objectives: [
      "Name common acids and bases found at home",
      "Describe what happens when an acid reacts with a base",
      "Explain why the fizz appears when baking soda meets vinegar",
    ],
    compounds: ["hydrochloric-acid", "sodium-bicarbonate", "ammonia"],
    quizId: null,
  },
  {
    slug: "everyday-compounds",
    subject: "Chemistry",
    title: "Everyday Compounds",
    description:
      "Salt, sugar, chalk and baking soda — explore the chemistry of compounds you already know from home and the kitchen.",
    objectives: [
      "Match common substances to their chemical formulae",
      "Explain what the numbers in a formula mean",
      "Describe one use of each everyday compound",
    ],
    compounds: ["sodium-chloride", "glucose", "calcium-carbonate", "ethanol"],
    quizId: QUIZ_IDS.chemistryBasics,
  },
  {
    slug: "forces-and-motion",
    subject: "Physics",
    title: "Forces & Motion",
    description:
      "Pushes and pulls make things speed up, slow down and change direction. Meet gravity, friction and the forces that shape movement.",
    objectives: [
      "Identify forces acting on everyday objects",
      "Explain how friction helps and hinders movement",
      "Describe why objects fall towards the ground",
    ],
    compounds: [],
    quizId: null,
  },
  {
    slug: "energy-and-its-forms",
    subject: "Physics",
    title: "Energy & Its Forms",
    description:
      "Energy comes in many forms — light, heat, sound, movement and stored energy. Learn how energy changes from one form to another.",
    objectives: [
      "List the main forms of energy with examples",
      "Describe simple energy transfers, like a torch or a swing",
      "Explain why energy is never created or destroyed, only transferred",
    ],
    compounds: ["methane", "glucose"],
    quizId: null,
  },
  {
    slug: "cells-the-units-of-life",
    subject: "Biology",
    title: "Cells — The Units of Life",
    description:
      "All living things are made of cells. Look inside a cell to find the nucleus, the membrane and the tiny structures that keep life going.",
    objectives: [
      "Name the main parts of plant and animal cells",
      "Explain the job of the nucleus and the cell membrane",
      "Describe one difference between plant and animal cells",
    ],
    compounds: ["water", "glucose"],
    quizId: QUIZ_IDS.lifeScience,
  },
  {
    slug: "photosynthesis",
    subject: "Biology",
    title: "Photosynthesis",
    description:
      "Plants make their own food using sunlight, water and carbon dioxide. Follow the recipe that feeds almost all life on Earth.",
    objectives: [
      "State what plants need for photosynthesis",
      "Explain where in the cell photosynthesis happens",
      "Describe why photosynthesis matters for animals and humans",
    ],
    compounds: ["carbon-dioxide", "water", "glucose", "oxygen"],
    quizId: QUIZ_IDS.lifeScience,
  },
  {
    slug: "solar-system",
    subject: "Earth & Space",
    title: "Our Solar System",
    description:
      "Eight planets orbit our Sun, each with its own personality. Tour the rocky inner worlds and the giant outer planets.",
    objectives: [
      "Name the planets in order from the Sun",
      "Compare rocky planets with gas giants",
      "Explain why a year is longer on Neptune than on Mercury",
    ],
    compounds: [],
    quizId: null,
  },
  {
    slug: "weather-and-climate",
    subject: "Earth & Space",
    title: "Weather & Climate",
    description:
      "Why does it rain? What makes the wind blow? Learn how the Sun, air and water work together to create weather — and how climate is different.",
    objectives: [
      "Explain the difference between weather and climate",
      "Describe how the water cycle moves water around the planet",
      "Name the main factors that shape a region's climate",
    ],
    compounds: ["water", "carbon-dioxide", "oxygen"],
    quizId: null,
  },
];

export const findTopic = (slug: string) => TOPICS.find((t) => t.slug === slug);
export const SUBJECTS = ["Chemistry", "Physics", "Biology", "Earth & Space"] as const;
