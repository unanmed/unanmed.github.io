main.floors.MT4=
{
    "floorId": "MT4",
    "title": "主塔 5 层",
    "name": "5",
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
            "function": "function(){\ncore.drawWarning(6, 3, '史莱姆之王')\n}"
        },
        {
            "type": "sleep",
            "time": 3500,
            "noSkip": true
        },
        "\t[史莱姆之王,slimelord]哼哼哼，你终于来了！体验一下我布下的阵法吧！",
        "\t[你,hero]\b[up,hero]好像很菜的样子"
    ],
    "eachArrive": [],
    "parallelDo": "",
    "events": {
        "6,12": [
            "击杀200个怪物后，开启第一个机关门，之后每击杀100个怪物，便开启下一个机关门"
        ]
    },
    "changeFloor": {
        "6,11": {
            "floorId": ":before",
            "stair": "upFloor"
        },
        "6,1": {
            "floorId": "MT5",
            "loc": [
                6,
                2
            ],
            "direction": "down"
        }
    },
    "beforeBattle": {},
    "afterBattle": {
        "6,3": [
            {
                "type": "if",
                "condition": "(flag:slimelord==0)",
                "true": [
                    "\t[史莱姆王,slimelord]\b[down,6,3]啊啊啊！！！！！！！！！！！！！！",
                    "\t[史莱姆王,slimelord]\b[down,6,3]可恶！",
                    "\t[史莱姆王,slimelord]\b[down,6,3]你竟然利用自爆阵来炸死我！",
                    "\t[史莱姆王,slimelord]\b[down,6,3]不过，之后的旅途不会让你过得如此轻松了！",
                    {
                        "type": "setValue",
                        "name": "flag:slimelord",
                        "value": "1"
                    }
                ]
            }
        ]
    },
    "afterGetItem": {},
    "afterOpenDoor": {},
    "autoEvent": {
        "1,3": {
            "0": {
                "condition": "core.status.thisMap.killed>=200",
                "currentFloor": true,
                "priority": 0,
                "delayExecute": false,
                "multiExecute": false,
                "data": [
                    {
                        "type": "openDoor"
                    }
                ]
            }
        },
        "3,3": {
            "0": {
                "condition": "core.status.thisMap.killed>=300",
                "currentFloor": true,
                "priority": 0,
                "delayExecute": false,
                "multiExecute": false,
                "data": [
                    {
                        "type": "openDoor"
                    }
                ]
            }
        },
        "9,3": {
            "0": {
                "condition": "core.status.thisMap.killed>=400",
                "currentFloor": true,
                "priority": 0,
                "delayExecute": false,
                "multiExecute": false,
                "data": [
                    {
                        "type": "openDoor"
                    }
                ]
            }
        },
        "11,3": {
            "0": {
                "condition": "core.status.thisMap.killed>=500",
                "currentFloor": true,
                "priority": 0,
                "delayExecute": false,
                "multiExecute": false,
                "data": [
                    {
                        "type": "openDoor"
                    }
                ]
            }
        }
    },
    "cannotMove": {},
    "cannotMoveIn": {},
    "map": [
    [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
    [  1,203,  1,350,  1,356, 87,357,  1,354,  1,368,  1],
    [  1,  0,  1,  0,  1,358, 34,358,  1,  0,  1,  0,  1],
    [  1, 85,  1, 85,  1,  1,204,  1,  1, 85,  1, 85,  1],
    [  1,  0,  0,  0,  1,  0,  0,  0,  1,  0,  0,  0,  1],
    [  1,  0,  0,  0,  1,  0,  0,  0,  1,  0,  0,  0,  1],
    [  1,  1,201,  1,  1,  1,201,  1,  1,  1,201,  1,  1],
    [  1,  0,  0,  0,  1,  0,  0,  0,  1,  0,  0,  0,  1],
    [  1,  0,  0,  0,  1,  0,  0,  0,  1,  0,  0,  0,  1],
    [  1,  1,201,  1,  1,  1,201,  1,  1,  1,201,  1,  1],
    [  1,  0,  0,  0,  1,  0,  0,  0,  1,  0,  0,  0,  1],
    [  1,  0,  0,  0,  0,  0, 88,  0,  0,  0,  0,  0,  1],
    [  1,  1,  1,  1,  1,  1,129,  1,  1,  1,  1,  1,  1]
],
    "bgmap": [

],
    "fgmap": [

]
}