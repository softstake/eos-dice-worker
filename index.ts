const { BaseActionWatcher } = require("demux")
const { MassiveActionHandler } = require("demux-postgres")
const { MongoActionReader } = require("demux-eos")

const massive = require("massive")

const handlerVersion = require("./handlerVersions")
//const effects = require("./effects")

const { Migration } = require("demux-postgres")

const dbConfig = {
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'docker',
}

const migrations = [
    new Migration('createBetsTable', 'demux', 'migration1.sql'),
]
const migrationSequence = {
    migrations,
    sequenceName: 'init',
}

async function start() {
    let db = await massive(dbConfig)
    try {
        await db.query(
            "DROP SCHEMA $1:raw CASCADE;",
            ['demux']
        )
    }
    catch (e) { }

    const actionReader = new MongoActionReader(
        "mongodb://mongo:123test@ds223605.mlab.com:23605/bets",
        13728729, //13698164, //13685724, //13049037, //12965659, //12939520, //12936698, //12932028, //12893417,
        false,
        600,
        "bets"
    )
    const actionHandler = new MassiveActionHandler(
        [handlerVersion],
        db,
        'demux',
        [migrationSequence]
    )

    //const cyanAudit = new Migration('cyanAudit', 'cyanaudit', 'cyanaudit--2.2.0.sql')
    //console.log("file:", cyanAudit.upQueryFile)
    //await db.instance.none(cyanAudit.upQueryFile)
    //cyanAudit.up(db.instance)

    await actionHandler.setupDatabase()

    /*try {
        await actionHandler.setupDatabase() // Попробовать вместо запустить миграцию CyanAudit вручную
    }
    catch (e) { console.log("error:", e) }*/

    //console.log(db._index_state)
    //await db.reload()
    //console.log(db.cyanaudit)

    const actionWatcher = new BaseActionWatcher(
        actionReader,
        actionHandler,
        500
    )
    await actionReader.initialize()
    actionWatcher.watch()
}

start()

/*massive(dbConfig).then((db) => {


    const actionReader = new MongoActionReader(
        "mongodb://mongo:123test@ds223605.mlab.com:23605/bets",
        12965659, //12939520, //12936698, //12932028, //12893417,
        false,
        600,
        "bets"
    )
    const actionHandler = new MassiveActionHandler(
        [handlerVersion],
        db,
        'demux',
        [migrationSequence]
    )
    //db._index_state.
    //actionHandler.setupDatabase()
    //console.log('tables:', db.listTables())
    const actionWatcher = new BaseActionWatcher(
        actionReader,
        actionHandler,
        500
    )
    actionReader.initialize().then(() => {
        actionWatcher.watch()
    })
})*/