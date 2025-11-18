'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { projectsAPI } from '@/lib/api';

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProject();
  }, [id]);

  async function loadProject() {
    try {
      const data = await projectsAPI.get(id);
      setProject(data);
    } catch (error) {
      console.error('Error loading project:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!project) {
    return <div className="text-center py-8">Project not found</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <Link href="/projects" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to Projects
        </Link>
        <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
        {project.description && <p className="text-gray-600">{project.description}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href={`/projects/${id}/prompts`}
          className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition"
        >
          <h2 className="text-xl font-semibold mb-2">Prompts</h2>
          <p className="text-3xl font-bold text-blue-600 mb-2">{project.prompts?.length || 0}</p>
          <p className="text-gray-600 text-sm">Manage prompt templates and versions</p>
        </Link>

        <Link
          href={`/projects/${id}/datasets`}
          className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition"
        >
          <h2 className="text-xl font-semibold mb-2">Datasets</h2>
          <p className="text-3xl font-bold text-blue-600 mb-2">
            {project.evaluationDatasets?.length || 0}
          </p>
          <p className="text-gray-600 text-sm">Evaluation datasets for testing</p>
        </Link>

        <Link
          href={`/projects/${id}/experiments`}
          className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition"
        >
          <h2 className="text-xl font-semibold mb-2">Experiments</h2>
          <p className="text-3xl font-bold text-blue-600 mb-2">
            {project.experiments?.length || 0}
          </p>
          <p className="text-gray-600 text-sm">Run and compare experiments</p>
        </Link>
      </div>

      {/* Recent Items */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Recent Prompts</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {project.prompts?.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
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
                {project.prompts.slice(0, 5).map((prompt: any) => (
                  <tr key={prompt.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{prompt.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{prompt._count?.versions || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
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
            <div className="p-6 text-center text-gray-500">No prompts yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
