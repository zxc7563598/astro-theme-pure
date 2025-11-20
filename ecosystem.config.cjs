module.exports = {
  apps: [
    {
      name: 'astro-blog',
      script: '/root/.bun/bin/bun',
      args: '/opt/astro-blog/dist/server/entry.mjs',
      cwd: '/opt/astro-blog',
      env: {
        NODE_ENV: 'production',
        GIT_SSH_COMMAND: 'ssh -i /root/.ssh/id_rsa',
        GIT_SSL_NO_VERIFY: '0',
        HOME: '/root',
        USER: 'root',
        LOGNAME: 'root',
        PWD: '/opt/astro-blog',
        SHELL: '/bin/bash',
        TERM: 'xterm-256color'
      }
    }
  ]
}
