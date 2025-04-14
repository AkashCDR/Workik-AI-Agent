import fs from 'fs';
import path from 'path';
import { PROJECTS_DIR } from "../constants.js";

export const useFiles = () => {
  const getUniqueFolderName = (baseName) => {
    let folderName = baseName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    let counter = 1;
    let originalName = folderName;

    while (fs.existsSync(path.join(PROJECTS_DIR, folderName))) {
      folderName = `${originalName}-${counter}`;
      counter++;
    }
    return folderName;
  };

  const cleanupProject = async (folderName) => {
    const projectPath = path.join(PROJECTS_DIR, folderName);
    if (!fs.existsSync(projectPath)) return false;

    try {
      fs.rmSync(projectPath, { recursive: true, force: true });
      return true;
    } catch (err) {
      throw new Error(`File Error: ${err.message}`);
    }
  };

  return { getUniqueFolderName, cleanupProject };
};