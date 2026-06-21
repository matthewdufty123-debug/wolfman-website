import type { Metadata } from "next";
import { siteMetadata } from "@/lib/metadata";
import CareerLineage from "@/components/CareerLineage";

export const metadata: Metadata = siteMetadata({
  title: "Career Lineage · Wolfman",
  description:
    "Matthew Dufty's career traced like data lineage. Every role grew skills and shipped wins.",
  path: "/career",
});

export default function CareerPage() {
  return <CareerLineage />;
}
