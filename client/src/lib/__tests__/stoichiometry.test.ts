import { describe, it, expect } from "vitest";
import { calculateReagentAmounts, ReagentCalcInput } from "../stoichiometry";

const base: ReagentCalcInput = {
  calcMode: "mass",
  value: 0,
  massUnit: "mg",
  molesUnit: "mmol",
  volumeUnit: "mL",
  molarMass: 100,
  isFirst: false,
  referenceMoles: 10,
  isSolution: false,
  concentrationInputMode: null,
};

function calc(over: Partial<ReagentCalcInput>) {
  const r = calculateReagentAmounts({ ...base, ...over });
  if (!r.ok) throw new Error(r.error);
  return r.result;
}

describe("calculateReagentAmounts", () => {
  it("mass in mg -> mmol and eq", () => {
    const r = calc({ value: 500 });
    expect(r.mass).toBe(500);
    expect(r.moles).toBeCloseTo(5);
    expect(r.equivalents).toBeCloseTo(0.5);
  });

  it("mass in g is converted to mg", () => {
    const r = calc({ value: 1.5, massUnit: "g" });
    expect(r.mass).toBe(1500);
    expect(r.moles).toBeCloseTo(15);
  });

  it("first reagent is the reference (1 eq)", () => {
    const r = calc({ value: 1000, isFirst: true, referenceMoles: undefined });
    expect(r.equivalents).toBe(1);
  });

  it("moles in mol are converted to mmol", () => {
    const r = calc({ calcMode: "moles", value: 0.02, molesUnit: "mol" });
    expect(r.moles).toBeCloseTo(20);
    expect(r.mass).toBeCloseTo(2000);
    expect(r.equivalents).toBeCloseTo(2);
  });

  it("equivalents use the reference amount", () => {
    const r = calc({ calcMode: "eq", value: 1.2 });
    expect(r.equivalents).toBe(1.2);
    expect(r.moles).toBeCloseTo(12);
    expect(r.mass).toBeCloseTo(1200);
  });

  it("equivalents without a reference is an error", () => {
    const r = calculateReagentAmounts({ ...base, calcMode: "eq", value: 1, referenceMoles: undefined });
    expect(r).toEqual({ ok: false, error: "errorNoReference" });
  });

  it("neat liquid by volume needs density", () => {
    const r = calculateReagentAmounts({ ...base, calcMode: "volume", value: 1 });
    expect(r).toEqual({ ok: false, error: "errorVolumeNeedsDensity" });
  });

  it("neat liquid by volume (uL)", () => {
    // 500 uL of benzaldehyde, d = 1.044, M = 106.12
    const r = calc({ calcMode: "volume", value: 500, volumeUnit: "uL", density: 1.044, molarMass: 106.12 });
    expect(r.volume).toBeCloseTo(0.5);
    expect(r.mass).toBeCloseTo(522);
    expect(r.moles).toBeCloseTo(4.919, 2);
  });

  it("mass of a neat liquid with density also gives volume", () => {
    const r = calc({ value: 1044, density: 1.044 });
    expect(r.volume).toBeCloseTo(1);
  });

  it("molar solution by volume", () => {
    // 6 mL of 2 M HCl
    const r = calc({ calcMode: "volume", value: 6, isSolution: true, concentrationInputMode: "M", concentrationM: 2, molarMass: 36.46 });
    expect(r.moles).toBeCloseTo(12);
    expect(r.mass).toBeCloseTo(437.52);
    expect(r.concentrationM).toBe(2);
  });

  it("molar solution by equivalents gives the volume to take", () => {
    const r = calc({ calcMode: "eq", value: 1.5, isSolution: true, concentrationInputMode: "M", concentrationM: 2.5 });
    expect(r.moles).toBeCloseTo(15);
    expect(r.volume).toBeCloseTo(6);
  });

  it("wt% solution by volume", () => {
    // 1 mL of 96% H2SO4, d = 1.84
    const r = calc({ calcMode: "volume", value: 1, isSolution: true, concentrationInputMode: "wt", concentrationWt: 96, density: 1.84, molarMass: 98.08 });
    expect(r.solutionMass).toBeCloseTo(1840);
    expect(r.mass).toBeCloseTo(1766.4);
    expect(r.moles).toBeCloseTo(18.01, 1);
  });

  it("wt% solution by volume needs density and concentration", () => {
    expect(calculateReagentAmounts({ ...base, calcMode: "volume", value: 1, isSolution: true, concentrationInputMode: "wt", concentrationWt: 37 }))
      .toEqual({ ok: false, error: "errorVolumeNeedsDensity" });
    expect(calculateReagentAmounts({ ...base, calcMode: "volume", value: 1, isSolution: true, concentrationInputMode: "wt", density: 1.18 }))
      .toEqual({ ok: false, error: "errorSolutionNeedsConcentration" });
  });

  it("wt% solution by moles gives solution mass and volume", () => {
    // 10 mmol HCl from 37% (d 1.18)
    const r = calc({ calcMode: "moles", value: 10, isSolution: true, concentrationInputMode: "wt", concentrationWt: 37, density: 1.18, molarMass: 36.46 });
    expect(r.mass).toBeCloseTo(364.6);
    expect(r.solutionMass).toBeCloseTo(985.4, 0);
    expect(r.volume).toBeCloseTo(0.835, 2);
  });
});
