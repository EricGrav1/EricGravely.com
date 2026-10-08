export type GameListing = {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  href: string;
  status: string;
  details: string[];
  skills: string[];
  previewImage?: string;
};

export const games: GameListing[] = [
  {
    slug: "objection-defenders",
    title: "Objection Defenders",
    eyebrow: "Sales arcade · Game 01",
    description:
      "Defend your pipeline under pressure. Choose the strongest response, reload your instincts, and survive five escalating waves of buyer objections.",
    href: "/games/objection-defenders.html",
    status: "Play now",
    details: ["5 waves", "15-question rotation", "Solo challenge"],
    skills: ["Acknowledge", "Isolate", "Reframe", "Advance"],
  },
  {
    slug: "street-closer",
    title: "Street Closer",
    eyebrow: "Sales arcade · Game 02",
    description:
      "A retro fighting game where reps go toe-to-toe with buyers. Land combos, counter objections with the right rebuttal, then close the deal before the round ends.",
    href: "/games/street-closer.html",
    status: "Fight now",
    details: ["6 buyers", "Best of 3 rounds", "Keyboard + touch"],
    skills: ["Isolate", "Reframe", "Build a champion", "Ask for the close"],
    previewImage: "/games/street-closer-preview.jpg",
  },
];
