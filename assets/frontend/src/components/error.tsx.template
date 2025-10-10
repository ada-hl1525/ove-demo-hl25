import type { ReactNode } from "react";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export function ErrorBoundary({ error }: { error: unknown }) {
  // const error = useRouteError();

  // Build a human-friendly message
  // let message: string;
  // if (isRouteErrorResponse(error)) {
  //   message = `HTTP ${error.status} — ${error.statusText}`;
  // } else if (error instanceof Error) {
  //   message = error.message;
  // } else {
  //   message = String(error);
  // }

  // Always log to console
  // console.error("Route error:", error);

  return (
    <div className="p-40 text-red-500 bg-[#fee] min-h-screen">
      <h1>🚨 Uh oh — something went wrong!</h1>
      <pre className="whitespace-pre-wrap bg-white p-20 rounded-md">
        {error as ReactNode}
      </pre>

      <div className="mt-48">
        <h2>🔍 Router DevTools</h2>
        <p className="text-lg text-gray-500">
          (inspect your matches, params & loaders below)
        </p>
        <TanStackRouterDevtools />
      </div>
    </div>
  );
}