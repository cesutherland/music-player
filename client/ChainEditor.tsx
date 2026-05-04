import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FACET_FIELDS,
  FACET_LABELS,
  FACET_PRESETS,
  type FacetChain,
  type FacetField,
} from '../shared/facets';
import { useUi } from './store/ui';

type ChainResp = {
  chain: FacetChain;
  presets: { name: string; chain: FacetChain }[];
};

const NONE = '__none__';

export function ChainEditor() {
  const ui = useUi();
  const qc = useQueryClient();

  // Hydrate from server on first mount.
  const remote = useQuery<ChainResp>({
    queryKey: ['facet', 'chain'],
    queryFn: async () => {
      const r = await fetch('/api/facet/chain', { credentials: 'include' });
      if (!r.ok) throw new Error(`chain: ${r.status}`);
      return r.json();
    },
    staleTime: Infinity,
  });

  useEffect(() => {
    if (remote.data?.chain) ui.setChain(remote.data.chain);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remote.data?.chain.join('|')]);

  const save = useMutation({
    mutationFn: async (chain: FacetChain) => {
      const r = await fetch('/api/facet/chain', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chain }),
      });
      if (!r.ok) throw new Error(`save chain: ${r.status}`);
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['facet', 'tree'] }),
  });

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<(FacetField | typeof NONE)[]>([]);

  function openEditor() {
    const padded: (FacetField | typeof NONE)[] = [...ui.chain];
    while (padded.length < 3) padded.push(NONE);
    setDraft(padded);
    setEditing(true);
  }

  function commit() {
    const chain = draft.filter((f): f is FacetField => f !== NONE);
    if (chain.length < 1) return;
    ui.setChain(chain);
    save.mutate(chain);
    setEditing(false);
  }

  function applyPreset(chain: FacetChain) {
    ui.setChain(chain);
    save.mutate(chain);
  }

  if (!editing) {
    const labels = ui.chain.map(f => FACET_LABELS[f]).join(' / ');
    return (
      <div className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
        <span className="truncate text-zinc-300" title={labels}>
          {labels}
        </span>
        <button
          onClick={openEditor}
          className="shrink-0 rounded border border-zinc-700 px-2 py-0.5 text-xs text-zinc-400 hover:text-zinc-200"
        >
          edit
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2 border-b border-zinc-800 px-3 py-3 text-sm">
      <div className="text-xs uppercase tracking-wide text-zinc-500">
        Group by
      </div>
      {[0, 1, 2].map(i => (
        <select
          key={i}
          value={draft[i] ?? NONE}
          onChange={e => {
            const next = [...draft];
            next[i] = e.target.value as FacetField | typeof NONE;
            setDraft(next);
          }}
          className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-zinc-200"
        >
          <option value={NONE}>{i === 0 ? '— select —' : '(none)'}</option>
          {FACET_FIELDS.map(f => (
            <option key={f} value={f}>
              {FACET_LABELS[f]}
            </option>
          ))}
        </select>
      ))}
      <div className="flex justify-end gap-2 pt-1">
        <button
          onClick={() => setEditing(false)}
          className="rounded px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200"
        >
          Cancel
        </button>
        <button
          onClick={commit}
          className="rounded bg-emerald-500 px-3 py-1 text-xs font-semibold text-zinc-950 hover:bg-emerald-400"
        >
          Save
        </button>
      </div>
      <div className="pt-2">
        <div className="text-xs uppercase tracking-wide text-zinc-500">
          Presets
        </div>
        <div className="mt-1 flex flex-wrap gap-1">
          {FACET_PRESETS.map(p => (
            <button
              key={p.name}
              onClick={() => {
                applyPreset(p.chain);
                setEditing(false);
              }}
              className="rounded border border-zinc-700 px-2 py-0.5 text-xs text-zinc-300 hover:border-zinc-500"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
