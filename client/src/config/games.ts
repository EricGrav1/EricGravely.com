export type GameListing = {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  href: string;
  status: string;
  details: string[];
  skills: string[];
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
];
