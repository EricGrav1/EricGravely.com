import { useQuery } from "@tanstack/react-query";
import type { LeadMagnet } from "@shared/schema";

const DEFAULT_QUESTIONS = [
  {
    id: "role",
    type: "select",
    label: "What best describes your role?",
    options: ["SDR / BDR", "Account Executive", "Sales Manager / Leader", "Business Owner", "Other"],
    required: true,
  },
  {
    id: "experience",
    type: "select",
    label: "How long have you been in sales?",
    options: ["Less than 1 year", "1–3 years", "3–7 years", "7+ years"],
    required: true,
  },
  {
    id: "challenge",
    type: "select",
    label: "What's your biggest challenge right now?",
    options: ["Booking more meetings", "Controlling the conversation", "Handling objections", "Closing consistently", "Coaching my team"],
    required: true,
  },
  {
    id: "quota",
    type: "select",
    label: "Where are you against quota lately?",
    options: ["Ahead of quota", "Right around quota", "Behind quota", "I don't carry a quota"],
    required: true,
  },
  {
    id: "goal",
    type: "text",
    label: "What's the #1 thing you want to improve in the next 90 days?",
    required: true,
  },
];

// The local Vite preview has no Replit database attached. These records mirror
// the currently published catalog so the design remains reviewable locally.
// Production always uses /api/lead-magnets and never falls back to this list.
const LOCAL_PREVIEW_PRODUCTS: LeadMagnet[] = [
  {
    id: 6,
    title: "The Ask & Close Playbook",
    description: "Most reps that aren't closing usually aren't asking enough questions. This playbook maps the exact open and closed questions for all five stages of a deal putting you in position to close more and earn more!",
    productType: "download",
    resourceUrl: "/downloads/ask-close_playbook.pdf",
    deliveryMethod: "email",
    externalUrl: null,
    buttonLabel: "Get the free playbook",
    iconPath: null,
    active: true,
    viewCount: 0,
    submissionCount: 0,
    questionnaireFields: DEFAULT_QUESTIONS,
    previewImages: null,
    videoUrl: null,
    nextSteps: null,
    createdAt: new Date("2026-07-07T20:01:37.481Z"),
  },
  {
    id: 8,
    title: "Sales Rep Self-Coaching Tool",
    description: "Grade your own calls before your manager does. Score yourself across Intro, Call Control, and Close — the dashboard shows you exactly where your calls leak.",
    productType: "download",
    resourceUrl: "/downloads/salesrep-coaching-tool.xlsx",
    deliveryMethod: "email",
    externalUrl: null,
    buttonLabel: "Get the free tool",
    iconPath: null,
    active: true,
    viewCount: 0,
    submissionCount: 0,
    questionnaireFields: DEFAULT_QUESTIONS,
    previewImages: null,
    videoUrl: null,
    nextSteps: null,
    createdAt: new Date("2026-07-07T20:13:45.933Z"),
  },
  {
    id: 9,
    title: "Sales Coach AI",
    description: "Your calls, analyzed. AI-powered coaching that reviews your performance and tells you what to fix — like having a coach in your pocket after every call.",
    productType: "external",
    resourceUrl: null,
    deliveryMethod: "email",
    externalUrl: "https://apps.apple.com/us/app/sales-coach-ai/id6748286535",
    buttonLabel: "Download on the App Store",
    iconPath: "/sales-coach-ai-icon.png",
    active: true,
    viewCount: 0,
    submissionCount: 0,
    questionnaireFields: null,
    previewImages: null,
    videoUrl: null,
    nextSteps: null,
    createdAt: new Date("2026-07-07T20:41:07.661Z"),
  },
];

function isLocalPreview() {
  return window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
}

export function usePublishedProducts() {
  const query = useQuery<LeadMagnet[]>({ queryKey: ["/api/lead-magnets"] });
  const usingLocalFallback = query.isError && isLocalPreview();

  return {
    ...query,
    data: usingLocalFallback ? LOCAL_PREVIEW_PRODUCTS : query.data,
    isError: usingLocalFallback ? false : query.isError,
    usingLocalFallback,
  };
}
