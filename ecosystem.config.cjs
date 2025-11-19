module.exports = {
  apps: [
    {
      name: "astro-blog",
      script: "/root/.bun/bin/bun",
      args: "run start -- /opt/astro-blog/dist/server/entry.mjs",
      cwd: "/opt/astro-blog",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
