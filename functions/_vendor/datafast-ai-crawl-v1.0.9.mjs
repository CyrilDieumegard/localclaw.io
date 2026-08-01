// src/index.ts
/*
 * Vendored from @datafast/ai-crawl 1.0.9 (MIT).
 * Source: https://www.npmjs.com/package/@datafast/ai-crawl
 * Kept local so Cloudflare Pages can bundle Functions without an npm build step.
 */
var DEFAULT_API_URL = "https://datafa.st/api/ai-crawls";
var DEFAULT_TIMEOUT_MS = 1500;
var DEFAULT_MAX_URL_LENGTH = 8192;
var AI_CRAWLER_CATEGORY = {
  ANSWER_FETCH: "answer_fetch",
  SEARCH_INDEX: "search_index",
  TRAINING: "training",
  AI_CRAWLER: "ai_crawler"
};
var AI_CRAWLER_PROVIDERS = [
  {
    provider: "OpenAI",
    agents: [
      { agent: "ChatGPT-User", category: AI_CRAWLER_CATEGORY.ANSWER_FETCH },
      { agent: "OAI-SearchBot", category: AI_CRAWLER_CATEGORY.SEARCH_INDEX },
      { agent: "OAI-AdsBot", category: AI_CRAWLER_CATEGORY.AI_CRAWLER },
      { agent: "GPTBot", category: AI_CRAWLER_CATEGORY.TRAINING }
    ]
  },
  {
    provider: "Anthropic",
    agents: [
      { agent: "Claude-User", category: AI_CRAWLER_CATEGORY.ANSWER_FETCH },
      { agent: "Claude-SearchBot", category: AI_CRAWLER_CATEGORY.SEARCH_INDEX },
      { agent: "ClaudeBot", category: AI_CRAWLER_CATEGORY.TRAINING }
    ]
  },
  {
    provider: "Perplexity",
    agents: [
      { agent: "Perplexity-User", category: AI_CRAWLER_CATEGORY.ANSWER_FETCH },
      { agent: "PerplexityBot", category: AI_CRAWLER_CATEGORY.SEARCH_INDEX }
    ]
  },
  {
    provider: "Google",
    agents: [
      {
        agent: "Google-InspectionTool",
        category: AI_CRAWLER_CATEGORY.SEARCH_INDEX
      },
      { agent: "GoogleOther", category: AI_CRAWLER_CATEGORY.TRAINING },
      { agent: "Google-Extended", category: AI_CRAWLER_CATEGORY.TRAINING },
      {
        agent: "Google-CloudVertexBot",
        category: AI_CRAWLER_CATEGORY.TRAINING
      },
      { agent: "Google-Agent", category: AI_CRAWLER_CATEGORY.ANSWER_FETCH },
      {
        agent: "Google-NotebookLM",
        category: AI_CRAWLER_CATEGORY.ANSWER_FETCH
      },
      {
        agent: "Google-Read-Aloud",
        category: AI_CRAWLER_CATEGORY.ANSWER_FETCH
      },
      { agent: "Googlebot", category: AI_CRAWLER_CATEGORY.SEARCH_INDEX },
      { agent: "GoogleAgent", category: AI_CRAWLER_CATEGORY.ANSWER_FETCH }
    ]
  },
  {
    provider: "Mistral",
    agents: [
      { agent: "MistralAI-User", category: AI_CRAWLER_CATEGORY.ANSWER_FETCH },
      { agent: "MistralAI-Index", category: AI_CRAWLER_CATEGORY.SEARCH_INDEX }
    ]
  },
  {
    provider: "Microsoft",
    agents: [
      { agent: "Bingbot", category: AI_CRAWLER_CATEGORY.SEARCH_INDEX },
      { agent: "msnbot", category: AI_CRAWLER_CATEGORY.SEARCH_INDEX },
      { agent: "Copilot", category: AI_CRAWLER_CATEGORY.ANSWER_FETCH }
    ]
  },
  {
    provider: "Apple",
    agents: [
      { agent: "Applebot-Extended", category: AI_CRAWLER_CATEGORY.TRAINING },
      { agent: "Applebot", category: AI_CRAWLER_CATEGORY.TRAINING }
    ]
  },
  {
    provider: "Amazon",
    agents: [
      { agent: "Amazonbot", category: AI_CRAWLER_CATEGORY.TRAINING },
      { agent: "Amzn-SearchBot", category: AI_CRAWLER_CATEGORY.SEARCH_INDEX },
      { agent: "Amzn-User", category: AI_CRAWLER_CATEGORY.ANSWER_FETCH }
    ]
  },
  {
    provider: "DuckDuckGo",
    agents: [
      { agent: "DuckAssistBot", category: AI_CRAWLER_CATEGORY.ANSWER_FETCH }
    ]
  },
  {
    provider: "xAI",
    agents: [
      { agent: "xAI-SearchBot", category: AI_CRAWLER_CATEGORY.ANSWER_FETCH },
      { agent: "Grok-DeepSearch", category: AI_CRAWLER_CATEGORY.ANSWER_FETCH },
      { agent: "GrokBot", category: AI_CRAWLER_CATEGORY.AI_CRAWLER },
      { agent: "xAI-Bot", category: AI_CRAWLER_CATEGORY.AI_CRAWLER },
      { agent: "xAI-Grok", category: AI_CRAWLER_CATEGORY.AI_CRAWLER },
      { agent: "xAI-Web-Crawler", category: AI_CRAWLER_CATEGORY.AI_CRAWLER },
      { agent: "Grok", category: AI_CRAWLER_CATEGORY.AI_CRAWLER }
    ]
  },
  {
    provider: "Meta",
    agents: [
      { agent: "meta-externalagent", category: AI_CRAWLER_CATEGORY.TRAINING },
      {
        agent: "meta-externalfetcher",
        category: AI_CRAWLER_CATEGORY.ANSWER_FETCH
      },
      { agent: "FacebookBot", category: AI_CRAWLER_CATEGORY.AI_CRAWLER }
    ]
  },
  {
    provider: "Moonshot AI",
    agents: [
      { agent: "Kimi-User", category: AI_CRAWLER_CATEGORY.ANSWER_FETCH },
      { agent: "Kimi-SearchBot", category: AI_CRAWLER_CATEGORY.SEARCH_INDEX },
      { agent: "KimiBot", category: AI_CRAWLER_CATEGORY.TRAINING }
    ]
  },
  {
    provider: "ByteDance",
    agents: [
      { agent: "Doubaobot", category: AI_CRAWLER_CATEGORY.AI_CRAWLER },
      { agent: "Bytespider", category: AI_CRAWLER_CATEGORY.TRAINING },
      { agent: "TikTokSpider", category: AI_CRAWLER_CATEGORY.SEARCH_INDEX }
    ]
  },
  {
    provider: "Baidu",
    agents: [
      { agent: "ERNIEBot", category: AI_CRAWLER_CATEGORY.TRAINING },
      { agent: "YiyanBot", category: AI_CRAWLER_CATEGORY.AI_CRAWLER },
      { agent: "Baiduspider", category: AI_CRAWLER_CATEGORY.SEARCH_INDEX }
    ]
  },
  {
    provider: "Alibaba",
    agents: [
      { agent: "Qwen-User", category: AI_CRAWLER_CATEGORY.ANSWER_FETCH },
      { agent: "QwenBot", category: AI_CRAWLER_CATEGORY.TRAINING },
      { agent: "TongyiBot", category: AI_CRAWLER_CATEGORY.AI_CRAWLER },
      { agent: "AliyunBot", category: AI_CRAWLER_CATEGORY.AI_CRAWLER }
    ]
  },
  {
    provider: "Zhipu AI",
    agents: [
      { agent: "ChatGLM-Spider", category: AI_CRAWLER_CATEGORY.TRAINING }
    ]
  },
  {
    provider: "DeepSeek",
    agents: [{ agent: "DeepSeekBot", category: AI_CRAWLER_CATEGORY.TRAINING }]
  },
  {
    provider: "Cohere",
    agents: [
      { agent: "cohere-ai", category: AI_CRAWLER_CATEGORY.TRAINING },
      {
        agent: "cohere-training-data-crawler",
        category: AI_CRAWLER_CATEGORY.TRAINING
      }
    ]
  },
  {
    provider: "Allen AI",
    agents: [{ agent: "AI2Bot", category: AI_CRAWLER_CATEGORY.TRAINING }]
  },
  {
    provider: "You.com",
    agents: [{ agent: "YouBot", category: AI_CRAWLER_CATEGORY.SEARCH_INDEX }]
  },
  {
    provider: "Common Crawl",
    agents: [{ agent: "CCBot", category: AI_CRAWLER_CATEGORY.TRAINING }]
  }
];
var NORMALIZED_AGENTS = AI_CRAWLER_PROVIDERS.flatMap(
  (providerConfig) => providerConfig.agents.map((agentConfig) => ({
    ...agentConfig,
    provider: providerConfig.provider,
    needle: agentConfig.agent.toLowerCase()
  }))
);
var AI_CRAWLER_CANDIDATE_ALIASES = [
  {
    provider: "OpenAI",
    agent: "OpenAI",
    category: AI_CRAWLER_CATEGORY.AI_CRAWLER,
    aliases: ["openai", "chatgpt", "gptbot", "oai-", "oai_", "openai-search"]
  },
  {
    provider: "Anthropic",
    agent: "Anthropic",
    category: AI_CRAWLER_CATEGORY.AI_CRAWLER,
    aliases: ["anthropic", "claude"]
  },
  {
    provider: "Perplexity",
    agent: "Perplexity",
    category: AI_CRAWLER_CATEGORY.AI_CRAWLER,
    aliases: ["perplexity"]
  },
  {
    provider: "Google",
    agent: "Google",
    category: AI_CRAWLER_CATEGORY.SEARCH_INDEX,
    aliases: [
      "googlebot",
      "googleother",
      "google-extended",
      "google-inspection",
      "google-read-aloud",
      "google-notebooklm",
      "google-cloudvertex",
      "googleagent",
      "gemini"
    ]
  },
  {
    provider: "Microsoft",
    agent: "Microsoft",
    category: AI_CRAWLER_CATEGORY.SEARCH_INDEX,
    aliases: ["bingbot", "msnbot", "copilot"]
  },
  {
    provider: "Apple",
    agent: "Apple",
    category: AI_CRAWLER_CATEGORY.TRAINING,
    aliases: ["applebot"]
  },
  {
    provider: "Amazon",
    agent: "Amazon",
    category: AI_CRAWLER_CATEGORY.AI_CRAWLER,
    aliases: ["amazonbot", "amzn-searchbot", "amzn-user"]
  },
  {
    provider: "DuckDuckGo",
    agent: "DuckDuckGo",
    category: AI_CRAWLER_CATEGORY.AI_CRAWLER,
    aliases: ["duckassist", "duckassistbot"]
  },
  {
    provider: "xAI",
    agent: "xAI",
    category: AI_CRAWLER_CATEGORY.AI_CRAWLER,
    aliases: ["xai", "x-ai", "grok"]
  },
  {
    provider: "Meta",
    agent: "Meta",
    category: AI_CRAWLER_CATEGORY.AI_CRAWLER,
    aliases: ["meta-external", "facebookbot"]
  },
  {
    provider: "Mistral",
    agent: "Mistral",
    category: AI_CRAWLER_CATEGORY.AI_CRAWLER,
    aliases: ["mistralai", "mistral-ai", "mistral"]
  },
  {
    provider: "Moonshot AI",
    agent: "Moonshot AI",
    category: AI_CRAWLER_CATEGORY.AI_CRAWLER,
    aliases: ["kimi", "moonshot"]
  },
  {
    provider: "ByteDance",
    agent: "ByteDance",
    category: AI_CRAWLER_CATEGORY.TRAINING,
    aliases: ["bytespider", "doubaobot", "tiktokspider"]
  },
  {
    provider: "Baidu",
    agent: "Baidu",
    category: AI_CRAWLER_CATEGORY.SEARCH_INDEX,
    aliases: ["baiduspider", "erniebot", "yiyanbot"]
  },
  {
    provider: "Alibaba",
    agent: "Alibaba",
    category: AI_CRAWLER_CATEGORY.AI_CRAWLER,
    aliases: ["qwen", "tongyi", "aliyunbot"]
  },
  {
    provider: "Zhipu AI",
    agent: "Zhipu AI",
    category: AI_CRAWLER_CATEGORY.TRAINING,
    aliases: ["chatglm", "zhipu"]
  },
  {
    provider: "DeepSeek",
    agent: "DeepSeek",
    category: AI_CRAWLER_CATEGORY.TRAINING,
    aliases: ["deepseek"]
  },
  {
    provider: "Cohere",
    agent: "Cohere",
    category: AI_CRAWLER_CATEGORY.TRAINING,
    aliases: ["cohere"]
  },
  {
    provider: "Allen AI",
    agent: "Allen AI",
    category: AI_CRAWLER_CATEGORY.TRAINING,
    aliases: ["ai2bot", "allenai", "allen-ai"]
  },
  {
    provider: "You.com",
    agent: "You.com",
    category: AI_CRAWLER_CATEGORY.SEARCH_INDEX,
    aliases: ["youbot", "you.com"]
  },
  {
    provider: "Common Crawl",
    agent: "Common Crawl",
    category: AI_CRAWLER_CATEGORY.TRAINING,
    aliases: ["ccbot", "commoncrawl", "common-crawl"]
  }
];
var DEFAULT_IGNORED_PATH_PREFIXES = [
  "/api",
  "/_next",
  "/_nuxt",
  "/_astro",
  "/static",
  "/assets",
  "/public",
  "/images",
  "/img",
  "/fonts",
  "/favicon",
  "/build",
  "/dist",
  "/admin",
  "/webhook",
  "/webhooks",
  "/cdn-cgi",
  "/.well-known"
];
var DEFAULT_IGNORED_EXTENSIONS = [
  "avif",
  "bmp",
  "br",
  "cjs",
  "css",
  "csv",
  "eot",
  "gif",
  "gz",
  "ico",
  "jpeg",
  "jpg",
  "js",
  "json",
  "map",
  "mjs",
  "mov",
  "mp3",
  "mp4",
  "otf",
  "pdf",
  "png",
  "svg",
  "ttf",
  "txt",
  "wasm",
  "wav",
  "webm",
  "webmanifest",
  "webp",
  "woff",
  "woff2",
  "xml",
  "zip"
];
var CRAWLER_FACING_EXACT_PATHS = /* @__PURE__ */ new Set([
  "/robots.txt",
  "/llms.txt",
  "/llms-full.txt"
]);
function isCrawlerFacingResourcePath(pathname) {
  const normalizedPathname = normalizePathname(pathname);
  const lastSegment = normalizedPathname.split("/").pop() || "";
  return CRAWLER_FACING_EXACT_PATHS.has(normalizedPathname) || (normalizedPathname.startsWith("/sitemap/") || normalizedPathname.startsWith("/sitemaps/")) && lastSegment.endsWith(".xml") || lastSegment.includes("sitemap") && lastSegment.endsWith(".xml");
}
var STATIC_FETCH_DESTINATIONS = /* @__PURE__ */ new Set([
  "audio",
  "embed",
  "font",
  "image",
  "manifest",
  "object",
  "script",
  "style",
  "track",
  "video",
  "worker"
]);
function classifyAICrawlerUserAgent(userAgent) {
  if (!userAgent) return null;
  const normalizedUserAgent = userAgent.toLowerCase();
  const match = NORMALIZED_AGENTS.find(
    ({ needle }) => normalizedUserAgent.includes(needle)
  );
  if (match) {
    return {
      provider: match.provider,
      agent: match.agent,
      category: match.category
    };
  }
  const candidate = AI_CRAWLER_CANDIDATE_ALIASES.find(
    ({ aliases }) => aliases.some((alias) => normalizedUserAgent.includes(alias))
  );
  if (!candidate) return null;
  return {
    provider: candidate.provider,
    agent: candidate.agent,
    category: candidate.category
  };
}
function shouldTrackCrawlerCategory(crawler, config) {
  if ((config.includeSearchCrawlers === false || config.disableSearchCrawlers) && crawler.category === AI_CRAWLER_CATEGORY.SEARCH_INDEX) {
    return false;
  }
  if (config.disableAnswerFetch && crawler.category === AI_CRAWLER_CATEGORY.ANSWER_FETCH) {
    return false;
  }
  if (config.disableTrainingCrawlers && crawler.category === AI_CRAWLER_CATEGORY.TRAINING) {
    return false;
  }
  if (config.disableOtherCrawlers && crawler.category === AI_CRAWLER_CATEGORY.AI_CRAWLER) {
    return false;
  }
  return true;
}
function shouldTrackAICrawlerRequest(request, config) {
  if (config.enabled === false) {
    return { tracked: false, reason: "disabled" };
  }
  if (!config.websiteId) {
    return { tracked: false, reason: "missing_website_id" };
  }
  if (!shouldTrackMethod(request, config.methods)) {
    return { tracked: false, reason: "method_not_tracked" };
  }
  const crawler = classifyAICrawlerUserAgent(getHeader(request, "user-agent"));
  if (!crawler) {
    return { tracked: false, reason: "not_ai_crawler" };
  }
  if (!shouldTrackCrawlerCategory(crawler, config)) {
    if (crawler.category === AI_CRAWLER_CATEGORY.SEARCH_INDEX) {
      return { tracked: false, reason: "search_crawler_skipped", crawler };
    }
    return { tracked: false, reason: "category_skipped", crawler };
  }
  const url = getRequestUrl(request, config);
  if (!url || url.protocol !== "http:" && url.protocol !== "https:") {
    return { tracked: false, reason: "invalid_url", crawler };
  }
  if (url.href.length > (config.maxUrlLength || DEFAULT_MAX_URL_LENGTH)) {
    return { tracked: false, reason: "url_too_long", crawler };
  }
  if (STATIC_FETCH_DESTINATIONS.has(
    (getHeader(request, "sec-fetch-dest") || "").toLowerCase()
  )) {
    return { tracked: false, reason: "static_fetch_destination", crawler };
  }
  const pathname = normalizePathname(url.pathname);
  const isCrawlerFacingResource = isCrawlerFacingResourcePath(pathname);
  if (!isCrawlerFacingResource && getIgnoredPathPrefixes(config).some(
    (prefix) => pathStartsWith(pathname, prefix)
  )) {
    return { tracked: false, reason: "ignored_path_prefix", crawler };
  }
  if (!isCrawlerFacingResource && hasIgnoredExtension(pathname, getIgnoredExtensions(config))) {
    return { tracked: false, reason: "ignored_file_extension", crawler };
  }
  if (config.shouldTrackPath) {
    try {
      if (config.shouldTrackPath(url, crawler) === false) {
        return { tracked: false, reason: "path_rejected", crawler };
      }
    } catch {
      return { tracked: false, reason: "path_rejected", crawler };
    }
  }
  return { tracked: false, crawler, url };
}
function trackAICrawlerRequest(request, contextOrConfig, maybeConfig) {
  if (maybeConfig) {
    return trackAICrawlerRequestInBackground(
      request,
      contextOrConfig,
      maybeConfig
    );
  }
  return sendAICrawlerRequest(
    request,
    contextOrConfig
  );
}
function trackAICrawlerRequestInBackground(request, context, config) {
  const decision = shouldTrackAICrawlerRequest(request, config);
  if (!decision.crawler || !decision.url) {
    return decision;
  }
  const task = sendAICrawlerRequest(
    request,
    config,
    decision,
    getEventOptions(context)
  ).then(() => void 0);
  scheduleWaitUntil(context, task);
  return {
    tracked: false,
    scheduled: true,
    crawler: decision.crawler
  };
}
function trackAICrawlerResponse(request, response, contextOrConfig, maybeConfig) {
  const config = maybeConfig || contextOrConfig;
  const context = maybeConfig ? contextOrConfig : void 0;
  const eventContext = mergeEventOptions(context, { response });
  return trackAICrawlerRequestInBackground(request, eventContext, config);
}
function withAICrawlerTracking(handler, config) {
  return async function datafastAICrawlerHandler(request, ...args) {
    const response = await handler(request, ...args);
    trackAICrawlerResponse(
      request,
      response,
      findWaitUntilTarget(args),
      config
    );
    return response;
  };
}
function createAICrawlerMiddleware(config) {
  return function datafastAICrawlerMiddleware(request, context) {
    return trackAICrawlerRequestInBackground(request, context, config);
  };
}
function createExpressAICrawlerMiddleware(config) {
  return function datafastExpressAICrawlerMiddleware(req, res, next) {
    try {
      const request = createRequestFromNodeRequest(req);
      const decision = shouldTrackAICrawlerRequest(request, config);
      if (decision.crawler && decision.url) {
        const sendWithStatus = () => {
          void sendAICrawlerRequest(request, config, decision, {
            statusCode: normalizeStatusCode(res?.statusCode)
          });
        };
        if (typeof res?.once === "function") {
          res.once("finish", sendWithStatus);
        } else {
          sendWithStatus();
        }
      }
    } catch (error) {
      if (config.debug) {
        console.warn(
          "[DataFast] Failed to schedule AI crawler tracking",
          error
        );
      }
    } finally {
      if (typeof next === "function") next();
    }
  };
}
async function sendAICrawlerRequest(request, config, decision = shouldTrackAICrawlerRequest(request, config), options) {
  if (!decision.crawler || !decision.url) {
    return decision;
  }
  const userAgent = getHeader(request, "user-agent") || "";
  const referrer = getHeader(request, "referer") || getHeader(request, "referrer");
  const ip = getRequestIp(request, config);
  const statusCode = getStatusCode(options);
  const fetchImpl = config.fetch || (typeof fetch === "undefined" ? void 0 : fetch);
  if (!fetchImpl) {
    return {
      tracked: false,
      reason: "network_error",
      crawler: decision.crawler
    };
  }
  try {
    const response = await fetchWithTimeout(
      fetchImpl,
      config.apiUrl || DEFAULT_API_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...config.authToken ? { Authorization: `Bearer ${config.authToken}` } : {}
        },
        keepalive: true,
        body: JSON.stringify({
          websiteId: config.websiteId,
          domain: config.domain || decision.url.hostname,
          href: decision.url.href,
          referrer: referrer || null,
          ai: {
            provider: decision.crawler.provider,
            agent: decision.crawler.agent,
            category: decision.crawler.category,
            userAgent,
            ip,
            ...statusCode !== null ? { statusCode } : {},
            source: "server_middleware"
          }
        })
      },
      config.timeoutMs || DEFAULT_TIMEOUT_MS
    );
    return {
      tracked: response.ok,
      reason: response.ok ? void 0 : "api_error",
      crawler: decision.crawler,
      status: response.status
    };
  } catch (error) {
    if (config.debug) {
      console.warn("[DataFast] Failed to track AI crawler request", error);
    }
    return {
      tracked: false,
      reason: "network_error",
      crawler: decision.crawler
    };
  }
}
function getHeader(request, name) {
  return request.headers.get(name);
}
function getRequestIp(request, config) {
  const customIp = config.getIp?.(request);
  if (customIp) return normalizeIp(customIp);
  const headerIp = getHeader(request, "cf-connecting-ip") || getHeader(request, "x-real-ip") || getHeader(request, "true-client-ip") || getHeader(request, "fastly-client-ip") || getHeader(request, "fly-client-ip") || getHeader(request, "x-vercel-forwarded-for") || getHeader(request, "x-forwarded-for");
  return normalizeIp(headerIp);
}
function normalizeIp(value) {
  if (!value) return null;
  const first = value.split(",")[0]?.trim();
  if (!first) return null;
  if (first.startsWith("::ffff:")) {
    return first.slice("::ffff:".length);
  }
  return first;
}
function normalizeStatusCode(value) {
  if (typeof value !== "number") return null;
  if (!Number.isInteger(value) || value < 100 || value > 599) return null;
  return value;
}
function getStatusCode(options) {
  const responseStatusCode = options?.response && "statusCode" in options.response ? options.response.statusCode : void 0;
  return normalizeStatusCode(options?.statusCode) || normalizeStatusCode(options?.response?.status) || normalizeStatusCode(responseStatusCode);
}
function getEventOptions(context) {
  if (!context || typeof context === "function") return void 0;
  return {
    response: context.response,
    statusCode: context.statusCode
  };
}
function getRequestUrl(request, config) {
  try {
    const requestUrl = new URL(request.url);
    if (!config.publicOrigin) return requestUrl;
    const publicOrigin = new URL(config.publicOrigin);
    if (publicOrigin.protocol !== "http:" && publicOrigin.protocol !== "https:" || publicOrigin.username || publicOrigin.password) {
      return null;
    }
    const publicUrl = new URL(publicOrigin.origin);
    publicUrl.pathname = requestUrl.pathname;
    publicUrl.search = requestUrl.search;
    return publicUrl;
  } catch {
    return null;
  }
}
function shouldTrackMethod(request, methods) {
  const allowedMethods = methods || ["GET", "HEAD"];
  return allowedMethods.includes(request.method.toUpperCase());
}
function normalizePathname(pathname) {
  if (!pathname || pathname === "/") return "/";
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return normalized.replace(/\/{2,}/g, "/").toLowerCase();
}
function pathStartsWith(pathname, prefix) {
  const normalizedPrefix = normalizePathname(prefix);
  return pathname === normalizedPrefix || pathname.startsWith(`${normalizedPrefix}/`);
}
function getIgnoredPathPrefixes(config) {
  return config.ignoredPathPrefixes || [
    ...DEFAULT_IGNORED_PATH_PREFIXES,
    ...config.additionalIgnoredPathPrefixes || []
  ];
}
function getIgnoredExtensions(config) {
  const extensions = config.ignoredExtensions || [
    ...DEFAULT_IGNORED_EXTENSIONS,
    ...config.additionalIgnoredExtensions || []
  ];
  return new Set(
    extensions.map((extension) => extension.replace(/^\./, "").toLowerCase())
  );
}
function hasIgnoredExtension(pathname, extensions) {
  const lastSegment = pathname.split("/").pop() || "";
  const match = /\.([a-z0-9]+)$/i.exec(lastSegment);
  return Boolean(match && extensions.has(match[1].toLowerCase()));
}
async function fetchWithTimeout(fetchImpl, url, init, timeoutMs) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || typeof AbortController === "undefined") {
    return fetchImpl(url, init);
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, {
      ...init,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}
function mergeEventOptions(context, options) {
  if (typeof context === "function") {
    return { waitUntil: context, ...options };
  }
  const waitUntil = context && typeof context.waitUntil === "function" ? context.waitUntil.bind(context) : void 0;
  return { waitUntil, ...options };
}
function findWaitUntilTarget(args) {
  return args.find((arg) => {
    return typeof arg === "function" || Boolean(
      arg && typeof arg === "object" && "waitUntil" in arg && typeof arg.waitUntil === "function"
    );
  });
}
function scheduleWaitUntil(context, promise) {
  const safePromise = promise.catch(() => void 0);
  try {
    if (typeof context === "function") {
      context(safePromise);
      return;
    }
    if (context && typeof context.waitUntil === "function") {
      context.waitUntil(safePromise);
      return;
    }
  } catch {
  }
  void safePromise;
}
function createRequestFromNodeRequest(req) {
  const protocol = req.protocol || req.headers?.["x-forwarded-proto"] || (req.socket?.encrypted ? "https" : "http");
  const host = req.headers?.host || "localhost";
  const originalUrl = req.originalUrl || req.url || "/";
  const url = /^https?:\/\//i.test(originalUrl) ? originalUrl : `${protocol}://${host}${originalUrl}`;
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers || {})) {
    if (Array.isArray(value)) {
      headers.set(key, value.join(", "));
    } else if (typeof value === "string") {
      headers.set(key, value);
    }
  }
  return new Request(url, {
    method: req.method || "GET",
    headers
  });
}
export {
  AI_CRAWLER_CATEGORY,
  classifyAICrawlerUserAgent,
  createAICrawlerMiddleware,
  createExpressAICrawlerMiddleware,
  shouldTrackAICrawlerRequest,
  trackAICrawlerRequest,
  trackAICrawlerRequestInBackground,
  trackAICrawlerResponse,
  withAICrawlerTracking
};
