main.floors.MT0=
{
    "floorId": "MT0",
    "title": "主塔 1 层",
    "name": "1",
    "canFlyTo": true,
    "canFlyFrom": true,
    "canUseQuickShop": true,
    "cannotViewMap": false,
    "defaultGround": "ground",
    "images": [],
    "ratio": 1,
    "map": [
    [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
    [  1,  0,  0, 28,  1,  0,204,  0,  1, 28,  0,  0,  1],
    [  1,  0,  1,  0,  1,  0,  0,  0,  1,  0,  1,  0,  1],
    [  1,202,  1,  1,  1,  1,201,  1,  1,  1,  1,202,  1],
    [  1,  0,  0, 31,  0,  0, 21,  0,  0, 31,  0,  0,  1],
    [  1,  1,  1,  0,  1,  1,  1,  1,  1,  0,  1,  1,  1],
    [  1,  0,  0,201,  0, 27,201, 27,  0,201,  0,  0,  1],
    [  1,  0,  0,  1,  0,  0,  1,  0,  0,  1,  0,  0,  1],
    [  1, 31,  1,  1,331,  1,  1,  1,331,  1,  1, 31,  1],
    [  1,  0,  0,202,  0,  0,  0,  0,  0,202,  0,  0,  1],
    [  1,  0,  1,331,  1,  1,201,  1,  1,331,  1,  0,  1],
    [  1,202,  0, 29,  1,334,  0,334,  1, 29,  0,202,  1],
    [  1,  1,  1,  1,  1, 31,129, 31,  1,  1,  1,  1,  1]
],
    "firstArrive": [
        {
            "type": "pauseBgm"
        },
        {
            "type": "setText",
            "background": "winskin2.png"
        },
        "欢迎来到万宁魔塔",
        "在这里，你将体验各种强力技能，尽情释放大招，与同样会大招的boss一较高下",
        "每次通过一定层数，你将有机会升级你的技能（永久性升级），让你的技能变得更加强大",
        "每次升级技能时，可以升级的技能均不相同，是固定的",
        "来尽情享受大招的乐趣吧！",
        "\t[你,hero]\b[up,hero]什么鬼",
        "\t[你,hero]\b[up,hero]怎么一个魔塔还有什么大招的...",
        "\t[你,hero]\b[up,hero]感觉有点意思",
        {
            "type": "function",
            "function": "function(){\ncore.drawWarning(6,1, '史莱姆之王');\n}"
        },
        {
            "type": "sleep",
            "time": 3500,
            "noSkip": true
        },
        "\t[史莱姆之王,slimelord]\b[down,6,1]哼哼哼，又来了一位挑战者啊，我在五楼等着你！部下们，设好防御，准备营地！",
        {
            "type": "resumeBgm",
            "resume": true
        },
        {
            "type": "hide",
            "loc": [
                [
                    6,
                    1
                ]
            ],
            "remove": true,
            "time": 500
        },
        "\t[你,hero]\b[up,hero]好老套的剧情啊",
        {
            "type": "setBlock",
            "number": "blackSlime",
            "loc": [
                [
                    6,
                    1
                ]
            ],
            "time": 500
        },
        "\t[黑史莱姆,blackSlime]\b[down,6,1]一层就由我来镇守，来体验一下1级四方阵的威力吧！",
        "\t[你,hero]\b[up,hero]四方阵？",
        {
            "type": "callBook"
        },
        "\t[你,hero]\b[up,hero]卧槽，怎么这么nb",
        "\t[你,hero]\b[up,hero]这还是魔塔吗？",
        "\t[黑史莱姆,blackSlime]\b[down,6,1]别急，你也有你的技能，点击状态栏就能查看了",
        "\t[你,hero]\b[up,hero]这样啊，明白了，看我来打爆你！",
        {
            "type": "function",
            "function": "function(){\ncore.scanFormation(core.status.floorId);\n}"
        }
    ],
    "parallelDo": "",
    "events": {
        "6,12": [
            "该塔是一个爽塔，不想刷榜的话就直接全咸吧！",
            "绿钥匙计分，每个绿钥匙计1w分",
            "你的背包中有一个系统设置，其中有一些有用的设置，请注意使用",
            "注意，该塔中卡顿属于正常现象。如果卡2分钟了还在卡，请再刷新页面",
            "注意，该塔不支持录像",
            "注意！请不要随意修改浏览器大小，否则可能会导致游戏页面关闭"
        ],
        "6,1": [
            {
                "type": "changeFloor",
                "floorId": "MT1",
                "loc": [
                    6,
                    1
                ]
            }
        ]
    },
    "changeFloor": {},
    "afterBattle": {
        "6,1": [
            "\t[黑史莱姆,blackSlime]\b[down,6,1]啊！！！！我死了",
            "\t[你,hero]\b[down,hero]我应该谢谢你的四方阵，让我能够不断得放技能炸死你",
            "\t[黑史莱姆,blackSlime]\b[down,6,1]可恶！竟然有这种漏洞！",
            "\t[黑史莱姆,blackSlime]\b[down,6,1]不过，之后的几层你肯定不会这么轻松的！",
            {
                "type": "setBlock",
                "number": "upFloor"
            }
        ]
    },
    "afterGetItem": {},
    "afterOpenDoor": {},
    "cannotMove": {},
    "bgmap": [

],
    "fgmap": [

],
    "width": 13,
    "height": 13,
    "autoEvent": {},
    "beforeBattle": {},
    "cannotMoveIn": {},
    "bgm": "Z1.mp3"
}