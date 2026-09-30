import Image from "next/image";

interface IPersonCellProps {
    name: string;
}

/**
 * Table cell content showing a small circular profile picture before the person's name.
 */
export default function PersonCell({ name }: IPersonCellProps) {
    return (
        <div className="flex items-center gap-3">
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
            <span>{name}</span>
        </div>
    );
}
