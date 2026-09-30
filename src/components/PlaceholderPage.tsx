interface IPlaceholderPageProps {
    title: string;
    description?: string;
}

/**
 * Temporary page body shown until the real page is built.
 */
export default function PlaceholderPage({ title, description }: IPlaceholderPageProps) {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="text-base-content/70 mt-2">{description ?? "This page is coming soon."}</p>
        </div>
    );
}
