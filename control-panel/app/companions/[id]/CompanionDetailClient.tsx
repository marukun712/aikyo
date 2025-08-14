"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Companion, type RoomResult } from "@/@types";
import { deleteCompanion } from "@/lib/api";

interface CompanionDetailClientProps {
  companion: Companion;
  room: RoomResult;
}
export default function CompanionDetailClient({
  companion,
  room,
}: CompanionDetailClientProps) {
  const router = useRouter();
  const [logLines, setLogLines] = useState<string[]>([]);
  const [status, setStatus] = useState<"running" | "stopped" | "unknown">(
    "unknown"
  );
  const eventSourceRef = useRef<EventSource | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch(
        `/api/companion/health?COMPANION_ID=${encodeURIComponent(
          companion.id
        )}`,
        { method: "HEAD" }
      );
      if (res.ok) {
        setStatus("running");
      } else {
        setStatus("stopped");
      }
    } catch {
      setStatus("unknown");
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = () => {
    if (eventSourceRef.current) return;

    const es = new EventSource(
      `/api/companion?COMPANION_ID=${encodeURIComponent(companion.id)}`
    );
    eventSourceRef.current = es;

    es.onmessage = (e) => {
      setLogLines((prev) => [...prev, e.data]);
    };
    es.onerror = () => {
      console.error("SSE error or closed");
      es.close();
      eventSourceRef.current = null;
      setLogLines((prev) => [...prev, "— Stream closed"]);
      fetchStatus();
    };
  };

  const handleStop = async () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    try {
      const res = await fetch("/api/companion", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ COMPANION_ID: companion.id }),
      });
      if (!res.ok) {
        console.error("Stop failed:", await res.text());
      } else {
        setLogLines((prev) => [...prev, "Stopped container."]);
        setStatus("stopped");
      }
    } catch (err) {
      console.error("Error stopping container:", err);
      setStatus("unknown");
    }
  };

  const handleDelete = async () => {
    if (confirm(`${companion.name}を本当に削除しますか？`)) {
      try {
        await deleteCompanion(companion.id);
        router.push("/companions");
      } catch (err) {
        console.error("Failed to delete companion:", err);
      }
    }
  };

  return (
    <>
      <div>
        <Link href="/companions">
          <button className="small">← コンパニオン一覧に戻る</button>
        </Link>
      </div>

      <h2>{companion.name}</h2>
      <p>
        稼働状況:{" "}
        <span
          style={{
            color:
              status === "running"
                ? "green"
                : status === "stopped"
                ? "red"
                : "gray",
            fontWeight: "bold",
          }}
        >
          {status}
        </span>
      </p>

      <div className="grid">
        <article className="s6">
          <div className="padding">
            <img
              src={companion.icon}
              alt={`${companion.name}のアイコン`}
              className="round large"
            />
          </div>
          <div className="padding">
            <h6>基本情報</h6>
            <p>ID: {companion.id}</p>
            <p>
              作成日時: {new Date(companion.createdAt).toLocaleString("ja-JP")}
            </p>
            <p>
              更新日時: {new Date(companion.updatedAt).toLocaleString("ja-JP")}
            </p>
            {room && <p>所属部屋: {room.name}</p>}
          </div>
        </article>

        <article className="s6">
          <div className="padding">
            <h6>性格</h6>
            <p>{companion.personality}</p>

            <h6>ストーリー</h6>
            <p>{companion.story}</p>

            <h6>サンプル</h6>
            <p>{companion.sample}</p>
          </div>
        </article>
      </div>

      <div className="padding">
        <Link href={`/companions/edit?id=${companion.id}`}>
          <button>編集</button>
        </Link>
        <Link href={`/companions/move?id=${companion.id}`}>
          <button>移動</button>
        </Link>
        <button onClick={handleStart}>Deploy</button>
        <button onClick={handleStop}>Stop</button>
        <button onClick={handleDelete}>削除</button>
      </div>

      {logLines.length > 0 && (
        <div className="log-output padding">
          <h3>Logs</h3>
          <pre>
            {logLines.map((line, idx) => (
              <div key={idx}>{line}</div>
            ))}
          </pre>
        </div>
      )}
    </>
  );
}
