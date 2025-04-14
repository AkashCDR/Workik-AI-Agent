import inquirer from 'inquirer';
import { useAI } from './hooks/useAI.js';
import { useFiles } from './hooks/useFiles.js';
import { usePorts } from './hooks/usePorts.js';
import { useCommands } from './hooks/useCommands.js';
import { __dirname, DEFAULT_PORT } from './constants.js';
import path from 'path';
import fs from 'fs';
import { PROJECTS_DIR } from './constants.js';


const { generateProject } = useAI(process.env.GEMINI_API_KEY);
const { getUniqueFolderName, cleanupProject } = useFiles();
const { getAvailablePort, killPortProcess } = usePorts();
const { execute } = useCommands();


async function setupProject(project) {
  // Ensure unique folder name
  project.folderName = getUniqueFolderName(project.folderName);
  const projectPath = path.join(PROJECTS_DIR, project.folderName);
  
  // Handle port conflicts
  const portCommand = project.commands.find(cmd => cmd.includes('--port'));
  if (portCommand) {
    const portMatch = portCommand.match(/--port (\d+)/);
    if (portMatch) {
      const requestedPort = parseInt(portMatch[1]);
      const availablePort = await getAvailablePort(requestedPort);
      
      if (availablePort !== requestedPort) {
        console.log(`⚠️ Port ${requestedPort} in use, using ${availablePort} instead`);
        project.port = availablePort;
        project.commands = project.commands.map(cmd => 
          cmd.replace(/--port \d+/, `--port ${availablePort}`)
        );
        
        // Update port in package.json if exists
        const pkgFile = project.files.find(f => f.name === 'package.json');
        if (pkgFile) {
          const pkg = JSON.parse(pkgFile.content);
          if (pkg.scripts?.start) {
            pkg.scripts.start = pkg.scripts.start.replace(
              /--port \d+/, 
              `--port ${availablePort}`
            );
            pkgFile.content = JSON.stringify(pkg, null, 2);
          }
        }
      }
    }
  }

  // Create project folder
  fs.mkdirSync(projectPath, { recursive: true });
  console.log(`📁 Created project folder: ${project.folderName}`);

  // Create all files
  for (const file of project.files) {
    const filePath = path.join(projectPath, file.name);
    const dir = path.dirname(filePath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, file.content);
    console.log(`📄 Created ${file.name}`);
  }

  // Execute commands
  for (const cmd of project.commands) {
    const success = await execute(cmd, project.folderName);
    if (!success) {
      console.log(`\n💡 Try running manually in the project folder:`);
      console.log(`   cd ${project.folderName} && ${cmd}\n`);
      return false;
    }
  }
  
  return true;
}

async function mainMenu() {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Main Menu:',
      choices: [
        { name: '🛠️  Create new project', value: 'create' },
        { name: '🧹 Cleanup project', value: 'cleanup' },
        { name: '🚪 Exit', value: 'exit' }
      ]
    }
  ]);
  return action;
}

async function handleCleanup() {
  // When listing projects for cleanup (in handleCleanup function):
  const projects = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true })  
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);

  if (projects.length === 0) {
    console.log("ℹ️ No projects found to cleanup");
    return;
  }

  const { folderName } = await inquirer.prompt([
    {
      type: 'list',
      name: 'folderName',
      message: 'Select project to cleanup:',
      choices: projects
    }
  ]);

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Are you sure you want to delete ${folderName}?`,
      default: false
    }
  ]);

  if (confirm) {
    // Kill any running processes first
    const packageJsonPath = path.join(__dirname, folderName, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath));
      if (pkg.scripts?.start) {
        const portMatch = pkg.scripts.start.match(/--port (\d+)/);
        if (portMatch) {
          await killPortProcess(parseInt(portMatch[1]));
        }
      }
    }
    
    const success = await cleanupProject(folderName);
    if (success) {
      console.log(`🧹 Successfully deleted ${folderName}`);
    }
  }
}

async function handleProjectCreation() {
  const { task } = await inquirer.prompt([
    {
      type: 'input',
      name: 'task',
      message: 'Describe your project:',
      validate: input => input.trim() ? true : 'Please enter a description'
    }
  ]);

  console.log("\n🤖 Generating project...");
  let project;
  try {
    project = await generateProject(task);
  } catch (err) {
    console.error("\n❌ Failed to generate project:", err.message);
    return;
  }
  
  console.log("\n📝 Project Overview:");
  console.log(project.explanation);
  console.log("\n📂 Project Location:");
  console.log(`• Folder: ${project.folderName}`);
  if (project.port) console.log(`• Port: ${project.port}`);
  console.log("\n⚡ Commands to run:");
  console.log(project.commands.map(c => `$ ${c}`).join('\n'));
  
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Proceed with project creation?',
      default: true
    }
  ]);
  
  if (!confirm) {
    console.log("🚫 Project creation cancelled\n");
    return;
  }

  console.log("\n🚀 Setting up project...");
  const success = await setupProject(project);
  
  if (success) {
    console.log("\n✅ Project created successfully!");
    console.log(`👉 Access your project: cd ${project.folderName}`);
    if (project.port) console.log(`🌐 Server running on port: ${project.port}`);
    console.log("");
  }
}

async function checkDependencies() {
  try {
    // Check if kill-port is available
    await execute('npx kill-port --version', process.cwd());
  } catch {
    console.log("Installing kill-port...");
    try {
      await execute('npm install kill-port', process.cwd());
    } catch (err) {
      console.log("⚠️ Couldn't install kill-port automatically");
      console.log("💡 Please install it manually with: npm install -g kill-port");
    }
  }
}

async function main() {
  console.log("🚀 Advanced AI Project Generator");
  console.log("──────────────────────────────");
  
  await checkDependencies();

  while (true) {
    try {
      const action = await mainMenu();
      
      if (action === 'exit') break;
      
      if (action === 'cleanup') {
        await handleCleanup();
        continue;
      }

      await handleProjectCreation();
    } catch (error) {
      console.error("\n❌ Error:", error.message);
      console.log("Please try again\n");
    }
  }
  
  console.log("\n👋 Thank you for using the AI Project Generator!");
}


main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});