import { MCPClient } from "@mastra/mcp";

export const mcp = (url: string) => {
  return new MCPClient({
    servers: {
      BodyServer: {
        command: "npx",
        args: ["-y", "mcp-remote", url],
      },
    },
  });
};
