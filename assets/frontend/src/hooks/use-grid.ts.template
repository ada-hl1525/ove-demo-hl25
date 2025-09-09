import { getRouteApi } from "@tanstack/react-router";

const route = getRouteApi("/");

export const useGrid = () => {
  const { row, column } = route.useSearch();
  return { row, column };
};
