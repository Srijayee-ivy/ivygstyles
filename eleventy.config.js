const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const MarkdownIt = require("markdown-it");
const md = new MarkdownIt({ html: false, linkify: true });

const ROOT = process.cwd();
const CONTENT = path.join(ROOT, "content");

// --- helpers -------------------------------------------------------------

function readJSON(relPath) {
  const full = path.join(CONTENT, relPath);
  if (!fs.existsSync(full)) {
    console.warn(`[eleventy] Missing content file: content/${relPath} — using empty object.`);
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(full, "utf8"));
  } catch (e) {
    console.warn(`[eleventy] Could not parse content/${relPath}:`, e.message);
    return {};
  }
}

function readFolder(folderName) {
  const dir = path.join(CONTENT, folderName);
  if (!fs.existsSync(dir)) {
    console.warn(`[eleventy] Missing content folder: content/${folderName}`);
    return [];
  }
  return fs
    .readdirSync(dir)
    .filter(f => f.endsWith(".md"))
    .map(f => {
      const raw = fs.readFileSync(path.join(dir, f), "utf8");
      const parsed = matter(raw);
      return {
        ...parsed.data,
        slug: f.replace(/\.md$/, ""),
        body: parsed.content.trim()
      };
    });
}

// --- config ----------------------------------------------------------------

