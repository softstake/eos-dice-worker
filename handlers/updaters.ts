const { binToJSON, isString } = require('../utils')

const logger = require('pino')({'name': 'updaters-logger'})

const StateNew = 0
const StateResolved = 1
const StateSynced = 2
const StateCleared = 3


async function addBet(db: any, payload: any, blockinfo: any) {

    logger.info('addBet call...')

    // const json = binToJSON(payload.account, payload.name, payload.data)
    // const obj = JSON.parse(json)
    // const bet = obj.args.bet

    const bet = payload.data

    logger.info('... betID is: %d, gameID is: %d', bet.id, bet.game_id)

    // TODO: save block number
    await db.bets.insert({
        bet_id: bet.id,
        game_id: bet.game_id,
        player_name: bet.player,
        player_seed: bet.player_seed,
        house_seed_hash: bet.house_seed_hash,
        bet_amount: bet.amount.split(" ")[0],
        roll_under: bet.roll_under,
        referrer: bet.referrer,
        state: StateNew,
        created_at: new Date(bet.created_at * 1000),
    })
}

async function updateResolve(db: any, payload: any, blockinfo: any) {
    logger.info('updateResolve call...')

    // const json = binToJSON(payload.account, payload.name, payload.data)
    // const obj = JSON.parse(json)

    const obj = payload.data

    // TODO: save block number
    logger.info('... betID is: %d', obj.args.bet_id)
    await db.bets.update({ bet_id: obj.args.bet_id }, { state: StateResolved })
}

async function updateBet(db: any, payload: any, blockinfo: any) {
    logger.info('updateBet call...')

    // const json = binToJSON(payload.account, payload.name, payload.data)
    // const obj = JSON.parse(json)

    const obj = payload.data

    logger.info('... gameID is: %d', obj.args.result.game_id)
    // TODO: criterias of find in more detail
    await db.bets.update({ game_id: obj.args.result.game_id }, {
        random_roll: obj.args.result.random_roll,
        player_payout: obj.args.result.payout.split(" ")[0],
        referer_payout: obj.args.result.ref_payout.split(" ")[0],
        signature: obj.args.result.sig,
        state: StateSynced
    })
}

const updaters = [
    {
        actionType: 'casinosevens::notify',
        apply: addBet,
    },
    {
        actionType: 'casinosevens::resolvebet',
        apply: updateResolve,
    },
    {
        actionType: 'casinosevens::receipt',
        apply: updateBet,
    },
]

module.exports = updaters
