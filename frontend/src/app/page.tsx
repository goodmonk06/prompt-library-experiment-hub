import Link from 'next/link';

export default function Home() {
  return (
    <div className="text-center py-12">
      <h1 className="text-4xl font-bold mb-4">Prompt Library & Experiment Hub</h1>
      <p className="text-xl text-gray-600 mb-8">
        Manage prompts, versions, and experiments across your LLM projects
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
        <Link
          href="/projects"
          className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition"
        >
          <h2 className="text-lg font-semibold mb-2">Projects</h2>
          <p className="text-gray-600 text-sm">Organize your work by project</p>
        </Link>
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Prompts</h2>
          <p className="text-gray-600 text-sm">Version control for prompts</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Datasets</h2>
          <p className="text-gray-600 text-sm">Evaluation data management</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Experiments</h2>
          <p className="text-gray-600 text-sm">Run and compare evaluations</p>
        </div>
      </div>
    </div>
  );
}
