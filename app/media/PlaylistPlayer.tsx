"use client";

import { useEffect, useState } from "react";
import { buttonClass } from "@/app/_components/WorkspaceControls";

export function PlaylistPlayer({ playlistId }: { playlistId: string }) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<"loading" | "frame" | "unavailable">("loading");
  useEffect(() => {
    if (state !== "loading" || !playlistId) return;
    const timer = setTimeout(() => setState("unavailable"), 12000);
    return () => clearTimeout(timer);
  }, [attempt, playlistId, state]);
  if (!playlistId) return <p role="status">No playlist is configured. No videos are available here.</p>;
  return <>
    <p role="status" className="my-3 text-sm text-muted-foreground">
      {state === "loading" ? "Loading YouTube player…" : state === "frame" ? "Player frame loaded. Playback availability is controlled by YouTube; if no video appears, open the playlist on YouTube." : "Cannot confirm the player loaded. Check your connection, retry, or open the playlist on YouTube."}
    </p>
    <div className="aspect-video w-full overflow-hidden rounded-lg border border-border">
      <iframe key={attempt} className="h-full w-full" src={`https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(playlistId)}`} title="OKMD Timelapse Playlist" onLoad={() => setState("frame")} onError={() => setState("unavailable")} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
    </div>
    <div className="mt-4 flex flex-wrap gap-3">
      <button className={buttonClass} onClick={() => { setState("loading"); setAttempt(value => value + 1); }}>Retry player</button>
      <a className={buttonClass} href={`https://www.youtube.com/playlist?list=${encodeURIComponent(playlistId)}`} target="_blank" rel="noreferrer">Watch on YouTube ↗</a>
    </div>
  </>;
}
