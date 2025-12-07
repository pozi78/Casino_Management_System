
import React, { useState, useEffect, useRef } from 'react';

interface MoneyInputProps {
    value: number;
    onChange: (value: number) => void;
    onBlur?: (value: number) => void;
    readOnly?: boolean;
    id?: string;
    nextFocusId?: string;
    className?: string;
}

export const MoneyInput: React.FC<MoneyInputProps> = ({ value, onChange, onBlur, readOnly, id, nextFocusId, className }) => {
    const [internalValue, setInternalValue] = useState<string>('');
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync internal value when value prop changes (only if not editing)
    useEffect(() => {
        if (!isEditing) {
            setInternalValue(value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        }
    }, [value, isEditing]);

    const handleFocus = () => {
        if (readOnly) return;
        setIsEditing(true);
        // On focus, select all for easy overwrite
        // We convert to string with comma for editing
        // Actually the internalValue might be formatted or not.
        // Let's ensure it's editable. 123,45.
        // If value is passed as number 123.45 -> "123,45"
        setInternalValue(value.toString().replace('.', ','));
        setTimeout(() => inputRef.current?.select(), 0);
    };

    const handleBlur = () => {
        setIsEditing(false);

        // Parse the internal string to a number
        // Replace comma with dot to make it valid for Number()
        let normalized = internalValue.replace(',', '.');

        // Safety check for multiple dots
        if ((normalized.match(/\./g) || []).length > 1) {
            // Fallback: keep only first dot, remove others
            const parts = normalized.split('.');
            normalized = parts[0] + '.' + parts.slice(1).join('');
        }

        let numericVal = parseFloat(normalized);

        if (isNaN(numericVal)) {
            numericVal = 0;
        }

        // Call onBlur prop to save
        if (onBlur) {
            onBlur(numericVal);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = e.target.value;

        // Regex allows numbers, one comma or dot, minus at start
        if (/^-?[0-9]*([.,][0-9]*)?$/.test(newVal)) {
            setInternalValue(newVal);

            if (newVal === '' || newVal === '-') {
                // Don't emit 0 for just a minus sign, but do for empty
                if (newVal === '') onChange(0);
                return;
            }

            let normalized = newVal.replace(',', '.');
            let num = parseFloat(normalized);
            if (!isNaN(num)) {
                onChange(num);
            }
        }
    };

    // Improved HandleKeyDown to strictly force Comma on Dot press if that's the desired ES experience
    const handleKeyDownRobust = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            // Spreadsheet behavior: move to next cell
            if (nextFocusId) {
                const nextEl = document.getElementById(nextFocusId);
                if (nextEl) {
                    nextEl.focus();
                    return;
                }
            }
            // Default behavior if no next cell
            e.currentTarget.blur();
            return;
        }

        if (e.key === '.') {
            e.preventDefault();
            const input = e.currentTarget;
            const start = input.selectionStart ?? 0;
            const end = input.selectionEnd ?? 0;
            const val = internalValue;

            if (!val.includes(',')) {
                const newVal = val.substring(0, start) + ',' + val.substring(end);
                setInternalValue(newVal);

                // Restore cursor position trick (requires timeout or effect)
                setTimeout(() => {
                    input.selectionStart = input.selectionEnd = start + 1;
                }, 0);

                // Trigger update
                let normalized = newVal.replace(',', '.');
                let num = parseFloat(normalized);
                if (!isNaN(num)) onChange(num);
            }
        }
    };

    return (
        <div className="relative w-full">
            <input
                id={id}
                ref={inputRef}
                type="text"
                inputMode="decimal" // Mobile numeric keyboard
                className={`w-full text-right border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-50 focus:bg-white transition-colors p-1 pr-6 ${readOnly ? 'bg-gray-100 text-gray-500' : ''} ${className || ''}`}
                value={isEditing ? internalValue : (() => {
                    const fixed = Number(value).toFixed(2);
                    const [intPart, decPart] = fixed.split('.');
                    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                    return `${formattedInt},${decPart}`;
                })()}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                onKeyDown={handleKeyDownRobust}
                readOnly={readOnly}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">€</span>
        </div>
    );
};
