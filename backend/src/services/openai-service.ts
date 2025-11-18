import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface RunPromptParams {
  model: string;
  prompt: string;
  input: Record<string, any>;
}

/**
 * Replace template variables in prompt with input values
 * Example: "Hello {{name}}" with { name: "World" } => "Hello World"
 */
function renderTemplate(template: string, input: Record<string, any>): string {
  let rendered = template;
  for (const [key, value] of Object.entries(input)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    rendered = rendered.replace(regex, String(value));
  }
  return rendered;
}

/**
 * Run a prompt through OpenAI with given input
 */
export async function runPrompt(params: RunPromptParams): Promise<string> {
  const { model, prompt, input } = params;

  const renderedPrompt = renderTemplate(prompt, input);

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: 'user',
        content: renderedPrompt,
      },
    ],
    temperature: 0.7,
  });

  return completion.choices[0]?.message?.content || '';
}

/**
 * LLM-as-Judge scoring
 */
export async function scoreWithLLM(params: {
  input: Record<string, any>;
  output: string;
  expectedOutput?: string;
}): Promise<{ score: number; reasoning: string }> {
  const { input, output, expectedOutput } = params;

  const judgePrompt = `You are an expert evaluator. Rate the quality of the following LLM output on a scale of 0-100.

Input: ${JSON.stringify(input, null, 2)}

${expectedOutput ? `Expected Output: ${expectedOutput}\n\n` : ''}Actual Output: ${output}

Provide a score (0-100) and brief reasoning. Format your response as JSON:
{
  "score": <number>,
  "reasoning": "<your explanation>"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: judgePrompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
    return {
      score: result.score || 0,
      reasoning: result.reasoning || 'No reasoning provided',
    };
  } catch (error) {
    console.error('LLM judge scoring error:', error);
    return {
      score: 0,
      reasoning: 'Error during LLM evaluation',
    };
  }
}
