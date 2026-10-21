import { PlaylistPlayer } from "./PlaylistPlayer";

export default function MediaPage() {
  return <main className="mx-auto w-full max-w-6xl px-4 py-8">
    <h1 className="text-2xl font-semibold">Media 🎥</h1>
    <p className="mt-2 text-muted-foreground">วิดีโอ timelapse / progress จาก playlist เดิมบน YouTube ต้องใช้อินเทอร์เน็ต และอาจมีข้อจำกัดจากผู้ให้บริการ</p>
    <section aria-label="YouTube playlist" className="mt-6 rounded-xl border border-border bg-surface p-4">
      <h2 className="text-lg font-semibold">OKMD Video Timelapse Playlist</h2>
      <PlaylistPlayer playlistId="PL0Rzid1eaNsJOTXtw5mUpFMSUtoprkN5O" />
    </section>
  </main>;
}
