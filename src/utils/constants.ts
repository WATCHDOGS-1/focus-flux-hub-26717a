// High-Stakes Subject Focus
export const APP_NAME = "OnlyFocus: High-Stakes Prep";
export const MAX_USERNAME_LENGTH = 30;
export const DEFAULT_FOCUS_MINUTES = 50; // Pivot to longer deep work sessions

export const EXAM_SUBJECTS = [
  "Physics (JEE/Boards)",
  "Chemistry (Organic/Inorganic)",
  "Mathematics (Calculus/Algebra)",
  "Biology (NEET)",
  "History/Polity (UPSC)",
  "System Architecture (Technical)",
  "General Aptitude"
];

export const PREDEFINED_ROOMS = [
  { id: "sprint-1", name: "Chamber 01: Pure Physics", maxCapacity: 10, subject: "Physics (JEE/Boards)" },
  { id: "sprint-2", name: "Chamber 02: Mathematical Rigor", maxCapacity: 10, subject: "Mathematics (Calculus/Algebra)" },
  { id: "sprint-3", name: "Chamber 03: The Bio-Lab", maxCapacity: 10, subject: "Biology (NEET)" },
  { id: "sprint-4", name: "Deep Work: Humanities", maxCapacity: 10, subject: "History/Polity (UPSC)" },
  { id: "sprint-5", name: "The Alchemist (Chemistry)", maxCapacity: 10, subject: "Chemistry (Organic/Inorganic)" },
  { id: "elite-100", name: "Apex Hall (Elite Sprints)", maxCapacity: 100, isPremium: true },
];