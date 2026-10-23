/**
 * Minimal types for Node's built-in `node:sqlite`, used only by engine.test.ts
 * to run the reference schema.sql. The project pins @types/node 20, which
 * predates the module; this covers exactly the calls the test makes.
 */
declare module "node:sqlite" {
  export class DatabaseSync {
    constructor(path: string);
    exec(sql: string): void;
    prepare(sql: string): { get(...params: unknown[]): unknown; all(...params: unknown[]): unknown[] };
    close(): void;
  }
}
