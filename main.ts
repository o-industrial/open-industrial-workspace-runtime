import { start } from '@fathym/eac/runtime/server';
import { config, configure } from './configs/eac-runtime.config.ts';

console.log("===========================================>Let's Go")

await start(await config, { configure });
