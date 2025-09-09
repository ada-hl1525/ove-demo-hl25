import { getRouteApi } from "@tanstack/react-router";

const route = getRouteApi("/");

export const useIsView = () => {
  const { displayMode } = route.useSearch();
  return displayMode === "view";
};
