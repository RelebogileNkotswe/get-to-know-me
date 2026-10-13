"use client";

import { useEffect, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { PHOTO_ASPECT_RATIO } from "../models/Photo";
import { ACCEPTED_PHOTO_TYPES, validatePhoto } from "../models/ProfileForm";
import { cropToJpeg } from "./CropImage";

interface IProfilePhotoFieldProps {
    /** Called with the cropped photo, or with null and an error message when the file cannot be used. */
    onChange: (file: File | null, error: string | null) => void;
    error?: string;
    /** Address of the photo already saved for the person, shown until a new one is chosen. */
    currentPhotoUrl?: string;
}

/**
 * Employee photo picker: checks the file's type and size, lets the person crop it in a portrait frame, and shows the
 * result before anything is saved. The cropped photo is handed to the form, which uploads it when the form is saved.
 */
export default function ProfilePhotoField({ onChange, error, currentPhotoUrl }: IProfilePhotoFieldProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [sourceUrl, setSourceUrl] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState<number>(1);
    const [croppedArea, setCroppedArea] = useState<Area | null>(null);
    const [isWorking, setIsWorking] = useState<boolean>(false);
    const [localError, setLocalError] = useState<string | null>(null);

    // Object addresses hold the image in memory until they are released.
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);
    useEffect(() => {
        return () => {
            if (sourceUrl) {
                URL.revokeObjectURL(sourceUrl);
            }
        };
    }, [sourceUrl]);

    // The cropper lives in a modal dialog that opens while there is an image to crop.
    useEffect(() => {
        const dialog: HTMLDialogElement | null = dialogRef.current;
        if (!dialog) {
            return;
        }
        if (sourceUrl && !dialog.open) {
            dialog.showModal();
        } else if (!sourceUrl && dialog.open) {
            dialog.close();
        }
    }, [sourceUrl]);

    function closeCropper(): void {
        setSourceUrl(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedArea(null);
        if (inputRef.current) {
            inputRef.current.value = "";
        }
    }

    function handleFileChosen(event: React.ChangeEvent<HTMLInputElement>): void {
        const file: File | undefined = event.target.files?.[0];
        setLocalError(null);
        if (!file) {
            return;
        }
        const photoError: string | null = validatePhoto(file);
        if (photoError) {
            event.target.value = "";
            setLocalError(photoError);
            onChange(null, photoError);
            return;
        }
        setSourceUrl(URL.createObjectURL(file));
    }

    async function applyCroppedPhoto(): Promise<void> {
        if (!sourceUrl || !croppedArea) {
            return;
        }
        setIsWorking(true);
        try {
            const blob: Blob = await cropToJpeg(sourceUrl, croppedArea);
            const file = new File([blob], "photo.jpg", { type: blob.type });
            setPreviewUrl(URL.createObjectURL(file));
            onChange(file, null);
            closeCropper();
        } catch {
            const message = "The photo could not be prepared. Try a different image.";
            setLocalError(message);
            onChange(null, message);
            closeCropper();
        } finally {
            setIsWorking(false);
        }
    }

    const shownPhotoUrl: string | null = previewUrl ?? currentPhotoUrl ?? null;
    const shownError: string | undefined = error ?? localError ?? undefined;

    return (
        <fieldset className="fieldset">
            <legend className="fieldset-legend">Employee photo</legend>
            <div className="flex items-center gap-4">
                {shownPhotoUrl && (
                    <div className="aspect-[4/5] w-24 shrink-0 overflow-hidden rounded-xl border-2 border-white/80 shadow">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={shownPhotoUrl}
                            alt={previewUrl ? "Preview of the new photo" : "Current photo"}
                            className="size-full object-cover"
                        />
                    </div>
                )}
                <div className="flex flex-col gap-1">
                    <input
                        ref={inputRef}
                        type="file"
                        className={`file-input ${shownError ? "file-input-error" : ""}`}
                        accept={ACCEPTED_PHOTO_TYPES.join(",")}
                        aria-label="Employee photo"
                        onChange={handleFileChosen}
                    />
                    {previewUrl && <p className="text-success text-sm">New photo ready. It is saved when you save the form.</p>}
                </div>
            </div>
            <p className={`label ${shownError ? "text-error" : ""}`}>
                {shownError ?? "JPG, PNG or WebP, maximum 5 MB. You can crop it before saving."}
            </p>

            <dialog ref={dialogRef} className="modal" onClose={closeCropper} aria-label="Crop photo">
                <div className="modal-box max-w-lg">
                    <h3 className="text-lg font-semibold">Crop the photo</h3>
                    <p className="text-base-content/70 mt-1 text-sm">
                        Drag to move the photo and use the slider to zoom. The frame is the shape used on the profile.
                    </p>
                    <div className="relative mt-4 h-80 w-full overflow-hidden rounded-lg bg-black">
                        {sourceUrl && (
                            <Cropper
                                image={sourceUrl}
                                crop={crop}
                                zoom={zoom}
                                aspect={PHOTO_ASPECT_RATIO}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={(_area: Area, pixels: Area) => setCroppedArea(pixels)}
                            />
                        )}
                    </div>
                    <label className="mt-4 flex items-center gap-3 text-sm">
                        Zoom
                        <input
                            type="range"
                            className="range range-sm flex-1"
                            min={1}
                            max={3}
                            step={0.05}
                            value={zoom}
                            aria-label="Zoom"
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setZoom(Number(event.target.value))}
                        />
                    </label>
                    <div className="modal-action">
                        <button type="button" className="btn btn-ghost" onClick={closeCropper}>
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            disabled={isWorking || !croppedArea}
                            onClick={() => void applyCroppedPhoto()}
                        >
                            {isWorking ? "Preparing..." : "Use this photo"}
                        </button>
                    </div>
                </div>
            </dialog>
        </fieldset>
    );
}
