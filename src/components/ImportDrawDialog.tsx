import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Link, FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ExtractedGame {
  name: string;
  venue: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface ImportDrawDialogProps {
  onGamesExtracted: (games: ExtractedGame[]) => void;
}

export const ImportDrawDialog = ({ onGamesExtracted }: ImportDrawDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [url, setUrl] = useState('');

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('parse-draw', {
        body: { type: 'url', content: url }
      });
      
      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to parse draw');
      
      if (data.games.length === 0) {
        toast.warning('No games found in that URL');
      } else {
        toast.success(`Found ${data.games.length} games`);
        onGamesExtracted(data.games);
        setOpen(false);
        setUrl('');
      }
    } catch (error) {
      console.error('Error parsing URL:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to parse draw');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const reader = new FileReader();
      
      reader.onload = async () => {
        const base64 = reader.result as string;
        
        const { data, error } = await supabase.functions.invoke('parse-draw', {
          body: { 
            type: file.type.startsWith('image/') ? 'image' : 'text',
            content: base64 
          }
        });
        
        if (error) throw error;
        if (!data.success) throw new Error(data.error || 'Failed to parse draw');
        
        if (data.games.length === 0) {
          toast.warning('No games found in that file');
        } else {
          toast.success(`Found ${data.games.length} games`);
          onGamesExtracted(data.games);
          setOpen(false);
        }
        setIsLoading(false);
      };
      
      reader.onerror = () => {
        toast.error('Failed to read file');
        setIsLoading(false);
      };
      
      // PDFs and images should be sent as base64 for vision processing
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to parse draw');
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <Upload className="h-4 w-4" /> Import Draw
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Competition Draw</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="url" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url" className="gap-1.5">
              <Link className="h-3.5 w-3.5" /> URL
            </TabsTrigger>
            <TabsTrigger value="file" className="gap-1.5">
              <FileText className="h-3.5 w-3.5" /> File
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="url" className="space-y-4 pt-4">
            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="draw-url">Draw URL</Label>
                <Input 
                  id="draw-url" 
                  type="url"
                  value={url} 
                  onChange={e => setUrl(e.target.value)} 
                  placeholder="https://www.nswrl.com.au/draw/?competition=159" 
                  required 
                />
                <p className="text-xs text-muted-foreground">
                  Paste a link to a competition draw page
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Extract Games
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="file" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Upload Image or PDF</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*,.pdf,.txt,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  disabled={isLoading}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  {isLoading ? (
                    <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                  ) : (
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  )}
                  <p className="text-sm text-muted-foreground">
                    {isLoading ? 'Processing...' : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG, PDF, or text files
                  </p>
                </label>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
