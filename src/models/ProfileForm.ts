/** Email domain that company emails must end with. */
export const ALLOWED_EMAIL_DOMAIN = "@singular.co.za";

/** Largest photo an editor can upload, in bytes (5 MB). */
export const MAX_PHOTO_BYTES: number = 5 * 1024 * 1024;

/** Photo formats the form accepts. */
export const ACCEPTED_PHOTO_TYPES: string[] = ["image/jpeg", "image/png", "image/webp"];

/**
 * Combined character limit shared by the three text sections, so every profile fits the template.
 * TODO: the spec makes this a setting; 500 is a temporary figure until the real limit is set.
 */
export const MAX_COMBINED_TEXT_CHARACTERS = 500;

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

/** Longest value accepted for the short text fields (names, position, email, LinkedIn address). */
export const MAX_SHORT_FIELD_LENGTH = 200;

const SHORT_TEXT_FIELDS: { name: "firstName" | "lastName" | "preferredName" | "position"; label: string }[] = [
    { name: "firstName", label: "First name" },
    { name: "lastName", label: "Last name" },
    { name: "preferredName", label: "Preferred name" },
    { name: "position", label: "Position" },
];

/** True when the value is a real calendar date written as YYYY-MM-DD. */
function isIsoDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Checks the form values against the profile rules and returns an error message for each invalid field. */
export function validateProfileForm(values: IProfileFormValues): ProfileFormErrors {
    const errors: ProfileFormErrors = {};

    for (const field of SHORT_TEXT_FIELDS) {
        if (values[field.name].trim().length > MAX_SHORT_FIELD_LENGTH) {
            errors[field.name] = `${field.label} can be at most ${MAX_SHORT_FIELD_LENGTH} characters.`;
        }
    }

    if (values.startDate !== "" && !isIsoDate(values.startDate)) {
        errors.startDate = "Enter a valid start date.";
    }

    const email: string = values.companyEmail.trim().toLowerCase();
    if (email === "") {
        errors.companyEmail = "Company email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.companyEmail = "Enter a valid email address.";
    } else if (!email.endsWith(ALLOWED_EMAIL_DOMAIN)) {
        errors.companyEmail = `Use a company email ending in ${ALLOWED_EMAIL_DOMAIN}.`;
    } else if (email.length > MAX_SHORT_FIELD_LENGTH) {
        errors.companyEmail = `Company email can be at most ${MAX_SHORT_FIELD_LENGTH} characters.`;
    }

    const linkedIn: string = values.linkedIn.trim();
    if (linkedIn !== "" && !isLinkedInAddress(linkedIn)) {
        errors.linkedIn = "Enter a LinkedIn address, for example https://www.linkedin.com/in/name.";
    } else if (linkedIn.length > MAX_SHORT_FIELD_LENGTH) {
        errors.linkedIn = `LinkedIn address can be at most ${MAX_SHORT_FIELD_LENGTH} characters.`;
    }

    if (countTextCharacters(values) > MAX_COMBINED_TEXT_CHARACTERS) {
        const message = `The three text sections can use ${MAX_COMBINED_TEXT_CHARACTERS} characters in total.`;
        errors.hobbies = message;
        errors.somethingInteresting = message;
        errors.background = message;
    }

    return errors;
}
