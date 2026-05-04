import { useMemo, useRef } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { FacetChain, FacetNode } from '../shared/facets';
import { pathKey, useUi } from './store/ui';

type LevelResp = { chain: FacetChain; nodes: FacetNode[] };

function fetchLevel(chain: FacetChain, path: string[], search: string): Promise<LevelResp> {
  const params = new URLSearchParams();
  params.set('chain', chain.join(','));
  // Encode each segment so keys containing '/' (genres) round-trip.
  if (path.length > 0) params.set('path', path.map(encodeURIComponent).join('/'));
  if (search.trim()) params.set('search', search.trim());
  const url =
    path.length === 0
      ? `/api/facet/tree?${params}`
      : `/api/facet/children?${params}`;
  return fetch(url, { credentials: 'include' }).then(r => {
    if (!r.ok) throw new Error(`facet: ${r.status}`);
    return r.json();
  });
}

type FlatRow = {
  node: FacetNode;
  depth: number;
  path: string[];
};

export function Tree() {
  const { chain, expanded, search, selection, toggleExpanded, setSelection } =
    useUi();

  const top = useQuery<LevelResp>({
    queryKey: ['facet', 'tree', chain.join('|'), search],
    queryFn: () => fetchLevel(chain, [], search),
    staleTime: 30_000,
  });

  // Collect every expanded path that needs a child fetch.
  const expansionList = useMemo(
    () => Array.from(expanded).map(k => k.split('/')),
    [expanded],
  );

  const childQueries = useQueries({
    queries: expansionList.map(path => ({
      queryKey: ['facet', 'children', chain.join('|'), path.join('/'), search],
      queryFn: () => fetchLevel(chain, path, search),
      staleTime: 30_000,
      enabled: path.length < chain.length,
    })),
  });

  const childByPath = useMemo(() => {
    const m = new Map<string, FacetNode[]>();
    expansionList.forEach((path, i) => {
      const data = childQueries[i].data;
      if (data) m.set(pathKey(path), data.nodes);
    });
    return m;
  }, [expansionList, childQueries]);

  const flat = useMemo<FlatRow[]>(() => {
    const out: FlatRow[] = [];
    function walk(nodes: FacetNode[], parent: string[]) {
      for (const node of nodes) {
        const path = [...parent, node.key];
        out.push({ node, depth: parent.length, path });
        if (expanded.has(pathKey(path))) {
          const children = childByPath.get(pathKey(path));
          if (children) walk(children, path);
        }
      }
    }
    if (top.data?.nodes) walk(top.data.nodes, []);
    return out;
  }, [top.data?.nodes, expanded, childByPath]);

  const parentRef = useRef<HTMLDivElement>(null);
  const virt = useVirtualizer({
    count: flat.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 28,
    overscan: 8,
  });

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      {top.isLoading && <div className="px-3 py-2 text-xs text-zinc-500">Loading…</div>}
      {top.error && (
        <div className="px-3 py-2 text-xs text-rose-400">
          {(top.error as Error).message}
        </div>
      )}
      <div style={{ height: virt.getTotalSize(), position: 'relative' }}>
        {virt.getVirtualItems().map(v => {
          const row = flat[v.index];
          const open = expanded.has(pathKey(row.path));
          const selected =
            selection !== null && pathKey(selection) === pathKey(row.path);
          return (
            <div
              key={pathKey(row.path)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                transform: `translateY(${v.start}px)`,
                height: v.size,
              }}
              className={`group flex cursor-pointer items-center gap-1 px-2 text-sm leading-7 ${
                selected
                  ? 'bg-emerald-900/40 text-emerald-100'
                  : 'text-zinc-300 hover:bg-zinc-900'
              }`}
              onClick={() => {
                if (row.node.has_children) toggleExpanded(row.path);
                setSelection(row.path);
              }}
            >
              <span style={{ width: row.depth * 12 }} />
              {row.node.has_children ? (
                <span className="w-3 text-zinc-500">{open ? '▾' : '▸'}</span>
              ) : (
                <span className="w-3" />
              )}
              <span className="flex-1 truncate" title={row.node.label}>
                {row.node.label}
              </span>
              <span className="shrink-0 text-xs text-zinc-500 group-hover:text-zinc-400">
                {row.node.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
