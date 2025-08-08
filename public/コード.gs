/**
 * POSTリクエストを処理する関数
 * JavaScriptアプリケーションからの注文データを受け取り、スプレッドシートに保存します
 */
function doPost(e) {
  try {
    // リクエストからJSONデータを取得
    var data = JSON.parse(e.postData.contents);
    
    // スプレッドシートを開く
    var ss = SpreadsheetApp.openById('1V2YyBjvv2P3N-quLNDZIaDwlKPIKIUXNTjuv6dvAzKc');
    var sheet = ss.getSheetByName('売上データ') || ss.insertSheet('売上データ');
    
    // 売上データシートのヘッダーが未設定なら設定する
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        '日時', 
        'テーブル番号',
        '商品名', 
        '単価', 
        '数量', 
        '小計'
      ]);
      // 列の幅を調整
      sheet.setColumnWidth(1, 180); // 日時列を広く
      sheet.setColumnWidth(2, 100); // テーブル番号列
      sheet.setColumnWidth(3, 150); // 商品名列
    }
    
    // 注文アイテムごとにデータを追加
    data.items.forEach(function(item) {
      sheet.appendRow([
        new Date(), // タイムスタンプ
        data.tableNumber, // テーブル番号
        item.name, // 商品名
        item.price, // 単価
        item.quantity, // 数量
        item.price * item.quantity // 小計
      ]);
    });
    
    // 会計サマリー情報も別シートに記録
    var summarySheet = ss.getSheetByName('会計サマリー') || ss.insertSheet('会計サマリー');
    
    // 会計サマリーシートのヘッダーが未設定なら設定する
    if (summarySheet.getLastRow() === 0) {
      summarySheet.appendRow([
        '日時',
        'テーブル番号', // ヘッダーを追加
        '合計点数',
        '合計金額',
        '預かり金額',
        'お釣り',
        '注文内容'
      ]);
      // 列の幅を調整
      summarySheet.setColumnWidth(1, 180);  // 日時列を広く
      summarySheet.setColumnWidth(2, 100); // テーブル番号列
      summarySheet.setColumnWidth(7, 300);  // 注文内容列を広く
    }
    
    // 注文内容を文字列にまとめる
    var orderDetails = data.items.map(function(item) {
      return item.name + ' x' + item.quantity;
    }).join(', ');
    
    // 会計サマリーに追加
    summarySheet.appendRow([
      new Date(),  // タイムスタンプ
      data.tableNumber, // テーブル番号を追加
      data.totalCount,  // 合計点数
      data.totalAmount,  // 合計金額
      data.receivedAmount,  // 預かり金額
      data.changeAmount,  // お釣り
      orderDetails  // 注文内容の概要
    ]);
    
    // 成功レスポンスを返す
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: '注文データを保存しました'
    }))
    .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // エラーが発生した場合のレスポンス
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * GET リクエストを処理する関数（テスト用または状態確認用）
 */
function doGet() {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'active',
    message: '注文管理システムは正常に動作しています'
  }))
  .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 日次売上レポートを生成する関数（時間トリガーで実行可能）
 */
function generateDailyReport() {
  var ss = SpreadsheetApp.openById('1V2YyBjvv2P3N-quLNDZIaDwlKPIKIUXNTjuv6dvAzKc');
  var salesSheet = ss.getSheetByName('売上データ');
  var reportSheet = ss.getSheetByName('日次レポート') || ss.insertSheet('日次レポート');
  
  // 今日の日付を取得
  var today = new Date();
  var yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // 日付フォーマット (yyyyMMdd)
  var dateString = Utilities.formatDate(yesterday, 'Asia/Tokyo', 'yyyyMMdd');
  
  // 売上データのすべての行を取得
  var allData = salesSheet.getDataRange().getValues();
  
  // ヘッダー行をスキップ
  var data = allData.slice(1);
  
  // 昨日の売上データをフィルタリング
  var yesterdaySales = data.filter(function(row) {
    var rowDate = new Date(row[0]);
    return Utilities.formatDate(rowDate, 'Asia/Tokyo', 'yyyyMMdd') === dateString;
  });
  
  // 商品ごとの売上集計
  var salesByProduct = {};
  yesterdaySales.forEach(function(row) {
    var productName = row[1];
    var subtotal = row[4];
    
    if (!salesByProduct[productName]) {
      salesByProduct[productName] = {
        quantity: 0,
        amount: 0
      };
    }
    
    salesByProduct[productName].quantity += row[3];
    salesByProduct[productName].amount += subtotal;
  });
  
  // レポートシートにデータを追加
  reportSheet.clear();
  reportSheet.appendRow(['日次売上レポート ' + dateString]);
  reportSheet.appendRow(['']);
  reportSheet.appendRow(['商品名', '販売数', '売上金額']);
  
  var totalAmount = 0;
  
  // 商品ごとの売上を追加
  Object.keys(salesByProduct).forEach(function(product) {
    reportSheet.appendRow([
      product,
      salesByProduct[product].quantity,
      salesByProduct[product].amount
    ]);
    
    totalAmount += salesByProduct[product].amount;
  });
  
  reportSheet.appendRow(['']);
  reportSheet.appendRow(['合計', '', totalAmount]);
  
  // レポートの書式を整える
  reportSheet.getRange(1, 1).setFontWeight('bold').setFontSize(14);
  reportSheet.getRange(3, 1, 1, 3).setFontWeight('bold').setBackground('#D9D9D9');
  reportSheet.getRange('C:C').setNumberFormat('¥#,##0');
  
  // 全体の列幅を調整
  reportSheet.setColumnWidth(1, 200);
  reportSheet.setColumnWidth(2, 100);
  reportSheet.setColumnWidth(3, 120);
  
  Logger.log('日次レポートを生成しました: ' + dateString);
}