'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { promptsAPI, projectsAPI } from '@/lib/api';

export default function PromptsPage() {
  const params = useParams();
  const id = params.id as string;
  const [project, setProject] = useState<any>(null);
  const [prompts, setPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      const [projectData, promptsData] = await Promise.all([
        projectsAPI.get(id),
        promptsAPI.list(id),
      ]);
      setProject(projectData);
      setPrompts(promptsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await promptsAPI.create({ projectId: id, ...formData });
      setFormData({ name: '', description: '' });
      setShowForm(false);
      loadData();
    } catch (error) {
      console.error('Error creating prompt:', error);
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <Link href={`/projects/${id}`} className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to {project?.name}
        </Link>
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Prompts</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : 'New Prompt'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 p-4 bg-white rounded-lg shadow">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              rows={3}
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Create Prompt
          </button>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {prompts.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Versions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {prompts.map((prompt) => (
                <tr key={prompt.id}>
                  <td className="px-6 py-4">{prompt.name}</td>
                  <td className="px-6 py-4 text-gray-600">{prompt.description || '-'}</td>
                  <td className="px-6 py-4">{prompt._count?.versions || 0}</td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/projects/${id}/prompts/${prompt.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-6 text-center text-gray-500">
            No prompts yet. Create your first prompt!
          </div>
        )}
      </div>
    </div>
  );
}
