const ShareDB = require('sharedb')
const sharedbMongo = require('sharedb-mongo')

const {MONGO_URL, COLLECTION, ID} = getTestParams()
const backend = new ShareDB({db: sharedbMongo(MONGO_URL)})
const connection = backend.connect()

async function getVersions (backend, collection, id, {debug} = {debug: false}) {

  debug && console.log('Get collection:', collection, 'id:', id || 'ALL')
  
  const promisify = (fn) => new Promise((resolve, reject) => fn((err, data) => err ? reject(err) : resolve(data)))

  let query = id ? {_id: id} : {}
  let docs = await promisify(cb => connection.createFetchQuery(collection, query, null, cb))

  debug && console.log('Got results')

  for (let doc of docs) {
    let {id, version} = doc
    debug && logTitle({id, version})

    for (let v = 1; v <= version; v++) {
      let snapshot = await promisify(cb => connection.fetchSnapshot(collection, id, v, cb))
      let {data} = snapshot
      debug && logRecord(`Version ${v}`, data)
    }
  }
}

getVersions(backend, COLLECTION, ID, {debug: true})
  .then(() => process.exit())

// HELPER FUNCTIONS

function logTitle (title) {
  console.log('\n\n\n===============================================================')
  console.log(' ', title)
  console.log('===============================================================')
}

function logRecord (name, data) {
  console.log(`\n  ${name}:\n---------------`)
  console.log(data)
}

function getTestParams () {

  // local database to connect to (unless MONGO_URL is specified)
  const DB = process.env.DB || 'cpm'

  // full MONGO_URL to connect to
  const MONGO_URL = process.env.MONGO_URL || `mongodb://localhost:27017/${DB}`

  // collection
  const COLLECTION = process.env.COLLECTION || 'properties'

  // particular document id to get versions for. Otherwise it will get versions for all docs in collection.
  const ID = process.env.ID || undefined

  let params = {MONGO_URL, COLLECTION, ID}
  console.log('PARAMS', params)
  return params
}