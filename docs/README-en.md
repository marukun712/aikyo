# Starlight Starter Kit: Fundamentals

[![Built with Starlight](https://astro.badg.es/v2/built-with-starlight/tiny.svg)](https://starlight.astro.build)

```
npm create astro@latest -- --template starlight
```

> 🧑‍🚀 **Experienced Astro user?** Delete this file. Enjoy your development!

## 🚀 Project Structure

Within your Astro + Starlight project, you'll find the following directories and files:

```
.
├── public/
├── src/
│   ├── assets/
│   ├── content/
│   │   └── docs/
│   └── content.config.ts
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

Starlight searches for `.md` or `.mdx` files in the `src/content/docs/` directory. Each file is automatically exposed as a route based on its filename.

Images should be placed in the `src/assets/` folder and referenced in Markdown using relative links.

Static assets such as favicons can be stored in the `public/` directory.

## 🧞 Command Reference

All commands are executed from the project root directory via a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs all required dependencies               |
| `npm run dev`             | Starts the local development server at `localhost:4321`      |
| `npm run build`           | Builds your production site and outputs to `./dist/`          |
| `npm run preview`         | Previews your site locally before deployment     |
| `npm run astro ...`       | Executes CLI commands like `astro add`, `astro check`, etc. |
| `npm run astro -- --help` | Obtain help documentation for the Astro CLI      |

## 👀 Want to dive deeper?

Visit [Starlight's official documentation](https://starlight.astro.build/), explore the [Astro documentation](https://docs.astro.build), or join the active community on the [Astro Discord server](https://astro.build/chat).