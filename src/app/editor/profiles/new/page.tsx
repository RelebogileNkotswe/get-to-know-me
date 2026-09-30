import ProfileForm from "../../../../components/ProfileForm";

export default function CreateProfilePage() {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold">Create profile</h1>
            <p className="text-base-content/70 mt-2 mb-6">Enter the details for a new Get To Know Me profile.</p>
            <ProfileForm mode="create" />
        </div>
    );
}
