import { forwardRef, ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode, CSSProperties } from "react";

const FF = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const baseStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  background: "#020202",
  color: "#FFFFFF",
  border: "none",
  borderRadius: 16,
  height: 48,
  padding: "12px 24px",
  fontSize: 15,
  fontWeight: 600,
  fontFamily: FF,
  textTransform: "capitalize",
  textDecoration: "none",
  cursor: "pointer",
  transition: "transform 0.12s ease, opacity 0.12s ease",
  boxSizing: "border-box",
};

const pressDown = (el: HTMLElement) => {
  el.style.transform = "scale(0.97)";
  el.style.opacity = "0.85";
};
const pressUp = (el: HTMLElement) => {
  el.style.transform = "scale(1)";
  el.style.opacity = "1";
};

type CommonProps = {
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children?: ReactNode;
  style?: CSSProperties;
};

type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { as?: "button" };
type AnchorProps = CommonProps & AnchorHTMLAttributes<HTMLAnchorElement> & { as: "a"; href: string };

export type PrimaryButtonProps = ButtonProps | AnchorProps;

const PrimaryButton = forwardRef<HTMLButtonElement | HTMLAnchorElement, PrimaryButtonProps>(
  function PrimaryButton(props, ref) {
    const { fullWidth, leftIcon, rightIcon, children, style, ...rest } = props as CommonProps & {
      as?: "button" | "a";
    } & Record<string, any>;

    const merged: CSSProperties = {
      ...baseStyle,
      width: fullWidth ? "100%" : undefined,
      opacity: (rest as any).disabled ? 0.6 : 1,
      cursor: (rest as any).disabled ? "not-allowed" : "pointer",
      ...style,
    };

    const handlers = {
      onPointerDown: (e: any) => { if (!(rest as any).disabled) pressDown(e.currentTarget); rest.onPointerDown?.(e); },
      onPointerUp: (e: any) => { pressUp(e.currentTarget); rest.onPointerUp?.(e); },
      onPointerLeave: (e: any) => { pressUp(e.currentTarget); rest.onPointerLeave?.(e); },
    };

    const content = (
      <>
        {leftIcon}
        {children}
        {rightIcon}
      </>
    );

    if ((props as AnchorProps).as === "a") {
      const { as: _as, ...anchorRest } = rest;
      return (
        <a ref={ref as any} style={merged} {...anchorRest} {...handlers}>
          {content}
        </a>
      );
    }

    const { as: _as, ...buttonRest } = rest;
    return (
      <button ref={ref as any} style={merged} {...buttonRest} {...handlers}>
        {content}
      </button>
    );
  }
);

export default PrimaryButton;
