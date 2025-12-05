module.exports = {
  apps: [
    {
      uid: 0,
      name: 'astro-theme-pure',
      script: 'node',
      args: '/opt/astro-theme-pure/dist/server/entry.mjs',
      cwd: '/opt/astro-theme-pure',
      env: {
        NODE_ENV: 'production',
        HOME: '/root',
        USER: 'root',
        LOGNAME: 'root',
        PWD: '/opt/astro-theme-pure',
        SHELL: '/bin/bash',
        LANG: 'C.UTF-8',
        LC_ALL: 'C.UTF-8',
        PATH: '/www/server/nodejs/v22.20.0/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin'
      },
      merge_logs: true
    }
  ]
}
