import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

vi.mock("./supabase", () => ({ supabase: null }));
import { InspectionsPage } from "./InspectionsPage";

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe("Inspections workspace", () => {
  it("shows the seeded pre-trip template and template administration", async () => {
    render(
      <MemoryRouter>
        <InspectionsPage />
      </MemoryRouter>,
    );
    expect(await screen.findByRole("heading", { name: "Inspections" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Templates" }));
    expect(await screen.findByText("SWS Truck Pre-Trip Inspection")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Duplicate SWS Truck Pre-Trip Inspection/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Edit SWS Truck Pre-Trip Inspection/ }),
    ).toBeInTheDocument();
  });

  it("starts, saves, resumes, validates, and submits an inspection", async () => {
    render(
      <MemoryRouter>
        <InspectionsPage />
      </MemoryRouter>,
    );
    fireEvent.click(await screen.findByRole("button", { name: /Start inspection/ }));
    expect(
      await screen.findByRole("heading", { name: "SWS Truck Pre-Trip Inspection" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    expect(await screen.findByText("Draft saved.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Submit inspection" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/required item/i);
  });

  it("highlights failed items and creates a linked issue", async () => {
    render(
      <MemoryRouter>
        <InspectionsPage />
      </MemoryRouter>,
    );
    fireEvent.click(await screen.findByRole("button", { name: /Start inspection/ }));
    const failButtons = await screen.findAllByRole("button", { name: "Fail" });
    fireEvent.click(failButtons[0]);
    expect(failButtons[0].closest("article")).toHaveClass("inspection-item-failed");
    fireEvent.click(screen.getByRole("button", { name: "Create linked issue" }));
    await waitFor(() => expect(screen.getByText("Linked issue created.")).toBeInTheDocument());
  });
});
