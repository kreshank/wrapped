import diningHistory from '@/data/data.json';

export default function Home() {
  return (
    <div className="bg-white p-4">
      <p className="text-blue-800">
        {JSON.stringify(diningHistory)}
      </p>
    </div>
  );
}
