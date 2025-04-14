import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { z } from 'zod';
import fs from 'fs';

config();


const __filename = fileURLToPath(import.meta.url); // url to file system path
export const __dirname = path.dirname(path.dirname(__filename)); // Goes up from src folder


export const PROJECTS_DIR = path.join(__dirname, 'projects');

// Create projects directory if it doesn't exist
if (!fs.existsSync(PROJECTS_DIR)) {
  fs.mkdirSync(PROJECTS_DIR);
}

export const DEFAULT_PORT = 3000;

// the schemal which we are expecting to get as a response from gemini
export const projectSchema = z.object({
  files: z.array(z.object({
    name: z.string(),
    content: z.string()
  })),
  commands: z.array(z.string()),
  explanation: z.string(),
  folderName: z.string(),
  port: z.number().optional()
});