#!/usr/bin/env node

/**
 * ./deploy.js -h host -u username
 */

/* eslint-disable no-console */

const path = require('path')
const rmtcmd = require('rmtcmd')

async function deploy({ config, remote, local }) {
  await local('npm test', { cwd: __dirname })

  const target = '/var/www/mzm-auth'
  const tmpDir = '/tmp/mzm-auth'
  const src = path.join(__dirname, 'dist')

  await remote(`sudo mkdir -p ${target}`)
  await remote(`sudo mkdir -p ${tmpDir}`)
  await remote(`sudo chown -R ${config.username} ${tmpDir}`)

  await local('npm run build', { cwd: __dirname })
  await local(`cp package.json ${src}`, { cwd: __dirname })
  await local(`cp package-lock.json ${src}`, { cwd: __dirname })

  await local(
    [
      `rsync -av`,
      `--exclude='node_modules'`,
      `--exclude='.env'`,
      `-e 'ssh -i ${config.privateKeyPath}'`,
      `${src}/`,
      `${config.username}@${config.host}:${tmpDir}/`
    ].join(' '),
    {
      cwd: __dirname
    }
  )

  await remote(`sudo rsync -av --exclude='.env' ${tmpDir}/ ${target}/`)
  await remote(`cd ${target} && sudo npm install --production`)
  await remote(`sudo systemctl restart mzm-auth`)
}

;(async () => {
  const args = await rmtcmd.cli.getArgs()
  await rmtcmd.connect({ ...args, task: deploy })
})().catch(console.error)
