const fs = require('fs');
const vm = require('vm');
const assert = require('node:assert/strict');
class Node {
  constructor(attrs = {}) { this.attrs = attrs; this.listeners = {}; this.textContent = ''; this.hidden = true; }
  addEventListener(type, listener) { (this.listeners[type] ||= []).push(listener); }
  setAttribute(key, value) { this.attrs[key] = value; }
  getAttribute(key) { return this.attrs[key]; }
  fire(type) { for (const listener of this.listeners[type] || []) listener(); }
}
const ids = ['pricing-tour-controls', 'pricing-tour-play', 'pricing-tour-progress', 'pricing-tour-time', 'pricing-tour-status', 'pricing-carousel-title', 'pricing-carousel-caption'];
const nodes = Object.fromEntries(ids.map(id => [id, new Node()]));
const chapters = [0, 1, 2].map(i => new Node({ 'data-tour-chapter': String(i) }));
const gallery = Array.from({length:14}, (_,i) => new Node({ 'data-pricing-slide': String(i) }));
nodes['pricing-tour-controls'].querySelectorAll = () => chapters;
const doc = new Node();
doc.getElementById = id => nodes[id];
doc.querySelectorAll = () => gallery;
doc.hidden = false;
let time = 0, nextTimer = 1, activeSlide, completed = 0;
const intervals = new Map();
const win = new Node();
win.setPricingSlide = i => { activeSlide = i; };
win.setInterval = cb => { const id = nextTimer++; intervals.set(id, cb); return id; };
win.clearInterval = id => intervals.delete(id);
win.datafast = event => { if (event === 'pricing_tour_complete') completed++; };
const context = { document: doc, window: win, performance: { now: () => time } };
vm.runInNewContext(fs.readFileSync(require.resolve('../js/pricing-tour.js'), 'utf8'), context);
const play = nodes['pricing-tour-play'];
function advance(ms) { time += ms; for (const cb of [...intervals.values()]) cb(); }
assert.equal(nodes['pricing-tour-controls'].hidden, false);
assert.equal(intervals.size, 0, 'No initial autoplay');
assert.equal(activeSlide, 1, 'Install is initial screenshot');
play.fire('click');
advance(15000); assert.equal(activeSlide, 6, 'Models at 15s');
advance(15000); assert.equal(activeSlide, 4, 'Chat at 30s');
play.fire('click'); const pausedTime = nodes['pricing-tour-time'].textContent;
advance(12000); assert.equal(nodes['pricing-tour-time'].textContent, pausedTime, 'Pause freezes progress');
play.fire('click'); advance(15000);
assert.equal(completed, 1); assert.equal(intervals.size, 0); assert.match(play.textContent, /Replay/);
assert.equal(nodes['pricing-tour-time'].textContent, '0:45 / 0:45');
play.fire('click'); assert.equal(activeSlide, 1, 'Replay starts at install');
chapters[1].fire('click'); assert.equal(activeSlide, 6); assert.equal(intervals.size, 0, 'Manual chapter is paused');
assert.equal(chapters[1].attrs['aria-pressed'], 'true');
play.fire('click'); advance(2000); gallery[11].fire('click');
assert.equal(activeSlide, 11); assert.equal(intervals.size, 0, 'Gallery pauses playback');
assert.ok(chapters.every(chapter => chapter.attrs['aria-pressed'] === 'false'));
play.fire('click'); assert.equal(activeSlide, 1, 'Tour restarts from gallery');
doc.hidden = true; doc.fire('visibilitychange'); assert.equal(intervals.size, 0, 'Hidden tab pauses playback');
play.fire('click'); win.pausePricingTour(); assert.equal(intervals.size, 0, 'Lightbox hook pauses playback');
console.log('PASS: no autoplay; install/models/chat at 0/15/30s; pause/resume; completion at 45s; replay; manual chapters; gallery; hidden tab; lightbox pause.');
