'use strict';

const fs = require('fs');
const args = process.argv.slice(2);
const command = args[0];
const filename1 = args[1];
const filename2 = args[2];
const multiFile = args.length > 2;
const file1 = JSON.parse(fs.readFileSync(filename1, 'utf8'));
const file2 = multiFile ? JSON.parse(fs.readFileSync(filename2, 'utf8')) : null;
const processed = {};
const diffs = [];
const only1 = [];
const only2 = [];
const all = [];

const MAIN = {
  '1': 'Bank 1 P1',
  '2': 'Bank 1 P2',
  '3': 'Bank 1 P3',
  '4': 'Bank 1 P4',
  '9': 'Bank 1 P5',
  '5': 'Bank 1 P6',
  '6': 'Bank 1 P7',
  '7': 'Bank 1 P8',
  '8': 'Bank 1 P9',
  '10': 'Bank 1 P10',
  '33': 'Bank 2 P1',
  '34': 'Bank 2 P2',
  '35': 'Bank 2 P3',
  '36': 'Bank 2 P4',
  '41': 'Bank 2 P5',
  '37': 'Bank 2 P6',
  '38': 'Bank 2 P7',
  '39': 'Bank 2 P8',
  '40': 'Bank 2 P9',
  '42': 'Bank 2 P10',
  '11': 'Bank 1 F1',
  '12': 'Bank 1 F2',
  '13': 'Bank 1 F3',
  '14': 'Bank 1 F4',
  '75': 'Bank 1 F5',
  '76': 'Bank 1 F6',
  '77': 'Bank 1 F7',
  '78': 'Bank 1 F8',
  '79': 'Bank 1 F9',
  '43': 'Bank 2 F1',
  '44': 'Bank 2 F2',
  '45': 'Bank 2 F3',
  '46': 'Bank 2 F4',
  '107': 'Bank 2 F5',
  '108': 'Bank 2 F6',
  '109': 'Bank 2 F7',
  '110': 'Bank 2 F8',
  '111': 'Bank 2 F9',
  '80': 'Sustain pedal',
  '18': 'Snap 1',
  '19': 'Snap 2',
  '20': 'Snap 3',
  '21': 'Snap 4',
  '22': 'Snap 5',
  '23': 'Snap 6',
  '24': 'Snap 7',
  '25': 'Snap 8',
  '26': 'Snap 9',
  '27': 'Snap 10',
  '30': 'Sound',
  '31': 'Multi',
  '49': 'Category Search',
  '50': 'Category Select',
  '51': 'Preset Search',
  '52': 'Preset Select',
  '29': 'Bank 1',
  '28': 'Bank 2',
  '48': 'Volume',
  '64': 'Modulation',
  '81': 'Expression pedal',
  '83': 'Aux pedal',
  '82': 'Breath control',
  '93': 'Loop',
  '91': 'Rewind',
  '92': 'Fast forward',
  '89': 'Stop',
  '88': 'Play',
  '90': 'Record',
  '112': 'Pad 1',
  '113': 'Pad 2',
  '114': 'Pad 3',
  '115': 'Pad 4',
  '116': 'Pad 5',
  '117': 'Pad 6',
  '118': 'Pad 7',
  '119': 'Pad 8',
  '120': 'Pad 9',
  '121': 'Pad 10',
  '122': 'Pad 11',
  '123': 'Pad 12',
  '124': 'Pad 13',
  '125': 'Pad 14',
  '126': 'Pad 15',
  '127': 'Pad 16',
};

const GENERAL = {
  '1': 'Mode',
  '2': 'Channel',
  '3': 'CC#',
  '4': 'Min',
  '5': 'Max',
  '6': 'Option',
};

const SNAP = Object.assign({}, GENERAL, {
  '4': 'Short press',
  '5': 'Long press',
});

const PAD = Object.assign({}, GENERAL, {
  '3': 'Note',
});

