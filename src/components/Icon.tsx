interface IIconProps {
    /** Material Symbols icon name, e.g. "search". See https://fonts.google.com/icons */
    name: string;
    /** Extra Tailwind classes applied alongside material-symbols-outlined. */
    className?: string;
}

/**
 * Renders a Google Material Symbols (Outlined) icon.
 */
export default function Icon({ name, className }: IIconProps) {
    return (
        <span className={`material-symbols-outlined${className ? ` ${className}` : ""}`} aria-hidden="true">
            {name}
        </span>
    );
}
