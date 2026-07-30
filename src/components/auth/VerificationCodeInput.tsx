import { useEffect, useRef } from "react";
import { VERIFICATION_CODE_LENGTH, normaliseCode } from "@/lib/emailVerification";

const FF = "'Helvetica Neue', Helvetica, Arial, sans-serif";

/**
 * Six boxes that behave like one field.
 *
 * The value is held by the caller as a plain string; each box is a view onto
 * one character of it. Typing advances, backspace on an empty box steps back,
 * and a pasted "402918" (or "Your code is 402 918") fills the lot — phones
 * offer the code straight from the notification, so paste has to work.
 */
const VerificationCodeInput = ({
  value,
  onChange,
  onComplete,
  disabled,
  invalid,
  autoFocus,
}: {
  value: string;
  onChange: (next: string) => void;
  /** Fired once the last digit lands, so the caller can auto-submit. */
  onComplete?: (code: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  autoFocus?: boolean;
}) => {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = normaliseCode(value).split("");

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const commit = (next: string) => {
    const code = normaliseCode(next);
    onChange(code);
    if (code.length === VERIFICATION_CODE_LENGTH) onComplete?.(code);
    return code;
  };

  const focusBox = (index: number) => {
    const clamped = Math.max(0, Math.min(VERIFICATION_CODE_LENGTH - 1, index));
    refs.current[clamped]?.focus();
    refs.current[clamped]?.select();
  };

  const handleInput = (index: number, raw: string) => {
    const typed = normaliseCode(raw);
    if (!typed) return;
    // Typing into a box replaces from that position on; pasting a full code
    // into any box fills the whole field.
    const next = (digits.slice(0, index).join("") + typed).slice(0, VERIFICATION_CODE_LENGTH);
    const code = commit(next);
    focusBox(code.length >= VERIFICATION_CODE_LENGTH ? VERIFICATION_CODE_LENGTH - 1 : code.length);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[index]) {
        commit(digits.slice(0, index).join("") + digits.slice(index + 1).join(""));
        focusBox(index);
      } else if (index > 0) {
        commit(digits.slice(0, index - 1).join(""));
        focusBox(index - 1);
      }
      return;
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusBox(index - 1);
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      focusBox(index + 1);
    }
  };

  return (
    <div
      style={{ display: "flex", gap: 8, justifyContent: "space-between" }}
      role="group"
      aria-label={`${VERIFICATION_CODE_LENGTH}-digit verification code`}
    >
      {Array.from({ length: VERIFICATION_CODE_LENGTH }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={digits[i] ?? ""}
          onChange={(e) => handleInput(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => {
            e.preventDefault();
            handleInput(0, e.clipboardData.getData("text"));
          }}
          onFocus={(e) => e.currentTarget.select()}
          disabled={disabled}
          inputMode="numeric"
          // One-time-code lets iOS and Android offer the code from the SMS/email
          // notification without the user leaving the screen.
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${i + 1}`}
          maxLength={VERIFICATION_CODE_LENGTH}
          style={{
            flex: 1,
            minWidth: 0,
            height: 56,
            textAlign: "center",
            fontFamily: FF,
            fontSize: 22,
            fontWeight: 600,
            color: "#1A1A1A",
            background: "#FFFFFF",
            border: `1.5px solid ${invalid ? "#e5484d" : "rgba(26,26,26,0.12)"}`,
            borderRadius: 12,
            outline: "none",
            padding: 0,
            opacity: disabled ? 0.6 : 1,
            caretColor: "#423324",
          }}
        />
      ))}
    </div>
  );
};

export default VerificationCodeInput;
