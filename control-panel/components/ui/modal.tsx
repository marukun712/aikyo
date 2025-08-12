import React from "react";

export default function Modal({ children }: { children: React.ReactNode }) {
  return <dialog className="modal">{children}</dialog>;
}
