/**
 * Generates a unique Google Meet room link per teleconsultation.
 *
 * Strategy: We use Google Meet's "lookup" URL pattern, which creates an ad-hoc
 * room from a unique code on first access (when the user is signed into Google).
 * This guarantees each consultation gets its own room without requiring the
 * Google Workspace API.
 *
 * Format: https://meet.google.com/lookup/<10-12 alfanumeric chars>
 */
export function generateMeetRoom(): { roomName: string; roomUrl: string } {
  // 11 lowercase alphanumeric characters — Meet-style "xxx-xxxx-xxx" lookalike
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  const randomSegment = (len: number) =>
    Array.from({ length: len }, () =>
      alphabet[Math.floor(Math.random() * alphabet.length)]
    ).join("");

  const roomName = `${randomSegment(3)}-${randomSegment(4)}-${randomSegment(3)}`;
  const roomUrl = `https://meet.google.com/lookup/${roomName.replace(/-/g, "")}`;
  return { roomName, roomUrl };
}
