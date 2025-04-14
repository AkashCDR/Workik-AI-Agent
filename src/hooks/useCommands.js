import { execa } from 'execa';
import { __dirname } from "../constants.js";

export const useCommands = () => {
  const execute = async (cmd, cwd) => {
    console.log(`$ ${cmd}`);
    try {
      const { stdout, stderr } = await execa(cmd, { 
        shell: true,
        cwd: path.join(__dirname, cwd) 
      });
      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);
      return true;
    } catch (error) {
      console.error(`❌ Error executing command: ${error.message}`);
      return false;
    }
  };

  return { execute };
};