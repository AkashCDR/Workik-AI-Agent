import portfinder from 'portfinder';
import { execa } from 'execa';
import { DEFAULT_PORT } from "../constants.js";

export const usePorts = () => {
  const getAvailablePort = async (preferredPort = DEFAULT_PORT) => {
    portfinder.basePort = preferredPort;
    try {
      return await portfinder.getPortPromise();
    } catch (err) {
      console.error("Port finding error:", err);
      return DEFAULT_PORT;
    }
  };

  const killPortProcess = async (port) => {
    try {
      await execa(`npx kill-port ${port}`, { shell: true });
    } catch (e) {
      console.log(`⚠️ Couldn't kill processes on port ${port}`);
    }
  };

  return { getAvailablePort, killPortProcess };
};