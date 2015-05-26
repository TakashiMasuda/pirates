//リソースフォルダのパスを指定する
var resources = '../../resources/';
//プリロードする画像のパスの配列を作る
var preloadImages = ['mapframe.png','map00.png','maptiles.png','ships.png']

/**
 * enchant.js を使う前に必要な処理。
 */
enchant();

window.onload = function(){

    var game = new Core(960, 640);

    /**
     * 必要なファイルを相対パスで引数に指定する。 ファイルはすべて、ゲームが始まる前にロードされる。
     */
    //画像パスを用意する
    var mapFrame  = resources + preloadImages[0];			//フレーム
    var mapBackground00  = resources + preloadImages[1];	//背景
    var mapTiles  = resources + preloadImages[2];			//マップのタイル
    var shipSpriteSheet  = resources + preloadImages[3];	//船の画像

    //画像のプリロードを行う
    game.preload(mapFrame);
    game.preload(mapBackground00);
    game.preload(mapTiles);
    game.preload(shipSpriteSheet);

    /**
     * Map のマスの定義
     */
    //連想配列にタイルの情報を定義する
    var tileTypes = {
        umi:  {id:0, name:"umi"},
        arai: {id:1, name:"arai"},
        asai: {id:2, name:"asai"},
        riku: {id:3, name:"riku"},
        iwa:  {id:4, name:"iwa"},
    };

    /**
     * Map クラス
     */
    //ゲームの背景スプライトをまとめて扱うクラス、GameMap
    var GameMap = Class.create({
    	//コンストラクタ。ゲームシーンとマップデータを引数にとる
        initialize: function(scene, mapData) {
            // 枠
            var frame = new Sprite(960, 640);
            //画像をセットする
            frame.image = game.assets[mapFrame];
            //フレームをゲームシーンに追加する
            scene.addChild(frame);
            //GameMapクラスのオブジェクトに作成したフレームのデータを追加する。
            this.frame = frame;

            // 背景
            var background = new Sprite(64*13, 64*9);
            //画像をセットする
            background.image = game.assets[mapBackground00];
            //背景画像の座標をそれぞれセットする
            background.x = 64;
            background.y = 10;
            //背景をシーンに追加する
            scene.addChild(background);
            //GameMapクラスのオブジェクトに作成した背景のデータを追加する。
            this.background = background;

            // マス
            var tiles = new Map(64, 64);
            //画像をセットする
            tiles.image = game.assets[mapTiles];
            //マスの配置を開始する座標を設定する
            tiles.x = 64;
            tiles.y = 10;
            //マップデータをロードする
            tiles.loadData(mapData);
            //マスを強めに透過する
            tiles.opacity = 0.25;
            //マスのデータをゲームシーンに追加する。
            scene.addChild(tiles);
            //GameMapクラスのオブジェクトに作成したマスのデータを追加する。
            this.tiles = tiles;

            // マップを大きさを保存する
            this.mapHeight = mapData.length;
            this.mapWidth  = mapData[0].length;

            //　元のマップデータから陸や岩のcollisionデータを生成します
            var mapCollisionData = [];	//あたり判定データの配列を用意する
            //マスの行数だけ繰り返すループを開始する
            for(var j=0; j < this.mapHeight; j++) {
            	//白紙のj行目を追加する
                mapCollisionData[j] = [];
                //マスの列数だけ繰り返すループを開始する
                for(var i=0; i < this.mapWidth; i++) {
                	//陸、岩のタイルであれば
                    if (mapData[j][i] == tileTypes.riku.id || mapData[j][i] == tileTypes.iwa.id) {
                        mapCollisionData[j].push(1);	//通れない判定のデータを配列に追加する
                    //それ以外のタイルであれば
                    } else {
                        mapCollisionData[j].push(0);	//通れる判定のデータを配列に追加する
                    }
                }
            }
            
            //このクラスのオブジェクトのマスのデータにあたり判定のデータを追加する
            this.tiles.collisionData = mapCollisionData

            var self = this;	//このクラスのオブジェクト自身を指すための変数を作る

            tiles.touchEnabled = true;	//マスのタッチ操作を有効にする
            //マスのタッチイベントを登録する。
            tiles.addEventListener(enchant.Event.TOUCH_END, function(params){
                self.ontouchend(params);	//タッチ後処理の関数をコールする
            });
        },

        //ワールド座標をローカル座標に変換する関数を定義する
        toLocalSpace:function(x,y) {
        	//ローカルのx座標、y座標をそれぞれ変数に入れる
            var localX = x //-this.tiles.x;
            var localY = y //-this.tiles.y;
            //各座標をオブジェクトで返す
            return {x:localX, y:localY}
        },

        //マスの情報を返す関数
        getTileInfo:function(id) {
        	//マスの種類を定義した連想配列を操作する
            for(t in tileTypes) {
            	//idに該当するマスの情報があれば
                if (tileTypes[t].id == id) {
                	//マスの情報を返す
                    return tileTypes[t];
                }
            }
        },

        //タッチ後の処理の関数
        ontouchend:function(params) {
        	//ローカル座標を関数により取得する
            var localPosition = this.toLocalSpace(params.x, params.y);

            //マスデータをチェックし、結果を変数に格納する
            var tileData = this.tiles.checkTile(localPosition.x, localPosition.y);
            //マス情報を取得し、変数に格納する
            var tileInfo = this.getTileInfo(tileData);

            //あたり判定テストを行い、通れない判定であれば
            if (this.tiles.hitTest(localPosition.x, localPosition.y) == true) {
                alert("通れない、"+tileInfo.name);		//通れないというメッセージとタイル情報を表示する
            //通れる判定であれば
            } else {
                alert("通れる、"+tileInfo.name);		//通れるというメッセージとタイル情報を表示する
            }
        },
    });

    //船クラスを作成する
    var Fune = Class.create(Sprite, {
    	//コンストラクタ。ゲームシーンのオブジェクトを引数にする
    	initialize: function(scene){
    		//スーパークラスのコンストラクタをコールする
    		Sprite.call(this, 96, 96);
    		
    		//船の画像をセットする
    		this.image = game.assets[shipsSpriteSheet];
    	}
    });
    
    /**
     * ロードが完了した直後に実行される関数を指定している。
     */
    game.onload = function(){
        var sceneGameMain = new Scene();

        // マスのデータ
        var mapDisplayData = [
            [3, 3, 2, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0],
            [3, 2, 0, 0, 2, 3, 3, 2, 0, 1, 0, 0, 0],
            [3, 0, 4, 0, 2, 3, 3, 2, 0, 0, 0, 0, 0],
            [3, 0, 0, 0, 0, 2, 2, 0, 1, 1, 0, 0, 0],
            [0, 0, 0, 0, 4, 0, 0, 0, 1, 1, 0, 4, 0],
            [1, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 2],
            [0, 0, 0, 3, 3, 2, 0, 0, 0, 0, 4, 2, 3],
            [0, 0, 0, 3, 3, 3, 2, 0, 0, 2, 2, 3, 3],
        ];

        //GameMapクラスのオブジェクトを作成する
        var map = new GameMap(sceneGameMain, mapDisplayData);

        // ゲームにシーンを追加
        game.pushScene(sceneGameMain);
    };

    game.start();	//ゲームを開始する
};
