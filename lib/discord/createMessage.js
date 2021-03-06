const log = require('npmlog')
const url = require('url')

// function creating message from template
module.exports = (thread, sender, message, showFullNames) => {
  var attach = message.attachments[0]

  // set description to message body, set author to message sender
  var nickname = thread.nicknames[message.senderID]
  var authorName = nickname ? (showFullNames ? `${nickname} (${sender.name})` : nickname) : sender.name

  log.verbose('createMessage', 'Nickname: %s, author name: %s', nickname, authorName)
  log.verbose('createMessage: content', message.body)

  var discordMessage = message.body

  // if there are no attachments, send it already
  var opts = {
    username: authorName.length <= 32 ? authorName : authorName.substr(0, 29) + '...',
    avatarURL: `https://graph.facebook.com/${message.senderID}/picture?width=128`
  }
  if (!attach) return [ discordMessage, opts ]

  log.silly('createMessage: attachment', attach)

  for (let attach of message.attachments) {
    if (!attach.url && (attach.title || attach.description) && attach.title !== 'Update Messenger to the latest version.' && attach.type !== 'sticker') {
      var { title, description } = attach
      discordMessage += (title ? '\n' + title : '') + (description ? '\n' + description : '')
    }
  }

  if (attach.type === 'share' && attach.url) {
    if (attach.url.startsWith('http://l.facebook.com/l.php') || attach.url.startsWith('https://l.facebook.com/l.php')) {
      attach.url = url.parse(attach.url, true).query.u
    }
    if (!discordMessage.includes(attach.url)) discordMessage += '\n' + attach.url
  }

  opts.files = message.attachments.map(resolveImageURL).filter(a => a)
  return [ discordMessage, opts ]
}

function resolveImageURL (attach) {
  var baseURL = attach.image || attach.url
  if (!baseURL) return
  var imageURL = url.parse(baseURL, true)
  imageURL = imageURL.pathname === '/safe_image.php' ? imageURL.query.url : baseURL
  var name = url.parse(imageURL, true).pathname.split('/').pop('-1')
  return {
    name: name.includes('.') ? name : name + '.png',
    attachment: imageURL
  }
}
