import {
  InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator,
} from "vite_react_shadcn_ts";

export const PhoneVerification = () => (
  <div style={{ padding: 24, maxWidth: 420, display: "flex", flexDirection: "column", gap: 12 }}>
    <div>
      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Verify your number</h4>
      <p style={{ margin: "4px 0 0", fontSize: 14, opacity: 0.7 }}>
        Enter the 6-digit code we sent to +27 82 555 0147.
      </p>
    </div>
    <InputOTP maxLength={6} value="482915" readOnly>
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot index={3} />
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  </div>
);
