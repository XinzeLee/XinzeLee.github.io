// Preview alternatives with sitestats.html?markers=garnet-gold (or another key).
export const markerStyles = {
  "teal-amber": { label: "Teal to amber", colors: ["#0f766e", "#27a3a1", "#d99a22", "#b94b25"], size: 32, halo: 0.6 },
  "garnet-gold": { label: "Garnet and gold", colors: ["#782f40", "#a54950", "#c68b45", "#a67c24"], size: 20, halo: 0.5 },
  "violet-coral": { label: "Violet to coral", colors: ["#6555ac", "#9670b2", "#c66d94", "#d95645"], size: 20, halo: 0.6 },
  "ocean-blue": { label: "Ocean blue", colors: ["#6c9cb6", "#4186a9", "#286389", "#143e61"], size: 16, halo: 0.3 },
};

export const defaultMarkerStyle = "teal-amber";

export function colorAt(colors, t) {
  const position = Math.max(0, Math.min(1, t)) * (colors.length - 1);
  const index = Math.min(Math.floor(position), colors.length - 2);
  return { from: colors[index], to: colors[index + 1], mix: position - index };
}
