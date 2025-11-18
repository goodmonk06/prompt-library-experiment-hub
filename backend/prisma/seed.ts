import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data (in development)
  await prisma.experimentResultItem.deleteMany();
  await prisma.experimentRun.deleteMany();
  await prisma.experiment.deleteMany();
  await prisma.evaluationItem.deleteMany();
  await prisma.evaluationDataset.deleteMany();
  await prisma.promptVersion.deleteMany();
  await prisma.prompt.deleteMany();
  await prisma.project.deleteMany();

  // Create demo project
  const project = await prisma.project.create({
    data: {
      name: 'Customer Support Automation',
      description: 'AI-powered customer support response generation and evaluation',
    },
  });

  console.log(`✓ Created project: ${project.name}`);

  // Create prompts
  const supportPrompt = await prisma.prompt.create({
    data: {
      projectId: project.id,
      name: 'Support Response Generator',
      description: 'Generates helpful customer support responses',
    },
  });

  const summaryPrompt = await prisma.prompt.create({
    data: {
      projectId: project.id,
      name: 'Ticket Summary Generator',
      description: 'Creates concise summaries of support tickets',
    },
  });

  console.log(`✓ Created ${2} prompts`);

  // Create prompt versions
  const supportV1 = await prisma.promptVersion.create({
    data: {
      promptId: supportPrompt.id,
      versionTag: 'v1.0',
      templateText: `You are a helpful customer support agent. Answer the following question professionally and concisely:

Question: {{question}}

Provide a clear and friendly response.`,
    },
  });

  const supportV2 = await prisma.promptVersion.create({
    data: {
      promptId: supportPrompt.id,
      versionTag: 'v2.0',
      templateText: `You are an expert customer support agent for a SaaS product.

Customer Question: {{question}}

Instructions:
- Be empathetic and professional
- Provide step-by-step guidance when applicable
- Keep the response concise but complete
- If you need more information, ask clarifying questions

Response:`,
    },
  });

  const summaryV1 = await prisma.promptVersion.create({
    data: {
      promptId: summaryPrompt.id,
      versionTag: 'v1.0',
      templateText: `Summarize the following support ticket in one sentence:

{{ticket}}

Summary:`,
    },
  });

  console.log(`✓ Created ${3} prompt versions`);

  // Create evaluation dataset
  const dataset = await prisma.evaluationDataset.create({
    data: {
      projectId: project.id,
      name: 'Common Support Questions',
      description: 'Frequently asked questions from customers',
      specJson: JSON.stringify({
        inputSchema: {
          question: 'string',
        },
        outputSchema: {
          type: 'string',
          description: 'Support response text',
        },
      }),
    },
  });

  // Create evaluation items
  const evaluationItems = await prisma.evaluationItem.createMany({
    data: [
      {
        datasetId: dataset.id,
        inputJson: JSON.stringify({ question: 'How do I reset my password?' }),
        expectedOutputJson: JSON.stringify(
          'To reset your password, click on "Forgot Password" on the login page and follow the instructions sent to your email.'
        ),
        tagsJson: JSON.stringify({ category: 'authentication', difficulty: 'easy' }),
      },
      {
        datasetId: dataset.id,
        inputJson: JSON.stringify({ question: 'What are your business hours?' }),
        expectedOutputJson: JSON.stringify('We are available Monday-Friday, 9 AM - 5 PM EST.'),
        tagsJson: JSON.stringify({ category: 'general', difficulty: 'easy' }),
      },
      {
        datasetId: dataset.id,
        inputJson: JSON.stringify({
          question: 'My payment failed. What should I do?',
        }),
        expectedOutputJson: JSON.stringify(
          'Please verify your payment method details and try again. If the issue persists, contact your bank or use an alternative payment method.'
        ),
        tagsJson: JSON.stringify({ category: 'billing', difficulty: 'medium' }),
      },
      {
        datasetId: dataset.id,
        inputJson: JSON.stringify({
          question: 'Can I export my data?',
        }),
        expectedOutputJson: JSON.stringify(
          'Yes! Go to Settings > Data Export and choose your preferred format (CSV or JSON).'
        ),
        tagsJson: JSON.stringify({ category: 'features', difficulty: 'easy' }),
      },
      {
        datasetId: dataset.id,
        inputJson: JSON.stringify({
          question: 'How do I upgrade my plan?',
        }),
        expectedOutputJson: JSON.stringify(
          'Navigate to Account Settings > Billing > Change Plan, select your desired plan, and confirm the upgrade.'
        ),
        tagsJson: JSON.stringify({ category: 'billing', difficulty: 'easy' }),
      },
      {
        datasetId: dataset.id,
        inputJson: JSON.stringify({
          question: 'The app is loading very slowly. Help!',
        }),
        expectedOutputJson: JSON.stringify(
          'Try clearing your browser cache and cookies. If the issue persists, check your internet connection or try using a different browser.'
        ),
        tagsJson: JSON.stringify({ category: 'technical', difficulty: 'medium' }),
      },
    ],
  });

  await prisma.evaluationDataset.update({
    where: { id: dataset.id },
    data: { itemCount: evaluationItems.count },
  });

  console.log(`✓ Created dataset with ${evaluationItems.count} items`);

  // Create experiments
  const experimentGpt35 = await prisma.experiment.create({
    data: {
      projectId: project.id,
      name: 'GPT-3.5 Baseline',
      description: 'Baseline experiment using GPT-3.5 Turbo',
      model: 'gpt-3.5-turbo',
    },
  });

  const experimentGpt4 = await prisma.experiment.create({
    data: {
      projectId: project.id,
      name: 'GPT-4 Comparison',
      description: 'Testing with GPT-4 for higher quality responses',
      model: 'gpt-4',
    },
  });

  console.log(`✓ Created ${2} experiments`);

  // Create a sample experiment run (without actually running it)
  const sampleRun = await prisma.experimentRun.create({
    data: {
      experimentId: experimentGpt35.id,
      promptVersionId: supportV1.id,
      datasetId: dataset.id,
      status: 'completed',
      startedAt: new Date(Date.now() - 3600000), // 1 hour ago
      finishedAt: new Date(),
      metricsJson: JSON.stringify({
        totalItems: 6,
        avgSimilarity: 0.78,
        exactMatchRate: 0.33,
      }),
    },
  });

  console.log(`✓ Created sample experiment run`);

  console.log('\n✅ Seeding complete!');
  console.log('\nDemo credentials:');
  console.log('- Project ID:', project.id);
  console.log('- Navigate to http://localhost:3000/projects to see the dashboard');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
