main.floors.MT3=
{
    "floorId": "MT3",
    "title": "主塔 4 层",
    "name": "4",
    "width": 13,
    "height": 13,
    "canFlyTo": true,
    "canFlyFrom": true,
    "canUseQuickShop": true,
    "cannotViewMap": false,
    "images": [],
    "ratio": 1,
    "defaultGround": "ground",
    "bgm": "Z1.mp3",
    "firstArrive": [],
    "eachArrive": [],
    "parallelDo": "",
    "events": {
        "6,0": [
            "如果你把怪物周围全部堵死，那么四方阵将不再有效，所以，请善用本地图的阻击怪物",
            "或者，你把怪物的一个方向全部堵死，那么该怪物将不会向该方向继续扩大势力"
        ]
    },
    "changeFloor": {
        "6,1": {
            "floorId": "MT2",
            "loc": [
                6,
                1
            ]
        },
        "6,11": {
            "floorId": ":next",
            "stair": "downFloor"
        }
    },
    "beforeBattle": {},
    "afterBattle": {},
    "afterGetItem": {},
    "afterOpenDoor": {},
    "autoEvent": {},
    "cannotMove": {},
    "cannotMoveIn": {},
    "map": [
    [  1,  1,  1,  1,  1,  1,129,  1,  1,  1,  1,  1,  1],
    [  1,352,  0, 34,356,  0, 88,  0,357, 34,  0,352,  1],
    [  1, 32,  1,  1,  1,  1,334,  1,  1,  1,  1, 32,  1],
    [  1,  0,  0,  1,357,356,358,356,357,  1,  0,  0,  1],
    [  1,  1, 27,  0,  1,  1,353,  1,  1,  0, 27,  1,  1],
    [  1,  0,  0,216,  0,  0,  0,  0,  0,216,  0,  0,  1],
    [  1,  1,  1,  0,  1,  1,  1,  1,  1,  0,  1,  1,  1],
    [  1,352,  0,  0,265,356,  1,356,265,  0,  0,369,  1],
    [  1,  0,  1, 31,  1,  1,  1,  1,  1, 31,  1,  0,  1],
    [  1,357,  0,369,  0,  0,  0,  0,  0,353,  0,357,  1],
    [  1,  1,  1,  1,353,  1,368,  1,369,  1,  1,  1,  1],
    [  1,  0,  0,358,  0,  1, 87,  1,  0,358,  0,  0,  1],
    [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1]
],
    "bgmap": [

],
    "fgmap": [

]
}