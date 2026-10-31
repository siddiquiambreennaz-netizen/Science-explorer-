import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PhysicsPlaylab } from "@/components/games/PhysicsPlaylab";
afterEach(cleanup);
describe("Physics gameplay", () => {
  it("unlocks answers after playing and saves a correct mission only once", async () => {
    const save = vi.fn().mockResolvedValue("Saved");
    render(<PhysicsPlaylab onComplete={save} />);
    expect(screen.getByRole("button", { name: "Both together" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Play experiment" }));
    fireEvent.click(screen.getByRole("button", { name: "The heavy ball" }));
    expect(save).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Both together" }));
    fireEvent.click(screen.getByRole("button", { name: "Both together" }));
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    expect(save).toHaveBeenCalledWith("gravity");
  });
  it("does not report successful saving when persistence fails", async () => {
    render(<PhysicsPlaylab onComplete={async () => { throw new Error("Unavailable"); }} />);
    fireEvent.click(screen.getByRole("button", { name: "Play experiment" }));
    fireEvent.click(screen.getByRole("button", { name: "Both together" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("couldn’t be saved"));
  });
});