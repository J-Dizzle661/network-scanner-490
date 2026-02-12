const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const { chmodSync } = require('fs');
const path = require('path');

module.exports = {
  packagerConfig: {
    asar: true,
    extraResource: [
      'resources/backend/backend_build_mac',
    ],
  },
  rebuildConfig: {},
  makers: [
    // {
    //   name: '@electron-forge/maker-dmg',  // macOS DMG installer
    //   config: {}
    // },
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-vite',
      config: {
        // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
        // If you are familiar with Vite configuration, it will look really familiar.
        build: [
          {
            // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
            entry: 'src/main/main.js',
            config: 'vite.main.config.mjs',
            target: 'main',
          },
          {
            entry: 'src/main/preload.js',
            config: 'vite.preload.config.mjs',
            target: 'preload',
          },
        ],
        renderer: [
          {
            name: 'main_window',
            config: 'vite.renderer.config.mjs',
          },
        ],
      },
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  hooks: {
    // Hook runs after packaging
    postPackage: async (forgeConfig, options) => {

      // On macOS and Linux, use "chmod" command to ensure the backend
      // binary has execute permissions

      // skip chmod on Windows
      if (process.platform !== 'darwin' && process.platform !== 'linux') {
        return;
      }

      // Loop through each output path
      for (const appPath of options.outputPaths) {
        const backendPath = path.join(
          appPath,
          'network-scanner.app',
          'Contents',
          'Resources',
          'backend_build_mac'
        );

        // Apply "chmod" command to ensure execute permissions
        chmodSync(backendPath, 0o755);
      }
    }
  }
};
