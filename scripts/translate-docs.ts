import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { glob } from "glob";

const LMSTUDIO_API_URL = "http://localhost:1234/v1/chat/completions";
const DOCS_DIR = join(process.cwd(), "docs", "src", "content", "docs");
const JA_DOCS_DIR = join(DOCS_DIR, "ja");

// Command line flags
const args = process.argv.slice(2);
const SKIP_EXISTING = args.includes("--skip-existing");
const DRY_RUN = args.includes("--dry-run");
const PRESERVE_CODE_BLOCKS = args.includes("--preserve-code-blocks");

interface TranslationResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface CodeBlockExtraction {
  text: string;
  codeBlocks: string[];
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

function extractCodeBlocks(text: string): CodeBlockExtraction {
  const codeBlocks: string[] = [];
  const placeholder = "<<<CODE_BLOCK_{}>>>";

  // Extract fenced code blocks (```...```)
  let processedText = text.replace(/```[\s\S]*?```/g, (match) => {
    const index = codeBlocks.length;
    codeBlocks.push(match);
    return placeholder.replace("{}", index.toString());
  });

  // Extract inline code (`...`)
  processedText = processedText.replace(/`[^`\n]+`/g, (match) => {
    const index = codeBlocks.length;
    codeBlocks.push(match);
    return placeholder.replace("{}", index.toString());
  });

  return {
    text: processedText,
    codeBlocks,
  };
}

function restoreCodeBlocks(text: string, codeBlocks: string[]): string {
  const placeholder = "<<<CODE_BLOCK_{}>>>";
  let restoredText = text;

  for (let i = 0; i < codeBlocks.length; i++) {
    const pattern = placeholder.replace("{}", i.toString());
    restoredText = restoredText.replace(pattern, codeBlocks[i]);
  }

  return restoredText;
}

async function translateFrontmatter(frontmatter: string): Promise<string> {
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

async function translateMarkdownFile(
  filePath: string,
  dryRun = false,
): Promise<void> {
  // Calculate output path by removing 'ja/' from the path
  const relativeToJa = relative(JA_DOCS_DIR, filePath);
  const outputPath = join(DOCS_DIR, relativeToJa);
  const relativePath = relative(DOCS_DIR, outputPath);

  console.log(`\nTranslating: ja/${relativeToJa} → ${relativePath}`);

  // Skip if output file already exists and --skip-existing is set
  if (SKIP_EXISTING && existsSync(outputPath)) {
    console.log("  ⊘ Skipped: File already exists");
    return;
  }

  if (dryRun) {
    console.log("  ⊙ Dry run: Would translate this file");
    return;
  }

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
  let translatedBody: string;

  if (PRESERVE_CODE_BLOCKS) {
    const { text: bodyWithoutCode, codeBlocks } = extractCodeBlocks(body);
    const translatedWithoutCode = await translateText(bodyWithoutCode);
    translatedBody = restoreCodeBlocks(translatedWithoutCode, codeBlocks);
  } else {
    translatedBody = await translateText(body);
  }

  translatedContent += translatedBody;

  // Ensure output directory exists
  const outputDir = dirname(outputPath);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Write to new file
  writeFileSync(outputPath, translatedContent, "utf-8");
  console.log(`  ✓ Saved: ${relativePath}`);
}

async function main() {
  console.log("Starting translation of markdown files...\n");
  console.log(`Japanese docs directory: ${JA_DOCS_DIR}`);
  console.log(`English docs directory: ${DOCS_DIR}`);
  console.log(
    `Flags: ${DRY_RUN ? "[DRY RUN] " : ""}${SKIP_EXISTING ? "[SKIP EXISTING] " : ""}${PRESERVE_CODE_BLOCKS ? "[PRESERVE CODE BLOCKS]" : ""}\n`,
  );

  // Find all .md and .mdx files in Japanese docs directory
  const pattern = join(JA_DOCS_DIR, "**/*.{md,mdx}");
  const files = await glob(pattern, {
    ignore: ["**/node_modules/**"],
  });

  console.log(
    `Found ${files.length} Japanese markdown file(s) to translate.\n`,
  );

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (let i = 0; i < files.length; i++) {
    console.log(`[${i + 1}/${files.length}]`);
    try {
      const outputPath = join(DOCS_DIR, relative(JA_DOCS_DIR, files[i]));
      if (SKIP_EXISTING && existsSync(outputPath)) {
        skipCount++;
      } else if (!DRY_RUN) {
        successCount++;
      }
      await translateMarkdownFile(files[i], DRY_RUN);
    } catch (error) {
      errorCount++;
      console.error(`  ✗ Failed to translate ${files[i]}:`, error);
      // Continue with next file instead of exiting
    }
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log("Translation Summary:");
  console.log(`  Total files: ${files.length}`);
  if (DRY_RUN) {
    console.log(`  Would translate: ${files.length - skipCount}`);
    if (skipCount > 0) {
      console.log(`  Would skip: ${skipCount}`);
    }
  } else {
    console.log(`  ✓ Successful: ${successCount}`);
    if (skipCount > 0) {
      console.log(`  ⊘ Skipped: ${skipCount}`);
    }
    if (errorCount > 0) {
      console.log(`  ✗ Failed: ${errorCount}`);
    }
  }
  console.log("=".repeat(50));

  if (errorCount > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
