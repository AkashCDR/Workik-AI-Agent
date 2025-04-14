import { GoogleGenerativeAI } from "@google/generative-ai";
import { projectSchema } from "../constants.js";

export const useAI = (apiKey) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

  const generateProject = async (taskDescription) => {
    const prompt = `You are an AI development assistant. The user wants to: ${taskDescription}
  
  Requirements:
  1. Generate a suitable folder name (lowercase, hyphenated)
  2. Include complete installation/start commands
  3. For web projects, suggest a port number (default 3000)
  4. All paths should be relative to project folder
  5.Use the latest versions of all dependencies to avoid deprecated packages
  
  Respond with this exact JSON format:
  {
    "folderName": "unique-project-name",
    "files": [
      {"name": "relative/path/to/file", "content": "complete code"},
      {"name": "another/file", "content": "complete code"}
    ],
    "commands": ["npm install", "npm start --port 3000"],
    "explanation": "Project description",
    "port": 3000
  }`; 
    
    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { 
          response_mime_type: "application/json",
          temperature: 0.3
        }
      });
      
      const response = await result.response;
      const text = response.text();
      const cleanJson = text.replace(/```json|```/g, '').trim();
      return projectSchema.parse(JSON.parse(cleanJson));
    } catch (err) {
      throw new Error(`AI Error: ${err.message}`);
    }
  };

  return { generateProject };
};