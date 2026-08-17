/**
 * Shared utility for mapping column datatypes to UI icons.
 */
export function getDataTypeIcon(type?: string): string {
  if (!type) return "Aa";
  switch (type.toLowerCase()) {
    case "number":
    case "numeric":
    case "float":
    case "int":
      return "#";
    case "boolean":
    case "bool":
      return "✓";
    case "date":
    case "datetime":
    case "timestamp":
      return "🕒";
    case "text":
    case "string":
    default:
      return "Aa";
  }
}
