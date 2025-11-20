module.exports = {
  apps: [
    {
      name: 'astro-blog',
      script: '/root/.bun/bin/bun',
      args: '/opt/astro-blog/dist/server/entry.mjs',
      cwd: '/opt/astro-blog',
      env: {
        NODE_ENV: 'production',
        HOME: '/root',
        LANG: 'C.UTF-8',
        LC_ALL: 'C.UTF-8',
        PATH: '/root/.bun/bin:/usr/local/btgo/bin:/www/server/nodejs/v22.20.0/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin'
      }
    }
  ]
}
