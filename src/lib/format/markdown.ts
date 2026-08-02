/**
 * A small Markdown → HTML renderer covering exactly what the AI writes: headings,
 * bold, italics, inline code, links, lists and tables.
 *
 * It exists instead of a dependency because the input is trusted-but-escaped model
 * output, and escaping first means the output is safe to inject.
 */

const escapeHtml = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const inline = (value: string): string =>
  value
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
    .replace(
      /\[([^\]]+)\]\((https?:[^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noreferrer noopener">$1</a>'
    );

export const renderMarkdown = (markdown: string): string => {
  const lines = escapeHtml(markdown ?? "").split("\n");
  const out: string[] = [];
  let inList = false;
  let inTable = false;

  const closeList = (): void => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };
  const closeTable = (): void => {
    if (inTable) {
      out.push("</tbody></table>");
      inTable = false;
    }
  };

  for (const line of lines) {
    // Table rows
    if (/^\s*\|/.test(line)) {
      closeList();
      if (/^\s*\|[\s\-:|]+\|\s*$/.test(line)) continue; // separator row
      const cells = line
        .trim()
        .replace(/^\||\|$/g, "")
        .split("|")
        .map((cell) => inline(cell.trim()));

      if (!inTable) {
        inTable = true;
        out.push("<table><thead><tr>");
        out.push(cells.map((cell) => `<th>${cell}</th>`).join(""));
        out.push("</tr></thead><tbody>");
      } else {
        out.push(`<tr>${cells.map((cell) => `<td>${cell}</td>`).join("")}</tr>`);
      }
      continue;
    }
    closeTable();

    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      closeList();
      const level = Math.min(heading[1].length + 1, 5);
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }

    const bullet = /^\s*[-*]\s+(.*)$/.exec(line) ?? /^\s*\d+\.\s+(.*)$/.exec(line);
    if (bullet) {
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${inline(bullet[1])}</li>`);
      continue;
    }

    closeList();
    if (!line.trim()) continue;
    out.push(`<p>${inline(line)}</p>`);
  }

  closeList();
  closeTable();
  return out.join("\n");
};
