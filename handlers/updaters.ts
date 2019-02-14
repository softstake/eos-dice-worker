const { binToJSON } = require("../utils")

const StateNew = 0
const StateResolved = 1
const StateSynced = 2
const StateCleared = 3


async function addBet(db: any, payload: any, blockinfo: any) {
    console.log("AddBet was called")

    const json = binToJSON(payload.account, payload.name, payload.data)
    const obj = JSON.parse(json)
    const bet = obj.args.bet

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
    console.log("UpdateResove was called")

    const json = binToJSON(payload.account, payload.name, payload.data)
    const obj = JSON.parse(json)

    // TODO: save block number
    await db.bets.update({ bet_id: obj.args.bet_id }, { state: StateResolved })
}

async function updateBet(db: any, payload: any, blockinfo: any) {
    console.log("UpdateBet was called")

    const json = binToJSON(payload.account, payload.name, payload.data)
    const obj = JSON.parse(json)

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
