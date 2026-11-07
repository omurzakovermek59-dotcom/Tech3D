const PHONE_COUNTRY_LENGTHS = {
  '1': [10, 10],
  '7': [10, 10],
  '20': [10, 10],
  '27': [9, 9],
  '30': [10, 10],
  '31': [9, 9],
  '32': [9, 9],
  '33': [9, 9],
  '34': [9, 9],
  '36': [9, 9],
  '39': [9, 11],
  '40': [9, 9],
  '41': [9, 9],
  '43': [10, 10],
  '44': [10, 10],
  '45': [8, 8],
  '46': [9, 9],
  '47': [8, 8],
  '48': [9, 9],
  '49': [7, 12],
  '51': [9, 9],
  '52': [10, 10],
  '53': [8, 8],
  '54': [10, 10],
  '55': [10, 11],
  '56': [9, 9],
  '57': [10, 10],
  '58': [10, 10],
  '60': [9, 10],
  '61': [9, 9],
  '62': [9, 12],
  '63': [10, 10],
  '64': [8, 10],
  '65': [8, 8],
  '66': [9, 9],
  '81': [10, 10],
  '82': [9, 10],
  '84': [9, 10],
  '86': [11, 11],
  '90': [10, 10],
  '91': [10, 10],
  '92': [10, 10],
  '93': [9, 9],
  '94': [9, 9],
  '95': [9, 10],
  '98': [10, 10],
  '211': [9, 9],
  '212': [9, 9],
  '213': [9, 9],
  '216': [8, 8],
  '218': [9, 9],
  '351': [9, 9],
  '352': [9, 9],
  '353': [9, 9],
  '354': [7, 7],
  '355': [9, 9],
  '356': [8, 8],
  '357': [8, 8],
  '358': [9, 10],
  '359': [9, 9],
  '370': [8, 8],
  '371': [8, 8],
  '372': [7, 8],
  '373': [8, 8],
  '374': [8, 8],
  '375': [9, 9],
  '376': [6, 9],
  '377': [8, 9],
  '380': [9, 9],
  '381': [9, 9],
  '382': [8, 8],
  '385': [8, 9],
  '386': [8, 8],
  '387': [8, 8],
  '389': [8, 8],
  '420': [9, 9],
  '421': [9, 9],
  '423': [7, 7],
  '852': [8, 8],
  '853': [8, 8],
  '855': [8, 9],
  '856': [8, 10],
  '880': [10, 10],
  '886': [9, 9],
  '960': [7, 7],
  '961': [8, 8],
  '962': [9, 9],
  '963': [9, 9],
  '964': [10, 10],
  '965': [8, 8],
  '966': [9, 9],
  '967': [9, 9],
  '968': [8, 8],
  '971': [9, 9],
  '972': [9, 9],
  '973': [8, 8],
  '974': [8, 8],
  '975': [8, 8],
  '976': [8, 8],
  '977': [10, 10],
  '992': [9, 9],
  '993': [8, 8],
  '994': [9, 9],
  '995': [9, 9],
  '996': [9, 9],
  '998': [9, 9]
};

const COUNTRY_CODES = Object.keys(PHONE_COUNTRY_LENGTHS).sort((left, right) => right.length - left.length);

function getPhoneParts(value) {
  const input = String(value || '').trim();
  if (!input || !/^\+?[\d\s().-]+$/.test(input)) return null;

  const digits = input.replace(/\D/g, '');
  if (!/^[1-9]\d{8,14}$/.test(digits)) return null;

  const countryCode = COUNTRY_CODES.find(code => digits.startsWith(code));
  if (!countryCode) return null;
  const nationalNumber = digits.slice(countryCode.length);
  const [minimum, maximum] = PHONE_COUNTRY_LENGTHS[countryCode];
  if (nationalNumber.length < minimum || nationalNumber.length > maximum) return null;

  return { countryCode, nationalNumber, internationalNumber: `+${digits}` };
}

export function normalizePhoneNumber(value) {
  return getPhoneParts(value)?.internationalNumber || '';
}

export function isValidPhoneNumber(value) {
  return Boolean(getPhoneParts(value));
}

export function formatPhoneNumber(value) {
  const parts = getPhoneParts(value);
  if (!parts) return '';

  const { countryCode, nationalNumber } = parts;
  if (countryCode === '996' || countryCode === '998') {
    return `+${countryCode} (${nationalNumber.slice(0, 3)}) ${nationalNumber.slice(3, 5)}-${nationalNumber.slice(5, 7)}-${nationalNumber.slice(7)}`;
  }
  if (countryCode === '7') {
    return `+7 (${nationalNumber.slice(0, 3)}) ${nationalNumber.slice(3, 6)}-${nationalNumber.slice(6, 8)}-${nationalNumber.slice(8)}`;
  }
  if (countryCode === '1') {
    return `+1 (${nationalNumber.slice(0, 3)}) ${nationalNumber.slice(3, 6)}-${nationalNumber.slice(6)}`;
  }
  return `+${countryCode} ${nationalNumber.replace(/(\d{3})(?=\d)/g, '$1 ')}`;
}

export function whatsappUrl(value) {
  const phone = normalizePhoneNumber(value);
  return phone ? `https://wa.me/${phone.slice(1)}` : '';
}
