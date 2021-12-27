#!/usr/bin/env node
import fs from 'fs';
const config = require('./config.json');

async function app() {
  var myArgs = process.argv.slice(2);
  const symbol = myArgs[0];

  const path = `${config.path}/${symbol}`;

  const requiredPaths = [path, `${path}/03-management`];
  const nowDate = new Date();
  const padNum = (num: number) => num.toString().padStart(2, '0');

  const nowDateStr = `${nowDate.getFullYear()}.${padNum(
    nowDate.getMonth() + 1
  )}.${padNum(nowDate.getDate())}`;

  requiredPaths.forEach((p) => {
    if (!fs.existsSync(p)) {
      fs.mkdirSync(p);
    }
  });

  const lastDataFile = fs
    .readdirSync(`${path}/01-data`)
    .filter((file) => file.endsWith('.json'))
    .sort((a, b) => b.localeCompare(a))
    .find(() => true);

  const stats = require(`${path}/01-data/${lastDataFile}`);
  const annual = stats.data.data.financials.annual;
  if (annual.revenue.length < 10) {
    throw new Error('Company has not been reporting results for 10 years');
  }

  const periods: number[] = lastNFromArray<string>(
    10,
    stats.data.data.financials.annual.period_end_date
  )
    .map((x) => x.split('-')[0])
    .map((x) => Number(x));

  const roic10 = lastNFromArray<number>(10, annual.roic);
  const current_ratio10 = lastNFromArray<number>(10, annual.current_ratio);
  const debt_to_equity10 = lastNFromArray<number>(10, annual.debt_to_equity);

  const roicAnalysis = analyseRoic(periods, roic10);

  const ratiosAnalysis = analyseRatios(periods, current_ratio10);

  const debtToEquityAnalysis = analyseDebtToEquity(periods, debt_to_equity10);

  let management = {
    type: '03-management',
    symbol,
    references: [],
    date: nowDateStr,
    question1: 'Does the CEO have high levels of stock ownership',
    roicAnalysis,
    ratiosAnalysis,
    debtToEquityAnalysis,
    score:
      roicAnalysis.score + ratiosAnalysis.score + debtToEquityAnalysis.score
  };

  console.log('Writing ', `${path}management/${nowDateStr}.json`);
  try {
    fs.writeFileSync(
      `${path}/03-management/${nowDateStr}.json`,
      JSON.stringify(management, undefined, 4)
    );
  } catch (err) {
    console.error(err);
  }
}

interface IReference {
  displayName: string;
  url: string;
}

interface IAnalysis {
  description: string;
  reference: IReference[];
  redFlags: string[];
  greenFlags: string[];

  score: number;
}

interface IROICAnalysis extends IAnalysis {
  periods: number[];
  roic: number[];

  roicAverage: number;
  roicAverageScore: number;
  roicScore: number;
}

function analyseRoic(periods: number[], roic: number[]): IROICAnalysis {
  // roic 10% minimum, roic 15% Ideal, roic 20% Amazing
  let redFlags: string[] = [];
  let greenFlags: string[] = [];
  let hasRoicUnderMinimumCount = 0;

  const scoreRoic = (a_roic: number): number => {
    if (a_roic < 0.1 && a_roic > 0.07) {
      hasRoicUnderMinimumCount++;
      return 0;
    }
    if (a_roic < 0.08 && a_roic > 0.05) {
      hasRoicUnderMinimumCount++;
      return -1;
    }
    if (a_roic < 0.06) {
      hasRoicUnderMinimumCount++;
      return -3;
    }
    return a_roic >= 0.2 ? 2 : 1;
  };

  const roicScores = roic.map(scoreRoic);
  const roicScore = roicScores.reduce((acc, cur) => acc + cur, 0);

  const roicAverage = roic.reduce((acc, cur) => acc + cur, 0) / 10;

  const roicAverageScore = scoreRoic(roicAverage);

  if (hasRoicUnderMinimumCount > 0) {
    redFlags.push(
      `This company has ${hasRoicUnderMinimumCount} roic values under 10%.`
    );
  }

  if (roicScore > 18) {
    greenFlags.push(
      'This company has outstanding ROIC values. Management are mini Warren Buffets!'
    );
  }

  return {
    description:
      'How well the management invests the surplus cash. roic 10% minimum, roic 15% Ideal, roic 20% Amazing.',
    greenFlags,
    redFlags,
    periods,
    reference: [],
    roic,
    roicAverage,
    roicAverageScore,
    roicScore,
    score: roicScore + roicAverageScore
  };
}
interface IRatiosAnalysis extends IAnalysis {
  periods: number[];
  current_ratios: number[];

