import { warmupAppModeCache } from '../utils/app-mode-resolver';

export default defineNitroPlugin(async () => {
    const config = useRuntimeConfig();

    // Skip warmup if mode is statically set via ENV
    if (config.appMode) {
        console.log(`[app-mode] Static mode from ENV: ${config.appMode}`);
        return;
    }

    await warmupAppModeCache();
});
