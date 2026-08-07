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
      return "Describe the deal in Badge override, e.g. Buy 2 Get 1 Free";
    case "freebie":
      return "Shown on the card in place of a price";
    default:
      return null;
  }
};
