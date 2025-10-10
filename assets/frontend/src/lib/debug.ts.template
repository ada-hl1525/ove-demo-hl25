import { env } from "@/env.ts";
import { useStore } from "@/lib/store.ts";
import { create } from "zustand";
import { combine } from "zustand/middleware";
import { toast } from "sonner";
import { socket } from "@/lib/sockets.ts";

export type Request = {type: string; method: string; url: string; status?: number; data: unknown; timestamp: Date};
export type Log = {timestamp: Date; level: string; app: string; data: unknown};
export type Message = {event: string, data: unknown, timestamp: Date};

export const DEBUGGING_ENABLED = import.meta.env.DEV || env.VITE_ENABLE_DEBUG;
const MAX_ENTRIES = 10;

type State = {
  messages: Message[];
  requests: Request[];
  logs: Log[];
};

const initialState: State = {
  messages: [],
  requests: [],
  logs: [],
};

export const useDebugStore = create(
  combine(initialState, (setState, getState) => {
    if (DEBUGGING_ENABLED) {
      socket.onAny((event: string, ...args: unknown[]) => {
        const next = [
            ...getState().messages,
            { event, data: args.length > 1 ? args : args[0], timestamp: new Date() },
          ]
        const messages = MAX_ENTRIES ? next.slice(next.length - MAX_ENTRIES) : next
        setState({messages});
      });
    }

    return {
      addRequest: (log: Request) => setState({ requests: getState().requests.concat([log]).slice(-MAX_ENTRIES) }),
      addLog: (log: Log) => setState({ logs: getState().logs.concat([log]).slice(-MAX_ENTRIES) }),
      setDebugState: (state: Partial<Parameters<typeof useStore.setState>[0]>) => {
        if (DEBUGGING_ENABLED) {
          useStore.setState({ ...state });
        } else {
          toast.error("Unable to set debug values in production");
        }
      },
    };
  }),
);
