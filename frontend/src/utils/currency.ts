
export const formatCurrency = (amount: number | undefined | null): string => {
    if (amount === undefined || amount === null) return '-';

    // Manual formatting to ensure Spanish format (1.234,56)
    // 1. Fixed to 2 decimals
    const num = Number(amount);
    const fixed = num.toFixed(2); // "1234.56"

    // 2. Split integer and decimal parts
    const [intPart, decPart] = fixed.split('.');

    // 3. Add dots to integer part
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    return `${formattedInt},${decPart} €`;
};

export const getCurrencyClasses = (amount: number | undefined | null): string => {
    const val = Number(amount || 0);
    // User requested:
    // - Left alignment
    // - Green if positive (val > 0)
    // - Red if negative (val < 0)
    // - 2 decimals (handled by formatCurrency)

    // We default to gray-900 for exactly 0, or maybe green depending on preference.
    // "siempre verdes si son positivas" -> usually includes 0 or >0.
    // "rojo si son negativas".

    const colorClass = val > 0 ? 'text-green-600' : val < 0 ? 'text-red-600' : 'text-gray-900';

    // "alineación a la izquierda"
    return `text-right font-variant-numeric tabular-nums ${colorClass}`;
};
