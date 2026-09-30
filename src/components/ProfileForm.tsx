"use client";

import Link from "next/link";
import { useState } from "react";
import {
    ALLOWED_EMAIL_DOMAIN,
    MAX_COMBINED_TEXT_CHARACTERS,
    countTextCharacters,
    emptyProfileForm,
    validateProfileForm,
    type IProfileFormValues,
    type ProfileFormErrors,
} from "../models/ProfileForm";
import DatePicker from "./DatePicker";
import ProfilePhotoField from "./ProfilePhotoField";

type SubmitState = "idle" | "invalid" | "valid";

interface IProfileFormProps {
    /** "create" starts with an empty form; "edit" starts with the saved details in `initialValues`. */
    mode: "create" | "edit";
    initialValues?: IProfileFormValues;
    /** Address of the photo already saved for the person (edit mode). */
    currentPhotoUrl?: string;
}

/**
 * Get To Know Me profile form, used to create a profile or to edit a saved one: basic details plus the three text sections that share one character limit.
 */
export default function ProfileForm({ mode, initialValues, currentPhotoUrl }: IProfileFormProps) {
    const [values, setValues] = useState<IProfileFormValues>(initialValues ?? emptyProfileForm);
    const [photo, setPhoto] = useState<File | null>(null);
    const [photoError, setPhotoError] = useState<string | null>(null);
    const [errors, setErrors] = useState<ProfileFormErrors>({});
    const [submitState, setSubmitState] = useState<SubmitState>("idle");

    const charactersUsed: number = countTextCharacters(values);
    const charactersRemaining: number = MAX_COMBINED_TEXT_CHARACTERS - charactersUsed;

    function setValue(name: keyof IProfileFormValues, value: string): void {
        setValues((current: IProfileFormValues) => ({ ...current, [name]: value }));
    }

    function handlePhotoChange(file: File | null, error: string | null): void {
        setPhoto(file);
        setPhotoError(error);
    }

    function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        const validationErrors: ProfileFormErrors = validateProfileForm(values);
        if (photoError) {
            validationErrors.photo = photoError;
        }
        setErrors(validationErrors);
        setSubmitState(Object.keys(validationErrors).length === 0 ? "valid" : "invalid");
        // TODO: save the profile (values and photo) through the API once it exists.
    }

    function renderTextField(
        name: keyof IProfileFormValues,
        legend: string,
        options: { type?: string; placeholder?: string; hint?: string } = {},
    ) {
        const error: string | undefined = errors[name];
        return (
            <fieldset className="fieldset">
                <legend className="fieldset-legend">{legend}</legend>
                <input
                    type={options.type ?? "text"}
                    className={`input w-full ${error ? "input-error" : ""}`}
                    placeholder={options.placeholder}
                    aria-label={legend}
                    value={values[name]}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => setValue(name, event.target.value)}
                />
                {(error || options.hint) && (
                    <p className={`label ${error ? "text-error" : ""}`}>{error ?? options.hint}</p>
                )}
            </fieldset>
        );
    }

    function renderTextSection(name: "hobbies" | "somethingInteresting" | "background", legend: string) {
        const error: string | undefined = errors[name];
        return (
            <fieldset className="fieldset">
                <legend className="fieldset-legend">{legend}</legend>
                <textarea
                    className={`textarea h-28 w-full ${error ? "textarea-error" : ""}`}
                    aria-label={legend}
                    value={values[name]}
                    maxLength={Math.max(values[name].length + charactersRemaining, values[name].length)}
                    onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setValue(name, event.target.value)}
                />
                {error && <p className="label text-error">{error}</p>}
            </fieldset>
        );
    }

    return (
        <form className="flex max-w-3xl flex-col gap-8" onSubmit={handleSubmit} noValidate>
            <section className="flex flex-col gap-2">
                <h2 className="text-lg font-semibold">Basic details</h2>
                <ProfilePhotoField
                    onChange={handlePhotoChange}
                    error={photoError ?? undefined}
                    currentPhotoUrl={currentPhotoUrl}
                />
                <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                    {renderTextField("firstName", "First name")}
                    {renderTextField("lastName", "Last name")}
                    {renderTextField("preferredName", "Preferred name (what to call them)")}
                    {renderTextField("position", "Position")}
                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">Start date</legend>
                        <div>
                            <DatePicker
                                label="Select start date"
                                valueOnly
                                value={values.startDate}
                                onChange={(value: string) => setValue("startDate", value)}
                            />
                        </div>
                    </fieldset>
                    {renderTextField("companyEmail", "Company email *", {
                        type: "email",
                        placeholder: `name${ALLOWED_EMAIL_DOMAIN}`,
                        hint: `Required. Must end in ${ALLOWED_EMAIL_DOMAIN}. Links the profile to the person's account.`,
                    })}
                    {renderTextField("linkedIn", "LinkedIn (optional)", {
                        type: "url",
                        placeholder: "https://www.linkedin.com/in/name",
                        hint: "Hidden on the profile when left empty.",
                    })}
                </div>
            </section>

            <section className="flex flex-col gap-2">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="text-lg font-semibold">About them</h2>
                    <p
                        className={`text-sm ${charactersRemaining <= 0 ? "text-warning" : "text-base-content/70"}`}
                        aria-live="polite"
                    >
                        {charactersUsed} of {MAX_COMBINED_TEXT_CHARACTERS} characters used, {charactersRemaining}{" "}
                        remaining
                    </p>
                </div>
                <p className="text-base-content/70 text-sm">
                    The three sections share one character limit. Split it between them however you like.
                </p>
                {renderTextSection("hobbies", "Hobbies and interests (Beyond the office gates)")}
                {renderTextSection("somethingInteresting", "Something interesting about them (Beyond the bio)")}
                {renderTextSection("background", "Education and work history (Educational & professional background)")}
            </section>

            {submitState === "invalid" && (
                <div role="alert" className="alert alert-error alert-soft">
                    <span>Some fields need attention. Check the messages under the highlighted fields.</span>
                </div>
            )}
            {submitState === "valid" && (
                <div role="alert" className="alert alert-info alert-soft">
                    <span>
                        The details are valid{photo ? ` and the photo (${photo.name}) is ready` : ""}. Saving profiles
                        is not connected yet, so nothing has been stored.
                    </span>
                </div>
            )}

            <div className="flex gap-3">
                <button type="submit" className="btn btn-primary">
                    {mode === "edit" ? "Save changes" : "Save profile"}
                </button>
                <Link href="/editor" className="btn btn-ghost">
                    Cancel
                </Link>
            </div>
        </form>
    );
}
