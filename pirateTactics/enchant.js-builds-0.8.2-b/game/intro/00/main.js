/**
 * enchant.js を使う前に必要な処理。
 */
enchant();

window.onload = function(){

	//ゲーム領域のサイズを指定し、ゲームの本体を作る
    var game = new Core(960, 640);
    game.fps = 30; //fps 一秒に何回を画面更新する

    //必要なファイルのパスを変数に格納しておく。相対パスで設定する。
    var mapFrame  = "../../resources/mapframe.png";
    var mapBackground00  = "../../resources/map00.png";
    var mapTiles  = "../../resources/maptiles.png";
    var mapUI  = "../../resources/mapui.png";
    var shipsSpriteSheet  = "../../resources/ships.png";
    //海賊画像は配列にしておく
    var pirateSprites = [
                         "../../resources/pirate00.png",
                         "../../resources/pirate01.png",
                         "../../resources/pirate02.png",
                         "../../resources/pirate03.png",
                         ];
    var pirateChibiSprites = [
                              "../../resources/pirateChibi00.png",
                              "../../resources/pirateChibi01.png",
                              "../../resources/pirateChibi02.png",
                              "../../resources/pirateChibi03.png",
                              ];
    var ui1x1Black    = "../../resources/1x1black.png";
    var uiWindowSprite    = "../../resources/window.png";
    var uiCancelBtnSprite = "../../resources/btnCancel.png";
    var uiHealthBack      = "../../resources/healthBack.png";
    var uiHealthRed       = "../../resources/healthRed.png";
    var uiHealthGreen     = "../../resources/healthGreen.png";
    var explosionSpriteSheet  = "../../resources/explosion.png";
    var uiPlayerBanner1   = "../../resources/playerBanner1.png";
    var uiPlayerBanner2   = "../../resources/playerBanner2.png";
    var uiWin             = "../../resources/win.png";
    var uiLose            = "../../resources/lose.png";

    //変数にパスを格納した画像のプリロードを開始する
    game.preload(mapFrame);
    game.preload(mapBackground00);
    game.preload(mapTiles);
    game.preload(mapUI);
    game.preload(shipsSpriteSheet);
    //海賊画像は配列なので、for文でセットする
    for (var i=0; i < pirateSprites.length; ++i) {
    	game.preload(pirateSprites[i]);
    }
    for (var i=0; i < pirateChibiSprites.length; ++i) {
    	game.preload(pirateChibiSprites[i]);
    }
    game.preload(ui1x1Black);
    game.preload(uiWindowSprite);
    game.preload(uiCancelBtnSprite);
    game.preload(uiHealthBack);
    game.preload(uiHealthRed);
    game.preload(uiHealthGreen);
    game.preload(explosionSpriteSheet);
    game.preload(uiPlayerBanner1);
    game.preload(uiPlayerBanner2);
    game.preload(uiWin);
    game.preload(uiLose);

    //フォントファミリーとフォントサイズを変数に格納しておく
    var fontStyle = "32px 'ＭＳ ゴシック', arial, sans-serif";

    //距離計算関数を連想配列にまとめる
    var utils = {
    	//ユークリッド距離
        getEuclideanDistance: function(startI, startJ, endI, endJ) {
            //平方根を中心とした計算を行う
        	var distanceSq = Math.pow(startI -endI, 2) +Math.pow(startJ -endJ, 2);
            var distance   = Math.sqrt(distanceSq);
            return distance;	//距離を返す
        },
        //マンハッタン距離。このゲームではこの距離計算を利用する
        getManhattanDistance: function(startI, startJ, endI, endJ) {
            //斜め移動は2マスの移動として計算する
        	var distance = Math.abs(startI -endI) +Math.abs(startJ -endJ);
            return distance;	//距離を返す
        },
        //チェビシェフ距離
        getChebyshevDistance: function(startI, startJ, endI, endJ) {
            //斜め移動は1マスとして計算する
        	var distance = Math.max(Math.abs(startI -endI), Math.abs(startJ -endJ));
            return distance;	//距離を返す
        },
        //UI操作を一時不能にするための関数
        beginUIShield: function() {
        	//シールドスプライトを生成する
            var shieldSprite = new Sprite(960, 640);
            //任意の画像をセットする
            shieldSprite.image = game.assets[ui1x1Black];
            //透過率を100%にする
            shieldSprite.opacity = 0.0;
            //表面にシールドスプライトを展開する
            game.currentScene.addChild(shieldSprite);
            //シールドスプライトへの参照をutilに追加する
            utils.shieldSprite = shieldSprite;
        },
        //UI操作不能状態を解除するための関数
        endUIShield: function() {
        	//シールドスプライトが存在すれば
            if (utils.shieldSprite) {
            	//シールドスプライトを削除する
                game.currentScene.removeChild(utils.shieldSprite);
                utils.shieldSprite = null;	//utils内のシールドスプライトへの参照をなくす
            }
        }
    };

    //マスのタイプの定義のための連想配列を作成する
    var tileTypes = {
    	//海
        umi:  {id:0, name:"umi"},
        //荒海
        arai: {id:1, name:"arai"},
        //浅瀬
        asai: {id:2, name:"asai"},
        //陸地
        riku: {id:3, name:"riku"},
        //岩礁
        iwa:  {id:4, name:"iwa"},
    };

    //ゲームマップのクラスを作成する
    var GameMap = Class.create({
    	//コンストラクタ。ゲームシーンとマップデータの二次元配列を引数にする
        initialize: function(scene, mapData) {
            // 画面の枠のスプライトを作る
            var frame = new Sprite(960, 640);
            //プリロードしたフレーム画像をセットする
            frame.image = game.assets[mapFrame];
            //シーンに画面の枠のスプライトを設定する
            scene.addChild(frame);
            //クラスのインスタンスに画面の枠のスプライトへの参照を持たせる
            this.frame = frame;

            // 画面の背景のスプライトを作る
            var background = new Sprite(64*13, 64*9);
            //プリロードした背景画像をセットする
            background.image = game.assets[mapBackground00];
            //スプライトのx座標、y座標を指定する
            background.x = 64;
            background.y = 10;
            //シーンに画面の枠のスプライトを設定する
            scene.addChild(background);
            //クラスのインスタンスに画面の背景のスプライトへの参照を持たせる
            this.background = background;

            // マス目を作る
            var tiles = new Map(64, 64);
            //スプライトシートの画像をセットする
            tiles.image = game.assets[mapTiles];
            //タイルの配置を開始する座標をセットする
            tiles.x = 64;
            tiles.y = 10;
            //マップデータを使ってマスの配置を行う
            tiles.loadData(mapData);
            //マスを透過する
            tiles.opacity = 0.25;
            //設定の終わったマス目のオブジェクトをシーンに追加する
            scene.addChild(tiles);
            //クラスのインスタンスにマス目のオブジェクトへの参照を持たせる
            this.tiles = tiles;

            // マップを大きさを保存
            this.mapHeight = mapData.length;
            this.mapWidth  = mapData[0].length;

            //　元のマップデータから陸や岩のcollision(あたり判定)データを生成します
            var mapCollisionData = [];	//あたり判定データの配列を用意する
            //マスの行数だけ繰り返すループを開始する
            for(var j=0; j < this.mapHeight; j++) {
            	//白紙のj行目を追加する
               mapCollisionData[j] = [];
               //マスの列数だけ繰り返すループを開始する
                for(var i=0; i < this.mapWidth; i++) {
                	//陸、岩のマスであれば
                    if (mapData[j][i] == tileTypes.riku.id || mapData[j][i] == tileTypes.iwa.id) {
                        mapCollisionData[j].push(1);	//通れない判定のデータを配列に追加する
                      //それ以外のマスであれば
                    } else {
                        mapCollisionData[j].push(0);	//通れる判定のデータを配列に追加する
                    }
                }
            }
            //マップのあたり判定データの参照を、クラスのマス目オブジェクトに追加する
            this.tiles.collisionData = mapCollisionData

            // アンダーレイヤーを用意する
            var underLayer = new Group();
            //タッチ不可能にする
            underLayer.touchEnabled = false;
            //シーンに追加する
            scene.addChild(underLayer);
            //クラスのオブジェクトにアンダーレイヤーへの参照を持たせる
            this.underLayer = underLayer;

            //プレイレイヤーを用意する
            var playLayer = new Group();
            //タッチ不可能にする
            playLayer.touchEnabled = false;
            //シーンに追加する
            scene.addChild(playLayer);
            //クラスのオブジェクトにプレイレイヤーへの参照を持たせる
            this.playLayer = playLayer;

            //オーバーレイヤー
            var overLayer = new Group();
            //タッチ不可能にする
            overLayer.touchEnabled = false;
            //シーンに追加する
            scene.addChild(overLayer);
            //クラスのオブジェクトにオーバーレイヤーへの参照を持たせる
            this.overLayer = overLayer;

            //このクラスのオブジェクト自身への参照を変数に保存する
            var self = this;
            //マス目のタッチを有効にする
            tiles.touchEnabled = true;
            //マス目のタッチ終了イベントを登録する
            tiles.addEventListener(enchant.Event.TOUCH_END, function(params){
                //タッチ終了時の処理の関数をコールする
            	self.ontouchend(params);
            });
            //マス目のタッチ開始イベントを登録する
            tiles.addEventListener(enchant.Event.TOUCH_START, function(params){
                //タッチ中の処理の関数をコールする
            	self.ontouchupdate(params);
            });
            //マス目のタッチ移動イベントを登録する
            tiles.addEventListener(enchant.Event.TOUCH_MOVE, function(params){
                //タッチ中の処理の関数をコールする
                self.ontouchupdate(params);
            });
            //マス目の描画がなされるごとに起きるイベントを登録する
            tiles.addEventListener(enchant.Event.ENTER_FRAME, function(params){
                self.zsort();	//Z軸の重なりを整理する
            });
        },

        //操縦者をセットする関数
        setController: function(controller) {
            //引数に指定されたプレイヤーを現在の操縦者としてセットする
        	this.controller = controller;
        },
        //ワールド座標をローカル座標に変換する関数
        toLocalSpace:function(worldX, worldY) {
        	//計算し、ローカル座標を割り出す
            var localX = worldX -this.tiles.x;
            var localY = worldY -this.tiles.y;
            //座標をオブジェクトにまとめて返す
            return {x:localX, y:localY};
        },
        //ローカル座標をワールド座標に変換する関数
        toWorldSpace:function(localX, localY) {
        	//計算し、ワールド座標を割り出す
            var worldX = localX +this.tiles.x;
            var worldY = localY +this.tiles.y;
            //座標をオブジェクトにまとめて返す
            return {x:worldX, y:worldY};
        },
        //座標からマス目の座標を割り出す関数
        getMapTileAtPosition: function(localX, localY) {
            return {
            	//座標をマス目の幅、高さで割ってマス目の座標にして返す
                i: Math.floor(localX/64),
                j: Math.floor(localY/64)
            };
        },
        
        //マス目の座標からローカル座標を割り出す関数
        getMapPositionAtTile: function(i,j) {
            return {
            	//マス目の座標にマス目の高さ、幅をかけてローカル座標として返す
                localX: i *64,
                localY: j *64
            };
        },
        //マス目の詳細情報を返す関数
        getTileInfo:function(id) {
        	//マス目のタイプの情報をまとめた連想配列を走査する
            for(t in tileTypes) {
            	//引数のIDとマス目情報の連想配列のキーが一致したら
                if (tileTypes[t].id == id) {
                	//該当する情報を返す
                    return tileTypes[t];
                }
            }
        },

        //プレイレイヤーにオブジェクトを追加する関数
        addChild: function(object) {
        	//プレイレイヤーにオブジェクトを追加する
            this.playLayer.addChild(object);
        },
        //オブジェクトの座標を割り出し、そのオブジェクト自身に座標情報をセットする関数
        positonObject: function(object, i, j) {
        	//マス目からローカル座標を取得する
            var postion = this.getMapPositionAtTile(i, j);
            //取得したローカル座標からワールド座標を割り出す
            var worldPosition = this.toWorldSpace(postion.localX, postion.localY);
            
            //オブジェクトにワールド座標を追加する
            object.x = worldPosition.x;
            object.y = worldPosition.y;
            //マス目の座標もセットする
            object.i = i;
            object.j = j;
        },

        //船の位置をセットする関数
        positionFune: function(fune, i, j) {
            this.positonObject(fune, i, j);

        },
        
        //船をアニメーションしながら移動させる関数
        moveFune: function(fune, i, j, onEnd) {
        	//マス目から船のローカル座標を取得する
            var postion = this.getMapPositionAtTile(i, j);
            //ワールド座標を取得する
            var worldPosition = this.toWorldSpace(postion.localX, postion.localY);
            //ワールド座標から、移動先への距離を算出する
            var distance = utils.getEuclideanDistance(fune.i, fune.j, i, j);

            //船のインスタンスに元の座標を記録する
            fune.i = i;
            fune.j = j;

            //船を目的地までアニメーションしながら移動させる
            fune.tl.moveTo(worldPosition.x, worldPosition.y, distance *10, enchant.Easing.QUAD_EASEINOUT).then(onEnd);
        },

        //ユークリッド距離を取得する関数
        getEuclideanDistance: function(startI, startJ, endI, endJ) {
            return utils.getEuclideanDistance(startI, startJ, endI, endJ);
        },
        //マンハッタン距離を取得する関数
        getManhattanDistance: function(startI, startJ, endI, endJ) {
            return utils.getManhattanDistance(startI, startJ, endI, endJ);
        },
        //チェビシェフ距離を取得する関数
        getChebyshevDistance: function(startI, startJ, endI, endJ) {
            return utils.getChebyshevDistance(startI, startJ, endI, endJ);
        },

        //座標の画面外判定を行う関数
        outOfBorders: function(i, j) {
        	//座標がマイナスか、マップは時を超えていればtrueを返す
            if (i < 0) return true;
            if (i >= this.mapWidth) return true;
            if (j < 0) return true;
            if (j >= this.mapHeight) return true;

            //どれにも当てはまらなければ、画面内判定としてfalseを返す
            return false;
        },

        setActiveFune: function(fune) {
            fune.map = this;
            this.activeFune = fune;
            this.drawMovementRange()
        },

        //マス目のタッチ終了イベントの関数
        ontouchend:function(params) {
        	//マップマーカーが表示されているなら
            if (this.mapMarker) {
            	//オーバーレイヤー内のマップマーカーを消去する
                this.overLayer.removeChild(this.mapMarker)
                //クラスのオブジェクトに保存されたマップマーカーへの参照を消去する
                delete this.mapMarker;
            }

            //タッチしたローカル座標を取得する
            var localPosition = this.toLocalSpace(params.x, params.y);

            //マス目のデータを取得する
            var tileData = this.tiles.checkTile(localPosition.x, localPosition.y);
            //マス目の情報を取得する
            var tileInfo = this.getTileInfo(tileData);

            //タッチしたマス目に障害物判定があれば
            if (this.tiles.hitTest(localPosition.x, localPosition.y) == true) {
               //通れないというログを出し、何もせずに終わる
            	console.log("通れない", tileInfo.name, "world X", params.x, "localX", localPosition.x, "worldY", params.y, "localY", localPosition.y)
            //障害物判定がなければ
            } else {
            	//通れるというログを出す
                console.log("通れる", tileInfo.name, "world X", params.x, "localX", localPosition.x, "worldY", params.y, "localY", localPosition.y)

                //座標からマス目を取得する
                var tile = this.getMapTileAtPosition(localPosition.x, localPosition.y);
                //タッチしたマス目が画面外なら
                if (this.outOfBorders(tile.i, tile.j)) {
                    return;	//処理を終える
                }
                //座標に関連するログを出す
                console.log("i", tile.i, "j", tile.j, "distance", this.getManhattanDistance(this.activeFune.i, this.activeFune.j, tile.i, tile.j));

                //船が移動可能な場所をタッチしていたら
                if (this.getManhattanDistance(this.activeFune.i, this.activeFune.j, tile.i, tile.j) <= this.activeFune.getMovement()) {
                    var self = this;		//自身への参照を変数に保存する
                    utils.beginUIShield();	//UIを操作できなくする
                    //船をアニメーションしながら移動させる
                    self.moveFune(self.activeFune, tile.i, tile.j, function() {
                        self.controller.endTurn();	//移動が終わったらターンを終了する
                    });
                }
            }
        },
        
        //ドラッグ中のイベントの関数
        ontouchupdate: function(params) {
        	//ローカル座標のオブジェクトを取得する
            var localPosition = this.toLocalSpace(params.x, params.y);
            //マス目を取得する
            var tile = this.getMapTileAtPosition(localPosition.x, localPosition.y);
            //画面外判定を行う
            if (this.outOfBorders(tile.i, tile.j)) {
                //タッチ座標が画面外であれば処理を終える
            	return;
            }

            //マップマーカーが生成されていなければ
            if (this.mapMarker == undefined) {
            	//マップマーカーのスプライトを作り
                this.mapMarker = new Sprite(64, 64);
                //画像をセットして
                this.mapMarker.image = game.assets[mapUI];
                //座標もセットして
                this.positonObject(this.mapMarker, tile.i, tile.j);
                //オーバーレイヤーに追加する
                this.overLayer.addChild(this.mapMarker);
            //マップマーカーが生成済みであれば
            } else {
            	//マップマーカーの座標だけ更新する
                this.positonObject(this.mapMarker, tile.i, tile.j);
            }

            //マップマーカーが指すマスにあたり判定があれば
            if (this.tiles.hitTest(localPosition.x, localPosition.y) == true) {
            	//マップマーカーをの色を灰色にして、移動できない場所であることを伝える
            	this.mapMarker.frame = 1;
            //あたり判定がなければ
            } else {
                //船の移動力からして移動可能の場所であれば
            	if (this.getManhattanDistance(this.activeFune.i, this.activeFune.j, tile.i, tile.j) <= this.activeFune.getMovement()) {
                	//マップマーカーをの色を赤にして、移動できる場所であることを伝える
                    this.mapMarker.frame = 0;
               //遠すぎたら
            	} else {
                	//マップマーカーをの色を灰色にして、移動できない場所であることを伝える
                    this.mapMarker.frame = 1;
                }
            }
        },

        //移動可能領域を表示する関数
        drawMovementRange: function() {
        	//描画をおこなうごとにコンソールにログを出す
            console.log("update drawMovementRange");
            //移動可能場所のレイヤーがある状態なら
            if (this.areaRangeLayer) {
            	//既存の移動可能場所のレイヤーを消す
                this.underLayer.removeChild(this.areaRangeLayer);
                delete this.areaRangeLayer;
            }

            //移動可能場所のレイヤーのベースを作る
            this.areaRangeLayer = new Group();
            //アンダーレイヤーに移動可能場所のレイヤーを加える
            this.underLayer.addChild(this.areaRangeLayer);

            //船の移動力のマイナス値からプラス値の範囲まで走査する
            for (var rangeI = -this.activeFune.getMovement(); rangeI <= this.activeFune.getMovement(); rangeI++) {
                //現在描画対象となっている行の座標を割り出す
            	var targetI = this.activeFune.i +rangeI;
            	//列側の走査を行う
                for (var rangeJ = -this.activeFune.getMovement(); rangeJ <= this.activeFune.getMovement(); rangeJ++) {
                    //対象となる列番号を割り出す
                	var targetJ = this.activeFune.j +rangeJ;
                	//マス目が画面外でなければ
                    if (!this.outOfBorders(targetI, targetJ)) {
                        //座標が移動力の範囲内であれば
                    	if (this.getManhattanDistance(this.activeFune.i, this.activeFune.j, targetI, targetJ) <= this.activeFune.getMovement()) {
                            //移動可能領域のマスのスプライトを作る
                    		var areaSprite = new Sprite(64, 64);
                    		//タッチできないようにする
                            areaSprite.touchEnabled = false;
                            //画像をセットする
                            areaSprite.image = game.assets[mapUI];
                            //位置のオブジェクトを作成する
                            var position = this.getMapPositionAtTile(targetI, targetJ);
                            //あたり判定テストを行い、あたり判定がある場所であれば
                            if (this.tiles.hitTest(position.localX, position.localY) == true) {
                                areaSprite.frame = 3;	//移動可能領域のマスの色を3番のものにする
                            //移動可能の場所であったら
                            } else {
                                areaSprite.frame = 2;	//2番の色にする
                            }
                            //座標を保存する
                            this.positonObject(areaSprite, targetI, targetJ);
                            //移動可能領域のマスを移動可能領域レイヤーにセットする
                            this.areaRangeLayer.addChild(areaSprite);
                        }
                    }
                }
            }
        },
        zsort: function() {
            var zorder = [];
            for (var c=0; c < this.playLayer.childNodes.length; ++c) {
                zorder.push(this.playLayer.childNodes[c]);
            }
            zorder.sort(function(a, b) {
                if (a.y > b.y) {
                    return 1;
                } else if (a.y == b.y) {
                    if (a.x > b.x) {
                        return 1;
                    } else if (a.x == b.x) {
                        return 0;
                    } else {
                        return -1;
                    }
                } else {
                    return -1;
                }
            });
            for (var i=0; i < zorder.length; ++i) {
                this.playLayer.addChild(zorder[i]);
            }
        }

    });


    /**
     * 基本船のクラス
     */
    var BaseFune = Class.create(Group, {
        initialize: function(id, stats) {
            Group.call(this);

            var fune = new Sprite(64, 64);
            this.fune = fune;
            fune.image = game.assets[shipsSpriteSheet];
            fune.frame = [0, 0, 0, 0, 1, 1, 1, 2, 2, 1, 1, 0, 0, 0, 0, 3, 3, 3];
            fune.sinkFrame = [3, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, null];
            this.addChild(fune);

            var healthBackSprite   = new Sprite(64, 12);
            this.healthBackSprite  = healthBackSprite;
            healthBackSprite.image = game.assets[uiHealthBack];
            healthBackSprite.y     = 64 -6;
            this.addChild(healthBackSprite);

            var healthRedSprite   = new Sprite(64, 12);
            this.healthRedSprite  = healthRedSprite;
            healthRedSprite.originX = 0
            healthRedSprite.image = game.assets[uiHealthRed];
            healthRedSprite.y     = 64 -6;
            this.addChild(healthRedSprite);

            var healthGreenSprite   = new Sprite(64, 12);
            this.healthGreenSprite  = healthGreenSprite;
            healthGreenSprite.originX = 0
            healthGreenSprite.image = game.assets[uiHealthGreen];
            healthGreenSprite.y     = 64 -6;
            this.addChild(healthGreenSprite);
            
            this.stats    = {
                id:        id,
                movement:  stats.movement,
                range:     stats.range,
                attack:    stats.attack,
                defense:   stats.defense,
                hpMax:     stats.hpMax,
            };
            this.stats.hp = this.stats.hpMax;

        },

        getId: function() {
            return this.stats.id;
        },

        getMovement: function() {
            return this.stats.movement;
        },

        getRange: function() {
            return this.stats.range;
        },

        getAttack: function() {
            return this.stats.attack;
        },

        getDefense: function() {
            return this.stats.defense;
        },

        getHPMax: function() {
            return this.stats.hpMax;
        },

        getHP: function() {
            return this.stats.hp;
        },

        getCaptainName: function() {
            return "無名";
        },

        getImage: function() {
            return game.assets[pirateSprites[this.getId() -1]]
        },

        getChibiImage: function() {
            return game.assets[pirateChibiSprites[this.getId() -1]]
        },
        //攻撃範囲の計算を行い、可能かどうかを返す
        withinRange: function(i, j) {
        	//自身の船と相手の船の距離をマンハッタン距離で導出する
            var distance = utils.getManhattanDistance(this.i, this.j, i, j);
            //情報をログに流す
            console.log("withinRange", "distance", distance, "range", this.stats.range, distance <= this.stats.range);
            //攻撃可能の範囲であれば
            if (distance <= this.stats.range) {
                return true;	//trueを返す
            //そうでなければ
            } else {
            	//falseを返す
                return false;
            }
        },
        //HPバーを更新する関数
        updateHPBar: function() {
        	//最大HPと現在のHPから比率を計算する
            var ratio = Math.max(this.stats.hp / this.stats.hpMax, 0);
            //HPが50%以上であれば
            if (ratio > 0.5) {
            	//比率の分だけ緑のバーを表示する
                this.healthGreenSprite.scaleX = ratio;
            //50%を割ったら
            } else {
            	//緑のバーを消す
                this.healthGreenSprite.scaleX = 0;
            }
            //赤いバーを比率に合わせて動かす
            this.healthRedSprite.scaleX = ratio;
        },

        //ダメージ計算を行う関数
        takeDamage: function(damage) {
        	//純ダメージを計算する
            var actualDamage = Math.max(damage -this.stats.defense, 1);
            //現在のHPからダメージ分を引く
            this.stats.hp -= actualDamage;
            //ダメージ計算の結果をHPバーに反映する
            this.updateHPBar();
            //計算後のHPを返す
            return this.stats.hp;
        },
        //ダメージ回復の処理を行う関数
        healDamage: function(recover) {
        	//recover分HPを回復させる。最大HPを超えたらその分は切り捨てる
            this.stats.hp = Math.min(this.stats.hp + recover, this.stats.hpMax);
        },

        //船の攻撃処理の関数
        attackFune: function(otherFune) {
            utils.beginUIShield();
           var damage;								//ダメージの値を格納する変数
            var baseDamage = this.stats.attack;		//攻撃側の船の攻撃力をダメージのベース値にする
            var variance   = Math.random() -0.5;	//ダメージのぶれの値を乱数生成する
            //変動が入ったダメージの計算を行う
            var variableDamage = (baseDamage /10) * variance;

            //ヒット判定の乱数を生成する
            var attackRoll = Math.random();

            //1割の確率で
            if (attackRoll > 0.9) {	
                // クリティカルヒット。ダメージが2倍になる
                damage = (baseDamage +variableDamage) *2;
                //クリティカルヒットのメッセージを出す
                alert("Critical!")
            //1割の確率で
            } else if (attackRoll < 0.1) {
                //攻撃がミスとなる
                damage = 0;
            //乱数がどちらの範囲にも当てはまらなければ
            } else {
            	//基礎ダメージ+ダメージ変動分をダメージとして扱う
                damage = baseDamage +variableDamage;
            }

            //ダメージの値に小数点以下があれば丸める
            damage = Math.ceil(damage);
            //ダメージが通っていれば
            if (damage > 0) {
            	//攻撃対象の船のHPを持ってくる
                var beforeHp = otherFune.getHP();
                //ダメージ計算を行い、計算後のHPを割り出す
                var afterHp  = otherFune.takeDamage(damage);
                
                //爆発エフェクトを作る
                var explosion = new Explosion();
                //爆発エフェクトが発生する座標を指定する
                explosion.x = otherFune.x +32;
                explosion.y = otherFune.y +32;

                //カレントのシーンに爆発エフェクトを投入する
                game.currentScene.addChild(explosion);
                
                //ダメージ計算の結果を表示する
                alert("beforeHp: "+beforeHp+" -"+damage+"(-DEF) ="+afterHp);
                //HPが削られきったら
                if (afterHp <= 0) {
                	//船がやられたメッセージを出す
                    alert("沈没した！");
                    //船の沈没処理の関数をコールする
                    otherFune.sinkShip();
                }
            //ダメージが通っていなければ
            } else {
            	//攻撃のミスが発生したと表示する
                alert("ミス！");
            }
            //ターンを終える
            this.player.controller.endTurn();
        },
        //タッチを行った後の関数
        ontouchend: function(params) {
        	//アクティブのプレイヤーであれば
            if (this.player.isActive()) {
            	//ステータスのポップアップを表示する
                if (this.player.getActiveFune() == this) {
                    var popup = new StatusWindow(this);
                    popup.onCancel = function() {

                    }
                } else {
                    this.player.setActiveFune(this);
                }
            } else {
                var activePlayer = this.player.controller.getActivePlayer();
                var activeFune   = activePlayer.getActiveFune();
                if (activeFune.withinRange(this.i, this.j)) {
                    activeFune.attackFune(this);
                } else {
                    alert("攻撃は届けません");
                }
            }
        },

        sinkShip: function() {
            this.player.removeFune(this);
            this.parentNode.removeChild(this);
        }
    });

    /**
     * 船の種類
     */
    var CaptainFune = Class.create(BaseFune, {
        initialize: function(id) {
            BaseFune.call(this, id, {
                movement:  4,
                range:     3,
                attack:  100,
                defense:  50,
                hpMax:   120,
            });

            this.fune.frame = [0, 0, 0, 0, 1, 1, 1, 2, 2, 1, 1, 0, 0, 0, 0, 3, 3, 3];
            this.fune.sinkFrame = [3, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, null];

        },

        getCaptainName: function() {
            return "キャプテン";
        }
    });

    var HayaiFune = Class.create(BaseFune, {
        initialize: function(id) {
            BaseFune.call(this, id, {
                movement:  5,
                range:     3,
                attack:   80,
                defense:  60,
                hpMax:    80,
            });

            this.fune.frame = [8, 8, 8, 8, 9, 9, 9, 10, 10, 9, 9, 8, 8, 8, 8, 11, 11, 11];
            this.fune.sinkFrame = [11, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15, null];
        },

        getCaptainName: function() {
            return "はやいちゃん";
        }
    });

    var KataiFune = Class.create(BaseFune, {
        initialize: function(id) {
            BaseFune.call(this, id, {
                movement:  3,
                range:     3,
                attack:   80,
                defense:  60,
                hpMax:   240,
            });

            this.fune.frame = [16, 16, 16, 16, 17, 17, 17, 18, 18, 17, 17, 16, 16, 16, 16, 19, 19, 19];
            this.fune.sinkFrame = [19, 19, 19, 20, 20, 21, 21, 22, 22, 23, 23, null];
        },

        getCaptainName: function() {
            return "かたいちゃん";
        }
    });

    var KougekiFune = Class.create(BaseFune, {
        initialize: function(id) {
            BaseFune.call(this, id, {
                movement:  3,
                range:     3,
                attack:  120,
                defense:  40,
                hpMax:   150,
            });

            this.fune.frame = [24, 24, 24, 24, 25, 25, 25, 26, 26, 25, 25, 24, 24, 24, 24, 27, 27, 27];
            this.fune.sinkFrame = [27, 27, 27, 28, 28, 29, 29, 30, 30, 31, 31, null];
        },

        getCaptainName: function() {
            return "こうげきちゃん";
        }
    });
    
    //爆発エフェクトのクラス
    var Explosion = Class.create(Sprite, {
    	//コンストラクタ
        initialize: function(id, stats) {
        	//スプライトを作る
            Sprite.call(this, 32, 32);
            
            //爆発エフェクトのスプライトシートを画像ソースにセットする
            this.image = game.assets[explosionSpriteSheet];
            //アニメーションをセットする
            this.frame = [0,1,2,3,1,2,3,4,null];

            //アニメーションのフレームのカウンター
            this.counter = 0;
        },
        //フレームが切り替わったときのイベント
        onenterframe:function(){ // enterframe event listener
        	//カウンターを回す
            this.counter++;
			//最後のカウンターになったら
            if (this.counter == 9 ) {
            	//自分自身を消してエフェクトを終える
                this.parentNode.removeChild(this);
            }
        },
    });

    /**
     * プレイヤー
     */
    var GamePlayer = Class.create({
        initialize: function(id, data) {
        	this.id = id;
            this.funeList = [];
            this.data = data;
        },

        isActive: function() {
            return this.myTurn;
        },

        setActive: function(flag) {
            this.myTurn = flag;
        },

        getData: function(key) {
            return this.data[key];
        },

        setData: function(key, value) {
            this.data[key] = value;
        },

        setController: function(controller) {
            this.controller = controller;
        },

        addFune: function(fune) {
            fune.player = this;
            this.funeList.push(fune)
        },

        removeFune: function(fune) {
            delete fune.player;

            var newList = [];
            for (var i=0; i < this.getFuneCount(); ++i) {
                if (this.getFune(i) != fune) {
                    newList.push(this.getFune(i));
                }
            }
            this.funeList = newList;

            if (this.activeFune == fune) {
                this.activeFune = null;
            }
        },

        getFune: function(index) {
            return this.funeList[index];
        },

        getFuneCount: function() {
            return this.funeList.length;
        },

        getActiveFune: function() {
            if (this.activeFune) {
                return this.activeFune;
            } else {
                return this.funeList[0];
            }
        },

        setActiveFune: function(fune) {
            this.activeFune = fune;
            this.controller.updateTurn();
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

        getNonActivePlayer: function() {
           return this.playerList[(this.turnCounter +1) % this.playerList.length];
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
        //ターン終了時の処理関数
        endTurn: function() {
        	//アクティブプレイヤーを取得する
            var player = this.getActivePlayer();
            //アクティブプレイヤーを非アクティブにする
            player.setActive(false);

            //勝利者がいるか調べる
            var winner = this.getWinner();
            //勝利者がいたら
            if (winner) {
            	//プレイヤーのバナーを生成する
                var playerBanner = new Sprite(512, 256);
                //プレイヤー1が勝利者であrば
                if (player.id == 1) {
                	//まずはプレイヤー1のバナーを表示する
                    playerBanner.image = game.assets[uiPlayerBanner1];
                //プレイヤー2が勝利者であれば
                } else if (player.id == 2) {
                	//プレイヤー2のバナーを表示する
                    playerBanner.image = game.assets[uiPlayerBanner2];
                }
                
                //フェードインの前準備として透過率を0にする
                playerBanner.opacity = 0;
                //バナーの出現座標を設定する
                playerBanner.x = 480 -256;
                playerBanner.y = 320 -128;
                //プレイヤーバナーをシーンに投入する
                game.currentScene.addChild(playerBanner);

                //クラスのオブジェクト自身への参照を変数に格納する
                var self = this;
                //プレイヤーバナーをフェードイン・アウトする。アウトを待ってコールバック関数を実行する
                playerBanner.tl.fadeIn(20).delay(30).fadeOut(10).then(function() {
                	//プレイヤーバナーを削除する
                    game.currentScene.removeChild(playerBanner);

                    //勝利のバナーを生成する
                    var resultBanner = new Sprite(512, 256);
                    //勝利のバナーの画像をセットする
                    resultBanner.image = game.assets[uiWin];
                    //こちらもフェードイン・アウトの前準備として透明にする
                    resultBanner.opacity = 0;
                    //座標をセットする
                    resultBanner.x = 480 -256;
                    resultBanner.y = 320 -128;
                    //勝利のバナーをカレントのシーンに投入する
                    game.currentScene.addChild(resultBanner);

                    //勝利のバナーをフェードイン・アウトする。それが終わったら
                    resultBanner.tl.fadeIn(20).delay(30).fadeOut(10).then(function() {
                    	//ページをリロードして最初に戻る
                        location.reload();
                    });
                });
            //勝利者がいなければ
            } else {
            	//ターンのカウンターを回す
                this.turnCounter++;

                //プレイヤーのバナーを作る
                var playerBanner = new Sprite(512, 256);
                //プレイヤー1のターンが終わったら
                if (player.id == 1) {
                	//プレイヤー2のバナーを出す
                    playerBanner.image = game.assets[uiPlayerBanner2];
                //プレイヤー2のターンが終わったら
                } else if (player.id == 2) {
                	//プレイヤー1のバナーを出す
                    playerBanner.image = game.assets[uiPlayerBanner1];
                }
                
                //バナーを最初は非表示にしておく
                playerBanner.opacity = 0;

                //バナーの座標を指定する
                playerBanner.x = 480 -256;
                playerBanner.y = 320 -128;
                //カレントのシーンにバナーを追加する
                game.currentScene.addChild(playerBanner);

                //クラスのオブジェクト自身への参照を変数に保存する
                var self = this;
                //バナーのフェードイン・アウトを指定する
                playerBanner.tl.fadeIn(20).delay(30).fadeOut(10).then(function(){
                	//ターンを開始する
                	self.startTurn();
                	//UI操作不能状態を解除する
                	utils.endUIShield();
                	//1秒後にバナーを削除する
                	game.currentScene.removeChild(playerBanner);
                });
            }
        },

        getWinner: function() {
            if (this.getActivePlayer().getFuneCount() == 0) {
                if (this.getNonActivePlayer().getFuneCount() == 0) {
                    return this.getActivePlayer();
                } else {
                    return this.getNonActivePlayer();
                }
            } else if (this.getNonActivePlayer().getFuneCount() == 0) {
                return this.getActivePlayer();
            }
            return null
        }
    })

    /**
     * ターン関係の情報を表示するクラス
     */
    var TurnUI = Class.create({
        initialize: function(scene) {
            var fontColor = "rgba(255, 255, 105, 1.0)";

            this.turnLabel = new Label();
            scene.addChild(this.turnLabel);
            this.turnLabel.x = 64*5;
            this.turnLabel.y = 640 -40;
            this.turnLabel.font = fontStyle;
            this.turnLabel.color = fontColor;

            this.playerLabel = new Label();
            scene.addChild(this.playerLabel);
            this.playerLabel.x = 64;
            this.playerLabel.y = 640 -40;
            this.playerLabel.font = fontStyle;
            this.playerLabel.color = fontColor;
        },

        updateTurn: function(turn) {
            this.turnLabel.text = "ターン:"+turn;
        },

        updatePlayer: function(name) {
            this.playerLabel.text = name;
        },

    })

    /**
     * キャラのポップアップウィンドー
     */
    var StatusWindow = Class.create(Scene, {
    		//コンストラクタ
    		initialize: function(fune) {
    			//スーパークラスのコンストラクタを呼ぶ
    			Scene.call(this);
    			//自身をゲームシーンとして登録する
    			game.pushScene(this);
    			
    			//オーバーレイの画像のスプライトを作る
    			var shieldSprite = new Sprite(960, 640);
    			//真っ黒な画像をセットする
    			shieldSprite.image = game.assets[ui1x1Black];
    			//半透過にする
    			shieldSprite.opacity = 0.5
    			//ウィンドウに加える
    			this.addChild(shieldSprite);
    			
    			//ウィンドウのスプライトグループを作る
    			var windowGroup = new Group();
    			//ウィンドウの座標を計算して格納する
    			windowGroup.x = (960 -512)/2;
    			windowGroup.y = (640 -512)/2;
    			//ウィンドウのクラスのオブジェクトに追加する
    			this.addChild(windowGroup);
    			
    			//ウィンドウ本体のスプライトを作る
    			var windowSprite = new Sprite(512, 512);
    			//ウィンドウのスプライトに画像をセットする
    			windowSprite.image = game.assets[uiWindowSprite];
    			//ウィンドウのスプライトグループに追加する
    			windowGroup.addChild(windowSprite);
    			
    			//ステータス表示のためのラベルのグループを作る
    			var statsGroup = new Group();
    			//配置する座標を指定する
    			statsGroup.x = 64;
    			statsGroup.y = 32;
    			//ウィンドウのスプライトグループに追加する
    			windowGroup.addChild(statsGroup);
    			
    			//フォントカラーの設定を用意する
    			var fontColor = "rgba(255, 255, 105, 1.0)";
    			
    			//船長名のラベルを作る
    			captainLabel = new Label("船長："+fune.getCaptainName());
    			//船長名のラベルをステータス表示のためのグループに追加する
    			statsGroup.addChild(captainLabel);
    			//座標をセットする。左上の端に合わせる
    			captainLabel.x = 0;
    			captainLabel.y = 0;
    			//あらかじめ作っておいたフォントのスタイルをセットする
    			captainLabel.font = fontStyle;
    			//フォントの色をセットする
    			captainLabel.color = fontColor;
    			
    			//船長名のラベルを作る
    			attackLabel = new Label("攻撃力："+fune.getAttack());
    			//船長名のラベルをステータス表示のためのグループに追加する
    			statsGroup.addChild(attackLabel);
    			//座標をセットする。左の端に合わせる。縦座標を、各ラベルがぶつからないように調整する
    			attackLabel.x = 0;
    			attackLabel.y = 64 *1;
    			//フォントのスタイルを設定する
    			attackLabel.font = fontStyle;
    			attackLabel.color = fontColor;
    			
    			defenseLabel = new Label("防御力："+fune.getDefense());
    			statsGroup.addChild(defenseLabel);
    			defenseLabel.x = 0;
    			defenseLabel.y = 64 *2;
    			defenseLabel.font = fontStyle;
    			defenseLabel.color = fontColor;
    			
    			//以下、ステータス分割愛
    			movementLabel = new Label("移動力："+fune.getMovement());
    			statsGroup.addChild(movementLabel);
    			movementLabel.x = 0;
    			movementLabel.y = 64 *3;
    			movementLabel.font = fontStyle;
    			movementLabel.color = fontColor;
    			
    			rangeLabel = new Label("攻撃の距離："+fune.getRange());
    			statsGroup.addChild(rangeLabel);
    			rangeLabel.x = 0;
    			rangeLabel.y = 64 *4;
    			rangeLabel.font = fontStyle;
    			rangeLabel.color = fontColor;
    			
    			hpLabel = new Label("HP："+fune.getHP()+"/"+fune.getHPMax());
    			statsGroup.addChild(hpLabel);
    			hpLabel.x = 0;
    			hpLabel.y = 64 *5;
    			hpLabel.font = fontStyle;
    			hpLabel.color = fontColor;
    			
    			//海賊の画像のスプライトを生成する
    			var pirate = new Sprite(400, 640);
    			//フェードインのため、初期状態では透明にする
    			pirate.opacity = 0;
    			//右端に合わせて位置を調整する。さらに、少し高めに画像をセットする
    			pirate.x = 350;
    			pirate.y = -50;
    			//船長の画像をセットする
    			pirate.image = fune.getImage();
    			//グループに船長の画像を追加する
    			windowGroup.addChild(pirate);
    			
    			//このクラスのオブジェクト自身の参照を変数に保存する
    			var self = this;
    			//キャンセルボタンのスプライトを作成する
    			var cancelBtnSprite = new Sprite(128, 64);
    			//キャンセルボタンの画像をセットする
    			cancelBtnSprite.image = game.assets[uiCancelBtnSprite];
    			//キャンセルボタン何の座標を指定する
    			cancelBtnSprite.x = 64;
    			cancelBtnSprite.y = 512 -64 -32;
    			
    			//生成したキャンセルボタンのスプライトをグループに追加する
    			windowGroup.addChild(cancelBtnSprite);
    			//アニメーションの中心座標を設定する
                windowGroup.originX = 256;
                windowGroup.originY = 256;
                //最初は小さめにして表示する
                windowGroup.scaleX = 0.7;
                windowGroup.scaleY = 0.7;
                //ゆっくり大きくしていき、それが終わったら
                windowGroup.tl.scaleTo(1, 10, enchant.Easing.ELASTIC_EASEOUT).then(function() {
                    pirate.y = -50;	//海賊の画像を上にずらす
                    //海賊の画像を所定の位置に動かしながらフェードインする
                    pirate.tl.moveBy(-50, -25, 5).and().fadeIn(10);

                    //キャンセルボタンのタッチ開始イベントを登録する
                    cancelBtnSprite.addEventListener(enchant.Event.TOUCH_START, function(params) {
                    	//アニメーションしながら1.1倍の大きさにする
                        cancelBtnSprite.tl.scaleTo(1.1, 10, enchant.Easing.ELASTIC_EASEOUT)
                    });
                    //キャンセルボタンのタッチが終了したら
                    cancelBtnSprite.addEventListener(enchant.Event.TOUCH_END, function(params) {
                    	//ゆっくりUI操作無効の幕を張る
                        shieldSprite.tl.fadeTo(0, 5);
                        //キャンセルボタンを小さくする
                        cancelBtnSprite.tl.scaleTo(0.9, 3).and().fadeTo(0, 5);
                        //海賊画像をフェードアウトする
                        pirate.tl.fadeTo(0, 5);
                        //ウィンドウをフェードアウトさせる
                        windowSprite.tl.fadeTo(0, 5).then(function() {
                            game.popScene();		//シーンを再開する
                            if (self.onCancel) {	//キャンセル時のコールバック関数があれば
                                self.onCancel();	//実行する
                            }
                        });
                    });
                });
    		}
    })

    /**
     * ロードが完了した直後に実行される関数を指定している。
     */
    game.onload = function(){
        var sceneGameMain = new Scene();

        // ゲームロジックの管理
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

        var map = new GameMap(sceneGameMain, mapDisplayData);
        manager.setMap(map);

        var turnUI = new TurnUI(sceneGameMain);
        manager.setTurnUI(turnUI);

        // プレイヤー１
        var player1 = new GamePlayer(1, {name:"プレイヤー１"});
        manager.addPlayer(player1);
        // プレイヤー1に船を４つあげよう
        player1.addFune(new CaptainFune(1));
        player1.addFune(new HayaiFune(2));
        player1.addFune(new KataiFune(3));
        player1.addFune(new KougekiFune(4));

        // プレイヤー２
        var player2 = new GamePlayer(2, {name:"プレイヤー２"});
        manager.addPlayer(player2);
        // プレイヤー1に船を４つあげよう
        player2.addFune(new CaptainFune(1));
        player2.addFune(new HayaiFune(2));
        player2.addFune(new KataiFune(3));
        player2.addFune(new KougekiFune(4));

        // 船の初期の位置
        var startPositions = {
            player1: [
                {i: 0, j: 8}, {i: 0, j: 6}, {i: 1, j: 7}, {i: 2, j: 8}
            ],
            player2: [
                {i: 12, j: 0}, {i: 10, j: 0}, {i: 11, j: 1}, {i: 12, j: 2}
            ],
        }
        manager.setStartPositions(startPositions);

        // ゲームにシーンを追加
        game.pushScene(sceneGameMain);

        // ゲームのロジック開始
        manager.beginGame();
    };

    game.start();
};
