import { Loader } from "@/components/ux/loader";

/** Shown by Next while a route segment is loading (slow network / data fetch). */
export default function Loading() {
  return <Loader />;
}
