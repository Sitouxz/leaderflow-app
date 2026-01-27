import { PipelineProvider } from '@/context/PipelineContext';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  return (
    <PipelineProvider>
      <Dashboard />
    </PipelineProvider>
  );
}
