import { MCPClient } from "@mastra/mcp";

export const mcp = () => {
  return new MCPClient({
    servers: {
      RegistryServer: {
        command: "npx",
        args: ["-y", "mcp-remote", `http://localhost:3000/mcp`],
      },
    },
  });
};
