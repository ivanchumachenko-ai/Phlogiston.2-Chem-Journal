import { describe, it, expect } from "vitest";
import { buildTxtReportFile, buildCsvReportFile, reportFileName, ReagentEntry, SynthesisDetails } from "../export";
import { parseTxtSynthesis, parseCsvSynthesis } from "../importTxt";

const entries: ReagentEntry[] = [
  { id: "1", nameOrFormula: "Бензальдегид", molarMass: 106.12, mass: 1061, massUnit: "mg", moles: 10, molesUnit: "mmol", equivalents: 1, isReference: true },
  { id: "2", nameOrFormula: "HCl", molarMass: 36.46, moles: 12, equivalents: 1.2, isReference: false, isSolution: true, concentrationM: 2, volume: 6 },
];
const details: SynthesisDetails = {
  title: "Конденсация", number: "42", formula: "C14H12O2", productName: "Бензоин",
  productMass: "1.2 g", yield: "57", procedure: "1. Растворить\n2. Перемешать",
  procedureStyle: { fontSize: 16, fontFamily: "times" },
};

describe("report files", () => {
  it("names files after the synthesis number and title", () => {
    expect(reportFileName(details, "pdf")).toBe("42_Конденсация.pdf");
    expect(reportFileName({ ...details, number: "", title: "" }, "csv")).toBe("Бензоин.csv");
    expect(reportFileName(undefined, "txt")).toBe("Phlogiston_report.txt");
    expect(reportFileName({ ...details, title: 'a/b:c*?' }, "txt")).toBe("42_a_b_c__.txt");
  });

  it("TXT report round-trips through import", async () => {
    const file = buildTxtReportFile(entries, details);
    expect(file.type).toContain("text/plain");
    const parsed = parseTxtSynthesis(await file.text());
    expect(parsed.entries.map((e) => e.nameOrFormula)).toEqual(["Бензальдегид", "HCl"]);
    expect(parsed.details.procedure).toBe(details.procedure);
    expect(parsed.details.procedureStyle).toEqual(details.procedureStyle);
  });

  it("CSV report round-trips through import and starts with a BOM for Excel", async () => {
    const file = buildCsvReportFile(entries, details);
    expect(file.type).toContain("text/csv");
    const bytes = new Uint8Array(await file.arrayBuffer());
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    const parsed = parseCsvSynthesis(await file.text());
    expect(parsed?.entries[1].concentrationM).toBe(2);
    expect(parsed?.details.title).toBe("Конденсация");
  });
});
