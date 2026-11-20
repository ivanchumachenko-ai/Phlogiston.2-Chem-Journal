import { describe, it, expect } from "vitest";
import { calculate_molar_mass, expandFormulaAbbreviations } from "../chemistry";

const mw = (f: string) => calculate_molar_mass(f);

describe("calculate_molar_mass", () => {
  it.each([
    ["H2O", 18.015],
    ["C6H12O6", 180.156],
    ["NaCl", 58.44],
    ["Ca(OH)2", 74.09],
    ["K4[Fe(CN)6]", 368.35],
    ["CH3COOH", 60.05],
  ])("plain formula %s", (f, expected) => {
    expect(mw(f)).toBeCloseTo(expected, 1);
  });

  it("returns 0 for empty or non-formula input", () => {
    expect(mw("")).toBe(0);
    expect(mw("абв")).toBe(0);
  });

  it("understands Unicode subscripts", () => {
    expect(mw("C₆H₁₂O₆")).toBeCloseTo(180.156, 2);
  });

  it("ignores superscript charges", () => {
    expect(mw("Fe³⁺")).toBeCloseTo(55.845, 2);
  });

  it.each([
    ["CuSO4·5H2O", 249.68],
    ["Na2CO3*10H2O", 286.14],
    ["MgSO4•7H2O", 246.47],
  ])("hydrate %s", (f, expected) => {
    expect(mw(f)).toBeCloseTo(expected, 1);
  });

  it.each([
    ["Pd(PPh3)4", 1155.56],
    ["Pd2(dba)3", 915.72],
    ["PdCl2(dppf)", 731.70],
    ["Cu(acac)2", 261.76],
    ["nBuLi", 64.06],
    ["n-BuLi", 64.06],
    ["tBuOK", 112.21],
    ["iPr2NEt", 129.25],
    ["Et3N", 101.19],
    ["Ac2O", 102.09],
    ["TsCl", 190.65],
    ["MsCl", 114.55],
    ["Boc2O", 218.25],
    ["TMSCl", 108.64],
    ["TBSCl", 150.72],
    ["PhB(OH)2", 121.93],
    ["Cp*2Fe", 326.30],
    ["Mn(OAc)3", 232.07],
    ["MeOH", 32.04],
    ["HMDS", 161.39],
  ])("abbreviation %s", (f, expected) => {
    expect(mw(f)).toBeCloseTo(expected, 1);
  });

  it("keeps Pr as praseodymium unless written as nPr / iPr", () => {
    expect(mw("Pr(OTf)3")).toBeCloseTo(588.1, 0);
    expect(mw("iPrOH")).toBeCloseTo(60.1, 0);
  });

  it("does not expand abbreviations inside longer words", () => {
    expect(expandFormulaAbbreviations("Phenol")).toBe("Phenol");
    expect(expandFormulaAbbreviations("Mesitylene")).toBe("Mesitylene");
  });
});
