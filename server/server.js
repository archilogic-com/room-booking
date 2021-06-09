require('dotenv').config()


if (
    !process.env.ARCHILOGIC_API_URL ||
    !process.env.ARCHILOGIC_SECRET_KEY
) {
    console.error("Please configure env vars")
    process.exit(1)
}

const express = require('express');
var cors = require('cors')
const fetch = require("node-fetch");
var request = require('request')

const app = express();

let whitelist = [

]

if (process.env.NODE_ENV !== 'production') {
    whitelist.push('http://localhost:3000')
    whitelist.push('http://localhost:3001')
    whitelist.push('http://localhost:3002')
    whitelist.push('http://localhost:3003')
    whitelist.push('http://localhost:3005')
    whitelist.push('http://localhost:3006')

}
let corsOptions = { origin: whitelist }

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));


app.get('/temp-token', cors(corsOptions), (req, res) => {
    const body = JSON.stringify(
        {
            scopes: [
                { resource: "floor", action: "readPrivate" },
                { resource: "floor", action: "queryPublic" },
                { resource: "customFields", action: "readPrivate" },
                { resource: "customFields", action: "readPublic" },
                { resource: "customFields", action: "write" },


            ], durationSeconds: 3600
        }
    )

    fetch(`${process.env.ARCHILOGIC_API_URL}/v2/temporary-access-token/create`, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `AL-Secret-Token ${process.env.ARCHILOGIC_SECRET_KEY}`
        },
        body: body,
        method: "POST"
    })
        .then(res => res.json())
        .then(json => {
            res.send(json);

        })

})




const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
})