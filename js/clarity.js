/* ============================================================
 * Microsoft Clarity — Free session recordings & heatmaps
 * Quick win: diagnose WHERE users bounce (scroll, dead clicks, rage clicks)
 *
 * 👉 SETUP INSTRUCTIONS:
 *    1. Go to https://clarity.microsoft.com/ (free, no credit card)
 *    2. Create a project for "localclaw.io"
 *    3. Copy your Project ID (10-char string like "abc123xyz0")
 *    4. Replace "YOUR_CLARITY_ID" below with that ID
 *    5. Deploy. Data starts flowing within ~2 hours.
 *
 * 🔒 Privacy-friendly by default:
 *    - Respects DNT (Do Not Track) browser setting
 *    - Masks all input fields (no PII capture)
 *    - Can be disabled for EU users if needed (add GDPR consent)
 *
 * 📊 What you'll see in dashboard:
 *    - Session recordings (where users stop scrolling & exit)
 *    - Heatmaps (hot zones vs dead zones)
 *    - Rage clicks (frustration signals)
 *    - Dead clicks (users clicking on non-clickable elements)
 *    - Scroll depth per page
 * ============================================================ */

(function () {
  // Respect user's Do Not Track preference
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1') {
    return;
  }

  // Skip on localhost / dev environments to avoid polluting analytics
  var host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) {
    return;
  }

  var CLARITY_PROJECT_ID = 'YOUR_CLARITY_ID'; // ⚠️ Replace with your real Clarity project ID

  // Bail out if not configured yet (prevents broken script in prod)
  if (!CLARITY_PROJECT_ID || CLARITY_PROJECT_ID === 'YOUR_CLARITY_ID') {
    return;
  }

  // Official Clarity snippet (async, non-blocking)
  (function (c, l, a, r, i, t, y) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments) };
    t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
    y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
  })(window, document, 'clarity', 'script', CLARITY_PROJECT_ID);
})();
