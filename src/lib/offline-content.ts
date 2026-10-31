import type { OfflinePack } from "@/lib/offline-downloads";

type PackSeed = Omit<OfflinePack, "savedAt">;

export const OFFLINE_PACKS: Record<string, PackSeed> = {
  chemistry: {
    id: "chemistry", title: "Chemistry Lab Starter Pack", subject: "Chemistry", icon: "⚗️", theme: "from-cyan-950 via-teal-950 to-emerald-950",
    description: "Atoms, molecules, bonding and safe reaction concepts.",
    story: "Welcome to the Molecular Lab. Your mission is to understand how tiny particles build the materials around us.",
    objective: "Explore atoms, molecules, elements and simple chemical reactions.",
    facts: ["An atom is the smallest unit of an element that keeps its chemical identity.", "A molecule contains two or more atoms chemically bonded together.", "Water is H₂O: each molecule has two hydrogen atoms and one oxygen atom.", "A chemical reaction rearranges atoms; it does not create or destroy them."],
    questions: [
      { question: "What is the chemical formula for water?", answers: ["CO₂", "H₂O", "O₂"], correct: 1, explanation: "Water contains two hydrogen atoms and one oxygen atom, so its formula is H₂O." },
      { question: "What is a molecule?", answers: ["Two or more bonded atoms", "A single proton", "A type of force"], correct: 0, explanation: "A molecule is made from atoms joined by chemical bonds." },
      { question: "What happens to atoms in a chemical reaction?", answers: ["They disappear", "They turn into energy only", "They are rearranged"], correct: 2, explanation: "Chemical reactions rearrange atoms into new combinations." },
    ],
    activity: { kind: "molecule", equation: { equation: "H₂ + O₂ → H₂O", coefficients: [1, 1, 1], balanced: [2, 1, 2], fact: "Balanced equations have the same number of each type of atom on both sides." }, challenges: [
      { formula: "H₂O", name: "Water", atoms: { H: 2, O: 1 }, fact: "Water has two hydrogen atoms bonded to one oxygen atom." },
      { formula: "CO₂", name: "Carbon dioxide", atoms: { C: 1, O: 2 }, fact: "One carbon atom bonds with two oxygen atoms." },
      { formula: "NaCl", name: "Sodium chloride", atoms: { Na: 1, Cl: 1 }, fact: "Sodium and chlorine form an ionic compound." },
    ] },
  },
  physics: {
    id: "physics", title: "Physics Power World", subject: "Physics", icon: "🧲", theme: "from-slate-950 via-blue-950 to-cyan-950",
    description: "Gravity, forces, magnets, motion, circuits and light.",
    story: "Enter the Physics Power World. Test forces, predict motion and use magnetic fields to solve challenges.",
    objective: "Connect physical models to everyday motion, magnets and electricity.",
    facts: ["A force is a push or pull that can change an object's motion.", "Gravity attracts objects with mass toward one another.", "Like magnetic poles repel; opposite magnetic poles attract.", "A closed electric circuit gives current a complete path."],
    questions: [
      { question: "What happens when two north magnetic poles face each other?", answers: ["They attract", "They repel", "They disappear"], correct: 1, explanation: "Like poles repel, while opposite poles attract." },
      { question: "What does gravity do near Earth?", answers: ["Pulls objects toward Earth", "Stops all motion", "Makes objects weightless"], correct: 0, explanation: "Earth's gravitational attraction pulls objects toward its centre." },
      { question: "When can a simple bulb light in a circuit?", answers: ["When the path is open", "When the path is complete", "When there is no battery"], correct: 1, explanation: "A closed, complete conducting path lets current flow through the bulb." },
    ],
    activity: { kind: "magnet", challenges: [
      { north: "N", south: "N", material: "iron", magnetic: true, distance: 2, explanation: "Like poles repel. Iron is attracted to a magnet." },
      { north: "N", south: "S", material: "iron", magnetic: true, distance: 1, explanation: "Opposite poles attract. Iron is a magnetic material." },
      { north: "S", south: "N", material: "plastic", magnetic: false, distance: 1, explanation: "Opposite poles attract, but plastic is not attracted to a magnet." },
    ] },
  },
  biology: {
    id: "biology", title: "Biology Discovery World", subject: "Biology", icon: "🧬", theme: "from-slate-950 via-emerald-950 to-lime-950",
    description: "Cells, organelles, DNA, plants and living systems.",
    story: "Shrink down to the microscopic world and explore the living cell — the basic unit of life.",
    objective: "Identify cell structures and explain how living things carry out life processes.",
    facts: ["The cell is the basic structural and functional unit of life.", "The nucleus stores most of a eukaryotic cell's DNA.", "The cell membrane controls what enters and leaves the cell.", "Chloroplasts capture light energy for photosynthesis in plants."],
    questions: [
      { question: "Which cell structure contains most of a cell's DNA?", answers: ["Nucleus", "Cell wall", "Vacuole"], correct: 0, explanation: "The nucleus stores most of the genetic information in eukaryotic cells." },
      { question: "What controls what enters and leaves a cell?", answers: ["Ribosome", "Cell membrane", "Chloroplast"], correct: 1, explanation: "The cell membrane acts as a selective boundary." },
      { question: "Where does photosynthesis mainly happen?", answers: ["Mitochondria", "Nucleus", "Chloroplasts"], correct: 2, explanation: "Chloroplasts contain chlorophyll and capture light energy." },
    ],
    activity: { kind: "cell-sort", parts: [
      { name: "Nucleus", function: "Stores genetic information", zone: "control" },
      { name: "Cell membrane", function: "Controls what enters and leaves", zone: "boundary" },
      { name: "Chloroplast", function: "Captures light for photosynthesis", zone: "energy" },
    ] },
  },
  "human-body": {
    id: "human-body", title: "Human Body Explorer", subject: "Biology", icon: "❤️", theme: "from-slate-950 via-rose-950 to-orange-950",
    description: "Explore organs, body systems and how they work together.",
    story: "Become a Body Detective and follow how the heart, lungs and brain work as a team.",
    objective: "Understand the roles of key organs and body systems.",
    facts: ["The heart pumps blood around the body.", "The lungs exchange oxygen and carbon dioxide.", "The brain and spinal cord form the central nervous system.", "The small intestine absorbs most digested nutrients."],
    questions: [
      { question: "Which organ pumps blood?", answers: ["Lungs", "Heart", "Stomach"], correct: 1, explanation: "The heart is a muscular pump that circulates blood." },
      { question: "Where does gas exchange happen?", answers: ["Lungs", "Kidneys", "Bones"], correct: 0, explanation: "Gas exchange happens in tiny air sacs called alveoli in the lungs." },
      { question: "Which organ coordinates many body activities?", answers: ["Skin", "Liver", "Brain"], correct: 2, explanation: "The brain processes information and helps coordinate body functions." },
    ],
  },
  space: {
    id: "space", title: "Solar System Mission", subject: "Earth & Space", icon: "🪐", theme: "from-slate-950 via-indigo-950 to-violet-950",
    description: "Planets, orbits, the Sun and our place in space.",
    story: "Launch your explorer craft and travel across the Solar System to discover how planets move around the Sun.",
    objective: "Recognise planets and understand the Sun's role in the Solar System.",
    facts: ["The Sun is a star at the centre of our Solar System.", "Earth takes about one year to orbit the Sun.", "Jupiter is the largest planet in the Solar System.", "A planet's orbit is its path around a star or other body."],
    questions: [
      { question: "Which object is at the centre of our Solar System?", answers: ["Earth", "The Sun", "The Moon"], correct: 1, explanation: "The planets orbit the Sun, which is the star at the centre of our Solar System." },
      { question: "Which is the largest planet?", answers: ["Mars", "Venus", "Jupiter"], correct: 2, explanation: "Jupiter is the largest planet in our Solar System." },
      { question: "What is an orbit?", answers: ["A planet's path around another body", "A type of cloud", "A star's colour"], correct: 0, explanation: "An orbit is the curved path an object follows around another object due to gravity." },
    ],
    activity: { kind: "planet-order", planets: [
      { name: "Mercury", emoji: "☿️", order: 1 }, { name: "Venus", emoji: "♀️", order: 2 }, { name: "Earth", emoji: "🌍", order: 3 }, { name: "Mars", emoji: "🔴", order: 4 }, { name: "Jupiter", emoji: "🟠", order: 5 }, { name: "Saturn", emoji: "🪐", order: 6 }, { name: "Uranus", emoji: "🔵", order: 7 }, { name: "Neptune", emoji: "🔷", order: 8 },
    ] },
  },
  maths: {
    id: "maths", title: "Math Adventures Pack", subject: "Mathematics", icon: "📐", theme: "from-slate-950 via-amber-950 to-orange-950",
    description: "Fractions, shapes, patterns and logical challenges.",
    story: "Enter the Math Maze. Use patterns, fractions and geometry to unlock each gate.",
    objective: "Use mathematical reasoning to solve everyday and abstract problems.",
    facts: ["A fraction represents part of a whole.", "The sum of angles in a triangle is 180° in Euclidean geometry.", "A ratio compares two quantities by division.", "An algebraic variable represents a number or value."],
    questions: [
      { question: "What is 1/2 + 1/4?", answers: ["2/6", "3/4", "1/6"], correct: 1, explanation: "One half is two quarters, and two quarters plus one quarter make three quarters." },
      { question: "What is the sum of a triangle's interior angles?", answers: ["90°", "180°", "360°"], correct: 1, explanation: "The interior angles of a Euclidean triangle add up to 180 degrees." },
      { question: "In 3x = 12, what is x?", answers: ["3", "4", "9"], correct: 1, explanation: "Divide both sides by 3: x = 12 ÷ 3 = 4." },
    ],
  },
  eco: {
    id: "eco", title: "Eco Rescue Mission", subject: "Earth & Environment", icon: "🌍", theme: "from-slate-950 via-green-950 to-teal-950",
    description: "Ecosystems, resources and environmental decisions.",
    story: "Your eco team is protecting a habitat. Make smart choices and keep the ecosystem balanced.",
    objective: "Understand ecosystems and the effects of human choices on the environment.",
    facts: ["An ecosystem includes living organisms and their physical environment.", "Producers such as plants make food using light energy.", "Biodiversity means the variety of life in an area.", "Reduce, reuse and recycle can lower waste and resource use."],
    questions: [
      { question: "What is an ecosystem?", answers: ["Only animals", "Living things and their environment", "Only weather"], correct: 1, explanation: "An ecosystem includes organisms interacting with one another and their non-living environment." },
      { question: "Which organisms are usually producers?", answers: ["Green plants", "Fungi only", "Predators"], correct: 0, explanation: "Plants use photosynthesis to make sugars, so they are producers." },
      { question: "What does biodiversity describe?", answers: ["The variety of life", "The age of rocks", "The speed of wind"], correct: 0, explanation: "Biodiversity refers to the variety of living organisms in an area." },
    ],
  },
  cs: {
    id: "cs", title: "Code Logic Lab", subject: "Computer Science", icon: "🤖", theme: "from-slate-950 via-sky-950 to-fuchsia-950",
    description: "Algorithms, loops, instructions and debugging.",
    story: "Guide a robot through a logic maze by arranging clear, ordered instructions.",
    objective: "Understand algorithms and practise structured problem solving.",
    facts: ["An algorithm is a finite sequence of steps to solve a problem.", "A loop repeats a set of instructions.", "Debugging means finding and fixing errors in a program.", "A condition lets a program choose between actions."],
    questions: [
      { question: "What is an algorithm?", answers: ["A sequence of steps", "A computer screen", "A type of battery"], correct: 0, explanation: "An algorithm is an ordered sequence of steps for completing a task or solving a problem." },
      { question: "What does a loop do?", answers: ["Deletes a program", "Repeats instructions", "Turns off a computer"], correct: 1, explanation: "A loop repeats a block of instructions while a rule or condition applies." },
      { question: "What is debugging?", answers: ["Adding more colours", "Finding and fixing errors", "Making a file larger"], correct: 1, explanation: "Debugging is the process of identifying and correcting errors in code." },
    ],
  },
};

export function getOfflinePackSeed(id: string): PackSeed | undefined {
  return OFFLINE_PACKS[id];
}

export function buildOfflinePack(id: string): OfflinePack | undefined {
  const seed = getOfflinePackSeed(id);
  return seed ? { ...seed, contentType: "game", savedAt: Date.now() } : undefined;
}
