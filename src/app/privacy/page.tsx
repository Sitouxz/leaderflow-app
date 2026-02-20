export default function PrivacyPolicy() {
    return (
        <div className="p-8 max-w-2xl mx-auto text-white">
            <h1 className="text-2xl font-bold mb-4">Privacy Policy</h1>
            <p className="mb-4">
                This is a demo privacy policy for the LeaderFlow Instagram Scheduler.
            </p>
            <h2 className="text-xl font-bold mb-2">Data Collection</h2>
            <p className="mb-4">
                We only collect the necessary data to post content to your Instagram account on your behalf.
                This includes your basic profile information and access tokens required for the Instagram Graph API.
            </p>
            <h2 className="text-xl font-bold mb-2">Data Deletion</h2>
            <p className="mb-4">
                If you wish to remove your data, simply disconnect your account from the dashboard, 
                and all tokens will be deleted from our database.
            </p>
            <p className="text-sm text-gray-400 mt-8">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
    );
}
