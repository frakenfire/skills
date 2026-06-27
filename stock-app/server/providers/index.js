import * as sim from './sim.js'
import * as twelvedata from './twelvedata.js'
import * as kis from './kis.js'

const PROVIDERS = { sim, twelvedata, kis }

// DATA_PROVIDER 환경변수로 선택. 알 수 없으면 sim.
export function getProvider(nameOrEnv) {
  const key = nameOrEnv || process.env.DATA_PROVIDER || 'sim'
  return PROVIDERS[key] || sim
}
