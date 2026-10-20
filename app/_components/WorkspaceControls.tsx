import type { ReactNode } from "react";
export function SourcePanel({children,label}:{children:ReactNode;label:string}) {
  return <section aria-label={label} className="source-panel">{children}</section>;
}
export const controlClass = "workspace-control";
export const buttonClass = "workspace-button";
