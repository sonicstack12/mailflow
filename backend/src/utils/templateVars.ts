export function replaceTemplateVariables(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const v = data[key];
    if (v === undefined || v === null) return match;
    return String(v);
  });
}


