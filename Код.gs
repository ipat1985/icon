function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("📤 Поделиться")
    .addItem("Поделиться активным листом", "showShareDialog")
    .addToUi();
}


function showShareDialog() {
  const html = HtmlService.createHtmlOutputFromFile("ShareDialog")
    .setWidth(400)
    .setHeight(320);
  SpreadsheetApp.getUi().showModelessDialog(html, "Поделиться листом");
}


function processSheetShare(option, email) {
  const sourceSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = sourceSpreadsheet.getActiveSheet();
  const sheetName = sourceSheet.getName();

  const newSpreadsheet = SpreadsheetApp.create(`Копия листа: ${sheetName}`);
  const newFile = DriveApp.getFileById(newSpreadsheet.getId());

  // Копирование содержимого
  const copiedSheet = newSpreadsheet.insertSheet(sheetName);
  const dataRange = sourceSheet.getDataRange();
  const numRows = dataRange.getNumRows();
  const numCols = dataRange.getNumColumns();

  const values = dataRange.getValues();
  const formats = dataRange.getNumberFormats();
  const backgrounds = dataRange.getBackgrounds();
  const fontStyles = dataRange.getFontStyles();
  const fontWeights = dataRange.getFontWeights();

  const targetRange = copiedSheet.getRange(1, 1, numRows, numCols);
  targetRange.setValues(values);
  targetRange.setNumberFormats(formats);
  targetRange.setBackgrounds(backgrounds);
  targetRange.setFontStyles(fontStyles);
  targetRange.setFontWeights(fontWeights);

  // Удаляем дефолтный лист
  newSpreadsheet.getSheets().forEach(sheet => {
    if (sheet.getSheetName() !== sheetName) {
      newSpreadsheet.deleteSheet(sheet);
    }
  });

  // Папка
  const folders = DriveApp.getFoldersByName("Shared list");
  const targetFolder = folders.hasNext() ? folders.next() : DriveApp.createFolder("Shared list");

  targetFolder.addFile(newFile);
  const parents = newFile.getParents();
  while (parents.hasNext()) {
    parents.next().removeFile(newFile);
  }

  // Доступ
  newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  if (option === "email" && email) {
    newFile.addViewer(email);
    MailApp.sendEmail({
      to: email,
      subject: `Доступ к листу "${sheetName}"`,
      body: `Привет! Я поделилась с тобой листом "${sheetName}". Вот ссылка:\n\n${newSpreadsheet.getUrl()}`
    });
  }

  return newSpreadsheet.getUrl();
}
