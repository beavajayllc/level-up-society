/** Bind persistence to the same mutable session object returned to the caller. */
export function withSaveHandler<T extends object>(
  state: T,
  persist: (state: T) => Promise<void>,
): T & { save(): Promise<void> } {
  return Object.assign(state, { save: () => persist(state) });
}
