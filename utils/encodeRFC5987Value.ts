export function encodeRFC5987Value(value: string): string {
  return encodeURIComponent(value)
    .replace(/'/g, "%27")
    .replace(/"/g, "%22")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/\*/g, "%2A")
    .replace(/%20/g, "+");
}
