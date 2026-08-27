import { redirect } from "next/navigation";

/** Work is the home page — reached by landing on `/` or via the wordmark. */
export default function Home() {
  redirect("/projects");
}
