const { firestore } = require('../firebase/connectToFirebase')

import firebase from 'firebase/compat/app'

const addItems = async (req) => {
  try {
    const added = await firestore.collection(req._type).doc(req.name).set({
      price: req.price,
      quantity: req.quantity,
      promotion: req.promotion,
    })
    await addLog(
      'Add',
      `Add ${req._type.toUpperCase()} ${req.name.toUpperCase()} ${req.price} ${req.quantity} 
      ${req.promotion}`,
      req.uid
    )
    return added
  } catch (e) {
    console.log(e)
    return e
  }
}

const readStock = async (req) => {
  try {
    const snap = await firestore.collection(req).get()
    if (snap.empty) {
      throw { message: 'not found ' + req }
    }
    const result = {}
    snap.forEach((e) => {
      result[e.id] = e.data()
    })
    return result
  } catch (e) {
    console.log(e)
    return e
  }
}

const allStock = async (req) => {
  const result = {}
  const collectionListsSnap = await firestore.collection('type').get()
  const collectionLists = []
  collectionListsSnap.forEach((e) => {
    collectionLists.push(e.id)
  })
  for (const collection of collectionLists) {
    result[collection] = await readStock(collection)
  }
  return result
}

const prettifyStocks = async () => {
  const stocks = await allStock()
  var result = ''
  Object.keys(stocks).map((_type) => {
    const _type_text = _type.toUpperCase()
    result += '📦 ' + _type_text + ' 🚀'
    Object.keys(stocks[_type]).map((e) => {
      result +=
        '\n - ' +
        e.toUpperCase() +
        ' : ' +
        stocks[_type][e]['quantity'] +
        ' [' +
        String(stocks[_type][e]['price'] - stocks[_type][e]['promotion']) +
        ' ฿]'
    })
    result += '\n\n'
  })
  result = result.slice(0, -2)
  return result
}

const prettifyStock = async (req) => {
  const stocks = await readStock(req)
  var result = '📦 ' + req.toUpperCase() + ' 🚀'
  Object.keys(stocks).map((e) => {
    result += '\n - ' + e.toUpperCase()
  })
  return result
}

const getQuickRepliesType = async () => {
  const quickReplies = {
    items: [],
  }
  const snap = await firestore.collection('type').get()
  snap.forEach((e) => {
    if (e.id != 'log') {
      quickReplies['items'].push({
        type: 'action',
        action: {
          type: 'message',
          label: e.id.toUpperCase(),
          text: e.id.toUpperCase(),
        },
      })
    }
  })
  return quickReplies
}

const getQuickReplies = async (req) => {
  const quickReplies = {
    items: [],
  }
  const stock = await readStock(req)
  Object.keys(stock).map((e) => {
    quickReplies['items'].push({
      type: 'action',
      action: {
        type: 'message',
        label: e.toUpperCase(),
        text: e.toUpperCase(),
      },
    })
  })
  quickReplies['items'] = quickReplies['items'].slice(0, 12)
  return quickReplies
}

const removeStock = async (_type, name, uid) => {
  try {
    const res = await firestore.collection(_type).doc(name).get()
    const data = res.data()
    if (data.quantity == 0) {
      throw 'Out of stock'
    }
    await firestore
      .collection(_type)
      .doc(name)
      .set(
        {
          quantity: firebase.firestore.FieldValue.increment(-1),
        },
        { merge: true }
      )
    await addLog(
      'Sell',
      'Sell ' +
        _type.toUpperCase() +
        ' ' +
        name.toUpperCase() +
        ' for ' +
        String(data.price - data.promotion),
      uid
    )
    return 'Sold'
  } catch (e) {
    console.log(e)
    return e
  }
}

const addStock = async (type, name, quantity, uid) => {
  await firestore
    .collection(type)
    .doc(name)
    .set(
      {
        quantity: firebase.firestore.FieldValue.increment(quantity),
      },
      { merge: true }
    )
  await addLog(
    'Add Stock',
    'Added ' + type.toUpperCase() + ' ' + name.toUpperCase() + ' for ' + quantity + ' pieces',
    uid
  )
}

const addPromotion = async (type, name, quantity, uid) => {
  await firestore.collection(type).doc(name).set(
    {
      promotion: quantity,
    },
    { merge: true }
  )
  await addLog(
    'Add Promotion',
    'Added promotion ' +
      type.toUpperCase() +
      ' ' +
      name.toUpperCase() +
      ' for ' +
      quantity +
      ' baht',
    uid
  )
}

const callLog = async (type, uid, range = 'month') => {
  const date = new Date()
  var dateRange = new Date(date.getFullYear(), date.getMonth(), 1)
  if (range == 'year') {
    dateRange = new Date(date.getFullYear(), 0, 1)
  }
  var ref = firestore.collection('log').where('type', '==', type).where('time', '>=', dateRange)
  if (uid) {
    ref = ref.where('uid', '==', uid)
  }
  ref = ref.orderBy('time', 'asc')
  const snap = await ref.get()
  if (snap.empty) {
    return ''
  }
  var result = '-------- Sell Report --------'
  var sellPrice = 0
  const sellObject = {}
  snap.forEach((doc) => {
    const collection = doc.data()
    collection.message = collection.message.toLowerCase()
    sellPrice += parseInt(collection.message.split(' ')[4])
    if (!Object.keys(sellObject).includes(collection.message.split(' ')[1])) {
      sellObject[collection.message.split(' ')[1]] = {}
    }
    if (
      !Object.keys(sellObject[collection.message.split(' ')[1]]).includes(
        collection.message.split(' ')[2]
      )
    ) {
      sellObject[collection.message.split(' ')[1]][collection.message.split(' ')[2]] = {
        quantity: 0,
        price: 0,
      }
    }
    sellObject[collection.message.split(' ')[1]][collection.message.split(' ')[2]]['quantity'] += 1
    sellObject[collection.message.split(' ')[1]][collection.message.split(' ')[2]]['price'] +=
      parseInt(collection.message.split(' ')[4])
  })

  Object.keys(sellObject).map((type) => {
    result += '\n  - ' + type.toUpperCase() + ' -'
    Object.keys(sellObject[type]).map((name) => {
      result += `\n     - ${name.toUpperCase()} : ${sellObject[type][name]['quantity']} (${
        sellObject[type][name]['price']
      } ฿)`
    })
  })

  result += '\n\n' + 'This ' + range + ' sales : ' + sellPrice + ' Baht'
  return result
}

const addLog = async (type, message, uid) => {
  try {
    await firestore.collection('log').doc().set({
      type,
      message,
      uid,
      time: firebase.firestore.FieldValue.serverTimestamp(),
    })
  } catch (e) {
    console.log(e)
  }
}

module.exports = {
  addItems,
  readStock,
  allStock,
  prettifyStocks,
  prettifyStock,
  getQuickReplies,
  removeStock,
  addStock,
  addPromotion,
  callLog,
  getQuickRepliesType,
}
