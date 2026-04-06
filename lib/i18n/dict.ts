export type Locale = "en" | "zh";

export const LOCALES: Locale[] = ["en", "zh"];

type DictShape = {
  brand: string;
  nav: { cities: string; compare: string };
  ui: { toggle: string; toggleLanguage: string };
  footer: string;
  home: {
    kicker: string;
    title: string;
    subtitle: string;
    strengthsTitle: string;
    strengths: [string, string, string];
    chooseCity: string;
    chooseCityDesc: string;
    search: string;
    searchPlaceholder: string;
    baselineTarget: string;
    openCalculator: string;
  };
  compare: {
    kicker: string;
    title: string;
    subtitle: string;
    selectCities: string;
    refresh: string;
    city: string;
    annualSpend: string;
    grossWithdrawal: string;
    totalTax: string;
    fireNumber: string;
  };
  calc: {
    kicker: string;
    addToCompare: string;
    openCompare: string;
    household: string;
    householdDesc: string;
    profile: string;
    numKids: string;
    retirementAge: string;
    lifeExpectancy: string;
    lifestyleTier: string;
    tierHelp: string;
    selected: string;
    housing: string;
    mode: string;
    area: string;
    size: string;
    homeSqm: string;
    expenseOverrides: string;
    expenseOverridesDesc: string;
    baseline: string;
    portfolio: string;
    withdrawalSeq: string;
    taxable: string;
    traditional: string;
    roth: string;
    costBasis: string;
    taxAssumptions: string;
    filingStatus: string;
    usState: string;
    returnsRunway: string;
    returnsRunwayDesc: string;
    swr: string;
    realReturn: string;
    inflation: string;
    stockAllocation: string;
    bondAllocation: string;
    currentPortfolio: string;
    annualSavings: string;
    fireTarget: string;
    monthlySpend: string;
    grossWithdrawalMo: string;
    taxMo: string;
    netSpendMo: string;
    yearsToFire: string;
    addPortfolioSavings: string;
    yearsSuffix: string;
    whyThisNumber: string;
    expand: string;
    dataProvenance: string;
    updated: string;
    spendChartTitle: string;
    spendChartSub: string;
    taxChartTitle: string;
    taxChartSub: string;
    cityContext: string;
    homeBase: string;
    groceriesGuide: string;
    diningGuide: string;
    rhythmGuide: string;
    overridesTitle: string;
    calculationChain: string;
    groceryBudget: string;
    diningBudget: string;
    currentHousing: string;
    annualSpendUsd: string;
    grossWithdrawal: string;
    totalTax: string;
    requiredPortfolio: string;
    costBasisSensitivity: string;
    zeroBasis: string;
    currentBasis: string;
    fullBasis: string;
    homeValueAddBack: string;
    totalCapitalNeeded: string;
    explanationIntro: string;
    monthlyCarryCost: string;
    cityBaseline: string;
    yourOverrides: string;
    fxFallback: string;
    stressTest: string;
    stressTestDesc: string;
    stressTestExpand: string;
    successProbability: string;
    simulationTrials: string;
    percentilePath: string;
    deterministicBaseline: string;
    simulatedStressTest: string;
    addPortfolioForStressTest: string;
    portfolioLastsToAge: string;
    realSpendingAssumption: string;
    categoryLabels: {
      housing: string;
      groceries: string;
      dining_out: string;
      transport: string;
      healthcare: string;
      utilities: string;
      internet_mobile: string;
      entertainment: string;
      personal_services: string;
      domestic_help: string;
      luxury_misc: string;
      education: string;
      travel: string;
      legal_tax: string;
      visa_residency: string;
    };
    expenseFields: {
      groceries_monthly: string;
      dining_out_monthly: string;
      transport_monthly: string;
      healthcare_monthly: string;
      utilities_monthly: string;
      internet_mobile_monthly: string;
      entertainment_monthly: string;
      personal_services_monthly: string;
      domestic_help_monthly: string;
      luxury_misc_monthly: string;
      education_annual: string;
      travel_annual: string;
      legal_tax_compliance_annual: string;
      visa_residency_annual: string;
      contingency_pct: string;
    };
    taxSegments: {
      netSpend: string;
      federalLtcg: string;
      federalOrdinary: string;
      niit: string;
      stateTax: string;
      grossWithdrawal: string;
    };
    warnings: {
      aggressiveSwr: string;
      highCostBasis: string;
      domicileRequired: string;
      solverNotConverged: string;
      localTaxesOmitted: string;
    };
  };
  tiers: {
    comfortable_expat: string;
    true_fat_fire: string;
    luxury_family: string;
  };
  households: { single: string; couple: string; family: string };
  filingStatus: {
    single: string;
    married_filing_jointly: string;
  };
  housingMode: { rent: string; own: string };
  housingArea: { central: string; suburb: string };
  housingSize: { "1br": string; "3br": string };
  withdrawal: { proportional: string; tax_optimal: string };
};

