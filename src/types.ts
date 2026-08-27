export type Attempt = {
  id: string;
  at: number;
  mode: "microphone" | "midi";
  score: number;
  contourScore: number;
  medianCents: number | null;
  answerPitches: number[];
};

export type ClipRecord = {
  id: string;
  name: string;
  type: string;
  blob: Blob;
  duration: number;
  createdAt: number;
  updatedAt: number;
  a: number;
  b: number;
  targetPitches: number[];
  attempts: Attempt[];
  nextDue: number;
  pack?: string;
};

export type Comparison = {
  score: number;
  contourScore: number;
  medianCents: number | null;
  direction: "sharp" | "flat" | "centered" | "unknown";
  hint: string;
};
