declare module 'mapshaper' {
  const mapshaper: {
    /** Runs mapshaper commands; output files are returned in memory, keyed by file name. */
    applyCommands(commands: string, input?: Record<string, unknown>): Promise<Record<string, string>>;
  };
  export default mapshaper;
}
