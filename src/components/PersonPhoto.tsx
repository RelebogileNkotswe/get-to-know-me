import { ClientUtils } from "../utils/ClientUtils";

interface IPersonPhotoProps {
    name: string;
    /** Address the photo loads from, or null to show the person's initials instead. */
    photoUrl: string | null;
    /** Tailwind classes for the size and shape, such as "size-14 rounded-full". */
    className: string;
    /** Tailwind classes for the size of the initials. */
    initialsClassName?: string;
}

/**
 * A person's photo, filled to the frame, or their initials on a soft background when they have no photo.
 */
export default function PersonPhoto({ name, photoUrl, className, initialsClassName = "text-xl" }: IPersonPhotoProps) {
    if (photoUrl) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt={`${name} profile picture`} className={`${className} object-cover`} />
        );
    }
    return (
        <div
            className={`${className} bg-brand-navy border border-brand-green/20 text-brand-green flex items-center justify-center font-semibold ${initialsClassName}`}
            aria-hidden="true"
        >
            {ClientUtils.getInitials(name)}
        </div>
    );
}
