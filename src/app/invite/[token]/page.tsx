import type { Metadata } from "next";
import ProfileForm from "../../../components/ProfileForm";
import { inviteService } from "../../../logic/invites/InviteService";

// The link is private: keep it out of search results, and do not send it on as a referrer to other sites.
export const metadata: Metadata = {
    title: "Get To Know Me",
    robots: { index: false, follow: false },
    referrer: "no-referrer",
};

interface IMessageProps {
    title: string;
    text: string;
}

function Message({ title, text }: IMessageProps) {
    return (
        <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-3 p-6">
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="text-base-content/70">{text}</p>
        </main>
    );
}

/**
 * The page a new joiner opens from their private link. There is no sign-in: it shows only their own form, and
 * nothing else in the tool. A link that was never valid and one that has expired get the same plain message, so a guess
 * reveals nothing. Only the person holding a link that was already used sees the thank-you message.
 */
export default async function InvitePage(props: PageProps<"/invite/[token]">) {
    const { token } = await props.params;
    const invite = await inviteService.getInvite(token);

    if (invite.state === "submitted") {
        return (
            <Message
                title="Thank you"
                text="Your profile has been sent for review. Someone at Singular Systems will check it and publish it soon. You can close this page."
            />
        );
    }
    if (invite.state !== "open") {
        return (
            <Message
                title="This link does not work"
                text="It may have expired or been replaced. Please ask the person who invited you for a new link."
            />
        );
    }

    return (
        <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-6">
            <div>
                <h1 className="text-2xl font-semibold">Welcome to Singular Systems</h1>
                <p className="text-base-content/70 mt-2">
                    Tell your new colleagues a bit about yourself. When you submit, someone will review your profile before it
                    is published.
                </p>
            </div>
            <ProfileForm mode="invite" inviteToken={token} initialValues={invite.values} />
        </main>
    );
}
