//リソースフォルダのパスを指定する
var resources = '../../resources/';
//プリロードする画像のパスの配列を作る
var preloadImages = ['mapframe.png','map00.png','maptiles.png','ships.png', 'mapui.png']

/**
 * enchant.js を使う前に必要な処理。
 */
enchant();

window.onload = function(){

	//ゲーム画面本体を作成する
    var game = new Core(960, 640);
    game.fps = 30;	//fpsを30にする
    
    /**
     * 必要なファイルを相対パスで引数に指定する。 ファイルはすべて、ゲームが始まる前にロードされる。
     */
    //画像パスを用意する
    var mapFrame  = resources + preloadImages[0];			//フレーム
    var mapBackground00  = resources + preloadImages[1];	//背景
    var mapTiles  = resources + preloadImages[2];			//マップのタイル
    var shipsSpriteSheet  = resources + preloadImages[3];	//船の画像
    var mapUI  = resources + preloadImages[4];				//マップマーカー

    //画像のプリロードを行う
    game.preload(mapFrame);
    game.preload(mapBackground00);
    game.preload(mapTiles);
    game.preload(shipsSpriteSheet);
    game.preload(mapUI);

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

            // underLayer
            var underLayer = new Group();
            underLayer.touchEnabled = false;
            scene.addChild(underLayer);
            this.underLayer = underLayer;
            
            // playLayer
            var playLayer = new Group()
            scene.addChild(playLayer);
            this.playLayer = playLayer;

            // overLayer
            var overLayer = new Group()
            scene.addChild(overLayer);
            this.overLayer = overLayer;
            
            
            tiles.touchEnabled = true;	//マスのタッチ操作を有効にする
            
            //マスのタッチ終了イベントを登録する。
            tiles.addEventListener(enchant.Event.TOUCH_END, function(params){
                self.ontouchend(params);	//タッチ後処理の関数をコールする
            });
            //マスのタッチ開始イベントを登録する。
            tiles.addEventListener(enchant.Event.TOUCH_START, function(params){
                self.ontouchupdate(params);		//タッチドラッグの関数をコールする
            });
            //マスのタッチ中移動イベントを登録する。
            tiles.addEventListener(enchant.Event.TOUCH_MOVE, function(params){
                self.ontouchupdate(params);		//タッチドラッグの関数をコールする
            });
        },
        //コントローラーをセットする
        setController: function(controller) {
            this.controller = controller;
        },

        //ワールド座標をローカル座標に変換する関数を定義する
        toLocalSpace:function(x,y) {
        	//ローカルのx座標、y座標をそれぞれ変数に入れる
            var localX = x - this.tiles.x;
            var localY = y - this.tiles.y;
            //各座標をオブジェクトで返す
            return {x:localX, y:localY}
        },
        //ローカル座標をワールド座標に変換する関数
        toWorldSpace:function(localX, localY) {
            var worldX = localX +this.tiles.x;
            var worldY = localY +this.tiles.y;
            return {x:worldX, y:worldY};
        },
        //ローカル座標からマス目を返す関数
        getMapTileAtPosition: function(localX, localY) {
            return {
            	//ローカル座標からマス目を割り出し、返す
                i: Math.floor(localX/64),
                j: Math.floor(localY/64)
            };
        },

        //マス目からローカル座標を返す関数
        getMapPositionAtTile: function(i,j) {
            return {
            	//マス目の座標番号とマス目の大きさをかけ、実際の座標を取得して返す
                localX: i *64,
                localY: j *64
            };
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
        //オブジェクトをセットする関数
        addChild: function(object) {
        	//ゲーム領域となるレイヤーに引数のオブジェクトを配置する
            this.playLayer.addChild(object);
        },
        //船の座標をセットする関数
        positionFune: function(fune, i, j) {
        	//ゲームマップに船の座標を登録する
            this.positonObject(fune, i, j);

        },
        //座標オブジェクトを作る関数
        positonObject: function(object, i, j) {
            var postion = this.getMapPositionAtTile(i, j);
            var worldPosition = this.toWorldSpace(postion.localX, postion.localY);

            object.x = worldPosition.x;
            object.y = worldPosition.y;

            object.i = i;
            object.j = j;
        },

        //ユークリッド距離でマス目の距離を算出する関数
        getEuclideanDistance: function(startI, startJ, endI, endJ) {
            var distanceSq = Math.pow(startI -endI, 2) +Math.pow(startJ -endJ, 2);
            var distance   = Math.sqrt(distanceSq);
            return distance;
        },

        //マンハッタン距離でマス目の距離を算出する関数
        getManhattanDistance: function(startI, startJ, endI, endJ) {
            var distance = Math.abs(startI -endI) +Math.abs(startJ -endJ);
            return distance;
        },

        //チェビシェフ距離でマス目の距離を算出する関数
        getChebyshevDistance: function(startI, startJ, endI, endJ) {
            var distance = Math.max(Math.abs(startI -endI), Math.abs(startJ -endJ));
            return distance;
        },
        
        //アクティブの船を設定する関数
        setActiveFune: function(fune) {
            fune.map = this;
        	this.activeFune = fune;
            this.drawMovementRange();
        },
        //引数の座標がマップの外か内かを判定する関数
        outOfBorders: function(i, j) {
            if (i < 0) return true;
            if (i >= this.mapWidth) return true;
            if (j < 0) return true;
            if (j >= this.mapHeight) return true;

            return false;
        },        
        //タッチ後の処理の関数
        ontouchend:function(params) {
        	//マップマーカーがあれば
            if (this.mapMarker) {
            	//オーバーレイヤーからマップマーカーを消す
                this.overLayer.removeChild(this.mapMarker);
                //マップマーカーのデータを削除する
                delete this.mapMarker;
            }

        	//ローカル座標を関数により取得する
            var localPosition = this.toLocalSpace(params.x, params.y);

            //マスデータをチェックし、結果を変数に格納する
            var tileData = this.tiles.checkTile(localPosition.x, localPosition.y);
            //マス情報を取得し、変数に格納する
            var tileInfo = this.getTileInfo(tileData);

            //あたり判定テストを行い、通れない判定であれば
            if (this.tiles.hitTest(localPosition.x, localPosition.y) == true) {
                alert("通れない、"+tileInfo.name);		//通れないというメッセージとタイル情報を表示する
                console.log("通れない", tileInfo.name, "world X", params.x, "localX", localPosition.x, "worldY", params.y, "localY", localPosition.y)
            //通れる判定であれば
            } else {
                alert("通れる、"+tileInfo.name);		//通れるというメッセージとタイル情報を表示する
                var tile = this.getMapTileAtPosition(localPosition.x, localPosition.y);
                //ゲーム画面の外をタッチしていたら
                if (this.outOfBorders(tile.i, tile.j)) {
                    return;	//移動処理を行わない
                }
                console.log("i", tile.i, "j", tile.j, "distance", this.getManhattanDistance(this.activeFune.i, this.activeFune.j, tile.i, tile.j));

                //マンハッタン距離による計算で、船の移動力が足りていれば
                if (this.getManhattanDistance(this.activeFune.i, this.activeFune.j, tile.i, tile.j) <= this.activeFune.getMovement()) {
                    this.positionFune(this.activeFune, tile.i, tile.j);	//船の移動を行う
                    this.drawMovementRange();	//船で動ける範囲の表示を更新する
                    this.controller.endTurn();
                }
            }
       },
       
       //タッチ後の更新イベント
       ontouchupdate: function(params) {
    	   //タッチのローカル座標を取得する
           var localPosition = this.toLocalSpace(params.x, params.y);
           //タイルの位置を取得する
           var tile = this.getMapTileAtPosition(localPosition.x, localPosition.y);
           //ゲーム画面外なら
           if (this.outOfBorders(tile.i, tile.j)) {
               return	//処理を行わない
           }

           //マップマーカーがなければ
           if (this.mapMarker == undefined) {
        	   //新たにマップマーカーのスプライトを作る
               this.mapMarker = new Sprite(64, 64);
               //マップマーカーの画像をロードする
               this.mapMarker.image = game.assets[mapUI];
               //マップマーカーのポジションオブジェクトを作る
               this.positonObject(this.mapMarker, tile.i, tile.j);
               //オーバーレイヤーにマップマーカーを追加する
               this.overLayer.addChild(this.mapMarker);
           //マップマーカーがあれば
           } else {
        	   //マップマーカーを移動させる
               this.positonObject(this.mapMarker, tile.i, tile.j);
           }

           //通れない場所をタッチしていたら
           if (this.tiles.hitTest(localPosition.x, localPosition.y) == true) {
               this.mapMarker.frame = 1;	//マップマーカーのframeの値を1にする
               //通れる場所であり
           } else {
        	   //移動距離の範囲内であれば
               if (this.getManhattanDistance(this.activeFune.i, this.activeFune.j, tile.i, tile.j) <= this.activeFune.getMovement()) {
                   this.mapMarker.frame = 0;	//frameを0にする
               //移動距離の範囲外であれば
               } else {
                   this.mapMarker.frame = 1;	//frameを1にする
               }
           }
       },
       drawMovementRange: function() {
           console.log("update drawMovementRange")
           if (this.areaRangeLayer) {
               this.underLayer.removeChild(this.areaRangeLayer);
               delete this.areaRangeLayer;
           }

           this.areaRangeLayer = new Group();
           this.underLayer.addChild(this.areaRangeLayer);

           for (var rangeI = -this.activeFune.getMovement(); rangeI <= this.activeFune.getMovement(); rangeI++) {
               var targetI = this.activeFune.i +rangeI;
               for (var rangeJ = -this.activeFune.getMovement(); rangeJ <= this.activeFune.getMovement(); rangeJ++) {
                   var targetJ = this.activeFune.j +rangeJ;

                   if (!this.outOfBorders(targetI, targetJ)) {
                       if (this.getManhattanDistance(this.activeFune.i, this.activeFune.j, targetI, targetJ) <= this.activeFune.getMovement()) {
                           var areaSprite = new Sprite(64, 64);
                           areaSprite.touchEnabled = false;
                           areaSprite.image = game.assets[mapUI];
                           var position = this.getMapPositionAtTile(targetI, targetJ);
                           if (this.tiles.hitTest(position.localX, position.localY) == true) {
                               areaSprite.frame = 3;
                           } else {
                               areaSprite.frame = 2;
                           }
                           this.positonObject(areaSprite, targetI, targetJ);
                           this.areaRangeLayer.addChild(areaSprite);
                       }
                   }
               }
           }
       }
    });

    //船クラスを作成する
    var Fune = Class.create(Sprite, {
    	//コンストラクタ。ゲームシーンのオブジェクトを引数にする
    	initialize: function(scene){
    		//スーパークラスのコンストラクタをコールする
    		Sprite.call(this, 64, 64);
    		//船にステータスを設定する
    		this.stats = {
    				//移動力
    				movement:3
    		};
    		//船の画像をセットする
    		this.image = game.assets[shipsSpriteSheet];
    		//アニメーションを設定する
    		this.frame = [0,0,0,0, 1, 1, 1, 2, 2, 1, 1, 0, 0, 0, 0, 3, 3, 3];
    	},
    	//移動を取得するメソッド
    	getMovement:function(){
    		//移動力を返す
    		return this.stats.movement;
    	}
    });
    

    /**
     * プレイヤークラス
     */
    var GamePlayer = Class.create({
        initialize: function() {
            this.funeList = [];
        },

        isActive: function() {
            return this.myTurn;
        },

        setActive: function(flag) {
            this.myTurn = flag;
        },

        setController: function(controller) {
            this.controller = controller;
        },

        addFune: function(fune) {
            this.funeList.push(fune)
        },

        getFune: function(index) {
            return this.funeList[index];
        },

        getFuneCount: function() {
            return this.funeList.length;
        },

        getActiveFune: function() {
            if (this.activeShip) {
                return this.activeShip;
            } else {
                return this.funeList[0];
            }
        },

        setActiveFune: function(fune) {
            this.activeShip = fune;
        },
    });    
    
    /**
     * ゲーム管理クラス
     */
    var GameManager = Class.create({
        initialize: function() {
            this.playerList = [];
            this.turnCounter = 0;
        },

        addPlayer: function(player) {
            player.setController(this);
            this.playerList.push(player)
        },

        setMap: function(map) {
            map.setController(this);
            this.map = map;
        },

        setTurnUI: function(ui) {
            this.turnUI = ui;
        },

        setStartPositions: function(startPositions) {
            this.startPositions = startPositions;
        },

        getActivePlayer: function() {
            return this.playerList[this.turnCounter % this.playerList.length];
        },

        beginGame: function() {
            var player1 = this.playerList[0];
            for(var funeIndex = 0; funeIndex < player1.getFuneCount(); funeIndex++) {
                var fune = player1.getFune(funeIndex);
                this.map.addChild(fune);
                var startPosition = this.startPositions.player1[funeIndex]
                this.map.positionFune(fune, startPosition.i, startPosition.j);
            }

            var player2 = this.playerList[1];
            for(var funeIndex = 0; funeIndex < player2.getFuneCount(); funeIndex++) {
                var fune = player2.getFune(funeIndex);
                fune.originX = 32;
                fune.scaleX = -1;
                this.map.addChild(fune);
                var startPosition = this.startPositions.player2[funeIndex]
                this.map.positionFune(fune, startPosition.i, startPosition.j);

            }

            this.startTurn();
        },

        startTurn: function() {
            var player = this.getActivePlayer();
            player.setActive(true);

            this.updateTurn();
        },

        updateTurn: function() {
            this.map.setActiveFune(this.getActivePlayer().getActiveFune());
            this.map.drawMovementRange();
            this.turnUI.updateTurn(this.turnCounter);
            this.turnUI.updatePlayer(this.getActivePlayer().getData("name"));
        },

        endTurn: function() {
            var player = this.getActivePlayer();
            player.setActive(false);

            this.turnCounter++;
            this.startTurn();
        },
    })    
    
    /**
     * ターン関係の情報を表示するクラス
     */
    var TurnUI = Class.create(Label, {
        initialize: function(scene) {
            Label.call(this);
            scene.addChild(this);
            this.x = 64;
            this.y = 640 -50;
            this.font = "32px 'ＭＳ ゴシック', arial, sans-serif";
            this.color = "rgba(20, 20, 255, 1.0)"
        },

        updateTurn: function(turn) {
            this.text = "ターン:"+turn;
        },
        updatePlayer: function(name) {
            this.playerLabel.text = name;
        },
    })

    /**
     * ロードが完了した直後に実行される関数を指定している。
     */
    game.onload = function(){
    	//ゲームのシーンを作成する
        var sceneGameMain = new Scene();

        // ゲームロジックの管理クラスを作る
        var manager = new GameManager();

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

        //ゲームマップを作る
        var map = new GameMap(sceneGameMain, mapDisplayData);
        manager.setMap(map);	//管理クラスにマップを登録する

        //ターン表示UIを生成する
        var turnUI = new TurnUI(sceneGameMain);
        //管理クラスにターン表示UIをセットする
        manager.setTurnUI(turnUI);

        // プレイヤー１を作る
        var player1 = new GamePlayer({name:"プレイヤー１"});
        //プレイヤー1を登録する
        manager.addPlayer(player1);

        //for文でプレイヤーの船を複数つくる
        for(var i = 0; i < 4; i++){
	        //船を作成する
	        var fune = new Fune();
	        //船をプレイヤーに登録する
	        player1.addFune(fune);
        }

        // プレイヤー2を作る
        var player2 = new GamePlayer({name:"プレイヤー2"});
        //プレイヤー2を登録する
        manager.addPlayer(player2);
        
        //for文でプレイヤーの船を複数つくる
        for(var i = 0; i < 4; i++){
        	//船を作成する
        	var fune = new Fune();
        	//船をプレイヤーに登録する
        	player2.addFune(fune);
        }
        
        // 船の初期の位置を設定する
        var startPositions = {
        	//プレイヤー1が持つ船
            player1: [
                      //1〜4番目の船の初期位置をオブジェクトで作成し、配列に格納する
                      {i: 0, j: 8}, {i: 0, j: 6}, {i: 1, j: 7}, {i: 2, j: 8}
            ],
            player2: [
                      //1〜4番目の船の初期位置をオブジェクトで作成し、配列に格納する
                      {i: 12, j: 0}, {i: 10, j: 0}, {i: 11, j: 1}, {i: 12, j: 2}
            ]
        }
        //船の開始位置を管理クラスに登録する
        manager.setStartPositions(startPositions);

        // ゲームにシーンを追加
        game.pushScene(sceneGameMain);

        // ゲームのロジック開始
        manager.beginGame();
    }; 
    
    
    game.start();	//ゲームを開始する
};
