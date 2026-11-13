export const csvCell = (value) => {
  let text = String(value ?? "");
  // CSV quoting alone does not stop spreadsheet formula execution.
  if (typeof value === "string" && /^[\s\u0000-\u001f]*[=+\-@]/.test(text)) {
    text = `'${text}`;
  }
  return `"${text.replace(/"/g, '""')}"`;
};

export const convertTrackersToCSV = (trackersList = []) => {
  const headers = ["Tracker ID", "Tracker Name", "Type", "Target", "Entry ID", "Timestamp", "Value", "Note"];
  const rows = [];
  trackersList.forEach((tracker) => {
    const entries = Array.isArray(tracker.entries) ? tracker.entries : [];
    const base = [
      tracker._id || tracker.id || "",
      tracker.name || tracker.trackerName || "",
      tracker.type || "",
      tracker.target ?? "",
    ];
    (entries.length ? entries : [null]).forEach((entry) => {
      rows.push([
        ...base,
        entry?._id || entry?.id || "",
        entry?.timestamp || entry?.date || "",
        entry?.value ?? "",
        entry?.note || "",
      ].map(csvCell).join(","));
    });
  });
  return [headers.map(csvCell).join(","), ...rows].join("\r\n");
};