  current_ratiosAverage: number;
  current_ratiosAverageScore: number;
  current_ratiosScore: number;
}
function analyseRatios(
  periods: number[],
  current_ratios: number[]
): IRatiosAnalysis {
  let greenFlags: string[] = [];
  let redFlags: string[] = [];
  let debtTooHighCount = 0;

  const scoreRatio = (ratio: number): number => {
    if (ratio < 1) {
      debtTooHighCount++;
      return -3;
    }
    return ratio >= 2 ? 2 : 1;
  };

  // > 1 is a must, > 2 is ideal
  const current_ratiosScores = current_ratios.map(scoreRatio);
  const current_ratiosScore = current_ratiosScores.reduce(
    (acc, cur) => acc + cur,
    0
  );

  const current_ratiosAverage =
    current_ratios.reduce((acc, cur) => acc + cur, 0) / 10;

  const current_ratiosAverageScore = scoreRatio(current_ratiosAverage);

  if (current_ratiosScore === 20) {
    greenFlags.push(
      'Assests are consistanty over 200% liabilities for the last ten years. Debt is managed wonderfully.'
    );
  }

  if (debtTooHighCount > 0) {
    redFlags.push(
      `Debt compared to assests was too high on ${debtTooHighCount} occasions over the last 10 years.`
    );
  }

  return {
    description:
      'How is the debt in the companies handled. Current Ratio is the current assets with its total liabilities. > 100% is a must, > 200% is ideal',
    greenFlags,
    redFlags,
    reference: [],
    periods,
    current_ratios,
    current_ratiosAverage,
    current_ratiosAverageScore,
    current_ratiosScore,
    score: current_ratiosScore + current_ratiosAverageScore
  };
}

interface IDebtToEquityAnalysis extends IAnalysis {
  periods: number[];
  debt_to_equity: number[];

  debt_to_equityAverage: number;
  debt_to_equityAverageScore: number;
  debt_to_equityScore: number;
}

function analyseDebtToEquity(
  periods: number[],
  debt_to_equity: number[]
): IDebtToEquityAnalysis {
  let greenFlags: string[] = [];
  let redFlags: string[] = [];
  let debtToEquityTooHighCount = 0;

  const scoreDebtToEquity = (x: number): number => {
    if (x < 0.5) {
      return 1;
    }
    debtToEquityTooHighCount++;
    return -3;
  };

  const debt_to_equityScores = debt_to_equity.map(scoreDebtToEquity);
  const debt_to_equityScore = debt_to_equityScores.reduce(
    (acc, cur) => acc + cur,
    0
  );

  const debt_to_equityAverage =
    debt_to_equity.reduce((acc, cur) => acc + cur, 0) / 10;

  const debt_to_equityAverageScore = scoreDebtToEquity(debt_to_equityAverage);

  if (debt_to_equityScore === 10) {
    greenFlags.push(
      'Debt has been consistantly mananged wonderfully over the last ten years.'
    );
  }

  if (debtToEquityTooHighCount > 0) {
    redFlags.push(
      `Debt compared to equity was too high on ${debtToEquityTooHighCount} occasions over the last 10 years.`
    );
  }

  return {
    description:
      'How leveraged the company is (e.g. Risk). Debt to equity of .5 or less is ideal',
    greenFlags,
    redFlags,
    reference: [],
    periods,
    debt_to_equity,
    debt_to_equityAverage,
    debt_to_equityAverageScore,
    debt_to_equityScore,
    score: debt_to_equityScore + debt_to_equityAverageScore
  };
}

function lastNFromArray<T>(n: number, values: T[]): T[] {
  return values.slice(-n);
}

app();