function getSub(val) {
  if (val.indexOf('Snap') > -1) {
    return SNAP;
  }
  if (/\s(F|P)\d/.test(val)) {
    return GENERAL;
  }
  if (/Pad\s\d/.test(val)) {
    return PAD;
  }
  return GENERAL;
}

function create(obj, key) {
  if (!obj[key]) {
    obj[key] = {};
  }
}

function setValues(parent, key, file1, file2) {
  parent.value1 = file1[key];
  if (multiFile) {
    parent.value2 = file2[key];
  }
  if (all.indexOf(key) === -1) {
    all.push(key);
  }
  if (file1[key] === undefined && only2.indexOf(key) === -1) {
    only2.push(key);
  } else if (multiFile && file2[key] === undefined && only1.indexOf(key) === -1) {
    only1.push(key);
  } else if (multiFile && file1[key] !== file2[key] && diffs.indexOf(key) === -1) {
    diffs.push(key);
  }
}

function processKey(key) {
  let parts = key.split('_');
  create(processed, parts[0]);
  let parent = processed[parts[0]];
  if (parts.length > 1) {
    create(parent, 'children');
    create(parent.children, parts[1]);
    parent = parent.children[parts[1]];
    if (parts.length > 2) {
      create(parent, 'children');
      create(parent.children, parts[2]);
      parent = parent.children[parts[2]];
      setValues(parent, key, file1, file2);
    } else {
      setValues(parent, key, file1, file2);
    }
  } else {
    setValues(parent, key, file1, file2);
  }
}

Object.keys(file1).forEach(processKey);
if (multiFile) {
  Object.keys(file2).forEach(processKey);
}

function isNumber(str) {
  return !isNaN(parseInt(str));
}

function doSort(arr) {
  arr.sort(function(a, b){
    if (a === 'device') return -1;
    if (b === 'device') return 1;
    let parts1 = a.split('_');
    let parts2 = b.split('_');
    if (parts1[0] === 'global') {
      parts1[0] = '0';
    }
    if (parts2[0] === 'global') {
      parts2[0] = '0';
    }
    const minLen = Math.min(parts1.length, parts2.length);
    for (let i = 0; i < minLen; ++i) {
      const num1 = parseInt(parts1[i]);
      const num2 = parseInt(parts2[i]);
      if (!isNaN(num1) && !isNaN(num2)) {
        if (num1 > num2) return 1;
        if (num1 < num2) return -1;
        if ((minLen - 1) === i) return 0;
      }
    }

    return a - b;
  });
}

function showResults(title, arr, data) {
  const stars = '*'.repeat(title.length + 2);
  console.log('\n' + stars + '\n ' + title + ' \n' + stars);
  for (let i = 0; i < arr.length; ++i) {
    let parts = arr[i].split('_');
    let val = data[parts[0]];
    if (parts.length === 2) {
      val = data[parts[0]].children[parts[1]];
    } else if (parts.length === 3) {
      val = data[parts[0]].children[parts[1]].children[parts[2]];
    }
    if (val.value1 === undefined) {
      val = val.value2;
    } else if (val.value2 === undefined) {
      val = val.value1;
    } else {
      val = val.value1 + '\t' + val.value2;
    }
    let detail = '';
    if (MAIN[parts[0]]) {
      let detail2 = '';
      if (parts.length > 1) {
        const sub = getSub(MAIN[parts[0]]);
        detail2 = sub && sub[parts[1]] ? (', ' + sub[parts[1]]) : '';
      }
      detail = ' (' + MAIN[parts[0]] + detail2 + ')';
    }
    console.log((i + 1) + '\t' + arr[i] + detail + '\t' + val);
  }
  console.log('\n');
}

if (command === 'diff') {
  doSort(only1);
  doSort(only2);
  doSort(diffs);
  showResults('Only in ' + filename1, only1, processed);
  showResults('Only in ' + filename2, only2, processed);
  showResults('Different (' + filename1 + ' vs ' + filename2 + ')', diffs, processed);
} else if (command === 'dump') {
  doSort(all);
  showResults('Dump of ' + filename1, all, processed);
}
