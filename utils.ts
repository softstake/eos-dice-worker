const apiUrl = process.env.EOS_API_URL

if (apiUrl == "") {
    throw new Error("Some of required ENV vars are empty. The vars are: EOS_API_URL")
}

export function binToJSON(account: any, name: any, data: any) {
    let XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest
    let req = new XMLHttpRequest()

    var json = JSON.stringify({
        code: account,
        action: name,
        binargs: data
    })

    req.open("POST", apiUrl + "/v1/chain/abi_bin_to_json", false)
    req.setRequestHeader('Content-type', 'application/json; charset=utf-8')
    req.send(json)

    if (req.status !== 200) {
        throw new Error(req.statusText)
    }

    return req.responseText
}