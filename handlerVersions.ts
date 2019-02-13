import { BADFAMILY } from "dns";

export { }

const { Api, JsonRpc } = require('eosjs')
const JsSignatureProvider = require('eosjs/dist/eosjs-jssig').default
const fetch = require('node-fetch')
const { TextDecoder, TextEncoder } = require('text-encoding');
const eosecc = require('eosjs-ecc')

const StateNew = 0
const StateResolved = 1
const StateSynced = 2
const StateCleared = 3

const privateKeys = ["5KEt3nBsoRrZ1W2xuFCPdJUohFfCZZJM5Yd4LMRwunKyUq1q7KH"]
const signatureProvider = new JsSignatureProvider(privateKeys);

const rpc = new JsonRpc('http://jungle2.cryptolions.io:80', { fetch });
const api = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() })

function binToJSON(account: any, name: any, data: any) {
    let XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest
    let req = new XMLHttpRequest()

    var json = JSON.stringify({
        code: account,
        action: name,
        binargs: data
    })

    req.open("POST", "http://jungle2.cryptolions.io:80/v1/chain/abi_bin_to_json", false)
    req.setRequestHeader('Content-type', 'application/json; charset=utf-8')
    req.send(json)

    if (req.status !== 200) {
        throw new Error(req.statusText)
    }

    return req.responseText

    /*req.onreadystatechange = function () {
        if (req.readyState != 4) return

        const resp = JSON.parse()
        console.log("RESPONSE: ", resp.args.result.roll_under)

    }*/
}

async function updateBet(db: any, payload: any, blockinfo: any) {
    console.log("BLOCKINFO: ", blockinfo)
    console.log('payload:', payload)

    const json = binToJSON(payload.account, payload.name, payload.data)
    const obj = JSON.parse(json)

    console.log("ROLL UNDER IS: ", obj.args.result.roll_under)

    // TODO: critetias of find in more detail
    await db.bets.update({ game_id: obj.args.result.game_id }, {
        random_roll: obj.args.result.random_roll,
        player_payout: obj.args.result.payout.split(" ")[0],
        referer_payout: obj.args.result.ref_payout.split(" ")[0],
        signature: obj.args.result.sig,
        state: StateSynced
    })

}

async function addBet(db: any, payload: any, blockinfo: any) {
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
    console.log("UPDATE RESOLVE CALLING")

    const json = binToJSON(payload.account, payload.name, payload.data)
    const obj = JSON.parse(json)

    //console.log("BLOCK NUMBER IS ", blockinfo.blockNumber)

    //const bet = await db.bets.findOne({
    //    bet_id: obj.args.bet_id,
    //})

    // TODO: save block number
    await db.bets.update({ bet_id: obj.args.bet_id }, { state: StateResolved })
}

const updaters = [
    {
        actionType: 'casinosevens::receipt',
        apply: updateBet,
    },
    {
        actionType: 'casinosevens::notify',
        apply: addBet,
    },
    {
        actionType: 'casinosevens::resolvebet',
        apply: updateResolve,
    },
]

async function resolveBet(payload: any, blockinfo: any) {
    console.log("BLOCKINFO: ", blockinfo)
    console.log("PAYLOAD: ", payload)

    const json = binToJSON(payload.account, payload.name, payload.data)
    const obj = JSON.parse(json)

    const betID = obj.args.bet.id
    const house_seed = obj.args.bet.house_seed_hash

    const signature = eosecc.signHash(house_seed, privateKeys[0])

    const result = await api.transact({
        actions: [{
            account: 'casinosevens',
            name: 'resolvebet',
            authorization: [{
                actor: 'sevenshelper',
                permission: 'active',
            }],
            data: {
                bet_id: betID,
                sig: signature,
            },
        }]
    }, {
            blocksBehind: 3,
            expireSeconds: 3600,
        })
    console.log(result)
}

const effects = [
    {
        actionType: 'casinosevens::notify',
        run: resolveBet,
    },
]

const handlerVersions = {
    versionName: "v1",
    updaters,
    effects,
}

module.exports = handlerVersions
