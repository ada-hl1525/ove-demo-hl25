import { Card } from "@/components/ui/card";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible.tsx";
import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useDebugStore } from "@/lib/debug.ts";
import { type Status, useStore } from "@/lib/store.ts";
import { ChevronLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { InlineEdit } from "@/components/inline-edit.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { socket } from "@/lib/sockets.ts";

const KEYBOARD_SHORTCUT = "k";

const Debug = () => {
  const status = useStore((store) => store.status);
  const messages = useDebugStore((store) => store.messages);
  const requests = useDebugStore((store) => store.requests);
  const logs = useDebugStore((store) => store.logs);
  const setDebugState = useDebugStore((store) => store.setDebugState);
  const [open, setOpen] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const requestsRef = useRef<HTMLDivElement>(null);
  const logsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // auto‐scroll to bottom on new message
  useEffect(() => {
    const vp = messagesRef.current;
    if (vp) {
      vp.scrollTop = vp.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const vp = requestsRef.current;
    if (vp) {
      vp.scrollTop = vp.scrollHeight;
    }
  }, [requests]);

  useEffect(() => {
    const vp = logsRef.current;
    if (vp) {
      vp.scrollTop = vp.scrollHeight;
    }
  }, [logs]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="h-screen w-[800px] max-w-[unset] overflow-x-hidden overflow-y-scroll bg-black sm:w-[600px] sm:max-w-[unset]">
        <SheetHeader className="w-full">
          <SheetTitle>Debug View</SheetTitle>
          <SheetDescription>
            This view shows debug information for the selection and transition
            of the demo
          </SheetDescription>
        </SheetHeader>
        <div className="flex w-full flex-col gap-4">
          <Card className="h-fit bg-card">
            <CardHeader className="w-full flex">
              <CardTitle>Socket Connection</CardTitle>
            </CardHeader>
            <CardContent className="px-4 flex">
              <p>Connected</p>
              <Switch className="ml-auto" checked={socket.isConnected()} onCheckedChange={() => socket.isConnected() ? socket.disconnect() : socket.connect()} />
            </CardContent>
          </Card>
          <Card className="h-fit bg-card">
            <CardHeader>
              <CardTitle>
                🔍<span className="pl-2">State Variables</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="h-full p-0">
              <ScrollArea className="h-full">
                <div className="flex w-full p-4 flex-col font-mono text-sm">
                  <div className="flex">
                    <p className="px-1 py-0.5">Status:</p>
                    <InlineEdit className="ml-auto" value={status ?? "-"} onChange={(value) => setDebugState({ status: value as Status })} />
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
          <Card className="h-[30vh] bg-card">
            <CardHeader>
              <CardTitle>
                🐞<span className="pl-2">Live Messages</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="h-full max-h-4/5 p-0">
              <ScrollArea className="h-full">
                <div
                  ref={messagesRef}
                  className="space-y-2 p-4 font-mono text-sm"
                >
                  {messages.map((msg, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-muted-foreground">
                          {new Intl.DateTimeFormat("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          }).format(msg.timestamp)}
                        </span>
                        <code className="rounded bg-muted px-1 text-xs">
                          {msg.event}
                        </code>
                      </div>
                      {msg.data && JSON.stringify(msg.data).length > 30 ? (
                        <Collapsible>
                          <CollapsibleTrigger className="group flex w-full justify-end">
                            <ChevronLeft className="transition-transform group-data-[state=closed]:rotate-0 group-data-[state=open]:-rotate-90" />
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <pre className="bg-opacity-75 overflow-auto rounded bg-card p-2 text-foreground">
                              {JSON.stringify(msg.data, null, 2)}
                            </pre>
                          </CollapsibleContent>
                        </Collapsible>
                      ) : (
                        <pre className="bg-opacity-75 overflow-auto rounded bg-card p-2 text-foreground">
                          {JSON.stringify(msg.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
          <Card className="h-[30vh] bg-card">
            <CardHeader>
              <CardTitle>
                📡<span className="pl-2">HTTP Log</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="h-full max-h-4/5 p-0">
              <ScrollArea className="h-full">
                <div
                  ref={requestsRef}
                  className="space-y-2 p-4 font-mono text-sm"
                >
                  {requests.map((log, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-muted-foreground">
                          {new Intl.DateTimeFormat("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          }).format(log.timestamp)}
                        </span>
                        <code
                          className={`rounded px-1 text-xs ${
                            log.type === "error"
                              ? "bg-red-600 text-white"
                              : log.type === "response"
                                ? "bg-green-600 text-white"
                                : "bg-blue-600 text-white"
                          }`}
                        >
                          {log.type.toUpperCase()}
                        </code>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{log.method}</span>
                        <span className="truncate">{log.url}</span>
                        {log.status && (
                          <span className="ml-auto text-xs">{log.status}</span>
                        )}
                      </div>
                      {log.data && JSON.stringify(log.data).length > 30 ? (
                        <Collapsible>
                          <CollapsibleTrigger className="group flex w-full justify-end">
                            <ChevronLeft className="transition-transform group-data-[state=closed]:rotate-0 group-data-[state=open]:-rotate-90" />
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <pre className="bg-opacity-75 max-w-[736px] overflow-auto rounded bg-card p-2 text-foreground sm:max-w-[536px]">
                              {JSON.stringify(log.data, null, 2)}
                            </pre>
                          </CollapsibleContent>
                        </Collapsible>
                      ) : (
                        <pre className="bg-opacity-75 max-w-[736px] overflow-auto rounded bg-card p-2 text-foreground sm:max-w-[536px]">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
          <Card className="mb-8 h-[30vh] bg-card">
            <CardHeader>
              <CardTitle>
                👾<span className="pl-2">Application Logs</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="h-full max-h-4/5 p-0">
              <ScrollArea className="h-full">
                <div ref={logsRef} className="space-y-2 p-4 font-mono text-sm">
                  {logs.map((log, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-muted-foreground">
                          {new Intl.DateTimeFormat("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          }).format(log.timestamp)}
                        </span>
                        <code
                          className={`rounded px-1 text-xs ${
                            log.level === "error"
                              ? "bg-red-600 text-white"
                              : log.level === "warning"
                                ? "bg-yellow-600 text-white"
                                : "bg-green-600 text-white"
                          }`}
                        >
                          {log.level.toUpperCase()}
                        </code>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{log.app}</span>
                      </div>
                      {log.data && JSON.stringify(log.data).length > 30 ? (
                        <Collapsible>
                          <CollapsibleTrigger className="group flex w-full justify-end">
                            <ChevronLeft className="transition-transform group-data-[state=closed]:rotate-0 group-data-[state=open]:-rotate-90" />
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <pre className="bg-opacity-75 max-w-[736px] overflow-auto rounded bg-card p-2 text-foreground sm:max-w-[536px]">
                              {JSON.stringify(log.data, null, 2)}
                            </pre>
                          </CollapsibleContent>
                        </Collapsible>
                      ) : (
                        <pre className="bg-opacity-75 max-w-[736px] overflow-auto rounded bg-card p-2 text-foreground sm:max-w-[536px]">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default Debug;
