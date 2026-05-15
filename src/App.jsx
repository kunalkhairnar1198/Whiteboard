import { FileQuestion, Home } from 'lucide-react';
import { Route, Routes, useNavigate, useParams } from 'react-router-dom';

import { getSavedDiagramsList } from '@/features/editor/lib/persistence';

import { Button } from '@/components/ui/button';
import Dashboard from '@/pages/Dashboard/Dashboard';
import FabricEditor from '@/pages/Editor/Editor';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-secondary text-foreground p-6">
      <div className="bg-card p-12 rounded-3xl border border-border text-center space-y-6 shadow-2xl">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
          <FileQuestion className="w-12 h-12 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Workspace Not Found</h1>
          <p className="text-muted-foreground">
            The diagram you are looking for does not exist or has been deleted.
          </p>
        </div>
        <Button
          onClick={() => navigate('/')}
          className="rounded-full px-8 flex gap-2"
        >
          <Home className="w-4 h-4" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

// Wrapper for FabricEditor to handle params
const EditorWrapper = () => {
  const { diagramId } = useParams();
  const navigate = useNavigate();
  const decodedId = diagramId ? decodeURIComponent(diagramId) : null;

  // 404 Check: If diagramId is provided, verify it exists in our storage list
  if (decodedId) {
    const savedDiagrams = getSavedDiagramsList();
    if (!savedDiagrams.includes(decodedId)) {
      return <NotFound />;
    }
  }

  return <FabricEditor initialDiagramName={decodedId} onBack={() => navigate('/')} />;
};

function App() {
  const navigate = useNavigate();

  const handleSelectWorkspace = (name) => {
    navigate(`/editor/${encodeURIComponent(name)}`);
  };

  const handleCreateNew = () => {
    navigate('/editor');
  };

  return (
    <div className="w-full h-screen overflow-hidden">
      <Routes>
        <Route
          path="/"
          element={
            <Dashboard onSelectWorkspace={handleSelectWorkspace} onCreateNew={handleCreateNew} />
          }
        />
        <Route path="/editor" element={<EditorWrapper />} />
        <Route path="/editor/:diagramId" element={<EditorWrapper />} />
      </Routes>
    </div>
  );
}

export default App;