module.exports = function (eleventyConfig) {
  // Singleton page-copy files -> global data (e.g. `home.eyebrow` in templates)
  eleventyConfig.addGlobalData("home", () => readJSON("pages/home.json"));
  eleventyConfig.addGlobalData("about", () => readJSON("pages/about.json"));
  eleventyConfig.addGlobalData("mediaKit", () => readJSON("pages/media-kit.json"));
  eleventyConfig.addGlobalData("contact", () => readJSON("pages/contact.json"));
  eleventyConfig.addGlobalData("connect", () => readJSON("pages/connect.json"));
  eleventyConfig.addGlobalData("styling", () => readJSON("pages/styling.json"));
  eleventyConfig.addGlobalData("clientWork", () => readJSON("pages/client-work.json"));
  eleventyConfig.addGlobalData("services", () => readJSON("pages/services.json"));
  eleventyConfig.addGlobalData("editorsDesk", () => readJSON("pages/editors-desk.json"));
  eleventyConfig.addGlobalData("booking", () => readJSON("pages/booking.json"));
  eleventyConfig.addGlobalData("social", () => readJSON("settings/social.json"));

  // Folder collections
  eleventyConfig.addCollection("caseStudies", () => {
    return readFolder("case-studies").sort((a, b) => (a.order || 0) - (b.order || 0));
  });

  eleventyConfig.addCollection("looks", () => {
    return readFolder("looks").sort((a, b) => (a.order || 0) - (b.order || 0));
  });

  eleventyConfig.addCollection("testimonials", () => {
    return readFolder("testimonials").sort((a, b) => (a.order || 0) - (b.order || 0));
  });

  eleventyConfig.addCollection("trendReports", () => {
    return readFolder("trend-reports").sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  });

  eleventyConfig.addCollection("luxuryAnalyses", () => {
    return readFolder("luxury-analyses").sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  });

  eleventyConfig.addCollection("writingSamples", () => {
    return readFolder("writing-samples")
      .map(w => ({ ...w, contentHtml: md.render(w.body || "") }))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  });

  // Search index: built in JS (not in-template) so values are correctly JSON-escaped
  eleventyConfig.addGlobalData("searchIndex", () => {
    const home = readJSON("pages/home.json");
    const about = readJSON("pages/about.json");
    const services = readJSON("pages/services.json");
    const styling = readJSON("pages/styling.json");
    const clientWork = readJSON("pages/client-work.json");
    const editorsDesk = readJSON("pages/editors-desk.json");
    const connect = readJSON("pages/connect.json");
    const contact = readJSON("pages/contact.json");

    const pages = [
      { title: "Home", url: "/", excerpt: home.subtext || "", category: "Page" },
      { title: "About", url: "/about.html", excerpt: [about.heading_main, about.heading_emphasis].filter(Boolean).join(" "), category: "Page" },
      { title: "Services", url: "/services.html", excerpt: services.subtext || "", category: "Page" },
      { title: "Styling", url: "/styling.html", excerpt: styling.subtext || "", category: "Page" },
      { title: "Client Work", url: "/client-work.html", excerpt: clientWork.heading || "", category: "Page" },
      { title: "Editor's Desk", url: "/editors-desk.html", excerpt: editorsDesk.heading || "", category: "Page" },
      { title: "Connect", url: "/connect.html", excerpt: connect.subtext || "", category: "Page" },
      { title: "Contact", url: "/contact.html", excerpt: contact.subtext || "", category: "Page" }
    ];

    const caseStudyEntries = readFolder("case-studies").map(c => ({
      title: `${c.client}: ${c.title}`,
      url: `/client-work/${c.slug}/`,
      excerpt: c.description || "",
      category: "Client Work"
    }));

    const postEntries = readFolder("posts").map(p => ({
      title: p.title || "Untitled",
      url: `/blog/${p.slug}/`,
      excerpt: p.excerpt || "",
      category: p.category || "Journal"
    }));

    const trendReportEntries = readFolder("trend-reports").map(t => ({
      title: t.title || "Untitled",
      url: `/trend-reports/${t.slug}/`,
      excerpt: t.summary || "",
      category: "Trend Report"
    }));

    const luxuryAnalysisEntries = readFolder("luxury-analyses").map(l => ({
      title: l.title || "Untitled",
      url: `/luxury-brand-analysis/${l.slug}/`,
      excerpt: l.overview || "",
      category: "Luxury Brand Analysis"
    }));

    const writingSampleEntries = readFolder("writing-samples").map(w => ({
      title: w.title || "Untitled",
      url: `/writing-samples/${w.slug}/`,
      excerpt: w.excerpt || "",
      category: "Writing Sample"
    }));

    const servicesEntry = [{ title: "Book a Consultation", url: "/book.html", excerpt: "Schedule a discovery call or styling session.", category: "Page" }];

    return [...pages, ...servicesEntry, ...caseStudyEntries, ...postEntries, ...trendReportEntries, ...luxuryAnalysisEntries, ...writingSampleEntries];
  });

  eleventyConfig.addCollection("posts", () => {
    return readFolder("posts")
      .map(p => ({ ...p, contentHtml: md.render(p.body || "") }))
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  });

  // Static assets that live outside the Eleventy input dir but must be served as-is
  eleventyConfig.addPassthroughCopy({ "content/images": "content/images" });
  eleventyConfig.addPassthroughCopy({ "admin": "admin" });
  eleventyConfig.addPassthroughCopy({ "robots.txt": "robots.txt" });
  eleventyConfig.addPassthroughCopy({ "static/blog-post-redirect.html": "blog/post.html" });
  eleventyConfig.addPassthroughCopy({ "static/favicon.ico": "favicon.ico" });
  eleventyConfig.addPassthroughCopy({ "static/favicon-32x32.png": "favicon-32x32.png" });
  eleventyConfig.addPassthroughCopy({ "static/favicon-16x16.png": "favicon-16x16.png" });
  eleventyConfig.addPassthroughCopy({ "static/apple-touch-icon.png": "apple-touch-icon.png" });

  eleventyConfig.addFilter("dateFormat", (dateObj) => {
    if (!dateObj) return "";
    const d = new Date(dateObj);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  });

  eleventyConfig.addFilter("isoDate", (dateObj) => {
    if (!dateObj) return "";
    const d = new Date(dateObj);
    if (isNaN(d)) return "";
    return d.toISOString().slice(0, 10);
  });

  eleventyConfig.addFilter("limit", (arr, n) => (arr || []).slice(0, n));
  eleventyConfig.addFilter("onlyFeatured", (arr) => (arr || []).filter(x => !!x.featured));

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes"
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};
