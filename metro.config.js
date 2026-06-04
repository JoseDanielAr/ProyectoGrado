const path = require('path')
const { getDefaultConfig } = require('expo/metro-config')

const projectRoot = __dirname

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot)

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('@/')) {
    const targetPath = path.join(projectRoot, moduleName.slice(2))
    return context.resolveRequest(context, targetPath, platform)
  }

  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
