/* AUTO-GENERATED - do not edit */
import { io, Socket } from "socket.io-client";
import { z } from "zod";
import * as schemas from "./schemas";

export class SocketClientV1 {
  private socket: Socket;

  constructor(url: string, options: Parameters<typeof io>[1] = {}) {
    this.socket = io(url, options);
  }

  public connect(): void {
    this.socket.connect();
  }

  public disconnect(): void {
    this.socket.disconnect();
  }

  public isConnected(): boolean {
    return this.socket.connected;
  }

  public onConnect(handler: () => void): void {
    this.socket.on("connect", handler);
  }

  public onDisconnect(handler: () => void): void {
    this.socket.on("disconnect", handler);
  }

  public onAny(handler: (event: string, ...args: unknown[]) => void): void {
    this.socket.onAny(handler);
  }

  public onError(handler: (err: Error) => void): void {
    this.socket.on("connect_error", handler);
  }

  /**
   * emits 'get_state' and waits for server ack payload
   */
  public getState(): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      this.socket.emit("get_state", (res: unknown) => {
        try {
          const parsed = z.record(z.string(), z.unknown()).parse(res);
          resolve(parsed);
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  /** server → client 'get_state' */
  public onGetState(handler: (payload: Record<string, unknown>) => void): void {
    this.socket.on("get_state", (raw: unknown) => {
      try {
        handler(z.record(z.string(), z.unknown()).parse(raw));
      } catch (e) {
        console.error("Invalid payload for get_state", e);
      }
    });
  }

  /** client → server 'reset' */
  public emitReset(): void {
    this.socket.emit("reset");
  }

  /** server → client 'reset' */
  public onReset(handler: () => void): void {
    this.socket.on("reset", () => {
      try {
        handler();
      } catch (e) {
        console.error("Invalid payload for reset", e);
      }
    });
  }

  /** client → server 'start' */
  public emitStart(): void {
    this.socket.emit("start");
  }

  /** server → client 'start' */
  public onStart(handler: () => void): void {
    this.socket.on("start", () => {
      try {
        handler();
      } catch (e) {
        console.error("Invalid payload for start", e);
      }
    });
  }

  /** client → server 'stop' */
  public emitStop(): void {
    this.socket.emit("stop");
  }

  /** server → client 'stop' */
  public onStop(handler: () => void): void {
    this.socket.on("stop", () => {
      try {
        handler();
      } catch (e) {
        console.error("Invalid payload for stop", e);
      }
    });
  }

  /** server → client 'tick' */
  public onTick(handler: (payload: schemas.TickPayload) => void): void {
    this.socket.on("tick", (raw: unknown) => {
      try {
        handler(schemas.TickPayload.parse(raw));
      } catch (e) {
        console.error("Invalid payload for tick", e);
      }
    });
  }
}

export function createSocketClient(
  url: string,
  options: Parameters<typeof io>[1] = {}
) {
  return new SocketClientV1(url, options);
}
