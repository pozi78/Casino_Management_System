import React from 'react';

export const SlotMachineIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        {/* Cabinet Body */}
        <rect x="4" y="2" width="16" height="20" rx="2" />
        {/* Screen Area */}
        <rect x="7" y="5" width="10" height="8" rx="1" />
        {/* Button Panel Area */}
        <path d="M7 17h10" />
        {/* Coin Tray / Bottom */}
        <path d="M9 22v-3" />
        <path d="M15 22v-3" />
        {/* Lever arm (simple representation) */}
        <path d="M20 6h2v4h-2" />
        <path d="M20 8h-2" />
    </svg>
);

export const RouletteIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        {/* Outer Wheel */}
        <circle cx="12" cy="12" r="10" />
        {/* Inner Track Ring */}
        <circle cx="12" cy="12" r="6" />
        {/* Center Hub */}
        <circle cx="12" cy="12" r="2" />

        {/* Pockets (Dividers in the track) */}
        <path d="M12 2v4" />
        <path d="M12 18v4" />
        <path d="M2 12h4" />
        <path d="M18 12h4" />
        <path d="M4.93 4.93l2.83 2.83" />
        <path d="M16.24 16.24l2.83 2.83" />
        <path d="M16.24 7.76l2.83-2.83" />
        <path d="M4.93 19.07l2.83-2.83" />

        {/* The Ball - placed in a specific pocket (Top Right Quad) */}
        <circle cx="15" cy="9" r="1.5" fill="currentColor" stroke="none" />
    </svg>
);
