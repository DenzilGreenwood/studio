import { ai } from '@/ai/genkit';

// Import all flows to register them
import '@/ai/flows/cognitive-edge-protocol';
import '@/ai/flows/clarity-summary-generator';
import '@/ai/flows/sentiment-analysis-flow';
import '@/ai/flows/goal-generator-flow';

export async function GET() {
  return new Response('Genkit flows are registered and ready', { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    return NextResponse.json({
      status: 'received',
      message: 'Genkit POST request processed',
      data: body
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}