import { notFound } from "next/navigation";
import Link from "next/link";
import { getRepositories } from "@/db/container";
import { requireAdminPage } from "../../require-admin";

export default async function AdminEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();

  const { id } = await params;
  const event = await getRepositories().events.findById(id);
  if (!event) notFound();

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/events"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Events
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
      <p className="text-sm text-gray-500">
        {event.start.toLocaleDateString()} – {event.end.toLocaleDateString()}
        {" · "}
        {event.timezone}
      </p>
      <p className="text-sm text-gray-500">
        More management features coming soon.
      </p>
    </div>
  );
}
