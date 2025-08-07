import { MCPClient } from "@mastra/mcp";

export const mcp = (id: string, url: string) => {
  return new MCPClient({
    servers: {
      vccp: {
        command: "npx",
        args: ["-y", "mcp-remote", url],
      },
    },
    id,
  });
};
