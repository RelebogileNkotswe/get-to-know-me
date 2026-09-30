"use client";

import { useEffect, useState } from "react";
import { ACCEPTED_PHOTO_TYPES, validatePhoto } from "../models/ProfileForm";

interface IProfilePhotoFieldProps {
    /** Called with the chosen file, or with null and an error message when the file cannot be used. */
    onChange: (file: File | null, error: string | null) => void;
    error?: string;
    /** Address of the photo already saved for the person, shown until a new file is chosen. */
    currentPhotoUrl?: string;
}

/**
 * Employee photo picker with a size and format check and a circular preview.
 */
export default function ProfilePhotoField({ onChange, error, currentPhotoUrl }: IProfilePhotoFieldProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    function handleChange(event: React.ChangeEvent<HTMLInputElement>): void {
        const file: File | undefined = event.target.files?.[0];
        if (!file) {
            setPreviewUrl(null);
            onChange(null, null);
            return;
        }
        const photoError: string | null = validatePhoto(file);
        if (photoError) {
            event.target.value = "";
            setPreviewUrl(null);
            onChange(null, photoError);
            return;
        }
        setPreviewUrl(URL.createObjectURL(file));
        onChange(file, null);
    }

    const shownPhotoUrl: string | null = previewUrl ?? currentPhotoUrl ?? null;

    return (
        <fieldset className="fieldset">
            <legend className="fieldset-legend">Employee photo</legend>
            <div className="flex items-center gap-4">
                {shownPhotoUrl && (
                    <div className="avatar">
                        <div className="w-20 rounded-full">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={shownPhotoUrl} alt="Employee photo preview" />
                        </div>
                    </div>
                )}
                <input
                    type="file"
                    className={`file-input ${error ? "file-input-error" : ""}`}
                    accept={ACCEPTED_PHOTO_TYPES.join(",")}
                    aria-label="Employee photo"
                    onChange={handleChange}
                />
            </div>
            <p className={`label ${error ? "text-error" : ""}`}>{error ?? "JPG, PNG or WebP, maximum 5 MB."}</p>
        </fieldset>
    );
}
