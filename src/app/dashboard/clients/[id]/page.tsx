import { ClientStatement } from '../../../../components/Clients/ClientStatement'

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <ClientStatement clientId={resolvedParams.id} />
}
