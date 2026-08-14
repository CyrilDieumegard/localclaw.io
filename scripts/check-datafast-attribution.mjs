import assert from 'node:assert/strict';
import { datafastCheckoutMetadata } from '../functions/_lib/datafast-attribution.mjs';

const visitorId = '8b586743-6625-4a5e-9d4f-6fa741637acf';
const sessionId = 'sdf78543a-61c7-4f99-a1b0-4d384c56aa12';

assert.deepEqual(metadata(`datafast_visitor_id=${visitorId}; datafast_session_id=${sessionId}`), {
  datafast_visitor_id: visitorId,
  datafast_session_id: sessionId
});
assert.deepEqual(metadata(`other=value; datafast_visitor_id=${visitorId}`), {
  datafast_visitor_id: visitorId
});
assert.deepEqual(metadata('datafast_visitor_id=attacker; datafast_session_id=not-a-session'), {});
assert.deepEqual(metadata(''), {});
assert.deepEqual(metadata(`datafast_visitor_id=${encodeURIComponent(visitorId)}; datafast_session_id=${encodeURIComponent(sessionId)}`), {
  datafast_visitor_id: visitorId,
  datafast_session_id: sessionId
});

console.log('DataFast attribution check passed: canonical visitor/session cookies are forwarded and malformed values are rejected.');

function metadata(cookie) {
  return datafastCheckoutMetadata(new Request('https://localclaw.io/api/sponsor/campaigns/example/checkout', {
    headers: cookie ? { Cookie: cookie } : {}
  }));
}
