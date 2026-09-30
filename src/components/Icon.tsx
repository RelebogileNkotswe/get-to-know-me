interface IIconProps {
    /** Material Symbols icon name, e.g. "search". See https://fonts.google.com/icons */
    name: string;
}

/**
 * Renders a Google Material Symbols (Outlined) icon.
 */
export default function Icon({ name }: IIconProps) {
    return (
        <span className="material-symbols-outlined" aria-hidden="true">
            {name}
        </span>
    );
}
