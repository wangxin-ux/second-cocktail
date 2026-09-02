import { headers } from "next/headers";
import ProfileForm from "./profile-form";
import { resolveVenueIdFromHost } from "@/server/realtime/venue";

export default async function ProfilePage() {
  const requestHeaders = await headers();
  const venueId = resolveVenueIdFromHost(
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"),
  );
  return <ProfileForm directMatch={venueId === "main"} />;
}
