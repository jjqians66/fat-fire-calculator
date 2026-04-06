import type { CityData, TierKey } from "@/lib/calc/types";
import type { Locale } from "@/lib/i18n/dict";

type TierNarrative = {
  description: string;
  guide: {
    groceries: string;
    dining: string;
    rhythm: string;
  };
};

type LocalizedCityNarrative = {
  lifestyle: string;
  tiers: Record<TierKey, TierNarrative>;
};

const zhCityNarratives: Record<string, LocalizedCityNarrative> = {
  beijing: {
    lifestyle:
      "中国的政治与文化中心，外籍家庭多聚集在顺义国际学校周边。冬季偏干，偶尔会遇到空气质量波动；高端住房和国际学校学费通常是高配预算里最重的两项。常见进入路径仍然是雇佣类 Z 签证。",
    tiers: {
      true_fat_fire: {
        description:
          "三里屯 / CBD 高层公寓或顺义别墅，全职阿姨加司机，每周高端餐饮，空气净化配置拉满，每年 3 次以上国际出行。",
        guide: {
          groceries:
            "日常买菜以 embassy 区高端进口超市和精品生鲜为主，水果、牛排、海鲜、葡萄酒都会往上选，在家备货基本不用太看价格。",
          dining:
            "每周会有几次使馆区、酒店或私宴级别的外食，烤鸭、宴请和精致晚餐都很常见，好的晚餐通常在每人 800 到 1800 元。",
          rhythm:
            "出行以司机或高频打车为主，阿姨覆盖家务，健身和室内 wellness 配置更高，空气质量不好时把短途逃离和长周末当成常规安排。",
        },
      },
      comfortable_expat: {
        description:
          "朝阳 / 东城两居，靠近胡同或中高层公寓，每周外食 3 到 4 晚，钟点阿姨，周末周边短途加每年一次国际旅行。",
        guide: {
          groceries:
            "买菜会在盒马、进口超市和本地菜肉补货之间混搭，既能保证厨房里有熟悉的西式食材，也能兼顾本地高性价比。",
          dining:
            "一周会出去吃几次，穿插偶尔一顿更好的晚餐；日常人均常在 120 到 240 元，认真吃一顿会到 500 到 1000 元。",
          rhythm:
            "通勤以地铁加滴滴为主，日常有适度的美容理发和 wellness 支出，偶尔请人打扫，旅行以国内或周边地区短假为主，而不是持续奢华流动。",
        },
      },
      luxury_family: {
        description:
          "顺义别墅区，靠近 WAB / ISB，全职阿姨加司机，适配顶级国际学校与家庭出行需求，空气质量差时会频繁离京，每年回母国一次。",
        guide: {
          groceries:
            "家庭型采购以进口超市、大包装补货和送货上门为主，零食、水果、肉类和家里招待客人的储备都会一次备齐。",
          dining:
            "周末家庭聚餐和酒店餐厅很常见，父母也会单独出去吃；家庭轻松外食人均常在 150 到 300 元，正式晚餐明显更高。",
          rhythm:
            "司机和阿姨构成日常运转底盘，围绕学校、补习、室内运动和空气质量安排生活节奏，旅行会按学期和天气有规律地展开。",
        },
      },
    },
  },
  chengdu: {
    lifestyle:
      "节奏更松、生活成本明显低于一线的强二线城市，同时有极强的餐饮文化。英语使用环境不如上海和北京普遍，但高端住房和国际学校学费依旧远低于一线。常见进入路径是 Z 签或人才类居留。",
    tiers: {
      true_fat_fire: {
        description:
          "锦江区三居高层或兰桂坊一带高端公寓，全职阿姨加司机，热衷火锅、私宴和茶馆，每年 2 到 3 次国际旅行。",
        guide: {
          groceries:
            "会同时使用进口超市和本地高品质生鲜，好的海鲜、肉类、葡萄酒和礼盒水果都能轻松买，厨房配置很讲究。",
          dining:
            "火锅、升级版川菜和酒店餐厅出现频率很高，稍微认真一点的一顿饭，人均大多在 500 到 1200 元。",
          rhythm:
            "交通上更偏司机或高频叫车，美容 wellness 支出更完整，也会把精品酒店和成渝休闲出行当成常态，而不是偶发奖励。",
        },
      },
      comfortable_expat: {
        description:
          "桐梓林 / 高新区两居，平时经常在外面吃，电瓶车加滴滴，月月周边短途，每年一趟长线旅行。",
        guide: {
          groceries:
            "采购组合通常是山姆式囤货、进口基础食材和本地高性价比的菜肉，自己做饭可以吃得很舒服但不会过度奢侈。",
          dining:
            "每周会有几次外食，偶尔升级一顿，日常人均大多在 80 到 180 元，想吃得更好时会到 300 到 700 元。",
          rhythm:
            "交通以滴滴和地铁为主，个人护理支出适中，偶尔请保洁，娱乐和旅行更偏国内城市短假，而不是持续高密度度假。",
        },
      },
      luxury_family: {
        description:
          "高新区别墅或高端社区，靠近 QSI / LEA，全职阿姨加部分司机服务，国际学校与家庭行程配套完整，每年会安排回母国或长途旅行。",
        guide: {
          groceries:
            "家庭采购会覆盖进口零食、优质蛋白、水果和家居日用品，依靠外卖和大包装补货，日常供应很充足。",
          dining:
            "周末家庭外食和父母单独吃饭都不少，轻松型家庭外食人均多在 100 到 220 元，目的地餐厅会明显再往上。",
          rhythm:
            "阿姨负责家务底盘，司机按需要补位，生活围绕学校、活动班和假期节奏展开，旅行安排也更贴学期表。",
        },
      },
    },
  },
  "kuala-lumpur": {
    lifestyle:
      "热带首都，英语环境成熟，在 Bangsar 和 Mont Kiara 可以用相对低的成本获得很高的居住品质。国际学校和家务帮工是预算波动最大的两项，MM2H 仍是较成熟的 Fat FIRE 居留路径。",
    tiers: {
      true_fat_fire: {
        description:
          "KLCC / Mont Kiara 约 2500 平尺以上大公寓，带泳池和健身房，住家 helper 加兼职司机，每周 fine dining，周末飞巴厘岛或普吉很自然。",
        guide: {
          groceries:
            "买菜以 Village Grocer 这类高端超市和湿巴刹补货为主，进口水果、澳洲牛肉、海鲜、葡萄酒和家居用品都可以不太看价签。",
          dining:
            "每周会有几次更体面的外食，酒店 brunch 和 chef-driven 餐厅都不稀奇，正式一点的人均常在 250 到 600 马币。",
          rhythm:
            "交通以 Grab 或司机为主，健身、spa、俱乐部消费比较稳定，家务帮工容易配置，区域内高端周末游是常规生活的一部分。",
        },
      },
      comfortable_expat: {
        description:
          "Mont Kiara / Bangsar 两居公寓，平时常在外面吃，钟点 helper 每周 2 到 3 天，每年 1 到 2 次区域旅行加一次欧美长途。",
        guide: {
          groceries:
            "日常会在 expatriate 友好的超市买进口奶制品和基础 pantry，再配合 wet market 补蔬果和肉类，做饭舒适但不追求极致。",
          dining:
            "一周会外食 2 到 3 次，偶尔升级一顿，轻松吃人均大约 40 到 100 马币，认真一点的一顿常在 180 到 350 马币。",
          rhythm:
            "平时主要靠 Grab，个人护理和 wellness 支出中等，清洁外包为主，生活重心是东南亚出行的方便，而不是持续性奢华配置。",
        },
      },
      luxury_family: {
        description:
          "Mont Kiara 别墅或带泳池的低密 3 到 4 居，住家 helper 加司机，适合 ISKL / Alice Smith 这类学校和家庭型区域短途旅行。",
        guide: {
          groceries:
            "家庭采购会在高端超市和 bulk run 之间切换，进口零食、水果、优质蛋白和招待客人的储备都比较完整。",
          dining:
            "周末经常会有家庭 brunch 或晚餐，父母也会单独出去吃；轻松型家庭外食人均多在 60 到 140 马币，去更好的馆子会高很多。",
          rhythm:
            "住家帮工和司机让家庭运转更顺，孩子活动和俱乐部支出更明显，很多短途假期会围绕东南亚航线展开。",
        },
      },
    },
  },
  "new-york": {
    lifestyle:
      "全球金融与文化中心，密度和资源顶级，但纽约州税加纽约市税使综合税负处在美国最重的一档。曼哈顿住房面积偏小、doorman 建筑溢价高，Fat FIRE 阶段尤其要重视 domicile 规划，因为纽约对离开高收入人群的审计很强。",
    tiers: {
      true_fat_fire: {
        description:
          "上东区 / Tribeca / 西村 2 到 3 居 condo 或 doorman building，定期米其林、每周 housekeeping，3 次以上国际旅行加 Hamptons 夏天。",
        guide: {
          groceries:
            "日常采购会在 Whole Foods、Citarella、Union Market 和 greenmarket 之间组合，蔬果、海鲜、葡萄酒和在家招待客人的储备都偏高配。",
          dining:
            "多数周都会有几次像样的晚餐，穿插 tasting menu 或 power dining，正式一点的人均往往在 200 到 400 美元以上，还不含酒。",
          rhythm:
            "交通上黑车和打车更随手，每周 housekeeping、精品健身和文化消费是常态，生活节奏默认包含 Hamptons、滑雪和国际长途。",
        },
      },
      comfortable_expat: {
        description:
          "布鲁克林 / LIC / 上西区一居租房，每周外食 3 到 4 晚，地铁加 Uber，每年 1 到 2 次国际旅行加东北部短途。",
        guide: {
          groceries:
            "买菜一般是 Trader Joe's 打底，Whole Foods 补货，再配一点社区蔬果和更好的蛋白，厨房整体还是很纽约式的丰盛感。",
          dining:
            "一周会出去吃好几次，偶尔认真吃一顿；轻松吃人均多在 30 到 65 美元，像样晚餐则常在 130 到 250 美元。",
          rhythm:
            "平时主要靠地铁加 Uber，理发、美甲、健身等个人消费稳定，周末会去 upstate、海边或东北周边，而不是全程奢华调度。",
        },
      },
      luxury_family: {
        description:
          "上东区 classic 6 或 brownstone，适配 Dalton / Trinity / Spence 这一类顶级私校，配部分家务帮手，每年有国际旅行和 Hamptons / 滑雪季安排。",
        guide: {
          groceries:
            "家庭采购会覆盖 Whole Foods、高端熟食店、学校午餐补给和招待客人的 pantry 储备，整体非常完整。",
          dining:
            "周末家庭 brunch 和正餐很常见，父母也会单独外食；家庭随意吃人均大多在 40 到 80 美元，正式晚餐则会高很多。",
          rhythm:
            "家务帮手、学校与活动班 logistics 占据大量精力，全年节奏通常在城市日常、Hamptons 或雪季，以及长途家庭旅行之间切换。",
        },
      },
    },
  },
  "san-francisco": {
    lifestyle:
      "全球科技资本中心，气候、餐饮和文化密度都很强，但加州州税和极端住房成本会明显抬高 Fat FIRE 门槛。加州最高 13.3% 税率且把 LTCG 按普通收入处理，使得退出规划在这个级别尤其关键。",
    tiers: {
      true_fat_fire: {
        description:
          "Pacific Heights / Russian Hill 高配 2 到 3 居，定期米其林、每周 housekeeping，3 次以上国际旅行加 Napa 周末。",
        guide: {
          groceries:
            "Whole Foods、Bi-Rite、精品酒铺、肉铺和 farmers' market 共同构成日常采购，海鲜、优质蔬果和在家宴客配置都很上档次。",
          dining:
            "大多数周会有几次不错的晚餐，定期升级到 tasting menu 或 Michelin，正式一点的人均大多在 175 到 350 美元以上，不含酒。",
          rhythm:
            "需要时直接打车或叫 car service，每周 housekeeping、boutique fitness 和 wellness 稳定存在，社交节奏默认包含 Napa、Sonoma 和长途旅行。",
        },
      },
      comfortable_expat: {
        description:
          "Mission / Hayes Valley / Noe Valley 一居公寓，每周外食 3 晚，Muni 加 rideshare，每年 1 到 2 次国际旅行加 wine country 周末。",
        guide: {
          groceries:
            "日常会用 Trader Joe's 打底，Whole Foods 和 Bi-Rite 补货，再配 farmers' market 的蔬果，足够支持好一些的蛋白和 pantry。",
          dining:
            "每周外食 2 到 3 次，偶尔吃得更好；轻松吃人均多在 30 到 60 美元，升级一顿通常在 120 到 220 美元。",
          rhythm:
            "平时主要靠步行、Muni 和 rideshare，个人护理支出规律，周末多去海岸、酒乡或 cabin，而不是全套奢华后勤。",
        },
      },
      luxury_family: {
        description:
          "Noe Valley / Presidio Heights 四居住宅，适配 Town / Hamlin / SF Day 一类私校，家务帮手可配，每年会有国际和滑雪旅行。",
        guide: {
          groceries:
            "家庭采购以优质蔬果、精品肉海鲜、学校午餐和家里接待客人的储备为主，整体是大体量但不太妥协质量的买法。",
          dining:
            "周末常有家庭 brunch 或晚餐，父母也会安排约会餐；家庭随意外食人均大约 35 到 70 美元，特殊场合更高。",
          rhythm:
            "家务帮手、学校与活动 logistics、滑雪周和夏令营一起定义全年节奏，长期家庭旅行通常也会固定排进日历。",
        },
      },
    },
  },
  seattle: {
    lifestyle:
      "太平洋西北科技重镇，没有州所得税，气候温和，和亚洲航线连接强。住房比旧金山和纽约便宜不少，而零州税优势在长期 Fat FIRE 路径里会不断累积。对比高税州，这里建立居住身份也简单得多。",
    tiers: {
      true_fat_fire: {
        description:
          "Belltown / Downtown 景观高层 2 到 3 居，每周 housekeeping，定期目的地餐厅，每年 3 次以上国际旅行加滑雪和 BC 周末。",
        guide: {
          groceries:
            "PCC、Whole Foods 和精品肉铺、鱼铺是主要采购渠道，海鲜、蔬果、葡萄酒和在家招待客人的配置都会拉满。",
          dining:
            "大多数周都会有几次不错的外食，也会定期去 destination dining；正式一点的人均大多在 150 到 300 美元以上。",
          rhythm:
            "交通按需要打车，housekeeping、boutique fitness 和 wellness 支出稳定存在，休闲节奏默认包括 Whistler、群岛和国际长途。",
        },
      },
      comfortable_expat: {
        description:
          "Capitol Hill / Fremont / Ballard 一居公寓，每周外食 2 到 3 晚，自行车加公共交通，夏天 PNW 周边加每年 1 到 2 次国际旅行。",
        guide: {
          groceries:
            "日常采购会混合 Trader Joe's、PCC、农贸市场和海鲜肉类补货，自己做饭可以吃得很好，但不进入全面奢侈模式。",
          dining:
            "每周外食 2 到 3 次，偶尔升级一顿；轻松吃人均大约 25 到 50 美元，更讲究一点则常在 100 到 180 美元。",
          rhythm:
            "平时主要靠公交、自行车和偶尔打车，wellness 支出适中，周末以徒步、轮渡和周边短逃为主，生活感强于仪式化奢华。",
        },
      },
      luxury_family: {
        description:
          "Mercer Island 或 Bellevue 四居住宅，适配 Lakeside / Bush / Eastside Prep 一类学校，每年国际和滑雪旅行固定，偶尔配 housekeeper。",
        guide: {
          groceries:
            "家庭采购会在 PCC、Whole Foods、Costco 型补货之间切换，蛋白、零食、学校用品和日常 pantry 一次买齐。",
          dining:
            "周末家庭 brunch 和晚餐比较常见，父母也会安排单独吃饭；家庭轻松外食人均通常在 30 到 60 美元，更好的夜晚明显更高。",
          rhythm:
            "housekeeping 或 childcare 会在需要时补位，学校、活动班、滑雪季和夏令营把全年节奏分割得很清楚，假期以国际旅行为主。",
        },
      },
    },
  },
  shanghai: {
    lifestyle:
      "国际化金融中心，法租界和静安仍是高端 expatriate 聚集地。对家庭来说，国际学校学费通常是最大单项成本，进口商品溢价也很明显。常见路径仍然是雇佣类 Z 签证，直接投资居留并不算成熟。",
    tiers: {
      true_fat_fire: {
        description:
          "法租界里弄洋房或陆家嘴顶层公寓，住家阿姨加司机，每周私宴或精致餐厅，红酒社交频繁，每年 3 次以上国际旅行。",
        guide: {
          groceries:
            "盒马、进口超市和高端即时配送一起构成采购体系，海鲜、水果、葡萄酒和进口 pantry 都能轻松覆盖。",
          dining:
            "高端餐厅、酒店酒吧和 chef-led tasting menu 出现频率很高，认真一点的晚餐人均通常在 800 到 2000 元。",
          rhythm:
            "司机和阿姨让生活非常顺，配送服务密度高，健身美容支出更完整，社交中心通常围绕餐厅、酒吧和高端零售展开。",
        },
      },
      comfortable_expat: {
        description:
          "静安 / 新天地 / 法租界两居或服务式公寓，每周外食 3 到 4 晚，中西餐混搭，钟点阿姨，区域旅行加每年一次长途。",
        guide: {
          groceries:
            "日常会用盒马、山姆型补货和进口超市来搭配奶酪、咖啡、葡萄酒和更好的蛋白，厨房熟悉感很强但不走顶级路线。",
          dining:
            "每周外食 2 到 3 次，偶尔升级一顿；轻松吃人均多在 120 到 250 元，更好的晚餐常在 600 到 1200 元。",
          rhythm:
            "地铁和网约车都很方便，外卖与即时配送构成日常效率底盘，理发美容和周边短途旅行会自然嵌进城市生活。",
        },
      },
      luxury_family: {
        description:
          "长宁 / 闵行国际社区 3 到 4 居，靠近 SAS 或 BISS，全职阿姨加司机，配国际学校、滑雪海岛假期和暑期回母国安排。",
        guide: {
          groceries:
            "家庭采购会覆盖进口超市、盒马和大批量送货，学校零食、水果、优质蛋白和家居用品都会按家庭规模补齐。",
          dining:
            "周末多去商场或酒店型餐厅，父母也会单独外食；家庭轻松吃人均大约 150 到 300 元，目的地餐厅更高。",
          rhythm:
            "阿姨与司机承担大量家庭 logistics，孩子的学校、俱乐部和补习会让时间表很密，全年旅行也会围绕 school break 展开。",
        },
      },
    },
  },
  tokyo: {
    lifestyle:
      "高度都市化的大都会，公共交通极强、餐饮密度顶级、医疗体系稳定。中心城区租金虽然低于旧金山和纽约，但进口奢侈消费和国际学校学费会显著抬高高档预算。常见的 Fat FIRE 签证路径是高度人才或经营管理。",
    tiers: {
      true_fat_fire: {
        description:
          "麻布 / 广尾 / 青山 3 到 4 居塔楼，带 concierge，每周高质量晚餐，定期 omakase，私家车，全年 3 到 4 次国际旅行加国内度假。",
        guide: {
          groceries:
            "买菜以 depachika 和 Seijo Ishii 这类高端进口篮子为主，顶级水果、刺身、和牛、葡萄酒都会经常进厨房，补货基本不太看账单。",
          dining:
            "多数周会有 2 到 3 次比较讲究的晚餐，定期吃 omakase 或酒店餐厅，像样一点的人均大约在 1.5 万到 4 万日元。",
          rhythm:
            "方便时直接打车或用私家车，concierge 和 housekeeping 支撑日常，美容 wellness、画廊、酒店和奢侈品消费都比较稳定。",
        },
      },
      comfortable_expat: {
        description:
          "涩谷 / 目黑 / 中目黑 1 到 2 居中层公寓，每周 2 到 3 次居酒屋，偶尔 omakase，地铁加出租，每年一次长途加温泉周末。",
        guide: {
          groceries:
            "会在社区超市、百货地下食品层和进口食材之间混搭，蔬果、海鲜、熟食和 pantry 补货都舒服，但不走全面奢华路线。",
          dining:
            "一周会有 2 到 3 次居酒屋或小酒馆，隔几周升级一顿；日常人均约 2000 到 6000 日元，想认真吃一顿则常在 1.2 万到 2 万日元。",
          rhythm:
            "主要靠轨道交通，偶尔打车，定期做护理和 wellness，周末更多是温泉或国内短假，而不是持续高成本的奢华调度。",
        },
      },
      luxury_family: {
        description:
          "广尾 / 元麻布高配 3 到 4 居塔楼，每周 housekeeping，司机随叫随到，适配 ASIJ / Nishimachi 这一类学校，安排国际和滑雪海岛假期。",
        guide: {
          groceries:
            "家庭采购会买高品质水果、海鲜、便当和进口零食，并结合食品馆和便利型超市高频补货，整体非常完整。",
          dining:
            "周末家庭外食和父母约会餐都比较常见，家庭轻松吃人均约 4000 到 8000 日元，正式晚餐明显更高。",
          rhythm:
            "housekeeping、司机、课后活动和学校 logistics 一起定义日常，全年安排默认包含滑雪或海边假期，以及更高配的亲子支出。",
        },
      },
    },
  },
  vancouver: {
    lifestyle:
      "气候温和、靠山临海的西海岸城市，社区多元，公共医疗稳定。住房成本在北美依然非常高，海外买家税和空置税让买房更复杂。这个模型默认你仍是美国税务居民；若实际转成加拿大税务居民，还会叠加联邦和 BC 税负。",
    tiers: {
      true_fat_fire: {
        description:
          "Coal Harbour / Yaletown 顶层公寓或西区独栋，每周 housekeeping，高端餐厅频繁，3 次以上国际旅行加 Whistler 雪季。",
        guide: {
          groceries:
            "Whole Foods、精品熟食店、鱼铺和农贸市场会是主力渠道，海鲜、蔬果、葡萄酒和在家招待客人的采购都偏高配。",
          dining:
            "大多数周会有几次比较讲究的外食，也会定期去 tasting menu 或 destination dining；正式一点的人均常在 180 到 350 加元。",
          rhythm:
            "有需要时直接叫车或用 car share，每周 housekeeping 和俱乐部 / wellness 支出稳定存在，生活默认包含 Whistler 和国际长途。",
        },
      },
      comfortable_expat: {
        description:
          "Kitsilano / Mount Pleasant / Main St 一居 condo，每周外食 2 到 3 晚，公共交通加 car share，徒步滑雪周末加每年 1 到 2 次国际旅行。",
        guide: {
          groceries:
            "买菜通常是 Save-On-Foods 打底，Whole Foods 补货，再加蔬果店和偶尔的 specialty store，芝士、葡萄酒和蛋白都能兼顾。",
          dining:
            "每周会出去吃几次，偶尔升级一顿；轻松吃人均多在 30 到 60 加元，更好的晚餐常在 120 到 220 加元。",
          rhythm:
            "平时以 transit 和 car share 为主，个人护理支出适中，周末会围绕徒步、滑雪、岛屿和山地短逃展开，节奏松弛但不寒酸。",
        },
      },
      luxury_family: {
        description:
          "西区 Kerrisdale / Dunbar 四居独栋，适配 St Georges / Crofton / York House 这类私校，雪季常去 Whistler，每年有国际家庭旅行。",
        guide: {
          groceries:
            "家庭采购会覆盖高品质水果、海鲜、学校零食和 Costco 式大宗补货，再叠加社区精品超市，体量和品质都比较高。",
          dining:
            "周末家庭 brunch 和晚餐很常见，父母也会安排单独外食；家庭轻松吃人均多在 35 到 70 加元，正式晚餐明显更高。",
          rhythm:
            "按需配置 household help，私校和活动班 logistics 会占掉不少时间，全年节奏通常围绕 Whistler、夏令营和长途家庭旅行展开。",
        },
      },
    },
  },
};

export function getLocalizedCityLifestyle(city: CityData, locale: Locale) {
  if (locale === "zh") {
    return (
      zhCityNarratives[city.slug]?.lifestyle ??
      city.lifestyle ??
      `${city.name} 是一个适合做 Fat FIRE 规划的高关注城市，这里的预算基线来自策展整理。`
    );
  }

  return (
    city.lifestyle ??
    `${city.name} is modeled as a high-interest Fat FIRE destination with curated spending anchors.`
  );
}

export function getLocalizedTierNarrative(
  city: CityData,
  tier: TierKey,
  locale: Locale
) {
  if (locale === "zh") {
    const translated = zhCityNarratives[city.slug]?.tiers[tier];
    if (translated) {
      return translated;
    }
  }

  return {
    description: city.tiers[tier].description,
    guide: city.tiers[tier].guide,
  };
}
