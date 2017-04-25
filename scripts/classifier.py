#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys
import csv
import re

def processing_text(raw):
    data = list()
    for row in raw:
        priceStr = row[7]
        priceStrip = priceStr.strip()
        if(priceStrip == "" or priceStrip == "無料" or priceStrip == "-" or priceStrip == "—" or "日間無料" in priceStrip or "初月無料" in priceStrip):
            price = 0
        elif len(re.findall(r'\d+円', priceStr)):
            price = int(re.findall(r'\d+',re.findall(r'\d+円', priceStr)[0])[0])
        else:
            price = 999999

        if row[5] == "":
            max = row[3]
        else:
            max = row[5]
        data.append( [row[0],row[3], max ,row[6], price])
    return data
def get_one_hot_encoding():
    from sklearn.preprocessing import OneHotEncoder
    one_hot_enc = OneHotEncoder()
    from sklearn.preprocessing import LabelEncoder
    label_enc = LabelEncoder()

    category = ["不明",
            "ファッション",
            "コスメ・化粧品",
            "ダイエット",
            "グルメ",
            "美容・健康食品・医薬品",
            "パソコン・電化製品",
            "インテリア・生活用品",
            "本・音楽・DVD",
            "総合・カタログ通販",
            "ペット用品",
            "旅行",
            "お試し・トライアル",
            "ローン・キャッシング",
            "会員登録・ゲーム",
            "アンケートモニター",
            "FX・証券・先物・口座開設",
            "キャンペーン・セミナー申し込み",
            "資料請求",
            "保険",
            "見積り・査定・買い取り",
            "サロン・エステ予約",
            "クレジットカード",
            "スポーツ",
            "その他",
            "おもちゃ・キッズ・ベビー"
           ]

    label_enc.fit(category)
    cate_label = label_enc.transform(category).reshape(-1,1)
    #cate_label
    one_hot_enc.fit(cate_label)
    return one_hot_enc, label_enc

def processing(input_file, output_file):
    test_data = processing_text(csv.reader(open(input_file, "r"), delimiter="\t", dialect=csv.excel))
    test_processed = list()
    one_hot_enc, label_enc = get_one_hot_encoding()

    start_line = 1
    for data in test_data[start_line:]:
        #print str(i) + "=>" + data[3]
        label = label_enc.transform([data[3]]).reshape(-1,1)
        vec = one_hot_enc.transform(label).toarray()[0].tolist()
        #print type(vec)
        test_processed.append([data[0], float(data[1]), float(data[2]), data[4]] + vec)
    #print test_processed

    from sklearn.externals import joblib
    model_forest = joblib.load('random_forest_20170415_01.pkl')
    pred_results = list()
    for data in test_processed:
        if model_forest.predict([data[1:]]) == 1:
            result_forest = "強化する"
        else:
            result_forest = "強化しない"
        #print "%s\t=>\t%s\t=>\t%s"% (data[0], result_forest, result_tree)
        pred_results.append(result_forest)

    head_line = 0
    merged_results = list()
    for row in csv.reader(open(input_file, "r"), delimiter="\t", dialect=csv.excel):
        if head_line == 0: # first line
            merged_results.append(["予測結果"] + row)
            head_line += 1
        else:
            merged_results.append([pred_results[head_line - 1]] + row)
            head_line += 1


    with open(output_file, "w") as f:
        writer = csv.writer(f, delimiter="\t", dialect=csv.excel)
        writer.writerows(merged_results)


if __name__ == "__main__":
    input_file  = sys.argv[1]
    output_file = sys.argv[2]
    print("input file: %s\n-> output file: %s" % (input_file, output_file))
    processing(input_file, output_file)
