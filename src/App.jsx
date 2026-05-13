import React, { useState } from 'react';
import FabricEditor from '@/features/editor/components/FabricEditor';
import Dashboard from '@/features/editor/components/Dashboard';

function App() {
  const [view, setView] = useState('dashboard');
  const [selectedDiagram, setSelectedDiagram] = useState(null);

  const handleSelectWorkspace = (name) => {
    setSelectedDiagram(name);
    setView('editor');
  };

  const handleCreateNew = () => {
    setSelectedDiagram(null);
    setView('editor');
  };

  const handleGoBack = () => {
    setView('dashboard');
  };

  return (
    <div className="w-full h-screen overflow-hidden">
      {view === 'dashboard' ? (
        <Dashboard 
          onSelectWorkspace={handleSelectWorkspace} 
          onCreateNew={handleCreateNew} 
        />
      ) : (
        <FabricEditor 
          initialDiagramName={selectedDiagram} 
          onBack={handleGoBack}
        />
      )}
    </div>
  );
}

export default App;

