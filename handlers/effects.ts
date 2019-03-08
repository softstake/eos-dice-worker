export { }

const { binToJSON } = require("../utils")
const { Api, JsonRpc } = require('eosjs')
const JsSignatureProvider = require('eosjs/dist/eosjs-jssig').default
const fetch = require('node-fetch')
const { TextDecoder, TextEncoder } = require('text-encoding');
const eosecc = require('eosjs-ecc')

const apiUrl = process.env.EOS_API_URL
const privateKey = process.env.KEY

// if (privateKey == "" || apiUrl == "") {
//     throw new Error("Some of required ENV vars are empty. The vars are: EOS_API_URL, KEY")
// }

const ContractName = "casinosevens"
const ActorName = "sevenshelper"

const privateKeys = [privateKey]
const signatureProvider = new JsSignatureProvider(privateKeys);

const rpc = new JsonRpc(apiUrl, { fetch });
const api = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() })


async function resolveBet(payload: any, blockinfo: any) {
    console.log("ResolveBet was called")

    const json = binToJSON(payload.account, payload.name, payload.data)
    const obj = JSON.parse(json)

    const betID = obj.args.bet.id
    const house_seed = obj.args.bet.house_seed_hash

    const signature = eosecc.signHash(house_seed, privateKeys[0])

    const result = await api.transact({
        actions: [{
            account: ContractName,
            name: 'resolvebet',
            authorization: [{
                actor: ActorName,
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

module.exports = effects