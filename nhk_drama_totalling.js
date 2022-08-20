const express = require('express');
const ejs = require('ejs');
const fs = require('fs');
const qs = require('qs');
const jquery = require("jquery");
const needle = require('needle');

/**
 * twitter-node-clientパッケージ
 */
const Twitter = require('twitter-node-client').Twitter;

const App = express();
const List = JSON.parse(fs.readFileSync("./data/list.json", "utf-8"));
const AppConst = JSON.parse(fs.readFileSync("./data/appconst.json", "utf-8"));
const Setting = JSON.parse(fs.readFileSync("./data/setting.json", "utf-8"));
const Client = new Twitter(JSON.parse(fs.readFileSync("./data/key.json", "utf-8")));
const Totalling = fs.readFileSync("./part/totalling.json", "utf-8");

Setting.notificationsOrder = JSON.stringify(Setting.notificationsOrder);

var next = "";
var backupParams;
const token = process.env.token;
var indexReq = "";

/**
 * テスト用保持領域
 * @static
 */
var TestValue;

/**
 * テスト動作初期化
 * @constructor
 */
function TESTINIT()
{
    //テストモードであるか
    if (Setting.test == AppConst.ON)
    {
        //テストパターン分岐
        switch (Setting.testPattern)
        {
            case "1":
                {//1
                    TestValue = 1;
                    break;
                }
            case "2":
                {//2
                    TestValue = 1;
                    break;
                }
            default:
                {
                    break;
                }
        }
    }

    return;
}

/**
 * テスト動作ラッパー
 * @constructor
 * @param {object} src 元値
 * @param {object} reference 参照情報
 * @returns {object} テスト値
 */
function TEST(src, reference)
{
    let ret;

    //テストモードであるか
    if (Setting.test == AppConst.ON)
    {//である
        //テストパターン分岐
        switch (Setting.testPattern)
        {
            //indexが1、かつ、初回～3回目までをエラーにする
            case "1":
                {//1
                    //indexが1であるか
                    if (reference[0] == 1)
                    {//である
                        //初回～3回目までであるか
                        if (TestValue <= 3)
                        {//である
                            //TwitterAPIの結果一式
                            ret = resultAPI(AppConst.ERROR, ["e(1)", "e(2)", "e" + TestValue]);
                        }
                        else
                        {//ではない
                            ret = src;
                        }

                        TestValue++;
                    }
                    else
                    {//ではない
                        ret = src;
                    }

                    break;
                }
            //indexが1、かつ、3～4回目までをエラーにする
            case "2":
                {//2
                    //indexが1、かつ、3～4回目までであるか
                    if (reference[0] == 1)
                    {//である
                        //3～4回目までであるか
                        if ((TestValue >= 3) && (TestValue <= 4))
                        {//である
                            //TwitterAPIの結果一式
                            ret = resultAPI(AppConst.ERROR, ["e(1)", "e(2)", "e" + TestValue]);
                        }
                        else
                        {//ではない
                            ret = src;
                        }

                        TestValue++;
                    }
                    else
                    {//ではない
                        ret = src;
                    }

                    break;
                }
            default:
                {
                    ret = src;
                    break;
                }
        }
    }
    else
    {//ではない
        ret = src;
    }

    return ret;
}

/**
 * デバッグ動作ラッパー(値用)
 * @constructor
 * @param {string} str デバッグ出力文字列
 */
function DEBUGForValue(header, content)
{
    //デバッグモードか
    if (Setting.debug == AppConst.ON)
    {
        console.debug("[DEBUG]" + header + ": " + content);
    }

    return;
}

/**
 * デバッグ動作ラッパー(メッセージ用)
 * @constructor
 * @param {string} str デバッグ出力文字列
 */
function DEBUGForMessage(message)
{
    //デバッグモードか
    if (Setting.debug == AppConst.ON)
    {
        console.debug("[DEBUG]" + message);
    }

    return;
}

/**
 * 致命的エラーで終了
 * エラー情報を出力して終了する。
 * @constructor
 * @param {string} func 関数名
 * @param {object} errorInfo エラー情報
 */
function fatal(func, errorInfo)
{
    console.log("function:" + func);
    console.log(errorInfo);
    process.exit();
}

