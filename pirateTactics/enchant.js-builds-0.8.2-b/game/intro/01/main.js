/**
 * enchant.js を使う前にフレームワークを有効するための必要な処理。
 */
enchant();

/*
 * ページがロードされた際に実行される関数。
 * すべての処理はページがロードされてから行うため、 window.onload の中で実行する。
 * 特に new Core(); は、<body> タグが存在しないとエラーになるので注意。
 */
window.onload = function(){
    /**
     * Core オブジェクトを作成する。
     * 画面の大きさは 960ピクセル x 640ピクセル に設定する。
     */
    var game = new Core(960, 640); //この大きさだとモバイル端末でも遊べます

    /**
     * ゲームにシーンを追加
     */
    var sceneGameMain = new Scene();

    /**
     * "Hello World"を作る
     */
    var label = new Label("Hello World");

    label.x = 200;
    label.y = 100;

    /**
     * "Hello World"を画面に表示するため、ゲームのメインシーンに追加します
     */
    sceneGameMain.addChild(label);


    game.pushScene(sceneGameMain);

    game.start();
};
