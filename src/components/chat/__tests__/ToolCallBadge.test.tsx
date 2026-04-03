import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge, getToolCallLabel } from "../ToolCallBadge";

afterEach(() => {
  cleanup();
});

// --- getToolCallLabel unit tests ---

test("getToolCallLabel: str_replace_editor create", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "create", path: "/App.jsx" })).toBe("Creating App.jsx");
});

test("getToolCallLabel: str_replace_editor str_replace", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "str_replace", path: "/components/Button.tsx" })).toBe("Editing Button.tsx");
});

test("getToolCallLabel: str_replace_editor insert", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "insert", path: "/components/Card.tsx" })).toBe("Editing Card.tsx");
});

test("getToolCallLabel: str_replace_editor view", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "view", path: "/App.jsx" })).toBe("Reading App.jsx");
});

test("getToolCallLabel: str_replace_editor undo_edit", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "undo_edit", path: "/App.jsx" })).toBe("Reverting App.jsx");
});

test("getToolCallLabel: file_manager rename", () => {
  expect(getToolCallLabel("file_manager", { command: "rename", path: "/old.tsx", new_path: "/new.tsx" })).toBe("Renaming old.tsx → new.tsx");
});

test("getToolCallLabel: file_manager rename without new_path", () => {
  expect(getToolCallLabel("file_manager", { command: "rename", path: "/old.tsx" })).toBe("Renaming old.tsx");
});

test("getToolCallLabel: file_manager delete", () => {
  expect(getToolCallLabel("file_manager", { command: "delete", path: "/components/Unused.tsx" })).toBe("Deleting Unused.tsx");
});

test("getToolCallLabel: unknown tool falls back to toolName", () => {
  expect(getToolCallLabel("unknown_tool")).toBe("unknown_tool");
});

// --- ToolCallBadge render tests ---

test("ToolCallBadge shows label and green dot when done", () => {
  render(
    <ToolCallBadge
      toolInvocation={{ toolName: "str_replace_editor", state: "result", args: { command: "create", path: "/App.jsx" } }}
    />
  );
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
  // Spinner should not be present
  expect(document.querySelector(".animate-spin")).toBeNull();
  // Green dot should be present
  expect(document.querySelector(".bg-emerald-500")).toBeDefined();
});

test("ToolCallBadge shows spinner when loading", () => {
  render(
    <ToolCallBadge
      toolInvocation={{ toolName: "str_replace_editor", state: "call", args: { command: "create", path: "/App.jsx" } }}
    />
  );
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
  expect(document.querySelector(".animate-spin")).toBeDefined();
  expect(document.querySelector(".bg-emerald-500")).toBeNull();
});

test("ToolCallBadge shows editing label for str_replace", () => {
  render(
    <ToolCallBadge
      toolInvocation={{ toolName: "str_replace_editor", state: "result", args: { command: "str_replace", path: "/components/Button.tsx" } }}
    />
  );
  expect(screen.getByText("Editing Button.tsx")).toBeDefined();
});

test("ToolCallBadge shows deleting label for file_manager delete", () => {
  render(
    <ToolCallBadge
      toolInvocation={{ toolName: "file_manager", state: "result", args: { command: "delete", path: "/components/Old.tsx" } }}
    />
  );
  expect(screen.getByText("Deleting Old.tsx")).toBeDefined();
});

test("ToolCallBadge shows renaming label for file_manager rename", () => {
  render(
    <ToolCallBadge
      toolInvocation={{ toolName: "file_manager", state: "call", args: { command: "rename", path: "/old.tsx", new_path: "/new.tsx" } }}
    />
  );
  expect(screen.getByText("Renaming old.tsx → new.tsx")).toBeDefined();
});
