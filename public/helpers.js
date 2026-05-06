/**
 * Převede nebezpečné HTML znaky na bezpečné entity.
 * Slouží jako prevence proti XSS útokům při výpisu uživatelského textu.
 * 
 * @param {string} str - Textový řetězec k ošetření.
 * @returns {string} Sanitizovaný řetězec.
 */
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
