export const ZENAI_CONSTANTS = {
  DEFAULT_API_URL: 'https://zenapi.tambaogroup.com/api',
  FOLDER_DATA_TO_TRAIN: 'src/data',
  FOLDER_DATA_TRAINED: 'src/data_trained',
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/clients/Auth/login',
    },
    STOCK_BASIC_INFO: '/zenai/Stocks',
    MARKET_NEWS: '/zenai/Posts/search',
    UPDATE_MARKET_NEWS_AI: '/zenai/Posts/update',
    STOCK_KNOWLEDGE: '/zenai/Posts/search',
    PRODUCTS_SERVICES: '/zenai/Posts/search',
    STOCK_ANALYSIS: '/zenai/Posts/search',
    SUGGEST_STOCKS: '/zenai/SuggestStocks/search',
    BUY_SELL_SIGNALS: '/zenai/BuySellSignals/search',
    CTCK_VIEWS: '/zenai/CTCKInStocks/search',
    TRADING_STRATEGIES: '/zenai/TradingStrategies/search',
  },
  POST_TYPES: {
    MARKET_NEWS: 1,
    STOCK_ANALYSIS: 2,
    STOCK_KNOWLEDGE: 5,
    PRODUCTS_SERVICES: 6,
  },
  ERROR_MESSAGES: {
    AUTH: {
      MISSING_CREDENTIALS: 'ZENAI_USERNAME và ZENAI_PASSWORD là bắt buộc',
      LOGIN_FAILED: 'Đăng nhập thất bại',
    },
    FETCH_STOCK_INFO_ERROR: (stockCode: string) =>
      `Không thể lấy thông tin cổ phiếu ${stockCode}`,
  },
  CHROMA_COLLECTION_NAMES: {
    STOCK_INFO: 'stock_information',
    MARKET_NEWS: 'market_news',
    STOCK_KNOWLEDGE: 'stock_knowledge',
  },
  EMBEDDING: {
    MODEL_NAME: 'text-embedding-3-small',
    VECTOR_DIMENSIONS: 1536,
  },
  STOCK_CODES: [
    'AAA',
    'ACB',
    'ACG',
    'ACL',
    'ADS',
    'AGG',
    'AGR',
    'AMV',
    'ANV',
    'ASM',
    'AST',
    'APS',
    'BAB',
    'BAF',
    'BCC',
    'BCG',
    'BCM',
    'BFC',
    'BHN',
    'BIC',
    'BID',
    'BMI',
    'BMP',
    'BSI',
    'BSR',
    'BTP',
    'BVH',
    'BVS',
    'BVB',
    'BWE',
    'CAP',
    'CAV',
    'CCL',
    'CEO',
    'CHP',
    'CII',
    'CKG',
    'CMG',
    'CMX',
    'CNG',
    'CRE',
    'CSC',
    'CSM',
    'CSV',
    'CTD',
    'CTF',
    'CTG',
    'CTI',
    'CTR',
    'CTS',
    'CVT',
    'DBC',
    'DBD',
    'DCL',
    'DDV',
    'DCM',
    'DGC',
    'DGW',
    'DHA',
    'DHC',
    'DHG',
    'DHT',
    'DIG',
    'DP3',
    'DPG',
    'DPM',
    'DPR',
    'DRC',
    'DRI',
    'DRH',
    'DTD',
    'DVM',
    'DVP',
    'DXG',
    'DXP',
    'DXS',
    'EIB',
    'ELC',
    'EVF',
    'EVS',
    'FCN',
    'FMC',
    'FPT',
    'FRT',
    'FTS',
    'GAS',
    'GDT',
    'GEG',
    'GEX',
    'GIL',
    'GMD',
    'GSP',
    'GVR',
    'HAH',
    'HAX',
    'HBC',
    'HCD',
    'HCM',
    'HDB',
    'HDC',
    'HDG',
    'HHP',
    'HHS',
    'HHV',
    'HOM',
    'HPG',
    'HPX',
    'HQC',
    'HSG',
    'HT1',
    'HTN',
    'HUB',
    'HUT',
    'ICT',
    'IDC',
    'IDI',
    'IDJ',
    'IDV',
    'IJC',
    'IMP',
    'IPA',
    'ITC',
    'ITD',
    'IVS',
    'KBC',
    'KDC',
    'KDH',
    'KHG',
    'KSB',
    'LAS',
    'LCG',
    'LHC',
    'LIX',
    'LPB',
    'LSS',
    'MBB',
    'MBS',
    'MIG',
    'MSB',
    'MSH',
    'MSN',
    'MWG',
    'NAF',
    'NBB',
    'NBC',
    'NCT',
    'NHA',
    'NHH',
    'NKG',
    'NLG',
    'NT2',
    'NTL',
    'NTP',
    'NVB',
    'NVL',
    'OCB',
    'ORS',
    'OIL',
    'PAN',
    'PC1',
    'PDR',
    'PET',
    'PGC',
    'PHR',
    'PLC',
    'PLX',
    'PNJ',
    'POW',
    'PPC',
    'PSD',
    'PSH',
    'PVD',
    'PVI',
    'PVP',
    'POM',
    'PVT',
    'PVX',
    'QCG',
    'RAL',
    'REE',
    'SAB',
    'SBT',
    'SCR',
    'SCS',
    'SHB',
    'SHP',
    'SHS',
    'SIP',
    'SJD',
    'SJS',
    'SKG',
    'SLS',
    'SMB',
    'SSB',
    'SSI',
    'STB',
    'STG',
    'STK',
    'SZC',
    'TCD',
    'TCH',
    'TCM',
    'TDC',
    'TDN',
    'TDP',
    'THG',
    'TIG',
    'TIP',
    'TLG',
    'TLH',
    'TMP',
    'TNG',
    'TNH',
    'TPB',
    'TCB',
    'TRA',
    'TTA',
    'TV2',
    'TVD',
    'TVS',
    'VCB',
    'VCG',
    'VCI',
    'VCS',
    'VDS',
    'VFS',
    'VGC',
    'VGS',
    'VGI',
    'VGT',
    'VHC',
    'VHM',
    'VIB',
    'VIC',
    'VIP',
    'VIX',
    'VJC',
    'VND',
    'VNM',
    'VOS',
    'VPB',
    'VPD',
    'VPG',
    'VPI',
    'VRE',
    'VSC',
    'VSH',
    'VTO',
    'YEG',
  ],
};
