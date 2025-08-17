export type TownId = string;

export interface SelectionState {
  selectedTownId: TownId | null;
}

export class SelectionStore {
  private s: SelectionState = { selectedTownId: null };

  private subs = new Set<(state: SelectionState) => void>();

  get(): SelectionState {
    return { ...this.s };
  }

  setTown(id: TownId | null): void {
    this.s = { selectedTownId: id };
    this.emit();
  }

  subscribe(fn: (state: SelectionState) => void): () => void {
    this.subs.add(fn);
    return () => this.subs.delete(fn);
  }

  private emit(): void {
    this.subs.forEach(callback => callback({ ...this.s }));
  }
}
