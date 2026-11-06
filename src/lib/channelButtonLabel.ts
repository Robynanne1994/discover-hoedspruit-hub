export function channelButtonLabelFromCsv(row: Record<string, string>): { cta_label?: string | null } {
  const value = row.button_label ?? row.buttonlabel;
  return value === undefined ? {} : { cta_label: value.trim() || null };
}

export function channelButtonLabelToCsv(channel: { cta_label: string | null }): string {
  return channel.cta_label ?? "";
}