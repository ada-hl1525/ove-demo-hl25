import { createRoute, Navigate } from "@tanstack/react-router";
import type { RootRoute } from "@tanstack/react-router";

export const IndexPage = () => {
  // When the user accesses "/", it automatically jumps to "/dashboard"
  return <Navigate to="/dashboard" />;
};

const IndexRoute = <A, B, C, D, E, F extends Record<string, never>, G, H>(
  parentRoute: RootRoute<A, B, C, D, E, F, G, H>
) =>
  createRoute({
    path: "/",
    component: IndexPage,
    getParentRoute: () => parentRoute,
  });

export default IndexRoute;