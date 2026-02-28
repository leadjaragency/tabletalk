import dotenv from 'dotenv';
import { streamChat } from './src/lib/anthropic';

// load .env.local
// the workspace root is one level up so specify path accordingly
dotenv.config({ path: 'tabletalk/.env.local' });

async function run() {
  try {
    const messages = [{ role: 'user' as const, content: 'Say hello' }];
    const stream = streamChat('You are a helpful assistant.', messages);
    let final;
    for await (const event of stream) {
      if (event.type === 'response.delta') {
        process.stdout.write(event.delta);
      } else if (event.type === 'response.completed') {
        final = event;
      }
    }
    console.log('\n--- done streaming ---');
    console.log('final event:', final);
  } catch (err) {
    console.error('error', err);
  }
}

run();
