function getConsentMessage (did, addTimestamp) {
  const res = {
    message: 'Create a new 3Box profile' + '\n\n' + '- \n' + 'Your unique profile ID is ' + did
  }
  if (addTimestamp) {
    res.timestamp = Math.floor(new Date().getTime() / 1000)
    res.message += ' \n' + 'Timestamp: ' + res.timestamp
  }
  return res
}

export { getConsentMessage }
