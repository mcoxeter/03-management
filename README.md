# 03-management

The program will score the management team for a business.

<p>The analysis examins the following areas:</p>

**ROIC**

> How well the company is using it's money to generate further returns. A measure of how good the management team is.<br>

**Ratios - Assest and Liabilities**

> Is there a good ratio between the assests and liabilites? This is also a way to evaluate the risk of the company.<br>

**Debt to equity**

> Is there a good ratio between the debt and the equity in the company? An indication of how well the managment team handles debt in the company. High debt being a bankruptcy risk.

## Setup

you need to create a config.json file. This will configure the program.
There is one parameter you need to add.

1. path - This is a folder path to where your output files will be stored on your harddisk.

This is an example of a config.json file:

```json
{
  "path": "C:/Business analysis/Evaluation"
}
```

**Usage**

> Before you run this program, you will need to have run the `01-data` program first on the stock.

In this example the program will score the fundamental data on Facebook

`npm start -- FB`

## Output

The output of this program is scoring data in json form. It will be outputted into a sub folder of your path in the config file.

### Output folder structure

_path_/_stock-name_/03-management/_date_.json

e.g.
C:/Business analysis/Evaluation/FB/02-management/2021.12.18.json

### Example output

```
{
  "type": "03-management",
  "symbol": "FB",
  "references": [],
  "date": "2021.12.20",
  "question1": "Does the CEO have high levels of stock ownership",
  "roicAnalysis": {
    "description": "How well the management invests the surplus cash. roic 10% minimum, roic 15% Ideal, roic 20% Amazing.",
    "greenFlags": [],
    "redFlags": ["This company has 2 roic values under 10%."],
    "periods": [2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020],
    "reference": [],
    "roic": [
      0.2555, 0.0055, 0.1018, 0.1132, 0.0913, 0.197, 0.2386, 0.2781, 0.1891,
      0.2343
    ],
    "roicAverage": 0.17043999999999998,
    "roicAverageScore": 1,
    "roicScore": 6,
    "score": 7
  },
  "ratiosAnalysis": {
    "description": "How is the debt in the companies handled. Current Ratio is the current assets with its total liabilities. > 100% is a must, > 200% is ideal",
    "greenFlags": [
      "Assests are consistanty over 200% liabilities for the last ten years. Debt is managed wonderfully."
    ],
    "redFlags": [],
    "reference": [],
    "periods": [2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020],
    "current_ratios": [
      5.1212, 10.71, 11.8818, 9.403, 11.2477, 11.9655, 12.9156, 7.1939, 4.3994,
      5.051
    ],
    "current_ratiosAverage": 8.98891,
    "current_ratiosAverageScore": 2,
    "current_ratiosScore": 20,
    "score": 22
  },
  "debtToEquityAnalysis": {
    "description": "How leveraged the company is (e.g. Risk). Debt to equity of .5 or less is ideal",
    "greenFlags": [
      "Debt has been consistantly mananged wonderfully over the last ten years."
    ],
    "redFlags": [],
    "reference": [],
    "periods": [2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020],
    "debt_to_equity": [
      0.0812, 0.1693, 0.0153, 0.0032, 0.0069, 0, 0, 0.0059, 0.0969, 0.075
    ],
    "debt_to_equityAverage": 0.04537,
    "debt_to_equityAverageScore": 1,
    "debt_to_equityScore": 10,
    "score": 11
  },
  "score": 40
}
```
