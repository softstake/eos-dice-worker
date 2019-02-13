export { }

const { BaseActionWatcher } = require("demux")
const { MassiveActionHandler } = require("demux-postgres")
const { MongoActionReader } = require("demux-eos")

const massive = require("massive")

const updaters = require("./handlers/updaters")
const effects = require("./handlers/effects")

const handlerVersions = {
    versionName: "v1",
    updaters,
    effects,
}

const SchemaName = "sevens"

const { Migration } = require("demux-postgres")

const migrations = [
    new Migration('createBetsTable', SchemaName, 'migrations/migration1.sql'),
]
const migrationSequence = {
    migrations,
    sequenceName: 'init',
}

const dbConfig = {
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'docker',
}

async function start() {
    let db = await massive(dbConfig)

    // сompletely remove schema
    /*try {
        await db.query(
            "DROP SCHEMA $1:raw CASCADE;",
            [SchemaName]
        )
    }
    catch (e) { }*/

    const actionReader = new MongoActionReader(
        "mongodb://mongo:123test@ds223605.mlab.com:23605/bets",
        0, // start at block number
        false,
        600,
        "bets"
    )
    await actionReader.initialize()

    const actionHandler = new MassiveActionHandler(
        [handlerVersions],
        db,
        SchemaName,
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