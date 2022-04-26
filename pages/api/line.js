const https = require('https')

const {
  addItems,
  readStock,
  prettifyStocks,
  allStock,
  getQuickReplies,
  removeStock,
  callLog,
  addStock,
  addPromotion,
  getQuickRepliesType,
} = require('../utils')

var state = {}
const merchant = [
  'U5d0912d93d407a0fcd615312e8ae6d1d',
  'U426a9e18c4b4da06c09fae9eca6e3958',
  'U328961072c894984724cced4cc7ba1da',
]

const resetState = (uid) => {
  state[uid] = { name: '', props: {} }
}

const messageHandler = async (messages, message, uid) => {
  if (message == 'current stock') {
    resetState(uid)
    const result = await prettifyStocks()
    return messages.push({ type: 'text', text: result })
  } else if (message == 'sell') {
    resetState(uid)
    if (!merchant.includes(uid)) {
      return messages.push({ type: 'text', text: 'You are not merchant 🤣' })
    }
    state[uid].name = 'sell type'
    const quickReply = await getQuickRepliesType()
    return messages.push({
      type: 'text',
      text: '😁 Enter type : ',
      quickReply,
    })
  } else if (message == 'monthly report') {
    resetState(uid)
    const result = await callLog('Sell', uid)
    return messages.push({ type: 'text', text: result })
  } else if (message == 'yearly report') {
    resetState(uid)
    const result = await callLog('Sell', uid, 'year')
    return messages.push({ type: 'text', text: result })
  } else if (message == 'add items') {
    resetState(uid)
    if (!merchant.includes(uid)) {
      return messages.push({ type: 'text', text: 'You are not merchant 🤣' })
    }
    state[uid].name = 'add type'
    const quickReply = await getQuickRepliesType()
    return messages.push({
      type: 'text',
      text: '😁 Enter type : ',
      quickReply,
    })
  } else if (message == 'add stock') {
    resetState(uid)
    if (!merchant.includes(uid)) {
      return messages.push({ type: 'text', text: 'You are not merchant 🤣' })
    }
    state[uid].name = 'add stock type'
    const quickReply = await getQuickRepliesType()
    return messages.push({
      type: 'text',
      text: '😁 Enter type : ',
      quickReply,
    })
  } else if (message == 'add promotion') {
    resetState(uid)
    if (!merchant.includes(uid)) {
      return messages.push({ type: 'text', text: 'You are not merchant 🤣' })
    }
    state[uid].name = 'add promotion type'
    const quickReply = await getQuickRepliesType()
    return messages.push({
      type: 'text',
      text: '😁 Enter type : ',
      quickReply,
    })
  } else if (message == 'sell report') {
    return messages.push({
      type: 'text',
      text: message,
    })
  } else if (message == 'add types') {
    return messages.push({
      type: 'text',
      text: message,
    })
  } else if (state[uid].name == 'sell type') {
    state[uid].name = 'sell name'
    state[uid].props['type'] = message
    const quickReply = await getQuickReplies(message)
    return messages.push({
      type: 'text',
      text: '🚀 Enter name: ',
      quickReply,
    })
  } else if (state[uid].name == 'sell name') {
    const tmp_type = state[uid].props.type
    const res = await removeStock(tmp_type, message.toLowerCase(), uid)
    resetState(uid)
    if (res == 'Out of stock') {
      return messages.push({
        type: 'text',
        text: 'Sold Out 🙄',
      })
    }
    return messages.push({
      type: 'text',
      text: 'Sold ' + tmp_type.toUpperCase() + ' ' + message.toUpperCase(),
    })
  } else if (state[uid].name == 'add type') {
    state[uid].name = 'add name'
    state[uid].props['type'] = message
    return messages.push({ type: 'text', text: 'Enter [Taste] [Quantity] [Price] 😅' })
  } else if (state[uid].name == 'add name') {
    const params = message.split(' ')
    if (isNaN(params[1]) || isNaN(params[2])) {
      return messages.push({ type: 'text', text: '[Quantity] and [Price] must be number 🙄' })
    }
    await addItems({
      _type: state[uid].props['type'],
      name: params[0],
      quantity: parseInt(params[1]),
      price: parseInt(params[2]),
      promotion: 0,
      uid,
    })
    return messages.push({
      type: 'text',
      text: `Added ${params[0].toUpperCase()} to ${state[uid].props['type'].toUpperCase()}`,
    })
  } else if (state[uid].name == 'add stock type') {
    state[uid].name = 'add stock name'
    state[uid].props['type'] = message
    const quickReply = await getQuickReplies(message)
    return messages.push({
      type: 'text',
      text: '🚀 Enter name: ',
      quickReply,
    })
  } else if (state[uid].name == 'add stock name') {
    state[uid].name = 'add stock quantity'
    state[uid].props['name'] = message
    return messages.push({ type: 'text', text: 'Enter quantity to add: ' })
  } else if (state[uid].name == 'add stock quantity') {
    if (isNaN(message)) {
      return messages.push({ type: 'text', text: 'Quantity must me number 😂' })
    }
    await addStock(state[uid].props['type'], state[uid].props['name'], parseInt(message), uid)
    messages.push({
      type: 'text',
      text:
        'Added ' +
        state[uid].props['type'].toUpperCase() +
        ' ' +
        state[uid].props['name'].toUpperCase() +
        ' for ' +
        message +
        ' pieces',
    })
    return resetState(uid)
  } else if (state[uid].name == 'add promotion type') {
    state[uid].name = 'add promotion name'
    state[uid].props['type'] = message
    const quickReply = await getQuickReplies(message)
    return messages.push({
      type: 'text',
      text: '🚀 Enter name: ',
      quickReply,
    })
  } else if (state[uid].name == 'add promotion name') {
    state[uid].name = 'add promotion quantity'
    state[uid].props['name'] = message
    return messages.push({ type: 'text', text: 'Enter promotion price: ' })
  } else if (state[uid].name == 'add promotion quantity') {
    if (isNaN(message)) {
      return messages.push({ type: 'text', text: 'Quantity must me number 😂' })
    }
    await addPromotion(state[uid].props['type'], state[uid].props['name'], parseInt(message), uid)
    messages.push({
      type: 'text',
      text:
        'Added promotion ' +
        state[uid].props['type'].toUpperCase() +
        ' ' +
        state[uid].props['name'].toUpperCase() +
        ' for ' +
        message +
        ' baht',
    })
    return resetState(uid)
  }
  resetState(uid)
  return messages.push({ type: 'text', text: message })
}

export default async function handler(req, res) {
  res.status(200).json({})
  if (req.body.events[0].type === 'message') {
    const messages = []
    if (!Object.keys(state).includes(req.body.events[0].source.userId)) {
      state[req.body.events[0].source.userId] = { name: '', props: {} }
    }
    await messageHandler(
      messages,
      req.body.events[0].message.text.toLowerCase(),
      req.body.events[0].source.userId
    )

    const dataString = JSON.stringify({
      replyToken: req.body.events[0].replyToken,
      messages,
    })

    const headers = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + process.env.LINE_ACCESS_TOKEN,
    }

    const webhookOptions = {
      hostname: 'api.line.me',
      path: '/v2/bot/message/reply',
      method: 'POST',
      headers: headers,
      body: dataString,
    }

    const request = https.request(webhookOptions, (res) => {
      res.on('data', (d) => {
        process.stdout.write(d)
      })
    })

    request.on('error', (err) => {
      console.error(err)
    })

    request.write(dataString)
    request.end()
  }
}
