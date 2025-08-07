import WebSocket from "ws";
import { AgentImpl } from "../agents/agent.ts";

type Session = { agent: AgentImpl; ws: WebSocket[] };

interface SessionManager {
  sessions: Map<string, Session>;
  addSession: (sessionId: string, agent: AgentImpl) => void;
  connectWebSocket: (sessionId: string, ws: WebSocket) => void;
  getSession: (sessionId: string) => Session | null;
  getAgent: (sessionId: string) => AgentImpl | null;
  sendMessage: (sessionId: string, message: string) => void;
}

export class SessionManagerImpl implements SessionManager {
  sessions: Map<string, Session>;

  constructor() {
    this.sessions = new Map<string, { agent: AgentImpl; ws: WebSocket[] }>();
  }

  addSession(sessionId: string, agent: AgentImpl) {
    this.sessions.set(sessionId, { agent, ws: [] });
  }

  getSession(sessionId: string) {
    return this.sessions.get(sessionId) ?? null;
  }

  getAgent(sessionId: string) {
    return this.sessions.get(sessionId)?.agent ?? null;
  }

  connectWebSocket(sessionId: string, WebSocket: WebSocket) {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error("セッションが見つかりません。");
    }
    session.ws.push(WebSocket);
  }

  sendMessage(sessionId: string, message: string) {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error("セッションが見つかりません。");
    }

    const clients = session.ws;
    clients.map((client) => {
      client.send(message);
    });
  }
}
