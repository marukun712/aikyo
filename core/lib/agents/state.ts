export interface IState {
  state: {
    waiting: Set<string>;
  };
  isWaiting: (id: string) => boolean;
}

export class State implements IState {
  state: {
    waiting: Set<string>;
  };

  constructor() {
    this.state = { waiting: new Set<string>() };
  }

  isWaiting(id: string): boolean {
    return this.state.waiting.has(id);
  }
}
