export { }

const { BaseActionWatcher } = require("demux")
const { MassiveActionHandler } = require("demux-postgres")
const { MongoActionReader } = require("demux-eos")
const { Migration } = require("demux-postgres")
const massive = require("massive")

const mongoEndpoint = process.env.MONGO_URI
const mongoName = process.env.MONGO_NAME
const pgHost = process.env.PG_HOST
const pgPort = process.env.PG_PORT
const pgName = process.env.PG_NAME
const pgUser = process.env.PG_USER
const pgPwd = process.env.PG_PWD

if (mongoEndpoint == "" || mongoName == "" || pgHost == "" || pgPort == "" || pgName == "" || pgUser == "" || pgPwd == "") {
    throw new Error("Some of required ENV vars are empty. The vars are: MONGO_URI, MONGO_NAME, PG_HOST, PG_PORT, PG_NAME, PG_USER, PG_PWD")
}

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