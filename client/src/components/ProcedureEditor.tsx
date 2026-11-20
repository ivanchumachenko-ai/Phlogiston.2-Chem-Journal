import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { List, ListOrdered, Minus, Plus, Type } from "lucide-react";
import { FormatToolbar } from "@/components/FormatToolbar";
import {
  PROCEDURE_FONTS,
  PROCEDURE_FONT_SIZES,
  MIN_FONT_SIZE,
  MAX_FONT_SIZE,
  ProcedureStyle,
  ProcedureFontId,
  fontCss,
  toggleList,
  continueList,
  shiftIndent,
} from "@/lib/textStyle";

interface ProcedureEditorProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  style: ProcedureStyle;
  onStyleChange: (style: ProcedureStyle) => void;
  placeholder?: string;
  label?: React.ReactNode;
  lang: "ru" | "en";
  /** Show the keyboard hint under the field (the hint is always in the tooltip). */
  showHint?: boolean;
  minHeightClass?: string;
  testId?: string;
}

const copy = {
  ru: {
    font: "Шрифт",
    size: "Размер шрифта",
    smaller: "Уменьшить шрифт",
    larger: "Увеличить шрифт",
    bullets: "Маркированный список",
    numbers: "Нумерованный список",
    hint: "Enter — новый пункт, Enter на пустом пункте — выход из списка, Tab / Shift+Tab — уровень вложенности",
  },
  en: {
    font: "Font",
    size: "Font size",
    smaller: "Decrease font size",
    larger: "Increase font size",
    bullets: "Bulleted list",
    numbers: "Numbered list",
    hint: "Enter — new item, Enter on an empty item — leave the list, Tab / Shift+Tab — nesting level",
  },
};

const LIST_LINE_RE = /^\s*(?:•|-|\*|\d+[.)])\s+/;

export function ProcedureEditor({ id, value, onChange, style, onStyleChange, placeholder, label, lang, showHint = true, minHeightClass = "min-h-[160px]", testId }: ProcedureEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const c = copy[lang];

  const applyText = (text: string, selStart: number, selEnd = selStart) => {
    onChange(text);
    setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(selStart, selEnd);
    }, 0);
  };

  const handleList = (kind: "bullet" | "number") => {
    const el = ref.current;
    if (!el) return;
    const res = toggleList(value, el.selectionStart, el.selectionEnd, kind);
    applyText(res.text, res.selStart, res.selEnd);
  };

  const changeSize = (delta: number) => {
    const next = Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, style.fontSize + delta));
    if (next !== style.fontSize) onStyleChange({ ...style, fontSize: next });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey && !e.nativeEvent.isComposing) {
      if (el.selectionStart !== el.selectionEnd) return;
      const res = continueList(value, el.selectionStart);
      if (res) {
        e.preventDefault();
        applyText(res.text, res.cursor);
      }
      return;
    }

    if (e.key === "Tab") {
      const lineStart = value.lastIndexOf("\n", el.selectionStart - 1) + 1;
      let lineEnd = value.indexOf("\n", lineStart);
      if (lineEnd === -1) lineEnd = value.length;
      // Only capture Tab on list lines so keyboard navigation keeps working elsewhere
      if (!LIST_LINE_RE.test(value.slice(lineStart, lineEnd))) return;
      e.preventDefault();
      const res = shiftIndent(value, el.selectionStart, el.selectionEnd, e.shiftKey);
      applyText(res.text, res.selStart, res.selEnd);
    }
  };

  const sizeOptions = PROCEDURE_FONT_SIZES.includes(style.fontSize)
    ? PROCEDURE_FONT_SIZES
    : [...PROCEDURE_FONT_SIZES, style.fontSize].sort((a, b) => a - b);

  const btn = "h-7 w-7 p-0 text-slate-600 hover:text-slate-900 focus-visible:ring-0";

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {label}
        <div className="flex flex-wrap items-center gap-1 bg-white dark:bg-background p-1 rounded-md border border-stone-200 dark:border-border shadow-sm">
          <Select value={style.fontFamily} onValueChange={(v) => onStyleChange({ ...style, fontFamily: v as ProcedureFontId })}>
            <SelectTrigger className="h-7 w-[175px] text-xs border-0 shadow-none focus:ring-0" title={c.font} aria-label={c.font}>
              <Type className="h-3.5 w-3.5 mr-1 shrink-0 text-slate-500" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROCEDURE_FONTS.map((f) => (
                <SelectItem key={f.id} value={f.id} style={{ fontFamily: f.css }}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="h-5 w-px bg-stone-200 dark:bg-border" />

          <Button type="button" variant="ghost" size="sm" className={btn} title={c.smaller} aria-label={c.smaller}
            disabled={style.fontSize <= MIN_FONT_SIZE}
            onMouseDown={(e) => { e.preventDefault(); changeSize(-1); }}>
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <Select value={String(style.fontSize)} onValueChange={(v) => onStyleChange({ ...style, fontSize: parseInt(v, 10) })}>
            <SelectTrigger className="h-7 w-[58px] px-2 text-xs border-0 shadow-none focus:ring-0 font-mono" title={c.size} aria-label={c.size}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sizeOptions.map((s) => (
                <SelectItem key={s} value={String(s)} className="font-mono text-xs">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="ghost" size="sm" className={btn} title={c.larger} aria-label={c.larger}
            disabled={style.fontSize >= MAX_FONT_SIZE}
            onMouseDown={(e) => { e.preventDefault(); changeSize(1); }}>
            <Plus className="h-3.5 w-3.5" />
          </Button>

          <div className="h-5 w-px bg-stone-200 dark:bg-border" />

          <Button type="button" variant="ghost" size="sm" className={btn} title={c.bullets} aria-label={c.bullets}
            onMouseDown={(e) => { e.preventDefault(); handleList("bullet"); }}>
            <List className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" className={btn} title={c.numbers} aria-label={c.numbers}
            onMouseDown={(e) => { e.preventDefault(); handleList("number"); }}>
            <ListOrdered className="h-4 w-4" />
          </Button>

          <div className="h-5 w-px bg-stone-200 dark:bg-border" />

          <FormatToolbar elementId={id} value={value} onChange={onChange} bare />
        </div>
      </div>

      <Textarea
        ref={ref}
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className={`${minHeightClass} resize-y leading-relaxed`}
        style={{ fontSize: `${style.fontSize}px`, fontFamily: fontCss(style.fontFamily) }}
        title={c.hint}
        data-testid={testId}
      />
      {showHint && <p className="text-[10px] text-muted-foreground">{c.hint}</p>}
    </div>
  );
}
