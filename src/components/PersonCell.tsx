import Image from "next/image";
import PersonPhoto from "./PersonPhoto";

interface IPersonCellProps {
    name: string;
    /** The person's photo, when the list knows it. Without one, the generic placeholder picture is shown. */
    photoUrl?: string | null;
}

/**
 * Table cell content showing a small circular profile picture before the person's name.
 */
export default function PersonCell({ name, photoUrl }: IPersonCellProps) {
    return (
        <div className="flex items-center gap-3">
            {photoUrl ? (
                <PersonPhoto name={name} photoUrl={photoUrl} className="size-8 rounded-full" />
            ) : (
                <div className="avatar">
                    <div className="w-8 rounded-full">
                        <Image
                            src="/avatar-placeholder.svg"
                            alt={`${name} profile picture`}
                            width={32}
                            height={32}
                            unoptimized
                        />
                    </div>
                </div>
            )}
            <span>{name}</span>
        </div>
    );
}
