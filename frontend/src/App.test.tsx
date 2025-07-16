import React from "react";
import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders medical forms app", () => {
  render(<App />);
  const linkElement = screen.getByText(/Medical Forms Template Generator/i);
  expect(linkElement).toBeInTheDocument();
});
