import { existsSync, readFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const origin = "https://mcguireslawnandlandscaping.com";
const pages = [
  { file: "index.html", url: `${origin}/` },
  { file: "lawn-care/index.html", url: `${origin}/lawn-care/` }
];
const errors = [];

function decodeEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#(?:x27|39);/gi, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function attributes(tag) {
  const result = {};
  for (const match of tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs)) {
    result[match[1].toLowerCase()] = decodeEntities(match[3]);
  }
  return result;
}

function tags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi"))].map((match) => ({
    raw: match[0],
    attrs: attributes(match[0])
  }));
}

function textBetween(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`, "gi"))]
    .map((match) => decodeEntities(match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()));
}

function localFileForUrl(url) {
  const pathname = decodeURIComponent(url.pathname);
  if (pathname.endsWith("/")) return `${pathname.slice(1)}index.html`;
  return pathname.slice(1);
}

function addError(file, message) {
  errors.push(`${file}: ${message}`);
}

const pageData = new Map();
const titles = new Map();
const descriptions = new Map();

for (const page of pages) {
  const absoluteFile = resolve(root, page.file);
  const html = readFileSync(absoluteFile, "utf8");
  const title = textBetween(html, "title")[0] ?? "";
  const h1s = textBetween(html, "h1");
  const meta = tags(html, "meta").map(({ attrs }) => attrs);
  const links = tags(html, "link").map(({ attrs }) => attrs);
  const description = meta.find((item) => item.name?.toLowerCase() === "description")?.content ?? "";
  const robots = meta.find((item) => item.name?.toLowerCase() === "robots")?.content ?? "";
  const canonical = links.find((item) => item.rel?.toLowerCase() === "canonical")?.href ?? "";
  const ids = new Set([...html.matchAll(/\bid\s*=\s*(["'])(.*?)\1/gs)].map((match) => match[2]));

  pageData.set(page.file, { html, ids });

  if (!title) addError(page.file, "missing title");
  if (title.length < 25 || title.length > 60) addError(page.file, `title length is ${title.length}; expected 25–60`);
  if (!description) addError(page.file, "missing meta description");
  if (description.length < 120 || description.length > 170) addError(page.file, `description length is ${description.length}; expected 120–170`);
  if (h1s.length !== 1) addError(page.file, `expected exactly one h1, found ${h1s.length}`);
  if (canonical !== page.url) addError(page.file, `canonical is ${canonical || "missing"}; expected ${page.url}`);
  if (!/max-image-preview\s*:\s*large/i.test(robots)) addError(page.file, "robots meta does not allow large image previews");
  if (meta.some((item) => item.name?.toLowerCase() === "keywords")) addError(page.file, "obsolete meta keywords tag is present");

  for (const property of ["og:title", "og:description", "og:image", "og:image:alt", "og:url", "og:type", "og:site_name"]) {
    if (!meta.some((item) => item.property?.toLowerCase() === property)) addError(page.file, `missing ${property}`);
  }
  for (const name of ["twitter:card", "twitter:title", "twitter:description", "twitter:image", "twitter:image:alt"]) {
    if (!meta.some((item) => item.name?.toLowerCase() === name)) addError(page.file, `missing ${name}`);
  }

  const jsonLdBlocks = [...html.matchAll(/<script\b[^>]*type\s*=\s*(["'])application\/ld\+json\1[^>]*>([\s\S]*?)<\/script>/gi)];
  if (jsonLdBlocks.length === 0) addError(page.file, "missing JSON-LD structured data");
  for (const [, , json] of jsonLdBlocks) {
    try {
      JSON.parse(json);
    } catch (error) {
      addError(page.file, `invalid JSON-LD: ${error.message}`);
    }
  }

  for (const { attrs } of tags(html, "img")) {
    if (!("alt" in attrs)) addError(page.file, `image ${attrs.src || "without src"} is missing alt text`);
    if (!attrs.width || !attrs.height) addError(page.file, `image ${attrs.src || "without src"} is missing width or height`);
    const candidates = [attrs.src, ...(attrs.srcset ?? "").split(",").map((item) => item.trim().split(/\s+/)[0])].filter(Boolean);
    for (const candidate of candidates) {
      const resolvedUrl = new URL(candidate, page.url);
      if (resolvedUrl.origin !== origin) continue;
      const file = localFileForUrl(resolvedUrl);
      if (!existsSync(resolve(root, file))) addError(page.file, `missing image asset ${file}`);
    }
  }

  for (const { attrs } of tags(html, "a")) {
    const href = attrs.href;
    if (!href || /^(?:mailto:|tel:|javascript:)/i.test(href)) continue;
    const resolvedUrl = new URL(href, page.url);
    if (resolvedUrl.origin !== origin) continue;
    const targetFile = localFileForUrl(resolvedUrl);
    const targetPath = resolve(root, targetFile);
    if (!existsSync(targetPath)) {
      addError(page.file, `broken internal link ${href} (missing ${targetFile})`);
      continue;
    }
    if (resolvedUrl.hash && extname(targetFile) === ".html") {
      const targetHtml = readFileSync(targetPath, "utf8");
      const targetIds = new Set([...targetHtml.matchAll(/\bid\s*=\s*(["'])(.*?)\1/gs)].map((match) => match[2]));
      const targetId = decodeURIComponent(resolvedUrl.hash.slice(1));
      if (targetId && !targetIds.has(targetId)) addError(page.file, `broken fragment link ${href}`);
    }
  }

  if (titles.has(title)) addError(page.file, `duplicate title also used by ${titles.get(title)}`);
  else titles.set(title, page.file);
  if (descriptions.has(description)) addError(page.file, `duplicate description also used by ${descriptions.get(description)}`);
  else descriptions.set(description, page.file);
}

const sitemap = readFileSync(resolve(root, "sitemap.xml"), "utf8");
const sitemapUrls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
for (const page of pages) {
  if (!sitemapUrls.includes(page.url)) addError("sitemap.xml", `missing canonical URL ${page.url}`);
}
for (const url of sitemapUrls) {
  if (!pages.some((page) => page.url === url)) addError("sitemap.xml", `unexpected or noncanonical URL ${url}`);
}
if ((sitemap.match(/<lastmod>/g) ?? []).length !== pages.length) addError("sitemap.xml", "each URL must have an accurate lastmod value");

const robotsTxt = readFileSync(resolve(root, "robots.txt"), "utf8");
if (!robotsTxt.includes(`Sitemap: ${origin}/sitemap.xml`)) addError("robots.txt", "missing absolute sitemap declaration");

for (const image of ["hero.webp", "newlogo.webp", "work1.webp", "work2.webp", "work3.webp", "work4.webp", "work5.webp", "work6.webp"]) {
  const data = readFileSync(resolve(root, "images", image));
  if (data.subarray(0, 4).toString("ascii") !== "RIFF" || data.subarray(8, 12).toString("ascii") !== "WEBP") {
    addError(`images/${image}`, "file extension is .webp but file content is not WebP");
  }
}

if (errors.length) {
  console.error(`SEO validation failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}:`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`SEO validation passed for ${pages.length} pages: unique metadata, crawl directives, canonical URLs, structured data, internal links, images, robots.txt, and sitemap.xml.`);
