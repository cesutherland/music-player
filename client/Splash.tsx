export function Splash() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-5xl font-bold tracking-tight">altplayer</h1>
      <p className="max-w-md text-zinc-400">
        A personal music player backed by your Spotify library.
      </p>
      <a
        href="/api/auth/login"
        className="rounded-md bg-emerald-500 px-6 py-3 font-semibold text-zinc-950 transition-colors hover:bg-emerald-400"
      >
        Connect Spotify
      </a>
      <p className="text-xs text-zinc-500">Spotify Premium is required for playback.</p>
    </main>
  );
}
