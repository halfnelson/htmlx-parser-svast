/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
    mount: {
      public: '/',
      src: '/dist',
    },
    plugins: ['@snowpack/plugin-typescript'],
    install: [
      /* ... */
    ],
    installOptions: {
      installTypes: true,
    },
    devOptions: {
      /* ... */
    },
    buildOptions: {
      /* ... */
    },
    proxy: {
      /* ... */
    },
    alias: {
      /* ... */
    },
  };