import { defineConfig } from "vitepress";

const hostname = "https://process-in-chunks.codecompose.dev";

export default defineConfig({
  title: "Process in Chunks",
  description:
    "Efficiently process large collections of data in manageable chunks with built-in error handling, throttling, and TypeScript support",
  base: "/",
  cleanUrls: true,

  sitemap: {
    hostname,
  },

  transformHead({ pageData }) {
    const canonicalUrl = `${hostname}/${pageData.relativePath}`
      .replace(/index\.md$/, "")
      .replace(/\.md$/, "");

    return [["link", { rel: "canonical", href: canonicalUrl }]];
  },

  themeConfig: {
    sidebar: [
      {
        text: "Guide",
        items: [
          { text: "Introduction", link: "/" },
          { text: "Getting Started", link: "/getting-started" },
          { text: "Usage", link: "/usage" },
        ],
      },
      {
        text: "Reference",
        items: [{ text: "API", link: "/api" }],
      },
    ],

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/0x80/process-in-chunks",
      },
    ],
  },
});
