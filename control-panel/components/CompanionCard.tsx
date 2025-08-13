"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { type Companion } from "@/@types";

interface CompanionCardProps {
  companion: Companion;
  onDelete: (id: string) => void;
}

export default function CompanionCard({
  companion,
  onDelete,
}: CompanionCardProps) {
  const [status, setStatus] = useState<"running" | "stopped" | "unknown">(
    "unknown"
  );

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

  return (
    <article className="s6">
      <div className="padding">
        <Link href={`/companions/${companion.id}`}>
          <img className="round" src={companion.icon}></img>
        </Link>
        <h5>{companion.name}</h5>
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
        <p>性格: {companion.personality}</p>
        <p>ストーリー: {companion.story}</p>
        <div className="row">
          <button>
            <Link href={`/companions/${companion.id}`}>詳細 </Link>
          </button>
          <button>
            <Link href={`/companions/edit?id=${companion.id}`}>編集 </Link>
          </button>
          <button>
            <Link href={`/companions/move?id=${companion.id}`}>移動 </Link>
          </button>
          <button onClick={() => onDelete(companion.id)}>削除</button>
        </div>
      </div>
    </article>
  );
}
