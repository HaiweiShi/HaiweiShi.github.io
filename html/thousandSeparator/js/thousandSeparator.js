thousandSeparator = (num, index = 2) => {
  if (isNaN(num) || num === '') {
    return num
  }
  num = num || 0
  num = parseFloat(num).toFixed(index)
  return num.replace(/(\d)(?=(\d{3})+\.\d+?$)/g, '$1,')
}