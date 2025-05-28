/**
 * Removes extra whitespace from a template literal string to make it more readable in code.
 * Trims leading/trailing whitespace and normalizes indentation.
 *
 * @param strings Template literal strings
 * @param values Values to interpolate
 * @returns Formatted string with normalized whitespace
 */
export function squish(strings: TemplateStringsArray, ...values: any[]): string {
    // Combine the template literal parts
    let result = strings.reduce((acc, str, i) => {
        return acc + str + (values[i] !== undefined ? values[i] : '');
    }, '');

    // Split into lines, remove empty lines at start/end
    const lines = result.split('\n').filter((line, index, array) => {
        if (index === 0 || index === array.length - 1) {
            return line.trim() !== '';
        }
        return true;
    });

    // Find the minimum indentation (excluding empty lines)
    const minIndent =
        lines
            .filter((line) => line.trim().length > 0)
            .reduce((min, line) => {
                const indent = line.match(/^\s*/)?.[0].length || 0;
                return indent < min ? indent : min;
            }, Infinity) || 0;

    // Remove the common indentation from each line
    const normalized = lines.map((line) => line.slice(minIndent)).join('\n');

    return normalized.trim();
}
