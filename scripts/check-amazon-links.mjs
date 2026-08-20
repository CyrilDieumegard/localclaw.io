import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { amazonMarketplace, amazonSearchUrl, normalizeAmazonQuery } from "../functions/_lib/amazon-links.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(ROOT, "ram-gpu-for-local-ai.html"), "utf8");
const workerRoutes = JSON.parse(fs.readFileSync(path.join(ROOT, "_routes.json"), "utf8"));
const links = [...html.matchAll(/<a class="amazon-btn" href="([^"]+)"/g)].map(match => match[1]);
const errors = [];

if (links.length !== 18) errors.push(`Expected 18 RAM/GPU Amazon buttons; found ${links.length}`);
for (const href of links) {
  if (!href.startsWith("/go/amazon?q=")) errors.push(`Amazon button bypasses the regional resolver: ${href}`);
  const query = new URL(href, "https://localclaw.io").searchParams.get("q");
  if (!normalizeAmazonQuery(query)) errors.push(`Amazon button has an invalid search query: ${href}`);
}
if (new Set(links).size !== links.length) errors.push("RAM/GPU Amazon searches must be unique");
if (/href="https:\/\/(?:www\.)?amazon\./i.test(html)) errors.push("RAM/GPU page still contains a direct Amazon button URL");
if (!workerRoutes.include.includes("/go/amazon")) errors.push("Cloudflare routes do not include /go/amazon");

const swiss = new URL(amazonSearchUrl("DDR5 64GB 2x32GB 6000 CL30", "CH"));
if (swiss.hostname !== "www.amazon.de" || swiss.searchParams.has("tag")) errors.push("Swiss traffic must use Amazon.de without the US affiliate tag");
const us = new URL(amazonSearchUrl("RTX 4090 24GB", "US"));
if (us.hostname !== "www.amazon.com" || us.searchParams.get("tag") !== "localclaw-20") errors.push("US traffic must keep the localclaw-20 affiliate tag");
if (amazonMarketplace("GB") !== "www.amazon.co.uk") errors.push("UK marketplace mapping is invalid");
if (amazonSearchUrl("x", "US") !== "") errors.push("Invalid short searches must fail closed");

if (errors.length) {
  console.error(`Amazon link validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Amazon link validation passed: ${links.length} RAM/GPU searches, regional routing and US affiliate attribution.`);
