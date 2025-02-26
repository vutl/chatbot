export interface IStockBasicInfo {
  SLCPLH: string;
  Growth: number;
  Id: number;
  CodeStock: string;
  NameStock: string;
  Exchange: string;
  FreeFloatRate: string;
  EVEBITDA: string;
  EnterpriseValue: string;
  BookValuePerShare: string;
  SalesPerShare: string;
  CurrentVolume: string;
  AverageVolumeLast20Session: string;
  PE: string;
  EPS: string;
  PS: string;
  PB: string;
  ROE: string;
  ROA: string;
  ClosePrice: number;
  Capitalization: string;
  StockRatingGeneral: string;
  StockBasicPoint: string;
  StockPriceRating: string;
  GTGD: string;
  DividendRate: string;
  IsShowHot: boolean;
  DateHold: number;
  ProbabilityT: number;
  ProbabilityShortTerm: number;
  ProbabilityRisk: number;
  ModifiedTime: string;
  Industry?: string;
  FieldGroup: {
    Id: number;
    Name: string;
    Description: string;
    Order: number;
    CreatedTime: string;
    CreatedUser: string;
    ModifiedTime: string;
    ModifiedUser: string;
    IsDeleted: boolean;
  };
  IndustryGroup: {
    Id: number;
    Name: string;
    Description: string;
    Order: number;
    CreatedTime: string;
    CreatedUser: string;
    ModifiedTime: string;
    ModifiedUser: string;
    IsDeleted: boolean;
  };
}

export interface IStockChromaFormat {
  code: string;
  companyName: string;
  exchange: string;
  industry: string;
  marketCap: number;
  price: number;
  volume: number;
  pe: number;
  eps: number;
  roe: number;
  roa: number;
  growth: number;
  stockRatingGeneral: number;
  stockBasicPoint: number;
  stockPriceRating: number;
  gtgd: number;
  ProbabilityT: number;
  ProbabilityShortTerm: number;
  ProbabilityRisk: number;
}

export interface IPost {
  Id: number;
  Title: string;
  SubTitle: string;
  Url: string;
  Description: string;
  Content: string;
  ShortContent: string;
  Source: string;
  CoverImage: string;
  PostTypeId: number;
  IsShowHome: boolean;
  AISumaryContent: string;
  Tags: string;
  IsPublished: boolean;
  CreateTime: string;
  Author: string;
  WorkflowId: number;
  Evaluate: number;
  Images: any[];
  PostType: {
    Id: number;
    Name: string;
    Description: string;
    SortOrder: number;
    IsShowOnHome: boolean;
    ParentId: number;
    IsDelete: boolean;
    Status: number;
    TotalOfPosts: number;
  };
}

export interface IPostResponse {
  Items: IPost[];
  TotalRecord: number;
  Status: boolean;
  Message: string;
}

export interface ISuggestStock {
  Score: number;
  Signal: string;
  PercentChangePriceCurrent: number;
  SignalPrice: string;
  BuyDate: string;
  SellDate: string;
  StockId: number;
  NameStock: string;
  CodeStock: string;
  Id: number;
}

export interface ISuggestStockResponse {
  Items: ISuggestStock[];
  TotalRecord: number;
  Status: boolean;
  Message: string;
}

export interface IBuySellSignal {
  CodeStock: string;
  Signal: string;
  TypeSignal: string;
  StockName: string;
  Density: number;
  Id: number;
  Price: number;
  LN: string;
  BuyDate: string;
  SellDate: string;
}

export interface IBuySellSignalResponse {
  Items: IBuySellSignal[];
  TotalRecord: number;
  Status: boolean;
  Message: string;
}

export interface ICTCKView {
  Id: number;
  Date: string;
  Signal: string;
  SignalPrice: string;
  City: string;
  StockId: number;
  StockName: string;
}

export interface ICTCKViewResponse {
  Items: ICTCKView[];
  TotalRecord: number;
  Status: boolean;
  Avg: number;
  Hold: number;
  Buy: number;
  Sell: number;
}

export interface ITradingStrategy {
  Id: number;
  PercentDisbursement1: string;
  PercentDisbursement2: string;
  TargetNear: string;
  TargetFar: string;
  StopShortening: string;
  TypOfStock: number;
  TypeOfSignal: number;
  ModifiedTime: string;
}

export interface ITradingStrategyResponse {
  Items: ITradingStrategy[];
  TotalRecord: number;
  Status: boolean;
  Message: string;
}

export interface IMarketNewsAIUpdate {
  Id: number;
  AISumaryContent: string;
  Tags: string;
}
