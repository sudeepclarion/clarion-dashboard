import type { Task } from "@/lib/api/types";
import { deadlineTone } from "@/lib/format/dates";

/**
 * Client-side board filtering. It mirrors the backend's task filter vocabulary, but
 * runs locally so typing in the search box is instant against already-loaded state.
 */
export interface Filters {
  search: string;
  assignee: string;
  sprintId: string;
  onlyOverdue: boolean;
  showDone: boolean;
}

export const applyFilters = (tasks: Task[], filters: Filters): Task[] => {
  const search = filters.search.trim().toLowerCase();

  return tasks.filter((task) => {
    if (!filters.showDone && task.status === "done") return false;
    if (filters.assignee === "unassigned" && task.assignees.length) return false;
    if (filters.assignee && filters.assignee !== "unassigned" && !task.assignees.includes(filters.assignee)) {
      return false;
    }
    if (filters.sprintId === "none" && task.sprintId) return false;
    if (filters.sprintId && filters.sprintId !== "none" && task.sprintId !== filters.sprintId) return false;
    if (filters.onlyOverdue && deadlineTone(task.deadline, task.status) !== "overdue") return false;
    if (search) {
      const haystack = `${task.title} ${task.description} ${task.ticket?.key ?? ""} ${task.assignees.join(" ")}`;
      if (!haystack.toLowerCase().includes(search)) return false;
    }
    return true;
  });
};
