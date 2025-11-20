module.exports = {
  apps: [
    {
      user: 'root',
      name: 'astro-blog',
      script: '/root/.bun/bin/bun',
      args: '/opt/astro-blog/dist/server/entry.mjs',
      cwd: '/opt/astro-blog',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}
