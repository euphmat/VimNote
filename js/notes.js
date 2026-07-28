export function hasFirstLineH1(content) {
  const firstLine = String(content || "").split(/\r?\n/, 1)[0].replace(/^\uFEFF/, "");
  return /^#(?:[ \t]+.*)?$/.test(firstLine);
}

export function firstLineH1Title(content) {
  const firstLine = String(content || "").split(/\r?\n/, 1)[0].replace(/^\uFEFF/, "");
  const match = firstLine.match(/^#[ \t]+(.*)$/);
  return match ? match[1].trim() : "";
}

export function firstMeaningfulLine(content) {
  return (
    content
      ?.split("\n")
      .map((line) => line.replace(/^#+\s*/, "").trim())
      .find(Boolean) || ""
  );
}

export function displayTitle(note) {
  return firstLineH1Title(note.content) || "Untitled note";
}

export function plainExcerpt(content) {
  return (
    content
      .replace(/^#[ \t]+.*(?:\r?\n|$)/, "")
      .replace(/```[\s\S]*?```/g, " code ")
      .replace(/[#>*_`[\]()!-]/g, " ")
      .replace(/\s+/g, " ")
      .trim() || "No content yet"
  );
}
