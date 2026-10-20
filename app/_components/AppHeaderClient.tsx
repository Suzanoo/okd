"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import LogoutButton from "./LogoutButton";
import ThemeToggle from "./ThemeToggle";
const navigation = [{href:"/",label:"Home"},{href:"/boq",label:"BOQ Viewer"},{href:"/query",label:"Query"},{href:"/report",label:"Report"},{href:"/media",label:"Media"}];
type Props = {user: User | null; isAdmin: boolean; publicMode?: boolean};
export default function AppHeaderClient({user,publicMode=false}: Props) {
  const pathname=usePathname(), dialog=useRef<HTMLDialogElement>(null), trigger=useRef<HTMLButtonElement>(null);
  const close=()=>dialog.current?.close();
  useEffect(()=>{
    const media=matchMedia("(min-width: 1024px)");
    const resize=()=>{if(media.matches)dialog.current?.close();};
    media.addEventListener("change",resize);
    return ()=>media.removeEventListener("change",resize);
  },[]);
  useEffect(()=>{dialog.current?.close();},[pathname]);
  const links=(mobile=false)=><nav aria-label={mobile?"Mobile navigation":"Main navigation"}>{navigation.map(item=><Link key={item.href} href={item.href} onClick={close} aria-current={(pathname===item.href || (item.href!=="/" && pathname.startsWith(item.href+"/")))?"page":undefined}>{item.label}</Link>)}</nav>;
  const account=publicMode?null:user?<LogoutButton onAfterLogout={close}/>:<Link href="/login" onClick={close}>Login</Link>;
  return <header className="workspace-header">
    <a className="skip-link" href="#workspace-content">Skip to content</a>
    <div className="header-inner"><Link href="/" aria-label="Go to Home" className="brand">OKd<span>.</span></Link>
      <div className="desktop-nav">{links()}</div>
      <div className="header-actions"><ThemeToggle/><span className="desktop-account">{account}</span>
        <button ref={trigger} className="menu-trigger" type="button" aria-label="Open menu" aria-haspopup="dialog" aria-controls="mobile-drawer" aria-expanded="false" onClick={()=>{dialog.current?.showModal();document.body.style.overflow="hidden";trigger.current?.setAttribute("aria-expanded","true");}}>☰</button>
      </div>
    </div>
    <dialog id="mobile-drawer" ref={dialog} aria-label="Workspace navigation" onKeyDown={e=>{
        if(e.key!=="Tab")return;
        const items=Array.from(e.currentTarget.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),select')).filter(el=>el.getClientRects().length);
        const first=items[0],last=items[items.length-1];
        if(e.shiftKey && document.activeElement===first){e.preventDefault();last?.focus();}
        else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first?.focus();}
      }} onClick={e=>{if(e.target===dialog.current)close();}}
      onClose={()=>{document.body.style.overflow="";trigger.current?.setAttribute("aria-expanded","false");if(trigger.current?.getClientRects().length)trigger.current.focus();}}>
      <div className="drawer-content"><div className="drawer-heading"><strong>OKd Workspace</strong><button type="button" aria-label="Close menu" onClick={close}>✕</button></div>
      {links(true)}<div className="drawer-footer">{account}<a href="https://www.okmd.or.th/" target="_blank" rel="noreferrer">OKMD Website ↗</a></div></div>
    </dialog>
  </header>;
}
