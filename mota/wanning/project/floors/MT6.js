main.floors.MT6=
{
    "floorId": "MT6",
    "title": "塔外草原",
    "name": "草原",
    "width": 13,
    "height": 13,
    "canFlyTo": true,
    "canFlyFrom": true,
    "canUseQuickShop": true,
    "cannotViewMap": false,
    "images": [],
    "ratio": 1,
    "defaultGround": "grass",
    "bgm": "grass.mp3",
    "firstArrive": [
        {
            "type": "function",
            "function": "function(){\ncore.drawWarning(11, 6, '史莱姆之皇');\n}"
        },
        {
            "type": "sleep",
            "time": 3500,
            "noSkip": true
        },
        "\t[史莱姆之皇,E355]\b[up,11,6]哼，小子，既然你杀死了我的部下，你就别想活着走出这里了！！",
        "\t[你,hero]\b[up,hero]。。。希望你不会像它一样傻"
    ],
    "eachArrive": [],
    "parallelDo": "",
    "events": {},
    "changeFloor": {
        "0,6": {
            "floorId": "MT5",
            "loc": [
                12,
                6
            ]
        },
        "12,6": {
            "floorId": "MT7",
            "loc": [
                0,
                6
            ]
        }
    },
    "beforeBattle": {},
    "afterBattle": {
        "11,6": [
            {
                "type": "if",
                "condition": "(flag:slimeking==0)",
                "true": [
                    "\t[史莱姆皇,E355]\b[up,11,6]啊啊啊！！！！！！！！！！！！！！",
                    "\t[你,hero]\b[up,hero]看来你犯了和它一样的错误啊",
                    "\t[史莱姆皇,E355]\b[up,11,6]自爆阵真不是好东西！！！我为什么要学它！！！",
                    {
                        "type": "setValue",
                        "name": "flag:slimeking",
                        "value": "1"
                    }
                ]
            }
        ]
    },
    "afterGetItem": {},
    "afterOpenDoor": {},
    "autoEvent": {},
    "cannotMove": {},
    "cannotMoveIn": {},
    "map": [
    [ 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
    [ 20,  0, 28,  0,  0,334,343, 20,  0,  0, 28,  0, 20],
    [ 20,214, 20, 20,  0, 20, 20, 20,  0, 20, 20,213, 20],
    [ 20,357,  0, 20,  0,  0, 27,  0,  0, 20,  0,  0, 20],
    [ 20,  0,356, 20,  0, 20,215, 20,210, 20,358,  0, 20],
    [ 20,334, 20, 20,  0, 20,356, 20,  0, 20, 20, 20, 20],
    [ 92,  0,  0,358,209, 20, 21, 20,  0,  0,  0,355, 94],
    [ 20,334, 20, 20,  0, 20,357, 20,  0, 20, 20, 20, 20],
    [ 20,  0,356, 20,  0, 20,215, 20,210, 20,358,  0, 20],
    [ 20,357,  0, 20,  0,  0, 27,  0,  0, 20,  0,  0, 20],
    [ 20,214, 20, 20,  0, 20, 20, 20,  0, 20, 20,213, 20],
    [ 20,  0, 28,  0,  0, 20,343,334,  0,  0, 28,  0, 20],
    [ 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20]
],
    "bgmap": [

],
    "fgmap": [

]
}