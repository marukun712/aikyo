#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

// Parse command line arguments to find --config parameter
function getConfigName(): string {
  const args = process.argv;
  
  // Look for --config=value format
  for (const arg of args) {
    if (arg.startsWith('--config=')) {
      return arg.split('=')[1];
    }
  }
  
  // Look for --config value format
  const configIndex = args.indexOf('--config');
  if (configIndex !== -1 && configIndex + 1 < args.length) {
    return args[configIndex + 1];
  }
  
  // Check npm_config_config environment variable as fallback
  if (process.env.npm_config_config) {
    return process.env.npm_config_config;
  }
  
  throw new Error('No config specified. Please use --config=<config_name> (e.g., --config=polka)');
}

function main() {
  try {
    const configName = getConfigName();
    const companionPath = join(process.cwd(), 'configs', configName, 'companion.ts');
    
    // Verify the companion file exists
    if (!existsSync(companionPath)) {
      console.error(`Error: Config '${configName}' not found. Expected file: ${companionPath}`);
      console.error('Available configs: polka, mai, hanabi');
      process.exit(1);
    }
    
    console.log(`Starting companion with config: ${configName}`);
    
    // Execute tsx with the companion file
    const child = spawn('npx', ['tsx', companionPath], {
      stdio: 'inherit',
      shell: true
    });
    
    child.on('close', (code) => {
      process.exit(code || 0);
    });
    
    child.on('error', (error) => {
      console.error('Failed to start companion:', error);
      process.exit(1);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Check if this file is being run directly
if (process.argv[1] === __filename) {
  main();
}