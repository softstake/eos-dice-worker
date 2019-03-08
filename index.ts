export { }

const { BaseActionWatcher } = require("demux")
const { MassiveActionHandler } = require("demux-postgres")
const { MongoActionReader } = require("demux-eos")
const { Migration } = require("demux-postgres")
const massive = require("massive")


const mongoHost = process.env.MONGO_HOST
const mongoPort = process.env.MONGO_PORT
const mongoName = process.env.MONGO_NAME
const mongoUser = process.env.MONGO_USER
const mongoPwd = process.env.MONGO_PWD

const pgHost = process.env.PG_HOST
const pgPort = process.env.PG_PORT
const pgName = process.env.PG_NAME
const pgUser = process.env.PG_USER
const pgPwd = process.env.PG_PWD

const apiUrl = process.env.EOS_API_URL
const privateKey = process.env.KEY

if (mongoHost == "" || mongoPort == "" || mongoName == "" || mongoUser == "" || mongoPwd == "" || pgHost == "" || pgPort == "" || pgName == "" || pgUser == "" || pgPwd == "" || apiUrl == "" || privateKey == "") {
    throw new Error("Some of required ENV vars are empty. The vars are: MONGO_HOST, MONGO_PORT, MONGO_NAME, MONGO_NAME, MONGO_USER, MONGO_PWD, PG_HOST, PG_PORT, PG_NAME, PG_USER, PG_PWD, EOS_API_URL, KEY")
}

const mongoEndpoint = 'mongodb://'+mongoUser+':'+mongoPwd+'@'+mongoHost+':'+mongoPort+'/'+mongoName

const PgSchemaName = "public"

const updaters = require("./handlers/updaters")
const effects = require("./handlers/effects")

const handlerVersions = {
    versionName: "v1",
    updaters,
    effects,
}

const migrations = [
    new Migration('createBetsTable', PgSchemaName, 'migrations/migration1.sql'),
]
const migrationSequence = {
    migrations,
    sequenceName: 'init',
}

const dbConfig = {
    host: pgHost,
    port: pgPort,
    database: pgName,
    user: pgUser,
    password: pgPwd,
}


async function start() {
    let db = await massive(dbConfig)

    // сompletely remove schema
    // try {
    //     await db.query(
    //         "DROP SCHEMA $1:raw CASCADE;",
    //         [PgSchemaName]
    //     )
    // }
    // catch (e) { }

    const actionReader = new MongoActionReader(
        mongoEndpoint,
        0, // start at block number
        false,
        600,
        mongoName
    )
    await actionReader.initialize()

    const actionHandler = new MassiveActionHandler(
        [handlerVersions],
        db,
        PgSchemaName,
        [migrationSequence]
    )

    await actionHandler.setupDatabase()

    const actionWatcher = new BaseActionWatcher(
        actionReader,
        actionHandler,
        500
    )
    actionWatcher.watch()
}

start()