// Shared form logic for the structured discount fields on specials.
// Only percent_off and amount_off carry a numeric value; the other types are
// described elsewhere (Price, Badge override, Freebie Text).

export const discountTypeUsesValue = (type?: string | null): boolean =>
  type === "percent_off" || type === "amount_off";

export const discountTypeHint = (type?: string | null): string | null => {
  switch (type) {
    case "fixed_price":
      return "Set the deal price in the Price field";
    case "buy_x_get_y":
      return "\n";
    // 'freebie' is hinted under the Freebie Text field instead.

    default:
      return null;
  }
};
