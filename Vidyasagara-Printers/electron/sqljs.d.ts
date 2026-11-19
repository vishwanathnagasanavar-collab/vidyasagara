declare module 'sql.js' {
  export interface Statement {
    bind(values?: Array<string | number | null | Uint8Array> | Record<string, string | number | null | Uint8Array>): boolean;
    step(): boolean;
    getAsObject(params?: unknown): Record<string, unknown>;
    free(): boolean;
  }

  export interface QueryExecResult {
    columns: string[];
    values: Array<Array<string | number | null | Uint8Array>>;
  }

  export class Database {
    constructor(data?: ArrayLike<number> | Buffer | null);
    run(sql: string, params?: Array<string | number | null | Uint8Array>): Database;
    exec(sql: string): QueryExecResult[];
    prepare(sql: string): Statement;
    export(): Uint8Array;
    close(): void;
  }

  export interface SqlJsStatic {
    Database: typeof Database;
  }

  export interface SqlJsConfig {
    locateFile?: (file: string, prefix?: string) => string;
  }

  export default function initSqlJs(config?: SqlJsConfig): Promise<SqlJsStatic>;
}
