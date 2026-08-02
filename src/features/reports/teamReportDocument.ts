import type { TeamActivityReport } from "@/lib/api/types";
import { TASK_STATUS_STYLES } from "@/lib/format/status";

/**
 * Builds a print-optimised, self-contained HTML document for the team activity
 * report and opens it so the user can "Save as PDF".
 *
 * It renders light-on-white rather than reusing the app's dark theme: this document
 * leaves the product and gets printed, forwarded and attached to reviews.
 */

const escapeHtml = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const STATUS_LABEL = Object.fromEntries(
  Object.entries(TASK_STATUS_STYLES).map(([status, style]) => [status, style.label])
) as Record<string, string>;

const PRINT_STYLES = `
  *, *::before, *::after { box-sizing: border-box; }
  body {
    margin: 0; padding: 32px 40px; color: #0F172A; background: #fff;
    font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-variant-numeric: tabular-nums;
  }
  .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
  .brand-mark { width: 26px; height: 26px; border-radius: 8px; background: linear-gradient(135deg, #00F2FE, #7000FF); }
  .brand-name { font-size: 15px; font-weight: 600; letter-spacing: -0.02em; }
  h1 { font-size: 21px; margin: 0 0 4px; letter-spacing: -0.02em; }
  .sub { color: #64748B; font-size: 12px; margin-bottom: 22px; }
  .member { border: 1px solid #E2E8F0; border-radius: 10px; padding: 18px 20px; margin-bottom: 16px; page-break-inside: avoid; break-inside: avoid; }
  .m-head { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid #0F172A; padding-bottom: 8px; margin-bottom: 12px; }
  h2 { font-size: 16px; margin: 0; }
  .stats { color: #64748B; font-size: 11px; }
  .block { margin-top: 14px; }
  h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748B; margin: 0 0 6px; }
  .summary { margin: 0 0 10px; line-height: 1.6; font-size: 12.5px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { text-align: left; color: #64748B; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #E2E8F0; padding: 5px 6px; }
  td { padding: 6px; border-bottom: 1px solid #F1F5F9; vertical-align: top; }
  .key { display: inline-block; font-family: "JetBrains Mono", ui-monospace, monospace; font-weight: 600; font-size: 10px; color: #1D4ED8; background: #EFF6FF; border: 1px solid #BFDBFE; padding: 1px 5px; border-radius: 4px; }
  .pill { display: inline-block; font-size: 10px; padding: 1px 8px; border-radius: 20px; white-space: nowrap; }
  .pill.backlog { background: #F1F5F9; color: #475569; }
  .pill.in_progress { background: #DBEAFE; color: #1D4ED8; }
  .pill.review { background: #EDE9FE; color: #6D28D9; }
  .pill.blocked { background: #FFE4E6; color: #BE123C; }
  .pill.done { background: #DCFCE7; color: #15803D; }
  ul.closed { margin: 4px 0 0; padding-left: 18px; font-size: 12px; line-height: 1.7; }
  .muted { color: #94A3B8; font-size: 11.5px; }
  .footer { margin-top: 24px; border-top: 1px solid #E2E8F0; padding-top: 10px; color: #94A3B8; font-size: 10px; }
  @media print { body { padding: 0; } .member { break-inside: avoid; } }
`;

const memberSection = (member: TeamActivityReport["members"][number], periodDays: number): string => {
  const currentRows = member.current
    .map(
      (task) => `<tr>
        <td>${task.ticket ? `<span class="key">${escapeHtml(task.ticket)}</span> ` : ""}${escapeHtml(task.title)}</td>
        <td><span class="pill ${task.status}">${escapeHtml(STATUS_LABEL[task.status] ?? task.status)}</span></td>
        <td>${task.deadline ? escapeHtml(task.deadline) : "—"}</td>
      </tr>`
    )
    .join("");

  const closedList = member.closed.length
    ? `<ul class="closed">${member.closed
        .map(
          (task) =>
            `<li>${task.ticket ? `<span class="key">${escapeHtml(task.ticket)}</span> ` : ""}${escapeHtml(task.title)} <span class="muted">(${escapeHtml(task.closedAt)})</span></li>`
        )
        .join("")}</ul>`
    : `<p class="muted">Nothing closed in this period.</p>`;

  return `<section class="member">
    <div class="m-head">
      <h2>${escapeHtml(member.member)}</h2>
      <div class="stats">${member.stats.open} open · ${member.stats.closed} closed · ${member.stats.updates} updates</div>
    </div>

    <div class="block">
      <h3>Currently driving</h3>
      <p class="summary">${escapeHtml(member.currentSummary)}</p>
      ${
        member.current.length
          ? `<table><thead><tr><th>Task</th><th>Status</th><th>Deadline</th></tr></thead><tbody>${currentRows}</tbody></table>`
          : `<p class="muted">No open tasks.</p>`
      }
    </div>

    <div class="block">
      <h3>Last ${periodDays} days</h3>
      <p class="summary">${escapeHtml(member.periodSummary)}</p>
      ${closedList}
    </div>
  </section>`;
};

export const openTeamReport = (report: TeamActivityReport): boolean => {
  const window_ = window.open("", "_blank");
  if (!window_) return false;

  const generated = new Date(report.generatedAt).toLocaleString();
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<title>Clarion — Team Activity Report (${escapeHtml(report.since)} to today)</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet" />
<style>${PRINT_STYLES}</style>
</head><body>
  <div class="brand"><div class="brand-mark"></div><span class="brand-name">Clarion</span></div>
  <h1>Team Activity Report</h1>
  <div class="sub">
    ${report.members.length} ${report.members.length === 1 ? "member" : "members"} ·
    ${escapeHtml(report.since)} → today (${report.periodDays} days) · generated ${escapeHtml(generated)}
  </div>
  ${report.members.map((member) => memberSection(member, report.periodDays)).join("")}
  <div class="footer">
    Written from recorded task activity only — open work, closures, progress notes and deadline changes in the period.
  </div>
</body></html>`;

  window_.document.open();
  window_.document.write(html);
  window_.document.close();
  // Let fonts and layout settle before opening the print dialog.
  window_.setTimeout(() => window_.print(), 500);
  return true;
};
