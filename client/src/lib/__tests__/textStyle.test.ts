import { describe, it, expect } from "vitest";
import { toggleList, continueList, shiftIndent, normalizeProcedureStyle, DEFAULT_PROCEDURE_STYLE } from "../textStyle";

describe("procedure lists", () => {
  const text = "Растворить A\nДобавить B\nПеремешать";

  it("numbers selected lines and toggles back", () => {
    const on = toggleList(text, 0, text.length, "number");
    expect(on.text).toBe("1. Растворить A\n2. Добавить B\n3. Перемешать");
    expect(toggleList(on.text, 0, on.text.length, "number").text).toBe(text);
  });

  it("switches numbered to bulleted", () => {
    const num = toggleList(text, 0, text.length, "number").text;
    expect(toggleList(num, 0, num.length, "bullet").text).toBe("• Растворить A\n• Добавить B\n• Перемешать");
  });

  it("Enter continues and renumbers", () => {
    const t = "1. a\n2. b";
    const r = continueList(t, 4)!;
    expect(r.text).toBe("1. a\n2. \n3. b");
    expect(r.cursor).toBe(8);
  });

  it("Enter on an empty item leaves the list", () => {
    expect(continueList("1. a\n2. ", 8)).toEqual({ text: "1. a\n", cursor: 5 });
  });

  it("Enter outside a list does nothing", () => {
    expect(continueList("plain", 5)).toBeNull();
  });

  it("Tab indents and Shift+Tab outdents", () => {
    const ind = shiftIndent("• a", 3, 3, false);
    expect(ind.text).toBe("    • a");
    expect(shiftIndent(ind.text, 7, 7, true).text).toBe("• a");
  });

  it("normalizes stored style", () => {
    expect(normalizeProcedureStyle(undefined)).toEqual(DEFAULT_PROCEDURE_STYLE);
    expect(normalizeProcedureStyle({ fontSize: 100, fontFamily: "nope" as any })).toEqual({ fontSize: 36, fontFamily: "inter" });
  });
});
