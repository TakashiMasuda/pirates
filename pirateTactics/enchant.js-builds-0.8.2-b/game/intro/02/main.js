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
     * 最初は画像をロードします
     */
    game.preload("../../resources/boat.png");

    /**
     * ロードが完了した直後に実行される関数を指定している。
     * game.onload = function(){
     *     // code
     * }
     */
    game.onload = function(){
        /**
         * 新しいSpriteを作る。
         */
        var sprite = new Sprite(512, 512);

        sprite.x = 100;
        sprite.y = 0;

        /**
         * プリーロードした画像をSpriteのimageとして設定をします
         */
        sprite.image = game.assets["../../resources/boat.png"];

        /**
         * 新しく作ったスプライトに画像を設定します
         */
        sceneGameMain.addChild(sprite);

        game.pushScene(sceneGameMain);
    }

    game.start();
};
