import { useEffect, useState } from 'react';
import { ChainEditor } from './ChainEditor';
import { Tree } from './Tree';
import { useUi } from './store/ui';

export function Sidebar() {
  const { search, setSearch } = useUi();
  const [draft, setDraft] = useState(search);

  useEffect(() => {
    const h = setTimeout(() => setSearch(draft), 200);
    return () => clearTimeout(h);
  }, [draft, setSearch]);

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-r border-zinc-800">
      <ChainEditor />
      <div className="border-b border-zinc-800 px-3 py-2">
        <input
          type="search"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="Search…"
          className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none"
        />
      </div>
      <div className="flex-1 overflow-hidden">
        <Tree />
      </div>
    </aside>
  );
}
