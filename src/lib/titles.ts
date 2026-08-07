const ADJ = [
  "Sunburnt", "Barefoot", "Full-Moon", "High-Tide", "Coconut-Powered",
  "Monsoon-Proof", "Trance-State", "Palm-Shaded", "Salt-Air", "Feni-Fueled",
  "Sunset-Grade", "Beachside", "Offshore", "Low-Tide", "Solar-Charged",
];

const NOUN = [
  "Shipper", "Debugger", "Deployer", "Architect", "Compiler",
  "Merge Lord", "Hotfixer", "Prototyper", "Indie Hacker", "Beach Committer",
  "Stack Surfer", "Bug Whisperer", "Demo Demon", "Launch Captain", "Byte Bender",
];

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function builderTitle(name: string, seed: number): string {
  const h = hashString(name.toLowerCase().trim()) + seed * 7919;
  const a = ADJ[h % ADJ.length];
  const n = NOUN[Math.floor(h / ADJ.length) % NOUN.length];
  return `${a} ${n}`;
}

export function badgeId(name: string): string {
  const h = hashString(name.toLowerCase().trim() || "builder");
  return `HH26-${(h % 10000).toString().padStart(4, "0")}`;
}
