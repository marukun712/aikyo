export class MotionDBFetcher {
  url: string;

  constructor(url: string) {
    this.url = url;
  }

  async fetchMove(prompt: string) {
    const res = await fetch(`${this.url}/search?query=${prompt}`);
    const json = await res.json();
    return `${this.url}/motions/${json.id}.fbx`;
  }
}
