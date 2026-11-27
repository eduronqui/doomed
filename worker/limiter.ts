import { DurableObject } from 'cloudflare:workers';
import { takeAction } from '../src/net/signal';

export class Limiter extends DurableObject<Env> {
  private times: number[] = [];

  async take(): Promise<boolean> {
    const result = takeAction(this.times, Date.now());
    this.times = result.times;
    return result.allowed;
  }
}
