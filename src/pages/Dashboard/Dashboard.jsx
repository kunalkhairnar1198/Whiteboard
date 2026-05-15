import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Clock,
  ExternalLink,
  FileJson,
  Layers,
  Layout,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';

import { deleteSavedDiagram, getSavedDiagramsList } from '@/features/editor/lib/persistence';

import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

const Dashboard = ({ onSelectWorkspace, onCreateNew }) => {
  const [diagrams, setDiagrams] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setDiagrams(getSavedDiagramsList());
  }, []);

  const handleDelete = (e, name) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteSavedDiagram(name);
      setDiagrams(getSavedDiagramsList());
    }
  };

  const filteredDiagrams = diagrams.filter((d) =>
    d.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-dashboard-from to-dashboard-to text-foreground p-6 md:p-12 transition-colors duration-500">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-primary/80 to-accent-foreground bg-clip-text text-transparent tracking-tight">
              Whiteboard Studio
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl font-light">
              Design, collaborate, and bring your ideas to life.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle className="px-8 py-6 bg-primary/90 hover:bg-primary text-lg font-semibold shadow-[0_0_20px_color-mix(in_oklch,var(--primary)_40%,transparent)]  flex gap-3" />
            <Button
              onClick={onCreateNew}
              size="lg"
              className=" px-8 py-6 bg-primary/90 hover:bg-primary text-lg font-semibold shadow-[0_0_20px_color-mix(in_oklch,var(--primary)_40%,transparent)] flex gap-3"
            >
              <Plus className="w-6 h-6" />
              Create New Workspace
            </Button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder="Search your workspaces..."
            className="pl-12 bg-dashboard-card border-border/50 text-foreground h-14 rounded-2xl focus:ring-2 focus:ring-primary/50 transition-all backdrop-blur-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Content Section */}
        <div className="space-y-8">
          <div className="flex items-center gap-3 border-b border-border/50 pb-4">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-semibold">Recent Workspaces</h2>
          </div>

          {filteredDiagrams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-primary/10 rounded-3xl border-2 border-dashed border-border">
              <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-6">
                <FileJson className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-medium text-foreground/70">No workspaces found</h3>
              <p className="text-muted-foreground mt-2">Start by creating a new design project</p>
              <Button variant="link" className="text-primary mt-4" onClick={onCreateNew}>
                Create your first workspace <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDiagrams.map((name) => (
                <Card
                  key={name}
                  onClick={() => onSelectWorkspace(name)}
                  className="group relative bg-dashboard-card border-border/50 hover:border-primary/50 hover:bg-dashboard-card-hover transition-all cursor-pointer overflow-hidden backdrop-blur-md shadow-lg"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-primary/20 rounded-xl">
                        <Layout className="w-6 h-6 text-primary" />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={(e) => handleDelete(e, name)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <CardTitle className="group-hover:text-primary transition-colors">
                      {name}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground line-clamp-1">
                      Local Workspace • Last edited recently
                    </CardDescription>
                  </CardHeader>
                  <div className="p-6 pt-0 relative z-10 flex items-center justify-between">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-border border-2 border-primary/20 flex items-center justify-center text-[10px] font-bold">
                        JD
                      </div>
                      <div className="w-8 h-8 rounded-full bg-primary border-2 border-background flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                        ME
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                      Open Design <ExternalLink className="w-3 h-3" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer / Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 border-t border-border/50">
          <div className="flex items-center gap-4 p-6 bg-dashboard-card rounded-2xl border border-border/50">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{diagrams.length}</p>
              <p className="text-muted-foreground text-sm">Total Workspaces</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-6 bg-dashboard-card rounded-2xl border border-border/50">
            <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center text-accent-foreground">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">24h</p>
              <p className="text-muted-foreground text-sm">Avg. Active Time</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-6 bg-dashboard-card rounded-2xl border border-border/50">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">Syncing</p>
              <p className="text-muted-foreground text-sm">Auto-save Enabled</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
