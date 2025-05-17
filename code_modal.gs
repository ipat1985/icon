function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Merge & Share')
    .addItem('Open Tool', 'showModal')
    .addToUi();
}

function showModal() {
  const html = HtmlService.createHtmlOutputFromFile('modal')
    .setWidth(640)
    .setHeight(720);
  SpreadsheetApp.getUi().showModalDialog(html, 'Merge sheets and share');
}

function getSheetList() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const fileId = ss.getId();
  const fileName = ss.getName();
  const sheets = ss.getSheets();

  return [{
    fileId,
    fileName,
    sheets: sheets.map(sheet => ({
      sheetName: sheet.getName(),
      sheetId: sheet.getSheetId()
    }))
  }];
}

function getSheetsFromFile(fileId) {
  try {
    const ss = SpreadsheetApp.openById(fileId);
    return [{
      fileId,
      fileName: ss.getName(),
      sheets: ss.getSheets().map(sheet => ({
        sheetName: sheet.getName(),
        sheetId: sheet.getSheetId()
      }))
    }];
  } catch (e) {
    throw new Error('Не удалось загрузить файл. Проверьте ID и доступ.');
  }
}

function getCurrentSheetName() {
  return SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getName();
}

function getOAuthToken() {
  return ScriptApp.getOAuthToken();
}

function mergeAndShare(data) {
  const { filename, emails, selectedSheets } = data;
  const newFile = SpreadsheetApp.create(filename);
  const newFileId = newFile.getId();

  selectedSheets.forEach(entry => {
    const source = SpreadsheetApp.openById(entry.fileId);
    const sheet = source.getSheetByName(entry.sheetName);
    const copied = sheet.copyTo(newFile);
    copied.setName(entry.sheetName);
  });

  const sheets = newFile.getSheets();
  if (sheets.length > 1 && sheets[0].getLastRow() === 0 && sheets[0].getName().includes('Sheet')) {
    newFile.deleteSheet(sheets[0]);
  }

  emails.forEach(email => {
    try {
      DriveApp.getFileById(newFileId).addEditor(email);
    } catch (err) {
      Logger.log(`Ошибка при добавлении ${email}: ${err}`);
    }
  });

  return `https://docs.google.com/spreadsheets/d/${newFileId}`;
}
