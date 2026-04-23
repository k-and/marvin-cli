import { Task } from "./types.ts";

export function getCSVHeader(): string {
  return "ID,TITLE,DONE,DONE_AT,SCHEDULE_DATE,DUE_DATE,PRIORITY,FROG";
}

function csvEscape(str: number|string): string {
  const s = String(str);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function getDate(d: string) {
  if (d === "unassigned") {
    return "";
  }

  return d || "";
}

export function toCSV(t: Task): string {
  return [
    t._id,
    t.title,
    t.done ? "Y" : "N",
    t.doneAt || "",
    getDate(t.day),
    getDate(t.dueDate),
    t.isStarred || t.priority || 0,
    t.isFrogged || 0,
  ].map(csvEscape).join(",");
}
