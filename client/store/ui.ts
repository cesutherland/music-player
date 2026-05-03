import { create } from 'zustand';
import type { FacetChain } from '../../shared/facets';
import { DEFAULT_CHAIN } from '../../shared/facets';

export const pathKey = (p: string[]) => p.join('/');

type UI = {
  chain: FacetChain;
  expanded: Set<string>;
  selection: string[] | null;
  search: string;
  setChain: (c: FacetChain) => void;
  toggleExpanded: (path: string[]) => void;
  isExpanded: (path: string[]) => boolean;
  setSelection: (p: string[] | null) => void;
  setSearch: (s: string) => void;
};

export const useUi = create<UI>((set, get) => ({
  chain: DEFAULT_CHAIN,
  expanded: new Set(),
  selection: null,
  search: '',
  setChain: chain => set({ chain, expanded: new Set(), selection: null }),
  toggleExpanded: path => {
    const key = pathKey(path);
    const next = new Set(get().expanded);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    set({ expanded: next });
  },
  isExpanded: path => get().expanded.has(pathKey(path)),
  setSelection: selection => set({ selection }),
  setSearch: search => set({ search }),
}));