App.engine('ejs', ejs.renderFile);
App.get('/',
    /**
     * ツールページを返す。
     * @param {object} req expressパッケージから引用
     * @param {object} res expressパッケージから引用
     */
    function (req, res)
    {
        res.render('main.ejs',
            /**
             * ejs渡し初期化子
             * @property {JSON} List 全リスト
             * @property {JSON} AppConst スペルミス防止定数
             * @property {JSON} Setting ツール設定
             */
            {
                List: List,
                AppConst: AppConst,
                Setting: Setting
            });
    });
App.get('/jquery-3.6.0.min.js',
    /**
     * jqueryファイルを返す。
     * @param {object} req expressパッケージから引用
     * @param {object} res expressパッケージから引用
     */
    function (req, res)
    {
        res.send(fs.readFileSync("./script/jquery-3.6.0.min.js", "utf-8"));
    });
App.get('/jquery.columns.min.js',
    /**
     * jqueryファイルを返す。
     * @param {object} req expressパッケージから引用
     * @param {object} res expressパッケージから引用
     */
    function (req, res)
    {
        res.send(fs.readFileSync("./script/jquery.columns.min.js", "utf-8"));
    });

/**
 * //TwitterAPIの結果一式(結果概要と結果詳細)
 * @constructor
 * @param {string} result AppConst.SUCCESSかAppConst.ERROR
 * @param {array} detail 結果の詳細
 * @returns {object} 結果一式(結果概要と結果詳細)
 */
function resultAPI(result, detail)
{
    let ret =
    /**
     * //TwitterAPIの結果一式の初期化子
     * @property {string}  result - AppConst.SUCCESSかAppConst.ERROR
     * @property {array}  detail - 結果の詳細
     */
    {
        result: "",
        detail: null
    };
    ret.result = result;
    ret.detail = detail;
    return ret;
}

function syncCallLibrary(params)
{
    return new Promise(
        function (resolve, reject)
        {
            let ret;
            needle('get', Setting.urlTwitterApi.searchPremium.url, params,
                {
                    headers:
                    {
                        "authorization": `Bearer ${token}`
                    }
                })
                .then(
                    function (err, resp, body)
                    {
                        fs.writeFileSync("resp_err.json", err);
                        fs.writeFileSync("resp_resp.json", resp);
                        fs.writeFileSync("resp_body.json", body);

                        if (err.complete)
                        {
                            let body = err.body;
                            let result = AppConst.END;

                            if (body.hasOwnProperty("next"))
                            {
                                result = AppConst.NEXT;
                                next = body.next;
                            }
                            ///
                            else
                            {
                                DEBUGForMessage("end");
                            }

                            ret = resultAPI(result, { "data": err.body });
                            resolve(ret);
                        }
                        else
                        {
                            ret = resultAPI(AppConst.ERROR, { "err": err });
                            reject(ret);
                        }
                    })
                .catch(
                    function (err)
                    {
                        DEBUGForValue("err", err);
                        ret = resultAPI(AppConst.ERROR, { "err": err });
                        reject(ret);
                    }
                )
        });
}

/**
 * TwitterAPIを呼び出す。
 * 同期化している。
 * @constructor
 * @returns {object} TwitterAPIの結果
 */
async function callTwitterApi()
{
    let params =
    {
        "query": Setting.nhkHasTag,
        "maxResults": 50
    };

    if (indexReq != "0")
    {
        params["next"] = next;
    }

    let ret = await syncCallLibrary(params);

    return ret;
}

App.get('/ajax/getSimplifiedData',
    /**
     * TwitterAPIを呼び出す。
     * @param {object} req expressパッケージから引用
     * @param {object} res expressパッケージから引用
     */
    async function (req, res)
    {
        let url = req.url.split("?");
        let query = qs.parse(url[1]);
        let twitterRes;

        indexReq = query[Setting.queryAndProperty.req.index];
        DEBUGForValue("indexReq", indexReq);
        //初回か
        if (indexReq == "0")
        {
            next = "";
        }

        //TwitterAPI呼び出し
        twitterRes = await callTwitterApi();

        // twitterRes = TEST(twitterRes, [query[Setting.checkIf.req.index], query[Setting.checkIf.req.first]]);
        DEBUGForValue("twitterRes.result", twitterRes.result);
        ///
        if (twitterRes.result == AppConst.END)
        {
            DEBUGForMessage("last");
        }

        let tmpRes = JSON.stringify(twitterRes);
        res.send(tmpRes);
    });

// TESTINIT();
App.listen(Setting.nodejs.port);
