import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname, basename, relative } from "node:path";
import { glob } from "glob";

const LMSTUDIO_API_URL = "http://localhost:1234/v1/chat/completions";
const DOCS_DIR = join(process.cwd(), "docs");

interface TranslationResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

async function translateText(text: string): Promise<string> {
  const prompt = `<|plamo:op|>dataset
translation
<|plamo:op|>input lang=Japanese
${text}
<|plamo:op|>output lang=English`;

  try {
    const response = await fetch(LMSTUDIO_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "plamo-2-translate",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = (await response.json()) as TranslationResponse;
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Translation error:", error);
    throw error;
  }
}

function parseFrontmatter(content: string): {
  frontmatter: string | null;
  body: string;
} {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (match) {
    return {
      frontmatter: match[1],
      body: match[2],
    };
  }

  return {
    frontmatter: null,
    body: content,
  };
}

async function translateFrontmatter(
  frontmatter: string,
): Promise<string> {
  const lines = frontmatter.split("\n");
  const translatedLines: string[] = [];

  for (const line of lines) {
    const titleMatch = line.match(/^title:\s*(.+)$/);
    const descMatch = line.match(/^description:\s*(.+)$/);

    if (titleMatch) {
      const translatedTitle = await translateText(titleMatch[1]);
      translatedLines.push(`title: ${translatedTitle}`);
    } else if (descMatch) {
      const translatedDesc = await translateText(descMatch[1]);
      translatedLines.push(`description: ${translatedDesc}`);
    } else {
      translatedLines.push(line);
    }
  }

  return translatedLines.join("\n");
}

async function translateMarkdownFile(filePath: string): Promise<void> {
  const relativePath = relative(DOCS_DIR, filePath);
  console.log(`\nTranslating: ${relativePath}`);

  const content = readFileSync(filePath, "utf-8");
  const { frontmatter, body } = parseFrontmatter(content);

  let translatedContent = "";

  // Translate frontmatter if exists
  if (frontmatter) {
    console.log("  - Translating frontmatter...");
    const translatedFrontmatter = await translateFrontmatter(frontmatter);
    translatedContent += `---\n${translatedFrontmatter}\n---\n`;
  }

  // Translate body
  console.log("  - Translating body...");
  const translatedBody = await translateText(body);
  translatedContent += translatedBody;

  // Write to new file
  const dir = dirname(filePath);
  const base = basename(filePath, ".md");
  const outputPath = join(dir, `${base}-en.md`);

  writeFileSync(outputPath, translatedContent, "utf-8");
  console.log(`  ✓ Saved: ${relative(DOCS_DIR, outputPath)}`);
}

async function main() {
  console.log("Starting translation of markdown files...\n");
  console.log(`Docs directory: ${DOCS_DIR}\n`);

  // Find all .md files in docs directory
  const pattern = join(DOCS_DIR, "**/*.md");
  const files = await glob(pattern, {
    ignore: ["**/node_modules/**", "**/*-en.md"],
  });

  console.log(`Found ${files.length} markdown file(s) to translate.\n`);

  for (let i = 0; i < files.length; i++) {
    console.log(`[${i + 1}/${files.length}]`);
    try {
      await translateMarkdownFile(files[i]);
    } catch (error) {
      console.error(`Failed to translate ${files[i]}:`, error);
      process.exit(1);
    }
  }

  console.log("\n✓ All translations completed!");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
