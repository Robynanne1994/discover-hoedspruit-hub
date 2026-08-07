import { forwardRef, InputHTMLAttributes, Ref } from "react";
import { Search } from "lucide-react";
import { BODY_INK, type , MUTED as TOKEN_MUTED} from "@/lib/type";

type Variant = "light" | "cream";

export interface SearchBarProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  variant?: Variant;
  ariaLabel?: string;
  inputRef?: Ref<HTMLInputElement>;
}

const TEXT = BODY_INK;

const VARIANTS: Record<Variant, { bg: string; icon: string }> = {
  light: { bg: "#FFFFFF", icon: "#1A1A1A" },
  cream: { bg: "rgba(238, 232, 218, 0.92)", icon: TOKEN_MUTED },
};

const SearchBar = forwardRef<HTMLDivElement, SearchBarProps>(function SearchBar(
  {
    value,
    onChange,
    placeholder,
    variant = "light",
    ariaLabel,
    inputRef,
    autoFocus,
    onKeyDown,
    ...rest
  },
  ref,
) {
  const v = VARIANTS[variant];
  return (
    <>
      <style>{`
        .hh-searchbar-input::placeholder {
          color: ${TEXT};
          opacity: 0.6;
        }
      `}</style>
      <div
        ref={ref}
        style={{
          height: 48,
          background: v.bg,
          borderRadius: 999,
          padding: "0 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Search size={18} strokeWidth={1.6} color={v.icon} style={{ flexShrink: 0 }} />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={ariaLabel ?? placeholder}
          autoFocus={autoFocus}
          onKeyDown={onKeyDown}
          className="hh-searchbar-input"
          style={{
            // type.input is 16px: Safari zooms the viewport whenever a
            // focused field is smaller than that.
            ...type.input,
            flex: 1,
            minWidth: 0,
            background: "transparent",
            border: "none",
            outline: "none",
            color: TEXT,
            textIndent: 4,
          }}
          {...rest}
        />
      </div>
    </>
  );
});

export default SearchBar;
