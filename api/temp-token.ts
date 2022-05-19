import fetch from 'node-fetch'

export default function handler(request, response) {
  const body = JSON.stringify({
    scopes: [
      { resource: 'floor', action: 'readPrivate' },
      { resource: 'floor', action: 'queryPublic' },
      { resource: 'customFields', action: 'readPrivate' },
      { resource: 'customFields', action: 'readPublic' },
      { resource: 'customFields', action: 'write' }
    ],
    durationSeconds: 3600
  })

  fetch(`${process.env.ARCHILOGIC_API_URL}/v2/temporary-access-token/create`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `AL-Secret-Token ${process.env.ARCHILOGIC_SECRET_KEY}`
    },
    body: body,
    method: 'POST'
  })
    .then(res => res.json())
    .then(json => {
      response.send(json)
    })
}
