import type { SupabaseClient } from "@supabase/supabase-js";

type Row = Record<string, unknown>;

const UNIQUE: Record<string, string[]> = {
  responses: ["question_id", "user_id"],
  votes: ["item_id", "user_id"],
};

function uniqueKey(table: string): string[] | undefined {
  return Object.entries(UNIQUE).find(([suffix]) => table.endsWith(suffix))?.[1];
}

class Query implements PromiseLike<unknown> {
  private tests: ((row: Row) => boolean)[] = [];
  private change:
    | { kind: "insert"; row: Row }
    | { kind: "upsert"; row: Row; key: string }
    | { kind: "update"; patch: Row }
    | { kind: "delete" }
    | null = null;
  private orders: string[] = [];
  private isSingle = false;
  private columns = "";

  constructor(
    private db: MemorySupabase,
    private table: string,
  ) {
    if (!db.tables.has(table)) db.tables.set(table, []);
    db.touched.add(table);
  }

  select(columns = ""): this {
    this.columns = columns;
    return this;
  }
  insert(row: Row): this {
    this.change = { kind: "insert", row };
    return this;
  }
  upsert(row: Row, { onConflict }: { onConflict: string }): this {
    this.change = { kind: "upsert", row, key: onConflict };
    return this;
  }
  update(patch: Row): this {
    this.change = { kind: "update", patch };
    return this;
  }
  delete(): this {
    this.change = { kind: "delete" };
    return this;
  }
  eq(column: string, value: unknown): this {
    this.tests.push((row) => row[column] === value);
    return this;
  }
  in(column: string, values: unknown[]): this {
    this.tests.push((row) => values.includes(row[column]));
    return this;
  }
  order(column: string): this {
    this.orders.push(column);
    return this;
  }
  range(): this {
    return this;
  }
  limit(): this {
    return this;
  }
  returns(): this {
    return this;
  }
  maybeSingle(): this {
    this.isSingle = true;
    return this;
  }

  private run(): Row[] | { code: string } {
    const rows = this.db.tables.get(this.table)!;
    const matches = rows.filter((row) => this.tests.every((test) => test(row)));
    const change = this.change;
    if (!change) {
      return [...matches].sort((a, b) => {
        for (const column of this.orders) {
          const [x, y] = [a[column], b[column]] as [string, string];
          if (x !== y) return x < y ? -1 : 1;
        }
        return 0;
      });
    }
    if (change.kind === "insert") {
      const key = uniqueKey(this.table);
      if (
        key &&
        rows.some((row) => key.every((name) => row[name] === change.row[name]))
      ) {
        return { code: "23505" };
      }
      const row = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        ...change.row,
      };
      rows.push(row);
      return [row];
    }
    if (change.kind === "upsert") {
      const found = rows.find(
        (row) => row[change.key] === change.row[change.key],
      );
      if (found) Object.assign(found, change.row);
      else rows.push({ ...change.row });
      return [];
    }
    if (change.kind === "update") {
      matches.forEach((row) => Object.assign(row, change.patch));
      return matches;
    }
    this.db.tables.set(
      this.table,
      rows.filter((row) => !matches.includes(row)),
    );
    return matches;
  }

  then<A, B>(
    resolve: (value: unknown) => A | PromiseLike<A>,
    reject?: (reason: unknown) => B | PromiseLike<B>,
  ): Promise<A | B> {
    const result = this.run();
    let answer: unknown;
    if (Array.isArray(result)) {
      // The one embed the live repository uses: the votes of a Q&A item.
      const votes = /votes:(\w+)\(/.exec(this.columns)?.[1];
      const rows = result.map((row) => ({
        ...row,
        ...(votes
          ? {
              votes: (this.db.tables.get(votes) ?? []).filter(
                (vote) => vote.item_id === row.id,
              ),
            }
          : {}),
      }));
      answer = {
        data: this.isSingle ? (rows[0] ?? null) : rows,
        count: rows.length,
        error: null,
      };
    } else {
      answer = { data: null, count: null, error: result };
    }
    return Promise.resolve(answer).then(resolve, reject);
  }
}

/** An in-memory stand-in for the Supabase calls the live code makes. No RLS. */
export class MemorySupabase {
  tables = new Map<string, Row[]>();
  touched = new Set<string>();
  files = new Map<string, Blob>();

  storage = {
    from: () => ({
      upload: async (path: string, file: Blob) => {
        this.files.set(path, file);
        return { error: null };
      },
      download: async (path: string) => {
        const data = this.files.get(path) ?? null;
        return { data, error: data ? null : { name: "missing" } };
      },
      remove: async (paths: string[]) => {
        paths.forEach((path) => this.files.delete(path));
        return { error: null };
      },
      list: async (folder: string) => ({
        data: [...this.files.keys()]
          .filter((path) => path.startsWith(`${folder}/`))
          .map((path) => ({ name: path.slice(folder.length + 1) })),
      }),
    }),
  };

  from(table: string): Query {
    return new Query(this, table);
  }

  seed(table: string, ...rows: Row[]): void {
    this.tables.set(table, rows);
  }

  get client(): SupabaseClient {
    return this as unknown as SupabaseClient;
  }
}
