"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { buttonClass } from "./WorkspaceControls";

/** Native modal: inert background, Escape, bounded scrolling and explicit focus return. */
export default function WorkspaceSheet({title,trigger,children,mobileOnly=false,doneLabel="Done"}:{
  title:string;trigger:string;children:ReactNode;mobileOnly?:boolean;doneLabel?:string;
}) {
  const dialog=useRef<HTMLDialogElement>(null),button=useRef<HTMLButtonElement>(null);
  const [open,setOpen]=useState(false),id=useId();
  const close=()=>dialog.current?.close();
  useEffect(()=>{
    if(!open)return;
    const previous=document.body.style.overflow;
    document.body.style.overflow="hidden";
    const media=window.matchMedia("(min-width: 1024px)");
    const resize=()=>{if(mobileOnly && media.matches)dialog.current?.close();};
    media.addEventListener("change",resize);
    return ()=>{document.body.style.overflow=previous;media.removeEventListener("change",resize);};
  },[open,mobileOnly]);
  return <div className={mobileOnly?"workspace-sheet-trigger mobile-workspace-only":"workspace-sheet-trigger"}>
    <button ref={button} className={buttonClass} aria-haspopup="dialog" aria-expanded={open} aria-controls={id} onClick={()=>{dialog.current?.showModal();setOpen(true);}}>{trigger}</button>
    <dialog ref={dialog} id={id} aria-label={title} className="workspace-sheet" onClose={()=>{setOpen(false);if(button.current?.getClientRects().length)button.current.focus();}}
      onClick={e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}}}
      onKeyDown={e=>{
        if(e.key!=="Tab")return;
        const elements=Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), summary, [tabindex="0"]')).filter(el=>el.getClientRects().length>0);
        const first=elements[0],last=elements.at(-1);
        if(e.shiftKey && document.activeElement===first){e.preventDefault();last?.focus();}
        else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first?.focus();}
      }}>
      <div className="sheet-heading"><h2>{title}</h2><button className={buttonClass} onClick={close} aria-label={`Close ${title}`}>Close ×</button></div>
      {children}
      <button className={buttonClass+" sheet-done"} onClick={close}>{doneLabel}</button>
    </dialog>
  </div>;
}
