/** Email domain that company emails must end with. */
export const ALLOWED_EMAIL_DOMAIN = "@singular.co.za";

/** Largest photo an editor can upload, in bytes (5 MB). */
export const MAX_PHOTO_BYTES: number = 5 * 1024 * 1024;

/** Photo formats the form accepts. */
export const ACCEPTED_PHOTO_TYPES: string[] = ["image/jpeg", "image/png", "image/webp"];

/**
 * Combined character limit shared by the three text sections, so every profile fits the template.
 * TODO: the spec makes this a setting; 90 is only its example figure.
 */
export const MAX_COMBINED_TEXT_CHARACTERS = 90;

/** The values an editor enters for a Get To Know Me profile. */
export interface IProfileFormValues {
    firstName: string;
    lastName: string;
    /** What to call the person; shown in the "Call me ..." tag. */
    preferredName: string;
    position: string;
    /** ISO date, e.g. 2026-09-14, or an empty string. */
    startDate: string;
    companyEmail: string;
    /** Optional; hidden on the profile when empty. */
    linkedIn: string;
    /** Section "Beyond the office gates". */
    hobbies: string;
    /** Section "Beyond the bio". */
    somethingInteresting: string;
    /** Section "Educational & professional background". */
    background: string;
}

/** Error messages keyed by form field; a field without an entry is valid. */
export type ProfileFormErrors = Partial<Record<keyof IProfileFormValues | "photo", string>>;

export const emptyProfileForm: IProfileFormValues = {
    firstName: "",
    lastName: "",
    preferredName: "",
    position: "",
    startDate: "",
    companyEmail: "",
    linkedIn: "",
    hobbies: "",
    somethingInteresting: "",
    background: "",
};

/** Number of characters used across the three text sections. */
export function countTextCharacters(values: IProfileFormValues): number {
    return values.hobbies.length + values.somethingInteresting.length + values.background.length;
}

/** Returns an error message when the photo cannot be used, or null when it is fine. */
export function validatePhoto(file: File): string | null {
    if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
        return "Choose a JPG, PNG or WebP image.";
    }
    if (file.size > MAX_PHOTO_BYTES) {
        return "That photo is larger than 5 MB. Choose a smaller image.";
    }
    return null;
}

function isLinkedInAddress(value: string): boolean {
    try {
        const address = new URL(value);
        return (
            (address.protocol === "https:" || address.protocol === "http:") &&
            (address.hostname === "linkedin.com" || address.hostname.endsWith(".linkedin.com"))
        );
    } catch {
        return false;
    }
}

/** Checks the form values against the profile rules and returns an error message for each invalid field. */
export function validateProfileForm(values: IProfileFormValues): ProfileFormErrors {
    const errors: ProfileFormErrors = {};

    const email: string = values.companyEmail.trim().toLowerCase();
    if (email === "") {
        errors.companyEmail = "Company email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.companyEmail = "Enter a valid email address.";
    } else if (!email.endsWith(ALLOWED_EMAIL_DOMAIN)) {
        errors.companyEmail = `Use a company email ending in ${ALLOWED_EMAIL_DOMAIN}.`;
    }

    const linkedIn: string = values.linkedIn.trim();
    if (linkedIn !== "" && !isLinkedInAddress(linkedIn)) {
        errors.linkedIn = "Enter a LinkedIn address, for example https://www.linkedin.com/in/name.";
    }

    if (countTextCharacters(values) > MAX_COMBINED_TEXT_CHARACTERS) {
        const message = `The three text sections can use ${MAX_COMBINED_TEXT_CHARACTERS} characters in total.`;
        errors.hobbies = message;
        errors.somethingInteresting = message;
        errors.background = message;
    }

    return errors;
}
