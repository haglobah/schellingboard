"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getRepositories } from "@/db/container";
import { ADMIN_COOKIE_NAME, isAdminCookieValid } from "@/utils/auth";
import type { Event } from "@/db/repositories/interfaces";
import type { AdminActionResult } from "./admin-guests";

async function isAdminRequest(): Promise<boolean> {
  const cookieStore = await cookies();
  return isAdminCookieValid(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

export type EventInput = {
  name: string;
  description: string;
  website: string;
  start: string;
  end: string;
  timezone: string;
  maxSessionDuration: string;
  icon?: string;
  proposalPhaseStart?: string;
  proposalPhaseEnd?: string;
  votingPhaseStart?: string;
  votingPhaseEnd?: string;
  schedulingPhaseStart?: string;
  schedulingPhaseEnd?: string;
};

function parseDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
}

type ParsedEvent = Omit<Event, "id">;
type ParseResult = { data: ParsedEvent } | { error: string };

function parseEventInput(input: EventInput): ParseResult {
  const name = input.name.trim();
  if (!name) return { error: "Name is required" };

  const start = parseDate(input.start);
  if (!start) return { error: "Invalid start date" };

  const end = parseDate(input.end);
  if (!end) return { error: "Invalid end date" };

  if (end <= start) return { error: "End date must be after start date" };

  const timezone = input.timezone.trim() || "UTC";

  const maxSessionDuration = parseInt(input.maxSessionDuration, 10);
  if (isNaN(maxSessionDuration) || maxSessionDuration <= 0) {
    return { error: "Max session duration must be a positive number" };
  }

  return {
    data: {
      name,
      description: input.description.trim(),
      website: input.website.trim(),
      start,
      end,
      timezone,
      maxSessionDuration,
      icon: input.icon?.trim() || undefined,
      proposalPhaseStart: parseDate(input.proposalPhaseStart),
      proposalPhaseEnd: parseDate(input.proposalPhaseEnd),
      votingPhaseStart: parseDate(input.votingPhaseStart),
      votingPhaseEnd: parseDate(input.votingPhaseEnd),
      schedulingPhaseStart: parseDate(input.schedulingPhaseStart),
      schedulingPhaseEnd: parseDate(input.schedulingPhaseEnd),
    },
  };
}

export async function createEventAction(
  input: EventInput
): Promise<AdminActionResult> {
  if (!(await isAdminRequest())) return { ok: false, error: "Unauthorized" };

  const parsed = parseEventInput(input);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  await getRepositories().events.create(parsed.data);
  revalidatePath("/admin");
  revalidatePath("/admin/events");
  return { ok: true };
}

export async function updateEventAction(
  input: EventInput & { id: string }
): Promise<AdminActionResult> {
  if (!(await isAdminRequest())) return { ok: false, error: "Unauthorized" };

  const parsed = parseEventInput(input);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  const updated = await getRepositories().events.update(input.id, parsed.data);
  if (!updated) return { ok: false, error: "Event not found" };

  revalidatePath("/admin");
  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${input.id}`);
  return { ok: true };
}

export async function deleteEventAction(input: {
  id: string;
}): Promise<AdminActionResult> {
  if (!(await isAdminRequest())) return { ok: false, error: "Unauthorized" };

  const { events } = getRepositories();
  const event = await events.findById(input.id);
  if (!event) return { ok: false, error: "Event not found" };

  await events.delete(input.id);
  revalidatePath("/admin");
  revalidatePath("/admin/events");
  return { ok: true };
}
