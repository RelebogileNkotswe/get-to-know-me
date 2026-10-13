import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../logic/auth/PasswordHasher";
import { ALLOWED_EMAIL_DOMAIN } from "../models/ProfileForm";
import { validatePassword } from "../models/Password";
import { PrismaClient } from "./generated/client";

// Local development data only. Generic sample people; never add real personal information here.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Fields that were not entered are null, as in the real data.
const sampleProfiles = [
    {
        companyEmail: "sample1@singular.co.za",
        firstName: "Sample",
        lastName: "One",
        preferredName: "Sam",
        position: "Developer",
        startDate: "2026-09-14",
        linkedIn: "https://www.linkedin.com/in/sample-one",
        hobbies: "Trail running",
        somethingInteresting: "Has met a president",
        background: "BSc Computer Science",
    },
    {
        companyEmail: "sample2@singular.co.za",
        firstName: "Sample",
        lastName: "Two",
        preferredName: null,
        position: "Analyst",
        startDate: "2026-10-05",
        linkedIn: null,
        hobbies: "Chess",
        somethingInteresting: "Speaks three languages",
        background: "BCom Finance",
    },
    {
        companyEmail: "sample3@singular.co.za",
        firstName: "Sample",
        lastName: "Three",
        preferredName: "Sammy",
        position: "Designer",
        startDate: "2026-10-12",
        linkedIn: null,
        hobbies: "Painting",
        somethingInteresting: "Cycled across a country",
        background: "Diploma in Design",
    },
    {
        companyEmail: "sample5@singular.co.za",
        firstName: "Sample",
        lastName: "Five",
        preferredName: null,
        position: "Project Manager",
        startDate: "2025-03-01",
        linkedIn: null,
        hobbies: "Hiking",
        somethingInteresting: "Keeps bees",
        background: "BA Honours",
    },
];

// sample1 has a linked account; sample4 has an account but no profile.
const sampleUsers = [
    { email: "sample1@singular.co.za", role: "viewer" as const },
    { email: "sample4@singular.co.za", role: "viewer" as const },
];

/**
 * Creates the first admin for local development from SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env, so
 * no credentials are written in code. Every account starts as a viewer and only an admin can promote people,
 * so someone has to start as an admin. Running it again resets that admin's password to the value in .env.
 */
async function seedAdmin(): Promise<void> {
    const email: string = (process.env.SEED_ADMIN_EMAIL ?? "").trim().toLowerCase();
    const password: string = process.env.SEED_ADMIN_PASSWORD ?? "";
    if (email === "" && password === "") {
        console.log("Skipped the admin user: set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env to create one.");
        return;
    }
    if (process.env.NODE_ENV === "production") {
        throw new Error("The seed script must not create an admin in production.");
    }
    if (!email.endsWith(ALLOWED_EMAIL_DOMAIN) || email.length <= ALLOWED_EMAIL_DOMAIN.length) {
        throw new Error(`SEED_ADMIN_EMAIL must be an address ending in ${ALLOWED_EMAIL_DOMAIN}.`);
    }
    const passwordError: string | null = validatePassword(password);
    if (passwordError) {
        throw new Error(`SEED_ADMIN_PASSWORD is not acceptable: ${passwordError}`);
    }

    const passwordHash: string = await hashPassword(password);
    const data = { passwordHash, role: "admin" as const, emailVerifiedAt: new Date() };
    await prisma.user.upsert({ where: { email }, create: { email, ...data }, update: data });
    console.log(`Admin user ready: ${email}`);
}

async function main(): Promise<void> {
    for (const profile of sampleProfiles) {
        const data = { ...profile, startDate: new Date(profile.startDate), status: "published" as const };
        await prisma.profile.upsert({
            where: { companyEmail: profile.companyEmail },
            create: { ...data, publishedAt: new Date() },
            update: data,
        });
    }

    for (const user of sampleUsers) {
        await prisma.user.upsert({ where: { email: user.email }, create: user, update: {} });
    }

    await prisma.setting.upsert({
        where: { key: "combinedTextLimit" },
        create: { key: "combinedTextLimit", value: 500 },
        update: {},
    });

    await seedAdmin();
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (error: unknown) => {
        process.stderr.write(`Seeding failed: ${String(error)}\n`);
        await prisma.$disconnect();
        process.exit(1);
    });
