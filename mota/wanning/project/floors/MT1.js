main.floors.MT1=
{
    "floorId": "MT1",
    "title": "主塔 2 层",
    "name": "2",
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
    "firstArrive": [
        {
            "type": "function",
            "function": "function(){\ncore.drawWarning(6, 11, '武装黑莱姆')\n}"
        },
        {
            "type": "sleep",
            "time": 3500,
            "noSkip": true
        },
        "\t[武装黑莱姆,E350]\b[up,6,11]哼哼哼，我又来了！"
    ],
    "eachArrive": [],
    "parallelDo": "",
    "events": {
        "6,0": [
            "注意！！刚进入一个楼层的时候千万不要开存档，否则后果自负"
        ]
    },
    "changeFloor": {
        "6,1": {
            "floorId": "MT0",
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
    [  1,348,  0, 31,  0,334, 88,334,  0, 31,  0,348,  1],
    [  1,  0,  1,  1, 27,  1,  0,  1, 27,  1,  1,  0,  1],
    [  1,  0, 29,  0,  1,  0, 32,  0,  1,  0, 29,  0,  1],
    [  1,  1,  0,348,  0,  0,  1,  0,  0,348,  0,  1,  1],
    [  1, 31,  1,  0,  1,  1, 27,  1,  1,  0,  1, 31,  1],
    [  1,  0,202,  0,348, 31,349, 31,348,  0,202,  0,  1],
    [  1,  1,  0,  1,  0,  1, 28,  1,  0,  1,  0,  1,  1],
    [  1,  0,  0,  1,  0,  1,  1,  1,  0,  1,  0,  0,  1],
    [  1,202, 29,  0,348,  0,  0,  0,348,  0, 29,202,  1],
    [  1,  0,  1,  1,  0,  1,350,  1,  0,  1,  1,  0,  1],
    [  1,  0,  0, 29, 31,  1, 87,  1, 31, 29,  0,  0,  1],
    [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1]
],
    "bgmap": [

],
    "fgmap": [

]
}