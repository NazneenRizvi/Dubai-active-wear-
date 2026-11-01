/** Customer-friendly reference; Firestore retains the full unique internal ID. */
export function orderReference(id: string): string {
  const uuid = id.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-([0-9a-f]{12})$/i);
  if (uuid) return `DA-${uuid[1].slice(0, 10).toUpperCase()}`;
  const cleaned = id.replace(/[^a-z0-9]/gi, '').toUpperCase();
  return `DA-${cleaned.slice(-10)}`;
}
