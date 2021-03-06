const fs = require('fs')
const ViwerProvider = require('./BaseProvider')
const { Vec3 } = require('vec3')

// To use this demo, create a text file '_demo_world_path.txt'
// with the path to a folder containing .mca region files
// for a 1.16 world

const prepareAssets = require('../bridge/prepare')

// TODO: Refactor this to use IPC to pre-generate atlas/blockstate
// data for quick access
async function prepare(version) {
  console.info('Preping...')
  let [uri, blockstates] = await prepareAssets(version)

  return [uri, blockstates]
}

class DemoWorldViewerProvider extends ViwerProvider {
  constructor(version, viewDistance = 4) {
    let center = new Vec3(0, 0, 0)
    super(version, center, viewDistance)
    // this.generator = generator;

    this.World = require('prismarine-world')(version)
    this.Chunk = require('prismarine-chunk')(version)
    this.Anvil = require('prismarine-provider-anvil').Anvil(version)
  }

  async prepare(version) {
    return await prepare(version)
  }

  onStarted() {
    const demo_path = fs.readFileSync(__dirname + '/_demo_world_path.txt', 'utf8')
    this.world = new this.World(null, new this.Anvil(demo_path), 0 /* no saving */)
    super.onStarted()
  }

  async getChunk(chunkX, chunkZ) {
    let cc = await this.world.getColumn(chunkX, chunkZ)
    // console.log('cc', cc)
    return cc 
  }

  async tick() {
    this.saveChunks()
    super.tick()
  }

  getBlock(x, y, z) {
    let [cx, cz] = [x >> 4, z >> 4]
    let cc = this.getChunk(cx, cz)
    return cc.getBlock(new Vec3(x, y, z))
  }

  async setBlock(x, y, z, block) { 
    await this.world.setBlock({ x, y, z }, block)

    super.setBlock(x, y, z, block)
  }

  async setBlockStateId(x, y, z, block) { 
    await this.world.setBlockStateId({ x, y, z }, block)

    super.setBlock(x, y, z, block)
  }
}

module.exports = DemoWorldViewerProvider