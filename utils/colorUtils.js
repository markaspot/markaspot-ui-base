/**
 * Calculate relative luminance of a HEX color.
 * @param {String} hex - The hex color code.
 * @returns {Number} - The luminance value.
 */
function getLuminance(hex) {
  const rgb = hex.match(/\w\w/g).map(c => parseInt(c, 16) / 255);
  return rgb.map(v =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  ).reduce((a, c, i) => a + c * [0.2126, 0.7152, 0.0722][i], 0);
}

/**
 * Invert a HEX color or return black/white for maximum contrast.
 * @param {String} hex - The hex color to invert.
 * @param {Boolean} bw - Whether to return only black or white for best contrast.
 * @returns {String} - The inverted color or black/white for best contrast.
 */
export function invertColor(hex, bw) {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#') || (hex.length !== 7 && hex.length !== 4)) {
    console.warn('Invalid hex color detected:', hex);
    return bw ? '#000000' : '#ffffff'; // Default to black or white
  }

  // Proceed with valid hex
  hex = hex.slice(1); // Remove the '#' character
  const isShortHex = hex.length === 3;

  const r = parseInt(isShortHex ? hex[0] + hex[0] : hex.substring(0, 2), 16);
  const g = parseInt(isShortHex ? hex[1] + hex[1] : hex.substring(2, 4), 16);
  const b = parseInt(isShortHex ? hex[2] + hex[2] : hex.substring(4, 6), 16);

  const inverted = bw
    ? (r * 0.299 + g * 0.587 + b * 0.114) > 186 ? '#000000' : '#ffffff'
    : `#${((1 << 24) + ((255 - r) << 16) + ((255 - g) << 8) + (255 - b)).toString(16).slice(1)}`;

  return inverted;
}

