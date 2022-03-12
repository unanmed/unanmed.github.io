main.floors.MT9=
{
    "floorId": "MT9",
    "title": "侧塔 2 层",
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
    "bgm": "Z2.mp3",
    "firstArrive": [
        {
            "type": "function",
            "function": "function(){\ncore.drawWarning(6, 6, '理阵');\n}"
        },
        {
            "type": "sleep",
            "time": 3500
        }
    ],
    "eachArrive": [],
    "parallelDo": "",
    "events": {
        "6,11": [
            {
                "type": "setCurtain",
                "color": [
                    0,
                    0,
                    0,
                    1
                ],
                "time": 1500,
                "keep": true
            },
            "当你踏入这一级台阶的时候，你便无路可退了！",
            "\t[你,hero]谁？是谁在说话？",
            "我？我就是你刚刚杀死的那个人",
            "啊哈哈哈哈！！！",
            {
                "type": "if",
                "condition": "(core.getBlockId(6, 6, 'MT9') === 'E375')",
                "true": [
                    "什么？你没有杀死我？",
                    "哼，不过这样，剧情也得照常发展"
                ]
            },
            "上楼来，让你体验一下",
            "\\d\r[red]\\c[40]音乐的激情！！！",
            {
                "type": "changeFloor",
                "floorId": "MT10",
                "loc": [
                    6,
                    6
                ],
                "direction": "up"
            },
            {
                "type": "pauseBgm"
            },
            {
                "type": "setCurtain",
                "color": [
                    0,
                    0,
                    0,
                    0
                ],
                "time": 1500
            },
            "\t[理阵-EX,E376]\b[down,6,1]欢迎来到，万宁魔塔中，你第一个遇到的，音乐的天堂",
            "\t[理阵-EX,E376]\b[down,6,1]就让我们随着音乐起舞吧！！！",
            "\t[理阵-EX,E376]\b[down,6,1]开启可视化音乐！！！",
            "注意，下面的音乐不受游戏音量及游戏音乐是否打开控制，请注意音量",
            "请保持网络通畅，否则音乐可能加载不出来...加载过程会有文字提示",
            {
                "type": "confirm",
                "text": "游玩设备是否为移动设备？",
                "yes": [
                    "玩法就是类似于东方的弹幕战，在屏幕各个位置有点击区域提示，点击相应区域可以执行相应操作，比如移动、慢速移动等",
                    {
                        "type": "setValue",
                        "name": "flag:mobile",
                        "value": "true"
                    }
                ],
                "no": [
                    "玩法就是类似于东方的弹幕战，玩家移动不按格子，按住空格可以慢速移动",
                    {
                        "type": "setValue",
                        "name": "flag:mobile",
                        "value": "false"
                    }
                ]
            },
            "该特殊战有很多特效，所以可能会卡",
            {
                "type": "function",
                "function": "function(){\ncore.playVisualMusic('/project/bgms/boss1.mp3')\n}"
            }
        ]
    },
    "changeFloor": {
        "6,1": {
            "floorId": "MT8",
            "loc": [
                6,
                1
            ]
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
    [  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2],
    [  2,  2,  0,224,  0,  0, 88,  0,  0,224,  0,  2,  2],
    [  2,  0,  2,  0,  2,  2,  2,  2,  2,  0,  2,  0,  2],
    [  2,221,  0,213,  0,358,  0,358,  0,213,  0,221,  2],
    [  2,  0,  2,  0,  2,  0,  0,  0,  2,  0,  2,  0,  2],
    [  2,  0,  2,356,  0,214,  2,214,  0,357,  2,  0,  2],
    [  2,219,  2,  0,  0,  2,375,  2,  0,  0,  2,219,  2],
    [  2,  0,  2,357,  0,214,  2,214,  0,356,  2,  0,  2],
    [  2,  0,  2,  0,  2,  0,  0,  0,  2,  0,  2,  0,  2],
    [  2,221,  0,213,  0,358,  0,358,  0,213,  0,221,  2],
    [  2,  0,  2,  0,  2,  2,  2,  2,  2,  0,  2,  0,  2],
    [  2,  2,  0,224,  0,  0, 87,  0,  0,224,  0,  2,  2],
    [  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2]
],
    "bgmap": [

],
    "fgmap": [

]
}