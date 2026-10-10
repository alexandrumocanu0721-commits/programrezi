import Planner from '@/components/Planner';

export default function Page({ params }: { params: { username: string } }) {
  return <Planner username={decodeURIComponent(params.username)} />;
}
