/*
 * Auto-Importer Script from https://github.com/PLASMAchicken/GTNH_SpiceOfLifeHistoryExtract/blob/master/public/AutoImport.gs
 * Version v0.5
 * 
 * Changelog:
 *  - v0.1 - Inital
 *  - v0.2 - Add sync Log and fix checkCols and nameCols
 *  - v0.3 - Add Comment and Link to File
 *  - v0.4 - Add double tick check
 *  - v0.5 - Hunger compare
 *  - v0.6 - JSON minify
 * 
 */

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
    let rowIndex = -1

    // First, check using modshort
    const withModShort = item.n + ' ' + item.m
    itemName = withModShort

    rowIndex = values.indexOf(withModShort)

    if (rowIndex !== -1) {
      // Check if checkbox is already ticked in column B
      const isChecked = sheet.getRange(rowIndex + 1, 2).getValue()

      const hungerValue = Number(sheet.getRange(rowIndex + 1, 5).getValue().toString())
      if(item.h != hungerValue) {
        notFound.push(`WRONG HUNGER VALUE: ${item.n} / ${withModShort} / NBT: ${item.h} -> Sheet: ${hungerValue}`)
      }

      if (!isChecked) {
        sheet.getRange(rowIndex + 1, 2).setValue(true)
      } else if (found.includes(withModShort)) {
        notFound.push(`ALREADY TICKed: ${item.n} / ${withModShort}`)
      }
      found.push(itemName)
      return // move to next item
    }

    // If not found, check by name only
    rowIndex = values.indexOf(item.n)
    if (rowIndex !== -1) {
      const isChecked = sheet.getRange(rowIndex + 1, 2).getValue()

      const hungerValue = Number(sheet.getRange(rowIndex + 1, 5).getValue().toString())
      if(item.h != hungerValue) {
        notFound.push(`WRONG HUNGER VALUE: ${item.n} / ${withModShort} / NBT: ${item.h} -> Sheet: ${hungerValue}`)
      }

      if (!isChecked) {
        sheet.getRange(rowIndex + 1, 2).setValue(true)
      } else if (found.includes(item.n)) {
        notFound.push(`ALREADY TICKed: ${item.n} / ${withModShort}`)
      }
      itemName = item.n
      found.push(itemName)
      return // move to next item
    }

    // If neither found
    console.log(`Not found: ${item.n} / ${withModShort}`)
    notFound.push(`Not found: ${item.n} / ${withModShort}`)
  })

  let foundInOtherSheets = {}
  itemsToCheck.forEach((item) => {
    foundInOtherSheets[item.n] = false
  })

  // Tick in other sheets
  Object.entries(config.sheets).forEach(([sheetName, sheetConfig]) => {
    const targetSheet = ss.getSheetByName(sheetName)
    const lastRow = targetSheet.getLastRow()
    if (lastRow === 0) return

    sheetConfig.nCols.forEach((nameCol, idx) => {
      const checkCol = sheetConfig.checkCols[idx]
      const names = targetSheet.getRange(1, nameCol, lastRow).getValues().flat()
      itemsToCheck.forEach((item) => {
        const row = names.indexOf(item.n)

        if (row !== -1) {
          // console.log(`[✔️] ${sheetName}!${String.fromCharCode(64 + checkCol)}${row + 1}`);
          foundInOtherSheets[item.n] = true
          targetSheet.getRange(row + 1, checkCol).setValue(true)
        } else {
          const withModShort = item.n + ' ' + item.m

          const row2 = names.indexOf(withModShort)
          if (row2 !== -1) {
            // console.log(`[✔️] ${sheetName}!${String.fromCharCode(64 + checkCol)}${row2 + 1}`);
            targetSheet.getRange(row2 + 1, checkCol).setValue(true)
            foundInOtherSheets[item.n] = true
          } else {
            //console.log(`[🔍] "${item.n}" not found in ${sheetName}`);
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
    .addItem('Open History Extract', 'openHistoryExtract')
    .addToUi()
}

// Opens a dialog with a clickable link
function openHistoryExtract() {
  const html = HtmlService.createHtmlOutput(
    '<a href="https://plasmachicken.github.io/GTNH_SpiceOfLifeHistoryExtract/" target="_blank">Open GTNH Spice of Life History Extract</a>',
  )
    .setWidth(300)
    .setHeight(80)
  SpreadsheetApp.getUi().showModalDialog(html, 'GTNH History Extract')
}
