// Named re-exports for default-exported custom components, so they land on
// window.HelloHoedspruitDS (ESM `export *` in the synth entry drops defaults).
// Wired via cfg.extraEntries.
export { default as PrimaryButton } from "../src/components/ui/PrimaryButton";
export { default as SearchBar } from "../src/components/ui/SearchBar";
export { default as BackArrowIcon } from "../src/components/ui/BackArrowIcon";
