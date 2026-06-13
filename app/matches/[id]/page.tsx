import { getStaticMatchIDs } from "@/lib/static-data";
import MatchDetailClient from "./match-detail-client";

export async function generateStaticParams() {
  const ids = getStaticMatchIDs();
  return ids.map((id: string) => ({ id }));
}

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MatchDetailClient matchId={id} />;
}
