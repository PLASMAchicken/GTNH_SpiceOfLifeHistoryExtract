function checkFoodItemsFromA1() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const sheet = ss.getSheetByName('All')

  const ui = SpreadsheetApp.getUi() || {}
  const response = ui.prompt('Please enter the JSON Data into A1 in the All Sheet')
  if (response.getSelectedButton() !== ui.Button.OK) return

  let rawInput = sheet.getRange('A1').getValue()

  let itemsToCheck = []

  // Parse input
  try {
    itemsToCheck = JSON.parse(rawInput)
    if (!Array.isArray(itemsToCheck)) throw new Error('A1 does not contain a valid JSON array.')
  } catch (e) {
    ui.alert('❌ Error: A1 does not contain a valid JSON array.')
    return
  }

  // Read all names in column C of "All"
  const allNameValues = sheet.getRange(1, 3, sheet.getLastRow()).getValues().flat().map(String)
  const notFound = []

  // Config
  const config = {
    allSheet: 'All',
    allCheckboxCols: [2, 7],
    allNameCols: [3, 8],
    sheets: {
      'T1 (Raw)': { checkCols: [2, 7, 12, 17, 22], nameCols: [3, 8, 13, 18, 23] },
      'T2 (Basic)': { checkCols: [2, 7, 12, 17, 22, 27], nameCols: [3, 8, 13, 18, 23, 28] },
      'T3 (Intermediate)': { checkCols: [2, 7, 12, 17, 22], nameCols: [3, 8, 13, 18, 23] },
      'T4 (Advanced)': { checkCols: [2, 7, 12, 17, 22], nameCols: [3, 8, 13, 18, 23] },
      Other: { checkCols: [2, 7, 12], nameCols: [3, 8, 13] },
    },
  }

  // Read column B (food names)
  const dataRange = sheet.getRange('C1:C' + sheet.getLastRow())
  const values = dataRange.getValues().flat()

  const found = []
  // Process each item
  itemsToCheck.forEach((item) => {
    let itemName = ''
    const rowIndex = values.indexOf(item.name)
    if (rowIndex !== -1) {
      // Tick checkbox in column B of that row
      itemName = item.name
      sheet.getRange(rowIndex + 1, 2).setValue(true)
    } else {
      const withModShort = item.name + ' ' + item.modshort
      itemName = withModShort

      const rowIndex2 = values.indexOf(withModShort)
      if (rowIndex2 !== -1) {
        // Tick checkbox in column B of that row
        sheet.getRange(rowIndex2 + 1, 2).setValue(true)
      } else {
        console.log(`Not found: ${item.name} /  ${withModShort}`)
        notFound.push(`Not found: ${item.name} /  ${withModShort}`)
        return
      }
      found.push(itemName)
    }
  })

  let foundInOtherSheets = {}
  itemsToCheck.forEach((item) => {
    foundInOtherSheets[item.name] = false
  })

  // Tick in other sheets
  Object.entries(config.sheets).forEach(([sheetName, sheetConfig]) => {
    const targetSheet = ss.getSheetByName(sheetName)
    const lastRow = targetSheet.getLastRow()
    if (lastRow === 0) return

    sheetConfig.nameCols.forEach((nameCol, idx) => {
      const checkCol = sheetConfig.checkCols[idx]
      const names = targetSheet.getRange(1, nameCol, lastRow).getValues().flat()
      itemsToCheck.forEach((item) => {
        const row = names.indexOf(item.name)

        if (row !== -1) {
          // console.log(`[✔️] ${sheetName}!${String.fromCharCode(64 + checkCol)}${row + 1}`);
          foundInOtherSheets[item.name] = true
          targetSheet.getRange(row + 1, checkCol).setValue(true)
        } else {
          const withModShort = item.name + ' ' + item.modshort

          const row2 = names.indexOf(withModShort)
          if (row2 !== -1) {
            // console.log(`[✔️] ${sheetName}!${String.fromCharCode(64 + checkCol)}${row2 + 1}`);
            targetSheet.getRange(row2 + 1, checkCol).setValue(true)
            foundInOtherSheets[item.name] = true
          } else {
            //console.log(`[🔍] "${item.name}" not found in ${sheetName}`);
          }
        }
      })
    })
  })

  let itemsStillFalse = Object.keys(foundInOtherSheets).filter((key) => !foundInOtherSheets[key])

  console.log(itemsStillFalse) // ["item2", "item3"]

  if (notFound.length > 0) {
    ui.alert('⚠️ Some items were not found:\n' + notFound.join('\n'))
  } else {
    ui.alert('✅ All items processed successfully!')
  }

  if (itemsStillFalse.length > 0) {
    ui.alert('⚠️ Some items were not synced:\n' + itemsStillFalse.join('\n'))
  } else {
    ui.alert('✅ All items synced successfully!')
  }
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('✔️ Food Tools')
    .addItem('Check Foods from Prompt', 'checkFoodItemsFromA1')
    .addToUi()
}
