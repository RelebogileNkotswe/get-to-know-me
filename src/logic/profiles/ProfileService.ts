import type { IAccountStatus, IProfileService } from "../../interface/profiles/ProfileService";
import type { IProfileFormValues } from "../../models/ProfileForm";

// TODO: replace with profiles loaded from the API once it exists. These are placeholder profiles.
const sampleProfiles: Record<string, IProfileFormValues> = {
    "1": {
        firstName: "Sample",
        lastName: "One",
        preferredName: "Sam",
        position: "Developer",
        startDate: "2026-09-14",
        companyEmail: "sample1@singular.co.za",
        linkedIn: "https://www.linkedin.com/in/sample-one",
        hobbies: "Trail running",
        somethingInteresting: "Has met a president",
        background: "BSc Computer Science",
    },
    "2": {
        firstName: "Sample",
        lastName: "Two",
        preferredName: "",
        position: "Analyst",
        startDate: "2026-10-05",
        companyEmail: "sample2@singular.co.za",
        linkedIn: "",
        hobbies: "Chess",
        somethingInteresting: "Speaks three languages",
        background: "BCom Finance",
    },
    "3": {
        firstName: "Sample",
        lastName: "Three",
        preferredName: "Sammy",
        position: "Designer",
        startDate: "2026-10-12",
        companyEmail: "sample3@singular.co.za",
        linkedIn: "",
        hobbies: "Painting",
        somethingInteresting: "Cycled across a country",
        background: "Diploma in Design",
    },
};

// TODO: replace with account status loaded from the API once it exists.
const sampleAccountStatuses: Record<string, IAccountStatus> = {
    "1": { hasAccount: true, isLocked: false },
};

export const profileService: IProfileService = {
    getProfile(accountId: string): IProfileFormValues | null {
        return sampleProfiles[accountId] ?? null;
    },

    getAccountStatus(accountId: string): IAccountStatus {
        return sampleAccountStatuses[accountId] ?? { hasAccount: false, isLocked: false };
    },
};
