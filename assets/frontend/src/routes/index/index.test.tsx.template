import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { IndexPage } from "./index.tsx";

describe("App", () => {
  test("renders", () => {
    render(<IndexPage />);
    expect(screen.getByText("Is view:")).toBeDefined();
  });
});