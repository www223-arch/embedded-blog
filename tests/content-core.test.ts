import assert from "node:assert/strict";
import test from "node:test";
import { parseMarkdownSource, stringifyMarkdownSource } from "../src/content-core/frontmatter.ts";
import { renderMarkdown } from "../src/content-core/markdown.ts";
import * as markdownCore from "../src/content-core/markdown.ts";
import { shouldIncludeContent } from "../src/content-core/model.ts";
import { projectSchema } from "../src/content/schema.ts";

test("frontmatter supports nested YAML and round trips without losing the body", () => {
  const source = `---
title: "Gateway: notes"
tags:
  - ESP32
links:
  - label: Repository
    href: https://example.com/repo
status: draft
---

# Body
`;
  const parsed = parseMarkdownSource(source);

  assert.equal(parsed.frontmatter.title, "Gateway: notes");
  assert.deepEqual(parsed.frontmatter.tags, ["ESP32"]);
  assert.deepEqual(parsed.frontmatter.links, [{ label: "Repository", href: "https://example.com/repo" }]);
  assert.equal(parsed.markdown, "\n# Body\n");

  const roundTrip = parseMarkdownSource(stringifyMarkdownSource(parsed.frontmatter, parsed.markdown));
  assert.deepEqual(roundTrip.frontmatter, parsed.frontmatter);
  assert.equal(roundTrip.markdown.trim(), "# Body");
});

test("content visibility keeps drafts local and published content deployable", () => {
  assert.equal(shouldIncludeContent("draft", "preview"), true);
  assert.equal(shouldIncludeContent("draft", "production"), false);
  assert.equal(shouldIncludeContent("published", "production"), true);
  assert.equal(shouldIncludeContent("archived", "preview"), false);
  assert.equal(shouldIncludeContent("archived", "production"), false);
});

test("project presentation fields default to the ordinary project experience", () => {
  const project = projectSchema.parse({
    id: "plain-project",
    title: "Plain Project",
    summary: "A project without presentation metadata.",
    stack: [],
    highlights: [],
    gallery: [],
    links: [],
    status: "draft",
    projectStage: "building"
  });

  assert.equal(project.presentation, "standard");
  assert.equal(project.narrative, "chronicle");
  assert.equal(project.visualPreset, "orbit");
  assert.equal(project.updatedAt, "");
  assert.equal(project.currentFocus, "");
  assert.deepEqual(project.narrativeBlocks, []);
});

test("blank project presentation metadata uses ordinary defaults", () => {
  const project = projectSchema.parse({
    id: "legacy-project",
    title: "Legacy Project",
    summary: "A project written before presentation metadata.",
    stack: [],
    highlights: [],
    gallery: [],
    links: [],
    status: "published",
    projectStage: "completed",
    presentation: "",
    narrative: "",
    visualPreset: ""
  });

  assert.equal(project.presentation, "standard");
  assert.equal(project.narrative, "chronicle");
  assert.equal(project.visualPreset, "orbit");
});

test("project presentation rejects unsupported visual presets", () => {
  assert.throws(() =>
    projectSchema.parse({
      id: "invalid-project",
      title: "Invalid Project",
      summary: "A project with an invalid visual preset.",
      stack: [],
      highlights: [],
      gallery: [],
      links: [],
      status: "draft",
      projectStage: "building",
      visualPreset: "planet"
    })
  );
});

test("narrative blocks preserve source order and safe media", () => {
  const parseNarrativeBlocks = getNarrativeParser();
  const blocks = parseNarrativeBlocks(
    [
      "```milestone",
      "date: 2026-07-28",
      "title: Diff preview",
      "status: current",
      "media: /images/projects/content-studio/diff.gif",
      "```",
      "Saved work.",
      "",
      "```question",
      "title: Open question",
      "state: open",
      "```",
      "How much structure is enough?",
      "",
      "```next",
      "title: Next step",
      "```",
      "Build the chapter rail."
    ].join("\n")
  );

  assert.deepEqual(blocks.map((block) => block.type), ["milestone", "question", "next"]);
  assert.deepEqual(blocks[0], {
    type: "milestone",
    date: "2026-07-28",
    title: "Diff preview",
    status: "current",
    media: "/images/projects/content-studio/diff.gif",
    body: "Saved work."
  });
  assert.deepEqual(blocks[1], {
    type: "question",
    title: "Open question",
    state: "open",
    body: "How much structure is enough?"
  });
  assert.deepEqual(blocks[2], {
    type: "next",
    title: "Next step",
    body: "Build the chapter rail."
  });
});

