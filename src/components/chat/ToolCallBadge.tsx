import { Loader2 } from "lucide-react";

interface StrReplaceArgs {
  command: "view" | "create" | "str_replace" | "insert" | "undo_edit";
  path: string;
  [key: string]: unknown;
}

interface FileManagerArgs {
  command: "rename" | "delete";
  path: string;
  new_path?: string;
  [key: string]: unknown;
}

type ToolArgs = StrReplaceArgs | FileManagerArgs;

interface ToolInvocation {
  toolName: string;
  state: string;
  args?: ToolArgs;
}

interface ToolCallBadgeProps {
  toolInvocation: ToolInvocation;
}

function getFileName(path: string): string {
  return path.split("/").pop() || path;
}

export function getToolCallLabel(toolName: string, args?: ToolArgs): string {
  if (!args) return toolName;

  if (toolName === "str_replace_editor") {
    const { command, path } = args as StrReplaceArgs;
    const file = getFileName(path);
    switch (command) {
      case "create":
        return `Creating ${file}`;
      case "str_replace":
      case "insert":
        return `Editing ${file}`;
      case "view":
        return `Reading ${file}`;
      case "undo_edit":
        return `Reverting ${file}`;
    }
  }

  if (toolName === "file_manager") {
    const { command, path, new_path } = args as FileManagerArgs;
    const file = getFileName(path);
    switch (command) {
      case "rename":
        return `Renaming ${file}${new_path ? ` → ${getFileName(new_path)}` : ""}`;
      case "delete":
        return `Deleting ${file}`;
    }
  }

  return toolName;
}

export function ToolCallBadge({ toolInvocation }: ToolCallBadgeProps) {
  const { toolName, state, args } = toolInvocation;
  const label = getToolCallLabel(toolName, args);
  const isDone = state === "result";

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
