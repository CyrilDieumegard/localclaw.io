const test = require('node:test');
const assert = require('node:assert/strict');
const {releaseAgeDays, isRecentRelease, relativeReleaseAge} = require('../js/new-model-sort-20260814a.js');

test('release ages use calendar days in UTC instead of rounding partial days', () => {
    for (const hour of [0, 12, 23]) {
        const now = new Date(Date.UTC(2026, 9, 12, hour, 59));
        assert.equal(releaseAgeDays('2026-10-07', now), 5);
        assert.equal(relativeReleaseAge('2026-10-12', now), 'Today');
        assert.equal(relativeReleaseAge('2026-10-11', now), 'Yesterday');
    }
});

test('NEW covers 30 days and does not invent dates for month-only records', () => {
    const now = new Date('2026-10-12T00:00:00Z');
    assert.equal(isRecentRelease('2026-09-13', now), true);
    assert.equal(isRecentRelease('2026-09-12', now), false);
    assert.equal(isRecentRelease('2026-10-13', now), false);
    for (const value of ['2026-10', '2026-02-30', '', null]) {
        assert.equal(isRecentRelease(value, now), false);
        assert.equal(relativeReleaseAge(value, now), '');
    }
    assert.equal(releaseAgeDays('2026-12-31', new Date('2027-01-01T00:00:00Z')), 1);
});
