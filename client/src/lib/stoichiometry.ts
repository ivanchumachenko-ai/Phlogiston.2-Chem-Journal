// Pure stoichiometry for a new reagent row (moved out of Home.tsx so it can be tested).
// Units: mass in mg, amount in mmol, volume in mL, density in g/mL.

export type CalcMode = "mass" | "moles" | "eq" | "volume";

export interface ReagentCalcInput {
  calcMode: CalcMode;
  value: number;
  massUnit: "mg" | "g";
  molesUnit: "mmol" | "mol";
  volumeUnit: "mL" | "uL";
  molarMass: number;
  isFirst: boolean;
  referenceMoles?: number;
  density?: number;
  isSolution: boolean;
  concentrationInputMode: "M" | "wt" | null;
  concentrationM?: number;
  concentrationWt?: number;
}

export interface ReagentCalcResult {
  mass?: number;
  moles?: number;
  equivalents?: number;
  volume?: number;
  solutionMass?: number;
  concentrationM?: number;
  concentrationWt?: number;
}

export type ReagentCalcError =
  | "errorNoReference"
  | "errorVolumeNeedsDensity"
  | "errorSolutionNeedsConcentration";

const positive = (v?: number) => v !== undefined && !Number.isNaN(v) && v > 0;

export function calculateReagentAmounts(
  input: ReagentCalcInput,
): { ok: true; result: ReagentCalcResult } | { ok: false; error: ReagentCalcError } {
  const { calcMode, value: val, molarMass, isFirst, referenceMoles, isSolution, concentrationInputMode } = input;
  const hasDensity = positive(input.density);
  const dens = input.density as number;
  const hasConcM = positive(input.concentrationM);
  const concM = input.concentrationM as number;
  const hasConcWt = positive(input.concentrationWt);
  const concWt = input.concentrationWt as number;

  let mass: number | undefined;
  let moles: number | undefined;
  let equivalents: number | undefined;
  let volume: number | undefined;
  let solutionMass: number | undefined;
  let concentrationM: number | undefined;
  let concentrationWt: number | undefined;

  if (calcMode === "mass") {
    const massInMg = input.massUnit === "g" ? val * 1000 : val;
    mass = massInMg;
    moles = massInMg / molarMass;
  } else if (calcMode === "moles") {
    const molesInMmol = input.molesUnit === "mol" ? val * 1000 : val;
    moles = molesInMmol;
    mass = molesInMmol * molarMass;
  } else if (calcMode === "eq") {
    if (isFirst) {
      equivalents = 1;
      const baseMoles = input.molesUnit === "mol" ? 1000 : 1;
      moles = val * baseMoles;
      mass = moles * molarMass;
    } else if (referenceMoles) {
      equivalents = val;
      moles = val * referenceMoles;
      mass = moles * molarMass;
    } else {
      return { ok: false, error: "errorNoReference" };
    }
  } else if (calcMode === "volume") {
    const volumeInMl = input.volumeUnit === "uL" ? val / 1000 : val;
    volume = volumeInMl;

    if (isSolution) {
      if (concentrationInputMode === "wt") {
        if (!hasDensity) return { ok: false, error: "errorVolumeNeedsDensity" };
        if (!hasConcWt) return { ok: false, error: "errorSolutionNeedsConcentration" };
        solutionMass = volumeInMl * dens * 1000;
        mass = solutionMass * (concWt / 100);
        moles = mass / molarMass;
        concentrationWt = concWt;
      } else {
        if (!hasConcM) return { ok: false, error: "errorSolutionNeedsConcentration" };
        moles = volumeInMl * concM;
        mass = moles * molarMass;
        concentrationM = concM;
        if (hasDensity) solutionMass = volumeInMl * dens * 1000;
      }
    } else {
      if (!hasDensity) return { ok: false, error: "errorVolumeNeedsDensity" };
      mass = volumeInMl * dens * 1000;
      moles = mass / molarMass;
    }
  }

  if (equivalents === undefined) {
    if (isFirst) {
      equivalents = 1;
    } else if (referenceMoles && moles !== undefined) {
      equivalents = moles / referenceMoles;
    }
  }

  if (isSolution && calcMode !== "volume") {
    if (concentrationInputMode === "wt") {
      if (hasConcWt && mass !== undefined) {
        solutionMass = mass / (concWt / 100);
        if (hasDensity) volume = solutionMass / 1000 / dens;
        concentrationWt = concWt;
      }
    } else if (hasConcM && moles !== undefined) {
      volume = moles / concM;
      concentrationM = concM;
      if (hasDensity) solutionMass = volume * dens * 1000;
    } else if (hasDensity && mass !== undefined) {
      volume = mass / 1000 / dens;
    }
  } else if (!isSolution && calcMode !== "volume" && hasDensity && mass !== undefined) {
    volume = mass / 1000 / dens;
  }

  return { ok: true, result: { mass, moles, equivalents, volume, solutionMass, concentrationM, concentrationWt } };
}