export const dict: Record<Locale, DictShape> = {
  en: {
    brand: "Fat FIRE City Calculator",
    nav: { cities: "Cities", compare: "Compare" },
    ui: { toggle: "Toggle", toggleLanguage: "Toggle language" },
    footer:
      "Educational only. Not financial, legal, or tax advice. Every city uses curated source data and a US-resident tax model.",
    home: {
      kicker: "Fat FIRE planning",
      title: "Estimate your Fat FIRE number by city",
      subtitle:
        "Compare city-level spending, US federal tax drag, NIIT, and retirement-state assumptions across taxable, traditional, and Roth buckets. The calculator is optimized for US tax residents planning a portfolio-funded retirement.",
      strengthsTitle: "What it does well",
      strengths: [
        "City-by-city cost presets with editable category overrides.",
        "Federal LTCG, ordinary income, NIIT, and retirement-state tax drag.",
        "Shareable URLs and comparison mode for side-by-side review.",
      ],
      chooseCity: "Choose a city",
      chooseCityDesc:
        "Start with a curated baseline, then adjust household, tax, housing, and portfolio assumptions live.",
      search: "Search",
      searchPlaceholder: "Tokyo, Vancouver, Kuala Lumpur...",
      baselineTarget: "Baseline target",
      openCalculator: "Open calculator",
    },
    compare: {
      kicker: "Comparison mode",
      title: "Compare city targets side by side",
      subtitle:
        "Baseline assumptions use the Comfortable Expat tier, couple household, central 1BR rent, no state tax, and a 3.25% SWR. Choose up to four cities for a quick ranking pass.",
      selectCities: "Select cities",
      refresh: "Refresh comparison",
      city: "City",
      annualSpend: "Annual spend",
      grossWithdrawal: "Gross withdrawal",
      totalTax: "Total tax",
      fireNumber: "FIRE number",
    },
    calc: {
      kicker: "City calculator",
      addToCompare: "Add to comparison",
      openCompare: "Open comparison",
      household: "Household",
      householdDesc:
        "Retirement horizon and family profile change spending pressure and warning thresholds.",
      profile: "Profile",
      numKids: "Number of kids",
      retirementAge: "Retirement age",
      lifeExpectancy: "Life expectancy",
      lifestyleTier: "Lifestyle tier",
      tierHelp:
        "Pick the lifestyle baseline that best matches you, then fine-tune category assumptions below.",
      selected: "Selected",
      housing: "Housing",
      mode: "Mode",
      area: "Area",
      size: "Size",
      homeSqm: "Home size (sqm)",
      expenseOverrides: "Expense overrides",
      expenseOverridesDesc:
        "Values are entered in the city's local currency. Leave a field at the baseline preset to avoid storing an override.",
      baseline: "Baseline",
      portfolio: "Portfolio composition",
      withdrawalSeq: "Withdrawal sequencing",
      taxable: "Taxable",
      traditional: "Traditional",
      roth: "Roth",
      costBasis: "Cost basis of taxable",
      taxAssumptions: "Tax assumptions",
      filingStatus: "Federal filing status",
      usState: "US retirement state",
      returnsRunway: "Returns and runway",
      returnsRunwayDesc:
        "Current portfolio and annual savings are optional. If both are set, the calculator estimates a simple real-return path to the target.",
      swr: "Safe withdrawal rate",
      realReturn: "Real return",
      inflation: "Inflation",
      stockAllocation: "Stock allocation",
      bondAllocation: "Bond allocation",
      currentPortfolio: "Current portfolio (USD)",
      annualSavings: "Annual savings (USD)",
      fireTarget: "Fat FIRE target",
      monthlySpend: "Monthly spend",
      grossWithdrawalMo: "Gross withdrawal / mo",
      taxMo: "Tax / mo",
      netSpendMo: "Net spend / mo",
      yearsToFire: "Years to FIRE",
      addPortfolioSavings: "Add portfolio + savings",
      yearsSuffix: "years",
      whyThisNumber: "Why this number?",
      expand: "Expand",
      dataProvenance: "Data provenance",
      updated: "Updated",
      spendChartTitle: "Monthly spend by category",
      spendChartSub:
        "Baseline preset vs your current overrides, sorted by size, in USD / month.",
      taxChartTitle: "Monthly withdrawal composition",
      taxChartSub:
        "See how much of the gross monthly draw becomes spendable net cash.",
      cityContext: "City context",
      homeBase: "Home base",
      groceriesGuide: "Groceries and home cooking",
      diningGuide: "Eating out",
      rhythmGuide: "Day-to-day rhythm",
      overridesTitle: "Your overrides vs preset",
      calculationChain: "Calculation chain",
      groceryBudget: "Current grocery budget",
      diningBudget: "Current dining budget",
      currentHousing: "Current housing choice",
      annualSpendUsd: "Annual spend (USD)",
      grossWithdrawal: "Gross withdrawal",
      totalTax: "Total tax",
      requiredPortfolio: "Required portfolio",
      costBasisSensitivity: "Cost basis sensitivity",
      zeroBasis: "0% basis",
      currentBasis: "Current basis",
      fullBasis: "100% basis",
      homeValueAddBack: "Home value add-back",
      totalCapitalNeeded: "Total capital needed",
      explanationIntro:
        "This section explains both the lifestyle behind the preset and the math underneath it. Read the city context first, then the grocery, dining, and day-to-day assumptions for your current tier and housing choice.",
      monthlyCarryCost: "Monthly carrying cost",
      cityBaseline: "City baseline",
      yourOverrides: "Your overrides",
      fxFallback:
        "Snapshot FX fallback from {date}. Live FX uses a free reference feed when available.",
      stressTest: "Stress test",
      stressTestDesc:
        "A simple Monte Carlo check for the chance your current portfolio survives to your target age. The FIRE number remains the deterministic baseline; this is the simulated stress test.",
      stressTestExpand: "Run simulation",
      successProbability: "Success probability",
      simulationTrials: "Simulation trials",
      percentilePath: "10th percentile path",
      deterministicBaseline: "Deterministic baseline",
      simulatedStressTest: "Simulated stress test",
      addPortfolioForStressTest:
        "Add your current portfolio to run the Monte Carlo stress test.",
      portfolioLastsToAge: "Portfolio survival to age {age}",
      realSpendingAssumption:
        "Assumes spending stays constant in real dollars and withdrawals happen at the start of each retirement year.",
      categoryLabels: {
        housing: "Housing",
        groceries: "Groceries",
        dining_out: "Dining out",
        transport: "Transport",
        healthcare: "Healthcare",
        utilities: "Utilities",
        internet_mobile: "Internet / mobile",
        entertainment: "Entertainment",
        personal_services: "Personal services",
        domestic_help: "Domestic help",
        luxury_misc: "Luxury misc",
        education: "Education",
        travel: "Travel",
        legal_tax: "Legal / tax",
        visa_residency: "Visa / residency",
      },
      expenseFields: {
        groceries_monthly: "Groceries / month",
        dining_out_monthly: "Dining out / month",
        transport_monthly: "Transport / month",
        healthcare_monthly: "Healthcare / month",
        utilities_monthly: "Utilities / month",
        internet_mobile_monthly: "Internet + mobile / month",
        entertainment_monthly: "Entertainment / month",
        personal_services_monthly: "Personal services / month",
        domestic_help_monthly: "Domestic help / month",
        luxury_misc_monthly: "Luxury misc / month",
        education_annual: "Education / year",
        travel_annual: "Travel / year",
        legal_tax_compliance_annual: "Legal / tax / year",
        visa_residency_annual: "Visa / residency / year",
        contingency_pct: "Contingency %",
      },
      taxSegments: {
        netSpend: "Net spend",
        federalLtcg: "Federal LTCG",
        federalOrdinary: "Federal ordinary income",
        niit: "NIIT",
        stateTax: "State tax",
        grossWithdrawal: "Gross withdrawal",
      },
      warnings: {
        aggressiveSwr:
          "SWR of {swr}% over a {horizon}-year horizon is aggressive; consider 3.25% to 3.5%.",
        highCostBasis:
          "Cost basis is set very high; realized gains may end up larger in practice.",
        domicileRequired:
          "{state} selection assumes you will still be tax-resident there in retirement; if you expect to move, switch to the destination state.",
        solverNotConverged:
          "Withdrawal solver stopped after {iterations} iterations with about ${residual} of unresolved annual error. Treat this output as approximate.",
        localTaxesOmitted:
          "Local city taxes on investment withdrawals are not included; foreign tax credits and treaty treatment vary.",
      },
    },
    tiers: {
      comfortable_expat: "Comfortable Expat",
      true_fat_fire: "True Fat FIRE",
      luxury_family: "Luxury Family",
    },
    households: {
      single: "Single",
      couple: "Couple (no kids)",
      family: "Family with kids",
    },
    filingStatus: {
      single: "Single",
      married_filing_jointly: "Married filing jointly",
    },
    housingMode: { rent: "Rent", own: "Own" },
    housingArea: { central: "Central", suburb: "Suburb" },
    housingSize: { "1br": "1 BR", "3br": "3 BR" },
    withdrawal: { proportional: "Proportional", tax_optimal: "Tax-optimal" },
  },
  zh: {
    brand: "Fat FIRE 城市计算器",
    nav: { cities: "城市", compare: "对比" },
    ui: { toggle: "展开/收起", toggleLanguage: "切换语言" },
    footer:
      "本工具仅供教育与研究使用，不构成财务、法律或税务建议。城市成本数据来自策展整理，税务模型基于美国税务居民设定。",
    home: {
      kicker: "Fat FIRE 规划",
      title: "按城市估算你的 Fat FIRE 所需资产",
      subtitle:
        "把不同城市的生活成本、美国联邦税、NIIT 和退休州税务假设放在同一个框架下比较，同时考虑应税账户、传统退休账户和 Roth 账户。这个工具面向依靠投资组合退休的美国税务居民。",
      strengthsTitle: "这个工具擅长什么",
      strengths: [
        "提供按城市策展的生活成本基线，并支持逐项调整。",
        "把联邦长期资本利得税、普通所得税、NIIT 和州税拖累一起纳入。",
        "支持可分享链接和多城市并排比较，便于快速筛选。",
      ],
      chooseCity: "选择城市",
      chooseCityDesc:
        "先从一套策展基线开始，再实时调整家庭结构、税务、住房和投资组合假设。",
      search: "搜索",
      searchPlaceholder: "例如：东京、温哥华、吉隆坡",
      baselineTarget: "基线目标",
      openCalculator: "进入计算器",
    },
    compare: {
      kicker: "对比模式",
      title: "并排比较不同城市的目标资产",
      subtitle:
        "默认基线假设为：舒适侨居档、夫妻无孩、中心城区 1 居租房、无州税、3.25% 提取率。你可以最多选 4 个城市做快速排序。",
      selectCities: "选择城市",
      refresh: "刷新对比",
      city: "城市",
      annualSpend: "年支出",
      grossWithdrawal: "年提取总额",
      totalTax: "年总税负",
      fireNumber: "FIRE 目标资产",
    },
    calc: {
      kicker: "城市计算器",
      addToCompare: "加入对比",
      openCompare: "打开对比",
      household: "家庭结构",
      householdDesc: "退休年限和家庭结构会直接影响支出水平与风险提示。",
      profile: "家庭类型",
      numKids: "孩子数量",
      retirementAge: "退休年龄",
      lifeExpectancy: "预期寿命",
      lifestyleTier: "生活方式档位",
      tierHelp: "先选一档最接近你的生活方式，再在下方逐项微调。",
      selected: "当前选择",
      housing: "住房",
      mode: "持有方式",
      area: "地段",
      size: "户型",
      homeSqm: "住房面积（平方米）",
      expenseOverrides: "支出微调",
      expenseOverridesDesc:
        "金额按城市本地货币填写。若与基线一致，则不会记录为额外调整。",
      baseline: "基线",
      portfolio: "投资组合构成",
      withdrawalSeq: "提取顺序",
      taxable: "应税账户",
      traditional: "传统退休账户",
      roth: "Roth 账户",
      costBasis: "应税账户成本基础比例",
      taxAssumptions: "税务假设",
      filingStatus: "联邦报税身份",
      usState: "退休后的美国州税归属",
      returnsRunway: "回报与达标时间",
      returnsRunwayDesc:
        "当前投资组合和年储蓄额都属于可选项。两者都填写后，计算器会给出一个简化的达标年数估算。",
      swr: "安全提取率（SWR）",
      realReturn: "实际回报率",
      inflation: "通胀率",
      stockAllocation: "股票占比",
      bondAllocation: "债券占比",
      currentPortfolio: "当前投资组合（美元）",
      annualSavings: "年储蓄（美元）",
      fireTarget: "Fat FIRE 目标资产",
      monthlySpend: "月度净支出",
      grossWithdrawalMo: "月度总提取",
      taxMo: "月度税负",
      netSpendMo: "月度可支配净额",
      yearsToFire: "距离 FIRE 还需",
      addPortfolioSavings: "填写当前资产和年储蓄后显示",
      yearsSuffix: "年",
      whyThisNumber: "为什么是这个数字？",
      expand: "展开",
      dataProvenance: "数据来源",
      updated: "更新于",
      spendChartTitle: "各类月支出拆分",
      spendChartSub:
        "按金额排序，对比城市基线与你当前调整后的月度支出（美元）。",
      taxChartTitle: "月度提取构成",
      taxChartSub:
        "看清每月总提取中，税和可支配净额分别占多少。",
      cityContext: "城市背景",
      homeBase: "居住形态",
      groceriesGuide: "买菜与在家吃饭",
      diningGuide: "外食节奏",
      rhythmGuide: "日常生活节奏",
      overridesTitle: "你相对基线的调整",
      calculationChain: "计算链路",
      groceryBudget: "当前买菜预算",
      diningBudget: "当前外食预算",
      currentHousing: "当前住房选择",
      annualSpendUsd: "年支出（美元）",
      grossWithdrawal: "总提取额",
      totalTax: "总税负",
      requiredPortfolio: "所需投资组合规模",
      costBasisSensitivity: "成本基础敏感性",
      zeroBasis: "0% 成本基础",
      currentBasis: "当前成本基础",
      fullBasis: "100% 成本基础",
      homeValueAddBack: "自住房价值回补",
      totalCapitalNeeded: "总计所需资本",
      explanationIntro:
        "这里不只解释公式，也解释这笔预算对应的真实生活。先看城市背景，再看你当前档位下的住房、买菜、外食和日常节奏，最后再看计算链路。",
      monthlyCarryCost: "每月持有成本",
      cityBaseline: "城市基线",
      yourOverrides: "你的调整后",
      fxFallback:
        "FX 快照回退日期：{date}。若实时汇率可用，页面会优先使用实时汇率。",
      stressTest: "压力测试",
      stressTestDesc:
        "用简化的 Monte Carlo 看一眼：你现在这笔资产撑到目标年龄的概率大概有多高。FIRE 目标资产仍然是确定性基线，这里显示的是模拟压力测试。",
      stressTestExpand: "运行模拟",
      successProbability: "成功概率",
      simulationTrials: "模拟路径数",
      percentilePath: "第 10 分位路径",
      deterministicBaseline: "确定性基线",
      simulatedStressTest: "模拟压力测试",
      addPortfolioForStressTest:
        "填入当前投资组合后，才能运行 Monte Carlo 压力测试。",
      portfolioLastsToAge: "资产撑到 {age} 岁的概率",
      realSpendingAssumption:
        "假设退休后每年的实际支出保持不变，并在每个退休年度开始时先提取支出。",
      categoryLabels: {
        housing: "住房",
        groceries: "买菜",
        dining_out: "外食",
        transport: "交通",
        healthcare: "医疗",
        utilities: "水电燃气",
        internet_mobile: "网络与手机",
        entertainment: "娱乐",
        personal_services: "个人服务",
        domestic_help: "家务/帮工",
        luxury_misc: "高端杂项",
        education: "教育",
        travel: "旅行",
        legal_tax: "法务/税务",
        visa_residency: "签证/居留",
      },
      expenseFields: {
        groceries_monthly: "买菜 / 月",
        dining_out_monthly: "外食 / 月",
        transport_monthly: "交通 / 月",
        healthcare_monthly: "医疗 / 月",
        utilities_monthly: "水电燃气 / 月",
        internet_mobile_monthly: "网络与手机 / 月",
        entertainment_monthly: "娱乐 / 月",
        personal_services_monthly: "个人服务 / 月",
        domestic_help_monthly: "家务/帮工 / 月",
        luxury_misc_monthly: "高端杂项 / 月",
        education_annual: "教育 / 年",
        travel_annual: "旅行 / 年",
        legal_tax_compliance_annual: "法务/税务 / 年",
        visa_residency_annual: "签证/居留 / 年",
        contingency_pct: "预留缓冲 %",
      },
      taxSegments: {
        netSpend: "可支配净额",
        federalLtcg: "联邦长期资本利得税",
        federalOrdinary: "联邦普通所得税",
        niit: "NIIT",
        stateTax: "州税",
        grossWithdrawal: "总提取额",
      },
      warnings: {
        aggressiveSwr:
          "以 {horizon} 年退休期来看，{swr}% 的 SWR 偏激进，建议考虑 3.25% 到 3.5%。",
        highCostBasis:
          "你把成本基础比例设得很高，实际可实现资本利得可能会比这里估计得更大。",
        domicileRequired:
          "当前把 {state} 设为退休州，等于默认你退休后仍是该州税务居民；如果你准备迁居，请切到目标州。",
        solverNotConverged:
          "提取求解器在 {iterations} 次迭代后仍有大约 ${residual} 的年度误差未收敛，这个结果要按近似值看待。",
        localTaxesOmitted:
          "模型没有把当地城市层面的投资提取税再加进去；海外税收抵免和税收协定处理也会因个人情况不同而变化。",
      },
    },
    tiers: {
      comfortable_expat: "舒适侨居",
      true_fat_fire: "高配 Fat FIRE",
      luxury_family: "奢享家庭",
    },
    households: {
      single: "单身",
      couple: "夫妻（无孩）",
      family: "有孩家庭",
    },
    filingStatus: {
      single: "单身申报",
      married_filing_jointly: "夫妻联合申报",
    },
    housingMode: { rent: "租房", own: "自有" },
    housingArea: { central: "市中心", suburb: "郊区" },
    housingSize: { "1br": "1 居", "3br": "3 居" },
    withdrawal: { proportional: "按比例", tax_optimal: "税务更优" },
  },
};

export type Dict = DictShape;
