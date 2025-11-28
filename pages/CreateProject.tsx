import React, { useState } from 'react';
import { api } from '../services/api';
import { Button, Card, Input, TextArea, Select, FileUploadZone } from '../components/UIComponents';
import { ArrowLeft } from 'lucide-react';
import { Priority } from '../types';

interface CreateProjectProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const CreateProject: React.FC<CreateProjectProps> = ({ onBack, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    editing_style: 'Corporate',
    platforms: [] as string[],
    aspect_ratio: '16:9',
    desired_duration_seconds: 60,
    priority: 'normal' as Priority,
    due_date: '',
    reference_links: '',
    notes_for_editor: ''
  });
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handlePlatformChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value);
    setFormData(prev => ({ ...prev, platforms: options }));
  };

  const handleFileSelect = (fileList: FileList | null) => {
    if (fileList) {
      setFiles(prev => [...prev, ...Array.from(fileList)]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Create Project
      const project = await api.projects.create({
        ...formData,
        reference_links: formData.reference_links.split(',').map(s => s.trim()).filter(Boolean),
        due_date: new Date(formData.due_date).toISOString()
      });

      // 2. Upload Files
      if (files.length > 0) {
        await Promise.all(files.map(f => api.files.upload(project.id, f, 'raw')));
      }

      onSuccess();
    } catch (err) {
      console.error(err);
      alert('Failed to create project. Please ensure you are logged in and have permissions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in-up">
      <button onClick={onBack} className="flex items-center text-sm text-slate-500 hover:text-indigo-600 mb-6">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
      </button>

      <Card className="p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Create New Project</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input 
            id="title" 
            label="Project Title" 
            value={formData.title} 
            onChange={handleChange} 
            placeholder="e.g. Summer Campaign Launch"
            required
          />

          <TextArea 
            id="description" 
            label="Description / Brief" 
            value={formData.description} 
            onChange={handleChange} 
            placeholder="Describe what you need..."
            required
            rows={4}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select 
              id="editing_style" 
              label="Editing Style" 
              options={[
                { label: 'Corporate', value: 'Corporate' },
                { label: 'Cinematic', value: 'Cinematic' },
                { label: 'Vlog / YouTube', value: 'Vlog' },
                { label: 'Social Media / Reels', value: 'Reels' },
                { label: 'Ads / Commercial', value: 'Commercial' },
              ]}
              value={formData.editing_style} 
              onChange={handleChange} 
            />

            <Select 
               id="priority"
               label="Priority"
               options={[
                 { label: 'Normal', value: 'normal' },
                 { label: 'High', value: 'high' },
                 { label: 'Urgent', value: 'urgent' },
               ]}
               value={formData.priority}
               onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Select 
                id="aspect_ratio"
                label="Aspect Ratio"
                options={[
                  { label: '16:9 (Landscape)', value: '16:9' },
                  { label: '9:16 (Portrait)', value: '9:16' },
                  { label: '1:1 (Square)', value: '1:1' },
                  { label: '4:5 (IG Feed)', value: '4:5' },
                ]}
                value={formData.aspect_ratio}
                onChange={handleChange}
            />
            
            <Input 
              id="desired_duration_seconds"
              label="Duration (seconds)"
              type="number"
              value={formData.desired_duration_seconds}
              onChange={handleChange}
            />

            <Input 
              id="due_date"
              label="Due Date"
              type="date"
              value={formData.due_date}
              onChange={handleChange}
              required
            />
          </div>

          <TextArea 
            id="reference_links"
            label="Reference Links (comma separated)"
            value={formData.reference_links}
            onChange={handleChange}
            placeholder="https://youtube.com/..., https://vimeo.com/..."
            rows={2}
          />
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Raw Footage</label>
            <FileUploadZone onFileSelect={handleFileSelect} label="Upload raw footage" />
            {files.length > 0 && (
              <ul className="mt-2 text-sm text-slate-600">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center">
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded mr-2">Ready</span>
                    {f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
             <Button variant="secondary" type="button" onClick={onBack} className="mr-3">Cancel</Button>
             <Button type="submit" isLoading={loading}>Create Project</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};