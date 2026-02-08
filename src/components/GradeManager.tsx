import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Grade, useGrades, useAddGrade, useUpdateGrade, useDeleteGrade } from '@/hooks/useData';
import { Tags, Plus, Pencil, Trash2, Loader2, GripVertical } from 'lucide-react';

interface GradeManagerProps {
  isAdmin: boolean;
}

export const GradeManager = ({ isAdmin }: GradeManagerProps) => {
  const { data: grades = [], isLoading } = useGrades();
  const addGrade = useAddGrade();
  const updateGrade = useUpdateGrade();
  const deleteGrade = useDeleteGrade();
  
  const [addOpen, setAddOpen] = useState(false);
  const [editGrade, setEditGrade] = useState<Grade | null>(null);
  const [name, setName] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const maxOrder = grades.reduce((max, g) => Math.max(max, g.sort_order), 0);
    addGrade.mutate({ name, sort_order: maxOrder + 1 }, {
      onSuccess: () => {
        setAddOpen(false);
        setName('');
      }
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editGrade) return;
    updateGrade.mutate({ id: editGrade.id, name }, {
      onSuccess: () => {
        setEditGrade(null);
        setName('');
      }
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this grade? Games using it will keep their data.')) {
      deleteGrade.mutate(id);
    }
  };

  const openEdit = (grade: Grade) => {
    setEditGrade(grade);
    setName(grade.name);
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tags className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Grades</h3>
        </div>
        {isAdmin && (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="secondary" className="gap-1.5">
                <Plus className="h-4 w-4" /> Add Grade
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Grade</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="grade-name">Grade Name</Label>
                  <Input 
                    id="grade-name" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="e.g. U15s, U17s, Opens" 
                    required 
                  />
                </div>
                <Button type="submit" className="w-full" disabled={addGrade.isPending}>
                  {addGrade.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Grade
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      {grades.length === 0 ? (
        <div className="p-6 text-center text-muted-foreground">
          No grades set up yet. Add grades like U13s, U15s, Opens to organise your games.
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {grades.map(grade => (
            <div key={grade.id} className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                <span className="font-medium text-foreground">{grade.name}</span>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(grade)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-destructive hover:text-destructive" 
                    onClick={() => handleDelete(grade.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editGrade} onOpenChange={(open) => !open && setEditGrade(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Grade</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-grade-name">Grade Name</Label>
              <Input 
                id="edit-grade-name" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
              />
            </div>
            <Button type="submit" className="w-full" disabled={updateGrade.isPending}>
              {updateGrade.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
