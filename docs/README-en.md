# Starlight Starter Kit: Essential Guide

[![Built with Starlight](https://astro.badg.es/v2/built-with-starlight/tiny.svg)](https://starlight.astro.build)

```
npm create astro@latest -- --template starlight
```

> 🧑‍🚀 **Experienced Astro user?** Please delete this file. Enjoy your development!

## 🚀 Project Directory Structure

Within your Astro + Starlight project, you'll find the following directories and files:

```
.
├── public/               # Public assets directory
├── src/                  # Source code directory
│   ├── assets/           # Custom asset files
│   ├── content/          # Content directory
│   │   └── docs/         # Markdown documentation files
│   └── content.config.ts # Configuration file for content handling
├── astro.config.mjs      # Astro project configuration file
├── package.json          # Project dependency management file
└── tsconfig.json         # TypeScript compiler configuration file
```

Starlight searches for `.md` or `.mdx` files in the `src/content/docs/` directory. Each of these files is exposed as a route based on its filename.

Images should be placed in the `src/assets/` directory and can be referenced in Markdown content using relative links.

Static assets such as favicons should be stored in the `public/` directory for proper deployment.

## 🧞 Command Reference

All commands are executed from the project root directory via a terminal:

| Command                   | Function                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs all required dependencies                |
| `npm run dev`             | Starts the local development server at `localhost:4321` |
| `npm run build`           | Builds your production-ready site to `./dist/`    |
| `npm run preview`         | Previews your site locally before deployment       |
| `npm run astro ...`       | Executes CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Displays help information for the Astro CLI        |

## 👀 Want to Learn More?

Visit [Starlight's documentation](https://starlight.astro.build/), read the [official Astro documentation](https://docs.astro.build), or join the [Astro Discord community](https://astro.build/chat).