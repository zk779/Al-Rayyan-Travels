import { Link } from "react-router-dom";

export default function Forbidden() {
  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-gray-300">403</h1>
        <h2 className="text-xl font-semibold mt-4">Access Denied</h2>
        <p className="text-gray-500 mt-2">
          You don't have permission to view this page. If you think this is a
          mistake, contact your administrator.
        </p>
        <Link
          to="/dashboard"
          className="inline-block mt-6 px-4 py-2 rounded-md bg-primary text-white hover:opacity-90 transition"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}