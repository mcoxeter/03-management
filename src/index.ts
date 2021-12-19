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

  const stats = require(`${path}/core/${lastDataFile}`);
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

  // > 1 is a must, > 2 is ideal
  const current_ratioScores = current_ratio10.map((ratio) => {
    if (ratio < 1) {
      return -5;
    }
    return ratio >= 2 ? 2 : 1;
  });
  const current_ratioScore = current_ratioScores.reduce(
    (acc, cur) => acc + cur,
    0
  );

  // With debt to equity a lower number is better, <.5 is ideal
  const debt_to_equityScores = debt_to_equity10.map((x) => (x < 0.5 ? 1 : -10));
  const debt_to_equityScore = debt_to_equityScores.reduce(
    (acc, cur) => acc + cur,
    0
  );

  let management = {
    type: 'management',
    question1: 'Does the CEO have high levels of stock ownership',
    roicAnalysis,
    current_ratioScore: {
      what: 'How is the debt in the companies handled. Current Ratio is the current assets with its total liabilities.',
      goals: '> 1 is a must, > 2 is ideal',
      current_ratio: current_ratio10,
      current_ratioScores,
      total: current_ratioScore
    },
    debt_to_equityScore: {
      what: 'How leveraged the company is (e.g. Risk)',
      goals: '.5 or less is ideal',
      debt_to_equity: debt_to_equity10,
      debt_to_equityScores,
      total: debt_to_equityScore
    },
    score: roicAnalysis.score + current_ratioScore + debt_to_equityScore
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

interface IAnalysis {
  description: string;
  reference: string[];
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
    if (a_roic < 0.1) {
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

function lastNFromArray<T>(n: number, values: T[]): T[] {
  return values.slice(-n);
}

app();