test("narrative blocks reject unsafe media and malformed metadata", () => {
  const parseNarrativeBlocks = getNarrativeParser();
  const blocks = parseNarrativeBlocks(
    [
      "```milestone",
      "title: Unsafe",
      "status: unexpected",
      "media: /images/../secret.gif",
      "```",
      "This block stays readable.",
      "",
      "```question",
      "title: [",
      "```",
      "Broken metadata is ignored."
    ].join("\n")
  );

  assert.deepEqual(blocks, [
    {
      type: "milestone",
      date: "",
      title: "Unsafe",
      status: "past",
      media: "",
      body: "This block stays readable."
    }
  ]);
});

test("markdown renders narrative fences as semantic rich blocks", () => {
  const rendered = renderMarkdown(
    [
      "```milestone",
      "date: 2026-07-28",
      "title: Diff preview",
      "status: current",
      "media: /images/projects/content-studio/diff.gif",
      "```",
      "Saved work.",
      "",
      "```question",
      "title: Open question",
      "state: open",
      "```",
      "How much structure is enough?",
      "",
      "```next",
      "title: Next step",
      "```",
      "Build the chapter rail."
    ].join("\n")
  );

  assert.match(rendered.html, /data-narrative-type="milestone"/);
  assert.match(rendered.html, /data-narrative-status="current"/);
  assert.match(rendered.html, /data-narrative-type="question"/);
  assert.match(rendered.html, /data-narrative-state="open"/);
  assert.match(rendered.html, /data-narrative-type="next"/);
  assert.match(rendered.html, /Saved work\./);
});

type TestNarrativeBlock = {
  type: string;
  date?: string;
  title: string;
  status?: string;
  state?: string;
  media?: string;
  body: string;
};

function getNarrativeParser(): (markdown: string) => TestNarrativeBlock[] {
  const parser = (markdownCore as { parseNarrativeBlocks?: unknown }).parseNarrativeBlocks;
  assert.equal(typeof parser, "function");
  return parser as (markdown: string) => TestNarrativeBlock[];
}

test("markdown rendering produces outline, tables, resolved assets, and safe code", () => {
  const rendered = renderMarkdown(
    `# Overview

## Details

| Key | Value |
| --- | --- |
| Mode | Draft |

![Board](/images/board.png)

\`\`\`html
<script>alert("no")</script>
\`\`\`
`,
    { resolveAssetPath: (value) => `/embedded-blog${value}` }
  );

  assert.deepEqual(
    rendered.toc.map(({ text, level }) => ({ text, level })),
    [
      { text: "Overview", level: 2 },
      { text: "Details", level: 3 }
    ]
  );
  assert.match(rendered.html, /class="doc-table-wrap"/);
  assert.match(rendered.html, /src="\/embedded-blog\/images\/board\.png"/);
  assert.match(rendered.html, /class="doc-code-copy"/);
  assert.doesNotMatch(rendered.html, /<script>alert/);
  assert.match(rendered.html, /&lt;script&gt;/);
});

test("rich blocks accept local assets and reject traversal", () => {
  const rendered = renderMarkdown(`\`\`\`video
src: /videos/demo.mp4
poster: /images/demo.jpg
caption: Bench demo
\`\`\`

\`\`\`gallery
columns: 3
images:
  - src: /images/one.jpg
    alt: One
\`\`\`

\`\`\`callout
type: tip
title: Note
content: Use <safe> values.
\`\`\`

\`\`\`demo
src: /demos/pid/index.html
title: PID tuner
height: 640
\`\`\`

\`\`\`video
src: /videos/../secret.mp4
\`\`\`
`);

  assert.match(rendered.html, /class="doc-rich-block doc-video"/);
  assert.match(rendered.html, /class="doc-rich-block doc-gallery"/);
  assert.match(rendered.html, /class="doc-rich-block doc-callout callout-tip"/);
  assert.match(rendered.html, /Use &lt;safe&gt; values\./);
  assert.match(rendered.html, /sandbox="allow-scripts allow-same-origin"/);
  assert.match(rendered.html, /rich-error/);
  assert.doesNotMatch(rendered.html, /secret\.mp4/);
});
