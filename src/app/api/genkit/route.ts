import { createNextHandler } from '@genkit-ai/next';
import { ai } from '@/ai/genkit';

const handler = createNextHandler(ai);

export { handler as GET, handler as POST };