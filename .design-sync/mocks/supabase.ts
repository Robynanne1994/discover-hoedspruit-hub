// Mock Supabase client for design-system previews — no network. Every query
// resolves to empty data so data-driven components render their empty/idle
// state instead of throwing at module load. Prop-driven components get their
// data via props and don't touch this.
const EMPTY = { data: [], error: null, count: 0 };
const ONE = { data: null, error: null };

function builder(): any {
  const b: any = {};
  const chain = [
    "select","insert","update","upsert","delete","eq","neq","gt","gte","lt","lte",
    "like","ilike","is","in","contains","containedBy","range","order","limit","filter",
    "or","and","match","not","textSearch","overlaps","abortSignal","throwOnError","returns",
  ];
  for (const m of chain) b[m] = () => b;
  b.single = () => ({ then: (r: any) => r(ONE) });
  b.maybeSingle = () => ({ then: (r: any) => r(ONE) });
  b.csv = () => ({ then: (r: any) => r({ data: "", error: null }) });
  b.then = (resolve: any) => resolve(EMPTY);
  b.catch = () => b;
  b.finally = (f: any) => { f?.(); return b; };
  return b;
}

const channel = () => {
  const ch: any = {};
  ch.on = () => ch;
  ch.subscribe = () => ch;
  ch.unsubscribe = () => Promise.resolve("ok");
  return ch;
};

export const supabase: any = {
  from: () => builder(),
  rpc: () => ({ then: (r: any) => r(ONE) }),
  channel,
  removeChannel: () => Promise.resolve("ok"),
  getChannels: () => [],
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    signInWithPassword: async () => ({ data: {}, error: null }),
    signUp: async () => ({ data: {}, error: null }),
    signOut: async () => ({ error: null }),
  },
  storage: {
    from: () => ({
      upload: async () => ({ data: null, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: "" } }),
      remove: async () => ({ data: null, error: null }),
    }),
  },
};
